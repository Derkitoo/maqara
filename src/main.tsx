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
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    // Le navigateur ne revérifie sw.js que sur certaines navigations (pas en
    // continu tant que l'app/PWA reste ouverte). Sans ça, un utilisateur qui
    // garde l'app en arrière-plan pouvait rester sur une version périmée
    // pendant longtemps avant qu'onNeedRefresh ne se déclenche. On force une
    // vérification toutes les heures, et à chaque retour au premier plan
    // (icône PWA rouverte, changement d'onglet) pour détecter les mises à
    // jour plus vite.
    setInterval(() => registration.update(), 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update();
    });
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ArabicLearningApp />
  </React.StrictMode>
);
