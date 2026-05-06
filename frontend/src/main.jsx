import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';
import './theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <UserProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--clr-bg-3, #111D2C)',
              color: 'var(--clr-text, #E8EDF5)',
              border: '1px solid var(--clr-border, rgba(0,191,165,0.12))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);