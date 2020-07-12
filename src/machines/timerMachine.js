import { Machine, assign } from 'xstate';
import { add, getTime } from 'date-fns';

const runTimer = () => (callback) => {
  const tick = setInterval(() => callback('TICK'), 1000);

  return () => clearInterval(tick);
};

const subTime = assign({
  value: (ctx) => ctx.value + 1000,
});

const updateTimer = assign({
  value: (ctx, { type }) =>
    getTime(add(ctx.value, { [ctx.editMode]: type === 'TOGGLE' ? 1 : -1 })),
});

const updateTimerTransitions = {
  TOGGLE: {
    actions: ['updateTimer'],
    internal: true,
  },
  ADJUST: {
    actions: ['updateTimer'],
    internal: true,
  },
};

export const timerMachine = Machine(
  {
    id: 'timer',
    initial: 'pause',
    context: {
      value: '',
      editMode: 'hours',
    },
    states: {
      pause: {
        on: {
          TOGGLE: 'start',
          'SET.HOLD': 'edit',
          'ADJUST.HOLD': {
            target: 'pause',
            actions: ['resetTimer'],
          },
        },
      },
      start: {
        invoke: {
          id: 'run-timer',
          src: 'runTimer',
        },
        on: {
          TOGGLE: 'pause',
          TICK: [
            {
              target: 'pause',
              cond: 'timerOut',
            },
            {
              actions: 'subTime',
            },
          ],
        },
      },
      edit: {
        on: {
          SET: 'pause',
        },
        initial: 'hours',
        states: {
          hours: {
            entry: assign({
              editMode: 'hours',
            }),
            on: {
              ...updateTimerTransitions,
              MODE: 'minutes',
            },
          },
          minutes: {
            entry: assign({
              editMode: 'minutes',
            }),
            on: {
              ...updateTimerTransitions,
              MODE: 'seconds',
            },
          },
          seconds: {
            entry: assign({
              editMode: 'seconds',
            }),
            on: {
              ...updateTimerTransitions,
              MODE: 'hours',
            },
          },
        },
      },
    },
  },
  {
    services: {
      runTimer,
    },
    actions: {
      subTime,
      updateTimer,
    },
  },
);
