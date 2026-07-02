import { StrictMode } from 'react';
import { SquircleNoScript } from '@squircle-js/react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SquircleNoScript />
    <App />
  </StrictMode>,
);
