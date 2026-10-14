import { initializeTheme } from '@wasl/shared';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@wasl/shared/styles.css';
import './styles.css';
initializeTheme();
createRoot(document.getElementById('root')!).render(<App />);
