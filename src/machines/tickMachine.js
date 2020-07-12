import { Machine, sendParent } from 'xstate';

export const tickMachine = Machine({
  id: 'tick-',
  initial: 'start',
  context: {
    value: 1000,
  },
  states: {
    start: {
      invoke: {
        id: 'tick-interval',
        src: () => (callback) => {
          console.log('tick invoked');
          const id = setInterval(() => callback('TICK'), 1000);
          return () => clearInterval(id);
        },
      },
      on: {
        TOGGLE: 'paused',
        TICK: {
          actions: sendParent(({ value }) => {
            return {
              type: 'TICK',
              value,
            };
          }),
        },
      },
    },
    paused: {
      on: { TOGGLE: 'start' },
    },
  },
});
