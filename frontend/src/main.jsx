import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n/i18n';

import { Map } from 'lucide-react';

// Global fallback to prevent ReferenceError in older cached bundles
if (typeof window !== 'undefined') {
  window.MapPin = Map;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
