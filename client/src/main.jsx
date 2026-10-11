import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// -----------------------------------------------------------------------------
// PWA: SERVICE WORKER REGISTRATION
// Arm autonomous offline timetable caching and application shell persistence.
// -----------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA_SW] Service Worker operational. Scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA_SW] Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
