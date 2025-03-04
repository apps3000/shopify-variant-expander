import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';
import App from './App';

// Initialize the root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider i18n={enTranslations} features={{ newDesignLanguage: true }}>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, uncomment the line below
// Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
