import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoutes } from './app/AppRoutes';
import './style.css';

const container = document.getElementById('root');
if (!container)
  throw new Error('Elemento principal da aplicação não encontrado.');

createRoot(container).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
);
