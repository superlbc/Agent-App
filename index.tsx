import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthGuard } from './auth/AuthGuard';
import { DepartmentProvider } from './contexts/DepartmentContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './utils/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <DepartmentProvider>
        <AuthGuard>
          <App />
        </AuthGuard>
      </DepartmentProvider>
    </I18nextProvider>
  </React.StrictMode>
);