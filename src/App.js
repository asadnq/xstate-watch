import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { useMachine } from '@xstate/react';
import './App.css';
import { watchMachine } from 'machines/watchMachine';
import { TimeDisplay } from './components/TimeDisplay';
import { theme } from 'theme';
import { Flex, Box } from 'components/common';

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
  }, [delay]);
};

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
};

const getHMS = (time) => {
  const config = { zero: true };

  const hours = formatTimeUnit(Math.floor((time % DAY) / HOUR), config);
  const minutes = formatTimeUnit(Math.floor((time % HOUR) / MINUTE), config);
  const seconds = formatTimeUnit(Math.floor((time % MINUTE) / SECOND), config);

  return [hours, minutes, seconds];
};

const getHMS2 = (time) => {
  const hours = new Date(time).getHours();
  const minutes = new Date(time).getMinutes();
  const seconds = new Date(time).getSeconds();

  return [hours, minutes, seconds];
};

const WatchButton = ({ title, onClick, onHold }) => {
  const holdFunc = React.useRef(null);

  const handleMouseDown = () => {
    if (typeof onClick === 'function') {
      holdFunc.current = setTimeout(onClick, 100);
    }

    if (typeof onHold === 'function') {
      holdFunc.current = setTimeout(onHold, 3000);
    }
  };

  const handleMouseUp = () => {
    if (typeof onHold === 'function') {
      clearTimeout(holdFunc.current);
      holdFunc.current = null;
    }
  };

  return (
    <button
      className="watch-button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}>
      {title}
    </button>
  );
};

const Watch = (props) => {
  const [state, send] = useMachine(watchMachine);

  const timeState = state.context.timeCtx;
  const timerState = state.context.timerCtx;
  const chronoState = state.context.chronoCtx;
  const alarmState = state.context.alarmCtx;

  const getTimeDislay = () => {
    const stringState = state.toStrings();

    if (state.matches('timer')) {
      const [hours, minutes, seconds] = getHMS(timerState.duration);
      if (stringState.includes('timer.edit')) {
        const [hours, minutes, seconds] = getHMS(timerState.initialDuration);

        const timerMode = state.value.timer.edit;

        return [
          <Blinking stop={timerMode !== 'hours'}>{hours}</Blinking>,
          <Blinking stop={timerMode !== 'minutes'}>{minutes}</Blinking>,
          <Blinking stop={timerMode !== 'seconds'}>{seconds}</Blinking>,
        ];
      } else if (stringState.includes('timer.timesUp')) {
        return [
          <Blinking stop={true}>{hours}</Blinking>,
          <Blinking stop={true}>{minutes}</Blinking>,
          <Blinking stop={true}>{seconds}</Blinking>,
        ];
      } else {
        return `${hours}:${minutes}:${seconds}`.split(':');
      }
    }

    if (state.matches('chrono')) {
      const [hours, minutes, seconds] = getHMS(chronoState.currentTime);

      return `${hours}:${minutes}:${seconds}`.split(':');
    }

    if (state.matches('alarm')) {
      const [hours, minutes, seconds] = getHMS2(alarmState.currentTime);

      const formattedTime = `${hours}:${minutes}:${seconds}`;

      if (stringState.includes('alarm.active')) {
        return formattedTime
          .split(':')
          .map((unit) => <Blinking>{unit}</Blinking>);
      }

      return formattedTime.split(':');
    }

    const hours = new Date(timeState.currentTime).getHours();
    const minutes = new Date(timeState.currentTime).getMinutes();
    const seconds = new Date(timeState.currentTime).getSeconds();

    return [hours, minutes, seconds];
  };

  const isPaused = [{ timer: 'pause' }, { chrono: 'pause' }].some(
    state.matches,
  );
  const isEditMode = [{ timer: 'edit' }, { chrono: 'edit' }].some(
    state.matches,
  );

  const [hours, minutes, seconds] = getTimeDislay();

  const watchActions = {
    SET: () => send('SET'),
    'SET.HOLD': () => send('SET.HOLD'),
    MODE: () => send('MODE'),
    ADJUST: () => send('ADJUST'),
    'ADJUST.HOLD': () => send('ADJUST.HOLD'),
    TOGGLE: () => send('TOGGLE'),
  };

  return (
    <Flex>
      <div className="left-content">
        <Flex
          flexDirection="column"
          height="100%"
          alignContent="stretch"
          justifyContent="space-around">
          <Box>
            <WatchButton
              title="Light / Set"
              onClick={watchActions.SET}
              onHold={watchActions['SET.HOLD']}
            />
          </Box>
          <Box>
            <WatchButton title="Mode" onClick={watchActions.MODE} />
          </Box>
        </Flex>
      </div>
      <div className="center-content">
        <div>
          <TimeDisplay hours={hours} minutes={minutes} seconds={seconds} />
        </div>
        {isPaused && (
          <Blinking>
            <span>Paused</span>
          </Blinking>
        )}
        {isEditMode && <span>Edit</span>}
        <div>
          <span>Mode: </span>
          <span>
            {state.matches('time') && 'TIME'}
            {state.matches('chrono') && 'CHRONO'}
            {state.matches('timer') && 'TIMER'}
            {state.matches('alarm') && 'ALARM'}
          </span>
        </div>
      </div>
      <div className="right-content">
        <Flex
          flexDirection="column"
          height="100%"
          alignContent="stretch"
          justifyContent="space-around">
          <Box>
            <WatchButton title="Pause / Start" onClick={watchActions.TOGGLE} />
          </Box>
          <Box>
            <WatchButton
              title="Adj"
              onClick={watchActions.ADJUST}
              onHold={watchActions['ADJUST.HOLD']}
            />
          </Box>
        </Flex>
      </div>
    </Flex>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Watch />
      </div>
    </ThemeProvider>
  );
}

export default App;
