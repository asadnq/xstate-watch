import React from 'react';
import { useMachine } from '@xstate/react';
import format from 'date-fns/format';

import { watchMachine } from 'machines/watchMachine';
import { TimeDisplay } from 'components/TimeDisplay';
import WatchButton from 'components/WatchButton';
import { Flex, Box } from 'components/common';
import Blinking from 'components/Blinking';

const FORMAT_TYPE = {
  HMS: 'HH:mm:ss',
};

const getHMS = time => {
  const formattedTime = format(new Date(time), FORMAT_TYPE.HMS);

  return formattedTime.split(':');
};

export const Watch = () => {
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
          <Blinking key="hours" stop={timerMode !== 'hours'}>
            {hours}
          </Blinking>,
          <Blinking key="minutes" stop={timerMode !== 'minutes'}>
            {minutes}
          </Blinking>,
          <Blinking key="seconds" stop={timerMode !== 'seconds'}>
            {seconds}
          </Blinking>,
        ];
      } else if (stringState.includes('timer.timesUp')) {
        return [
          <Blinking key="hours" stop={true}>
            {hours}
          </Blinking>,
          <Blinking key="minutes" stop={true}>
            {minutes}
          </Blinking>,
          <Blinking key="seconds" stop={true}>
            {seconds}
          </Blinking>,
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
      const [hours, minutes, seconds] = getHMS(alarmState.currentTime);

      const formattedTime = `${hours}:${minutes}:${seconds}`;

      if (stringState.includes('alarm.active')) {
        return formattedTime
          .split(':')
          .map((unit, idx) => <Blinking key={idx}>{unit}</Blinking>);
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

export default Watch;
