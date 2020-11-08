import React from 'react';
import PropTypes from 'prop-types';

export const WatchButton = ({ title, onClick, onHold }) => {
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

export default WatchButton;

WatchButton.propTypes = {
  title: PropTypes.string,
  onClick: PropTypes.func,
  onHold: PropTypes.func,
};
