import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useInterval } from 'hooks';

export const Blinking = props => {
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

export default Blinking;

Blinking.propTypes = {
  children: PropTypes.element.isRequired,
  stop: PropTypes.bool,
};
