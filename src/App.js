import React, { useEffect, useRef, useState } from 'react';
import format from 'date-fns/format';
import { useMachine } from '@xstate/react';
import logo from './logo.svg';
import './App.css';
import { watchMachine } from 'machines/watchMachine';

const watchButtons = [
  {
    label: 'SET',
    id: 'SET',
  },

  {
    label: 'MODE',
    id: 'MODE',
  },
  {
    label: 'TOGGLE',
    id: 'TOGGLE',
  },
  {
    label: 'ADJUST',
    id: 'ADJUST',
  },
  {
    label: 'ADJUST.HOLD',
    id: 'ADJUST.HOLD',
  },
  {
    label: 'SET.HOLD',
    id: 'SET.HOLD',
  },
];

const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
  function tick() {
    savedCallback.current();
  }

    if (delay !== null) {
      let id = setInterval(tick, delay);

      return () => clearInterval(id);
    }
  }, [delay])
}

const Blinking = (props) => {
  const { stop } = props;
  const [opacity, setOpacity] = useState(1);

  const blink = () => {
    const newOpacity = opacity < 1 ? 1 : 0;

    setOpacity(newOpacity);
  };

  useInterval(blink, stop ? null : 500);

  // make sure content visible when stop blinking 
  useEffect(() => {
    if (stop) setOpacity(1);
  }, [stop]);

  return <div style={{ opacity }}>{props.children}</div>;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = MINUTE * 60;
const DAY = 24 * HOUR;

const formatTimeUnit = (time, { zero }) => {
  const strTime = String(time);
  if (zero && strTime.length < 2) {
    return `0${strTime}`;
  }

  return strTime;
} 

const getHMS = (time) => {
  const config = { zero: true };

  const hours = formatTimeUnit(Math.floor((time % DAY) / HOUR), config);
  const minutes = formatTimeUnit(Math.floor((time % HOUR) / MINUTE), config);
  const seconds = formatTimeUnit(Math.floor((time % MINUTE) / SECOND), config);

  return [hours, minutes, seconds];
}

function App() {
  const [state, send] = useMachine(watchMachine);

  const timeState = state.context.timeCtx;
  const timerState = state.context.timerCtx;
  const chronoState = state.context.chronoCtx;
  const alarmState = state.context.alarmCtx;

  const getTimeDislay = () => {
    const stringState = state.toStrings();

    if (state.matches('time')) {
      return timeState.currentTime;
    }

    if (state.matches('timer')) {
      console.log('state.value', state.value);
      const [hours, minutes, seconds] = getHMS(timerState.duration);
      if (stringState.includes('timer.edit')) {
        const [hours, minutes, seconds] = getHMS(timerState.initialDuration);

        const timerMode = state.value.timer.edit;

        return (
          <div style={{ display: 'flex' }}>
            <Blinking stop={timerMode !== 'hours'}>{hours}</Blinking>
            <div>:</div>
            <Blinking stop={timerMode !== 'minutes'}>{minutes}</Blinking>
            <div>:</div>
            <Blinking stop={timerMode !== 'seconds'}>{seconds}</Blinking>
          </div>
        );
      } else if (stringState.includes('timer.timesUp')) {
        return (
          <div style={{ display: 'flex' }}>
            <Blinking stop={true}>{hours}</Blinking>
            <div>:</div>
            <Blinking stop={true}>{minutes}</Blinking>
            <div>:</div>
            <Blinking stop={true}>{seconds}</Blinking>
            <Blinking>
              <span>TIMES UP</span>
            </Blinking>
          </div>
        )
      }
      else {
        return `${hours}:${minutes}:${seconds}`;
      }
    }

    if (state.matches('chrono')) {
      const [hours, minutes, seconds] = getHMS(chronoState.currentTime);

      return `${hours}:${minutes}:${seconds}`;
    }

    if (state.matches('alarm')) {
      return alarmState.currentTime;
    }

    return timeState;
  };

  const isPaused = [{ timer: 'pause'}, { chrono: 'pause'} ].some(state.matches);
  const isEditMode = [ { timer: 'edit' }, { chrono: 'edit' }].some(state.matches);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>{getTimeDislay()}</div>
        {isPaused && <Blinking><span>Paused</span></Blinking>}
        {isEditMode && <span>Edit</span>}
      </div>
      <div>
        <span>Mode: </span>
        <span>
          {state.matches('time') && 'TIME'}
          {state.matches('chrono') && 'CHRONO'}
          {state.matches('timer') && 'TIMER'}
          {state.matches('alarm') && 'ALARM'}
        </span>
      </div>
      <div className="watch-buttons-container">
        {watchButtons.map((btn) => (
          <button
            className="watch-button"
            key={btn.id}
            onClick={() => send(btn.id)}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
