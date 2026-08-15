import React from 'react';
import ReactDOM from 'react-dom/client';
import ArabicLearningApp from '../maqra_apprentissage_de_l_arabe.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArabicLearningApp />
  </React.StrictMode>
);
