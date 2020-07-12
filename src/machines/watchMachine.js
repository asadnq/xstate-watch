import { Machine, assign, send } from 'xstate';
import { tickMachine } from './tickMachine';
import format from 'date-fns/format';
import add from 'date-fns/add';
import sub from 'date-fns/sub';
import getTime from 'date-fns/getTime';

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

const updateTimerInc = assign(({ timerCtx }) => {
  const newDuration = getTime(
    add(timerCtx.initialDuration, {
      [timerCtx.editMode]: 1,
    }),
  );

  return {
    timerCtx: {
      ...timerCtx,
      initialDuration: newDuration,
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

export const watchMachine = Machine(
  {
    initial: 'timer',
    context: {
      currentTime: 0,
      count: 0,
      timeCtx: {
        currentTime: format(new Date(), 'HH:mm:ss'),
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
        currentTime: format(new Date(), 'HH:mm:ss'),
      },
    },
    states: {
      time: {
        invoke: {
          id: 'time-tick',
          src: () => (callback) => {
            const tick = setInterval(() => callback('TICK'), 1000);

            return () => clearInterval(tick);
          },
        },
        on: {
          MODE: 'chrono',
          TICK: {
            actions: assign({
              timeCtx: () => ({
                currentTime: format(new Date(), 'HH:mm:ss'),
              }),
            }),
          },
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
        initial: 'initial',
        states: {
          initial: {
            on: {
              'SET.HOLD': 'edit',
            },
          },
          edit: {
            on: {
              SET: 'initial',
            },
            initial: 'hours',
            states: {
              hours: { on: { ...updateAlarmActions, MODE: 'minutes' } },
              minutes: {
                on: { ...updateAlarmActions, MODE: 'seconds' },
              },
              seconds: { on: { ...updateAlarmActions, MODE: 'hours' } },
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
      resetTimer,
      resetChrono: assign({
        chronoCtx: () => ({
          currentTime: 0,
        }),
      }),
    },
    guards: {
      timerTimesUp,
    },
  },
);

