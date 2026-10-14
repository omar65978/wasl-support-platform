import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@wasl/shared/styles.css';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
