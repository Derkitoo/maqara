import React from 'react';
import ReactDOM from 'react-dom/client';
import ArabicLearningApp from '../maqra_apprentissage_de_l_arabe.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// registerType: 'autoUpdate' génère un service worker qui attend un message
// SKIP_WAITING pour activer une nouvelle version (voir dist/sw.js). Sans
// onNeedRefresh, ce message n'était jamais envoyé : le nouveau SW restait
// bloqué en 'waiting' indéfiniment et l'app continuait de servir l'ancien
// bundle caché après chaque déploiement, même pour un utilisateur qui
// rouvrait l'app plus tard. onNeedRefresh + updateSW(true) applique la
// mise à jour et recharge automatiquement dès qu'une nouvelle version est
// détectée.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArabicLearningApp />
  </React.StrictMode>
);
