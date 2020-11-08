import React from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from 'theme';

import Watch from './Watch';
import './App.css';

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
