import { Machine, assign, send } from 'xstate';
import { tickMachine } from './tickMachine';
import format from 'date-fns/format';
import add from 'date-fns/add';
import sub from 'date-fns/sub';
import getTime from 'date-fns/getTime';
import * as alarmGuards from './config/alarm';

const { isAlarmOn, isAlarmOff } = alarmGuards;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = MINUTE * 60;
const DAY = 24 * HOUR;

const tickTime = assign(({ alarmCtx, timeCtx }) => {
  const a = Math.floor((alarmCtx.currentTime % DAY) / 1000);
  const t = Math.floor((timeCtx.currentTime % DAY) / 1000);
  const alarmActive = a === t;

  return {
    timeCtx: {
      ...timeCtx,
      currentTime: new Date().getTime(),
    },
    alarmCtx: {
      ...alarmCtx,
      active: alarmActive,
    },
  };
});

export const updateAlarmActions = {
  TOGGLE: {
    actions: ['updateAlarmInc'],
  },
  ADJUST: {
    actions: ['updateAlarmDec'],
  },
};

const updateTimerActions = {
  TOGGLE: {
    actions: ['updateTimerInc'],
  },
  ADJUST: {
    actions: ['updateTimerDec'],
  },
};

const timerTimesUp = ({ timerCtx }) => timerCtx.duration < 1;

const resetTimer = assign({
  timerCtx: ({ timerCtx }) => ({
    ...timerCtx,
    duration: timerCtx.initialDuration,
  }),
});

const updateAlarmInc = assign(({ alarmCtx }) => {
  const newDuration = getTime(
    add(alarmCtx.currentTime, {
      [alarmCtx.editMode]: 1,
    }),
  );

  return {
    alarmCtx: {
      ...alarmCtx,
      currentTime: newDuration,
    },
  };
});

const updateAlarmDec = assign(({ alarmCtx }) => {
  const newDuration = getTime(
    sub(alarmCtx.currentTime, {
      [alarmCtx.editMode]: 1,
    }),
  );

  const updateValid = newDuration > -1;

  return {
    alarmCtx: {
      ...alarmCtx,
      currentTime: updateValid ? newDuration : alarmCtx.currentTime,
    },
  };
});

const updateTimerInc = assign(({ timerCtx }) => {
  const newDuration = getTime(
    add(timerCtx.initialDuration, {
      [timerCtx.editMode]: 1,
    }),
  );

  return {
    timerCtx: {
      ...timerCtx,
      currentTime: newDuration,
    },
  };
});

const updateTimerDec = assign(({ timerCtx }) => {
  const newDuration = getTime(
    sub(timerCtx.initialDuration, {
      [timerCtx.editMode]: 1,
    }),
  );
  const updateValid = newDuration > -1;

  return {
    timerCtx: {
      ...timerCtx,
      initialDuration: updateValid ? newDuration : timerCtx.duration,
    },
  };
});

const activateAlarm = assign({
  alarmCtx: ({ alarmCtx }) => ({ ...alarmCtx, active: true }),
});

const turnOffAlarm = assign({
  alarmCtx: ({ alarmCtx }) => ({ ...alarmCtx, active: false }),
});

export const watchMachine = Machine(
  {
    initial: 'time',
    context: {
      currentTime: 0,
      count: 0,
      timeCtx: {
        currentTime: new Date().getTime(),
      },
      chronoCtx: {
        currentTime: 0,
      },
      timerCtx: {
        editMode: 'hours',
        value: 0,
        duration: 0,
        initialDuration: 0,
      },
      alarmCtx: {
        currentTime: new Date().getTime() - 3000,
        active: false,
        editMode: 'hours',
      },
    },
    states: {
      time: {
        entry: assign({
          timeCtx: ({ timeCtx }) => ({
            ...timeCtx,
            currentTime: new Date().getTime(),
          }),
        }),
        invoke: {
          id: 'time-tick',
          src: ({ alarmCtx, timeCtx }) => (callback) => {
            const tickActions = () => {
              //   const timeVal = timeCtx.currentTime % DAY;
              //   const alarmVal = alarmCtx.currentTime % DAY;
              //   // convert to utc time

              //   console.log('alarm ->', new Date(alarmVal));
              //   console.log('time ->', new Date(timeVal));
              //   if (alarmVal === timeVal) {
              //     console.log('executed');
              //     callback('ACTIVATE_ALARM');
              //  }
              //  console.log('beep');
              callback('TICK');
            };

            const tick = setInterval(tickActions, 1000);

            return () => clearInterval(tick);
          },
        },
        on: {
          TICK: [
            {
              target: 'alarm',
              actions: ['activateAlarm'],
              cond: 'isAlarmOn',
            },
            {
              /* actions: assign({
              timeCtx: () => ({
                currentTime: new Date().getTime(),
              }),
            }), */
              actions: ['tickTime'],
            },
          ],
          ACTIVATE_ALARM: { target: 'alarm', actions: ['activateAlarm'] },
          MODE: 'chrono',
        },
        initial: 'dateInvisible',
        states: {
          dateInvisible: {
            on: {
              TOGGLE: 'dateVisible',
            },
          },
          dateVisible: {
            on: {
              TOGGLE: 'dateInvisible',
            },
          },
        },
      },
      chrono: {
        on: {
          MODE: 'timer',
        },
        initial: 'pause',
        states: {
          pause: {
            on: {
              TOGGLE: 'start',
              'ADJUST.HOLD': {
                target: 'pause',
                actions: ['resetChrono'],
              },
            },
          },
          start: {
            invoke: {
              id: 'run-chrono',
              src: () => (callback) => {
                const run = setInterval(() => callback('TICK'), 1000);

                return () => clearInterval(run);
              },
            },
            on: {
              TOGGLE: 'pause',
              TICK: [
                {
                  actions: assign({
                    chronoCtx: ({ chronoCtx }) => ({
                      ...chronoCtx,
                      currentTime: chronoCtx.currentTime + 1000,
                    }),
                  }),
                },
              ],
            },
          },
        },
      },
      timer: {
        initial: 'pause',
        states: {
          start: {
            invoke: {
              id: 'tick-machine',
              src: tickMachine,
              data: {
                value: () => -1000,
              },
            },
            on: {
              TOGGLE: 'pause',
              TICK: [
                {
                  target: 'timesUp',
                  cond: 'timerTimesUp',
                },
                {
                  actions: assign(({ timerCtx }, event) => {
                    return {
                      timerCtx: {
                        ...timerCtx,
                        duration: timerCtx.duration + event.value,
                      },
                    };
                  }),
                },
              ],
            },
          },
          pause: {
            on: {
              TOGGLE: 'start',
              'SET.HOLD': 'edit',
              'ADJUST.HOLD': {
                actions: ['resetTimer'],
              },
            },
          },
          timesUp: {
            after: {
              6000: {
                target: 'pause',
                actions: ['resetTimer'],
              },
            },
            on: {
              TOGGLE: {
                target: 'pause',
                actions: ['resetTimer'],
              },
            },
          },
          edit: {
            initial: 'hours',
            states: {
              hours: {
                entry: assign({
                  timerCtx: ({ timerCtx }) => ({
                    ...timerCtx,
                    editMode: 'hours',
                  }),
                }),
                on: { ...updateTimerActions, MODE: 'minutes' },
              },
              minutes: {
                entry: assign({
                  timerCtx: ({ timerCtx }) => ({
                    ...timerCtx,
                    editMode: 'minutes',
                  }),
                }),
                on: { ...updateTimerActions, MODE: 'seconds' },
              },
              seconds: {
                entry: assign({
                  timerCtx: ({ timerCtx }) => ({
                    ...timerCtx,
                    editMode: 'seconds',
                  }),
                }),
                on: { ...updateTimerActions, MODE: 'hours' },
              },
            },
            exit: assign({
              timerCtx: ({ timerCtx }) => ({
                ...timerCtx,
                duration: timerCtx.initialDuration,
              }),
            }),
            on: {
              SET: 'pause',
            },
          },
        },
        on: {
          MODE: 'alarm',
        },
      },
      alarm: {
        on: {
          MODE: 'time',
        },
        initial: 'off',
        states: {
          off: {
            always: [{ target: 'active', cond: 'isAlarmOn' }],
            on: {
              'SET.HOLD': 'edit',
            },
          },
          active: {
            on: {
              '*': 'off',
            },
            after: [{ delay: 6e4, target: 'off' }],
            exit: ['turnOffAlarm'],
          },
          edit: {
            on: {
              SET: 'off',
            },
            initial: 'hours',
            states: {
              hours: {
                on: {
                  ...updateAlarmActions,
                  MODE: 'minutes',
                },
                entry: assign({
                  alarmCtx: ({ alarmCtx }) => ({
                    ...alarmCtx,
                    editMode: 'hours',
                  }),
                }),
              },
              minutes: {
                on: {
                  ...updateAlarmActions,
                  MODE: 'seconds',
                },
                entry: assign({
                  alarmCtx: ({ alarmCtx }) => ({
                    ...alarmCtx,
                    editMode: 'minutes',
                  }),
                }),
              },
              seconds: {
                on: { ...updateAlarmActions, MODE: 'hours' },
                entry: assign({
                  alarmCtx: ({ alarmCtx }) => ({
                    ...alarmCtx,
                    editMode: 'seconds',
                  }),
                }),
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      tick: assign({
        timeCtx: {
          currentTime: format(new Date(), 'HH:mm:ss'),
        },
      }),
      updateTimerInc,
      updateTimerDec,
      updateAlarmInc,
      updateAlarmDec,
      resetTimer,
      resetChrono: assign({
        chronoCtx: () => ({
          currentTime: 0,
        }),
      }),
      activateAlarm,
      turnOffAlarm,
      tickTime,
    },
    guards: {
      timerTimesUp,
      isAlarmOn,
      isAlarmOff,
    },
  },
);
