import React, { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './src/supabaseClient';
import { useSupabaseAuth } from './src/useSupabaseAuth';
import {
  Flame,
  Info,
  X,
  Check,
  ArrowLeft,
  Volume2,
  RotateCcw,
  Sparkles,
  Mic,
  Send,
  Keyboard,
  Zap,
  Play,
  Crown,
  CheckCircle
} from 'lucide-react';

const DrawingCanvas = ({ backgroundLetter }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    let animationFrameId;

    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        animationFrameId = requestAnimationFrame(initCanvas);
        return;
      }

      if (canvas.width !== Math.floor(rect.width * 2)) {
        canvas.width = Math.floor(rect.width * 2);
        canvas.height = Math.floor(rect.height * 2);
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 14;
        ctxRef.current = ctx;
      }
    };

    animationFrameId = requestAnimationFrame(initCanvas);
    window.addEventListener('resize', initCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (e.target && e.target.hasPointerCapture) {
       e.target.setPointerCapture(e.pointerId);
    }
    const { x, y } = getCoordinates(e.nativeEvent || e);
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x, y);
      isDrawingRef.current = true;
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !ctxRef.current) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e.nativeEvent || e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawingRef.current && ctxRef.current) {
      ctxRef.current.closePath();
      isDrawingRef.current = false;
    }
    if (e && e.target && e.target.hasPointerCapture) {
       e.target.releasePointerCapture(e.pointerId);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="relative w-full aspect-square bg-white rounded-[28px] border-4 border-dashed border-gray-200 overflow-hidden shadow-inner flex flex-col">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] select-none">
        <span className="font-arabic text-[200px] font-bold text-gray-900 leading-none">{backgroundLetter}</span>
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none z-10 cursor-crosshair"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <button
        onClick={clearCanvas}
        className="absolute bottom-4 right-4 z-20 bg-white p-3 rounded-full shadow-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-100"
      >
        <RotateCcw size={20}/>
      </button>
    </div>
  );
};

const loadSavedProgress = () => {
  try {
    const raw = localStorage.getItem('maqra_progress');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export default function ArabicLearningApp() {

  const { user, signInWithGoogle, signOut } = useSupabaseAuth();
  const serverSyncedRef = useRef(false);

  const [currentScreen, setCurrentScreen] = useState(() => {
    try {
      return localStorage.getItem('maqra_onboarded') ? 'launch' : 'onboarding';
    } catch (e) {
      return 'onboarding';
    }
  });

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userLevel, setUserLevel] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => loadSavedProgress().soundEnabled ?? true);
  
  const [lessonStep, setLessonStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [activeLesson, setActiveLesson] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [previewLesson, setPreviewLesson] = useState(null);
  const [matchLeft, setMatchLeft] = useState(null);
  const [matchRight, setMatchRight] = useState(null);
  const [matchWrong, setMatchWrong] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [shuffledMatchRight, setShuffledMatchRight] = useState([]);
  const [buildSentence, setBuildSentence] = useState([]);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(-1);
  const [learningFocus, setLearningFocus] = useState(() => loadSavedProgress().learningFocus ?? 'lecture');
  const [isRecording, setIsRecording] = useState(false);
  const [userXp, setUserXp] = useState(() => loadSavedProgress().userXp ?? 140);
  const [activeRootKey, setActiveRootKey] = useState('K-T-B');
  const [survivalPhase, setSurvivalPhase] = useState('intro');
  const [survivalTime, setSurvivalTime] = useState(15);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [currentSurvQuestion, setCurrentSurvQuestion] = useState(0);
  const [showProModal, setShowProModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => loadSavedProgress().notificationsEnabled ?? true);
  const [darkMode, setDarkMode] = useState(() => loadSavedProgress().darkMode ?? false);
  const [showContextualRoot, setShowContextualRoot] = useState(false);
  const [currentRootWord, setCurrentRootWord] = useState(null);
  const [readWordsStatus, setReadWordsStatus] = useState({});
  const [activeReadWord, setActiveReadWord] = useState(null);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [srsData, setSrsData] = useState(() => {
    try {
      const raw = localStorage.getItem('maqra_srs');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  });
  const [deckSize, setDeckSize] = useState(0);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'ai', text: 'مرحباً ! (Marhaban) Prêt à pratiquer la lecture coranique et le Tajweed aujourd\'hui ? 📖' },
    { id: 2, sender: 'user', text: 'Oui, comment bien prononcer les lettres emphatiques ?' },
    { id: 3, sender: 'ai', text: 'Excellente question. Pour le "Sad" (ص), la langue s\'élève vers le palais comparativement au "Sin" (س). Écoute et répète : ص - س' }
  ]);

  const rootsDatabase = {
    'K-T-B': {
      arabic: 'كتب',
      trans: 'Écrire',
      words: [
        { word: 'كِتَاب', trans: 'Kitāb', meaning: 'Livre', icon: '📖', desc: 'L\'objet qui contient l\'écrit coranique.' },
        { word: 'مَكْتَبَة', trans: 'Maktaba', meaning: 'Bibliothèque', icon: '📚', desc: 'Le lieu de rassemblement des sciences.' },
        { word: 'كَاتِب', trans: 'Kātib', meaning: 'Écrivain', icon: '✍️', desc: 'Celui qui transcrit le message.' }
      ],
      derivatives: [
        { translit: 'Kataba', trans: 'Il a écrit', arabic: 'كَتَبَ' },
        { translit: 'Maktūb', trans: 'Écrit, destiné', arabic: 'مَكْتُوب' }
      ]
    },
    'R-H-M': {
      arabic: 'رحم',
      trans: 'Miséricorde',
      words: [
        { word: 'رَحْمَة', trans: 'Raḥma', meaning: 'Miséricorde', icon: '🤲', desc: 'La grâce et la bonté divine envers les créatures.' },
        { word: 'رَحِيم', trans: 'Raḥīm', meaning: 'Très Miséricordieux', icon: '💞', desc: 'Attribut divin répété dans presque chaque sourate.' }
      ],
      derivatives: [
        { translit: 'Raḥmān', trans: 'Le Tout Miséricordieux', arabic: 'رَحْمَـٰن' },
        { translit: 'Raḥīm', trans: 'Le Très Miséricordieux', arabic: 'رَحِيم' }
      ]
    },
    'A-L-H': {
      arabic: 'اله',
      trans: 'Dieu / Divinité',
      words: [
        { word: 'ٱللَّه', trans: 'Allāh', meaning: 'Dieu', icon: '☝️', desc: 'Le Nom propre de Dieu en arabe.' },
        { word: 'إِلَٰه', trans: 'Ilāh', meaning: 'Divinité', icon: '🕋', desc: 'Toute divinité adorée, utilisé dans l\'attestation de foi.' }
      ],
      derivatives: [
        { translit: 'Ilāh', trans: 'Divinité', arabic: 'إِلَٰه' },
        { translit: 'Allāhumma', trans: 'Ô Dieu', arabic: 'اللَّهُمَّ' }
      ]
    },
    'Q-W-L': {
      arabic: 'قول',
      trans: 'Dire / Parler',
      words: [
        { word: 'قُلْ', trans: 'Qul', meaning: 'Dis !', icon: '🗣️', desc: 'Ordre divin adressé au Prophète, ouvre de nombreuses sourates.' },
        { word: 'قَوْل', trans: 'Qawl', meaning: 'Parole', icon: '💬', desc: 'La parole prononcée, souvent opposée à l\'action.' }
      ],
      derivatives: [
        { translit: 'Yaqūlu', trans: 'Il dit', arabic: 'يَقُولُ' },
        { translit: 'Qawlan', trans: 'Une parole', arabic: 'قَوْلًا' }
      ]
    },
    'Y-W-M': {
      arabic: 'يوم',
      trans: 'Jour',
      words: [
        { word: 'يَوْم', trans: 'Yawm', meaning: 'Jour', icon: '☀️', desc: 'Désigne souvent le Jour du Jugement.' },
        { word: 'أَيَّام', trans: 'Ayyām', meaning: 'Jours', icon: '📅', desc: 'Le pluriel de Yawm.' }
      ],
      derivatives: [
        { translit: 'Ayyām', trans: 'Jours (pluriel)', arabic: 'أَيَّام' },
        { translit: 'Yawma\'idhin', trans: 'Ce jour-là', arabic: 'يَوْمَئِذٍ' }
      ]
    },
    'H-M-D': {
      arabic: 'حمد',
      trans: 'Louer / Remercier',
      words: [
        { word: 'حَمْد', trans: 'Ḥamd', meaning: 'Louange', icon: '🙌', desc: 'Premier mot d\'Al-Fatiha après la Basmala.' },
        { word: 'مُحَمَّد', trans: 'Muḥammad', meaning: 'Le Loué', icon: '🌟', desc: 'Le nom du Prophète, littéralement "celui qui est loué".' }
      ],
      derivatives: [
        { translit: 'Al-Ḥamdu lillāh', trans: 'Louange à Dieu', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
        { translit: 'Aḥmad', trans: 'Autre nom du Prophète', arabic: 'أَحْمَد' }
      ]
    },
    'S-L-M': {
      arabic: 'سلم',
      trans: 'Paix / Soumission',
      words: [
        { word: 'سَلَام', trans: 'Salām', meaning: 'Paix', icon: '☮️', desc: 'La salutation universelle entre musulmans.' },
        { word: 'إِسْلَام', trans: 'Islām', meaning: 'Soumission à Dieu', icon: '🕌', desc: 'Le nom de la religion, dérivé de la racine de la paix.' }
      ],
      derivatives: [
        { translit: 'Muslim', trans: 'Celui qui se soumet', arabic: 'مُسْلِم' },
        { translit: 'Salāmun \'alaykum', trans: 'Que la paix soit sur vous', arabic: 'سَلَامٌ عَلَيْكُمْ' }
      ]
    },
    'A-B-D': {
      arabic: 'عبد',
      trans: 'Adorer / Servir',
      words: [
        { word: 'عَبْد', trans: '\'Abd', meaning: 'Serviteur', icon: '🙏', desc: 'Celui qui adore Dieu, base de noms comme Abdullah.' },
        { word: 'عِبَادَة', trans: '\'Ibāda', meaning: 'Adoration', icon: '🕋', desc: 'L\'acte de servir et adorer Dieu.' }
      ],
      derivatives: [
        { translit: 'Na\'budu', trans: 'Nous adorons', arabic: 'نَعْبُدُ' },
        { translit: '\'Abdullāh', trans: 'Serviteur de Dieu', arabic: 'عَبْدُ اللَّٰه' }
      ]
    },
    'R-B-B': {
      arabic: 'ربب',
      trans: 'Seigneur / Éduquer',
      words: [
        { word: 'رَبّ', trans: 'Rabb', meaning: 'Seigneur', icon: '🌍', desc: 'Celui qui crée, nourrit et éduque toute la création.' },
        { word: 'تَرْبِيَة', trans: 'Tarbiya', meaning: 'Éducation', icon: '🌱', desc: 'Le fait d\'élever et de faire grandir, même racine que Rabb.' }
      ],
      derivatives: [
        { translit: 'Rabbunā', trans: 'Notre Seigneur', arabic: 'رَبُّنَا' },
        { translit: 'Rabb al-\'Ālamīn', trans: 'Seigneur des mondes', arabic: 'رَبِّ ٱلْعَالَمِينَ' }
      ]
    },
    'A-M-N': {
      arabic: 'أمن',
      trans: 'Croire / Sécurité',
      words: [
        { word: 'إِيمَان', trans: 'Īmān', meaning: 'Foi', icon: '💫', desc: 'La croyance intérieure, pilier central de la pratique.' },
        { word: 'آمَنَ', trans: 'Āmana', meaning: 'Il a cru', icon: '🤍', desc: 'L\'acte de croire, verbe qui revient très souvent dans le Coran.' }
      ],
      derivatives: [
        { translit: 'Muʼmin', trans: 'Croyant', arabic: 'مُؤْمِن' },
        { translit: 'Amān', trans: 'Sécurité', arabic: 'أَمَان' }
      ]
    },
    'A-M-L': {
      arabic: 'عمل',
      trans: 'Faire, œuvre',
      words: [
        { word: 'عَمَل', trans: 'ʻAmal', meaning: 'Œuvre', icon: '🛠️', desc: 'L\'action accomplie, souvent associée à la foi dans le Coran.' },
        { word: 'عَامِل', trans: 'ʻĀmil', meaning: 'Faisant, ouvrier', icon: '👷', desc: 'Celui qui accomplit une action.' }
      ],
      derivatives: [
        { translit: 'ʻAmila', trans: 'Il a fait, il a œuvré', arabic: 'عَمِلَ' },
        { translit: 'Aʻmāl', trans: 'Actes, œuvres', arabic: 'أَعْمَال' }
      ]
    },
    'S-B-R': {
      arabic: 'صبر',
      trans: 'Patience, endurance',
      words: [
        { word: 'صَبْر', trans: 'Ṣabr', meaning: 'Patience', icon: '⏳', desc: 'L\'endurance face à l\'épreuve, vertu très valorisée dans le Coran.' },
        { word: 'صَابِر', trans: 'Ṣābir', meaning: 'Patient', icon: '🧘', desc: 'Celui qui fait preuve de patience.' }
      ],
      derivatives: [
        { translit: 'Ṣabara', trans: 'Il a été patient', arabic: 'صَبَرَ' },
        { translit: 'Ṣabūr', trans: 'Le Très Patient (nom divin)', arabic: 'صَبُور' }
      ]
    },
    'K-L-Q': {
      arabic: 'خلق',
      trans: 'Créer',
      words: [
        { word: 'خَالِق', trans: 'Khāliq', meaning: 'Créateur', icon: '✨', desc: 'Celui qui crée à partir de rien, un des noms divins.' },
        { word: 'خَلْق', trans: 'Khalq', meaning: 'Création', icon: '🌌', desc: 'L\'acte de créer, ou l\'ensemble de la création.' }
      ],
      derivatives: [
        { translit: 'Khalaqa', trans: 'Il a créé', arabic: 'خَلَقَ' },
        { translit: 'Makhlūq', trans: 'Créature', arabic: 'مَخْلُوق' }
      ]
    },
    'GH-F-R': {
      arabic: 'غفر',
      trans: 'Pardonner',
      words: [
        { word: 'غَفُور', trans: 'Ghafūr', meaning: 'Très Pardonneur', icon: '🤍', desc: 'Un des noms divins, exprimant le pardon abondant.' },
        { word: 'مَغْفِرَة', trans: 'Maghfira', meaning: 'Pardon', icon: '🕊️', desc: 'L\'acte de pardonner, souvent demandé dans les invocations.' }
      ],
      derivatives: [
        { translit: 'Ghafara', trans: 'Il a pardonné', arabic: 'غَفَرَ' },
        { translit: 'Astaghfiru Llāh', trans: 'Je demande pardon à Dieu', arabic: 'أَسْتَغْفِرُ ٱللَّٰه' }
      ]
    },
    'A-DH-B': {
      arabic: 'عذب',
      trans: 'Châtier',
      words: [
        { word: 'عَذَاب', trans: 'ʻAdhāb', meaning: 'Châtiment', icon: '⚡', desc: 'La punition, souvent évoquée en contraste avec la miséricorde divine.' },
        { word: 'مُعَذَّب', trans: 'Muʻadhdhab', meaning: 'Châtié', icon: '😣', desc: 'Celui qui subit le châtiment.' }
      ],
      derivatives: [
        { translit: 'ʻAdhdhaba', trans: 'Il a châtié', arabic: 'عَذَّبَ' },
        { translit: 'ʻAdhāb Alīm', trans: 'Châtiment douloureux', arabic: 'عَذَاب أَلِيم' }
      ]
    },
    'SH-K-R': {
      arabic: 'شكر',
      trans: 'Remercier',
      words: [
        { word: 'شُكْر', trans: 'Shukr', meaning: 'Gratitude', icon: '🙏', desc: 'La reconnaissance envers Dieu pour Ses bienfaits.' },
        { word: 'شَاكِر', trans: 'Shākir', meaning: 'Reconnaissant', icon: '💚', desc: 'Celui qui exprime sa gratitude.' }
      ],
      derivatives: [
        { translit: 'Shakara', trans: 'Il a remercié', arabic: 'شَكَرَ' },
        { translit: 'Shakūr', trans: 'Le Très Reconnaissant (nom divin)', arabic: 'شَكُور' }
      ]
    },
    'F-D-L': {
      arabic: 'فضل',
      trans: 'Grâce, faveur',
      words: [
        { word: 'فَضْل', trans: 'Faḍl', meaning: 'Grâce', icon: '🌟', desc: 'La faveur généreuse accordée sans contrepartie.' },
        { word: 'أَفْضَل', trans: 'Afḍal', meaning: 'Meilleur', icon: '🏆', desc: 'Ce qui est le plus excellent, dérivé de la même racine.' }
      ],
      derivatives: [
        { translit: 'Faḍlan', trans: 'Par grâce', arabic: 'فَضْلًا' },
        { translit: 'Dhū l-Faḍl', trans: 'Détenteur de la grâce', arabic: 'ذُو ٱلْفَضْل' }
      ]
    },
    'J-Z-Y': {
      arabic: 'جزي',
      trans: 'Rétribuer',
      words: [
        { word: 'جَزَاء', trans: 'Jazāʼ', meaning: 'Rétribution', icon: '⚖️', desc: 'La récompense ou la sanction correspondant aux actes.' },
        { word: 'مُجَازَاة', trans: 'Mujāzāh', meaning: 'Rétribution mutuelle', icon: '🔄', desc: 'L\'acte de rendre à chacun selon ses œuvres.' }
      ],
      derivatives: [
        { translit: 'Jazā', trans: 'Il a rétribué', arabic: 'جَزَى' },
        { translit: 'Jazāka Llāhu Khayran', trans: 'Que Dieu te rétribue en bien', arabic: 'جَزَاكَ ٱللَّٰهُ خَيْرًا' }
      ]
    },
    'N-Z-L': {
      arabic: 'نزل',
      trans: 'Descendre, révéler',
      words: [
        { word: 'نُزُول', trans: 'Nuzūl', meaning: 'Descente', icon: '⬇️', desc: 'L\'action de descendre, employée pour la révélation du Coran.' },
        { word: 'مُنَزَّل', trans: 'Munazzal', meaning: 'Révélé', icon: '📜', desc: 'Ce qui a été fait descendre, envoyé par Dieu.' }
      ],
      derivatives: [
        { translit: 'Nazzala', trans: 'Il a fait descendre (révélé)', arabic: 'نَزَّلَ' },
        { translit: 'Tanzīl', trans: 'La Révélation', arabic: 'تَنْزِيل' }
      ]
    },
    'H-D-Y': {
      arabic: 'هدي',
      trans: 'Guider',
      words: [
        { word: 'هُدًى', trans: 'Hudā', meaning: 'Guidance', icon: '🧭', desc: 'La direction juste envoyée par Dieu.' },
        { word: 'هَادِي', trans: 'Hādī', meaning: 'Guide', icon: '🌟', desc: 'Celui qui montre le chemin, un des noms divins.' }
      ],
      derivatives: [
        { translit: 'Hadā', trans: 'Il a guidé', arabic: 'هَدَى' },
        { translit: 'Ihtadā', trans: 'Il s\'est laissé guider', arabic: 'ٱهْتَدَى' }
      ]
    },
    'W-Q-Y': {
      arabic: 'وقي',
      trans: 'Protéger, craindre',
      words: [
        { word: 'تَقْوَى', trans: 'Taqwā', meaning: 'Piété', icon: '🛡️', desc: 'La conscience de Dieu qui protège du péché.' },
        { word: 'وَاقِي', trans: 'Wāqī', meaning: 'Protecteur', icon: '🤲', desc: 'Celui qui préserve du mal.' }
      ],
      derivatives: [
        { translit: 'Ittaqā', trans: 'Il a craint Dieu (avec piété)', arabic: 'ٱتَّقَى' },
        { translit: 'Muttaqīn', trans: 'Les pieux', arabic: 'مُتَّقِين' }
      ]
    },
    'J-N-N': {
      arabic: 'جنن',
      trans: 'Cacher, jardin',
      words: [
        { word: 'جَنَّة', trans: 'Jannah', meaning: 'Paradis, jardin', icon: '🌳', desc: 'Le jardin promis aux croyants, "caché" par sa végétation.' },
        { word: 'جِنّ', trans: 'Jinn', meaning: 'Djinn', icon: '👻', desc: 'Créature invisible, cachée aux yeux des hommes.' }
      ],
      derivatives: [
        { translit: 'Junna', trans: 'Il a été rendu fou (esprit "caché")', arabic: 'جُنَّ' },
        { translit: 'Jannāt ʻAdn', trans: 'Les jardins d\'Éden', arabic: 'جَنَّات عَدْن' }
      ]
    },
    'H-Y-Y': {
      arabic: 'حيي',
      trans: 'Vivre',
      words: [
        { word: 'حَيَاة', trans: 'Ḥayāh', meaning: 'Vie', icon: '🌱', desc: 'La vie de ce monde, souvent comparée à celle de l\'au-delà.' },
        { word: 'حَيّ', trans: 'Ḥayy', meaning: 'Vivant', icon: '💚', desc: 'Un des noms divins : Le Vivant, qui ne meurt jamais.' }
      ],
      derivatives: [
        { translit: 'Aḥyā', trans: 'Il a donné la vie', arabic: 'أَحْيَا' },
        { translit: 'Al-Ḥayy Al-Qayyūm', trans: 'Le Vivant, Celui qui subsiste par Lui-même', arabic: 'ٱلْحَيُّ ٱلْقَيُّوم' }
      ]
    },
    'M-W-T': {
      arabic: 'موت',
      trans: 'Mourir',
      words: [
        { word: 'مَوْت', trans: 'Mawt', meaning: 'Mort', icon: '🕊️', desc: 'La fin de la vie terrestre, thème central du Coran.' },
        { word: 'مَيِّت', trans: 'Mayyit', meaning: 'Mort, défunt', icon: '⚰️', desc: 'Celui qui a quitté la vie.' }
      ],
      derivatives: [
        { translit: 'Māta', trans: 'Il est mort', arabic: 'مَاتَ' },
        { translit: 'Yumītu', trans: 'Il fait mourir', arabic: 'يُمِيتُ' }
      ]
    },
    'S-L-W': {
      arabic: 'صلو',
      trans: 'Prier',
      words: [
        { word: 'صَلَاة', trans: 'Ṣalāh', meaning: 'Prière', icon: '🕌', desc: 'Le deuxième pilier de l\'Islam, la prière rituelle.' },
        { word: 'مُصَلِّي', trans: 'Muṣallī', meaning: 'Priant', icon: '🙇', desc: 'Celui qui accomplit la prière.' }
      ],
      derivatives: [
        { translit: 'Ṣallā', trans: 'Il a prié', arabic: 'صَلَّى' },
        { translit: 'Muṣallā', trans: 'Lieu de prière', arabic: 'مُصَلَّى' }
      ]
    },
    'Z-K-W': {
      arabic: 'زكو',
      trans: 'Purifier',
      words: [
        { word: 'زَكَاة', trans: 'Zakāh', meaning: 'Aumône purificatrice', icon: '🤲', desc: 'Le troisième pilier, l\'aumône obligatoire qui purifie les biens.' },
        { word: 'زَكِيّ', trans: 'Zakiyy', meaning: 'Pur', icon: '💎', desc: 'Ce qui est purifié, exempt de défaut.' }
      ],
      derivatives: [
        { translit: 'Zakkā', trans: 'Il a purifié', arabic: 'زَكَّى' },
        { translit: 'Tazkiya', trans: 'Purification de l\'âme', arabic: 'تَزْكِيَة' }
      ]
    },
    'R-S-L': {
      arabic: 'رسل',
      trans: 'Envoyer',
      words: [
        { word: 'رَسُول', trans: 'Rasūl', meaning: 'Messager', icon: '📜', desc: 'Celui qui transmet un message divin à son peuple.' },
        { word: 'رِسَالَة', trans: 'Risāla', meaning: 'Message', icon: '✉️', desc: 'Ce qui est transmis par le messager.' }
      ],
      derivatives: [
        { translit: 'Arsala', trans: 'Il a envoyé', arabic: 'أَرْسَلَ' },
        { translit: 'Ar-Rusul', trans: 'Les Messagers', arabic: 'ٱلرُّسُل' }
      ]
    },
    'A-L-M': {
      arabic: 'علم',
      trans: 'Savoir',
      words: [
        { word: 'عِلْم', trans: 'ʻIlm', meaning: 'Savoir', icon: '🧠', desc: 'La connaissance, très valorisée dans la tradition islamique.' },
        { word: 'عَالِم', trans: 'ʻĀlim', meaning: 'Savant', icon: '📚', desc: 'Celui qui détient le savoir.' }
      ],
      derivatives: [
        { translit: 'ʻAlima', trans: 'Il a su', arabic: 'عَلِمَ' },
        { translit: 'Al-ʻAlīm', trans: 'L\'Omniscient (nom divin)', arabic: 'ٱلْعَلِيم' }
      ]
    },
    'H-K-M': {
      arabic: 'حكم',
      trans: 'Juger, sagesse',
      words: [
        { word: 'حِكْمَة', trans: 'Ḥikma', meaning: 'Sagesse', icon: '🦉', desc: 'Le savoir juste mis en pratique avec discernement.' },
        { word: 'حَاكِم', trans: 'Ḥākim', meaning: 'Juge, dirigeant', icon: '⚖️', desc: 'Celui qui rend le jugement.' }
      ],
      derivatives: [
        { translit: 'Ḥakama', trans: 'Il a jugé', arabic: 'حَكَمَ' },
        { translit: 'Al-Ḥakīm', trans: 'Le Sage (nom divin)', arabic: 'ٱلْحَكِيم' }
      ]
    },
    'Q-D-R': {
      arabic: 'قدر',
      trans: 'Pouvoir, destin',
      words: [
        { word: 'قُدْرَة', trans: 'Qudra', meaning: 'Pouvoir', icon: '💪', desc: 'La capacité et la puissance, en particulier celle de Dieu.' },
        { word: 'قَدَر', trans: 'Qadar', meaning: 'Destin', icon: '🌌', desc: 'Le décret divin, ce qui a été prédestiné.' }
      ],
      derivatives: [
        { translit: 'Qadara', trans: 'Il a déterminé', arabic: 'قَدَرَ' },
        { translit: 'Al-Qadīr', trans: 'Le Tout-Puissant (nom divin)', arabic: 'ٱلْقَدِير' }
      ]
    },
    'N-A-M': {
      arabic: 'نعم',
      trans: 'Bienfait',
      words: [
        { word: 'نِعْمَة', trans: 'Niʻma', meaning: 'Bienfait', icon: '🎁', desc: 'Toute grâce accordée par Dieu à Ses créatures.' },
        { word: 'مُنْعِم', trans: 'Munʻim', meaning: 'Bienfaiteur', icon: '💫', desc: 'Celui qui accorde des bienfaits.' }
      ],
      derivatives: [
        { translit: 'Anʻama', trans: 'Il a comblé de bienfaits', arabic: 'أَنْعَمَ' },
        { translit: 'Niʻam Allāh', trans: 'Les bienfaits de Dieu', arabic: 'نِعَم ٱللَّٰه' }
      ]
    },
    'H-B-B': {
      arabic: 'حبب',
      trans: 'Aimer',
      words: [
        { word: 'حُبّ', trans: 'Ḥubb', meaning: 'Amour', icon: '❤️', desc: 'L\'attachement profond, envers Dieu ou entre les hommes.' },
        { word: 'مَحَبَّة', trans: 'Maḥabba', meaning: 'Affection', icon: '💞', desc: 'Le sentiment d\'amour et de tendresse.' }
      ],
      derivatives: [
        { translit: 'Aḥabba', trans: 'Il a aimé', arabic: 'أَحَبَّ' },
        { translit: 'Ḥabīb', trans: 'Bien-aimé', arabic: 'حَبِيب' }
      ]
    },
    'B-R-K': {
      arabic: 'برك',
      trans: 'Bénir',
      words: [
        { word: 'بَرَكَة', trans: 'Baraka', meaning: 'Bénédiction', icon: '🌿', desc: 'L\'accroissement du bien, invisible mais tangible.' },
        { word: 'مُبَارَك', trans: 'Mubārak', meaning: 'Béni', icon: '✨', desc: 'Ce qui a reçu la bénédiction divine.' }
      ],
      derivatives: [
        { translit: 'Bāraka', trans: 'Il a béni', arabic: 'بَارَكَ' },
        { translit: 'Tabāraka Llāh', trans: 'Béni soit Dieu', arabic: 'تَبَارَكَ ٱللَّٰه' }
      ]
    },
    'F-T-H': {
      arabic: 'فتح',
      trans: 'Ouvrir, victoire',
      words: [
        { word: 'فَتْح', trans: 'Fatḥ', meaning: 'Victoire, ouverture', icon: '🚪', desc: 'La victoire ou l\'ouverture accordée par Dieu.' },
        { word: 'فَاتِح', trans: 'Fātiḥ', meaning: 'Celui qui ouvre', icon: '🔑', desc: 'Un des noms divins : Celui qui ouvre les portes du bien.' }
      ],
      derivatives: [
        { translit: 'Fataḥa', trans: 'Il a ouvert', arabic: 'فَتَحَ' },
        { translit: 'Al-Fattāḥ', trans: 'Celui qui tranche et ouvre (nom divin)', arabic: 'ٱلْفَتَّاح' }
      ]
    },
    'GH-Y-B': {
      arabic: 'غيب',
      trans: 'Invisible, absent',
      words: [
        { word: 'غَيْب', trans: 'Ghayb', meaning: 'L\'invisible', icon: '🌫️', desc: 'Ce qui échappe à la perception humaine, connu de Dieu seul.' },
        { word: 'غَائِب', trans: 'Ghāʼib', meaning: 'Absent', icon: '👻', desc: 'Ce qui est caché ou absent.' }
      ],
      derivatives: [
        { translit: 'Ghāba', trans: 'Il a disparu', arabic: 'غَابَ' },
        { translit: 'ʻĀlim al-Ghayb', trans: 'Celui qui connaît l\'invisible', arabic: 'عَالِمُ ٱلْغَيْب' }
      ]
    },
    'SH-H-D': {
      arabic: 'شهد',
      trans: 'Témoigner',
      words: [
        { word: 'شَهَادَة', trans: 'Shahāda', meaning: 'Témoignage, attestation', icon: '📜', desc: 'L\'attestation de foi, premier pilier de l\'Islam.' },
        { word: 'شَاهِد', trans: 'Shāhid', meaning: 'Témoin', icon: '👁️', desc: 'Celui qui témoigne de ce qu\'il a vu ou su.' }
      ],
      derivatives: [
        { translit: 'Shahida', trans: 'Il a témoigné', arabic: 'شَهِدَ' },
        { translit: 'Ash-Shahīd', trans: 'Le Témoin (nom divin)', arabic: 'ٱلشَّهِيد' }
      ]
    },
    'B-Y-N': {
      arabic: 'بين',
      trans: 'Clarté, distinction',
      words: [
        { word: 'بَيَان', trans: 'Bayān', meaning: 'Clarté, exposé', icon: '💡', desc: 'Le fait de rendre une chose claire et compréhensible.' },
        { word: 'بَيِّنَة', trans: 'Bayyina', meaning: 'Preuve claire', icon: '🔎', desc: 'Un argument évident qui dissipe le doute.' }
      ],
      derivatives: [
        { translit: 'Bayyana', trans: 'Il a clarifié', arabic: 'بَيَّنَ' },
        { translit: 'Tabyīn', trans: 'Clarification', arabic: 'تَبْيِين' }
      ]
    },
    'W-J-D': {
      arabic: 'وجد',
      trans: 'Trouver, exister',
      words: [
        { word: 'وُجُود', trans: 'Wujūd', meaning: 'Existence', icon: '🌌', desc: 'Le fait d\'être, d\'exister.' },
        { word: 'مَوْجُود', trans: 'Mawjūd', meaning: 'Existant', icon: '✅', desc: 'Ce qui existe réellement.' }
      ],
      derivatives: [
        { translit: 'Wajada', trans: 'Il a trouvé', arabic: 'وَجَدَ' },
        { translit: 'Al-Wājid', trans: 'Celui qui possède tout (nom divin)', arabic: 'ٱلْوَاجِد' }
      ]
    },
    'H-S-N': {
      arabic: 'حسن',
      trans: 'Beauté, bien',
      words: [
        { word: 'حُسْن', trans: 'Ḥusn', meaning: 'Beauté', icon: '🌸', desc: 'La beauté et la bonté réunies.' },
        { word: 'مُحْسِن', trans: 'Muḥsin', meaning: 'Bienfaisant', icon: '🤲', desc: 'Celui qui fait le bien avec excellence.' }
      ],
      derivatives: [
        { translit: 'Ḥasan', trans: 'Beau, bon', arabic: 'حَسَن' },
        { translit: 'Aḥsana', trans: 'Il a bien agi', arabic: 'أَحْسَنَ' }
      ]
    },
    'S-A-D': {
      arabic: 'سعد',
      trans: 'Bonheur',
      words: [
        { word: 'سَعَادَة', trans: 'Saʻāda', meaning: 'Bonheur', icon: '😊', desc: 'L\'état de plénitude et de joie.' },
        { word: 'سَعِيد', trans: 'Saʻīd', meaning: 'Heureux', icon: '🌞', desc: 'Celui qui connaît le bonheur.' }
      ],
      derivatives: [
        { translit: 'Suʻūd', trans: 'Ascension, bonne fortune', arabic: 'صُعُود' },
        { translit: 'Saʻīdan', trans: 'Heureusement', arabic: 'سَعِيدًا' }
      ]
    },
    'DH-K-R': {
      arabic: 'ذكر',
      trans: 'Rappel, mention',
      words: [
        { word: 'ذِكْر', trans: 'Dhikr', meaning: 'Rappel, invocation', icon: '📿', desc: 'Le fait de se souvenir de Dieu et de L\'évoquer.' },
        { word: 'ذَاكِر', trans: 'Dhākir', meaning: 'Celui qui se souvient', icon: '🧎', desc: 'Celui qui pratique le rappel de Dieu.' }
      ],
      derivatives: [
        { translit: 'Dhakara', trans: 'Il s\'est souvenu', arabic: 'ذَكَرَ' },
        { translit: 'Adh-Dhikr al-Ḥakīm', trans: 'Le Rappel plein de sagesse (le Coran)', arabic: 'ٱلذِّكْرُ ٱلْحَكِيم' }
      ]
    },
    'S-J-D': {
      arabic: 'سجد',
      trans: 'Se prosterner',
      words: [
        { word: 'سُجُود', trans: 'Sujūd', meaning: 'Prosternation', icon: '🙇', desc: 'L\'acte de se prosterner devant Dieu, sommet de la prière.' },
        { word: 'سَاجِد', trans: 'Sājid', meaning: 'Prosterné', icon: '🕌', desc: 'Celui qui est en prosternation.' }
      ],
      derivatives: [
        { translit: 'Sajada', trans: 'Il s\'est prosterné', arabic: 'سَجَدَ' },
        { translit: 'Masjid', trans: 'Mosquée (lieu de prosternation)', arabic: 'مَسْجِد' }
      ]
    },
    'S-D-Q': {
      arabic: 'صدق',
      trans: 'Véracité',
      words: [
        { word: 'صَادِق', trans: 'Ṣādiq', meaning: 'Véridique', icon: '✅', desc: 'Celui dont la parole est toujours vraie.' },
        { word: 'تَصْدِيق', trans: 'Taṣdīq', meaning: 'Confirmation', icon: '👍', desc: 'Le fait de confirmer la vérité de quelque chose.' }
      ],
      derivatives: [
        { translit: 'Ṣadaqa', trans: 'Il a dit vrai', arabic: 'صَدَقَ' },
        { translit: 'Ṣadaqa (aumône)', trans: 'Don sincère', arabic: 'صَدَقَة' }
      ]
    },
    'F-R-Q': {
      arabic: 'فرق',
      trans: 'Distinguer, séparer',
      words: [
        { word: 'فُرْقَان', trans: 'Furqān', meaning: 'Le Discernement', icon: '⚔️', desc: 'Nom du Coran : ce qui distingue le vrai du faux.' },
        { word: 'فَرْق', trans: 'Farq', meaning: 'Différence', icon: '↔️', desc: 'Ce qui sépare deux choses.' }
      ],
      derivatives: [
        { translit: 'Farraqa', trans: 'Il a séparé', arabic: 'فَرَّقَ' },
        { translit: 'Firqa', trans: 'Groupe, faction', arabic: 'فِرْقَة' }
      ]
    },
    'KH-T-M': {
      arabic: 'ختم',
      trans: 'Sceller, terminer',
      words: [
        { word: 'خَاتَم', trans: 'Khātam', meaning: 'Sceau', icon: '💍', desc: 'Ce qui scelle et clôt, comme le Sceau des prophètes.' },
        { word: 'خِتَام', trans: 'Khitām', meaning: 'Conclusion', icon: '🏁', desc: 'La fin, l\'achèvement d\'une chose.' }
      ],
      derivatives: [
        { translit: 'Khatama', trans: 'Il a scellé', arabic: 'خَتَمَ' },
        { translit: 'Khātam an-Nabiyyīn', trans: 'Le Sceau des prophètes', arabic: 'خَاتَمُ ٱلنَّبِيِّين' }
      ]
    },
    'H-M-L': {
      arabic: 'حمل',
      trans: 'Porter',
      words: [
        { word: 'حَمْل', trans: 'Ḥaml', meaning: 'Fardeau, portée', icon: '🎒', desc: 'Ce qui est porté, physiquement ou moralement.' },
        { word: 'حَامِل', trans: 'Ḥāmil', meaning: 'Porteur', icon: '💪', desc: 'Celui qui porte une charge.' }
      ],
      derivatives: [
        { translit: 'Ḥamala', trans: 'Il a porté', arabic: 'حَمَلَ' },
        { translit: 'Ḥammāla al-Ḥaṭab', trans: 'La porteuse de bois (Sourate Al-Masad)', arabic: 'حَمَّالَةَ ٱلْحَطَب' }
      ]
    },
    'A-B-R': {
      arabic: 'عبر',
      trans: 'Traverser, tirer leçon',
      words: [
        { word: 'عِبْرَة', trans: 'ʻIbra', meaning: 'Leçon', icon: '📖', desc: 'L\'enseignement que l\'on tire d\'un événement.' },
        { word: 'عَابِر', trans: 'ʻĀbir', meaning: 'Passant', icon: '🚶', desc: 'Celui qui traverse, de passage.' }
      ],
      derivatives: [
        { translit: 'ʻAbara', trans: 'Il a traversé', arabic: 'عَبَرَ' },
        { translit: 'Iʻtabara', trans: 'Il a tiré une leçon', arabic: 'ٱعْتَبَرَ' }
      ]
    },
    'Q-W-M': {
      arabic: 'قوم',
      trans: 'Se tenir debout, peuple',
      words: [
        { word: 'قَوْم', trans: 'Qawm', meaning: 'Peuple', icon: '👥', desc: 'Une communauté, un groupe de gens.' },
        { word: 'قَائِم', trans: 'Qāʼim', meaning: 'Debout', icon: '🧍', desc: 'Celui qui se tient droit, en position debout.' }
      ],
      derivatives: [
        { translit: 'Qāma', trans: 'Il s\'est levé', arabic: 'قَامَ' },
        { translit: 'Al-Qayyūm', trans: 'Celui qui subsiste par Lui-même (nom divin)', arabic: 'ٱلْقَيُّوم' }
      ]
    },
    'N-S-R': {
      arabic: 'نصر',
      trans: 'Aider, secourir',
      words: [
        { word: 'نَصْر', trans: 'Naṣr', meaning: 'Victoire, secours', icon: '🏆', desc: 'L\'aide et le triomphe accordés par Dieu.' },
        { word: 'نَاصِر', trans: 'Nāṣir', meaning: 'Celui qui secourt', icon: '🤝', desc: 'Celui qui apporte son aide et son soutien.' }
      ],
      derivatives: [
        { translit: 'Naṣara', trans: 'Il a secouru', arabic: 'نَصَرَ' },
        { translit: 'Anṣār', trans: 'Les Auxiliaires (compagnons de Médine)', arabic: 'أَنْصَار' }
      ]
    },
    'GH-D-B': {
      arabic: 'غضب',
      trans: 'Colère',
      words: [
        { word: 'غَضَب', trans: 'Ghaḍab', meaning: 'Colère', icon: '😠', desc: 'Le courroux, souvent évoqué en contraste avec la miséricorde.' },
        { word: 'غَضْبَان', trans: 'Ghaḍbān', meaning: 'En colère', icon: '🔥', desc: 'Celui qui est saisi par la colère.' }
      ],
      derivatives: [
        { translit: 'Ghaḍiba', trans: 'Il s\'est mis en colère', arabic: 'غَضِبَ' },
        { translit: 'Maghḍūb', trans: 'Ayant encouru la colère', arabic: 'مَغْضُوب' }
      ]
    },
    'KH-W-F': {
      arabic: 'خوف',
      trans: 'Craindre',
      words: [
        { word: 'خَائِف', trans: 'Khāʼif', meaning: 'Craintif', icon: '😨', desc: 'Celui qui ressent la crainte.' },
        { word: 'خَوْف', trans: 'Khawf', meaning: 'Peur', icon: '💭', desc: 'La crainte, équilibrée par l\'espoir en Dieu.' }
      ],
      derivatives: [
        { translit: 'Khāfa', trans: 'Il a craint', arabic: 'خَافَ' },
        { translit: 'Takhwīf', trans: 'Le fait d\'effrayer', arabic: 'تَخْوِيف' }
      ]
    },
    'R-J-A': {
      arabic: 'رجع',
      trans: 'Retourner',
      words: [
        { word: 'رُجُوع', trans: 'Rujūʻ', meaning: 'Retour', icon: '↩️', desc: 'Le retour vers Dieu, thème central de l\'au-delà.' },
        { word: 'مَرْجِع', trans: 'Marjiʻ', meaning: 'Lieu de retour', icon: '🏠', desc: 'La destination finale de toute chose.' }
      ],
      derivatives: [
        { translit: 'Rajaʻa', trans: 'Il est retourné', arabic: 'رَجَعَ' },
        { translit: 'Ilayhi Rājiʻūn', trans: 'C\'est vers Lui que nous retournons', arabic: 'إِلَيْهِ رَاجِعُون' }
      ]
    },
    'H-F-Z': {
      arabic: 'حفظ',
      trans: 'Préserver, mémoriser',
      words: [
        { word: 'حِفْظ', trans: 'Ḥifẓ', meaning: 'Préservation, mémorisation', icon: '🧠', desc: 'Le fait de garder et de retenir, notamment le Coran.' },
        { word: 'حَافِظ', trans: 'Ḥāfiẓ', meaning: 'Gardien', icon: '🛡️', desc: 'Celui qui préserve ou qui a mémorisé le Coran.' }
      ],
      derivatives: [
        { translit: 'Ḥafiẓa', trans: 'Il a préservé', arabic: 'حَفِظَ' },
        { translit: 'Al-Ḥafīẓ', trans: 'Le Préservateur (nom divin)', arabic: 'ٱلْحَفِيظ' }
      ]
    },
    'T-B-A': {
      arabic: 'تبع',
      trans: 'Suivre',
      words: [
        { word: 'اتِّبَاع', trans: 'Ittibāʻ', meaning: 'Le fait de suivre', icon: '👣', desc: 'Suivre un guide ou un enseignement avec fidélité.' },
        { word: 'تَابِع', trans: 'Tābiʻ', meaning: 'Suiveur', icon: '🚶', desc: 'Celui qui suit quelqu\'un ou quelque chose.' }
      ],
      derivatives: [
        { translit: 'Ittabaʻa', trans: 'Il a suivi', arabic: 'ٱتَّبَعَ' },
        { translit: 'Tābiʻūn', trans: 'Les Suivants (génération après les compagnons)', arabic: 'تَابِعُون' }
      ]
    },
    'D-L-L': {
      arabic: 'ضلل',
      trans: 'Égarer',
      words: [
        { word: 'ضَلَال', trans: 'Ḍalāl', meaning: 'Égarement', icon: '🌀', desc: 'Le fait de s\'écarter du droit chemin.' },
        { word: 'ضَالّ', trans: 'Ḍāll', meaning: 'Égaré', icon: '🧭', desc: 'Celui qui a perdu le droit chemin.' }
      ],
      derivatives: [
        { translit: 'Ḍalla', trans: 'Il s\'est égaré', arabic: 'ضَلَّ' },
        { translit: 'Aḍalla', trans: 'Il a égaré (quelqu\'un)', arabic: 'أَضَلَّ' }
      ]
    },
    'N-S-H': {
      arabic: 'نصح',
      trans: 'Conseiller',
      words: [
        { word: 'نَصِيحَة', trans: 'Naṣīḥa', meaning: 'Conseil', icon: '💡', desc: 'Une parole sincère donnée pour le bien d\'autrui.' },
        { word: 'نَاصِح', trans: 'Nāṣiḥ', meaning: 'Conseiller', icon: '🗣️', desc: 'Celui qui donne des conseils sincères.' }
      ],
      derivatives: [
        { translit: 'Naṣaḥa', trans: 'Il a conseillé', arabic: 'نَصَحَ' },
        { translit: 'Nāṣiḥūn', trans: 'Les conseillers sincères', arabic: 'نَاصِحُون' }
      ]
    },
    'B-SH-R': {
      arabic: 'بشر',
      trans: 'Annoncer, humanité',
      words: [
        { word: 'بَشَر', trans: 'Bashar', meaning: 'Être humain', icon: '🧑', desc: 'L\'humain, dans sa nature commune et mortelle.' },
        { word: 'بُشْرَى', trans: 'Bushrā', meaning: 'Bonne nouvelle', icon: '📯', desc: 'Une annonce heureuse et réjouissante.' }
      ],
      derivatives: [
        { translit: 'Bashshara', trans: 'Il a annoncé une bonne nouvelle', arabic: 'بَشَّرَ' },
        { translit: 'Mubashshir', trans: 'Annonciateur de bonnes nouvelles', arabic: 'مُبَشِّر' }
      ]
    },
    'GH-N-Y': {
      arabic: 'غني',
      trans: 'Richesse',
      words: [
        { word: 'غِنَى', trans: 'Ghinā', meaning: 'Richesse', icon: '💰', desc: 'L\'abondance de biens, ou la suffisance à soi-même de Dieu.' },
        { word: 'غَنِيّ', trans: 'Ghaniyy', meaning: 'Riche', icon: '👑', desc: 'Un des noms divins : Celui qui n\'a besoin de rien.' }
      ],
      derivatives: [
        { translit: 'Istaghnā', trans: 'Il s\'est passé de', arabic: 'ٱسْتَغْنَىٰ' },
        { translit: 'Al-Ghaniyy', trans: 'Le Riche par excellence (nom divin)', arabic: 'ٱلْغَنِيّ' }
      ]
    },
    'F-Q-R': {
      arabic: 'فقر',
      trans: 'Pauvreté',
      words: [
        { word: 'فَقْر', trans: 'Faqr', meaning: 'Pauvreté', icon: '🪫', desc: 'Le manque de biens, ou le besoin essentiel de Dieu.' },
        { word: 'فَقِير', trans: 'Faqīr', meaning: 'Pauvre', icon: '🙏', desc: 'Celui qui est dans le besoin.' }
      ],
      derivatives: [
        { translit: 'Faqura', trans: 'Il est devenu pauvre', arabic: 'فَقُرَ' },
        { translit: 'Fuqarāʼ', trans: 'Les pauvres', arabic: 'فُقَرَاء' }
      ]
    },
    'D-N-Y': {
      arabic: 'دني',
      trans: 'Ce bas monde, proximité',
      words: [
        { word: 'دُنْيَا', trans: 'Dunyā', meaning: 'Ce bas monde', icon: '🌍', desc: 'La vie terrestre, souvent opposée à l\'au-delà.' },
        { word: 'أَدْنَى', trans: 'Adnā', meaning: 'Plus proche', icon: '📍', desc: 'Ce qui est le plus proche ou le plus bas.' }
      ],
      derivatives: [
        { translit: 'Danā', trans: 'Il s\'est approché', arabic: 'دَنَا' },
        { translit: 'Al-Ḥayāt Ad-Dunyā', trans: 'La vie de ce bas monde', arabic: 'ٱلْحَيَاةُ ٱلدُّنْيَا' }
      ]
    },
    'A-KH-R': {
      arabic: 'أخر',
      trans: 'Autre, dernier',
      words: [
        { word: 'آخِرَة', trans: 'Ākhira', meaning: 'L\'au-delà', icon: '🌅', desc: 'La vie future, après la mort.' },
        { word: 'آخَر', trans: 'Ākhar', meaning: 'Autre', icon: '🔀', desc: 'Ce qui est différent, un autre.' }
      ],
      derivatives: [
        { translit: 'Ākhir', trans: 'Le Dernier (nom divin)', arabic: 'ٱلْآخِر' },
        { translit: 'Yawm al-Ākhir', trans: 'Le Jour Dernier', arabic: 'ٱلْيَوْم ٱلْآخِر' }
      ]
    },
    'Q-R-A': {
      arabic: 'قرأ',
      trans: 'Lire, réciter',
      words: [
        { word: 'قِرَاءَة', trans: 'Qirāʼa', meaning: 'Lecture', icon: '📖', desc: 'L\'acte de lire ou réciter le Coran.' },
        { word: 'قَارِئ', trans: 'Qāriʼ', meaning: 'Lecteur, récitateur', icon: '🎙️', desc: 'Celui qui récite le Coran.' }
      ],
      derivatives: [
        { translit: 'Qaraʼa', trans: 'Il a lu, récité', arabic: 'قَرَأَ' },
        { translit: 'Al-Qurʼān', trans: 'Le Coran, "la Récitation"', arabic: 'ٱلْقُرْآن' }
      ]
    },
    'K-B-R': {
      arabic: 'كبر',
      trans: 'Grandeur',
      words: [
        { word: 'كَبِير', trans: 'Kabīr', meaning: 'Grand', icon: '🏔️', desc: 'Ce qui est immense, un des noms divins.' },
        { word: 'كِبْرِيَاء', trans: 'Kibriyāʼ', meaning: 'Orgueil, grandeur', icon: '👑', desc: 'La grandeur suprême, propre à Dieu seul.' }
      ],
      derivatives: [
        { translit: 'Kabbara', trans: 'Il a proclamé la grandeur de Dieu', arabic: 'كَبَّرَ' },
        { translit: 'Allāhu Akbar', trans: 'Dieu est le Plus Grand', arabic: 'ٱللَّٰهُ أَكْبَر' }
      ]
    },
    'J-H-D': {
      arabic: 'جهد',
      trans: 'Effort, lutte',
      words: [
        { word: 'جِهَاد', trans: 'Jihād', meaning: 'Effort, lutte', icon: '💪', desc: 'L\'effort soutenu, intérieur ou extérieur, sur le chemin de Dieu.' },
        { word: 'مُجَاهِد', trans: 'Mujāhid', meaning: 'Celui qui lutte', icon: '🛡️', desc: 'Celui qui fournit un effort méritoire.' }
      ],
      derivatives: [
        { translit: 'Jāhada', trans: 'Il a lutté, fourni un effort', arabic: 'جَاهَدَ' },
        { translit: 'Ijtihād', trans: 'Effort d\'interprétation', arabic: 'ٱجْتِهَاد' }
      ]
    },
    'S-B-Q': {
      arabic: 'سبق',
      trans: 'Précéder',
      words: [
        { word: 'سَابِق', trans: 'Sābiq', meaning: 'Précédent', icon: '🏃', desc: 'Celui qui devance les autres, notamment dans le bien.' },
        { word: 'سَبْق', trans: 'Sabq', meaning: 'Précédence', icon: '⏱️', desc: 'Le fait de venir avant.' }
      ],
      derivatives: [
        { translit: 'Sabaqa', trans: 'Il a précédé', arabic: 'سَبَقَ' },
        { translit: 'As-Sābiqūn', trans: 'Les Devanciers', arabic: 'ٱلسَّابِقُون' }
      ]
    },
    'KH-L-F': {
      arabic: 'خلف',
      trans: 'Succéder, différer',
      words: [
        { word: 'خَلِيفَة', trans: 'Khalīfa', meaning: 'Successeur', icon: '👑', desc: 'Celui qui succède, notamment Adam sur terre.' },
        { word: 'خِلَاف', trans: 'Khilāf', meaning: 'Désaccord', icon: '⚡', desc: 'Une divergence entre deux positions.' }
      ],
      derivatives: [
        { translit: 'Khalafa', trans: 'Il a succédé', arabic: 'خَلَفَ' },
        { translit: 'Khilāfa', trans: 'Le Califat', arabic: 'خِلَافَة' }
      ]
    },
    'GH-F-L': {
      arabic: 'غفل',
      trans: 'Négliger',
      words: [
        { word: 'غَافِل', trans: 'Ghāfil', meaning: 'Négligent', icon: '😴', desc: 'Celui qui oublie ou néglige le rappel de Dieu.' },
        { word: 'غَفْلَة', trans: 'Ghaflah', meaning: 'Insouciance', icon: '💤', desc: 'L\'état d\'inattention envers l\'essentiel.' }
      ],
      derivatives: [
        { translit: 'Ghafala', trans: 'Il a négligé', arabic: 'غَفَلَ' },
        { translit: 'Lā Taghful', trans: 'Ne sois pas négligent', arabic: 'لَا تَغْفُلْ' }
      ]
    },
    'J-H-L': {
      arabic: 'جهل',
      trans: 'Ignorance',
      words: [
        { word: 'جَاهِل', trans: 'Jāhil', meaning: 'Ignorant', icon: '❓', desc: 'Celui qui manque de savoir ou agit sans discernement.' },
        { word: 'جَهْل', trans: 'Jahl', meaning: 'Ignorance', icon: '🌫️', desc: 'L\'absence de savoir, opposée à ʻIlm.' }
      ],
      derivatives: [
        { translit: 'Jahila', trans: 'Il a ignoré', arabic: 'جَهِلَ' },
        { translit: 'Al-Jāhiliyya', trans: 'L\'ère de l\'ignorance pré-islamique', arabic: 'ٱلْجَاهِلِيَّة' }
      ]
    },
    'A-Q-L': {
      arabic: 'عقل',
      trans: 'Intellect',
      words: [
        { word: 'عَقْل', trans: 'ʻAql', meaning: 'Raison', icon: '🧠', desc: 'La faculté de comprendre et de discerner.' },
        { word: 'عَاقِل', trans: 'ʻĀqil', meaning: 'Raisonnable', icon: '💭', desc: 'Celui qui use de sa raison.' }
      ],
      derivatives: [
        { translit: 'ʻAqala', trans: 'Il a compris, raisonné', arabic: 'عَقَلَ' },
        { translit: 'Yaʻqilūn', trans: 'Ils raisonnent', arabic: 'يَعْقِلُون' }
      ]
    },
    'H-S-B': {
      arabic: 'حسب',
      trans: 'Compter, suffire',
      words: [
        { word: 'حِسَاب', trans: 'Ḥisāb', meaning: 'Compte', icon: '🧮', desc: 'Le compte des actes, notamment au Jour du Jugement.' },
        { word: 'حَسِيب', trans: 'Ḥasīb', meaning: 'Comptable', icon: '📊', desc: 'Un des noms divins : Celui qui tient le compte de tout.' }
      ],
      derivatives: [
        { translit: 'Ḥasiba', trans: 'Il a compté, pensé', arabic: 'حَسِبَ' },
        { translit: 'Ḥasbunā Llāh', trans: 'Dieu nous suffit', arabic: 'حَسْبُنَا ٱللَّٰه' }
      ]
    },
    'W-S-A': {
      arabic: 'وسع',
      trans: 'Étendre, vaste',
      words: [
        { word: 'وَاسِع', trans: 'Wāsiʻ', meaning: 'Vaste', icon: '🌌', desc: 'Un des noms divins : Celui dont la miséricorde et la science sont infinies.' },
        { word: 'سَعَة', trans: 'Saʻa', meaning: 'Étendue, aisance', icon: '↔️', desc: 'L\'ampleur, l\'espace disponible.' }
      ],
      derivatives: [
        { translit: 'Wasiʻa', trans: 'Il a englobé, contenu', arabic: 'وَسِعَ' },
        { translit: 'Al-Wāsiʻ', trans: 'Le Vaste (nom divin)', arabic: 'ٱلْوَاسِع' }
      ]
    },
    'J-M-A': {
      arabic: 'جمع',
      trans: 'Rassembler',
      words: [
        { word: 'جَمْع', trans: 'Jamʻ', meaning: 'Rassemblement', icon: '👨‍👩‍👧‍👦', desc: 'Le fait de réunir, notamment au Jour de la Résurrection.' },
        { word: 'جَمَاعَة', trans: 'Jamāʻa', meaning: 'Communauté', icon: '🕌', desc: 'Un groupe réuni, notamment pour la prière.' }
      ],
      derivatives: [
        { translit: 'Jamaʻa', trans: 'Il a rassemblé', arabic: 'جَمَعَ' },
        { translit: 'Yawm al-Jamʻ', trans: 'Le Jour du Rassemblement', arabic: 'يَوْمُ ٱلْجَمْع' }
      ]
    },
    'F-R-D': {
      arabic: 'فرد',
      trans: 'Unique, individuel',
      words: [
        { word: 'فَرْد', trans: 'Fard', meaning: 'Individu', icon: '🧍', desc: 'Une personne seule, distincte du groupe.' },
        { word: 'فَرِيد', trans: 'Farīd', meaning: 'Unique', icon: '⭐', desc: 'Ce qui est sans pareil.' }
      ],
      derivatives: [
        { translit: 'Infarada', trans: 'Il est resté seul', arabic: 'ٱنْفَرَدَ' },
        { translit: 'Furādā', trans: 'Séparément, un par un', arabic: 'فُرَادَىٰ' }
      ]
    },
    'W-H-D': {
      arabic: 'وحد',
      trans: 'Unicité',
      words: [
        { word: 'وَاحِد', trans: 'Wāḥid', meaning: 'Un, Unique', icon: '☝️', desc: 'Un des noms divins : Dieu, l\'Unique sans associé.' },
        { word: 'تَوْحِيد', trans: 'Tawḥīd', meaning: 'Monothéisme', icon: '🕋', desc: 'La proclamation et la croyance en l\'Unicité de Dieu.' }
      ],
      derivatives: [
        { translit: 'Waḥḥada', trans: 'Il a proclamé l\'unicité', arabic: 'وَحَّدَ' },
        { translit: 'Al-Aḥad', trans: 'L\'Unique (nom divin)', arabic: 'ٱلْأَحَد' }
      ]
    },
    'R-H-L': {
      arabic: 'رحل',
      trans: 'Voyager',
      words: [
        { word: 'رِحْلَة', trans: 'Riḥla', meaning: 'Voyage', icon: '🧳', desc: 'Un déplacement, notamment pour le commerce ou la quête du savoir.' },
        { word: 'رَاحِل', trans: 'Rāḥil', meaning: 'Voyageur', icon: '🐫', desc: 'Celui qui part en voyage.' }
      ],
      derivatives: [
        { translit: 'Raḥala', trans: 'Il a voyagé', arabic: 'رَحَلَ' },
        { translit: 'Riḥlat ash-Shitāʼ wa ṣ-Ṣayf', trans: 'Le voyage d\'hiver et d\'été (Quraysh)', arabic: 'رِحْلَةَ ٱلشِّتَاءِ وَٱلصَّيْف' }
      ]
    },
    'B-A-TH': {
      arabic: 'بعث',
      trans: 'Ressusciter, envoyer',
      words: [
        { word: 'بَعْث', trans: 'Baʻth', meaning: 'Résurrection', icon: '🌅', desc: 'Le fait d\'être ressuscité après la mort.' },
        { word: 'مَبْعُوث', trans: 'Mabʻūth', meaning: 'Envoyé', icon: '📨', desc: 'Celui qui est envoyé avec une mission.' }
      ],
      derivatives: [
        { translit: 'Baʻatha', trans: 'Il a envoyé, ressuscité', arabic: 'بَعَثَ' },
        { translit: 'Yawm al-Baʻth', trans: 'Le Jour de la Résurrection', arabic: 'يَوْمُ ٱلْبَعْث' }
      ]
    },
    'KH-L-S': {
      arabic: 'خلص',
      trans: 'Sincérité, pureté',
      words: [
        { word: 'إِخْلَاص', trans: 'Ikhlāṣ', meaning: 'Sincérité', icon: '💎', desc: 'La pureté d\'intention, réservée exclusivement à Dieu.' },
        { word: 'خَالِص', trans: 'Khāliṣ', meaning: 'Pur', icon: '✨', desc: 'Ce qui est sans mélange, authentique.' }
      ],
      derivatives: [
        { translit: 'Akhlaṣa', trans: 'Il a été sincère', arabic: 'أَخْلَصَ' },
        { translit: 'Sūrat al-Ikhlāṣ', trans: 'La sourate de la Sincérité (112)', arabic: 'سُورَةُ ٱلْإِخْلَاص' }
      ]
    },
    'A-D-L': {
      arabic: 'عدل',
      trans: 'Justice',
      words: [
        { word: 'عَدْل', trans: 'ʻAdl', meaning: 'Justice', icon: '⚖️', desc: 'Le fait de donner à chacun son dû, valeur centrale du Coran.' },
        { word: 'عَادِل', trans: 'ʻĀdil', meaning: 'Juste', icon: '🧑‍⚖️', desc: 'Celui qui agit avec équité.' }
      ],
      derivatives: [
        { translit: 'ʻAdala', trans: 'Il a été juste', arabic: 'عَدَلَ' },
        { translit: 'Al-ʻAdl', trans: 'Le Juste (nom divin)', arabic: 'ٱلْعَدْل' }
      ]
    },
    'GH-R-B': {
      arabic: 'غرب',
      trans: 'Ouest, étrange',
      words: [
        { word: 'غَرْب', trans: 'Gharb', meaning: 'Ouest', icon: '🌇', desc: 'La direction du couchant.' },
        { word: 'غَرِيب', trans: 'Gharīb', meaning: 'Étranger, étrange', icon: '🧳', desc: 'Celui qui vient d\'ailleurs, ou ce qui surprend.' }
      ],
      derivatives: [
        { translit: 'Ghāba', trans: 'Il s\'est couché (le soleil)', arabic: 'غَرَبَ' },
        { translit: 'Al-Maghrib', trans: 'Le Couchant, le Maroc', arabic: 'ٱلْمَغْرِب' }
      ]
    },
    'SH-R-Q': {
      arabic: 'شرق',
      trans: 'Est, lever',
      words: [
        { word: 'شَرْق', trans: 'Sharq', meaning: 'Est', icon: '🌅', desc: 'La direction du levant.' },
        { word: 'شُرُوق', trans: 'Shurūq', meaning: 'Lever du soleil', icon: '☀️', desc: 'Le moment où le soleil se lève.' }
      ],
      derivatives: [
        { translit: 'Sharaqat', trans: 'Il s\'est levé (le soleil)', arabic: 'شَرَقَتْ' },
        { translit: 'Al-Mashriq', trans: 'Le Levant', arabic: 'ٱلْمَشْرِق' }
      ]
    },
    'T-M-M': {
      arabic: 'تمم',
      trans: 'Achever',
      words: [
        { word: 'تَمَام', trans: 'Tamām', meaning: 'Achèvement', icon: '✅', desc: 'L\'état de ce qui est complet et parfait.' },
        { word: 'تَامّ', trans: 'Tāmm', meaning: 'Complet', icon: '💯', desc: 'Ce à quoi rien ne manque.' }
      ],
      derivatives: [
        { translit: 'Tamma', trans: 'Il s\'est achevé', arabic: 'تَمَّ' },
        { translit: 'Atmama', trans: 'Il a mené à terme', arabic: 'أَتْمَمَ' }
      ]
    },
    'B-D-A': {
      arabic: 'بدأ',
      trans: 'Commencer',
      words: [
        { word: 'بِدَايَة', trans: 'Bidāya', meaning: 'Début', icon: '🏁', desc: 'Le commencement d\'une chose.' },
        { word: 'مُبْتَدِئ', trans: 'Mubtadiʼ', meaning: 'Débutant', icon: '🌱', desc: 'Celui qui commence tout juste.' }
      ],
      derivatives: [
        { translit: 'Badaʼa', trans: 'Il a commencé', arabic: 'بَدَأَ' },
        { translit: 'Al-Bādiʼ', trans: 'Celui qui commence toute chose (nom divin)', arabic: 'ٱلْبَادِئ' }
      ]
    },
    'N-H-Y': {
      arabic: 'نهي',
      trans: 'Finir, interdire',
      words: [
        { word: 'نِهَايَة', trans: 'Nihāya', meaning: 'Fin', icon: '🏁', desc: 'Le terme, la conclusion d\'une chose.' },
        { word: 'نَهْي', trans: 'Nahy', meaning: 'Interdiction', icon: '🚫', desc: 'L\'ordre de ne pas faire quelque chose.' }
      ],
      derivatives: [
        { translit: 'Nahā', trans: 'Il a interdit', arabic: 'نَهَىٰ' },
        { translit: 'Al-Amr bil-Maʻrūf wan-Nahy ʻan al-Munkar', trans: 'Ordonner le bien et interdire le mal', arabic: 'ٱلْأَمْرُ بِٱلْمَعْرُوفِ وَٱلنَّهْيُ عَنِ ٱلْمُنْكَر' }
      ]
    },
    'H-L-L': {
      arabic: 'حلل',
      trans: 'Résoudre, permettre',
      words: [
        { word: 'حَلّ', trans: 'Ḥall', meaning: 'Solution', icon: '🔓', desc: 'La résolution d\'un problème.' },
        { word: 'حَلَال', trans: 'Ḥalāl', meaning: 'Permis', icon: '✅', desc: 'Ce qui est autorisé par la loi religieuse.' }
      ],
      derivatives: [
        { translit: 'Ḥalla', trans: 'Il a résolu, permis', arabic: 'حَلَّ' },
        { translit: 'Taḥlīl', trans: 'Analyse', arabic: 'تَحْلِيل' }
      ]
    },
    'B-N-Y': {
      arabic: 'بني',
      trans: 'Construire',
      words: [
        { word: 'بِنَاء', trans: 'Bināʼ', meaning: 'Construction', icon: '🏗️', desc: 'L\'acte de bâtir, ou l\'édifice lui-même.' },
        { word: 'بَانِي', trans: 'Bānī', meaning: 'Bâtisseur', icon: '👷', desc: 'Celui qui construit.' }
      ],
      derivatives: [
        { translit: 'Banā', trans: 'Il a construit', arabic: 'بَنَىٰ' },
        { translit: 'Banū Ādam', trans: 'Les fils d\'Adam (l\'humanité)', arabic: 'بَنُو آدَم' }
      ]
    },
    'K-SH-F': {
      arabic: 'كشف',
      trans: 'Dévoiler',
      words: [
        { word: 'كَشْف', trans: 'Kashf', meaning: 'Dévoilement', icon: '🔍', desc: 'Le fait de révéler ce qui était caché.' },
        { word: 'كَاشِف', trans: 'Kāshif', meaning: 'Celui qui dévoile', icon: '💡', desc: 'Celui qui lève un voile ou une épreuve.' }
      ],
      derivatives: [
        { translit: 'Kashafa', trans: 'Il a dévoilé', arabic: 'كَشَفَ' },
        { translit: 'Lā Kāshifa Lahu', trans: 'Nul ne peut la dévoiler (l\'épreuve)', arabic: 'لَا كَاشِفَ لَهُ' }
      ]
    },
    'Z-H-R': {
      arabic: 'ظهر',
      trans: 'Apparaître',
      words: [
        { word: 'ظُهُور', trans: 'Ẓuhūr', meaning: 'Apparition', icon: '🌟', desc: 'Le fait de devenir visible, manifeste.' },
        { word: 'ظَاهِر', trans: 'Ẓāhir', meaning: 'Apparent', icon: '👁️', desc: 'Un des noms divins : Celui dont l\'existence est manifeste par Ses signes.' }
      ],
      derivatives: [
        { translit: 'Ẓahara', trans: 'Il est apparu', arabic: 'ظَهَرَ' },
        { translit: 'Aẓ-Ẓāhir', trans: 'L\'Apparent (nom divin)', arabic: 'ٱلظَّاهِر' }
      ]
    },
    'B-T-N': {
      arabic: 'بطن',
      trans: 'Intérieur, caché',
      words: [
        { word: 'بَاطِن', trans: 'Bāṭin', meaning: 'Caché', icon: '🌑', desc: 'Un des noms divins : Celui dont l\'Essence est cachée, imperceptible.' },
        { word: 'بَطْن', trans: 'Baṭn', meaning: 'Ventre, intérieur', icon: '📦', desc: 'Ce qui est à l\'intérieur, non visible.' }
      ],
      derivatives: [
        { translit: 'Al-Bāṭin', trans: 'Le Caché (nom divin, associé à Aẓ-Ẓāhir)', arabic: 'ٱلْبَاطِن' },
        { translit: 'Bāṭinan', trans: 'Intérieurement', arabic: 'بَاطِنًا' }
      ]
    },
    'Q-D-M': {
      arabic: 'قدم',
      trans: 'Avancer, ancien',
      words: [
        { word: 'قَدِيم', trans: 'Qadīm', meaning: 'Ancien', icon: '📜', desc: 'Ce qui existe depuis toujours, sans commencement.' },
        { word: 'تَقَدُّم', trans: 'Taqaddum', meaning: 'Progrès', icon: '📈', desc: 'Le fait d\'avancer, de progresser.' }
      ],
      derivatives: [
        { translit: 'Qaddama', trans: 'Il a fait avancer, présenté', arabic: 'قَدَّمَ' },
        { translit: 'Muqaddima', trans: 'Introduction', arabic: 'مُقَدِّمَة' }
      ]
    },
    'H-R-B': {
      arabic: 'حرب',
      trans: 'Guerre',
      words: [
        { word: 'حَرْب', trans: 'Ḥarb', meaning: 'Guerre', icon: '⚔️', desc: 'Le conflit armé, opposé à la paix (Salām).' },
        { word: 'مُحَارِب', trans: 'Muḥārib', meaning: 'Combattant', icon: '🛡️', desc: 'Celui qui fait la guerre.' }
      ],
      derivatives: [
        { translit: 'Ḥāraba', trans: 'Il a combattu', arabic: 'حَارَبَ' },
        { translit: 'Fa\'dhanū bi-Ḥarbin', trans: 'Attendez-vous alors à une guerre', arabic: 'فَأْذَنُوا بِحَرْبٍ' }
      ]
    },
    'S-L-K': {
      arabic: 'سلك',
      trans: 'Suivre un chemin',
      words: [
        { word: 'مَسْلَك', trans: 'Maslak', meaning: 'Voie, chemin', icon: '🛤️', desc: 'Le chemin que l\'on emprunte.' },
        { word: 'سَالِك', trans: 'Sālik', meaning: 'Celui qui chemine', icon: '🚶', desc: 'Celui qui progresse sur une voie.' }
      ],
      derivatives: [
        { translit: 'Salaka', trans: 'Il a suivi un chemin', arabic: 'سَلَكَ' },
        { translit: 'Sulūk', trans: 'Conduite, cheminement spirituel', arabic: 'سُلُوك' }
      ]
    },
    'W-S-L': {
      arabic: 'وصل',
      trans: 'Relier, arriver',
      words: [
        { word: 'وُصُول', trans: 'Wuṣūl', meaning: 'Arrivée', icon: '🏁', desc: 'Le fait de parvenir à destination.' },
        { word: 'صِلَة', trans: 'Ṣila', meaning: 'Lien', icon: '🔗', desc: 'Le lien, notamment le lien de parenté (Ṣilat ar-Raḥim).' }
      ],
      derivatives: [
        { translit: 'Waṣala', trans: 'Il est arrivé', arabic: 'وَصَلَ' },
        { translit: 'Ṣilat ar-Raḥim', trans: 'Le maintien des liens de parenté', arabic: 'صِلَةُ ٱلرَّحِم' }
      ]
    },
    'Q-S-D': {
      arabic: 'قصد',
      trans: 'Intention, diriger',
      words: [
        { word: 'قَصْد', trans: 'Qaṣd', meaning: 'Intention', icon: '🎯', desc: 'Le but visé dans une action.' },
        { word: 'مَقْصِد', trans: 'Maqṣid', meaning: 'But, objectif', icon: '🏹', desc: 'La finalité recherchée.' }
      ],
      derivatives: [
        { translit: 'Qaṣada', trans: 'Il a eu l\'intention de', arabic: 'قَصَدَ' },
        { translit: 'Wa-qṣid fī Mashyika', trans: 'Sois modéré dans ta démarche', arabic: 'وَٱقْصِدْ فِى مَشْيِكَ' }
      ]
    },
    'F-K-R': {
      arabic: 'فكر',
      trans: 'Penser',
      words: [
        { word: 'فِكْر', trans: 'Fikr', meaning: 'Pensée', icon: '💭', desc: 'L\'activité de l\'esprit, la réflexion.' },
        { word: 'مُفَكِّر', trans: 'Mufakkir', meaning: 'Penseur', icon: '🧠', desc: 'Celui qui réfléchit profondément.' }
      ],
      derivatives: [
        { translit: 'Tafakkara', trans: 'Il a réfléchi', arabic: 'تَفَكَّرَ' },
        { translit: 'Yatafakkarūn', trans: 'Ils réfléchissent', arabic: 'يَتَفَكَّرُون' }
      ]
    }
  };

  const [survivalQuestions] = useState([
    { word: 'Livre', options: ['كِتَاب', 'قَلَم', 'بَاب', 'مَاء'], correct: 0 },
    { word: 'Sad (Emphatique)', options: ['س', 'ص', 'ت', 'ب'], correct: 1 },
    { word: 'Oui', options: ['لا', 'نَعَم', 'أَب', 'أُم'], correct: 1 },
    { word: 'Eau', options: ['خُبْز', 'حَلِيب', 'مَاء', 'شَاي'], correct: 2 },
    { word: 'Lecture', options: ['قِرَاءَة', 'كِتَابَة', 'سَمَاع', 'كَلَام'], correct: 0 }
  ]);

  const [modules, setModules] = useState(() => {
    const savedProgress = loadSavedProgress().modulesProgress || {};
    return [
    {
      id: 1,
      dateGroup: 'Aujourd\'hui (1)',
      icon: '🔤',
      title: 'Qaïda',
      description: 'Sons & lettres emphatiques (القاعدة النورانية)',
      progress: savedProgress[1] ?? 0,
      total: 14,
      tags: ['Phonétique', 'Bases'],
      color: 'bg-green-100',
      tagColor: 'bg-green-200 text-green-800'
    },
    {
      id: 2,
      dateGroup: 'Août 13 (1)',
      icon: '📖',
      title: 'Lecture Coranique',
      description: 'Juz Amma, décodage syllabique et audio natif',
      progress: savedProgress[2] ?? 0,
      total: 29,
      tags: ['Coran', 'Fluidité'],
      color: 'bg-sky-100',
      tagColor: 'bg-blue-100 text-blue-800'
    },
    {
       id: 3,
       dateGroup: 'Août 12 (2)',
       icon: '⭐',
       title: 'Fréquence Lexicale',
       description: 'Les mots clés qui composent 80% du Coran',
       progress: savedProgress[3] ?? 0,
       total: 40,
       tags: ['Vocabulaire', 'Coran'],
       color: 'bg-yellow-100',
       tagColor: 'bg-yellow-200 text-yellow-800'
    },
    {
       id: 4,
       dateGroup: 'Concepts Avancés',
       icon: '📘',
       title: 'Le Secret des Racines',
       description: 'La matrice trilitère (التصريف) et le Sarf',
       progress: savedProgress[4] ?? 0,
       total: 31,
       tags: ['Morphologie', 'Grammaire'],
       color: 'bg-indigo-100',
       tagColor: 'bg-indigo-100 text-indigo-800'
    },
    {
       id: 5,
       dateGroup: 'Concepts Avancés',
       icon: '🎙️',
       title: 'Tajwid',
       description: 'Les règles de récitation (أحكام التجويد)',
       progress: savedProgress[5] ?? 0,
       total: 13,
       tags: ['Tajwid', 'Récitation'],
       color: 'bg-rose-100',
       tagColor: 'bg-rose-200 text-rose-800'
    },
    {
       id: 6,
       dateGroup: 'Concepts Avancés',
       icon: '✨',
       title: 'Les 99 Noms d\'Allah',
       description: 'Al-Asmāʼ al-Ḥusnā, les plus beaux noms',
       progress: savedProgress[6] ?? 0,
       total: 33,
       tags: ['Noms Divins', 'Spiritualité'],
       color: 'bg-amber-100',
       tagColor: 'bg-amber-200 text-amber-800'
    },
    {
       id: 7,
       dateGroup: 'Concepts Avancés',
       icon: '💬',
       title: 'Expressions du Quotidien',
       description: 'Phrases usuelles pour parler et saluer',
       progress: savedProgress[7] ?? 0,
       total: 22,
       tags: ['Conversation', 'Pratique'],
       color: 'bg-teal-100',
       tagColor: 'bg-teal-200 text-teal-800'
    },
    {
       id: 8,
       dateGroup: 'Concepts Avancés',
       icon: '🖋️',
       title: 'Calligraphie',
       description: 'Les formes des lettres et leurs liaisons (الخط العربي)',
       progress: savedProgress[8] ?? 0,
       total: 21,
       tags: ['Calligraphie', 'Écriture'],
       color: 'bg-cyan-100',
       tagColor: 'bg-cyan-200 text-cyan-800'
    }
    ];
  });

  const qaidaLessons = [
    [
      {
        type: 'intro',
        letter: 'س',
        name: 'Sīn (Légère)',
        instruction: 'Voici la lettre Sīn. C\'est une consonne légère : la langue reste plate.',
        sound: 'Sin',
        illustration: '🐟',
        mnemonic: 'سَمَكَة (Samaka - Poisson)'
      },
      { type: 'trace', letter: 'س', instruction: 'Tracez la lettre Sīn (Les trois dents et la boucle).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Sīn" (S léger) ?', options: ['ش', 'س', 'ص', 'ث'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ص',
        name: 'Ṣād (Emphatique)',
        instruction: 'Voici la lettre Ṣād. C\'est une consonne emphatique : la base de la langue se soulève vers le palais.',
        sound: 'Sad',
        illustration: '🧼',
        mnemonic: 'صَابُون (Ṣābūn - Savon)'
      },
      { type: 'trace', letter: 'ص', instruction: 'Tracez la lettre Ṣād (La boucle emphatique).' },
      { type: 'qcm', instruction: 'Trouvez la lettre emphatique "Ṣād" parmi ces propositions.', options: ['س', 'ت', 'ص', 'ن'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 1 terminée ! Vous maîtrisez la différence entre léger et emphatique. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'ت',
        name: 'Tāʼ (Légère)',
        instruction: 'La lettre Tāʼ est légère, proche du "t" français, articulée avec le bout de la langue.',
        sound: 'Ta',
        illustration: '🍎',
        mnemonic: 'تُفَّاح (Tuffāḥ - Pomme)'
      },
      { type: 'trace', letter: 'ت', instruction: 'Tracez la lettre Tāʼ (une base avec deux points au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Tāʼ" (T léger) ?', options: ['ب', 'ت', 'ث', 'ن'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ط',
        name: 'Ṭāʼ (Emphatique)',
        instruction: 'La lettre Ṭāʼ est l\'emphatique du Tāʼ : la langue se plaque contre le palais.',
        sound: 'Ta (emphatique)',
        illustration: '🐦',
        mnemonic: 'طَائِر (Ṭāʼir - Oiseau)'
      },
      { type: 'trace', letter: 'ط', instruction: 'Tracez la lettre Ṭāʼ (la boucle avec la hampe verticale).' },
      { type: 'qcm', instruction: 'Trouvez la lettre emphatique "Ṭāʼ" parmi ces propositions.', options: ['ظ', 'ط', 'ت', 'د'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'د',
        name: 'Dāl (Légère)',
        instruction: 'La lettre Dāl est légère, un simple crochet sans boucle.',
        sound: 'Da',
        illustration: '🐻',
        mnemonic: 'دُبّ (Dubb - Ours)'
      },
      { type: 'trace', letter: 'د', instruction: 'Tracez la lettre Dāl (un crochet, sans boucle).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Dāl" (D léger) ?', options: ['ذ', 'ر', 'د', 'و'], correctIndex: 2, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ض',
        name: 'Ḍād (Emphatique)',
        instruction: 'La lettre Ḍād est l\'emphatique du Dāl : le côté de la langue se soulève vers les molaires.',
        sound: 'Da (emphatique)',
        illustration: '🐸',
        mnemonic: 'ضِفْدَع (Ḍifdaʻ - Grenouille)'
      },
      { type: 'trace', letter: 'ض', instruction: 'Tracez la lettre Ḍād (la boucle emphatique avec un point).' },
      { type: 'qcm', instruction: 'Trouvez la lettre emphatique "Ḍād" parmi ces propositions.', options: ['ص', 'ض', 'ط', 'ظ'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ذ',
        name: 'Dhāl (Légère)',
        instruction: 'La lettre Dhāl est légère, comme le "th" anglais de "this".',
        sound: 'Dha',
        illustration: '🪰',
        mnemonic: 'ذُبَابَة (Dhubāba - Mouche)'
      },
      { type: 'trace', letter: 'ذ', instruction: 'Tracez la lettre Dhāl (comme Dāl, avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Dhāl" (Dh léger) ?', options: ['د', 'ذ', 'ر', 'ز'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ظ',
        name: 'Ẓāʼ (Emphatique)',
        instruction: 'La lettre Ẓāʼ est l\'emphatique du Dhāl : le même "th" mais avec la langue plaquée vers le palais.',
        sound: 'Dha (emphatique)',
        illustration: '🕛',
        mnemonic: 'ظُهْر (Ẓuhr - Midi)'
      },
      { type: 'trace', letter: 'ظ', instruction: 'Tracez la lettre Ẓāʼ (comme Ṭāʼ, avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Trouvez la lettre emphatique "Ẓāʼ" parmi ces propositions.', options: ['ط', 'ظ', 'ض', 'ذ'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 2 terminée ! 8 lettres légères et emphatiques maîtrisées. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'ك',
        name: 'Kāf (Légère)',
        instruction: 'La lettre Kāf est légère, articulée au fond du palais.',
        sound: 'Ka',
        illustration: '🐕',
        mnemonic: 'كَلْب (Kalb - Chien)'
      },
      { type: 'trace', letter: 'ك', instruction: 'Tracez la lettre Kāf (le crochet et la petite hampe interne).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Kāf" (K léger) ?', options: ['ل', 'ك', 'ق', 'ف'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ق',
        name: 'Qāf (Emphatique)',
        instruction: 'La lettre Qāf est l\'emphatique du Kāf, articulée plus loin dans la gorge (uvulaire).',
        sound: 'Qa',
        illustration: '🌙',
        mnemonic: 'قَمَر (Qamar - Lune)'
      },
      { type: 'trace', letter: 'ق', instruction: 'Tracez la lettre Qāf (le corps rond avec les deux points).' },
      { type: 'qcm', instruction: 'Trouvez la lettre emphatique "Qāf" parmi ces propositions.', options: ['ف', 'ق', 'ك', 'غ'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ح',
        name: 'Ḥāʼ (Gutturale légère)',
        instruction: 'La lettre Ḥāʼ vient du fond de la gorge, un souffle chaud et léger.',
        sound: 'Ha',
        illustration: '🐴',
        mnemonic: 'حِصَان (Ḥiṣān - Cheval)'
      },
      { type: 'trace', letter: 'ح', instruction: 'Tracez la lettre Ḥāʼ (la boucle ouverte, sans point).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Ḥāʼ" ?', options: ['ج', 'ح', 'خ', 'ع'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ه',
        name: 'Hāʼ (Gutturale légère)',
        instruction: 'La lettre Hāʼ est un simple souffle, la plus légère des gutturales.',
        sound: 'Ha (aspiré)',
        illustration: '🌒',
        mnemonic: 'هِلَال (Hilāl - Croissant de lune)'
      },
      { type: 'trace', letter: 'ه', instruction: 'Tracez la lettre Hāʼ (les deux boucles reliées).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Hāʼ" ?', options: ['ح', 'ه', 'خ', 'ة'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ث',
        name: 'Thāʼ (Légère)',
        instruction: 'La lettre Thāʼ, comme le "th" anglais de "think".',
        sound: 'Tha',
        illustration: '🦊',
        mnemonic: 'ثَعْلَب (Thaʻlab - Renard)'
      },
      { type: 'trace', letter: 'ث', instruction: 'Tracez la lettre Thāʼ (comme Tāʼ, avec trois points).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Thāʼ" ?', options: ['ت', 'ث', 'ب', 'ن'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ز',
        name: 'Zāy (Légère)',
        instruction: 'La lettre Zāy, un "z" sifflant et léger.',
        sound: 'Za',
        illustration: '🌸',
        mnemonic: 'زَهْرَة (Zahra - Fleur)'
      },
      { type: 'trace', letter: 'ز', instruction: 'Tracez la lettre Zāy (comme Rāʼ, avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Zāy" ?', options: ['ر', 'ز', 'و', 'ذ'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 3 terminée ! Alphabet Qaïda : 14 lettres maîtrisées. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'خ',
        name: 'Khāʼ (Gutturale rauque)',
        instruction: 'La lettre Khāʼ vient du fond de la gorge, un raclement sec, comme le "j" espagnol.',
        sound: 'Kha',
        illustration: '🍞',
        mnemonic: 'خُبْز (Khubz - Pain)'
      },
      { type: 'trace', letter: 'خ', instruction: 'Tracez la lettre Khāʼ (comme Ḥāʼ, avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Khāʼ" ?', options: ['ح', 'خ', 'ج', 'ه'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'غ',
        name: 'Ghayn (Gutturale roulée)',
        instruction: 'La lettre Ghayn est la version voisée (sonore) du Khāʼ, comme le "r" grasseyé français.',
        sound: 'Gha',
        illustration: '🦅',
        mnemonic: 'غُرَاب (Ghurāb - Corbeau)'
      },
      { type: 'trace', letter: 'غ', instruction: 'Tracez la lettre Ghayn (comme ʿAyn, avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Trouvez la lettre "Ghayn" parmi ces propositions.', options: ['ع', 'غ', 'ف', 'ق'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ع',
        name: 'ʿAyn (Gutturale profonde)',
        instruction: 'La lettre ʿAyn se prononce en resserrant le fond de la gorge. C\'est la plus profonde des lettres.',
        sound: 'ʿAyn',
        illustration: '👁️',
        mnemonic: 'عَيْن (ʿAyn - Œil)'
      },
      { type: 'trace', letter: 'ع', instruction: 'Tracez la lettre ʿAyn (la boucle ouverte vers le bas).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "ʿAyn" ?', options: ['غ', 'ع', 'ح', 'خ'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ش',
        name: 'Shīn (Sifflante légère)',
        instruction: 'La lettre Shīn est le "ch" français, une sifflante légère avec trois points.',
        sound: 'Sha',
        illustration: '🌞',
        mnemonic: 'شَمْس (Shams - Soleil)'
      },
      { type: 'trace', letter: 'ش', instruction: 'Tracez la lettre Shīn (comme Sīn, avec trois points au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Shīn" ?', options: ['س', 'ش', 'ص', 'ث'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ج',
        name: 'Jīm (Affriquée)',
        instruction: 'La lettre Jīm se prononce comme le "j" anglais de "job", un son bref et plein.',
        sound: 'Ja',
        illustration: '🐫',
        mnemonic: 'جَمَل (Jamal - Chameau)'
      },
      { type: 'trace', letter: 'ج', instruction: 'Tracez la lettre Jīm (la boucle profonde avec un point en dessous).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Jīm" ?', options: ['ح', 'خ', 'ج', 'ح'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 4 terminée ! Les gutturales profondes n\'ont plus de secret pour vous. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'ب',
        name: 'Bāʼ (Labiale légère)',
        instruction: 'La lettre Bāʼ se prononce en fermant les lèvres, comme le "b" français.',
        sound: 'Ba',
        illustration: '🦆',
        mnemonic: 'بَطَّة (Baṭṭa - Canard)'
      },
      { type: 'trace', letter: 'ب', instruction: 'Tracez la lettre Bāʼ (la coupe avec un point en dessous).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Bāʼ" ?', options: ['ت', 'ث', 'ب', 'ن'], correctIndex: 2, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ف',
        name: 'Fāʼ (Labio-dentale)',
        instruction: 'La lettre Fāʼ se prononce en posant les dents du haut sur la lèvre inférieure, comme le "f" français.',
        sound: 'Fa',
        illustration: '🐘',
        mnemonic: 'فِيل (Fīl - Éléphant)'
      },
      { type: 'trace', letter: 'ف', instruction: 'Tracez la lettre Fāʼ (le cercle avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Fāʼ" ?', options: ['ق', 'ف', 'و', 'غ'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ر',
        name: 'Rāʼ (Roulée)',
        instruction: 'La lettre Rāʼ est roulée avec le bout de la langue, comme le "r" espagnol ou italien.',
        sound: 'Ra',
        illustration: '🐒',
        mnemonic: 'رَجُل (Rajul - Homme)'
      },
      { type: 'trace', letter: 'ر', instruction: 'Tracez la lettre Rāʼ (un crochet courbé, sans point).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Rāʼ" ?', options: ['ز', 'ر', 'و', 'د'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ل',
        name: 'Lām (Latérale légère)',
        instruction: 'La lettre Lām se prononce en posant le bout de la langue contre le palais, comme le "l" français.',
        sound: 'La',
        illustration: '🦁',
        mnemonic: 'لَيْث (Layth - Lion)'
      },
      { type: 'trace', letter: 'ل', instruction: 'Tracez la lettre Lām (une hampe verticale avec une petite courbe).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Lām" ?', options: ['ك', 'ل', 'ا', 'إ'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 5 terminée ! Les labiales et la roulée maîtrisées. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'م',
        name: 'Mīm (Nasale labiale)',
        instruction: 'La lettre Mīm se prononce lèvres fermées avec résonance nasale, comme le "m" français.',
        sound: 'Ma',
        illustration: '💧',
        mnemonic: 'مَاء (Māʼ - Eau)'
      },
      { type: 'trace', letter: 'م', instruction: 'Tracez la lettre Mīm (le petit cercle plein).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Mīm" ?', options: ['ن', 'م', 'ه', 'و'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ن',
        name: 'Nūn (Nasale dentale)',
        instruction: 'La lettre Nūn se prononce bout de langue contre le palais avec résonance nasale, comme le "n" français.',
        sound: 'Na',
        illustration: '🐝',
        mnemonic: 'نَحْلَة (Naḥla - Abeille)'
      },
      { type: 'trace', letter: 'ن', instruction: 'Tracez la lettre Nūn (la coupe avec un point au-dessus).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Nūn" ?', options: ['ب', 'ت', 'ن', 'ي'], correctIndex: 2, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'و',
        name: 'Wāw (Semi-voyelle)',
        instruction: 'La lettre Wāw se prononce lèvres arrondies, comme le "w" anglais ou un "ou" bref.',
        sound: 'Wa',
        illustration: '🌹',
        mnemonic: 'وَرْدَة (Warda - Rose)'
      },
      { type: 'trace', letter: 'و', instruction: 'Tracez la lettre Wāw (le cercle avec la queue courbée).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Wāw" ?', options: ['ف', 'و', 'ر', 'ق'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ي',
        name: 'Yāʼ (Semi-voyelle)',
        instruction: 'La lettre Yāʼ se prononce comme le "y" de "yaourt", proche d\'un "i" glissé.',
        sound: 'Ya',
        illustration: '🖐️',
        mnemonic: 'يَد (Yad - Main)'
      },
      { type: 'trace', letter: 'ي', instruction: 'Tracez la lettre Yāʼ (comme Bāʼ, avec deux points en dessous).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Yāʼ" ?', options: ['ب', 'ت', 'ث', 'ي'], correctIndex: 3, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'ا',
        name: 'Alif (Voyelle longue)',
        instruction: 'La lettre Alif est une simple hampe verticale : porteuse de la voyelle longue "ā".',
        sound: 'Alif',
        illustration: '🌴',
        mnemonic: 'أَسَد (Asad - Lion, avec Alif Hamza)'
      },
      { type: 'trace', letter: 'ا', instruction: 'Tracez la lettre Alif (une simple hampe droite, sans point).' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres est le "Alif" ?', options: ['ل', 'ا', 'ي', 'و'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 6 terminée ! Bravo, l\'alphabet arabe complet (28 lettres) est maîtrisé ! +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'بَ',
        name: 'Fatḥa (Voyelle A)',
        instruction: 'Le petit trait oblique au-dessus de la lettre se prononce "a" bref. بَ se lit "Ba".',
        sound: 'Ba',
        illustration: '🅰️',
        mnemonic: 'Une petite ligne penchée au-dessus = "a"'
      },
      { type: 'trace', letter: 'بَ', instruction: 'Tracez "Bā" avec la Fatḥa au-dessus.' },
      { type: 'qcm', instruction: 'Comment se prononce "بَ" ?', options: ['Bi', 'Ba', 'Bu', 'B'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'بِ',
        name: 'Kasra (Voyelle I)',
        instruction: 'Le petit trait oblique en dessous de la lettre se prononce "i" bref. بِ se lit "Bi".',
        sound: 'Bi',
        illustration: '🔻',
        mnemonic: 'Une ligne en dessous = "i"'
      },
      { type: 'trace', letter: 'بِ', instruction: 'Tracez "Bi" avec la Kasra en dessous.' },
      { type: 'qcm', instruction: 'Comment se prononce "بِ" ?', options: ['Ba', 'Bu', 'Bi', 'B'], correctIndex: 2, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'بُ',
        name: 'Ḍamma (Voyelle U)',
        instruction: 'La petite boucle au-dessus de la lettre se prononce "u" bref. بُ se lit "Bu".',
        sound: 'Bu',
        illustration: '🔵',
        mnemonic: 'Une petite virgule au-dessus = "u"'
      },
      { type: 'trace', letter: 'بُ', instruction: 'Tracez "Bu" avec la Ḍamma au-dessus.' },
      { type: 'qcm', instruction: 'Comment se prononce "بُ" ?', options: ['Bu', 'Bi', 'Ba', 'B'], correctIndex: 0, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 7 terminée ! Vous lisez maintenant les trois voyelles courtes (Fatḥa, Kasra, Ḍamma). +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'بْ',
        name: 'Sukūn (Absence de voyelle)',
        instruction: 'Le petit rond au-dessus indique qu\'il n\'y a pas de voyelle : on prononce juste la consonne, sèche. بْ se lit "B".',
        sound: 'B (sec)',
        illustration: '⭕',
        mnemonic: 'Un cercle vide = pas de voyelle'
      },
      { type: 'trace', letter: 'بْ', instruction: 'Tracez "B" avec le Sukūn au-dessus.' },
      { type: 'qcm', instruction: 'Que signifie le signe Sukūn (ْ) ?', options: ['Voyelle A', 'Absence de voyelle', 'Doublement', 'Voyelle U'], correctIndex: 1, textStyle: 'text-3xl' },
      {
        type: 'intro',
        letter: 'بّ',
        name: 'Shadda (Doublement)',
        instruction: 'Le petit signe en forme de "w" au-dessus double la consonne : بّ se prononce comme un "b" tenu deux fois plus longtemps.',
        sound: 'Bb',
        illustration: '👯',
        mnemonic: 'Comme une consonne redoublée'
      },
      { type: 'trace', letter: 'بّ', instruction: 'Tracez "B" avec la Shadda au-dessus.' },
      { type: 'qcm', instruction: 'Que signifie la Shadda (ّ) ?', options: ['Absence de voyelle', 'Voyelle longue', 'Doublement de la consonne', 'Fin de mot'], correctIndex: 2, textStyle: 'text-3xl' },
      { type: 'qcm', instruction: 'Comment se lit "دَّ" (Dāl + Shadda + Fatḥa) ?', options: ['Da', 'Dda', 'Dad', 'Ad'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 8 terminée ! Sukūn et Shadda n\'ont plus de secret pour vous. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'بً',
        name: 'Tanwīn Fatḥ',
        instruction: 'Deux traits obliques au-dessus = un "an" bref en fin de mot (souvent avec un Alif de soutien). بًا se lit "Ban".',
        sound: 'Ban',
        illustration: '🔤',
        mnemonic: 'Fatḥa doublée = "an"'
      },
      { type: 'trace', letter: 'بً', instruction: 'Tracez "Ban" avec le Tanwīn Fatḥ.' },
      { type: 'qcm', instruction: 'Comment se prononce "بً" ?', options: ['Bin', 'Bun', 'Ban', 'Ba'], correctIndex: 2, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'بٍ',
        name: 'Tanwīn Kasr',
        instruction: 'Deux traits obliques sous la lettre = un "in" bref en fin de mot. بٍ se lit "Bin".',
        sound: 'Bin',
        illustration: '🔤',
        mnemonic: 'Kasra doublée = "in"'
      },
      { type: 'trace', letter: 'بٍ', instruction: 'Tracez "Bin" avec le Tanwīn Kasr.' },
      { type: 'qcm', instruction: 'Comment se prononce "بٍ" ?', options: ['Ban', 'Bin', 'Bun', 'Bi'], correctIndex: 1, textStyle: 'text-5xl' },
      {
        type: 'intro',
        letter: 'بٌ',
        name: 'Tanwīn Ḍamm',
        instruction: 'Deux petites boucles au-dessus = un "un" bref en fin de mot. بٌ se lit "Bun".',
        sound: 'Bun',
        illustration: '🔤',
        mnemonic: 'Ḍamma doublée = "un"'
      },
      { type: 'trace', letter: 'بٌ', instruction: 'Tracez "Bun" avec le Tanwīn Ḍamm.' },
      { type: 'qcm', instruction: 'Comment se prononce "بٌ" ?', options: ['Ban', 'Bin', 'Bun', 'Bu'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 9 terminée ! Le système complet des harakat est maîtrisé : vous pouvez lire n\'importe quel mot du Qaïda avec ses voyelles. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'الشَّمْس',
        name: 'Lettre solaire (Ash-Shams)',
        instruction: 'Devant une lettre solaire, le "ل" de "al-" ne se prononce pas : il s\'assimile et la lettre suivante double. "الشمس" se lit "Ash-Shams", pas "Al-Shams".',
        sound: 'Ash-Shams',
        illustration: '☀️',
        mnemonic: 'Le "ل" disparaît à l\'oral'
      },
      { type: 'trace', letter: 'الشَّمْس', instruction: 'Tracez "Ash-Shams" (remarquez la Shadda qui remplace le Lām).' },
      { type: 'qcm', instruction: 'Comment se lit "الرَّحْمَٰن" ?', options: ['Al-Raḥmān', 'Ar-Raḥmān', 'Ala-Raḥmān', 'Ral-Aḥmān'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'الْقَمَر',
        name: 'Lettre lunaire (Al-Qamar)',
        instruction: 'Devant une lettre lunaire, le "ل" de "al-" se prononce normalement, avec un Sukūn. "القمر" se lit "Al-Qamar".',
        sound: 'Al-Qamar',
        illustration: '🌙',
        mnemonic: 'Le "ل" se prononce clairement'
      },
      { type: 'trace', letter: 'الْقَمَر', instruction: 'Tracez "Al-Qamar" (le Lām garde son Sukūn, bien visible).' },
      { type: 'qcm', instruction: 'Comment se lit "الْكِتَاب" (Le Livre) ?', options: ['Ak-Kitāb', 'Al-Kitāb', 'Akitāb', 'Alik-Tāb'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 10 terminée ! Vous distinguez les lettres solaires et lunaires (الشمسية والقمرية). +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'قَالَ',
        name: 'Madd par Alif',
        instruction: 'Un Alif (ا) placé après une Fatḥa allonge le son "a" : قَالَ se lit "Qāla", avec un "a" nettement plus long que dans قَلَ.',
        sound: 'Qāla',
        illustration: '➖',
        mnemonic: 'Fatḥa + Alif = "ā" long'
      },
      { type: 'trace', letter: 'قَالَ', instruction: 'Tracez "Qāla" (remarquez l\'Alif après le Qāf).' },
      { type: 'qcm', instruction: 'Comment se prononce "قَالَ" avec le Madd ?', options: ['Qala (bref)', 'Qāla (long)', 'Qila', 'Qula'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'يَقُولُ',
        name: 'Madd par Wāw',
        instruction: 'Un Wāw (و) placé après une Ḍamma allonge le son "u" : يَقُولُ se lit "Yaqūlu", avec un "u" nettement plus long.',
        sound: 'Yaqūlu',
        illustration: '➖',
        mnemonic: 'Ḍamma + Wāw = "ū" long'
      },
      { type: 'trace', letter: 'يَقُولُ', instruction: 'Tracez "Yaqūlu" (remarquez le Wāw après le Qāf).' },
      { type: 'qcm', instruction: 'Comment se prononce "يَقُولُ" avec le Madd ?', options: ['Yaqulu (bref)', 'Yaqūlu (long)', 'Yaqila', 'Yaqola'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'فِيهِ',
        name: 'Madd par Yāʼ',
        instruction: 'Un Yāʼ (ي) placé après une Kasra allonge le son "i" : فِيهِ se lit "Fīhi", avec un "i" nettement plus long.',
        sound: 'Fīhi',
        illustration: '➖',
        mnemonic: 'Kasra + Yāʼ = "ī" long'
      },
      { type: 'trace', letter: 'فِيهِ', instruction: 'Tracez "Fīhi" (remarquez le Yāʼ après le Fāʼ).' },
      { type: 'qcm', instruction: 'Comment se prononce "فِيهِ" avec le Madd ?', options: ['Fihi (bref)', 'Fīhi (long)', 'Faihi', 'Fahi'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 11 terminée ! Les trois lettres de Madd (ا و ي) n\'ont plus de secret : vous savez allonger les voyelles longues. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'أَحْمَد',
        name: 'Hamzat al-Qaṭʻ (Fixe)',
        instruction: 'La Hamzat al-Qaṭʻ (أ) est toujours prononcée, en début comme en milieu de phrase. Elle porte sa propre voyelle, comme dans أَحْمَد (Aḥmad).',
        sound: 'Aḥmad',
        illustration: '✋',
        mnemonic: 'Elle "coupe" toujours le son, jamais silencieuse'
      },
      { type: 'trace', letter: 'أَ', instruction: 'Tracez la Hamzat al-Qaṭʻ (le petit crochet posé sur l\'Alif).' },
      { type: 'qcm', instruction: 'La Hamzat al-Qaṭʻ (أ) est-elle toujours prononcée ?', options: ['Oui, toujours', 'Jamais', 'Seulement en fin de mot', 'Seulement au milieu'], correctIndex: 0, textStyle: 'text-lg' },
      {
        type: 'intro',
        letter: 'ٱلْكِتَاب',
        name: 'Hamzat al-Waṣl (De liaison)',
        instruction: 'La Hamzat al-Waṣl (ٱ) ne se prononce qu\'au tout début de la lecture. Au milieu d\'une phrase, elle disparaît et on enchaîne directement : بِسْمِ ٱللَّٰه se lit "Bismillāh", pas "Bismi Allāh".',
        sound: 'Al-Kitāb',
        illustration: '🔗',
        mnemonic: 'Elle "lie" les mots, silencieuse en cours de phrase'
      },
      { type: 'trace', letter: 'ٱ', instruction: 'Tracez la Hamzat al-Waṣl (le petit ṣād au-dessus de l\'Alif).' },
      { type: 'qcm', instruction: 'Quand la Hamzat al-Waṣl (ٱ) se prononce-t-elle ?', options: ['Toujours', 'Jamais', 'Seulement en début de lecture', 'Seulement en fin de mot'], correctIndex: 2, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 12 terminée ! Vous distinguez Hamzat al-Qaṭʻ et Hamzat al-Waṣl. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'مَدْرَسَة',
        name: 'Tāʼ Marbūṭa (ة)',
        instruction: 'La Tāʼ Marbūṭa (ة) termine presque tous les mots féminins. En pause elle se lit "a", mais suivie d\'un mot elle redevient un "t" : مَدْرَسَة (Madrasa - école).',
        sound: 'Madrasa',
        illustration: '🏫',
        mnemonic: 'Deux points au-dessus d\'un Hāʼ = marque du féminin'
      },
      { type: 'trace', letter: 'ة', instruction: 'Tracez la Tāʼ Marbūṭa (comme un Hāʼ avec deux points).' },
      { type: 'qcm', instruction: 'Comment se lit la Tāʼ Marbūṭa (ة) en pause, à la fin d\'une phrase ?', options: ['T', 'A', 'H', 'AT'], correctIndex: 1, textStyle: 'text-3xl' },
      {
        type: 'intro',
        letter: 'عَلَى',
        name: 'Alif Maqṣūra (ى)',
        instruction: 'L\'Alif Maqṣūra (ى) est un alif écrit sous la forme d\'un yāʼ sans points, en fin de mot. Il se prononce comme un simple "ā" long : عَلَى (ʻAlā - sur).',
        sound: 'ʻAlā',
        illustration: '📏',
        mnemonic: 'Un Yāʼ sans points = un Alif caché'
      },
      { type: 'trace', letter: 'ى', instruction: 'Tracez l\'Alif Maqṣūra (comme un Yāʼ, mais sans les deux points).' },
      { type: 'qcm', instruction: 'Comment se prononce l\'Alif Maqṣūra (ى) en fin de mot ?', options: ['Comme un "y"', 'Comme un "ā" long', 'Il est muet', 'Comme un "n"'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 13 terminée ! Tāʼ Marbūṭa et Alif Maqṣūra n\'ont plus de secret. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'كَتَبَ',
        name: 'Lecture syllabique : Kataba',
        instruction: 'Assemblons trois lettres voyellées pour lire un mot complet : كَ-تَ-بَ (Ka-ta-ba) donne كَتَبَ, "il a écrit". Chaque syllabe s\'enchaîne sans pause.',
        sound: 'Kataba',
        illustration: '✍️',
        mnemonic: 'Kāf + Tāʼ + Bāʼ, chacune avec Fatḥa'
      },
      { type: 'trace', letter: 'كَتَبَ', instruction: 'Tracez "Kataba" lettre par lettre, en gardant chaque Fatḥa.' },
      { type: 'qcm', instruction: 'Comment se lit "كَتَبَ" (Kāf-Fatḥa, Tāʼ-Fatḥa, Bāʼ-Fatḥa) ?', options: ['Kutiba', 'Kataba', 'Kitab', 'Katiba'], correctIndex: 1, textStyle: 'text-3xl' },
      {
        type: 'intro',
        letter: 'مَكْتَب',
        name: 'Lecture syllabique : Maktab',
        instruction: 'Avec un Sukūn au milieu, la syllabe se ferme sans voyelle : مَكْ-تَب (Mak-tab) donne مَكْتَب, "bureau". Le Sukūn sur le Kāf coupe le son, sans allonger.',
        sound: 'Maktab',
        illustration: '🗄️',
        mnemonic: 'Mīm-Fatḥa, Kāf-Sukūn, Tāʼ-Fatḥa, Bāʼ'
      },
      { type: 'trace', letter: 'مَكْتَب', instruction: 'Tracez "Maktab", en marquant bien le Sukūn sur le Kāf.' },
      { type: 'qcm', instruction: 'Comment se lit "مَكْتَب" (Mīm-Fatḥa, Kāf-Sukūn, Tāʼ-Fatḥa, Bāʼ) ?', options: ['Makataba', 'Maktab', 'Miktab', 'Maktub'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 14 terminée ! Vous savez maintenant assembler des lettres voyellées en mots complets : le Qaïda est maîtrisé. +20 XP' }
    ]
  ];

  const quranLessons = [
    [
      {
         type: 'reading',
         instruction: 'Appuyez sur chaque mot pour l\'écouter et le traduire',
         verses: [{ surah: 1, ayah: 1 }],
         words: [
            { id: 'w1', text: 'بِسْمِ', root: null, trans: 'Au nom de' },
            { id: 'w2', text: 'ٱللَّهِ', root: 'A-L-H', trans: 'Dieu', translit: 'Allāh' },
            { id: 'w3', text: 'ٱلرَّحْمَـٰنِ', root: 'R-H-M', trans: 'Le Tout Miséricordieux', translit: 'Ar-Raḥmān' },
            { id: 'w4', text: 'ٱلرَّحِيمِ', root: 'R-H-M', trans: 'Le Très Miséricordieux', translit: 'Ar-Raḥīm' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez les syllabes lues pour former le mot ٱلرَّحِيمِ',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        leftCol: [{text: 'ال', id: 1}, {text: 'رَّحِ', id: 2}, {text: 'يمِ', id: 3}],
        rightCol: [{text: 'Ar-', id: 1}, {text: 'raḥī', id: 2}, {text: 'mi', id: 3}]
      },
      { type: 'success', instruction: 'Verset 1 d\'Al-Fatiha (la Basmala) validé ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Verset 2 : appuyez sur chaque mot pour le traduire',
         verses: [{ surah: 1, ayah: 2 }],
         words: [
            { id: 'w1', text: 'ٱلْحَمْدُ', root: 'H-M-D', trans: 'La louange' },
            { id: 'w2', text: 'لِلَّهِ', root: 'A-L-H', trans: 'appartient à Dieu' },
            { id: 'w3', text: 'رَبِّ', root: 'R-B-B', trans: 'Seigneur' },
            { id: 'w4', text: 'ٱلْعَالَمِينَ', root: null, trans: 'des mondes' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque mot à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'ٱلْحَمْدُ', id: 1}, {text: 'لِلَّهِ', id: 2}, {text: 'رَبِّ', id: 3}, {text: 'ٱلْعَالَمِينَ', id: 4}],
        rightCol: [{text: 'La louange', id: 1}, {text: 'à Dieu', id: 2}, {text: 'Seigneur', id: 3}, {text: 'des mondes', id: 4}]
      },
      { type: 'success', instruction: 'Verset 2 d\'Al-Fatiha validé ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Versets 3 et 4 : appuyez sur chaque mot pour le traduire',
         verses: [{ surah: 1, ayah: 3 }, { surah: 1, ayah: 4 }],
         words: [
            { id: 'w1', text: 'ٱلرَّحْمَـٰنِ', root: 'R-H-M', trans: 'Le Tout Miséricordieux' },
            { id: 'w2', text: 'ٱلرَّحِيمِ', root: 'R-H-M', trans: 'Le Très Miséricordieux' },
            { id: 'w3', text: 'مَالِكِ', root: null, trans: 'Maître' },
            { id: 'w4', text: 'يَوْمِ', root: 'Y-W-M', trans: 'du Jour' },
            { id: 'w5', text: 'ٱلدِّينِ', root: null, trans: 'de la Rétribution' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque mot à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'ٱلرَّحْمَـٰنِ', id: 1}, {text: 'ٱلرَّحِيمِ', id: 2}, {text: 'مَالِكِ', id: 3}, {text: 'يَوْمِ', id: 4}],
        rightCol: [{text: 'Le Tout Miséricordieux', id: 1}, {text: 'Le Très Miséricordieux', id: 2}, {text: 'Maître', id: 3}, {text: 'du Jour', id: 4}]
      },
      { type: 'success', instruction: 'Versets 3 et 4 d\'Al-Fatiha validés ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Verset 5 : appuyez sur chaque mot pour le traduire',
         verses: [{ surah: 1, ayah: 5 }],
         words: [
            { id: 'w1', text: 'إِيَّاكَ', root: null, trans: 'C\'est Toi (seul)' },
            { id: 'w2', text: 'نَعْبُدُ', root: 'A-B-D', trans: 'que nous adorons' },
            { id: 'w3', text: 'وَإِيَّاكَ', root: null, trans: 'et c\'est Toi (seul)' },
            { id: 'w4', text: 'نَسْتَعِينُ', root: null, trans: 'dont nous implorons secours' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque mot à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'إِيَّاكَ', id: 1}, {text: 'نَعْبُدُ', id: 2}, {text: 'وَإِيَّاكَ', id: 3}, {text: 'نَسْتَعِينُ', id: 4}],
        rightCol: [{text: 'C\'est Toi (seul)', id: 1}, {text: 'que nous adorons', id: 2}, {text: 'et c\'est Toi (seul)', id: 3}, {text: 'dont nous implorons secours', id: 4}]
      },
      { type: 'success', instruction: 'Verset 5 d\'Al-Fatiha validé ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Versets 6 et 7 : appuyez sur chaque groupe de mots pour le traduire',
         verses: [{ surah: 1, ayah: 6 }, { surah: 1, ayah: 7 }],
         words: [
            { id: 'w1', text: 'ٱهْدِنَا', root: null, trans: 'Guide-nous' },
            { id: 'w2', text: 'ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ', root: null, trans: 'vers le droit chemin' },
            { id: 'w3', text: 'صِرَاطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', root: null, trans: 'le chemin de ceux que Tu as comblés' },
            { id: 'w4', text: 'غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ', root: null, trans: 'non de ceux qui ont encouru Ta colère' },
            { id: 'w5', text: 'وَلَا ٱلضَّالِّينَ', root: null, trans: 'ni des égarés' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de mots à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'ٱهْدِنَا', id: 1}, {text: 'ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ', id: 2}, {text: 'غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ', id: 3}, {text: 'وَلَا ٱلضَّالِّينَ', id: 4}],
        rightCol: [{text: 'Guide-nous', id: 1}, {text: 'vers le droit chemin', id: 2}, {text: 'non de ceux qui ont encouru Ta colère', id: 3}, {text: 'ni des égarés', id: 4}]
      },
      { type: 'success', instruction: 'Al-Fatiha complétée ! Vous avez lu les 7 versets. +25 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Ikhlas : appuyez sur chaque groupe de mots pour le traduire',
         verses: [{ surah: 112, ayah: 1 }, { surah: 112, ayah: 2 }, { surah: 112, ayah: 3 }, { surah: 112, ayah: 4 }],
         words: [
            { id: 'w1', text: 'قُلْ', root: 'Q-W-L', trans: 'Dis' },
            { id: 'w2', text: 'هُوَ ٱللَّهُ أَحَدٌ', root: 'A-L-H', trans: 'Il est Dieu, Unique' },
            { id: 'w3', text: 'ٱللَّهُ ٱلصَّمَدُ', root: 'A-L-H', trans: 'Dieu, Le Seul à être imploré' },
            { id: 'w4', text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', root: null, trans: 'Il n\'a jamais engendré, ni n\'a été engendré' },
            { id: 'w5', text: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', root: null, trans: 'Et nul n\'est égal à Lui' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de mots à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'قُلْ', id: 1}, {text: 'هُوَ ٱللَّهُ أَحَدٌ', id: 2}, {text: 'ٱللَّهُ ٱلصَّمَدُ', id: 3}, {text: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', id: 4}],
        rightCol: [{text: 'Dis', id: 1}, {text: 'Il est Dieu, Unique', id: 2}, {text: 'Dieu, Le Seul à être imploré', id: 3}, {text: 'Et nul n\'est égal à Lui', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Ikhlas validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Falaq : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 113, ayah: 1 }, { surah: 113, ayah: 2 }, { surah: 113, ayah: 3 }, { surah: 113, ayah: 4 }, { surah: 113, ayah: 5 }],
         words: [
            { id: 'w1', text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', root: 'R-B-B', trans: 'Je cherche protection auprès du Seigneur de l\'aube naissante' },
            { id: 'w2', text: 'مِنْ شَرِّ مَا خَلَقَ', root: null, trans: 'contre le mal de ce qu\'Il a créé' },
            { id: 'w3', text: 'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ', root: null, trans: 'contre le mal de l\'obscurité quand elle s\'installe' },
            { id: 'w4', text: 'وَمِنْ شَرِّ ٱلنَّفَّاثَاتِ فِي ٱلْعُقَدِ', root: null, trans: 'contre le mal de celles qui soufflent sur les nœuds' },
            { id: 'w5', text: 'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', root: null, trans: 'contre le mal de l\'envieux quand il envie' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', id: 1}, {text: 'مِنْ شَرِّ مَا خَلَقَ', id: 2}, {text: 'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ', id: 3}, {text: 'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', id: 4}],
        rightCol: [{text: 'Je cherche protection auprès du Seigneur de l\'aube naissante', id: 1}, {text: 'contre le mal de ce qu\'Il a créé', id: 2}, {text: 'contre le mal de l\'obscurité quand elle s\'installe', id: 3}, {text: 'contre le mal de l\'envieux quand il envie', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Falaq validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate An-Nas : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 114, ayah: 1 }, { surah: 114, ayah: 2 }, { surah: 114, ayah: 3 }, { surah: 114, ayah: 4 }, { surah: 114, ayah: 5 }, { surah: 114, ayah: 6 }],
         words: [
            { id: 'w1', text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', root: 'R-B-B', trans: 'Je cherche protection auprès du Seigneur des hommes' },
            { id: 'w2', text: 'مَلِكِ ٱلنَّاسِ', root: null, trans: 'Le Souverain des hommes' },
            { id: 'w3', text: 'إِلَٰهِ ٱلنَّاسِ', root: 'A-L-H', trans: 'Le Dieu des hommes' },
            { id: 'w4', text: 'مِنْ شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', root: null, trans: 'contre le mal du mauvais conseiller furtif' },
            { id: 'w5', text: 'ٱلَّذِي يُوَسْوِسُ فِي صُدُورِ ٱلنَّاسِ', root: null, trans: 'qui souffle le mal dans les poitrines des hommes' },
            { id: 'w6', text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', root: null, trans: 'qu\'il soit des djinns ou des hommes' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', id: 1}, {text: 'مَلِكِ ٱلنَّاسِ', id: 2}, {text: 'إِلَٰهِ ٱلنَّاسِ', id: 3}, {text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', id: 4}],
        rightCol: [{text: 'Je cherche protection auprès du Seigneur des hommes', id: 1}, {text: 'Le Souverain des hommes', id: 2}, {text: 'Le Dieu des hommes', id: 3}, {text: 'qu\'il soit des djinns ou des hommes', id: 4}]
      },
      { type: 'success', instruction: 'Sourate An-Nas validée ! +25 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Kawthar : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 108, ayah: 1 }, { surah: 108, ayah: 2 }, { surah: 108, ayah: 3 }],
         words: [
            { id: 'w1', text: 'إِنَّا أَعْطَيْنَاكَ ٱلْكَوْثَرَ', root: null, trans: 'Certes, Nous t\'avons accordé l\'Abondance (Al-Kawthar)' },
            { id: 'w2', text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', root: 'R-B-B', trans: 'Accomplis donc la prière pour ton Seigneur, et sacrifie' },
            { id: 'w3', text: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ', root: null, trans: 'Celui qui te hait sera certes sans postérité' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        leftCol: [{text: 'إِنَّا أَعْطَيْنَاكَ ٱلْكَوْثَرَ', id: 1}, {text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', id: 2}, {text: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ', id: 3}],
        rightCol: [{text: 'Certes, Nous t\'avons accordé l\'Abondance', id: 1}, {text: 'Accomplis la prière pour ton Seigneur, et sacrifie', id: 2}, {text: 'Celui qui te hait sera sans postérité', id: 3}]
      },
      { type: 'success', instruction: 'Sourate Al-Kawthar validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-ʻAsr : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 103, ayah: 1 }, { surah: 103, ayah: 2 }, { surah: 103, ayah: 3 }],
         words: [
            { id: 'w1', text: 'وَٱلْعَصْرِ', root: null, trans: 'Par le Temps !' },
            { id: 'w2', text: 'إِنَّ ٱلْإِنسَانَ لَفِي خُسْرٍ', root: null, trans: 'L\'homme est certes en perdition' },
            { id: 'w3', text: 'إِلَّا ٱلَّذِينَ آمَنُوا وَعَمِلُوا ٱلصَّالِحَاتِ وَتَوَاصَوْا بِٱلْحَقِّ وَتَوَاصَوْا بِٱلصَّبْرِ', root: null, trans: 'sauf ceux qui croient, accomplissent les bonnes œuvres, se recommandent mutuellement la vérité et se recommandent mutuellement l\'endurance' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        leftCol: [{text: 'وَٱلْعَصْرِ', id: 1}, {text: 'إِنَّ ٱلْإِنسَانَ لَفِي خُسْرٍ', id: 2}, {text: 'إِلَّا ٱلَّذِينَ آمَنُوا وَعَمِلُوا ٱلصَّالِحَاتِ', id: 3}],
        rightCol: [{text: 'Par le Temps !', id: 1}, {text: 'L\'homme est certes en perdition', id: 2}, {text: 'sauf ceux qui croient et font le bien', id: 3}]
      },
      { type: 'success', instruction: 'Sourate Al-ʻAsr validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Quraysh : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 106, ayah: 1 }, { surah: 106, ayah: 2 }, { surah: 106, ayah: 3 }, { surah: 106, ayah: 4 }],
         words: [
            { id: 'w1', text: 'لِإِيلَافِ قُرَيْشٍ', root: null, trans: 'Pour l\'accoutumance des Quraysh' },
            { id: 'w2', text: 'إِيلَافِهِمْ رِحْلَةَ ٱلشِّتَاءِ وَٱلصَّيْفِ', root: null, trans: 'leur accoutumance au voyage d\'hiver et d\'été' },
            { id: 'w3', text: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا ٱلْبَيْتِ', root: 'A-B-D', trans: 'Qu\'ils adorent donc le Seigneur de cette Maison' },
            { id: 'w4', text: 'ٱلَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ', root: null, trans: 'qui les a nourris contre la faim et rassurés de la peur' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'لِإِيلَافِ قُرَيْشٍ', id: 1}, {text: 'إِيلَافِهِمْ رِحْلَةَ ٱلشِّتَاءِ وَٱلصَّيْفِ', id: 2}, {text: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا ٱلْبَيْتِ', id: 3}, {text: 'ٱلَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ', id: 4}],
        rightCol: [{text: 'Pour l\'accoutumance des Quraysh', id: 1}, {text: 'leur voyage d\'hiver et d\'été', id: 2}, {text: 'Qu\'ils adorent le Seigneur de cette Maison', id: 3}, {text: 'qui les a nourris et rassurés de la peur', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Quraysh validée ! +25 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Fīl : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 105, ayah: 1 }, { surah: 105, ayah: 2 }, { surah: 105, ayah: 3 }, { surah: 105, ayah: 4 }, { surah: 105, ayah: 5 }],
         words: [
            { id: 'w1', text: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ ٱلْفِيلِ', root: 'R-B-B', trans: 'N\'as-tu pas vu comment ton Seigneur a agi envers les gens de l\'Éléphant ?' },
            { id: 'w2', text: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ', root: null, trans: 'N\'a-t-Il pas réduit leur stratagème à néant ?' },
            { id: 'w3', text: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ', root: null, trans: 'Et envoyé sur eux des oiseaux par volées' },
            { id: 'w4', text: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ', root: null, trans: 'qui leur lançaient des pierres d\'argile durcie' },
            { id: 'w5', text: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ', root: null, trans: 'et Il les a rendus semblables à une paille mâchée' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ ٱلْفِيلِ', id: 1}, {text: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ', id: 2}, {text: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ', id: 3}, {text: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ', id: 4}],
        rightCol: [{text: 'Comment ton Seigneur a agi envers les gens de l\'Éléphant', id: 1}, {text: 'Il envoya sur eux des oiseaux par volées', id: 2}, {text: 'qui leur lançaient des pierres d\'argile durcie', id: 3}, {text: 'semblables à une paille mâchée', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Fīl validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Humaza : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 104, ayah: 1 }, { surah: 104, ayah: 2 }, { surah: 104, ayah: 3 }, { surah: 104, ayah: 4 }, { surah: 104, ayah: 5 }, { surah: 104, ayah: 6 }, { surah: 104, ayah: 7 }, { surah: 104, ayah: 8 }, { surah: 104, ayah: 9 }],
         words: [
            { id: 'w1', text: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ', root: null, trans: 'Malheur à tout calomniateur diffamateur' },
            { id: 'w2', text: 'ٱلَّذِي جَمَعَ مَالًا وَعَدَّدَهُ', root: null, trans: 'qui amasse une fortune et la compte' },
            { id: 'w3', text: 'يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ', root: null, trans: 'pensant que sa fortune l\'immortalisera' },
            { id: 'w4', text: 'كَلَّا لَيُنۢبَذَنَّ فِى ٱلْحُطَمَةِ', root: null, trans: 'Non ! Il sera certes jeté dans le Brasier' },
            { id: 'w5', text: 'وَمَآ أَدْرَىٰكَ مَا ٱلْحُطَمَةُ', root: null, trans: 'Et qui te fera savoir ce qu\'est le Brasier ?' },
            { id: 'w6', text: 'نَارُ ٱللَّهِ ٱلْمُوقَدَةُ ٱلَّتِى تَطَّلِعُ عَلَى ٱلْأَفْـِٔدَةِ', root: 'A-L-H', trans: 'Le Feu attisé d\'Allah, qui monte jusqu\'aux cœurs' },
            { id: 'w7', text: 'إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌ فِى عَمَدٍ مُّمَدَّدَةٍۭ', root: null, trans: 'Il se refermera sur eux en colonnes étendues' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ', id: 1}, {text: 'يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ', id: 2}, {text: 'كَلَّا لَيُنۢبَذَنَّ فِى ٱلْحُطَمَةِ', id: 3}, {text: 'نَارُ ٱللَّهِ ٱلْمُوقَدَةُ', id: 4}],
        rightCol: [{text: 'Malheur à tout calomniateur diffamateur', id: 1}, {text: 'pensant que sa fortune l\'immortalisera', id: 2}, {text: 'Il sera jeté dans le Brasier', id: 3}, {text: 'Le Feu attisé d\'Allah', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Humaza validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Māʻūn : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 107, ayah: 1 }, { surah: 107, ayah: 2 }, { surah: 107, ayah: 3 }, { surah: 107, ayah: 4 }, { surah: 107, ayah: 5 }, { surah: 107, ayah: 6 }, { surah: 107, ayah: 7 }],
         words: [
            { id: 'w1', text: 'أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ', root: null, trans: 'As-tu vu celui qui traite de mensonge la Rétribution ?' },
            { id: 'w2', text: 'فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ', root: null, trans: 'C\'est celui qui repousse l\'orphelin et n\'incite pas à nourrir le pauvre' },
            { id: 'w3', text: 'فَوَيْلٌ لِّلْمُصَلِّينَ ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ', root: null, trans: 'Malheur à ceux qui prient tout en étant distraits de leur prière' },
            { id: 'w4', text: 'ٱلَّذِينَ هُمْ يُرَآءُونَ وَيَمْنَعُونَ ٱلْمَاعُونَ', root: null, trans: 'qui sont pleins d\'ostentation et refusent l\'entraide' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ', id: 1}, {text: 'فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ', id: 2}, {text: 'فَوَيْلٌ لِّلْمُصَلِّينَ', id: 3}, {text: 'وَيَمْنَعُونَ ٱلْمَاعُونَ', id: 4}],
        rightCol: [{text: 'As-tu vu celui qui traite de mensonge la Rétribution', id: 1}, {text: 'C\'est celui qui repousse l\'orphelin', id: 2}, {text: 'Malheur à ceux qui prient (avec négligence)', id: 3}, {text: 'et refusent l\'entraide', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Māʻūn validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Kāfirūn : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 109, ayah: 1 }, { surah: 109, ayah: 2 }, { surah: 109, ayah: 3 }, { surah: 109, ayah: 4 }, { surah: 109, ayah: 5 }, { surah: 109, ayah: 6 }],
         words: [
            { id: 'w1', text: 'قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ', root: 'Q-W-L', trans: 'Dis : Ô vous les dénégateurs !' },
            { id: 'w2', text: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ', root: 'A-B-D', trans: 'Je n\'adore pas ce que vous adorez' },
            { id: 'w3', text: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', root: 'A-B-D', trans: 'et vous n\'adorez pas ce que j\'adore' },
            { id: 'w4', text: 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', root: 'A-B-D', trans: 'Je ne suis pas adorateur de ce que vous avez adoré' },
            { id: 'w5', text: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', root: 'A-B-D', trans: 'et vous n\'êtes pas adorateurs de ce que j\'adore' },
            { id: 'w6', text: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ', root: null, trans: 'À vous votre religion, et à moi ma religion' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ', id: 1}, {text: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ', id: 2}, {text: 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', id: 3}, {text: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ', id: 4}],
        rightCol: [{text: 'Dis : Ô vous les dénégateurs !', id: 1}, {text: 'Je n\'adore pas ce que vous adorez', id: 2}, {text: 'Je ne suis pas adorateur de ce que vous avez adoré', id: 3}, {text: 'À vous votre religion, et à moi ma religion', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Kāfirūn validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate An-Naṣr : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 110, ayah: 1 }, { surah: 110, ayah: 2 }, { surah: 110, ayah: 3 }],
         words: [
            { id: 'w1', text: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', root: 'A-L-H', trans: 'Lorsque vient le secours d\'Allah, ainsi que la victoire' },
            { id: 'w2', text: 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا', root: 'A-L-H', trans: 'et que tu vois les gens entrer en foule dans la religion d\'Allah' },
            { id: 'w3', text: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ ۚ إِنَّهُۥ كَانَ تَوَّابًۢا', root: 'R-B-B', trans: 'glorifie ton Seigneur par Sa louange et implore Son pardon : Il est le Grand Accueillant au repentir' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        leftCol: [{text: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', id: 1}, {text: 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا', id: 2}, {text: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ', id: 3}],
        rightCol: [{text: 'Lorsque vient le secours d\'Allah et la victoire', id: 1}, {text: 'et que tu vois les gens entrer en foule dans la religion d\'Allah', id: 2}, {text: 'glorifie ton Seigneur et implore Son pardon', id: 3}]
      },
      { type: 'success', instruction: 'Sourate An-Naṣr validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Masad : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 111, ayah: 1 }, { surah: 111, ayah: 2 }, { surah: 111, ayah: 3 }, { surah: 111, ayah: 4 }, { surah: 111, ayah: 5 }],
         words: [
            { id: 'w1', text: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', root: null, trans: 'Que périssent les deux mains d\'Abū Lahab, et qu\'il périsse lui-même' },
            { id: 'w2', text: 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', root: null, trans: 'Sa fortune ne lui sert à rien, ni ce qu\'il a acquis' },
            { id: 'w3', text: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', root: null, trans: 'Il sera brûlé dans un Feu plein de flammes' },
            { id: 'w4', text: 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ', root: null, trans: 'de même sa femme, la porteuse de bois' },
            { id: 'w5', text: 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍ', root: null, trans: 'à son cou, une corde de fibres' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', id: 1}, {text: 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', id: 2}, {text: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', id: 3}, {text: 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍ', id: 4}],
        rightCol: [{text: 'Que périssent les deux mains d\'Abū Lahab', id: 1}, {text: 'Sa fortune ne lui sert à rien', id: 2}, {text: 'Il sera brûlé dans un Feu plein de flammes', id: 3}, {text: 'à son cou, une corde de fibres', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Masad validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Az-Zalzalah : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 99, ayah: 1 }, { surah: 99, ayah: 2 }, { surah: 99, ayah: 3 }, { surah: 99, ayah: 4 }, { surah: 99, ayah: 5 }, { surah: 99, ayah: 6 }, { surah: 99, ayah: 7 }, { surah: 99, ayah: 8 }],
         words: [
            { id: 'w1', text: 'إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا وَأَخْرَجَتِ ٱلْأَرْضُ أَثْقَالَهَا', root: null, trans: 'Quand la terre sera secouée de son séisme et fera sortir ses fardeaux' },
            { id: 'w2', text: 'وَقَالَ ٱلْإِنسَٰنُ مَا لَهَا', root: 'Q-W-L', trans: 'et que l\'homme dira : "Qu\'a-t-elle ?"' },
            { id: 'w3', text: 'يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا', root: 'R-B-B', trans: 'ce jour-là, elle contera son histoire, car ton Seigneur le lui aura inspiré' },
            { id: 'w4', text: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُۥ', root: 'A-M-L', trans: 'Quiconque fait un bien du poids d\'un atome le verra, et quiconque fait un mal du poids d\'un atome le verra' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا', id: 1}, {text: 'وَقَالَ ٱلْإِنسَٰنُ مَا لَهَا', id: 2}, {text: 'تُحَدِّثُ أَخْبَارَهَا', id: 3}, {text: 'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ', id: 4}],
        rightCol: [{text: 'Quand la terre sera secouée de son séisme', id: 1}, {text: 'l\'homme dira : "Qu\'a-t-elle ?"', id: 2}, {text: 'elle contera son histoire', id: 3}, {text: 'Quiconque fait un bien du poids d\'un atome le verra', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Az-Zalzalah validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-ʻĀdiyāt : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 100, ayah: 1 }, { surah: 100, ayah: 2 }, { surah: 100, ayah: 3 }, { surah: 100, ayah: 4 }, { surah: 100, ayah: 5 }, { surah: 100, ayah: 6 }, { surah: 100, ayah: 7 }, { surah: 100, ayah: 8 }, { surah: 100, ayah: 9 }, { surah: 100, ayah: 10 }, { surah: 100, ayah: 11 }],
         words: [
            { id: 'w1', text: 'وَٱلْعَٰدِيَٰتِ ضَبْحًا فَٱلْمُورِيَٰتِ قَدْحًا فَٱلْمُغِيرَٰتِ صُبْحًا', root: null, trans: 'Par les coursiers qui halètent, qui font jaillir des étincelles, qui attaquent au matin' },
            { id: 'w2', text: 'فَأَثَرْنَ بِهِۦ نَقْعًا فَوَسَطْنَ بِهِۦ جَمْعًا', root: null, trans: 'en soulevant un nuage de poussière, et pénètrent au centre de la troupe' },
            { id: 'w3', text: 'إِنَّ ٱلْإِنسَٰنَ لِرَبِّهِۦ لَكَنُودٌ وَإِنَّهُۥ عَلَىٰ ذَٰلِكَ لَشَهِيدٌ وَإِنَّهُۥ لِحُبِّ ٱلْخَيْرِ لَشَدِيدٌ', root: 'R-B-B', trans: 'l\'homme est ingrat envers son Seigneur, il en est lui-même témoin, et il est ardent dans l\'amour des biens' },
            { id: 'w4', text: 'أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِى ٱلْقُبُورِ وَحُصِّلَ مَا فِى ٱلصُّدُورِ إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍ لَّخَبِيرٌۢ', root: 'A-L-M', trans: 'Ne sait-il pas que ce qui est dans les tombes et les poitrines sera dévoilé ? Ce jour-là leur Seigneur sera parfaitement informé' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَٱلْعَٰدِيَٰتِ ضَبْحًا', id: 1}, {text: 'فَأَثَرْنَ بِهِۦ نَقْعًا', id: 2}, {text: 'إِنَّ ٱلْإِنسَٰنَ لِرَبِّهِۦ لَكَنُودٌ', id: 3}, {text: 'أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِى ٱلْقُبُورِ', id: 4}],
        rightCol: [{text: 'Par les coursiers qui halètent', id: 1}, {text: 'en soulevant un nuage de poussière', id: 2}, {text: 'l\'homme est ingrat envers son Seigneur', id: 3}, {text: 'Ne sait-il pas que ce qui est dans les tombes sera dévoilé', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-ʻĀdiyāt validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Qāriʻah : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 101, ayah: 1 }, { surah: 101, ayah: 2 }, { surah: 101, ayah: 3 }, { surah: 101, ayah: 4 }, { surah: 101, ayah: 5 }, { surah: 101, ayah: 6 }, { surah: 101, ayah: 7 }, { surah: 101, ayah: 8 }, { surah: 101, ayah: 9 }, { surah: 101, ayah: 10 }, { surah: 101, ayah: 11 }],
         words: [
            { id: 'w1', text: 'ٱلْقَارِعَةُ مَا ٱلْقَارِعَةُ وَمَآ أَدْرَىٰكَ مَا ٱلْقَارِعَةُ', root: null, trans: 'Le grand fracas ! Qu\'est-ce que le grand fracas ? Et qui te fera savoir ce qu\'il est ?' },
            { id: 'w2', text: 'يَوْمَ يَكُونُ ٱلنَّاسُ كَٱلْفَرَاشِ ٱلْمَبْثُوثِ وَتَكُونُ ٱلْجِبَالُ كَٱلْعِهْنِ ٱلْمَنفُوشِ', root: null, trans: 'Le jour où les gens seront comme des papillons éparpillés, et les montagnes comme de la laine cardée' },
            { id: 'w3', text: 'فَأَمَّا مَن ثَقُلَتْ مَوَٰزِينُهُۥ فَهُوَ فِى عِيشَةٍ رَّاضِيَةٍ وَأَمَّا مَنْ خَفَّتْ مَوَٰزِينُهُۥ فَأُمُّهُۥ هَاوِيَةٌ', root: null, trans: 'Celui dont la balance sera lourde vivra une vie agréable ; celui dont elle sera légère aura pour demeure l\'Abîme' },
            { id: 'w4', text: 'وَمَآ أَدْرَىٰكَ مَا هِيَهْ نَارٌ حَامِيَةٌۢ', root: null, trans: 'Et qui te fera savoir ce que c\'est ? Un Feu ardent' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'ٱلْقَارِعَةُ مَا ٱلْقَارِعَةُ', id: 1}, {text: 'يَوْمَ يَكُونُ ٱلنَّاسُ كَٱلْفَرَاشِ ٱلْمَبْثُوثِ', id: 2}, {text: 'فَأَمَّا مَن ثَقُلَتْ مَوَٰزِينُهُۥ', id: 3}, {text: 'نَارٌ حَامِيَةٌۢ', id: 4}],
        rightCol: [{text: 'Le grand fracas !', id: 1}, {text: 'Les gens seront comme des papillons éparpillés', id: 2}, {text: 'Celui dont la balance sera lourde', id: 3}, {text: 'Un Feu ardent', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Qāriʻah validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate At-Takāthur : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 102, ayah: 1 }, { surah: 102, ayah: 2 }, { surah: 102, ayah: 3 }, { surah: 102, ayah: 4 }, { surah: 102, ayah: 5 }, { surah: 102, ayah: 6 }, { surah: 102, ayah: 7 }, { surah: 102, ayah: 8 }],
         words: [
            { id: 'w1', text: 'أَلْهَىٰكُمُ ٱلتَّكَاثُرُ حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ', root: null, trans: 'La course aux richesses vous distrait, jusqu\'à ce que vous visitiez les tombes' },
            { id: 'w2', text: 'كَلَّا سَوْفَ تَعْلَمُونَ ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ كَلَّا لَوْ تَعْلَمُونَ عِلْمَ ٱلْيَقِينِ', root: null, trans: 'Non ! Bientôt vous saurez. Encore une fois, bientôt vous saurez. Si vous saviez avec une certitude parfaite' },
            { id: 'w3', text: 'لَتَرَوُنَّ ٱلْجَحِيمَ ثُمَّ لَتَرَوُنَّهَا عَيْنَ ٱلْيَقِينِ ثُمَّ لَتُسْـَٔلُنَّ يَوْمَئِذٍ عَنِ ٱلنَّعِيمِ', root: null, trans: 'Vous verriez certainement la Fournaise, puis vous la verrez avec l\'œil de la certitude, puis vous serez interrogés sur les délices' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }],
        leftCol: [{text: 'أَلْهَىٰكُمُ ٱلتَّكَاثُرُ', id: 1}, {text: 'كَلَّا سَوْفَ تَعْلَمُونَ', id: 2}, {text: 'لَتَرَوُنَّ ٱلْجَحِيمَ', id: 3}],
        rightCol: [{text: 'La course aux richesses vous distrait', id: 1}, {text: 'Non ! Bientôt vous saurez', id: 2}, {text: 'Vous verriez certainement la Fournaise', id: 3}]
      },
      { type: 'success', instruction: 'Sourate At-Takāthur validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-ʻAlaq (versets 1-5) : la première révélation',
         verses: [{ surah: 96, ayah: 1 }, { surah: 96, ayah: 2 }, { surah: 96, ayah: 3 }, { surah: 96, ayah: 4 }, { surah: 96, ayah: 5 }],
         words: [
            { id: 'w1', text: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ', root: 'K-L-Q', trans: 'Lis, au nom de ton Seigneur qui a créé' },
            { id: 'w2', text: 'خَلَقَ ٱلْإِنسَٰنَ مِنْ عَلَقٍ', root: 'K-L-Q', trans: 'qui a créé l\'homme d\'une adhérence' },
            { id: 'w3', text: 'ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ', root: 'R-B-B', trans: 'Lis ! Ton Seigneur est le Très Généreux' },
            { id: 'w4', text: 'ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ', root: 'A-L-M', trans: 'qui a enseigné par la plume' },
            { id: 'w5', text: 'عَلَّمَ ٱلْإِنسَٰنَ مَا لَمْ يَعْلَمْ', root: 'A-L-M', trans: 'a enseigné à l\'homme ce qu\'il ne savait pas' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ', id: 1}, {text: 'خَلَقَ ٱلْإِنسَٰنَ مِنْ عَلَقٍ', id: 2}, {text: 'ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ', id: 3}, {text: 'عَلَّمَ ٱلْإِنسَٰنَ مَا لَمْ يَعْلَمْ', id: 4}],
        rightCol: [{text: 'Lis, au nom de ton Seigneur qui a créé', id: 1}, {text: 'qui a créé l\'homme d\'une adhérence', id: 2}, {text: 'Ton Seigneur est le Très Généreux', id: 3}, {text: 'a enseigné à l\'homme ce qu\'il ne savait pas', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-ʻAlaq (1-5) validée ! Premiers versets révélés au Prophète ﷺ. +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Qadr : appuyez sur chaque verset pour le traduire',
         verses: [{ surah: 97, ayah: 1 }, { surah: 97, ayah: 2 }, { surah: 97, ayah: 3 }, { surah: 97, ayah: 4 }, { surah: 97, ayah: 5 }],
         words: [
            { id: 'w1', text: 'إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ', root: 'N-Z-L', trans: 'Nous l\'avons fait descendre pendant la Nuit du Destin (Laylat al-Qadr)' },
            { id: 'w2', text: 'وَمَآ أَدْرَىٰكَ مَا لَيْلَةُ ٱلْقَدْرِ', root: null, trans: 'Et qui te fera savoir ce qu\'est la Nuit du Destin ?' },
            { id: 'w3', text: 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', root: null, trans: 'La Nuit du Destin est meilleure que mille mois' },
            { id: 'w4', text: 'تَنَزَّلُ ٱلْمَلَٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ', root: 'N-Z-L', trans: 'Les anges et l\'Esprit y descendent, par la permission de leur Seigneur, pour tout ordre' },
            { id: 'w5', text: 'سَلَٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ', root: 'S-L-M', trans: 'Elle est paix et salut jusqu\'à l\'apparition de l\'aube' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque verset à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ', id: 1}, {text: 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', id: 2}, {text: 'تَنَزَّلُ ٱلْمَلَٰٓئِكَةُ وَٱلرُّوحُ فِيهَا', id: 3}, {text: 'سَلَٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ', id: 4}],
        rightCol: [{text: 'Nous l\'avons fait descendre pendant la Nuit du Destin', id: 1}, {text: 'La Nuit du Destin est meilleure que mille mois', id: 2}, {text: 'Les anges et l\'Esprit y descendent', id: 3}, {text: 'Elle est paix jusqu\'à l\'aube', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Qadr validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Ash-Sharḥ : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 94, ayah: 1 }, { surah: 94, ayah: 2 }, { surah: 94, ayah: 3 }, { surah: 94, ayah: 4 }, { surah: 94, ayah: 5 }, { surah: 94, ayah: 6 }, { surah: 94, ayah: 7 }, { surah: 94, ayah: 8 }],
         words: [
            { id: 'w1', text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ وَوَضَعْنَا عَنكَ وِزْرَكَ', root: null, trans: 'N\'avons-Nous pas ouvert pour toi ta poitrine et ne t\'avons-Nous pas déchargé de ton fardeau ?' },
            { id: 'w2', text: 'ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ وَرَفَعْنَا لَكَ ذِكْرَكَ', root: null, trans: 'qui pesait sur ton dos, et n\'avons-Nous pas élevé ta renommée ?' },
            { id: 'w3', text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', root: null, trans: 'Certes, avec la difficulté vient la facilité, certes avec la difficulté vient la facilité' },
            { id: 'w4', text: 'فَإِذَا فَرَغْتَ فَٱنصَبْ وَإِلَىٰ رَبِّكَ فَٱرْغَب', root: 'R-B-B', trans: 'Quand donc tu en as fini, œuvre encore, et à ton Seigneur aspire' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', id: 1}, {text: 'ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ', id: 2}, {text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', id: 3}, {text: 'وَإِلَىٰ رَبِّكَ فَٱرْغَب', id: 4}],
        rightCol: [{text: 'N\'avons-Nous pas ouvert pour toi ta poitrine ?', id: 1}, {text: 'qui pesait sur ton dos', id: 2}, {text: 'avec la difficulté vient la facilité', id: 3}, {text: 'et à ton Seigneur aspire', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Ash-Sharḥ validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Aḍ-Ḍuḥā : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 93, ayah: 1 }, { surah: 93, ayah: 2 }, { surah: 93, ayah: 3 }, { surah: 93, ayah: 4 }, { surah: 93, ayah: 5 }, { surah: 93, ayah: 6 }, { surah: 93, ayah: 7 }, { surah: 93, ayah: 8 }, { surah: 93, ayah: 9 }, { surah: 93, ayah: 10 }, { surah: 93, ayah: 11 }],
         words: [
            { id: 'w1', text: 'وَٱلضُّحَىٰ وَٱلَّيْلِ إِذَا سَجَىٰ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ', root: 'R-B-B', trans: 'Par le Jour montant et la nuit quand elle s\'assombrit ! Ton Seigneur ne t\'a ni abandonné ni détesté' },
            { id: 'w2', text: 'وَلَلْـَٔاخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ', root: 'R-B-B', trans: 'La vie future est meilleure pour toi que la vie présente ; ton Seigneur t\'accordera ce qui te satisfera' },
            { id: 'w3', text: 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ وَوَجَدَكَ ضَآلًّا فَهَدَىٰ وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ', root: 'H-D-Y', trans: 'Ne t\'a-t-Il pas trouvé orphelin, et Il t\'a accueilli ? Il t\'a trouvé égaré et t\'a guidé, pauvre et t\'a enrichi' },
            { id: 'w4', text: 'فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ وَأَمَّا ٱلسَّآئِلَ فَلَا تَنْهَرْ وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ', root: 'N-A-M', trans: 'Quant à l\'orphelin, ne le brime pas ; quant au demandeur, ne le repousse pas ; et du bienfait de ton Seigneur, parle' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَٱلضُّحَىٰ', id: 1}, {text: 'وَلَلْـَٔاخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ', id: 2}, {text: 'أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ', id: 3}, {text: 'فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ', id: 4}],
        rightCol: [{text: 'Par le Jour montant !', id: 1}, {text: 'La vie future est meilleure pour toi', id: 2}, {text: 'Ne t\'a-t-Il pas trouvé orphelin et accueilli ?', id: 3}, {text: 'Quant à l\'orphelin, ne le brime pas', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Aḍ-Ḍuḥā validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate At-Tīn : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 95, ayah: 1 }, { surah: 95, ayah: 2 }, { surah: 95, ayah: 3 }, { surah: 95, ayah: 4 }, { surah: 95, ayah: 5 }, { surah: 95, ayah: 6 }, { surah: 95, ayah: 7 }, { surah: 95, ayah: 8 }],
         words: [
            { id: 'w1', text: 'وَٱلتِّينِ وَٱلزَّيْتُونِ وَطُورِ سِينِينَ وَهَٰذَا ٱلْبَلَدِ ٱلْأَمِينِ', root: null, trans: 'Par le figuier et l\'olivier ! Par le Mont Sinaï ! Et par cette Cité sûre !' },
            { id: 'w2', text: 'لَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍ ثُمَّ رَدَدْنَٰهُ أَسْفَلَ سَٰفِلِينَ', root: 'K-L-Q', trans: 'Nous avons créé l\'homme dans la meilleure forme, puis Nous l\'avons ramené au plus bas des degrés' },
            { id: 'w3', text: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ', root: 'A-M-N', trans: 'sauf ceux qui croient et accomplissent de bonnes œuvres : ils auront une récompense jamais interrompue' },
            { id: 'w4', text: 'فَمَا يُكَذِّبُكَ بَعْدُ بِٱلدِّينِ أَلَيْسَ ٱللَّهُ بِأَحْكَمِ ٱلْحَٰكِمِينَ', root: 'H-K-M', trans: 'Qu\'est-ce qui te fait traiter de mensonge la Rétribution ? Allah n\'est-Il pas le plus juste des juges ?' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَٱلتِّينِ وَٱلزَّيْتُونِ', id: 1}, {text: 'لَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍ', id: 2}, {text: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ', id: 3}, {text: 'أَلَيْسَ ٱللَّهُ بِأَحْكَمِ ٱلْحَٰكِمِينَ', id: 4}],
        rightCol: [{text: 'Par le figuier et l\'olivier !', id: 1}, {text: 'Nous avons créé l\'homme dans la meilleure forme', id: 2}, {text: 'sauf ceux qui croient et font le bien', id: 3}, {text: 'Allah n\'est-Il pas le plus juste des juges ?', id: 4}]
      },
      { type: 'success', instruction: 'Sourate At-Tīn validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Ash-Shams (versets 1-10) : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 91, ayah: 1 }, { surah: 91, ayah: 2 }, { surah: 91, ayah: 3 }, { surah: 91, ayah: 4 }, { surah: 91, ayah: 5 }, { surah: 91, ayah: 6 }, { surah: 91, ayah: 7 }, { surah: 91, ayah: 8 }, { surah: 91, ayah: 9 }, { surah: 91, ayah: 10 }],
         words: [
            { id: 'w1', text: 'وَٱلشَّمْسِ وَضُحَىٰهَا وَٱلْقَمَرِ إِذَا تَلَىٰهَا وَٱلنَّهَارِ إِذَا جَلَّىٰهَا وَٱلَّيْلِ إِذَا يَغْشَىٰهَا', root: null, trans: 'Par le soleil et sa clarté ! Par la lune qui le suit ! Par le jour qui l\'éclaire ! Par la nuit qui l\'enveloppe !' },
            { id: 'w2', text: 'وَٱلسَّمَآءِ وَمَا بَنَىٰهَا وَٱلْأَرْضِ وَمَا طَحَىٰهَا', root: null, trans: 'Par le ciel et Celui qui l\'a construit ! Par la terre et Celui qui l\'a étalée !' },
            { id: 'w3', text: 'وَنَفْسٍ وَمَا سَوَّىٰهَا فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَىٰهَا', root: 'W-Q-Y', trans: 'Par l\'âme et Celui qui l\'a harmonieusement formée, et lui a inspiré son vice et sa piété !' },
            { id: 'w4', text: 'قَدْ أَفْلَحَ مَن زَكَّىٰهَا وَقَدْ خَابَ مَن دَسَّىٰهَا', root: 'Z-K-W', trans: 'Réussit celui qui la purifie ! Et échoue celui qui la corrompt !' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَٱلشَّمْسِ وَضُحَىٰهَا', id: 1}, {text: 'وَٱلسَّمَآءِ وَمَا بَنَىٰهَا', id: 2}, {text: 'وَنَفْسٍ وَمَا سَوَّىٰهَا', id: 3}, {text: 'قَدْ أَفْلَحَ مَن زَكَّىٰهَا', id: 4}],
        rightCol: [{text: 'Par le soleil et sa clarté !', id: 1}, {text: 'Par le ciel et Celui qui l\'a construit', id: 2}, {text: 'Par l\'âme et Celui qui l\'a formée', id: 3}, {text: 'Réussit celui qui la purifie', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Ash-Shams (1-10) validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Layl (versets 1-11) : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 92, ayah: 1 }, { surah: 92, ayah: 2 }, { surah: 92, ayah: 3 }, { surah: 92, ayah: 4 }, { surah: 92, ayah: 5 }, { surah: 92, ayah: 6 }, { surah: 92, ayah: 7 }, { surah: 92, ayah: 8 }, { surah: 92, ayah: 9 }, { surah: 92, ayah: 10 }, { surah: 92, ayah: 11 }],
         words: [
            { id: 'w1', text: 'وَٱلَّيْلِ إِذَا يَغْشَىٰ وَٱلنَّهَارِ إِذَا تَجَلَّىٰ وَمَا خَلَقَ ٱلذَّكَرَ وَٱلْأُنثَىٰٓ إِنَّ سَعْيَكُمْ لَشَتَّىٰ', root: 'K-L-Q', trans: 'Par la nuit qui enveloppe ! Par le jour qui éclaire ! Par ce qu\'Il a créé, le mâle et la femelle ! Vos efforts sont divers' },
            { id: 'w2', text: 'فَأَمَّا مَنْ أَعْطَىٰ وَٱتَّقَىٰ وَصَدَّقَ بِٱلْحُسْنَىٰ فَسَنُيَسِّرُهُۥ لِلْيُسْرَىٰ', root: 'W-Q-Y', trans: 'Quant à celui qui donne et craint Dieu, et croit en la plus belle récompense, Nous lui faciliterons la voie vers l\'aisance' },
            { id: 'w3', text: 'وَأَمَّا مَنۢ بَخِلَ وَٱسْتَغْنَىٰ وَكَذَّبَ بِٱلْحُسْنَىٰ فَسَنُيَسِّرُهُۥ لِلْعُسْرَىٰ', root: 'GH-N-Y', trans: 'Et quant à celui qui est avare et se dispense de Dieu, et traite de mensonge la plus belle récompense, Nous lui faciliterons la voie vers la difficulté' },
            { id: 'w4', text: 'وَمَا يُغْنِى عَنْهُ مَالُهُۥٓ إِذَا تَرَدَّىٰٓ', root: null, trans: 'Sa fortune ne lui servira à rien quand il sombrera' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'وَٱلَّيْلِ إِذَا يَغْشَىٰ', id: 1}, {text: 'فَأَمَّا مَنْ أَعْطَىٰ وَٱتَّقَىٰ', id: 2}, {text: 'وَأَمَّا مَنۢ بَخِلَ وَٱسْتَغْنَىٰ', id: 3}, {text: 'وَمَا يُغْنِى عَنْهُ مَالُهُۥٓ', id: 4}],
        rightCol: [{text: 'Par la nuit qui enveloppe !', id: 1}, {text: 'Celui qui donne et craint Dieu', id: 2}, {text: 'Celui qui est avare et se dispense de Dieu', id: 3}, {text: 'Sa fortune ne lui servira à rien', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Layl (1-11) validée ! +20 XP' }
    ],
    [
      {
         type: 'reading',
         instruction: 'Sourate Al-Bayyinah : appuyez sur chaque groupe de versets pour le traduire',
         verses: [{ surah: 98, ayah: 1 }, { surah: 98, ayah: 2 }, { surah: 98, ayah: 3 }, { surah: 98, ayah: 4 }, { surah: 98, ayah: 5 }, { surah: 98, ayah: 6 }, { surah: 98, ayah: 7 }, { surah: 98, ayah: 8 }],
         words: [
            { id: 'w1', text: 'لَمْ يَكُنِ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَٰبِ وَٱلْمُشْرِكِينَ مُنفَكِّينَ حَتَّىٰ تَأْتِيَهُمُ ٱلْبَيِّنَةُ رَسُولٌ مِّنَ ٱللَّهِ يَتْلُوا۟ صُحُفًا مُّطَهَّرَةً فِيهَا كُتُبٌ قَيِّمَةٌ', root: 'B-Y-N', trans: 'Les mécréants parmi les gens du Livre et les associateurs ne cesseront pas jusqu\'à ce que leur vienne la Preuve évidente : un Messager d\'Allah récitant des feuillets purifiés, contenant des prescriptions droites' },
            { id: 'w2', text: 'وَمَا تَفَرَّقَ ٱلَّذِينَ أُوتُوا۟ ٱلْكِتَٰبَ إِلَّا مِنۢ بَعْدِ مَا جَآءَتْهُمُ ٱلْبَيِّنَةُ', root: 'B-Y-N', trans: 'Ceux à qui le Livre a été donné ne se sont divisés qu\'après que la Preuve évidente leur fut venue' },
            { id: 'w3', text: 'وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ وَيُقِيمُوا۟ ٱلصَّلَوٰةَ وَيُؤْتُوا۟ ٱلزَّكَوٰةَ ۚ وَذَٰلِكَ دِينُ ٱلْقَيِّمَةِ', root: 'A-B-D', trans: 'Ils n\'ont reçu ordre que d\'adorer Allah avec sincérité, d\'accomplir la prière et d\'acquitter l\'aumône : voilà la religion de droiture' },
            { id: 'w4', text: 'إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ أُو۟لَٰٓئِكَ هُمْ خَيْرُ ٱلْبَرِيَّةِ جَزَآؤُهُمْ عِندَ رَبِّهِمْ جَنَّٰتُ عَدْنٍ خَٰلِدِينَ فِيهَآ أَبَدًا', root: 'A-M-N', trans: 'Ceux qui croient et accomplissent de bonnes œuvres sont les meilleures créatures ; leur récompense sera les jardins d\'Éden, où ils demeureront éternellement' },
         ]
      },
      {
        type: 'match',
        instruction: 'Associez chaque groupe de versets à sa traduction',
        pairs: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
        leftCol: [{text: 'لَمْ يَكُنِ ٱلَّذِينَ كَفَرُوا۟', id: 1}, {text: 'وَمَا تَفَرَّقَ ٱلَّذِينَ أُوتُوا۟ ٱلْكِتَٰبَ', id: 2}, {text: 'وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ', id: 3}, {text: 'إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ', id: 4}],
        rightCol: [{text: 'Les mécréants ne cesseront pas jusqu\'à la Preuve évidente', id: 1}, {text: 'Ils ne se sont divisés qu\'après la Preuve évidente', id: 2}, {text: 'Ils n\'ont reçu ordre que d\'adorer Allah sincèrement', id: 3}, {text: 'Ceux qui croient et font le bien sont les meilleures créatures', id: 4}]
      },
      { type: 'success', instruction: 'Sourate Al-Bayyinah validée ! Parcours Lecture Coranique terminé. +25 XP' }
    ]
  ];

  const freqVocabLessons = [
    [
      { type: 'intro', letter: 'قُلْ', name: 'Dis !', instruction: 'Voici un mot impératif très fréquent (plus de 300 occurrences). Il s\'adresse directement au Prophète ou au lecteur.', sound: 'Qul', illustration: '🗣️', mnemonic: 'Répétez à haute voix', rootKey: 'Q-W-L' },
      { type: 'qcm', instruction: 'Que signifie le mot coranique "قُلْ" (Qul) ?', options: ['Mange', 'Écris', 'Dis', 'Lis'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَوْم', name: 'Jour', instruction: 'Apparaît souvent pour désigner le "Jour du Jugement" (Yawm Al-Qiyamah).', sound: 'Yawm', illustration: '☀️', mnemonic: 'La lumière du jour', rootKey: 'Y-W-M' },
      { type: 'qcm', instruction: 'Que signifie "يَوْم" (Yawm) ?', options: ['Nuit', 'Jour', 'Mois', 'Année'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مِن', name: 'De, depuis', instruction: 'Préposition très fréquente indiquant l\'origine ou la provenance.', sound: 'Min', illustration: '🔤', mnemonic: 'Toujours suivi d\'un nom' },
      { type: 'qcm', instruction: 'Que signifie la particule "مِن" (Min) ?', options: ['Vers', 'De, depuis', 'Sur', 'Dans'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 1 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'فِي', name: 'Dans', instruction: 'Préposition de lieu ou de temps, l\'une des plus courantes du Coran.', sound: 'Fī', illustration: '📍', mnemonic: 'Indique le lieu ou le temps' },
      { type: 'qcm', instruction: 'Que signifie "فِي" (Fī) ?', options: ['Dans', 'Avec', 'Après', 'Devant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَلَى', name: 'Sur', instruction: 'Préposition indiquant une position au-dessus ou une obligation.', sound: 'ʻAlā', illustration: '⬆️', mnemonic: 'Indique la position au-dessus' },
      { type: 'qcm', instruction: 'Que signifie "عَلَى" (ʻAlā) ?', options: ['Sous', 'À côté', 'Sur', 'Loin de'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'إِنَّ', name: 'Certes', instruction: 'Particule d\'emphase qui renforce l\'affirmation de la phrase qui suit.', sound: 'Inna', illustration: '❗', mnemonic: 'Renforce l\'affirmation' },
      { type: 'qcm', instruction: 'Que signifie la particule "إِنَّ" (Inna) ?', options: ['Peut-être', 'Certes', 'Jamais', 'Toujours'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 2 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلَّذِينَ', name: 'Ceux qui', instruction: 'Pronom relatif pluriel qui introduit une proposition relative.', sound: 'Alladhīna', illustration: '👥', mnemonic: 'Introduit "ceux qui..."' },
      { type: 'qcm', instruction: 'Que signifie "ٱلَّذِينَ" (Alladhīna) ?', options: ['Celui qui', 'Ceux qui', 'Celle qui', 'Ce que'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَا', name: 'Ce qui / Quoi', instruction: 'Particule servant à interroger ou à relativiser.', sound: 'Mā', illustration: '❓', mnemonic: 'Sert à interroger ou relativiser' },
      { type: 'qcm', instruction: 'Que signifie "مَا" (Mā) ?', options: ['Qui', 'Ce qui / Quoi', 'Où', 'Comment'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'لَا', name: 'Non, ne...pas', instruction: 'La négation la plus simple et la plus fréquente en arabe.', sound: 'Lā', illustration: '🚫', mnemonic: 'La négation de base' },
      { type: 'qcm', instruction: 'Que signifie la particule "لَا" (Lā) ?', options: ['Oui', 'Non, ne...pas', 'Peut-être', 'Toujours'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 3 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'هُوَ', name: 'Il', instruction: 'Pronom personnel masculin singulier de la 3e personne.', sound: 'Huwa', illustration: '👤', mnemonic: 'Pronom masculin singulier' },
      { type: 'qcm', instruction: 'Que signifie "هُوَ" (Huwa) ?', options: ['Elle', 'Il', 'Nous', 'Vous'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَنْتَ', name: 'Tu', instruction: 'Pronom personnel qui s\'adresse directement à quelqu\'un.', sound: 'Anta', illustration: '👉', mnemonic: 'S\'adresse directement à quelqu\'un' },
      { type: 'qcm', instruction: 'Que signifie "أَنْتَ" (Anta) ?', options: ['Je', 'Tu', 'Il', 'Ils'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نَحْنُ', name: 'Nous', instruction: 'Pronom personnel de la première personne du pluriel.', sound: 'Naḥnu', illustration: '🫂', mnemonic: 'Première personne du pluriel' },
      { type: 'qcm', instruction: 'Que signifie "نَحْنُ" (Naḥnu) ?', options: ['Vous', 'Ils', 'Nous', 'Elle'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 4 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'رَبّ', name: 'Seigneur', instruction: 'Un des noms divins les plus répétés dans le Coran.', sound: 'Rabb', illustration: '🌍', mnemonic: 'Celui qui éduque et prend soin', rootKey: 'R-B-B' },
      { type: 'qcm', instruction: 'Que signifie "رَبّ" (Rabb) ?', options: ['Prophète', 'Seigneur', 'Ange', 'Livre'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَبْد', name: 'Serviteur', instruction: 'Base de nombreux prénoms musulmans (ʻAbdullah, ʻAbdur-Raḥmān...).', sound: 'ʻAbd', illustration: '🙏', mnemonic: 'Celui qui adore', rootKey: 'A-B-D' },
      { type: 'qcm', instruction: 'Que signifie "عَبْد" (ʻAbd) ?', options: ['Roi', 'Serviteur', 'Ennemi', 'Voisin'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'إِلَٰه', name: 'Divinité', instruction: 'Racine du mot "Allah", présent dans l\'attestation de foi.', sound: 'Ilāh', illustration: '🕋', mnemonic: 'Toute chose adorée', rootKey: 'A-L-H' },
      { type: 'qcm', instruction: 'Que signifie "إِلَٰه" (Ilāh) ?', options: ['Divinité', 'Montagne', 'Étoile', 'Rivière'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 5 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'كَانَ', name: 'Il était / devint', instruction: 'Verbe être/devenir, très fréquent pour raconter les récits du Coran.', sound: 'Kāna', illustration: '⏳', mnemonic: 'Verbe très fréquent au passé' },
      { type: 'qcm', instruction: 'Que signifie "كَانَ" (Kāna) ?', options: ['Il sera', 'Il était', 'Il court', 'Il mange'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قَالَ', name: 'Il a dit', instruction: 'Même racine que "Qul" (Dis), introduit les paroles des prophètes.', sound: 'Qāla', illustration: '💬', mnemonic: 'Le passé de "Qul"', rootKey: 'Q-W-L' },
      { type: 'qcm', instruction: 'Que signifie "قَالَ" (Qāla) ?', options: ['Il a dit', 'Il a vu', 'Il a écrit', 'Il a marché'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'خَلَقَ', name: 'Il a créé', instruction: 'Verbe décrivant l\'acte de création divine.', sound: 'Khalaqa', illustration: '✨', mnemonic: 'Dieu qui crée toute chose' },
      { type: 'qcm', instruction: 'Que signifie "خَلَقَ" (Khalaqa) ?', options: ['Il a détruit', 'Il a créé', 'Il a copié', 'Il a trouvé'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 6 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْأَرْض', name: 'La terre', instruction: 'Désigne la planète ou le sol, souvent opposée au ciel.', sound: 'Al-Arḍ', illustration: '🌍', mnemonic: 'Ce qui est sous nos pieds' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْأَرْض" (Al-Arḍ) ?', options: ['Le ciel', 'La terre', 'La mer', 'Le soleil'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلسَّمَاء', name: 'Le ciel', instruction: 'Le ciel, souvent au pluriel dans le Coran (les sept cieux).', sound: 'As-Samāʼ', illustration: '☁️', mnemonic: 'Ce qui est au-dessus' },
      { type: 'qcm', instruction: 'Que signifie "ٱلسَّمَاء" (As-Samāʼ) ?', options: ['Le ciel', 'La terre', 'L\'océan', 'Le désert'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلنَّاس', name: 'Les gens', instruction: 'Désigne l\'humanité entière, titre de la dernière sourate du Coran.', sound: 'An-Nās', illustration: '🧑‍🤝‍🧑', mnemonic: 'Tous les êtres humains' },
      { type: 'qcm', instruction: 'Que signifie "ٱلنَّاس" (An-Nās) ?', options: ['Les anges', 'Les gens', 'Les animaux', 'Les prophètes'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 7 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سَلَام', name: 'Paix', instruction: 'La salutation universelle entre musulmans, même racine qu\'"Islam".', sound: 'Salām', illustration: '☮️', mnemonic: 'Même racine qu\'Islam', rootKey: 'S-L-M' },
      { type: 'qcm', instruction: 'Que signifie "سَلَام" (Salām) ?', options: ['Guerre', 'Paix', 'Colère', 'Peur'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَمْد', name: 'Louange', instruction: 'Premier mot d\'Al-Fatiha après la Basmala.', sound: 'Ḥamd', illustration: '🙌', mnemonic: 'Même racine que Muḥammad', rootKey: 'H-M-D' },
      { type: 'qcm', instruction: 'Que signifie "حَمْد" (Ḥamd) ?', options: ['Louange', 'Tristesse', 'Question', 'Réponse'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'رَحْمَة', name: 'Miséricorde', instruction: 'La grâce et la bonté divine, thème central du Coran.', sound: 'Raḥma', illustration: '🤲', mnemonic: 'Même racine qu\'Ar-Raḥmān', rootKey: 'R-H-M' },
      { type: 'qcm', instruction: 'Que signifie "رَحْمَة" (Raḥma) ?', options: ['Miséricorde', 'Punition', 'Jugement', 'Silence'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 8 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'كِتَاب', name: 'Livre', instruction: 'Désigne souvent le Coran lui-même, "Le Livre".', sound: 'Kitāb', illustration: '📖', mnemonic: 'Ce qui est écrit', rootKey: 'K-T-B' },
      { type: 'qcm', instruction: 'Que signifie "كِتَاب" (Kitāb) ?', options: ['Livre', 'Chemin', 'Lumière', 'Porte'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نُور', name: 'Lumière', instruction: 'Symbole du savoir et de la guidance divine.', sound: 'Nūr', illustration: '💡', mnemonic: 'Ce qui dissipe l\'obscurité' },
      { type: 'qcm', instruction: 'Que signifie "نُور" (Nūr) ?', options: ['Ombre', 'Lumière', 'Fumée', 'Nuage'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَقّ', name: 'Vérité', instruction: 'La vérité absolue, l\'un des noms de Dieu.', sound: 'Ḥaqq', illustration: '✅', mnemonic: 'Ce qui est juste et certain' },
      { type: 'qcm', instruction: 'Que signifie "حَقّ" (Ḥaqq) ?', options: ['Mensonge', 'Vérité', 'Doute', 'Rêve'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 9 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'خَيْر', name: 'Bien', instruction: 'Le bien, tout ce qui est bénéfique et vertueux.', sound: 'Khayr', illustration: '🌟', mnemonic: 'Opposé du mal (sharr)' },
      { type: 'qcm', instruction: 'Que signifie "خَيْر" (Khayr) ?', options: ['Bien', 'Mal', 'Argent', 'Temps'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَظِيم', name: 'Immense', instruction: 'Qualifie souvent la grandeur divine (Al-ʻAẓīm).', sound: 'ʻAẓīm', illustration: '🏔️', mnemonic: 'Ce qui dépasse toute mesure' },
      { type: 'qcm', instruction: 'Que signifie "عَظِيم" (ʻAẓīm) ?', options: ['Petit', 'Immense', 'Rapide', 'Faible'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عِلْم', name: 'Savoir', instruction: 'La connaissance, très valorisée dans la tradition islamique.', sound: 'ʻIlm', illustration: '🧠', mnemonic: 'La base du mot "ʻĀlim" (savant)' },
      { type: 'qcm', instruction: 'Que signifie "عِلْم" (ʻIlm) ?', options: ['Savoir', 'Ignorance', 'Silence', 'Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 10 : 30 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'نَزَلَ', name: 'Il est descendu', instruction: 'Décrit la révélation qui "descend" du ciel vers le Prophète.', sound: 'Nazala', illustration: '⬇️', mnemonic: 'La révélation qui descend' },
      { type: 'qcm', instruction: 'Que signifie "نَزَلَ" (Nazala) ?', options: ['Il est monté', 'Il est descendu', 'Il a couru', 'Il a dormi'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'آمَنَ', name: 'Il a cru', instruction: 'Verbe de la foi, revient très souvent associé aux bonnes œuvres.', sound: 'Āmana', illustration: '🤍', mnemonic: 'La racine du mot "Īmān" (foi)', rootKey: 'A-M-N' },
      { type: 'qcm', instruction: 'Que signifie "آمَنَ" (Āmana) ?', options: ['Il a douté', 'Il a cru', 'Il a oublié', 'Il a refusé'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'هُدًى', name: 'Guidance', instruction: 'La direction juste envoyée par Dieu, opposée à l\'égarement.', sound: 'Hudā', illustration: '🧭', mnemonic: 'Le chemin montré par Dieu' },
      { type: 'qcm', instruction: 'Que signifie "هُدًى" (Hudā) ?', options: ['Égarement', 'Guidance', 'Punition', 'Oubli'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 11 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'عَمَل', name: 'Œuvre', instruction: 'L\'action accomplie, presque toujours associée à la foi dans le Coran ("croire et bien agir").', sound: 'ʻAmal', illustration: '🛠️', mnemonic: 'Ce que l\'on accomplit', rootKey: 'A-M-L' },
      { type: 'qcm', instruction: 'Que signifie "عَمَل" (ʻAmal) ?', options: ['Parole', 'Œuvre', 'Pensée', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'صَبْر', name: 'Patience', instruction: 'L\'endurance face à l\'épreuve, une vertu très valorisée dans le Coran.', sound: 'Ṣabr', illustration: '⏳', mnemonic: 'Tenir bon dans l\'épreuve', rootKey: 'S-B-R' },
      { type: 'qcm', instruction: 'Que signifie "صَبْر" (Ṣabr) ?', options: ['Colère', 'Patience', 'Hâte', 'Joie'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'تَقْوَى', name: 'Piété', instruction: 'La crainte révérencielle de Dieu qui pousse à bien agir.', sound: 'Taqwā', illustration: '🛡️', mnemonic: 'Se protéger par la conscience de Dieu' },
      { type: 'qcm', instruction: 'Que signifie "تَقْوَى" (Taqwā) ?', options: ['Piété', 'Richesse', 'Force', 'Beauté'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 12 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'جَنَّة', name: 'Paradis / Jardin', instruction: 'Le jardin promis aux croyants, littéralement "ce qui est caché" (par la végétation).', sound: 'Jannah', illustration: '🌳', mnemonic: 'Le jardin de la récompense' },
      { type: 'qcm', instruction: 'Que signifie "جَنَّة" (Jannah) ?', options: ['Désert', 'Paradis / Jardin', 'Montagne', 'Tempête'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نَار', name: 'Feu', instruction: 'Désigne le feu, souvent utilisé pour évoquer la punition.', sound: 'Nār', illustration: '🔥', mnemonic: 'Opposé du jardin (Jannah)' },
      { type: 'qcm', instruction: 'Que signifie "نَار" (Nār) ?', options: ['Eau', 'Feu', 'Air', 'Terre'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَيَاة', name: 'Vie', instruction: 'La vie de ce monde, souvent comparée à la vie de l\'au-delà.', sound: 'Ḥayāh', illustration: '🌱', mnemonic: 'Opposé de la mort (Mawt)' },
      { type: 'qcm', instruction: 'Que signifie "حَيَاة" (Ḥayāh) ?', options: ['Mort', 'Vie', 'Sommeil', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 13 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'مَوْت', name: 'Mort', instruction: 'La fin de la vie terrestre, un thème très présent dans le Coran.', sound: 'Mawt', illustration: '🕊️', mnemonic: 'Opposé de la vie (Ḥayāh)' },
      { type: 'qcm', instruction: 'Que signifie "مَوْت" (Mawt) ?', options: ['Naissance', 'Mort', 'Voyage', 'Sommeil'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'صَلَاة', name: 'Prière', instruction: 'Le deuxième pilier de l\'Islam, la prière rituelle.', sound: 'Ṣalāh', illustration: '🕌', mnemonic: 'Le lien direct avec Dieu' },
      { type: 'qcm', instruction: 'Que signifie "صَلَاة" (Ṣalāh) ?', options: ['Aumône', 'Prière', 'Jeûne', 'Pèlerinage'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'زَكَاة', name: 'Aumône purificatrice', instruction: 'Le troisième pilier, l\'aumône obligatoire qui "purifie" les biens.', sound: 'Zakāh', illustration: '🤲', mnemonic: 'Ce qui purifie la richesse' },
      { type: 'qcm', instruction: 'Que signifie "زَكَاة" (Zakāh) ?', options: ['Aumône purificatrice', 'Impôt', 'Cadeau', 'Dette'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 14 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'رَسُول', name: 'Messager', instruction: 'Celui qui transmet un message divin à son peuple.', sound: 'Rasūl', illustration: '📜', mnemonic: 'Celui qui porte le message' },
      { type: 'qcm', instruction: 'Que signifie "رَسُول" (Rasūl) ?', options: ['Roi', 'Messager', 'Juge', 'Voyageur'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نَبِيّ', name: 'Prophète', instruction: 'Celui qui reçoit une révélation divine.', sound: 'Nabiyy', illustration: '⭐', mnemonic: 'Proche du mot "nabaʼ" (annonce)' },
      { type: 'qcm', instruction: 'Que signifie "نَبِيّ" (Nabiyy) ?', options: ['Prophète', 'Ange', 'Savant', 'Guerrier'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'صِرَاط', name: 'Chemin', instruction: 'La voie droite mentionnée dès l\'ouverture d\'Al-Fatiha.', sound: 'Ṣirāṭ', illustration: '🛤️', mnemonic: 'Le "droit chemin" d\'Al-Fatiha' },
      { type: 'qcm', instruction: 'Que signifie "صِرَاط" (Ṣirāṭ) ?', options: ['Maison', 'Chemin', 'Livre', 'Étoile'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 15 : 45 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'خَالِق', name: 'Créateur', instruction: 'Un des noms divins : Celui qui crée à partir de rien.', sound: 'Khāliq', illustration: '✨', mnemonic: 'Même racine que "Khalaqa" (créer)', rootKey: 'K-L-Q' },
      { type: 'qcm', instruction: 'Que signifie "خَالِق" (Khāliq) ?', options: ['Créateur', 'Destructeur', 'Voyageur', 'Gardien'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'غَفُور', name: 'Très Pardonneur', instruction: 'Un des noms divins, exprimant le pardon abondant.', sound: 'Ghafūr', illustration: '🤍', mnemonic: 'Même racine que "Maghfira" (pardon)', rootKey: 'GH-F-R' },
      { type: 'qcm', instruction: 'Que signifie "غَفُور" (Ghafūr) ?', options: ['Sévère', 'Très Pardonneur', 'Silencieux', 'Absent'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'رِزْق', name: 'Subsistance', instruction: 'Tout ce que Dieu accorde à Ses créatures pour vivre : nourriture, biens, savoir...', sound: 'Rizq', illustration: '🍞', mnemonic: 'Ce qui nous est accordé pour vivre' },
      { type: 'qcm', instruction: 'Que signifie "رِزْق" (Rizq) ?', options: ['Punition', 'Subsistance', 'Voyage', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 16 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'عَذَاب', name: 'Châtiment', instruction: 'La punition, souvent évoquée en contraste avec la miséricorde divine.', sound: 'ʻAdhāb', illustration: '⚡', mnemonic: 'Opposé de la miséricorde (Raḥma)', rootKey: 'A-DH-B' },
      { type: 'qcm', instruction: 'Que signifie "عَذَاب" (ʻAdhāb) ?', options: ['Récompense', 'Châtiment', 'Cadeau', 'Repos'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'شُكْر', name: 'Gratitude', instruction: 'La reconnaissance envers Dieu pour Ses bienfaits.', sound: 'Shukr', illustration: '🙏', mnemonic: 'Répondre au bienfait par la gratitude', rootKey: 'SH-K-R' },
      { type: 'qcm', instruction: 'Que signifie "شُكْر" (Shukr) ?', options: ['Plainte', 'Gratitude', 'Oubli', 'Doute'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'صِدْق', name: 'Véracité', instruction: 'La sincérité et la vérité dans les paroles et les actes.', sound: 'Ṣidq', illustration: '✅', mnemonic: 'Opposé du mensonge (kadhib)' },
      { type: 'qcm', instruction: 'Que signifie "صِدْق" (Ṣidq) ?', options: ['Mensonge', 'Véracité', 'Silence', 'Colère'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 17 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'فَضْل', name: 'Grâce', instruction: 'La faveur généreuse que Dieu accorde sans contrepartie.', sound: 'Faḍl', illustration: '🌟', mnemonic: 'Un don au-delà du mérite', rootKey: 'F-D-L' },
      { type: 'qcm', instruction: 'Que signifie "فَضْل" (Faḍl) ?', options: ['Grâce', 'Dette', 'Épreuve', 'Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'جَزَاء', name: 'Rétribution', instruction: 'La récompense ou la sanction correspondant à ce qu\'on a accompli.', sound: 'Jazāʼ', illustration: '⚖️', mnemonic: 'Chacun selon ses œuvres', rootKey: 'J-Z-Y' },
      { type: 'qcm', instruction: 'Que signifie "جَزَاء" (Jazāʼ) ?', options: ['Rétribution', 'Voyage', 'Silence', 'Sommeil'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'خَوْف', name: 'Peur', instruction: 'La crainte, souvent mise en balance avec l\'espoir (rajāʼ) dans le Coran.', sound: 'Khawf', illustration: '😨', mnemonic: 'Équilibrée par l\'espoir en Dieu' },
      { type: 'qcm', instruction: 'Que signifie "خَوْف" (Khawf) ?', options: ['Joie', 'Peur', 'Force', 'Paix'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 18 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'دُعَاء', name: 'Invocation', instruction: 'L\'appel adressé à Dieu, la demande faite dans la prière ou en dehors.', sound: 'Duʻāʼ', illustration: '🤲', mnemonic: 'Le dialogue du cœur avec Dieu' },
      { type: 'qcm', instruction: 'Que signifie "دُعَاء" (Duʻāʼ) ?', options: ['Invocation', 'Silence', 'Colère', 'Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حِكْمَة', name: 'Sagesse', instruction: 'La connaissance juste mise en pratique avec discernement.', sound: 'Ḥikma', illustration: '🦉', mnemonic: 'Le savoir appliqué avec justesse' },
      { type: 'qcm', instruction: 'Que signifie "حِكْمَة" (Ḥikma) ?', options: ['Ignorance', 'Sagesse', 'Rapidité', 'Force'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قُدْرَة', name: 'Pouvoir', instruction: 'La capacité et la puissance, en particulier celle, infinie, de Dieu.', sound: 'Qudra', illustration: '💪', mnemonic: 'La base du nom divin Al-Qadīr' },
      { type: 'qcm', instruction: 'Que signifie "قُدْرَة" (Qudra) ?', options: ['Faiblesse', 'Pouvoir', 'Oubli', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 19 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بَرَكَة', name: 'Bénédiction', instruction: 'L\'accroissement du bien, invisible mais tangible dans ses effets.', sound: 'Baraka', illustration: '🌿', mnemonic: 'Le bien qui se multiplie' },
      { type: 'qcm', instruction: 'Que signifie "بَرَكَة" (Baraka) ?', options: ['Malédiction', 'Bénédiction', 'Fatigue', 'Distance'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَجْر', name: 'Récompense', instruction: 'La rétribution positive promise pour les bonnes œuvres.', sound: 'Ajr', illustration: '🏅', mnemonic: 'Le salaire des bonnes actions' },
      { type: 'qcm', instruction: 'Que signifie "أَجْر" (Ajr) ?', options: ['Punition', 'Récompense', 'Question', 'Doute'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نِعْمَة', name: 'Bienfait', instruction: 'Toute grâce ou faveur accordée par Dieu à Ses créatures.', sound: 'Niʻma', illustration: '🎁', mnemonic: 'Un don à reconnaître avec gratitude' },
      { type: 'qcm', instruction: 'Que signifie "نِعْمَة" (Niʻma) ?', options: ['Épreuve', 'Bienfait', 'Perte', 'Attente'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 20 : 60 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'كَافِر', name: 'Mécréant', instruction: 'Celui qui rejette ou cache la vérité de la foi.', sound: 'Kāfir', illustration: '🚫', mnemonic: 'Opposé du croyant (muʼmin)' },
      { type: 'qcm', instruction: 'Que signifie "كَافِر" (Kāfir) ?', options: ['Croyant', 'Mécréant', 'Prophète', 'Ange'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'صَالِح', name: 'Vertueux', instruction: 'Celui qui accomplit de bonnes œuvres, souvent associé à la foi dans le Coran.', sound: 'Ṣāliḥ', illustration: '🌟', mnemonic: 'Une action ou une personne droite' },
      { type: 'qcm', instruction: 'Que signifie "صَالِح" (Ṣāliḥ) ?', options: ['Vertueux', 'Corrompu', 'Faible', 'Rapide'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ظُلْم', name: 'Injustice', instruction: 'Le fait de placer une chose ailleurs qu\'à sa juste place ; l\'oppression.', sound: 'Ẓulm', illustration: '⚖️', mnemonic: 'Opposé de la justice (ʻadl)' },
      { type: 'qcm', instruction: 'Que signifie "ظُلْم" (Ẓulm) ?', options: ['Justice', 'Injustice', 'Paix', 'Patience'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 21 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'عَدْل', name: 'Justice', instruction: 'Le fait de donner à chacun son dû, valeur centrale du Coran.', sound: 'ʻAdl', illustration: '⚖️', mnemonic: 'Opposé de l\'injustice (ẓulm)' },
      { type: 'qcm', instruction: 'Que signifie "عَدْل" (ʻAdl) ?', options: ['Injustice', 'Justice', 'Doute', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَلَال', name: 'Permis', instruction: 'Ce qui est autorisé par la loi religieuse.', sound: 'Ḥalāl', illustration: '✅', mnemonic: 'Opposé de l\'interdit (ḥarām)' },
      { type: 'qcm', instruction: 'Que signifie "حَلَال" (Ḥalāl) ?', options: ['Interdit', 'Permis', 'Douteux', 'Rare'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَرَام', name: 'Interdit', instruction: 'Ce qui est prohibé par la loi religieuse.', sound: 'Ḥarām', illustration: '⛔', mnemonic: 'Opposé du permis (ḥalāl)' },
      { type: 'qcm', instruction: 'Que signifie "حَرَام" (Ḥarām) ?', options: ['Permis', 'Interdit', 'Facultatif', 'Recommandé'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 22 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'تَوْبَة', name: 'Repentir', instruction: 'Le retour vers Dieu après avoir reconnu une faute.', sound: 'Tawba', illustration: '🔄', mnemonic: 'Un retour sincère vers Dieu' },
      { type: 'qcm', instruction: 'Que signifie "تَوْبَة" (Tawba) ?', options: ['Repentir', 'Orgueil', 'Oubli', 'Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'شَيْطَان', name: 'Satan', instruction: 'La force du mal qui incite les hommes à désobéir.', sound: 'Shayṭān', illustration: '👿', mnemonic: 'Celui qui s\'éloigne de la miséricorde' },
      { type: 'qcm', instruction: 'Que signifie "شَيْطَان" (Shayṭān) ?', options: ['Ange', 'Satan', 'Prophète', 'Roi'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَلَك', name: 'Ange', instruction: 'Créature de lumière qui obéit à Dieu sans jamais désobéir.', sound: 'Malak', illustration: '👼', mnemonic: 'Messager invisible de Dieu' },
      { type: 'qcm', instruction: 'Que signifie "مَلَك" (Malak) ?', options: ['Ange', 'Démon', 'Roi', 'Serviteur'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 23 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سَبِيل', name: 'Voie', instruction: 'Le chemin à suivre, souvent "le sentier de Dieu" (sabīl Allāh).', sound: 'Sabīl', illustration: '🛤️', mnemonic: 'Proche du sens de Ṣirāṭ (chemin)' },
      { type: 'qcm', instruction: 'Que signifie "سَبِيل" (Sabīl) ?', options: ['Voie', 'Maison', 'Livre', 'Étoile'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'بَيِّنَة', name: 'Preuve claire', instruction: 'Un signe ou argument évident qui dissipe le doute.', sound: 'Bayyina', illustration: '🔎', mnemonic: 'Ce qui rend la vérité évidente' },
      { type: 'qcm', instruction: 'Que signifie "بَيِّنَة" (Bayyina) ?', options: ['Doute', 'Preuve claire', 'Mensonge', 'Secret'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'إِحْسَان', name: 'Excellence', instruction: 'Faire le bien avec perfection, comme si l\'on voyait Dieu.', sound: 'Iḥsān', illustration: '💎', mnemonic: 'Le plus haut degré de la pratique' },
      { type: 'qcm', instruction: 'Que signifie "إِحْسَان" (Iḥsān) ?', options: ['Excellence, bienfaisance', 'Négligence', 'Doute', 'Colère'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 24 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بَصِير', name: 'Voyant', instruction: 'Un des noms divins : Celui qui voit tout, jusqu\'au plus infime détail.', sound: 'Baṣīr', illustration: '👁️', mnemonic: 'Souvent associé à Samīʻ (Audient)' },
      { type: 'qcm', instruction: 'Que signifie "بَصِير" (Baṣīr) ?', options: ['Aveugle', 'Voyant', 'Sourd', 'Muet'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'سَمِيع', name: 'Audient', instruction: 'Un des noms divins : Celui qui entend tout, même le murmure le plus discret.', sound: 'Samīʻ', illustration: '👂', mnemonic: 'Souvent associé à Baṣīr (Voyant)' },
      { type: 'qcm', instruction: 'Que signifie "سَمِيع" (Samīʻ) ?', options: ['Sourd', 'Audient', 'Muet', 'Aveugle'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَزِيز', name: 'Puissant', instruction: 'Un des noms divins : Celui dont la puissance est inégalable et jamais vaincue.', sound: 'ʻAzīz', illustration: '👑', mnemonic: 'La puissance et l\'honneur réunis' },
      { type: 'qcm', instruction: 'Que signifie "عَزِيز" (ʻAzīz) ?', options: ['Faible', 'Puissant', 'Petit', 'Absent'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 25 : 75 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'فَتْح', name: 'Victoire', instruction: 'La victoire ou l\'ouverture accordée par Dieu.', sound: 'Fatḥ', illustration: '🚪', mnemonic: 'Al-Fattāḥ, Celui qui ouvre', rootKey: 'F-T-H' },
      { type: 'qcm', instruction: 'Que signifie "فَتْح" (Fatḥ) ?', options: ['Défaite', 'Victoire, ouverture', 'Silence', 'Voyage'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'غَيْب', name: 'L\'invisible', instruction: 'Ce qui échappe à la perception humaine, connu de Dieu seul.', sound: 'Ghayb', illustration: '🌫️', mnemonic: 'ʻĀlim al-Ghayb, Celui qui connaît l\'invisible', rootKey: 'GH-Y-B' },
      { type: 'qcm', instruction: 'Que signifie "غَيْب" (Ghayb) ?', options: ['Le visible', 'L\'invisible', 'Le proche', 'Le bruit'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'شَهَادَة', name: 'Témoignage', instruction: 'L\'attestation de foi, premier pilier de l\'Islam.', sound: 'Shahāda', illustration: '📜', mnemonic: 'Ash-Shahīd, Le Témoin (nom divin)', rootKey: 'SH-H-D' },
      { type: 'qcm', instruction: 'Que signifie "شَهَادَة" (Shahāda) ?', options: ['Témoignage, attestation', 'Question', 'Silence', 'Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 26 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'وُجُود', name: 'Existence', instruction: 'Le fait d\'être, d\'exister.', sound: 'Wujūd', illustration: '🌌', mnemonic: 'Al-Wājid, Celui qui possède tout', rootKey: 'W-J-D' },
      { type: 'qcm', instruction: 'Que signifie "وُجُود" (Wujūd) ?', options: ['Absence', 'Existence', 'Doute', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حُسْن', name: 'Beauté', instruction: 'La beauté et la bonté réunies.', sound: 'Ḥusn', illustration: '🌸', mnemonic: 'Muḥsin, celui qui fait le bien avec excellence', rootKey: 'H-S-N' },
      { type: 'qcm', instruction: 'Que signifie "حُسْن" (Ḥusn) ?', options: ['Laideur', 'Beauté', 'Colère', 'Faiblesse'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ذِكْر', name: 'Rappel', instruction: 'Le fait de se souvenir de Dieu et de L\'évoquer.', sound: 'Dhikr', illustration: '📿', mnemonic: 'Adh-Dhikr al-Ḥakīm, un nom du Coran', rootKey: 'DH-K-R' },
      { type: 'qcm', instruction: 'Que signifie "ذِكْر" (Dhikr) ?', options: ['Oubli', 'Rappel, invocation', 'Refus', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 27 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سُجُود', name: 'Prosternation', instruction: 'L\'acte de se prosterner devant Dieu, sommet de la prière.', sound: 'Sujūd', illustration: '🙇', mnemonic: 'Masjid, le lieu de la prosternation', rootKey: 'S-J-D' },
      { type: 'qcm', instruction: 'Que signifie "سُجُود" (Sujūd) ?', options: ['Debout', 'Prosternation', 'Assis', 'Marche'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'فُرْقَان', name: 'Le Discernement', instruction: 'Nom du Coran : ce qui distingue le vrai du faux.', sound: 'Furqān', illustration: '⚔️', mnemonic: 'Même racine que "Farraqa" (séparer)', rootKey: 'F-R-Q' },
      { type: 'qcm', instruction: 'Que signifie "فُرْقَان" (Furqān) ?', options: ['Confusion', 'Le Discernement', 'Le Silence', 'L\'Oubli'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قَوْم', name: 'Peuple', instruction: 'Une communauté, un groupe de gens.', sound: 'Qawm', illustration: '👥', mnemonic: 'Qāʼim, celui qui se tient debout', rootKey: 'Q-W-M' },
      { type: 'qcm', instruction: 'Que signifie "قَوْم" (Qawm) ?', options: ['Individu', 'Peuple', 'Animal', 'Objet'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 28 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'مِيثَاق', name: 'Pacte', instruction: 'Une alliance solennelle, notamment celle entre Dieu et les croyants.', sound: 'Mīthāq', illustration: '🤝', mnemonic: 'Un engagement solide et durable' },
      { type: 'qcm', instruction: 'Que signifie "مِيثَاق" (Mīthāq) ?', options: ['Rupture', 'Pacte, alliance', 'Doute', 'Guerre'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أُمَّة', name: 'Communauté', instruction: 'Le groupe des croyants unis autour d\'un même message.', sound: 'Umma', illustration: '🕌', mnemonic: 'Vient de "Umm" (mère), l\'origine commune' },
      { type: 'qcm', instruction: 'Que signifie "أُمَّة" (Umma) ?', options: ['Individu', 'Communauté', 'Ennemi', 'Étranger'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'كَلِمَة', name: 'Parole', instruction: 'Un mot ou une parole, notamment la "Parole" divine.', sound: 'Kalima', illustration: '💬', mnemonic: 'La base du mot Kalām (discours)' },
      { type: 'qcm', instruction: 'Que signifie "كَلِمَة" (Kalima) ?', options: ['Silence', 'Parole, mot', 'Geste', 'Regard'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 29 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'يَقِين', name: 'Certitude', instruction: 'La conviction absolue, sans doute possible.', sound: 'Yaqīn', illustration: '✅', mnemonic: 'Le plus haut degré de la foi' },
      { type: 'qcm', instruction: 'Que signifie "يَقِين" (Yaqīn) ?', options: ['Doute', 'Certitude', 'Espoir', 'Peur'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'إِيمَان', name: 'Foi', instruction: 'La croyance intérieure, pilier central de la pratique.', sound: 'Īmān', illustration: '💫', mnemonic: 'Muʼmin, le croyant', rootKey: 'A-M-N' },
      { type: 'qcm', instruction: 'Que signifie "إِيمَان" (Īmān) ?', options: ['Doute', 'Foi', 'Oubli', 'Refus'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَمَانَة', name: 'Confiance, dépôt', instruction: 'Ce qui est confié et doit être préservé avec intégrité.', sound: 'Amāna', illustration: '🔐', mnemonic: 'Même racine que Amn (sécurité)' },
      { type: 'qcm', instruction: 'Que signifie "أَمَانَة" (Amāna) ?', options: ['Trahison', 'Confiance, dépôt', 'Perte', 'Vol'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 30 : 90 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'جِهَاد', name: 'Effort, lutte', instruction: 'L\'effort soutenu, intérieur ou extérieur, sur le chemin de Dieu.', sound: 'Jihād', illustration: '💪', mnemonic: 'Mujāhid, celui qui lutte', rootKey: 'J-H-D' },
      { type: 'qcm', instruction: 'Que signifie "جِهَاد" (Jihād) ?', options: ['Repos', 'Effort, lutte', 'Silence', 'Fuite'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'خَلِيفَة', name: 'Successeur', instruction: 'Celui qui succède, notamment Adam établi sur terre.', sound: 'Khalīfa', illustration: '👑', mnemonic: 'À l\'origine du mot "Calife"', rootKey: 'KH-L-F' },
      { type: 'qcm', instruction: 'Que signifie "خَلِيفَة" (Khalīfa) ?', options: ['Successeur', 'Ancêtre', 'Étranger', 'Voisin'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَقْل', name: 'Raison', instruction: 'La faculté de comprendre et de discerner.', sound: 'ʻAql', illustration: '🧠', mnemonic: 'ʻĀqil, celui qui use de sa raison', rootKey: 'A-Q-L' },
      { type: 'qcm', instruction: 'Que signifie "عَقْل" (ʻAql) ?', options: ['Le cœur', 'La raison', 'La main', 'L\'œil'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 31 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'حِسَاب', name: 'Compte', instruction: 'Le compte des actes, notamment au Jour du Jugement.', sound: 'Ḥisāb', illustration: '🧮', mnemonic: 'Ḥasīb, Celui qui tient le compte de tout', rootKey: 'H-S-B' },
      { type: 'qcm', instruction: 'Que signifie "حِسَاب" (Ḥisāb) ?', options: ['Oubli', 'Compte', 'Cadeau', 'Secret'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'تَوْحِيد', name: 'Monothéisme', instruction: 'La proclamation et la croyance en l\'Unicité de Dieu.', sound: 'Tawḥīd', illustration: '🕋', mnemonic: 'Wāḥid, l\'Unique', rootKey: 'W-H-D' },
      { type: 'qcm', instruction: 'Que signifie "تَوْحِيد" (Tawḥīd) ?', options: ['Polythéisme', 'Monothéisme', 'Doute', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'إِخْلَاص', name: 'Sincérité', instruction: 'La pureté d\'intention, réservée exclusivement à Dieu.', sound: 'Ikhlāṣ', illustration: '💎', mnemonic: 'Sūrat al-Ikhlāṣ (112)', rootKey: 'KH-L-S' },
      { type: 'qcm', instruction: 'Que signifie "إِخْلَاص" (Ikhlāṣ) ?', options: ['Hypocrisie', 'Sincérité', 'Doute', 'Mélange'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 32 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'نَصْر', name: 'Victoire, secours', instruction: 'L\'aide et le triomphe accordés par Dieu.', sound: 'Naṣr', illustration: '🏆', mnemonic: 'Sūrat An-Naṣr (110)', rootKey: 'N-S-R' },
      { type: 'qcm', instruction: 'Que signifie "نَصْر" (Naṣr) ?', options: ['Défaite', 'Victoire, secours', 'Doute', 'Repos'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قِرَاءَة', name: 'Lecture', instruction: 'L\'acte de lire ou réciter le Coran.', sound: 'Qirāʼa', illustration: '📖', mnemonic: 'Al-Qurʼān, "la Récitation"', rootKey: 'Q-R-A' },
      { type: 'qcm', instruction: 'Que signifie "قِرَاءَة" (Qirāʼa) ?', options: ['Écriture', 'Lecture', 'Silence', 'Écoute seule'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'كَبِير', name: 'Grand', instruction: 'Ce qui est immense, un des noms divins.', sound: 'Kabīr', illustration: '🏔️', mnemonic: 'Allāhu Akbar, "Dieu est le Plus Grand"', rootKey: 'K-B-R' },
      { type: 'qcm', instruction: 'Que signifie "كَبِير" (Kabīr) ?', options: ['Petit', 'Grand', 'Rapide', 'Faible'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 33 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'دُنْيَا', name: 'Ce bas monde', instruction: 'La vie terrestre, souvent opposée à l\'au-delà.', sound: 'Dunyā', illustration: '🌍', mnemonic: 'Al-Ḥayāt Ad-Dunyā, la vie de ce bas monde', rootKey: 'D-N-Y' },
      { type: 'qcm', instruction: 'Que signifie "دُنْيَا" (Dunyā) ?', options: ['L\'au-delà', 'Ce bas monde', 'Le ciel', 'L\'océan'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'آخِرَة', name: 'L\'au-delà', instruction: 'La vie future, après la mort.', sound: 'Ākhira', illustration: '🌅', mnemonic: 'Yawm al-Ākhir, le Jour Dernier', rootKey: 'A-KH-R' },
      { type: 'qcm', instruction: 'Que signifie "آخِرَة" (Ākhira) ?', options: ['Ce bas monde', 'L\'au-delà', 'Le présent', 'Le passé'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'بَعْث', name: 'Résurrection', instruction: 'Le fait d\'être ressuscité après la mort.', sound: 'Baʻth', illustration: '🌅', mnemonic: 'Yawm al-Baʻth, le Jour de la Résurrection', rootKey: 'B-A-TH' },
      { type: 'qcm', instruction: 'Que signifie "بَعْث" (Baʻth) ?', options: ['Enterrement', 'Résurrection', 'Oubli', 'Sommeil'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 34 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'جَمَاعَة', name: 'Communauté', instruction: 'Un groupe réuni, notamment pour la prière.', sound: 'Jamāʻa', illustration: '🕌', mnemonic: 'Jamʻ, le rassemblement', rootKey: 'J-M-A' },
      { type: 'qcm', instruction: 'Que signifie "جَمَاعَة" (Jamāʻa) ?', options: ['Solitude', 'Communauté', 'Ennemi', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'فَقِير', name: 'Pauvre', instruction: 'Celui qui est dans le besoin.', sound: 'Faqīr', illustration: '🪫', mnemonic: 'Opposé de Ghaniyy (riche)', rootKey: 'F-Q-R' },
      { type: 'qcm', instruction: 'Que signifie "فَقِير" (Faqīr) ?', options: ['Riche', 'Pauvre', 'Fort', 'Rapide'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'غَنِيّ', name: 'Riche', instruction: 'Un des noms divins : Celui qui n\'a besoin de rien.', sound: 'Ghaniyy', illustration: '👑', mnemonic: 'Al-Ghaniyy, Le Riche par excellence', rootKey: 'GH-N-Y' },
      { type: 'qcm', instruction: 'Que signifie "غَنِيّ" (Ghaniyy) ?', options: ['Pauvre', 'Riche', 'Faible', 'Absent'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 35 : 105 mots fréquents mémorisés ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'فِكْر', name: 'Pensée', instruction: 'L\'activité de l\'esprit, la réflexion profonde.', sound: 'Fikr', illustration: '💭', mnemonic: 'Mufakkir, le penseur', rootKey: 'F-K-R' },
      { type: 'qcm', instruction: 'Que signifie "فِكْر" (Fikr) ?', options: ['Silence', 'Pensée', 'Sommeil', 'Oubli'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَغْرِب', name: 'Couchant', instruction: 'La direction de l\'ouest, où le soleil se couche.', sound: 'Maghrib', illustration: '🌇', mnemonic: 'Même racine que "Gharb" (ouest)', rootKey: 'GH-R-B' },
      { type: 'qcm', instruction: 'Que signifie "مَغْرِب" (Maghrib) ?', options: ['Levant', 'Couchant', 'Nord', 'Sud'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَشْرِق', name: 'Levant', instruction: 'La direction de l\'est, où le soleil se lève.', sound: 'Mashriq', illustration: '🌅', mnemonic: 'Même racine que "Sharq" (est)', rootKey: 'SH-R-Q' },
      { type: 'qcm', instruction: 'Que signifie "مَشْرِق" (Mashriq) ?', options: ['Couchant', 'Levant', 'Nord', 'Sud'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 36 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بِدَايَة', name: 'Début', instruction: 'Le commencement d\'une chose.', sound: 'Bidāya', illustration: '🏁', mnemonic: 'Opposé de Nihāya (fin)', rootKey: 'B-D-A' },
      { type: 'qcm', instruction: 'Que signifie "بِدَايَة" (Bidāya) ?', options: ['Fin', 'Début', 'Milieu', 'Pause'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'نِهَايَة', name: 'Fin', instruction: 'Le terme, la conclusion d\'une chose.', sound: 'Nihāya', illustration: '🏁', mnemonic: 'Opposé de Bidāya (début)', rootKey: 'N-H-Y' },
      { type: 'qcm', instruction: 'Que signifie "نِهَايَة" (Nihāya) ?', options: ['Début', 'Fin', 'Milieu', 'Suite'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قَدِيم', name: 'Ancien', instruction: 'Ce qui existe depuis longtemps, sans commencement pour Dieu.', sound: 'Qadīm', illustration: '📜', mnemonic: 'Opposé de "Jadīd" (nouveau)', rootKey: 'Q-D-M' },
      { type: 'qcm', instruction: 'Que signifie "قَدِيم" (Qadīm) ?', options: ['Nouveau', 'Ancien', 'Rapide', 'Faible'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 37 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ظَاهِر', name: 'Apparent', instruction: 'Ce qui est visible, manifeste ; un des noms divins.', sound: 'Ẓāhir', illustration: '👁️', mnemonic: 'Opposé de Bāṭin (caché)', rootKey: 'Z-H-R' },
      { type: 'qcm', instruction: 'Que signifie "ظَاهِر" (Ẓāhir) ?', options: ['Caché', 'Apparent', 'Lointain', 'Absent'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'بَاطِن', name: 'Caché', instruction: 'Ce qui est intérieur, imperceptible ; un des noms divins.', sound: 'Bāṭin', illustration: '🌑', mnemonic: 'Opposé de Ẓāhir (apparent)', rootKey: 'B-T-N' },
      { type: 'qcm', instruction: 'Que signifie "بَاطِن" (Bāṭin) ?', options: ['Visible', 'Caché', 'Bruyant', 'Proche'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَرْب', name: 'Guerre', instruction: 'Le conflit armé, opposé à la paix.', sound: 'Ḥarb', illustration: '⚔️', mnemonic: 'Opposé de Salām (paix)', rootKey: 'H-R-B' },
      { type: 'qcm', instruction: 'Que signifie "حَرْب" (Ḥarb) ?', options: ['Paix', 'Guerre', 'Amitié', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 38 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بِنَاء', name: 'Construction', instruction: 'L\'acte de bâtir, ou l\'édifice lui-même.', sound: 'Bināʼ', illustration: '🏗️', mnemonic: 'Bānī, le bâtisseur', rootKey: 'B-N-Y' },
      { type: 'qcm', instruction: 'Que signifie "بِنَاء" (Bināʼ) ?', options: ['Destruction', 'Construction', 'Vente', 'Achat'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'وُصُول', name: 'Arrivée', instruction: 'Le fait de parvenir à destination.', sound: 'Wuṣūl', illustration: '🏁', mnemonic: 'Même racine que "Ṣila" (lien)', rootKey: 'W-S-L' },
      { type: 'qcm', instruction: 'Que signifie "وُصُول" (Wuṣūl) ?', options: ['Départ', 'Arrivée', 'Perte', 'Recherche'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'قَصْد', name: 'Intention', instruction: 'Le but visé dans une action.', sound: 'Qaṣd', illustration: '🎯', mnemonic: 'Maqṣid, le but recherché', rootKey: 'Q-S-D' },
      { type: 'qcm', instruction: 'Que signifie "قَصْد" (Qaṣd) ?', options: ['Hasard', 'Intention', 'Erreur', 'Doute'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 39 : 3 mots fréquents mémorisés ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'تَمَام', name: 'Achèvement', instruction: 'L\'état de ce qui est complet et parfait.', sound: 'Tamām', illustration: '✅', mnemonic: 'Tāmm, ce qui est complet', rootKey: 'T-M-M' },
      { type: 'qcm', instruction: 'Que signifie "تَمَام" (Tamām) ?', options: ['Commencement', 'Achèvement', 'Pause', 'Erreur'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'كَشْف', name: 'Dévoilement', instruction: 'Le fait de révéler ce qui était caché.', sound: 'Kashf', illustration: '🔍', mnemonic: 'Kāshif, celui qui dévoile', rootKey: 'K-SH-F' },
      { type: 'qcm', instruction: 'Que signifie "كَشْف" (Kashf) ?', options: ['Dissimulation', 'Dévoilement', 'Oubli', 'Silence'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَسْلَك', name: 'Voie', instruction: 'Le chemin que l\'on emprunte, au sens propre ou figuré.', sound: 'Maslak', illustration: '🛤️', mnemonic: 'Sālik, celui qui chemine', rootKey: 'S-L-K' },
      { type: 'qcm', instruction: 'Que signifie "مَسْلَك" (Maslak) ?', options: ['Impasse', 'Voie, chemin', 'Mur', 'Frontière'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 40 : parcours Fréquence Lexicale terminé, 120 mots mémorisés ! +20 XP' }
    ]
  ];

  const rootsLessons = [
    [
      { type: 'intro', letter: 'كتب', name: 'Racine K-T-B', instruction: 'La racine K-T-B (كتب) tourne autour de l\'écrit. Elle donne كِتَاب (Kitāb - Livre).', sound: 'K-T-B', illustration: '📖', mnemonic: 'كِتَاب (Kitāb - Livre)', rootKey: 'K-T-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "كتب" (K-T-B) ?', options: ['Écrire', 'Prier', 'Voyager', 'Compter'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'رحم', name: 'Racine R-H-M', instruction: 'La racine R-H-M (رحم) exprime la miséricorde. Elle donne رَحْمَة (Raḥma - Miséricorde).', sound: 'R-H-M', illustration: '🤲', mnemonic: 'رَحْمَة (Raḥma - Miséricorde)', rootKey: 'R-H-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "رحم" (R-H-M) ?', options: ['Colère', 'Miséricorde', 'Guerre', 'Silence'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'اله', name: 'Racine A-L-H', instruction: 'La racine A-L-H (اله) désigne le divin. Elle donne إِلَٰه (Ilāh - Divinité) et le nom "Allah".', sound: 'A-L-H', illustration: '🕋', mnemonic: 'إِلَٰه (Ilāh - Divinité)', rootKey: 'A-L-H' },
      { type: 'qcm', instruction: 'Que signifie la racine "اله" (A-L-H) ?', options: ['Montagne', 'Rivière', 'Dieu / Divinité', 'Étoile'], correctIndex: 2, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 1 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'قول', name: 'Racine Q-W-L', instruction: 'La racine Q-W-L (قول) tourne autour de la parole. Elle donne قُلْ (Qul - Dis !).', sound: 'Q-W-L', illustration: '🗣️', mnemonic: 'قُلْ (Qul - Dis !)', rootKey: 'Q-W-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "قول" (Q-W-L) ?', options: ['Marcher', 'Manger', 'Dire / Parler', 'Dormir'], correctIndex: 2, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'يوم', name: 'Racine Y-W-M', instruction: 'La racine Y-W-M (يوم) désigne le jour. Elle donne يَوْم (Yawm - Jour).', sound: 'Y-W-M', illustration: '☀️', mnemonic: 'يَوْم (Yawm - Jour)', rootKey: 'Y-W-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "يوم" (Y-W-M) ?', options: ['Nuit', 'Jour', 'Année', 'Heure'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حمد', name: 'Racine H-M-D', instruction: 'La racine H-M-D (حمد) exprime la louange. Elle donne حَمْد (Ḥamd - Louange) et le nom Muḥammad.', sound: 'H-M-D', illustration: '🙌', mnemonic: 'حَمْد (Ḥamd - Louange)', rootKey: 'H-M-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "حمد" (H-M-D) ?', options: ['Louer / Remercier', 'Punir', 'Oublier', 'Douter'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 2 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سلم', name: 'Racine S-L-M', instruction: 'La racine S-L-M (سلم) exprime la paix. Elle donne سَلَام (Salām - Paix) et le mot "Islam".', sound: 'S-L-M', illustration: '☮️', mnemonic: 'سَلَام (Salām - Paix)', rootKey: 'S-L-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "سلم" (S-L-M) ?', options: ['Guerre', 'Richesse', 'Paix / Soumission', 'Rapidité'], correctIndex: 2, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عبد', name: 'Racine A-B-D', instruction: 'La racine A-B-D (عبد) exprime l\'adoration. Elle donne عَبْد (ʻAbd - Serviteur).', sound: 'A-B-D', illustration: '🙏', mnemonic: 'عَبْد (ʻAbd - Serviteur)', rootKey: 'A-B-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "عبد" (A-B-D) ?', options: ['Adorer / Servir', 'Combattre', 'Voyager', 'Construire'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'ربب', name: 'Racine R-B-B', instruction: 'La racine R-B-B (ربب) exprime l\'autorité bienveillante. Elle donne رَبّ (Rabb - Seigneur).', sound: 'R-B-B', illustration: '🌍', mnemonic: 'رَبّ (Rabb - Seigneur)', rootKey: 'R-B-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "ربب" (R-B-B) ?', options: ['Ennemi', 'Seigneur / Éduquer', 'Esclave', 'Voisin'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 3 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أمن', name: 'Racine A-M-N', instruction: 'La racine A-M-N (أمن) exprime la croyance et la sécurité. Elle donne إِيمَان (Īmān - Foi).', sound: 'A-M-N', illustration: '💫', mnemonic: 'إِيمَان (Īmān - Foi)', rootKey: 'A-M-N' },
      { type: 'qcm', instruction: 'Que signifie la racine "أمن" (A-M-N) ?', options: ['Douter', 'Croire / Sécurité', 'Refuser', 'Oublier'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عمل', name: 'Racine A-M-L', instruction: 'La racine A-M-L (عمل) exprime l\'action. Elle donne عَمَل (ʻAmal - Œuvre).', sound: 'A-M-L', illustration: '🛠️', mnemonic: 'عَمَل (ʻAmal - Œuvre)', rootKey: 'A-M-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "عمل" (A-M-L) ?', options: ['Parole', 'Silence', 'Faire, œuvre', 'Pensée'], correctIndex: 2, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'صبر', name: 'Racine S-B-R', instruction: 'La racine S-B-R (صبر) exprime la patience. Elle donne صَبْر (Ṣabr - Patience).', sound: 'S-B-R', illustration: '⏳', mnemonic: 'صَبْر (Ṣabr - Patience)', rootKey: 'S-B-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "صبر" (S-B-R) ?', options: ['Hâte', 'Colère', 'Joie', 'Patience, endurance'], correctIndex: 3, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 4 : 12 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'خلق', name: 'Racine K-L-Q', instruction: 'La racine K-L-Q (خلق) exprime la création. Elle donne خَالِق (Khāliq - Créateur).', sound: 'K-L-Q', illustration: '✨', mnemonic: 'خَالِق (Khāliq - Créateur)', rootKey: 'K-L-Q' },
      { type: 'qcm', instruction: 'Que signifie la racine "خلق" (K-L-Q) ?', options: ['Détruire', 'Créer', 'Voyager', 'Compter'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'غفر', name: 'Racine GH-F-R', instruction: 'La racine GH-F-R (غفر) exprime le pardon. Elle donne غَفُور (Ghafūr - Très Pardonneur).', sound: 'GH-F-R', illustration: '🤍', mnemonic: 'غَفُور (Ghafūr - Très Pardonneur)', rootKey: 'GH-F-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "غفر" (GH-F-R) ?', options: ['Punir', 'Pardonner', 'Oublier', 'Refuser'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عذب', name: 'Racine A-DH-B', instruction: 'La racine A-DH-B (عذب) exprime le châtiment. Elle donne عَذَاب (ʻAdhāb - Châtiment).', sound: 'A-DH-B', illustration: '⚡', mnemonic: 'عَذَاب (ʻAdhāb - Châtiment)', rootKey: 'A-DH-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "عذب" (A-DH-B) ?', options: ['Récompenser', 'Châtier', 'Nourrir', 'Guider'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 5 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'شكر', name: 'Racine SH-K-R', instruction: 'La racine SH-K-R (شكر) exprime la gratitude. Elle donne شُكْر (Shukr - Gratitude).', sound: 'SH-K-R', illustration: '🙏', mnemonic: 'شُكْر (Shukr - Gratitude)', rootKey: 'SH-K-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "شكر" (SH-K-R) ?', options: ['Se plaindre', 'Remercier', 'Douter', 'Attendre'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'فضل', name: 'Racine F-D-L', instruction: 'La racine F-D-L (فضل) exprime la grâce. Elle donne فَضْل (Faḍl - Grâce).', sound: 'F-D-L', illustration: '🌟', mnemonic: 'فَضْل (Faḍl - Grâce)', rootKey: 'F-D-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "فضل" (F-D-L) ?', options: ['Dette', 'Grâce, faveur', 'Épreuve', 'Silence'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'جزي', name: 'Racine J-Z-Y', instruction: 'La racine J-Z-Y (جزي) exprime la rétribution. Elle donne جَزَاء (Jazāʼ - Rétribution).', sound: 'J-Z-Y', illustration: '⚖️', mnemonic: 'جَزَاء (Jazāʼ - Rétribution)', rootKey: 'J-Z-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "جزي" (J-Z-Y) ?', options: ['Voyager', 'Rétribuer', 'Dormir', 'Construire'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 6 : 18 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'نزل', name: 'Racine N-Z-L', instruction: 'La racine N-Z-L (نزل) exprime la descente. Elle donne نُزُول (Nuzūl - Descente), employée pour la révélation.', sound: 'N-Z-L', illustration: '⬇️', mnemonic: 'نُزُول (Nuzūl - Descente)', rootKey: 'N-Z-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "نزل" (N-Z-L) ?', options: ['Monter', 'Descendre, révéler', 'Voyager', 'Courir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'هدي', name: 'Racine H-D-Y', instruction: 'La racine H-D-Y (هدي) exprime le guidage. Elle donne هُدًى (Hudā - Guidance).', sound: 'H-D-Y', illustration: '🧭', mnemonic: 'هُدًى (Hudā - Guidance)', rootKey: 'H-D-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "هدي" (H-D-Y) ?', options: ['Égarer', 'Guider', 'Punir', 'Attendre'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'وقي', name: 'Racine W-Q-Y', instruction: 'La racine W-Q-Y (وقي) exprime la protection. Elle donne تَقْوَى (Taqwā - Piété).', sound: 'W-Q-Y', illustration: '🛡️', mnemonic: 'تَقْوَى (Taqwā - Piété)', rootKey: 'W-Q-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "وقي" (W-Q-Y) ?', options: ['Exposer', 'Protéger, craindre', 'Vendre', 'Oublier'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 7 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'جنن', name: 'Racine J-N-N', instruction: 'La racine J-N-N (جنن) exprime ce qui est caché. Elle donne جَنَّة (Jannah - Paradis, jardin caché par sa végétation).', sound: 'J-N-N', illustration: '🌳', mnemonic: 'جَنَّة (Jannah - Paradis)', rootKey: 'J-N-N' },
      { type: 'qcm', instruction: 'Que signifie la racine "جنن" (J-N-N) ?', options: ['Cacher, jardin', 'Ouvrir', 'Brûler', 'Compter'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حيي', name: 'Racine H-Y-Y', instruction: 'La racine H-Y-Y (حيي) exprime la vie. Elle donne حَيَاة (Ḥayāh - Vie).', sound: 'H-Y-Y', illustration: '🌱', mnemonic: 'حَيَاة (Ḥayāh - Vie)', rootKey: 'H-Y-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "حيي" (H-Y-Y) ?', options: ['Mourir', 'Vivre', 'Dormir', 'Partir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'موت', name: 'Racine M-W-T', instruction: 'La racine M-W-T (موت) exprime la mort. Elle donne مَوْت (Mawt - Mort), opposée à Ḥayāh.', sound: 'M-W-T', illustration: '🕊️', mnemonic: 'مَوْت (Mawt - Mort)', rootKey: 'M-W-T' },
      { type: 'qcm', instruction: 'Que signifie la racine "موت" (M-W-T) ?', options: ['Naître', 'Mourir', 'Grandir', 'Voyager'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 8 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'صلو', name: 'Racine S-L-W', instruction: 'La racine S-L-W (صلو) exprime la prière. Elle donne صَلَاة (Ṣalāh - Prière).', sound: 'S-L-W', illustration: '🕌', mnemonic: 'صَلَاة (Ṣalāh - Prière)', rootKey: 'S-L-W' },
      { type: 'qcm', instruction: 'Que signifie la racine "صلو" (S-L-W) ?', options: ['Prier', 'Jeûner', 'Voyager', 'Donner'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'زكو', name: 'Racine Z-K-W', instruction: 'La racine Z-K-W (زكو) exprime la purification. Elle donne زَكَاة (Zakāh - Aumône purificatrice).', sound: 'Z-K-W', illustration: '🤲', mnemonic: 'زَكَاة (Zakāh - Aumône)', rootKey: 'Z-K-W' },
      { type: 'qcm', instruction: 'Que signifie la racine "زكو" (Z-K-W) ?', options: ['Salir', 'Purifier', 'Cacher', 'Vendre'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'رسل', name: 'Racine R-S-L', instruction: 'La racine R-S-L (رسل) exprime l\'envoi. Elle donne رَسُول (Rasūl - Messager).', sound: 'R-S-L', illustration: '📜', mnemonic: 'رَسُول (Rasūl - Messager)', rootKey: 'R-S-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "رسل" (R-S-L) ?', options: ['Recevoir', 'Envoyer', 'Garder', 'Cacher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 9 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'علم', name: 'Racine A-L-M', instruction: 'La racine A-L-M (علم) exprime le savoir. Elle donne عِلْم (ʻIlm - Savoir).', sound: 'A-L-M', illustration: '🧠', mnemonic: 'عِلْم (ʻIlm - Savoir)', rootKey: 'A-L-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "علم" (A-L-M) ?', options: ['Ignorer', 'Savoir', 'Douter', 'Oublier'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حكم', name: 'Racine H-K-M', instruction: 'La racine H-K-M (حكم) exprime le jugement et la sagesse. Elle donne حِكْمَة (Ḥikma - Sagesse).', sound: 'H-K-M', illustration: '🦉', mnemonic: 'حِكْمَة (Ḥikma - Sagesse)', rootKey: 'H-K-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "حكم" (H-K-M) ?', options: ['Juger, sagesse', 'Voyager', 'Construire', 'Dormir'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'قدر', name: 'Racine Q-D-R', instruction: 'La racine Q-D-R (قدر) exprime le pouvoir et le destin. Elle donne قُدْرَة (Qudra - Pouvoir).', sound: 'Q-D-R', illustration: '💪', mnemonic: 'قُدْرَة (Qudra - Pouvoir)', rootKey: 'Q-D-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "قدر" (Q-D-R) ?', options: ['Faiblesse', 'Pouvoir, destin', 'Silence', 'Doute'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 10 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'نعم', name: 'Racine N-A-M', instruction: 'La racine N-A-M (نعم) exprime le bienfait. Elle donne نِعْمَة (Niʻma - Bienfait).', sound: 'N-A-M', illustration: '🎁', mnemonic: 'نِعْمَة (Niʻma - Bienfait)', rootKey: 'N-A-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "نعم" (N-A-M) ?', options: ['Épreuve', 'Bienfait', 'Perte', 'Attente'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حبب', name: 'Racine H-B-B', instruction: 'La racine H-B-B (حبب) exprime l\'amour. Elle donne حُبّ (Ḥubb - Amour).', sound: 'H-B-B', illustration: '❤️', mnemonic: 'حُبّ (Ḥubb - Amour)', rootKey: 'H-B-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "حبب" (H-B-B) ?', options: ['Haïr', 'Aimer', 'Fuir', 'Ignorer'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'برك', name: 'Racine B-R-K', instruction: 'La racine B-R-K (برك) exprime la bénédiction. Elle donne بَرَكَة (Baraka - Bénédiction).', sound: 'B-R-K', illustration: '🌿', mnemonic: 'بَرَكَة (Baraka - Bénédiction)', rootKey: 'B-R-K' },
      { type: 'qcm', instruction: 'Que signifie la racine "برك" (B-R-K) ?', options: ['Maudire', 'Bénir', 'Détruire', 'Oublier'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 11 : 33 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'فتح', name: 'Racine F-T-H', instruction: 'La racine F-T-H (فتح) exprime l\'ouverture et la victoire. Elle donne فَتْح (Fatḥ - Victoire).', sound: 'F-T-H', illustration: '🚪', mnemonic: 'فَتْح (Fatḥ - Victoire)', rootKey: 'F-T-H' },
      { type: 'qcm', instruction: 'Que signifie la racine "فتح" (F-T-H) ?', options: ['Fermer', 'Ouvrir, victoire', 'Détruire', 'Cacher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'غيب', name: 'Racine GH-Y-B', instruction: 'La racine GH-Y-B (غيب) exprime l\'invisible. Elle donne غَيْب (Ghayb - L\'invisible).', sound: 'GH-Y-B', illustration: '🌫️', mnemonic: 'غَيْب (Ghayb - L\'invisible)', rootKey: 'GH-Y-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "غيب" (GH-Y-B) ?', options: ['Visible', 'Invisible, absent', 'Proche', 'Bruyant'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'شهد', name: 'Racine SH-H-D', instruction: 'La racine SH-H-D (شهد) exprime le témoignage. Elle donne شَهَادَة (Shahāda - Témoignage).', sound: 'SH-H-D', illustration: '📜', mnemonic: 'شَهَادَة (Shahāda - Témoignage)', rootKey: 'SH-H-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "شهد" (SH-H-D) ?', options: ['Douter', 'Témoigner', 'Oublier', 'Fuir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 12 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بين', name: 'Racine B-Y-N', instruction: 'La racine B-Y-N (بين) exprime la clarté. Elle donne بَيَان (Bayān - Clarté).', sound: 'B-Y-N', illustration: '💡', mnemonic: 'بَيَان (Bayān - Clarté)', rootKey: 'B-Y-N' },
      { type: 'qcm', instruction: 'Que signifie la racine "بين" (B-Y-N) ?', options: ['Confusion', 'Clarté, distinction', 'Silence', 'Vitesse'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'وجد', name: 'Racine W-J-D', instruction: 'La racine W-J-D (وجد) exprime l\'existence. Elle donne وُجُود (Wujūd - Existence).', sound: 'W-J-D', illustration: '🌌', mnemonic: 'وُجُود (Wujūd - Existence)', rootKey: 'W-J-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "وجد" (W-J-D) ?', options: ['Trouver, exister', 'Perdre', 'Chercher en vain', 'Ignorer'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حسن', name: 'Racine H-S-N', instruction: 'La racine H-S-N (حسن) exprime la beauté et le bien. Elle donne حُسْن (Ḥusn - Beauté).', sound: 'H-S-N', illustration: '🌸', mnemonic: 'حُسْن (Ḥusn - Beauté)', rootKey: 'H-S-N' },
      { type: 'qcm', instruction: 'Que signifie la racine "حسن" (H-S-N) ?', options: ['Laideur', 'Beauté, bien', 'Colère', 'Fatigue'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 13 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سعد', name: 'Racine S-A-D', instruction: 'La racine S-A-D (سعد) exprime le bonheur. Elle donne سَعَادَة (Saʻāda - Bonheur).', sound: 'S-A-D', illustration: '😊', mnemonic: 'سَعَادَة (Saʻāda - Bonheur)', rootKey: 'S-A-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "سعد" (S-A-D) ?', options: ['Tristesse', 'Bonheur', 'Colère', 'Fatigue'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'ذكر', name: 'Racine DH-K-R', instruction: 'La racine DH-K-R (ذكر) exprime le rappel. Elle donne ذِكْر (Dhikr - Rappel, invocation).', sound: 'DH-K-R', illustration: '📿', mnemonic: 'ذِكْر (Dhikr - Rappel)', rootKey: 'DH-K-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "ذكر" (DH-K-R) ?', options: ['Oublier', 'Rappel, mention', 'Cacher', 'Refuser'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'سجد', name: 'Racine S-J-D', instruction: 'La racine S-J-D (سجد) exprime la prosternation. Elle donne سُجُود (Sujūd - Prosternation).', sound: 'S-J-D', illustration: '🙇', mnemonic: 'سُجُود (Sujūd - Prosternation)', rootKey: 'S-J-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "سجد" (S-J-D) ?', options: ['Se lever', 'Se prosterner', 'Courir', 'Parler'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 14 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'صدق', name: 'Racine S-D-Q', instruction: 'La racine S-D-Q (صدق) exprime la véracité. Elle donne صَادِق (Ṣādiq - Véridique).', sound: 'S-D-Q', illustration: '✅', mnemonic: 'صَادِق (Ṣādiq - Véridique)', rootKey: 'S-D-Q' },
      { type: 'qcm', instruction: 'Que signifie la racine "صدق" (S-D-Q) ?', options: ['Mensonge', 'Véracité', 'Doute', 'Silence'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'فرق', name: 'Racine F-R-Q', instruction: 'La racine F-R-Q (فرق) exprime la distinction. Elle donne فُرْقَان (Furqān - Le Discernement, nom du Coran).', sound: 'F-R-Q', illustration: '⚔️', mnemonic: 'فُرْقَان (Furqān - Discernement)', rootKey: 'F-R-Q' },
      { type: 'qcm', instruction: 'Que signifie la racine "فرق" (F-R-Q) ?', options: ['Unir', 'Distinguer, séparer', 'Cacher', 'Suivre'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'ختم', name: 'Racine KH-T-M', instruction: 'La racine KH-T-M (ختم) exprime le sceau. Elle donne خَاتَم (Khātam - Sceau).', sound: 'KH-T-M', illustration: '💍', mnemonic: 'خَاتَم (Khātam - Sceau)', rootKey: 'KH-T-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "ختم" (KH-T-M) ?', options: ['Commencer', 'Sceller, terminer', 'Ouvrir', 'Chercher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 15 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'حمل', name: 'Racine H-M-L', instruction: 'La racine H-M-L (حمل) exprime le fait de porter. Elle donne حَمْل (Ḥaml - Fardeau, portée).', sound: 'H-M-L', illustration: '🎒', mnemonic: 'حَمْل (Ḥaml - Fardeau)', rootKey: 'H-M-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "حمل" (H-M-L) ?', options: ['Poser', 'Porter', 'Vendre', 'Casser'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عبر', name: 'Racine A-B-R', instruction: 'La racine A-B-R (عبر) exprime la traversée et la leçon tirée. Elle donne عِبْرَة (ʻIbra - Leçon).', sound: 'A-B-R', illustration: '📖', mnemonic: 'عِبْرَة (ʻIbra - Leçon)', rootKey: 'A-B-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "عبر" (A-B-R) ?', options: ['Rester', 'Traverser, tirer leçon', 'Refuser', 'Dormir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'قوم', name: 'Racine Q-W-M', instruction: 'La racine Q-W-M (قوم) exprime le fait de se tenir debout. Elle donne قَوْم (Qawm - Peuple).', sound: 'Q-W-M', illustration: '👥', mnemonic: 'قَوْم (Qawm - Peuple)', rootKey: 'Q-W-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "قوم" (Q-W-M) ?', options: ['S\'asseoir', 'Se tenir debout, peuple', 'Voyager', 'Dormir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 16 : 48 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'نصر', name: 'Racine N-S-R', instruction: 'La racine N-S-R (نصر) exprime le secours. Elle donne نَصْر (Naṣr - Victoire, secours).', sound: 'N-S-R', illustration: '🏆', mnemonic: 'نَصْر (Naṣr - Victoire)', rootKey: 'N-S-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "نصر" (N-S-R) ?', options: ['Abandonner', 'Aider, secourir', 'Combattre', 'Fuir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'غضب', name: 'Racine GH-D-B', instruction: 'La racine GH-D-B (غضب) exprime la colère. Elle donne غَضَب (Ghaḍab - Colère).', sound: 'GH-D-B', illustration: '😠', mnemonic: 'غَضَب (Ghaḍab - Colère)', rootKey: 'GH-D-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "غضب" (GH-D-B) ?', options: ['Joie', 'Colère', 'Calme', 'Patience'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'خوف', name: 'Racine KH-W-F', instruction: 'La racine KH-W-F (خوف) exprime la crainte. Elle donne خَوْف (Khawf - Peur).', sound: 'KH-W-F', illustration: '😨', mnemonic: 'خَوْف (Khawf - Peur)', rootKey: 'KH-W-F' },
      { type: 'qcm', instruction: 'Que signifie la racine "خوف" (KH-W-F) ?', options: ['Courage', 'Craindre', 'Rire', 'Dormir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 17 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'رجع', name: 'Racine R-J-A', instruction: 'La racine R-J-A (رجع) exprime le retour. Elle donne رُجُوع (Rujūʻ - Retour).', sound: 'R-J-A', illustration: '↩️', mnemonic: 'رُجُوع (Rujūʻ - Retour)', rootKey: 'R-J-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "رجع" (R-J-A) ?', options: ['Partir', 'Retourner', 'Rester', 'Chercher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حفظ', name: 'Racine H-F-Z', instruction: 'La racine H-F-Z (حفظ) exprime la préservation. Elle donne حِفْظ (Ḥifẓ - Mémorisation).', sound: 'H-F-Z', illustration: '🧠', mnemonic: 'حِفْظ (Ḥifẓ - Mémorisation)', rootKey: 'H-F-Z' },
      { type: 'qcm', instruction: 'Que signifie la racine "حفظ" (H-F-Z) ?', options: ['Oublier', 'Préserver, mémoriser', 'Perdre', 'Détruire'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'تبع', name: 'Racine T-B-A', instruction: 'La racine T-B-A (تبع) exprime le fait de suivre. Elle donne اتِّبَاع (Ittibāʻ - Suivre).', sound: 'T-B-A', illustration: '👣', mnemonic: 'اتِّبَاع (Ittibāʻ - Suivre)', rootKey: 'T-B-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "تبع" (T-B-A) ?', options: ['Précéder', 'Suivre', 'Ignorer', 'Fuir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 18 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ضلل', name: 'Racine D-L-L', instruction: 'La racine D-L-L (ضلل) exprime l\'égarement. Elle donne ضَلَال (Ḍalāl - Égarement).', sound: 'D-L-L', illustration: '🌀', mnemonic: 'ضَلَال (Ḍalāl - Égarement)', rootKey: 'D-L-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "ضلل" (D-L-L) ?', options: ['Guider', 'Égarer', 'Trouver', 'Voir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'نصح', name: 'Racine N-S-H', instruction: 'La racine N-S-H (نصح) exprime le conseil. Elle donne نَصِيحَة (Naṣīḥa - Conseil).', sound: 'N-S-H', illustration: '💡', mnemonic: 'نَصِيحَة (Naṣīḥa - Conseil)', rootKey: 'N-S-H' },
      { type: 'qcm', instruction: 'Que signifie la racine "نصح" (N-S-H) ?', options: ['Tromper', 'Conseiller', 'Cacher', 'Ignorer'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'بشر', name: 'Racine B-SH-R', instruction: 'La racine B-SH-R (بشر) exprime l\'humanité et l\'annonce. Elle donne بُشْرَى (Bushrā - Bonne nouvelle).', sound: 'B-SH-R', illustration: '📯', mnemonic: 'بُشْرَى (Bushrā - Bonne nouvelle)', rootKey: 'B-SH-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "بشر" (B-SH-R) ?', options: ['Mauvaise nouvelle', 'Annoncer, humanité', 'Silence', 'Doute'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 19 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'غني', name: 'Racine GH-N-Y', instruction: 'La racine GH-N-Y (غني) exprime la richesse. Elle donne غِنَى (Ghinā - Richesse).', sound: 'GH-N-Y', illustration: '💰', mnemonic: 'غِنَى (Ghinā - Richesse)', rootKey: 'GH-N-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "غني" (GH-N-Y) ?', options: ['Pauvreté', 'Richesse', 'Faim', 'Soif'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'فقر', name: 'Racine F-Q-R', instruction: 'La racine F-Q-R (فقر) exprime la pauvreté. Elle donne فَقِير (Faqīr - Pauvre).', sound: 'F-Q-R', illustration: '🪫', mnemonic: 'فَقِير (Faqīr - Pauvre)', rootKey: 'F-Q-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "فقر" (F-Q-R) ?', options: ['Richesse', 'Pauvreté', 'Force', 'Beauté'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'دني', name: 'Racine D-N-Y', instruction: 'La racine D-N-Y (دني) exprime la proximité. Elle donne دُنْيَا (Dunyā - Ce bas monde).', sound: 'D-N-Y', illustration: '🌍', mnemonic: 'دُنْيَا (Dunyā - Ce bas monde)', rootKey: 'D-N-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "دني" (D-N-Y) ?', options: ['L\'au-delà lointain', 'Ce bas monde, proximité', 'Le ciel', 'L\'océan'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 20 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أخر', name: 'Racine A-KH-R', instruction: 'La racine A-KH-R (أخر) exprime ce qui est autre ou dernier. Elle donne آخِرَة (Ākhira - L\'au-delà).', sound: 'A-KH-R', illustration: '🌅', mnemonic: 'آخِرَة (Ākhira - L\'au-delà)', rootKey: 'A-KH-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "أخر" (A-KH-R) ?', options: ['Premier', 'Autre, dernier', 'Milieu', 'Identique'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'قرأ', name: 'Racine Q-R-A', instruction: 'La racine Q-R-A (قرأ) exprime la lecture. Elle donne قِرَاءَة (Qirāʼa - Lecture) et le mot "Qurʼān".', sound: 'Q-R-A', illustration: '📖', mnemonic: 'قِرَاءَة (Qirāʼa - Lecture)', rootKey: 'Q-R-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "قرأ" (Q-R-A) ?', options: ['Écrire', 'Lire, réciter', 'Écouter', 'Dessiner'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'كبر', name: 'Racine K-B-R', instruction: 'La racine K-B-R (كبر) exprime la grandeur. Elle donne كَبِير (Kabīr - Grand), comme dans "Allāhu Akbar".', sound: 'K-B-R', illustration: '🏔️', mnemonic: 'كَبِير (Kabīr - Grand)', rootKey: 'K-B-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "كبر" (K-B-R) ?', options: ['Petitesse', 'Grandeur', 'Faiblesse', 'Vitesse'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 21 : 63 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'جهد', name: 'Racine J-H-D', instruction: 'La racine J-H-D (جهد) exprime l\'effort. Elle donne جِهَاد (Jihād - Effort, lutte).', sound: 'J-H-D', illustration: '💪', mnemonic: 'جِهَاد (Jihād - Effort)', rootKey: 'J-H-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "جهد" (J-H-D) ?', options: ['Repos', 'Effort, lutte', 'Sommeil', 'Silence'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'سبق', name: 'Racine S-B-Q', instruction: 'La racine S-B-Q (سبق) exprime la précédence. Elle donne سَابِق (Sābiq - Précédent).', sound: 'S-B-Q', illustration: '🏃', mnemonic: 'سَابِق (Sābiq - Précédent)', rootKey: 'S-B-Q' },
      { type: 'qcm', instruction: 'Que signifie la racine "سبق" (S-B-Q) ?', options: ['Suivre', 'Précéder', 'Attendre', 'Retarder'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'خلف', name: 'Racine KH-L-F', instruction: 'La racine KH-L-F (خلف) exprime la succession. Elle donne خَلِيفَة (Khalīfa - Successeur).', sound: 'KH-L-F', illustration: '👑', mnemonic: 'خَلِيفَة (Khalīfa - Successeur)', rootKey: 'KH-L-F' },
      { type: 'qcm', instruction: 'Que signifie la racine "خلف" (KH-L-F) ?', options: ['Précéder', 'Succéder, différer', 'Unir', 'Détruire'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 22 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'غفل', name: 'Racine GH-F-L', instruction: 'La racine GH-F-L (غفل) exprime la négligence. Elle donne غَفْلَة (Ghaflah - Insouciance).', sound: 'GH-F-L', illustration: '💤', mnemonic: 'غَفْلَة (Ghaflah - Insouciance)', rootKey: 'GH-F-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "غفل" (GH-F-L) ?', options: ['Se souvenir', 'Négliger', 'Comprendre', 'Écouter'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'جهل', name: 'Racine J-H-L', instruction: 'La racine J-H-L (جهل) exprime l\'ignorance. Elle donne جَهْل (Jahl - Ignorance).', sound: 'J-H-L', illustration: '🌫️', mnemonic: 'جَهْل (Jahl - Ignorance)', rootKey: 'J-H-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "جهل" (J-H-L) ?', options: ['Savoir', 'Ignorance', 'Sagesse', 'Patience'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عقل', name: 'Racine A-Q-L', instruction: 'La racine A-Q-L (عقل) exprime l\'intellect. Elle donne عَقْل (ʻAql - Raison).', sound: 'A-Q-L', illustration: '🧠', mnemonic: 'عَقْل (ʻAql - Raison)', rootKey: 'A-Q-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "عقل" (A-Q-L) ?', options: ['Le corps', 'L\'intellect', 'Le cœur', 'La main'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 23 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'حسب', name: 'Racine H-S-B', instruction: 'La racine H-S-B (حسب) exprime le compte. Elle donne حِسَاب (Ḥisāb - Compte).', sound: 'H-S-B', illustration: '🧮', mnemonic: 'حِسَاب (Ḥisāb - Compte)', rootKey: 'H-S-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "حسب" (H-S-B) ?', options: ['Oublier', 'Compter, suffire', 'Perdre', 'Cacher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'وسع', name: 'Racine W-S-A', instruction: 'La racine W-S-A (وسع) exprime l\'étendue. Elle donne وَاسِع (Wāsiʻ - Vaste, nom divin).', sound: 'W-S-A', illustration: '🌌', mnemonic: 'وَاسِع (Wāsiʻ - Vaste)', rootKey: 'W-S-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "وسع" (W-S-A) ?', options: ['Étroit', 'Étendre, vaste', 'Petit', 'Rapide'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'جمع', name: 'Racine J-M-A', instruction: 'La racine J-M-A (جمع) exprime le rassemblement. Elle donne جَمَاعَة (Jamāʻa - Communauté).', sound: 'J-M-A', illustration: '🕌', mnemonic: 'جَمَاعَة (Jamāʻa - Communauté)', rootKey: 'J-M-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "جمع" (J-M-A) ?', options: ['Disperser', 'Rassembler', 'Séparer', 'Détruire'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 24 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'فرد', name: 'Racine F-R-D', instruction: 'La racine F-R-D (فرد) exprime l\'unicité individuelle. Elle donne فَرْد (Fard - Individu).', sound: 'F-R-D', illustration: '🧍', mnemonic: 'فَرْد (Fard - Individu)', rootKey: 'F-R-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "فرد" (F-R-D) ?', options: ['Groupe', 'Unique, individuel', 'Foule', 'Couple'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'وحد', name: 'Racine W-H-D', instruction: 'La racine W-H-D (وحد) exprime l\'unicité divine. Elle donne تَوْحِيد (Tawḥīd - Monothéisme).', sound: 'W-H-D', illustration: '☝️', mnemonic: 'تَوْحِيد (Tawḥīd - Monothéisme)', rootKey: 'W-H-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "وحد" (W-H-D) ?', options: ['Multiplicité', 'Unicité', 'Division', 'Association'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'رحل', name: 'Racine R-H-L', instruction: 'La racine R-H-L (رحل) exprime le voyage. Elle donne رِحْلَة (Riḥla - Voyage).', sound: 'R-H-L', illustration: '🧳', mnemonic: 'رِحْلَة (Riḥla - Voyage)', rootKey: 'R-H-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "رحل" (R-H-L) ?', options: ['Rester', 'Voyager', 'Dormir', 'Construire'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 25 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بعث', name: 'Racine B-A-TH', instruction: 'La racine B-A-TH (بعث) exprime la résurrection. Elle donne بَعْث (Baʻth - Résurrection).', sound: 'B-A-TH', illustration: '🌅', mnemonic: 'بَعْث (Baʻth - Résurrection)', rootKey: 'B-A-TH' },
      { type: 'qcm', instruction: 'Que signifie la racine "بعث" (B-A-TH) ?', options: ['Enterrer', 'Ressusciter, envoyer', 'Oublier', 'Cacher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'خلص', name: 'Racine KH-L-S', instruction: 'La racine KH-L-S (خلص) exprime la sincérité. Elle donne إِخْلَاص (Ikhlāṣ - Sincérité).', sound: 'KH-L-S', illustration: '💎', mnemonic: 'إِخْلَاص (Ikhlāṣ - Sincérité)', rootKey: 'KH-L-S' },
      { type: 'qcm', instruction: 'Que signifie la racine "خلص" (KH-L-S) ?', options: ['Hypocrisie', 'Sincérité, pureté', 'Doute', 'Mélange'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'عدل', name: 'Racine A-D-L', instruction: 'La racine A-D-L (عدل) exprime la justice. Elle donne عَدْل (ʻAdl - Justice).', sound: 'A-D-L', illustration: '⚖️', mnemonic: 'عَدْل (ʻAdl - Justice)', rootKey: 'A-D-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "عدل" (A-D-L) ?', options: ['Injustice', 'Justice', 'Doute', 'Rapidité'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 26 : 78 racines explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'غرب', name: 'Racine GH-R-B', instruction: 'La racine GH-R-B (غرب) exprime l\'ouest. Elle donne غَرْب (Gharb - Ouest).', sound: 'GH-R-B', illustration: '🌇', mnemonic: 'غَرْب (Gharb - Ouest)', rootKey: 'GH-R-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "غرب" (GH-R-B) ?', options: ['Est', 'Ouest, étrange', 'Nord', 'Sud'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'شرق', name: 'Racine SH-R-Q', instruction: 'La racine SH-R-Q (شرق) exprime l\'est. Elle donne شُرُوق (Shurūq - Lever du soleil).', sound: 'SH-R-Q', illustration: '🌅', mnemonic: 'شُرُوق (Shurūq - Lever du soleil)', rootKey: 'SH-R-Q' },
      { type: 'qcm', instruction: 'Que signifie la racine "شرق" (SH-R-Q) ?', options: ['Ouest', 'Est, lever', 'Nord', 'Sud'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'تمم', name: 'Racine T-M-M', instruction: 'La racine T-M-M (تمم) exprime l\'achèvement. Elle donne تَمَام (Tamām - Achèvement).', sound: 'T-M-M', illustration: '✅', mnemonic: 'تَمَام (Tamām - Achèvement)', rootKey: 'T-M-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "تمم" (T-M-M) ?', options: ['Commencer', 'Achever', 'Détruire', 'Cacher'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 27 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بدأ', name: 'Racine B-D-A', instruction: 'La racine B-D-A (بدأ) exprime le commencement. Elle donne بِدَايَة (Bidāya - Début).', sound: 'B-D-A', illustration: '🏁', mnemonic: 'بِدَايَة (Bidāya - Début)', rootKey: 'B-D-A' },
      { type: 'qcm', instruction: 'Que signifie la racine "بدأ" (B-D-A) ?', options: ['Finir', 'Commencer', 'Attendre', 'Répéter'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'نهي', name: 'Racine N-H-Y', instruction: 'La racine N-H-Y (نهي) exprime la fin et l\'interdiction. Elle donne نِهَايَة (Nihāya - Fin).', sound: 'N-H-Y', illustration: '🏁', mnemonic: 'نِهَايَة (Nihāya - Fin)', rootKey: 'N-H-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "نهي" (N-H-Y) ?', options: ['Commencer', 'Finir, interdire', 'Permettre', 'Continuer'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حلل', name: 'Racine H-L-L', instruction: 'La racine H-L-L (حلل) exprime la résolution et la permission. Elle donne حَلَال (Ḥalāl - Permis).', sound: 'H-L-L', illustration: '🔓', mnemonic: 'حَلَال (Ḥalāl - Permis)', rootKey: 'H-L-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "حلل" (H-L-L) ?', options: ['Interdire', 'Résoudre, permettre', 'Cacher', 'Compliquer'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 28 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بني', name: 'Racine B-N-Y', instruction: 'La racine B-N-Y (بني) exprime la construction. Elle donne بِنَاء (Bināʼ - Construction).', sound: 'B-N-Y', illustration: '🏗️', mnemonic: 'بِنَاء (Bināʼ - Construction)', rootKey: 'B-N-Y' },
      { type: 'qcm', instruction: 'Que signifie la racine "بني" (B-N-Y) ?', options: ['Détruire', 'Construire', 'Vendre', 'Acheter'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'كشف', name: 'Racine K-SH-F', instruction: 'La racine K-SH-F (كشف) exprime le dévoilement. Elle donne كَشْف (Kashf - Dévoilement).', sound: 'K-SH-F', illustration: '🔍', mnemonic: 'كَشْف (Kashf - Dévoilement)', rootKey: 'K-SH-F' },
      { type: 'qcm', instruction: 'Que signifie la racine "كشف" (K-SH-F) ?', options: ['Cacher', 'Dévoiler', 'Ignorer', 'Fermer'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'ظهر', name: 'Racine Z-H-R', instruction: 'La racine Z-H-R (ظهر) exprime l\'apparition. Elle donne ظَاهِر (Ẓāhir - Apparent, nom divin).', sound: 'Z-H-R', illustration: '🌟', mnemonic: 'ظَاهِر (Ẓāhir - Apparent)', rootKey: 'Z-H-R' },
      { type: 'qcm', instruction: 'Que signifie la racine "ظهر" (Z-H-R) ?', options: ['Disparaître', 'Apparaître', 'Se cacher', 'S\'endormir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 29 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بطن', name: 'Racine B-T-N', instruction: 'La racine B-T-N (بطن) exprime ce qui est caché. Elle donne بَاطِن (Bāṭin - Caché, nom divin).', sound: 'B-T-N', illustration: '🌑', mnemonic: 'بَاطِن (Bāṭin - Caché)', rootKey: 'B-T-N' },
      { type: 'qcm', instruction: 'Que signifie la racine "بطن" (B-T-N) ?', options: ['Visible', 'Intérieur, caché', 'Lointain', 'Bruyant'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'قدم', name: 'Racine Q-D-M', instruction: 'La racine Q-D-M (قدم) exprime l\'ancienneté et le progrès. Elle donne قَدِيم (Qadīm - Ancien).', sound: 'Q-D-M', illustration: '📜', mnemonic: 'قَدِيم (Qadīm - Ancien)', rootKey: 'Q-D-M' },
      { type: 'qcm', instruction: 'Que signifie la racine "قدم" (Q-D-M) ?', options: ['Nouveau', 'Avancer, ancien', 'Reculer', 'S\'arrêter'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'حرب', name: 'Racine H-R-B', instruction: 'La racine H-R-B (حرب) exprime la guerre. Elle donne حَرْب (Ḥarb - Guerre).', sound: 'H-R-B', illustration: '⚔️', mnemonic: 'حَرْب (Ḥarb - Guerre)', rootKey: 'H-R-B' },
      { type: 'qcm', instruction: 'Que signifie la racine "حرب" (H-R-B) ?', options: ['Paix', 'Guerre', 'Amour', 'Silence'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 30 : 3 racines explorées ! +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سلك', name: 'Racine S-L-K', instruction: 'La racine S-L-K (سلك) exprime le fait de suivre un chemin. Elle donne مَسْلَك (Maslak - Voie).', sound: 'S-L-K', illustration: '🛤️', mnemonic: 'مَسْلَك (Maslak - Voie)', rootKey: 'S-L-K' },
      { type: 'qcm', instruction: 'Que signifie la racine "سلك" (S-L-K) ?', options: ['S\'arrêter', 'Suivre un chemin', 'Se perdre', 'Revenir'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'وصل', name: 'Racine W-S-L', instruction: 'La racine W-S-L (وصل) exprime le lien et l\'arrivée. Elle donne وُصُول (Wuṣūl - Arrivée).', sound: 'W-S-L', illustration: '🏁', mnemonic: 'وُصُول (Wuṣūl - Arrivée)', rootKey: 'W-S-L' },
      { type: 'qcm', instruction: 'Que signifie la racine "وصل" (W-S-L) ?', options: ['Partir', 'Relier, arriver', 'Rompre', 'Perdre'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'intro', letter: 'قصد', name: 'Racine Q-S-D', instruction: 'La racine Q-S-D (قصد) exprime l\'intention. Elle donne قَصْد (Qaṣd - Intention).', sound: 'Q-S-D', illustration: '🎯', mnemonic: 'قَصْد (Qaṣd - Intention)', rootKey: 'Q-S-D' },
      { type: 'qcm', instruction: 'Que signifie la racine "قصد" (Q-S-D) ?', options: ['Hasard', 'Intention, diriger', 'Oubli', 'Refus'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 31 : parcours Le Secret des Racines terminé, 94 racines explorées ! +20 XP' }
    ]
  ];

  const tajwidLessons = [
    [
      {
        type: 'intro',
        letter: 'مِنْ خَيْرٍ',
        name: 'Iẓhār (إظهار) — Clarté',
        instruction: 'Quand un Nūn Sākin (نْ) ou un Tanwīn est suivi d\'une des 6 lettres gutturales (ء ه ع ح غ خ), on le prononce clairement, sans le modifier ni le nasaliser.',
        sound: 'Min Khayr',
        illustration: '🔊',
        mnemonic: '6 lettres gutturales : ء ه ع ح غ خ'
      },
      { type: 'qcm', instruction: 'Quelle règle s\'applique quand نْ est suivi d\'une lettre gutturale (ء ه ع ح غ خ) ?', options: ['Idghām', 'Iẓhār (clarté)', 'Ikhfāʼ', 'Iqlāb'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'مَنْ آمَنَ',
        name: 'Exemple : مَنْ آمَنَ',
        instruction: 'Le نْ de "مَنْ" est suivi du Hamza (ء) de "آمَنَ" : on prononce le نْ clairement, sans nasaliser.',
        sound: 'Man Āmana',
        illustration: '🔊',
        mnemonic: 'نْ + ء = Iẓhār'
      },
      { type: 'qcm', instruction: 'Comment se prononce le نْ dans "مَنْ آمَنَ" ?', options: ['Il disparaît', 'Il devient م', 'Clairement (Iẓhār)', 'Il se nasalise longuement'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'عَلِيمٌ حَكِيمٌ',
        name: 'Exemple : عَلِيمٌ حَكِيمٌ',
        instruction: 'Le Tanwīn de "عَلِيمٌ" est suivi du Ḥāʼ (ح) de "حَكِيمٌ" : Iẓhār, prononciation claire.',
        sound: 'ʻAlīmun Ḥakīm',
        illustration: '🔊',
        mnemonic: 'Tanwīn + ح = Iẓhār'
      },
      { type: 'qcm', instruction: 'Quelle lettre déclenche l\'Iẓhār dans "عَلِيمٌ حَكِيمٌ" ?', options: ['ح', 'ب', 'ي', 'ت'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 1 (Tajwid) terminée ! Vous maîtrisez l\'Iẓhār. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'مَن يَقُولُ',
        name: 'Idghām (إدغام) — Assimilation',
        instruction: 'Quand un Nūn Sākin ou un Tanwīn est suivi d\'une des 6 lettres "يرملون" (ي ر م ل و ن), il s\'assimile dans la lettre suivante : on ne l\'entend plus séparément.',
        sound: 'Yaqūlu',
        illustration: '🔀',
        mnemonic: 'Retenez : ي ر م ل و ن'
      },
      { type: 'qcm', instruction: 'Quelle règle s\'applique quand نْ est suivi d\'une des lettres "يرملون" ?', options: ['Iẓhār', 'Idghām (assimilation)', 'Qalqala', 'Ghunna seule'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'مِن رَّبِّهِمْ',
        name: 'Exemple : مِن رَّبِّهِمْ',
        instruction: 'Le نْ de "مِن" est suivi du Rāʼ (ر) : il s\'assimile complètement, la lettre suivante double (Shadda).',
        sound: 'Mir-Rabbihim',
        illustration: '🔀',
        mnemonic: 'نْ + ر = Idghām'
      },
      { type: 'qcm', instruction: 'Comment se prononce le نْ dans "مِن رَّبِّهِمْ" ?', options: ['Clairement', 'Il s\'assimile dans le ر', 'Il devient م', 'Il rebondit'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'مَن يَشَاءُ',
        name: 'Exemple : مَن يَشَاءُ',
        instruction: 'Le نْ de "مَن" est suivi du Yāʼ (ي) : Idghām avec Ghunna (nasalisation légère), car ي fait partie des lettres nasalisées.',
        sound: 'Mayyashāʼ',
        illustration: '🔀',
        mnemonic: 'نْ + ي = Idghām (avec Ghunna)'
      },
      { type: 'qcm', instruction: 'Quelle lettre déclenche l\'Idghām dans "مَن يَشَاءُ" ?', options: ['ي', 'ب', 'ح', 'ق'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 2 (Tajwid) terminée ! Vous maîtrisez l\'Idghām. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'مِنۢ بَعْدِ',
        name: 'Iqlāb (إقلاب) — Conversion',
        instruction: 'Quand un Nūn Sākin ou un Tanwīn est suivi de ب, il se convertit en un son "م" léger et nasalisé. Un petit م est même écrit au-dessus dans le muṣḥaf.',
        sound: 'Mim Baʻdi',
        illustration: '🔄',
        mnemonic: 'نْ + ب = "م" nasalisé'
      },
      { type: 'qcm', instruction: 'Quelle règle s\'applique quand نْ est suivi de ب ?', options: ['Iẓhār', 'Idghām', 'Iqlāb (conversion en م)', 'Ikhfāʼ'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'سَمِيعٌۢ بَصِيرٌ',
        name: 'Exemple : سَمِيعٌۢ بَصِيرٌ',
        instruction: 'Le Tanwīn de "سَمِيعٌ" est suivi du Bāʼ (ب) de "بَصِيرٌ" : on entend un "م" léger entre les deux mots.',
        sound: 'Samīʻam-Baṣīr',
        illustration: '🔄',
        mnemonic: 'Tanwīn + ب = Iqlāb'
      },
      { type: 'qcm', instruction: 'Comment se prononce le Tanwīn dans "سَمِيعٌۢ بَصِيرٌ" ?', options: ['Clairement', 'Il s\'assimile', 'Comme un "م" léger', 'Il rebondit'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'أَنۢبَتَ',
        name: 'Exemple : أَنۢبَتَ',
        instruction: 'Le نْ de "أَنۢبَتَ" est suivi du Bāʼ (ب) : Iqlāb, même à l\'intérieur d\'un seul mot.',
        sound: 'Ambata',
        illustration: '🔄',
        mnemonic: 'نْ + ب = Iqlāb, même dans un mot'
      },
      { type: 'qcm', instruction: 'Quelle est la seule lettre qui déclenche l\'Iqlāb ?', options: ['م', 'ب', 'ت', 'ن'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 3 (Tajwid) terminée ! Vous maîtrisez l\'Iqlāb. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'مِن تَحْتِهَا',
        name: 'Ikhfāʼ (إخفاء) — Dissimulation',
        instruction: 'Devant les 15 lettres restantes (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك), le Nūn Sākin ou le Tanwīn se prononce de façon "cachée" : ni clairement (Iẓhār), ni totalement assimilé (Idghām), avec une légère nasalisation.',
        sound: 'Min Taḥtihā',
        illustration: '🌫️',
        mnemonic: 'Entre Iẓhār et Idghām'
      },
      { type: 'qcm', instruction: 'Quelle règle s\'applique pour les 15 lettres restantes après ء ه ع ح غ خ, ي ر م ل و ن et ب ?', options: ['Iẓhār', 'Idghām', 'Iqlāb', 'Ikhfāʼ (dissimulation)'], correctIndex: 3, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'أَنتُمْ',
        name: 'Exemple : أَنتُمْ',
        instruction: 'Le نْ de "أَنتُمْ" est suivi du Tāʼ (ت) : Ikhfāʼ, prononciation nasalisée et cachée.',
        sound: 'Antum',
        illustration: '🌫️',
        mnemonic: 'نْ + ت = Ikhfāʼ'
      },
      { type: 'qcm', instruction: 'Comment se prononce le نْ dans "أَنتُمْ" ?', options: ['Clairement', 'Comme un م', 'De façon cachée et nasalisée', 'Il disparaît totalement'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'مِن قَبْلُ',
        name: 'Exemple : مِن قَبْلُ',
        instruction: 'Le نْ de "مِن" est suivi du Qāf (ق) : Ikhfāʼ également.',
        sound: 'Min Qablu',
        illustration: '🌫️',
        mnemonic: 'نْ + ق = Ikhfāʼ'
      },
      { type: 'qcm', instruction: 'Quelle lettre déclenche l\'Ikhfāʼ dans "مِن قَبْلُ" ?', options: ['ق', 'ي', 'ب', 'ح'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 4 (Tajwid) terminée ! Les 4 règles du Nūn Sākin/Tanwīn (Iẓhār, Idghām, Iqlāb, Ikhfāʼ) sont maîtrisées. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'يَقْطَعُ',
        name: 'Qalqala (قلقلة) — Rebond',
        instruction: 'Les 5 lettres ق ط ب ج د, quand elles portent un Sukūn, produisent un léger rebond sonore au lieu d\'être prononcées sèchement.',
        sound: 'Yaqṭaʻu',
        illustration: '🎾',
        mnemonic: 'Retenez : ق ط ب ج د'
      },
      { type: 'qcm', instruction: 'Quelles lettres produisent un rebond (Qalqala) quand elles ont un Sukūn ?', options: ['ء ه ع ح غ خ', 'ي ر م ل و ن', 'ق ط ب ج د', 'ت ث ج د ذ'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'يَقْطَعُونَ',
        name: 'Exemple : يَقْطَعُونَ',
        instruction: 'Le Ṭāʼ (ط) de "يَقْطَعُونَ" porte un Sukūn : on produit un léger rebond en le prononçant.',
        sound: 'Yaqṭaʻūna',
        illustration: '🎾',
        mnemonic: 'ط + Sukūn = Qalqala'
      },
      { type: 'qcm', instruction: 'Pourquoi "يَقْطَعُونَ" contient-il une Qalqala ?', options: ['Le ط a un Sukūn', 'Le ط a une Fatḥa', 'C\'est un Tanwīn', 'C\'est un Madd'], correctIndex: 0, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'أَبْتَر',
        name: 'Exemple : أَبْتَر',
        instruction: 'Le Bāʼ (ب) de "أَبْتَر" porte un Sukūn : Qalqala également.',
        sound: 'Abtar',
        illustration: '🎾',
        mnemonic: 'ب + Sukūn = Qalqala'
      },
      { type: 'qcm', instruction: 'Quelle lettre produit la Qalqala dans "أَبْتَر" ?', options: ['ت', 'ب', 'ر', 'أ'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 5 (Tajwid) terminée ! Vous maîtrisez la Qalqala. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'إِنَّ',
        name: 'Ghunna (غنة) — Nasalisation',
        instruction: 'Quand un Mīm (م) ou un Nūn (ن) porte une Shadda, on tient le son nasal pendant environ 2 temps : c\'est la Ghunna.',
        sound: 'Inna',
        illustration: '🎵',
        mnemonic: 'مّ ou نّ = son nasal tenu 2 temps'
      },
      { type: 'qcm', instruction: 'Quand applique-t-on la Ghunna la plus marquée ?', options: ['Sur toute lettre avec Sukūn', 'Sur م ou ن avec Shadda', 'Sur les lettres de Madd', 'Sur les lettres solaires'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'ثُمَّ',
        name: 'Exemple : ثُمَّ',
        instruction: 'Le Mīm (م) de "ثُمَّ" porte une Shadda : on tient le son nasal.',
        sound: 'Thumma',
        illustration: '🎵',
        mnemonic: 'مّ = Ghunna tenue'
      },
      { type: 'qcm', instruction: 'Pourquoi "ثُمَّ" contient-il une Ghunna ?', options: ['Le م a une Shadda', 'Le م a un Sukūn', 'C\'est un Madd', 'C\'est une Qalqala'], correctIndex: 0, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'إِنَّا',
        name: 'Exemple : إِنَّا',
        instruction: 'Le Nūn (ن) de "إِنَّا" porte une Shadda : Ghunna également, avant l\'Alif final.',
        sound: 'Innā',
        illustration: '🎵',
        mnemonic: 'نّ = Ghunna tenue'
      },
      { type: 'qcm', instruction: 'Quelle lettre porte la Ghunna dans "إِنَّا" ?', options: ['ن', 'ا', 'إ', 'Aucune'], correctIndex: 0, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 6 (Tajwid) terminée ! Iẓhār, Idghām, Iqlāb, Ikhfāʼ, Qalqala et Ghunna maîtrisés. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'لَهُمْ طَعَامٌ',
        name: 'Iẓhār Shafawī (إظهار شفوي)',
        instruction: 'Quand un Mīm Sākin (مْ) est suivi de n\'importe quelle lettre sauf ب et م, on le prononce clairement, lèvres fermées un bref instant.',
        sound: 'Lahum Ṭaʻām',
        illustration: '👄',
        mnemonic: 'مْ + toute lettre sauf ب/م = clarté'
      },
      { type: 'qcm', instruction: 'Quand applique-t-on l\'Iẓhār Shafawī ?', options: ['Mīm Sākin + ب', 'Mīm Sākin + م', 'Mīm Sākin + toute autre lettre', 'Nūn Sākin + gutturale'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'هُمْ يُوقِنُونَ',
        name: 'Exemple : هُمْ يُوقِنُونَ',
        instruction: 'Le مْ de "هُمْ" est suivi du Yāʼ (ي) : Iẓhār Shafawī, prononciation claire.',
        sound: 'Hum Yūqinūn',
        illustration: '👄',
        mnemonic: 'مْ + ي = Iẓhār Shafawī'
      },
      { type: 'qcm', instruction: 'Comment se prononce le مْ dans "هُمْ يُوقِنُونَ" ?', options: ['Il s\'assimile', 'Clairement', 'Comme un ن', 'Il disparaît'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 7 (Tajwid) terminée ! Vous maîtrisez l\'Iẓhār Shafawī. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'هُم بِٱلْءَاخِرَةِ',
        name: 'Ikhfāʼ Shafawī (إخفاء شفوي)',
        instruction: 'Quand un Mīm Sākin (مْ) est suivi de ب, on le prononce avec une légère nasalisation, lèvres à peine fermées, sans les presser.',
        sound: 'Hum bil-Ākhirah',
        illustration: '🌫️',
        mnemonic: 'مْ + ب = Ikhfāʼ Shafawī'
      },
      { type: 'qcm', instruction: 'Quand applique-t-on l\'Ikhfāʼ Shafawī ?', options: ['Mīm Sākin + ب', 'Mīm Sākin + toute lettre', 'Nūn Sākin + ب', 'Mīm Sākin + م'], correctIndex: 0, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'تَرْمِيهِم بِحِجَارَةٍ',
        name: 'Exemple : تَرْمِيهِم بِحِجَارَةٍ',
        instruction: 'Le مْ de "بِحِجَارَةٍ" est précédé de "تَرْمِيهِم" suivi de ب : Ikhfāʼ Shafawī, légère nasalisation.',
        sound: 'Tarmīhim biḥijāra',
        illustration: '🌫️',
        mnemonic: 'مْ + ب = nasalisation légère'
      },
      { type: 'qcm', instruction: 'Quelle lettre déclenche systématiquement l\'Ikhfāʼ Shafawī ?', options: ['م', 'ب', 'ن', 'ي'], correctIndex: 1, textStyle: 'text-3xl' },
      { type: 'success', instruction: 'Leçon 8 (Tajwid) terminée ! Vous maîtrisez l\'Ikhfāʼ Shafawī. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'لَهُم مَّا',
        name: 'Idghām Shafawī (إدغام شفوي)',
        instruction: 'Quand un Mīm Sākin (مْ) est suivi d\'un autre م, les deux fusionnent complètement avec une Ghunna tenue.',
        sound: 'Lahum-mmā',
        illustration: '🔀',
        mnemonic: 'مْ + م = fusion totale avec Ghunna'
      },
      { type: 'qcm', instruction: 'Que se passe-t-il quand un Mīm Sākin est suivi d\'un autre Mīm ?', options: ['Iẓhār Shafawī', 'Ikhfāʼ Shafawī', 'Idghām Shafawī (fusion)', 'Qalqala'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'كَمْ مِّن',
        name: 'Exemple : كَمْ مِّن',
        instruction: 'Le مْ de "كَمْ" est suivi du م de "مِّن" : les deux fusionnent en un seul م tenu (Shadda).',
        sound: 'Kam-min',
        illustration: '🔀',
        mnemonic: 'مْ + م = un seul son tenu'
      },
      { type: 'qcm', instruction: 'Comment s\'écrit le résultat de l\'Idghām Shafawī dans "كَمْ مِّن" ?', options: ['Avec un Sukūn', 'Avec une Shadda', 'Sans aucun signe', 'Avec un Tanwīn'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 9 (Tajwid) terminée ! Les 3 règles du Mīm Sākinah (Iẓhār, Ikhfāʼ, Idghām Shafawī) sont maîtrisées. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'رَبَّنَا',
        name: 'Tafkhīm (تفخيم) — Rāʼ emphatique',
        instruction: 'Le Rāʼ (ر) est prononcé de façon emphatique (Tafkhīm) quand il porte une Fatḥa ou une Ḍamma, ou quand il est précédé d\'une consonne avec Fatḥa/Ḍamma.',
        sound: 'Rabbanā',
        illustration: '🔊',
        mnemonic: 'ر + Fatḥa/Ḍamma = emphatique'
      },
      { type: 'qcm', instruction: 'Quand le Rāʼ est-il prononcé de façon emphatique (Tafkhīm) ?', options: ['Avec une Kasra', 'Avec une Fatḥa ou une Ḍamma', 'En fin de mot toujours', 'Jamais'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'رِجَال',
        name: 'Tarqīq (ترقيق) — Rāʼ léger',
        instruction: 'Le Rāʼ (ر) est prononcé légèrement (Tarqīq) quand il porte une Kasra, comme dans "رِجَال" (Rijāl).',
        sound: 'Rijāl',
        illustration: '🪶',
        mnemonic: 'ر + Kasra = léger'
      },
      { type: 'qcm', instruction: 'Comment se prononce le ر dans "رِجَال" ?', options: ['Emphatique (Tafkhīm)', 'Léger (Tarqīq)', 'Il disparaît', 'Comme un ل'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 10 (Tajwid) terminée ! Les 4 règles du Nūn Sākin, Qalqala, Ghunna, les 3 règles du Mīm Sākinah et le Tafkhīm/Tarqīq du Rāʼ maîtrisés. +20 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'جَآءَ',
        name: 'Madd Wājib Muttaṣil (مد واجب متصل)',
        instruction: 'Quand une lettre de Madd (ا و ي) est suivie d\'un Hamza (ء) dans le MÊME mot, l\'allongement devient obligatoire : 4 à 5 temps au lieu de 2.',
        sound: 'Jāʼa',
        illustration: '➖➖',
        mnemonic: 'Madd + ء dans le même mot = 4-5 temps'
      },
      { type: 'qcm', instruction: 'Qu\'est-ce que le Madd Wājib Muttaṣil ?', options: ['Madd + Sukūn dans le même mot', 'Madd + Hamza dans le même mot', 'Madd entre deux mots', 'Madd bref normal'], correctIndex: 1, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'ٱلسَّمَآءِ',
        name: 'Exemple : ٱلسَّمَآءِ',
        instruction: 'L\'Alif de Madd dans "ٱلسَّمَآءِ" est suivi du Hamza (ء), toujours dans le même mot : Madd Wājib Muttaṣil, allongement obligatoire.',
        sound: 'As-Samāʼ',
        illustration: '➖➖',
        mnemonic: 'Alif + ء = allongement obligatoire'
      },
      { type: 'qcm', instruction: 'Combien de temps dure le Madd Wājib Muttaṣil ?', options: ['1 temps', '2 temps', '4 à 5 temps', '10 temps'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 11 (Tajwid) terminée ! Vous maîtrisez le Madd Wājib Muttaṣil. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'يَا أَيُّهَا',
        name: 'Madd Jāʼiz Munfaṣil (مد جائز منفصل)',
        instruction: 'Quand une lettre de Madd termine un mot et qu\'un Hamza (ء) commence le mot SUIVANT, l\'allongement est permis et variable : 2 à 5 temps selon le récitateur.',
        sound: 'Yā Ayyuhā',
        illustration: '➖➖',
        mnemonic: 'Madd fin de mot + ء début de mot suivant'
      },
      { type: 'qcm', instruction: 'Qu\'est-ce qui distingue le Madd Jāʼiz Munfaṣil du Madd Wājib Muttaṣil ?', options: ['Le Hamza est dans un autre mot', 'Il n\'y a pas de Hamza', 'C\'est plus court', 'C\'est le même Madd'], correctIndex: 0, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'فِي أَنفُسِكُمْ',
        name: 'Exemple : فِي أَنفُسِكُمْ',
        instruction: 'Le Yāʼ de Madd de "فِي" termine ce mot, et "أَنفُسِكُمْ" commence par un Hamza : Madd Jāʼiz Munfaṣil.',
        sound: 'Fī Anfusikum',
        illustration: '➖➖',
        mnemonic: 'Madd + ء séparés par un espace entre mots'
      },
      { type: 'qcm', instruction: 'Combien de temps peut durer le Madd Jāʼiz Munfaṣil ?', options: ['Toujours 1 temps', '2 à 5 temps (variable)', 'Toujours 6 temps', 'Il n\'y a pas d\'allongement'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 12 (Tajwid) terminée ! Vous maîtrisez le Madd Jāʼiz Munfaṣil. +15 XP' }
    ],
    [
      {
        type: 'intro',
        letter: 'ٱلضَّآلِّينَ',
        name: 'Madd Lāzim (مد لازم)',
        instruction: 'Quand une lettre de Madd est suivie d\'un Sukūn PERMANENT (pas seulement à la pause) dans le même mot, l\'allongement est le plus long : 6 temps, toujours.',
        sound: 'Aḍ-Ḍāllīn',
        illustration: '➖➖➖',
        mnemonic: 'Madd + Sukūn permanent = 6 temps, le plus long'
      },
      { type: 'qcm', instruction: 'Quand applique-t-on le Madd Lāzim ?', options: ['Madd + Hamza', 'Madd + Fatḥa', 'Madd + Sukūn permanent', 'Madd en fin de verset seulement'], correctIndex: 2, textStyle: 'text-2xl' },
      {
        type: 'intro',
        letter: 'ءَآلْـَٔانَ',
        name: 'Exemple : آلْـَٔانَ',
        instruction: '"آلْآنَ" (maintenant) contient un Alif de Madd suivi d\'un Lām avec Sukūn permanent : Madd Lāzim, 6 temps.',
        sound: 'Al-Āna',
        illustration: '➖➖➖',
        mnemonic: 'Le Madd le plus long du Tajwid'
      },
      { type: 'qcm', instruction: 'Combien de temps dure le Madd Lāzim ?', options: ['2 temps', '4 temps', '6 temps', 'Il varie librement'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 13 (Tajwid) terminée ! Parcours Tajwid complet : les 4 règles du Nūn Sākin, Qalqala, Ghunna, les 3 règles du Mīm Sākinah, le Tafkhīm/Tarqīq du Rāʼ et les 3 types de Madd Farʻī. +20 XP' }
    ]
  ];

  const asmaLessons = [
    [
      { type: 'intro', letter: 'ٱلرَّحْمَٰن', name: 'Ar-Raḥmān', instruction: 'Le Tout Miséricordieux : Sa miséricorde englobe absolument toutes Ses créatures en ce bas monde, croyantes ou non. C\'est le tout premier nom cité dans la Basmala qui ouvre chaque sourate (sauf At-Tawba), rappelant que la miséricorde précède toujours la colère divine.', sound: 'Ar-Raḥmān', illustration: '🤲', mnemonic: 'Ouvre la Basmale et Al-Fatiha', rootKey: 'R-H-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّحْمَٰن" (Ar-Raḥmān) ?', options: ['Le Tout Miséricordieux', 'Le Vengeur', 'Le Silencieux', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّحِيم', name: 'Ar-Raḥīm', instruction: 'Le Très Miséricordieux : à la différence d\'Ar-Raḥmān qui embrasse toute la création ici-bas, Ar-Raḥīm désigne la miséricorde particulière réservée aux croyants, pleinement manifestée au Jour du Jugement et dans l\'au-delà.', sound: 'Ar-Raḥīm', illustration: '💞', mnemonic: 'Toujours associé à Ar-Raḥmān', rootKey: 'R-H-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّحِيم" (Ar-Raḥīm) ?', options: ['Le Très Miséricordieux', 'Le Sévère', 'Le Lointain', 'L\'Oublieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمَلِك', name: 'Al-Malik', instruction: 'Le Roi, le Souverain absolu : la royauté des cieux, de la terre et du Jour de la Rétribution (Māliki Yawmid-Dīn, dans Al-Fatiha) Lui appartient sans partage, contrairement aux rois terrestres dont le règne reste toujours passager.', sound: 'Al-Malik', illustration: '👑', mnemonic: 'Le vrai Roi, au-delà de tout roi terrestre' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمَلِك" (Al-Malik) ?', options: ['Le Roi, Souverain', 'Le Serviteur', 'Le Voyageur', 'Le Pauvre'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 1 (Noms d\'Allah) terminée ! Ar-Raḥmān, Ar-Raḥīm, Al-Malik. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْقُدُّوس', name: 'Al-Quddūs', instruction: 'Le Pur, le Saint : Il est totalement exempt de tout défaut, de toute ressemblance avec la création et de toute imperfection imaginable. Ce nom partage sa racine avec \'Al-Quds\' (Jérusalem) et \'Taqdīs\' (sanctification).', sound: 'Al-Quddūs', illustration: '🤍', mnemonic: 'Racine de "Al-Quds" (Jérusalem, la Sainte)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقُدُّوس" (Al-Quddūs) ?', options: ['Le Pur, Le Saint', 'L\'Impur', 'Le Faible', 'L\'Injuste'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلسَّلَام', name: 'As-Salām', instruction: 'La Paix : Il est Lui-même exempt de tout défaut, et Il est la source de toute paix véritable accordée à Ses serviteurs, en ce monde comme au Paradis, la \'Demeure de la Paix\' (Dār as-Salām).', sound: 'As-Salām', illustration: '☮️', mnemonic: 'Même racine que "Salām" (paix)', rootKey: 'S-L-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلسَّلَام" (As-Salām) ?', options: ['La Paix', 'La Guerre', 'La Colère', 'Le Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُؤْمِن', name: 'Al-Muʼmin', instruction: 'Celui qui donne la sécurité : Il rassure Ses serviteurs et confirme la vérité de Ses promesses envers eux ; c\'est aussi Lui qui accorde la foi (Īmān) dans le cœur de qui Il veut.', sound: 'Al-Muʼmin', illustration: '🛡️', mnemonic: 'Même racine que "Īmān" (foi)', rootKey: 'A-M-N' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُؤْمِن" (Al-Muʼmin) ?', options: ['Celui qui donne la sécurité', 'Celui qui doute', 'Celui qui fuit', 'Celui qui oublie'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 2 (Noms d\'Allah) terminée ! Al-Quddūs, As-Salām, Al-Muʼmin. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْعَزِيز', name: 'Al-ʻAzīz', instruction: 'Le Tout-Puissant : Sa puissance est absolue, inégalable et jamais vaincue. Ce nom est souvent cité aux côtés d\'Al-Ḥakīm (le Sage) dans le Coran, pour montrer que Sa force s\'exerce toujours avec sagesse.', sound: 'Al-ʻAzīz', illustration: '👑', mnemonic: 'Puissance et honneur réunis' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَزِيز" (Al-ʻAzīz) ?', options: ['Le Tout-Puissant', 'Le Faible', 'Le Petit', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَكِيم', name: 'Al-Ḥakīm', instruction: 'Le Sage : Sa sagesse imprègne toute Sa création et chacun de Ses décrets, si bien que rien n\'arrive par hasard ou sans raison profonde, même quand elle échappe à notre compréhension.', sound: 'Al-Ḥakīm', illustration: '🦉', mnemonic: 'Même racine que "Ḥikma" (sagesse)', rootKey: 'H-K-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَكِيم" (Al-Ḥakīm) ?', options: ['Le Sage', 'L\'Ignorant', 'Le Rapide', 'Le Distrait'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْخَالِق', name: 'Al-Khāliq', instruction: 'Le Créateur : Celui qui fait exister toute chose à partir de rien, sans modèle préalable ni effort. Souvent cité aux côtés d\'Al-Bāriʼ et Al-Muṣawwir, qui précisent les étapes de la création.', sound: 'Al-Khāliq', illustration: '✨', mnemonic: 'Même racine que "Khalaqa" (créer)', rootKey: 'K-L-Q' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْخَالِق" (Al-Khāliq) ?', options: ['Le Créateur', 'Le Destructeur', 'Le Voyageur', 'Le Silencieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 3 (Noms d\'Allah) terminée ! Al-ʻAzīz, Al-Ḥakīm, Al-Khāliq. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْغَفُور', name: 'Al-Ghafūr', instruction: 'Le Très Pardonneur : Il pardonne abondamment et à répétition les péchés de Ses serviteurs sincèrement repentants, quelle que soit la gravité ou la fréquence de leurs fautes.', sound: 'Al-Ghafūr', illustration: '🤍', mnemonic: 'Même racine que "Maghfira" (pardon)', rootKey: 'GH-F-R' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْغَفُور" (Al-Ghafūr) ?', options: ['Le Très Pardonneur', 'Le Sévère', 'Le Rancunier', 'L\'Oublieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّزَّاق', name: 'Ar-Razzāq', instruction: 'Le Grand Pourvoyeur : Il accorde sans relâche la subsistance à toute Sa création, croyants et mécréants, humains et animaux, sans que personne ne puisse épuiser Sa générosité.', sound: 'Ar-Razzāq', illustration: '🍞', mnemonic: 'Même racine que "Rizq" (subsistance)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّزَّاق" (Ar-Razzāq) ?', options: ['Le Grand Pourvoyeur', 'Celui qui prive', 'Le Voyageur', 'Le Muet'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْعَلِيم', name: 'Al-ʻAlīm', instruction: 'L\'Omniscient : Sa connaissance embrasse absolument toute chose, visible et invisible, passée, présente et future, jusqu\'au plus infime détail caché au fond des cœurs.', sound: 'Al-ʻAlīm', illustration: '🧠', mnemonic: 'Même racine que "ʻIlm" (savoir)', rootKey: 'A-L-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَلِيم" (Al-ʻAlīm) ?', options: ['L\'Omniscient', 'L\'Ignorant', 'Le Distrait', 'Le Muet'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 4 (Noms d\'Allah) terminée ! Al-Ghafūr, Ar-Razzāq, Al-ʻAlīm. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلسَّمِيع', name: 'As-Samīʻ', instruction: 'L\'Audient : Il entend absolument tout, même le murmure le plus discret ou l\'invocation la plus silencieuse ; ce nom est très souvent associé à Al-ʻAlīm dans le Coran.', sound: 'As-Samīʻ', illustration: '👂', mnemonic: 'Souvent associé à Al-Baṣīr' },
      { type: 'qcm', instruction: 'Que signifie "ٱلسَّمِيع" (As-Samīʻ) ?', options: ['L\'Audient', 'Le Sourd', 'Le Muet', 'L\'Aveugle'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَصِير', name: 'Al-Baṣīr', instruction: 'Le Voyant : Il voit tout ce qui existe, jusqu\'au plus infime détail, y compris ce qui est invisible aux yeux humains ; toujours cité aux côtés d\'As-Samīʻ.', sound: 'Al-Baṣīr', illustration: '👁️', mnemonic: 'Souvent associé à As-Samīʻ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَصِير" (Al-Baṣīr) ?', options: ['Le Voyant', 'L\'Aveugle', 'Le Sourd', 'Le Muet'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْعَدْل', name: 'Al-ʻAdl', instruction: 'Le Juste : Sa justice est absolue et parfaite, sans la moindre trace d\'injustice ou de partialité envers aucune de Ses créatures, en ce monde comme au Jour du Jugement.', sound: 'Al-ʻAdl', illustration: '⚖️', mnemonic: 'Même racine que "ʻAdl" (justice)', rootKey: 'A-D-L' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَدْل" (Al-ʻAdl) ?', options: ['Le Juste', 'L\'Injuste', 'Le Partial', 'Le Silencieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 5 (Noms d\'Allah) terminée ! As-Samīʻ, Al-Baṣīr, Al-ʻAdl. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱللَّطِيف', name: 'Al-Laṭīf', instruction: 'Le Doux, le Subtil : Il connaît les détails les plus fins et les plus cachés de toute chose, et Il traite Ses serviteurs avec une douceur qui dépasse souvent leur propre perception.', sound: 'Al-Laṭīf', illustration: '🌸', mnemonic: 'La bienveillance dans les détails' },
      { type: 'qcm', instruction: 'Que signifie "ٱللَّطِيف" (Al-Laṭīf) ?', options: ['Le Doux, Le Subtil', 'Le Brutal', 'L\'Indifférent', 'Le Lointain'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَدُود', name: 'Al-Wadūd', instruction: 'Le Plein d\'Amour : Il aime sincèrement Ses serviteurs vertueux et Se fait aimer d\'eux en retour ; un amour réciproque, loin d\'un Dieu simplement lointain ou indifférent.', sound: 'Al-Wadūd', illustration: '💗', mnemonic: 'L\'amour divin réciproque' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَدُود" (Al-Wadūd) ?', options: ['Le Plein d\'Amour', 'Le Haineux', 'L\'Indifférent', 'Le Distant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلصَّبُور', name: 'Aṣ-Ṣabūr', instruction: 'Le Très Patient : Il ne hâte jamais le châtiment malgré la désobéissance répétée de Ses créatures, laissant toujours une porte ouverte au repentir.', sound: 'Aṣ-Ṣabūr', illustration: '⏳', mnemonic: 'Même racine que "Ṣabr" (patience)', rootKey: 'S-B-R' },
      { type: 'qcm', instruction: 'Que signifie "ٱلصَّبُور" (Aṣ-Ṣabūr) ?', options: ['Le Très Patient', 'L\'Impatient', 'Le Précipité', 'Le Colérique'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 6 (Noms d\'Allah) terminée ! 18 noms explorés. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُهَيْمِن', name: 'Al-Muhaymin', instruction: 'Le Protecteur Vigilant : Il veille sur toute chose sans jamais dormir ni se lasser, et Il en garantit la préservation à chaque instant.', sound: 'Al-Muhaymin', illustration: '👁️', mnemonic: 'Toujours attentif, rien ne Lui échappe' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُهَيْمِن" (Al-Muhaymin) ?', options: ['Le Protecteur Vigilant', 'L\'Indifférent', 'L\'Absent', 'Le Distrait'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْجَبَّار', name: 'Al-Jabbār', instruction: 'Le Contraignant, le Réparateur : Il redresse ce qui est brisé — les cœurs, les situations — et impose Sa volonté à toute Sa création sans que rien ne puisse s\'y opposer.', sound: 'Al-Jabbār', illustration: '💪', mnemonic: 'Celui qui répare et qui contraint' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْجَبَّار" (Al-Jabbār) ?', options: ['Le Contraignant, Réparateur', 'Le Faible', 'L\'Indécis', 'Le Passif'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُتَكَبِّر', name: 'Al-Mutakabbir', instruction: 'Le Superbe : la grandeur véritable Lui appartient exclusivement ; contrairement à l\'orgueil humain qui est un vice, cette grandeur divine est légitime car Il en est digne à jamais.', sound: 'Al-Mutakabbir', illustration: '👑', mnemonic: 'La grandeur n\'appartient qu\'à Lui' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُتَكَبِّر" (Al-Mutakabbir) ?', options: ['Le Superbe (nom divin)', 'Le Petit', 'Le Faible', 'Le Timide'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 7 (Noms d\'Allah) terminée ! Al-Muhaymin, Al-Jabbār, Al-Mutakabbir. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْبَارِئ', name: 'Al-Bāriʼ', instruction: 'Le Créateur qui donne forme harmonieuse : Il crée chaque chose avec un équilibre parfait, sans le moindre défaut, en la distinguant clairement de toute autre.', sound: 'Al-Bāriʼ', illustration: '🌱', mnemonic: 'Souvent cité avec Al-Khāliq et Al-Muṣawwir' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَارِئ" (Al-Bāriʼ) ?', options: ['Le Créateur harmonieux', 'Le Destructeur', 'L\'Imparfait', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُصَوِّر', name: 'Al-Muṣawwir', instruction: 'Le Formateur : Il donne à chaque créature sa forme unique et distincte, façonnant les visages et les corps selon une diversité infinie.', sound: 'Al-Muṣawwir', illustration: '🎨', mnemonic: 'Celui qui façonne les formes' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُصَوِّر" (Al-Muṣawwir) ?', options: ['Le Formateur', 'Le Destructeur', 'L\'Immobile', 'L\'Aveugle'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَهَّاب', name: 'Al-Wahhāb', instruction: 'Le Dispensateur généreux : Il donne sans compter et sans jamais attendre de contrepartie, à la différence d\'un don humain souvent motivé par l\'intérêt.', sound: 'Al-Wahhāb', illustration: '🎁', mnemonic: 'Le don pur et gratuit' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَهَّاب" (Al-Wahhāb) ?', options: ['Le Dispensateur généreux', 'L\'Avare', 'Celui qui prend', 'Le Silencieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 8 (Noms d\'Allah) terminée ! Al-Bāriʼ, Al-Muṣawwir, Al-Wahhāb. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْفَتَّاح', name: 'Al-Fattāḥ', instruction: 'Celui qui tranche et ouvre : Il ouvre les portes du bien, de la miséricorde et de la victoire, et Il juge avec vérité entre Ses serviteurs lorsqu\'ils sont en désaccord.', sound: 'Al-Fattāḥ', illustration: '🚪', mnemonic: 'Même racine que "Fatḥ" (victoire)', rootKey: 'F-T-H' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْفَتَّاح" (Al-Fattāḥ) ?', options: ['Celui qui ouvre, tranche', 'Celui qui ferme', 'Celui qui cache', 'Celui qui détruit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْقَابِض', name: 'Al-Qābiḍ', instruction: 'Celui qui restreint : Il resserre la subsistance ou reprend l\'âme selon Sa sagesse insondable, toujours en équilibre avec Al-Bāsiṭ.', sound: 'Al-Qābiḍ', illustration: '✊', mnemonic: 'Souvent cité avec Al-Bāsiṭ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقَابِض" (Al-Qābiḍ) ?', options: ['Celui qui restreint', 'Celui qui étend', 'Celui qui ignore', 'Celui qui oublie'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَاسِط', name: 'Al-Bāsiṭ', instruction: 'Celui qui étend : Il élargit la subsistance, la miséricorde et les cœurs selon Sa volonté, en contrepoint d\'Al-Qābiḍ.', sound: 'Al-Bāsiṭ', illustration: '🤲', mnemonic: 'Souvent cité avec Al-Qābiḍ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَاسِط" (Al-Bāsiṭ) ?', options: ['Celui qui étend', 'Celui qui restreint', 'Celui qui cache', 'Celui qui punit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 9 (Noms d\'Allah) terminée ! Al-Fattāḥ, Al-Qābiḍ, Al-Bāsiṭ. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْخَافِض', name: 'Al-Khāfiḍ', instruction: 'Celui qui abaisse : Il abaisse les orgueilleux et rabaisse en rang ou en dignité qui Il veut, dans une parfaite justice.', sound: 'Al-Khāfiḍ', illustration: '⬇️', mnemonic: 'Souvent cité avec Ar-Rāfiʻ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْخَافِض" (Al-Khāfiḍ) ?', options: ['Celui qui abaisse', 'Celui qui élève', 'Celui qui répare', 'Celui qui pardonne'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّافِع', name: 'Ar-Rāfiʻ', instruction: 'Celui qui élève : Il élève en rang, en dignité ou en degré spirituel qui Il veut, en contrepoint d\'Al-Khāfiḍ.', sound: 'Ar-Rāfiʻ', illustration: '⬆️', mnemonic: 'Souvent cité avec Al-Khāfiḍ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّافِع" (Ar-Rāfiʻ) ?', options: ['Celui qui élève', 'Celui qui abaisse', 'Celui qui punit', 'Celui qui juge'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُعِزّ', name: 'Al-Muʻizz', instruction: 'Celui qui honore : Il accorde la puissance, l\'honneur et le prestige à qui Il veut, indépendamment des apparences ou des moyens humains.', sound: 'Al-Muʻizz', illustration: '🏅', mnemonic: 'Souvent cité avec Al-Mudhill' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُعِزّ" (Al-Muʻizz) ?', options: ['Celui qui honore', 'Celui qui humilie', 'Celui qui ignore', 'Celui qui punit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 10 (Noms d\'Allah) terminée ! Al-Khāfiḍ, Ar-Rāfiʻ, Al-Muʻizz. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُذِلّ', name: 'Al-Mudhill', instruction: 'Celui qui humilie : Il retire l\'honneur et la puissance à qui Il veut, rappelant que toute gloire terrestre reste fragile et temporaire.', sound: 'Al-Mudhill', illustration: '⬇️', mnemonic: 'Souvent cité avec Al-Muʻizz' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُذِلّ" (Al-Mudhill) ?', options: ['Celui qui humilie', 'Celui qui honore', 'Celui qui pardonne', 'Celui qui guide'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَسِيب', name: 'Al-Ḥasīb', instruction: 'Le Comptable : Il tient un compte exact de toutes les œuvres de chacun, et Il suffit pleinement à Ses serviteurs qui placent en Lui leur confiance totale.', sound: 'Al-Ḥasīb', illustration: '📊', mnemonic: 'Même racine que "Ḥisāb" (compte)', rootKey: 'H-S-B' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَسِيب" (Al-Ḥasīb) ?', options: ['Le Comptable de toute chose', 'L\'Oublieux', 'L\'Indifférent', 'Le Silencieux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْجَلِيل', name: 'Al-Jalīl', instruction: 'Le Majestueux : Sa grandeur et Sa majesté dépassent toute description humaine, inspirant à la fois crainte révérencielle et amour profond.', sound: 'Al-Jalīl', illustration: '✨', mnemonic: 'La majesté suprême' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْجَلِيل" (Al-Jalīl) ?', options: ['Le Majestueux', 'Le Petit', 'Le Faible', 'L\'Ordinaire'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 11 (Noms d\'Allah) terminée ! Al-Mudhill, Al-Ḥasīb, Al-Jalīl. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْكَرِيم', name: 'Al-Karīm', instruction: 'Le Généreux : Sa générosité est sans limite, Il donne avant même d\'être sollicité et pardonne avec une noblesse qui ne rabaisse jamais celui qui reçoit.', sound: 'Al-Karīm', illustration: '🎁', mnemonic: 'La générosité la plus noble' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْكَرِيم" (Al-Karīm) ?', options: ['Le Généreux', 'L\'Avare', 'Le Sévère', 'Le Distant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّقِيب', name: 'Ar-Raqīb', instruction: 'L\'Observateur vigilant : rien ne Lui échappe, Il observe en permanence chaque pensée, parole et action, ce qui invite le croyant à une conscience constante de Sa présence.', sound: 'Ar-Raqīb', illustration: '👀', mnemonic: 'La surveillance constante et bienveillante' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّقِيب" (Ar-Raqīb) ?', options: ['L\'Observateur vigilant', 'L\'Aveugle', 'L\'Absent', 'Le Distrait'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُجِيب', name: 'Al-Mujīb', instruction: 'Celui qui répond : Il exauce les invocations sincères de Ses serviteurs qui L\'implorent, parfois immédiatement, parfois plus tard, et toujours selon ce qui leur est le meilleur.', sound: 'Al-Mujīb', illustration: '🤲', mnemonic: 'Celui qui répond aux prières' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُجِيب" (Al-Mujīb) ?', options: ['Celui qui répond (aux invocations)', 'Celui qui ignore', 'Celui qui refuse', 'Celui qui se tait'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 12 (Noms d\'Allah) terminée ! Al-Karīm, Ar-Raqīb, Al-Mujīb. 36 noms explorés. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْغَفَّار', name: 'Al-Ghaffār', instruction: 'Le Grand Absoluteur : Il pardonne inlassablement, à chaque récidive, à la différence d\'Al-Ghafūr qui insiste sur l\'abondance du pardon.', sound: 'Al-Ghaffār', illustration: '🕊️', mnemonic: 'Le pardon qui se répète sans fin', rootKey: 'GH-F-R' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْغَفَّار" (Al-Ghaffār) ?', options: ['Le Grand Absoluteur (pardon répété)', 'Le Rancunier', 'L\'Indifférent', 'Le Sévère'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْقَهَّار', name: 'Al-Qahhār', instruction: 'Le Dominateur Suprême : Il soumet toute chose à Sa volonté ; rien ni personne ne peut Lui résister ou échapper à Son emprise.', sound: 'Al-Qahhār', illustration: '⚡', mnemonic: 'La domination absolue et sans partage' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقَهَّار" (Al-Qahhār) ?', options: ['Le Dominateur Suprême', 'Le Soumis', 'Le Faible', 'L\'Hésitant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْخَبِير', name: 'Al-Khabīr', instruction: 'Le Parfaitement Informé : Il connaît la réalité intime et cachée de toute chose, bien au-delà des simples apparences.', sound: 'Al-Khabīr', illustration: '🔍', mnemonic: 'Même racine que "Khabar" (nouvelle, information)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْخَبِير" (Al-Khabīr) ?', options: ['Le Parfaitement Informé', 'L\'Ignorant', 'Le Distrait', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 13 (Noms d\'Allah) terminée ! Al-Ghaffār, Al-Qahhār, Al-Khabīr. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْحَلِيم', name: 'Al-Ḥalīm', instruction: 'Le Longanime : Il ne se précipite jamais dans le châtiment malgré les fautes commises, laissant à chacun le temps de se repentir.', sound: 'Al-Ḥalīm', illustration: '🌿', mnemonic: 'La patience douce face à la faute' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَلِيم" (Al-Ḥalīm) ?', options: ['Le Longanime, l\'Indulgent', 'Le Précipité', 'Le Vengeur', 'L\'Impatient'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْعَظِيم', name: 'Al-ʻAẓīm', instruction: 'L\'Immense : Sa grandeur dépasse toute mesure et toute imagination humaine ; rien dans la création ne peut rivaliser avec Sa majesté.', sound: 'Al-ʻAẓīm', illustration: '🌌', mnemonic: 'Même racine que "ʻAẓama" (grandeur)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَظِيم" (Al-ʻAẓīm) ?', options: ['L\'Immense', 'Le Petit', 'L\'Ordinaire', 'Le Limité'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلشَّكُور', name: 'Ash-Shakūr', instruction: 'Le Reconnaissant : Il récompense généreusement la moindre bonne action, même minime, et multiplie la récompense au-delà du mérite.', sound: 'Ash-Shakūr', illustration: '🌟', mnemonic: 'Même racine que "Shukr" (gratitude)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلشَّكُور" (Ash-Shakūr) ?', options: ['Le Reconnaissant', 'L\'Ingrat', 'L\'Oublieux', 'L\'Indifférent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 14 (Noms d\'Allah) terminée ! Al-Ḥalīm, Al-ʻAẓīm, Ash-Shakūr. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْعَلِيّ', name: 'Al-ʻAliyy', instruction: 'Le Très-Haut : Il est élevé au-dessus de toute Sa création, transcendant en essence, en attributs et en majesté.', sound: 'Al-ʻAliyy', illustration: '🕋', mnemonic: 'Même racine que "ʻUluww" (élévation)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَلِيّ" (Al-ʻAliyy) ?', options: ['Le Très-Haut', 'Le Bas', 'L\'Ordinaire', 'Le Petit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْكَبِير', name: 'Al-Kabīr', instruction: 'Le Grand : Sa grandeur est absolue et ne peut être égalée par rien ni personne dans toute la création.', sound: 'Al-Kabīr', illustration: '🏔️', mnemonic: 'Souvent dit dans le takbīr "Allāhu Akbar"' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْكَبِير" (Al-Kabīr) ?', options: ['Le Grand', 'Le Petit', 'Le Faible', 'Le Discret'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَفِيظ', name: 'Al-Ḥafīẓ', instruction: 'Le Gardien Protecteur : Il préserve toute chose de la disparition et protège Ses serviteurs des dangers visibles et invisibles.', sound: 'Al-Ḥafīẓ', illustration: '🛡️', mnemonic: 'Même racine que "Ḥifẓ" (mémorisation, préservation)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَفِيظ" (Al-Ḥafīẓ) ?', options: ['Le Gardien Protecteur', 'Celui qui néglige', 'L\'Absent', 'Le Distrait'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 15 (Noms d\'Allah) terminée ! Al-ʻAliyy, Al-Kabīr, Al-Ḥafīẓ. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُقِيت', name: 'Al-Muqīt', instruction: 'Celui qui nourrit et sustente : Il pourvoit à la subsistance et aux besoins de chaque créature avec une précision parfaite.', sound: 'Al-Muqīt', illustration: '🍇', mnemonic: 'Même racine que "Qūt" (nourriture)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُقِيت" (Al-Muqīt) ?', options: ['Celui qui nourrit et sustente', 'Celui qui prive', 'Celui qui ignore', 'Celui qui oublie'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَاسِع', name: 'Al-Wāsiʻ', instruction: 'Le Vaste : Sa miséricorde, Sa connaissance et Ses dons ne connaissent aucune limite ni aucune frontière.', sound: 'Al-Wāsiʻ', illustration: '🌊', mnemonic: 'Même racine que "Wusʻ" (vastitude)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَاسِع" (Al-Wāsiʻ) ?', options: ['Le Vaste, sans limite', 'L\'Étroit', 'Le Limité', 'Le Restreint'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَكَم', name: 'Al-Ḥakam', instruction: 'L\'Arbitre Suprême : Il juge avec une équité parfaite entre Ses créatures et tranche tout différend avec une vérité absolue.', sound: 'Al-Ḥakam', illustration: '⚖️', mnemonic: 'Même racine qu\'Al-Ḥakīm et "Ḥukm" (jugement)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَكَم" (Al-Ḥakam) ?', options: ['L\'Arbitre Suprême', 'Le Partial', 'L\'Indécis', 'L\'Injuste'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 16 (Noms d\'Allah) terminée ! Al-Muqīt, Al-Wāsiʻ, Al-Ḥakam. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمَجِيد', name: 'Al-Majīd', instruction: 'Le Glorieux : Sa gloire et Sa noblesse sont infinies, dignes de toute louange et de toute vénération.', sound: 'Al-Majīd', illustration: '👑', mnemonic: 'Même racine que "Majd" (gloire)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمَجِيد" (Al-Majīd) ?', options: ['Le Glorieux', 'Le Modeste', 'L\'Effacé', 'L\'Inconnu'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَاعِث', name: 'Al-Bāʻith', instruction: 'Celui qui ressuscite : Il redonnera vie à tous les morts le Jour de la Résurrection pour les rétribuer selon leurs œuvres.', sound: 'Al-Bāʻith', illustration: '🌅', mnemonic: 'Même racine que "Baʻth" (résurrection, envoi)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَاعِث" (Al-Bāʻith) ?', options: ['Celui qui ressuscite', 'Celui qui détruit', 'Celui qui endort', 'Celui qui oublie'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلشَّهِيد', name: 'Ash-Shahīd', instruction: 'Le Témoin : Il est témoin de toute chose, présent et pleinement conscient de tout ce qui se passe, en public comme en secret.', sound: 'Ash-Shahīd', illustration: '👁️‍🗨️', mnemonic: 'Même racine que "Shahāda" (témoignage)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلشَّهِيد" (Ash-Shahīd) ?', options: ['Le Témoin', 'L\'Absent', 'L\'Aveugle', 'L\'Indifférent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 17 (Noms d\'Allah) terminée ! Al-Majīd, Al-Bāʻith, Ash-Shahīd. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْحَقّ', name: 'Al-Ḥaqq', instruction: 'La Vérité Absolue : Son existence est la seule vérité incontestable, et tout ce qui existe dépend entièrement de Lui.', sound: 'Al-Ḥaqq', illustration: '💎', mnemonic: 'Même racine que "Ḥaqīqa" (réalité, vérité)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَقّ" (Al-Ḥaqq) ?', options: ['La Vérité Absolue', 'Le Mensonge', 'L\'Illusion', 'Le Doute'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَكِيل', name: 'Al-Wakīl', instruction: 'Le Garant suprême : Il prend en charge les affaires de quiconque s\'en remet à Lui avec une confiance sincère (tawakkul).', sound: 'Al-Wakīl', illustration: '🤝', mnemonic: 'Même racine que "Tawakkul" (confiance en Dieu)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَكِيل" (Al-Wakīl) ?', options: ['Le Garant suprême', 'L\'Abandonneur', 'L\'Indifférent', 'Le Fuyant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْقَوِيّ', name: 'Al-Qawiyy', instruction: 'Le Fort : Sa force est absolue, sans la moindre faiblesse ni limite ; toute puissance créée n\'est qu\'un reflet de la Sienne.', sound: 'Al-Qawiyy', illustration: '💪', mnemonic: 'Même racine que "Quwwa" (force)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقَوِيّ" (Al-Qawiyy) ?', options: ['Le Fort', 'Le Faible', 'Le Fragile', 'L\'Épuisé'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 18 (Noms d\'Allah) terminée ! Parcours Les 99 Noms d\'Allah (3e partie) : 54 noms explorés. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمَتِين', name: 'Al-Matīn', instruction: 'Le Ferme, l\'Inébranlable : Sa force est stable et invincible, sans jamais faiblir malgré l\'effort déployé. Souvent cité avec Al-Qawiyy.', sound: 'Al-Matīn', illustration: '🗻', mnemonic: 'La solidité qui ne cède jamais' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمَتِين" (Al-Matīn) ?', options: ['Le Ferme, l\'Inébranlable', 'Le Fragile', 'L\'Instable', 'Le Changeant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَلِيّ', name: 'Al-Waliyy', instruction: 'Le Protecteur Allié : Il prend en charge et soutient Ses serviteurs croyants comme un proche et fidèle allié, les guidant hors des ténèbres.', sound: 'Al-Waliyy', illustration: '🤝', mnemonic: 'Même racine que "Walī" (allié, tuteur)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَلِيّ" (Al-Waliyy) ?', options: ['Le Protecteur Allié', 'L\'Ennemi', 'L\'Étranger', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَمِيد', name: 'Al-Ḥamīd', instruction: 'Le Digne de Louange : Il est loué en Lui-même, par Sa perfection propre, indépendamment de la reconnaissance ou non de Sa création.', sound: 'Al-Ḥamīd', illustration: '🙌', mnemonic: 'Même racine que "Ḥamd" (louange)', rootKey: 'H-M-D' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَمِيد" (Al-Ḥamīd) ?', options: ['Le Digne de Louange', 'Le Blâmable', 'L\'Ingrat', 'L\'Oublié'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 19 (Noms d\'Allah) terminée ! Al-Matīn, Al-Waliyy, Al-Ḥamīd. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُحْصِي', name: 'Al-Muḥṣī', instruction: 'Celui qui dénombre tout : Il connaît et comptabilise avec une exactitude parfaite chaque chose de la création, jusqu\'au moindre détail.', sound: 'Al-Muḥṣī', illustration: '🔢', mnemonic: 'Même racine que "Iḥṣāʼ" (recensement)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُحْصِي" (Al-Muḥṣī) ?', options: ['Celui qui dénombre tout', 'Celui qui oublie tout', 'Celui qui ignore', 'Celui qui approxime'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُبْدِئ', name: 'Al-Mubdiʼ', instruction: 'L\'Initiateur : Il crée toute chose pour la première fois, à partir de rien et sans modèle préexistant.', sound: 'Al-Mubdiʼ', illustration: '🌱', mnemonic: 'Toujours cité avec Al-Muʻīd' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُبْدِئ" (Al-Mubdiʼ) ?', options: ['L\'Initiateur (première création)', 'Le Destructeur', 'Celui qui copie', 'Celui qui termine'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُعِيد', name: 'Al-Muʻīd', instruction: 'Celui qui recommence : Il ramène à la vie ce qui a disparu, notamment lors de la résurrection, tout comme Il l\'a créé une première fois.', sound: 'Al-Muʻīd', illustration: '🔄', mnemonic: 'Toujours cité avec Al-Mubdiʼ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُعِيد" (Al-Muʻīd) ?', options: ['Celui qui recommence', 'Celui qui abandonne', 'Celui qui efface', 'Celui qui oublie'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 20 (Noms d\'Allah) terminée ! Al-Muḥṣī, Al-Mubdiʼ, Al-Muʻīd. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُحْيِي', name: 'Al-Muḥyī', instruction: 'Celui qui donne la vie : Il insuffle la vie à toute chose, du néant à l\'existence, et ressuscitera les morts le Jour du Jugement.', sound: 'Al-Muḥyī', illustration: '🌿', mnemonic: 'Même racine que "Ḥayāt" (vie)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُحْيِي" (Al-Muḥyī) ?', options: ['Celui qui donne la vie', 'Celui qui donne la mort', 'Celui qui ignore', 'Celui qui punit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُمِيت', name: 'Al-Mumīt', instruction: 'Celui qui donne la mort : Il reprend la vie qu\'Il a accordée, au moment précis qu\'Il détermine, en contrepoint d\'Al-Muḥyī.', sound: 'Al-Mumīt', illustration: '🕊️', mnemonic: 'Toujours cité avec Al-Muḥyī' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُمِيت" (Al-Mumīt) ?', options: ['Celui qui donne la mort', 'Celui qui donne la vie', 'Celui qui guérit', 'Celui qui protège'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْحَيّ', name: 'Al-Ḥayy', instruction: 'Le Vivant : Sa vie est éternelle, sans début ni fin, sans faiblesse ni sommeil ; Il est toujours cité avec Al-Qayyūm.', sound: 'Al-Ḥayy', illustration: '💚', mnemonic: 'Même racine que "Ḥayāt" (vie)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَيّ" (Al-Ḥayy) ?', options: ['Le Vivant', 'Le Mort', 'L\'Endormi', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 21 (Noms d\'Allah) terminée ! Al-Muḥyī, Al-Mumīt, Al-Ḥayy. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْقَيُّوم', name: 'Al-Qayyūm', instruction: 'Celui qui subsiste par Lui-même : Il n\'a besoin de rien ni personne, et toute la création dépend de Lui pour exister et subsister à chaque instant.', sound: 'Al-Qayyūm', illustration: '⛰️', mnemonic: 'Toujours cité avec Al-Ḥayy (Āyat al-Kursī)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقَيُّوم" (Al-Qayyūm) ?', options: ['Celui qui subsiste par Lui-même', 'Celui qui dépend des autres', 'Le Fragile', 'Le Passager'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَاجِد', name: 'Al-Wājid', instruction: 'Celui qui trouve tout : Rien ne Lui manque, Il possède tout ce qu\'Il veut sans jamais en être privé ni dans le besoin.', sound: 'Al-Wājid', illustration: '💎', mnemonic: 'Même racine que "Wujūd" (existence)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَاجِد" (Al-Wājid) ?', options: ['Celui qui trouve tout, ne manque de rien', 'Celui qui cherche', 'Celui qui perd', 'Celui qui manque'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَاحِد', name: 'Al-Wāḥid', instruction: 'L\'Unique : Il n\'a ni associé ni égal, absolument unique en Son essence, Ses attributs et Ses actes.', sound: 'Al-Wāḥid', illustration: '1️⃣', mnemonic: 'Même racine que "Wāḥid" (un, unique)', rootKey: 'W-H-D' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَاحِد" (Al-Wāḥid) ?', options: ['L\'Unique', 'Le Multiple', 'L\'Associé', 'Le Divisé'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 22 (Noms d\'Allah) terminée ! Al-Qayyūm, Al-Wājid, Al-Wāḥid. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلصَّمَد', name: 'Aṣ-Ṣamad', instruction: 'Le Seul à qui l\'on s\'en remet : toute la création a besoin de Lui pour subsister, alors que Lui n\'a besoin de rien ni de personne. Nom central de la sourate Al-Ikhlāṣ.', sound: 'Aṣ-Ṣamad', illustration: '🎯', mnemonic: 'Toute chose se tourne vers Lui, Lui vers rien' },
      { type: 'qcm', instruction: 'Que signifie "ٱلصَّمَد" (Aṣ-Ṣamad) ?', options: ['Celui dont tous ont besoin, qui n\'a besoin de rien', 'Celui qui a besoin des autres', 'Le Dépendant', 'Le Fragile'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ٱلْقَادِر', name: 'Al-Qādir', instruction: 'Le Capable : Il a le pouvoir de faire tout ce qu\'Il veut, sans aucune limite ni contrainte, à tout moment qu\'Il choisit.', sound: 'Al-Qādir', illustration: '⚡', mnemonic: 'Même racine que "Qudra" (capacité, pouvoir)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْقَادِر" (Al-Qādir) ?', options: ['Le Capable, sans limite', 'L\'Incapable', 'Le Faible', 'L\'Hésitant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُقْتَدِر', name: 'Al-Muqtadir', instruction: 'Le Tout-Puissant Absolu : Sa capacité surpasse toute puissance créée ; Il exerce Son pouvoir avec une aisance totale et sans effort.', sound: 'Al-Muqtadir', illustration: '👑', mnemonic: 'Forme intensive d\'Al-Qādir' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُقْتَدِر" (Al-Muqtadir) ?', options: ['Le Tout-Puissant Absolu', 'Le Vulnérable', 'L\'Indécis', 'Le Dépendant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 23 (Noms d\'Allah) terminée ! Aṣ-Ṣamad, Al-Qādir, Al-Muqtadir. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْأَوَّل', name: 'Al-Awwal', instruction: 'Le Premier : Il existe avant toute chose, sans commencement, sans que rien ne L\'ait précédé.', sound: 'Al-Awwal', illustration: '🔢', mnemonic: 'Toujours cité avec Al-Ākhir' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْأَوَّل" (Al-Awwal) ?', options: ['Le Premier, sans commencement', 'Le Dernier', 'Le Milieu', 'L\'Absent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْآخِر', name: 'Al-Ākhir', instruction: 'Le Dernier : Il subsistera après la disparition de toute chose, sans fin, sans que rien ne Lui succède.', sound: 'Al-Ākhir', illustration: '🔚', mnemonic: 'Toujours cité avec Al-Awwal' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْآخِر" (Al-Ākhir) ?', options: ['Le Dernier, sans fin', 'Le Premier', 'Le Milieu', 'Le Passager'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلظَّاهِر', name: 'Aẓ-Ẓāhir', instruction: 'L\'Apparent : Son existence est manifeste à travers les innombrables signes de Sa création, visible par Ses effets bien qu\'invisible en Son essence.', sound: 'Aẓ-Ẓāhir', illustration: '🌅', mnemonic: 'Toujours cité avec Al-Bāṭin' },
      { type: 'qcm', instruction: 'Que signifie "ٱلظَّاهِر" (Aẓ-Ẓāhir) ?', options: ['L\'Apparent (par Ses signes)', 'Le Caché totalement', 'L\'Inexistant', 'L\'Oublié'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 24 (Noms d\'Allah) terminée ! Al-Awwal, Al-Ākhir, Aẓ-Ẓāhir. Parcours Les 99 Noms d\'Allah (4e partie) : 72 noms explorés. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُقَدِّم', name: 'Al-Muqaddim', instruction: 'Celui qui avance : Il place en avant qui Il veut, en rang, en mérite ou dans le temps, selon Sa sagesse insondable.', sound: 'Al-Muqaddim', illustration: '⏩', mnemonic: 'Toujours cité avec Al-Muʼakhkhir' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُقَدِّم" (Al-Muqaddim) ?', options: ['Celui qui avance, place en premier', 'Celui qui retarde', 'Celui qui oublie', 'Celui qui efface'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُؤَخِّر', name: 'Al-Muʼakhkhir', instruction: 'Celui qui retarde : Il retient en arrière qui Il veut, reportant ce qu\'Il veut au moment qu\'Il choisit Lui-même.', sound: 'Al-Muʼakhkhir', illustration: '⏪', mnemonic: 'Toujours cité avec Al-Muqaddim' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُؤَخِّر" (Al-Muʼakhkhir) ?', options: ['Celui qui retarde, retient en arrière', 'Celui qui avance', 'Celui qui presse', 'Celui qui accélère'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَاطِن', name: 'Al-Bāṭin', instruction: 'Le Caché : Son essence est inaccessible aux sens et à l\'imagination, bien qu\'Il soit plus proche de Ses serviteurs que leur propre veine jugulaire.', sound: 'Al-Bāṭin', illustration: '🌫️', mnemonic: 'Toujours cité avec Aẓ-Ẓāhir' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَاطِن" (Al-Bāṭin) ?', options: ['Le Caché (en essence)', 'L\'Apparent', 'Le Visible', 'L\'Exposé'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 25 (Noms d\'Allah) terminée ! Al-Muqaddim, Al-Muʼakhkhir, Al-Bāṭin. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُتَعَالِي', name: 'Al-Mutaʻālī', instruction: 'Le Transcendant : Il est élevé au-dessus de toute imperfection et de toute ressemblance avec Sa création, dans une majesté absolue.', sound: 'Al-Mutaʻālī', illustration: '🕌', mnemonic: 'Même racine qu\'Al-ʻAliyy' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُتَعَالِي" (Al-Mutaʻālī) ?', options: ['Le Transcendant', 'Le Bas', 'L\'Ordinaire', 'Le Semblable'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَرّ', name: 'Al-Barr', instruction: 'Le Bienfaisant : Sa bonté et Sa bienveillance envers Ses serviteurs sont immenses, constantes et dépassent tout mérite humain.', sound: 'Al-Barr', illustration: '🌾', mnemonic: 'Même racine que "Birr" (piété, bonté)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَرّ" (Al-Barr) ?', options: ['Le Bienfaisant', 'Le Malveillant', 'L\'Indifférent', 'Le Sévère'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلتَّوَّاب', name: 'At-Tawwāb', instruction: 'Celui qui accepte le repentir : Il revient sans cesse vers Son serviteur repentant, aussi souvent qu\'il se repent avec sincérité.', sound: 'At-Tawwāb', illustration: '🔄', mnemonic: 'Même racine que "Tawba" (repentir)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلتَّوَّاب" (At-Tawwāb) ?', options: ['Celui qui accepte le repentir', 'Celui qui refuse le pardon', 'Le Rancunier', 'L\'Intransigeant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 26 (Noms d\'Allah) terminée ! Al-Mutaʻālī, Al-Barr, At-Tawwāb. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُنْتَقِم', name: 'Al-Muntaqim', instruction: 'Le Vengeur : Il punit avec justice les oppresseurs et les injustes obstinés qui refusent de se repentir, sans jamais commettre la moindre injustice.', sound: 'Al-Muntaqim', illustration: '⚔️', mnemonic: 'Même racine que "Intiqām" (vengeance)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُنْتَقِم" (Al-Muntaqim) ?', options: ['Le Vengeur (juste)', 'Le Pardonneur', 'L\'Indulgent', 'Le Négligent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْعَفُوّ', name: 'Al-ʻAfuww', instruction: 'Celui qui efface les fautes : Il pardonne au point d\'effacer complètement la trace du péché, comme s\'il n\'avait jamais existé.', sound: 'Al-ʻAfuww', illustration: '🕊️', mnemonic: 'Même racine que "ʻAfw" (effacement, pardon)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْعَفُوّ" (Al-ʻAfuww) ?', options: ['Celui qui efface les fautes', 'Celui qui punit', 'Celui qui accuse', 'Celui qui se venge'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّؤُوف', name: 'Ar-Raʼūf', instruction: 'Le Bienveillant, le Compatissant : Sa douceur envers Ses serviteurs dépasse celle de toute mère envers son enfant.', sound: 'Ar-Raʼūf', illustration: '💗', mnemonic: 'Souvent associé à Ar-Raḥīm' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّؤُوف" (Ar-Raʼūf) ?', options: ['Le Bienveillant, Compatissant', 'Le Dur', 'L\'Insensible', 'Le Distant'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 27 (Noms d\'Allah) terminée ! Al-Muntaqim, Al-ʻAfuww, Ar-Raʼūf. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'مَالِكُ ٱلْمُلْك', name: 'Mālik-ul-Mulk', instruction: 'Le Maître du Royaume : Il donne et retire la royauté et le pouvoir à qui Il veut, sans que quiconque ne puisse s\'y opposer.', sound: 'Mālik-ul-Mulk', illustration: '👑', mnemonic: 'Composé d\'Al-Malik et de "Mulk" (royaume)' },
      { type: 'qcm', instruction: 'Que signifie "مَالِكُ ٱلْمُلْك" (Mālik-ul-Mulk) ?', options: ['Le Maître du Royaume', 'Le Sujet du royaume', 'L\'Étranger au royaume', 'Le Serviteur du roi'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَام', name: 'Dhul-Jalāli wal-Ikrām', instruction: 'Le Possesseur de la Majesté et de la Munificence : Il réunit à la fois une grandeur redoutable et une générosité infinie envers Ses serviteurs.', sound: 'Dhul-Jalāli wal-Ikrām', illustration: '✨', mnemonic: 'Combine Al-Jalīl (majesté) et Al-Karīm (générosité)' },
      { type: 'qcm', instruction: 'Que réunit le nom "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام" (Dhul-Jalāli wal-Ikrām) ?', options: ['Majesté et générosité', 'Faiblesse et pardon', 'Colère et vengeance', 'Silence et absence'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ٱلْمُقْسِط', name: 'Al-Muqsiṭ', instruction: 'L\'Équitable : Il rétablit la justice parfaite entre les opprimés et leurs oppresseurs, notamment au Jour du Jugement.', sound: 'Al-Muqsiṭ', illustration: '⚖️', mnemonic: 'Même racine que "Qisṭ" (équité)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُقْسِط" (Al-Muqsiṭ) ?', options: ['L\'Équitable', 'Le Partial', 'L\'Injuste', 'L\'Indifférent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 28 (Noms d\'Allah) terminée ! Mālik-ul-Mulk, Dhul-Jalāli wal-Ikrām, Al-Muqsiṭ. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْجَامِع', name: 'Al-Jāmiʻ', instruction: 'Celui qui rassemble : Il réunira toute la création le Jour de la Résurrection, et rassemble ce qu\'Il veut selon Sa sagesse.', sound: 'Al-Jāmiʻ', illustration: '🧲', mnemonic: 'Même racine que "Jamʻ" (rassemblement)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْجَامِع" (Al-Jāmiʻ) ?', options: ['Celui qui rassemble', 'Celui qui disperse', 'Celui qui isole', 'Celui qui divise'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْغَنِيّ', name: 'Al-Ghaniyy', instruction: 'Le Riche par excellence : Il n\'a besoin d\'aucune de Ses créatures, alors que toutes ont besoin de Lui pour exister et subsister.', sound: 'Al-Ghaniyy', illustration: '💰', mnemonic: 'Même racine que "Ghinā" (richesse)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْغَنِيّ" (Al-Ghaniyy) ?', options: ['Le Riche, sans besoin', 'Le Pauvre', 'Le Dépendant', 'Le Nécessiteux'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْمُغْنِي', name: 'Al-Mughnī', instruction: 'Celui qui enrichit : Il accorde la richesse et l\'aisance, matérielle ou spirituelle, à qui Il veut parmi Ses serviteurs.', sound: 'Al-Mughnī', illustration: '💎', mnemonic: 'Toujours cité avec Al-Ghaniyy' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُغْنِي" (Al-Mughnī) ?', options: ['Celui qui enrichit', 'Celui qui appauvrit', 'Celui qui ignore', 'Celui qui prive'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 29 (Noms d\'Allah) terminée ! Al-Jāmiʻ, Al-Ghaniyy, Al-Mughnī. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمَانِع', name: 'Al-Māniʻ', instruction: 'Celui qui empêche : Il retient ce qu\'Il veut, protégeant Ses serviteurs de ce qui leur serait nuisible, selon Sa sagesse.', sound: 'Al-Māniʻ', illustration: '🛑', mnemonic: 'Même racine que "Manʻ" (empêchement)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمَانِع" (Al-Māniʻ) ?', options: ['Celui qui empêche, retient', 'Celui qui donne toujours', 'Celui qui autorise tout', 'Celui qui ignore'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلضَّار', name: 'Aḍ-Ḍārr', instruction: 'Celui qui peut nuire : Il permet l\'épreuve et la difficulté selon Sa sagesse insondable, toujours en contrepoint d\'An-Nāfiʻ.', sound: 'Aḍ-Ḍārr', illustration: '⚠️', mnemonic: 'Toujours cité avec An-Nāfiʻ' },
      { type: 'qcm', instruction: 'Que signifie "ٱلضَّار" (Aḍ-Ḍārr) ?', options: ['Celui qui peut nuire (par sagesse)', 'Celui qui protège toujours', 'Le Bienfaiteur exclusif', 'Le Sauveur unique'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ٱلنَّافِع', name: 'An-Nāfiʻ', instruction: 'Celui qui est utile, bénéfique : Il accorde le bien et l\'utilité à qui Il veut, source de tout bienfait véritable.', sound: 'An-Nāfiʻ', illustration: '🌟', mnemonic: 'Toujours cité avec Aḍ-Ḍārr' },
      { type: 'qcm', instruction: 'Que signifie "ٱلنَّافِع" (An-Nāfiʻ) ?', options: ['Celui qui est bénéfique', 'Celui qui nuit', 'Celui qui ignore', 'Celui qui prive'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 30 (Noms d\'Allah) terminée ! Al-Māniʻ, Aḍ-Ḍārr, An-Nāfiʻ. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلنُّور', name: 'An-Nūr', instruction: 'La Lumière : Il illumine les cieux et la terre, et guide les cœurs des croyants vers la vérité, dissipant les ténèbres de l\'ignorance.', sound: 'An-Nūr', illustration: '💡', mnemonic: 'Même racine que "Nūr" (lumière)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلنُّور" (An-Nūr) ?', options: ['La Lumière', 'L\'Obscurité', 'L\'Ombre', 'Le Voile'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْهَادِي', name: 'Al-Hādī', instruction: 'Le Guide : Il oriente Ses serviteurs vers le droit chemin et la vérité, éclairant leur cœur et facilitant leur cheminement.', sound: 'Al-Hādī', illustration: '🧭', mnemonic: 'Même racine que "Hidāya" (guidance)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْهَادِي" (Al-Hādī) ?', options: ['Le Guide', 'Celui qui égare', 'L\'Abandonneur', 'L\'Indifférent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْبَدِيع', name: 'Al-Badīʻ', instruction: 'L\'Inventeur incomparable : Il crée sans modèle préalable ni précédent, d\'une manière absolument originale et sans égal.', sound: 'Al-Badīʻ', illustration: '🎨', mnemonic: 'Même racine que "Ibdāʻ" (innovation)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَدِيع" (Al-Badīʻ) ?', options: ['L\'Inventeur incomparable', 'L\'Imitateur', 'Le Copieur', 'Le Répétiteur'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 31 (Noms d\'Allah) terminée ! An-Nūr, Al-Hādī, Al-Badīʻ. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْبَاقِي', name: 'Al-Bāqī', instruction: 'Celui qui demeure éternellement : Après la disparition de toute la création, Lui seul subsiste, sans fin et sans altération.', sound: 'Al-Bāqī', illustration: '♾️', mnemonic: 'Même racine que "Baqāʼ" (permanence)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْبَاقِي" (Al-Bāqī) ?', options: ['Celui qui demeure éternellement', 'Celui qui disparaît', 'Le Passager', 'L\'Éphémère'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوَارِث', name: 'Al-Wārith', instruction: 'L\'Héritier ultime : Après la disparition de toutes Ses créatures, tout Lui revient, seul héritier de toute chose.', sound: 'Al-Wārith', illustration: '📜', mnemonic: 'Même racine que "Mīrāth" (héritage)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْوَارِث" (Al-Wārith) ?', options: ['L\'Héritier ultime de toute chose', 'Celui qui donne tout', 'Le Prêteur', 'Le Débiteur'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلرَّشِيد', name: 'Ar-Rashīd', instruction: 'Celui qui guide avec sagesse : Il conduit Sa création vers ce qui est juste et bon, sans jamais Se tromper ni égarer qui que ce soit.', sound: 'Ar-Rashīd', illustration: '🌟', mnemonic: 'Même racine que "Rushd" (droiture, maturité)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلرَّشِيد" (Ar-Rashīd) ?', options: ['Celui qui guide avec sagesse', 'Celui qui égare', 'L\'Insensé', 'L\'Imprudent'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 32 (Noms d\'Allah) terminée ! Al-Bāqī, Al-Wārith, Ar-Rashīd. Parcours Les 99 Noms d\'Allah (5e partie) : 96 noms explorés. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمُعْطِي', name: 'Al-Muʻṭī', instruction: 'Le Généreux Donateur : Il est la source de tout don, matériel ou spirituel ; personne ne peut donner ce qu\'Il retient, ni retenir ce qu\'Il donne.', sound: 'Al-Muʻṭī', illustration: '🎁', mnemonic: 'Même racine que "ʻAṭāʼ" (don)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمُعْطِي" (Al-Muʻṭī) ?', options: ['Le Généreux Donateur', 'Celui qui retient tout', 'L\'Avare', 'Celui qui prend'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْفَرْد', name: 'Al-Fard', instruction: 'L\'Unique, le Singulier : Il est seul en Son essence, sans partie ni composition, radicalement différent de tout ce qui existe.', sound: 'Al-Fard', illustration: '☝️', mnemonic: 'Proche d\'Al-Wāḥid, mais insiste sur l\'absence de composition' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْفَرْد" (Al-Fard) ?', options: ['L\'Unique, sans composition', 'Le Multiple', 'Le Divisible', 'Le Semblable'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلْوِتْر', name: 'Al-Witr', instruction: 'L\'Impair : d\'après le hadith "Allah est Witr (impair) et Il aime l\'impair", ce nom souligne l\'unicité absolue de Dieu, à l\'image du nombre impair qui ne se divise pas en deux parts égales.', sound: 'Al-Witr', illustration: '1️⃣', mnemonic: 'Rappelle le nombre impair, symbole d\'unicité indivisible' },
      { type: 'qcm', instruction: 'Que rappelle le nom "ٱلْوِتْر" (Al-Witr, l\'Impair) ?', options: ['L\'unicité indivisible de Dieu', 'La multiplicité des dieux', 'Le hasard', 'La symétrie parfaite'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 33 (Noms d\'Allah) terminée ! Al-Muʻṭī, Al-Fard, Al-Witr. Parcours Les 99 Noms d\'Allah complet : les 99 noms sont désormais explorés ! +25 XP' }
    ]
  ];

  const expressionsLessons = [
    [
      { type: 'intro', letter: 'مَرْحَبًا', name: 'Bonjour, Bienvenue', instruction: 'La salutation la plus courante et universelle en arabe.', sound: 'Marḥaban', illustration: '👋', mnemonic: 'Utilisable à tout moment de la journée' },
      { type: 'qcm', instruction: 'Que signifie "مَرْحَبًا" (Marḥaban) ?', options: ['Au revoir', 'Bonjour, Bienvenue', 'Merci', 'Pardon'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلسَّلَامُ عَلَيْكُمْ', name: 'Que la paix soit sur vous', instruction: 'La salutation islamique par excellence, échangée entre musulmans.', sound: 'As-Salāmu ʻAlaykum', illustration: '☮️', mnemonic: 'On répond "Wa ʻalaykum as-salām"' },
      { type: 'qcm', instruction: 'Que signifie "ٱلسَّلَامُ عَلَيْكُمْ" ?', options: ['Que la paix soit sur vous', 'Comment allez-vous ?', 'À bientôt', 'Bon appétit'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'مَعَ ٱلسَّلَامَة', name: 'Au revoir', instruction: 'Littéralement "avec la sécurité/la paix" : une formule d\'adieu chaleureuse.', sound: 'Maʻa s-Salāma', illustration: '🚶', mnemonic: 'Souhaite un bon retour à l\'autre' },
      { type: 'qcm', instruction: 'Que signifie "مَعَ ٱلسَّلَامَة" (Maʻa s-Salāma) ?', options: ['Bonjour', 'Au revoir', 'Merci', 'Excusez-moi'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 1 (Expressions) terminée ! Les salutations de base. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'مِنْ فَضْلِكَ', name: 'S\'il te plaît', instruction: 'Formule de politesse pour accompagner une demande.', sound: 'Min Faḍlik', illustration: '🙏', mnemonic: 'Littéralement "de ta grâce"' },
      { type: 'qcm', instruction: 'Que signifie "مِنْ فَضْلِكَ" (Min Faḍlik) ?', options: ['Merci', 'S\'il te plaît', 'Pardon', 'Bienvenue'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'شُكْرًا', name: 'Merci', instruction: 'L\'expression de gratitude la plus simple et directe.', sound: 'Shukran', illustration: '🙌', mnemonic: 'Même racine que "Shukr" (gratitude)' },
      { type: 'qcm', instruction: 'Que signifie "شُكْرًا" (Shukran) ?', options: ['Merci', 'Bonjour', 'Excusez-moi', 'Peut-être'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'عَفْوًا', name: 'De rien, Pardon', instruction: 'Utilisé pour répondre à un remerciement, ou pour s\'excuser.', sound: 'ʻAfwan', illustration: '😊', mnemonic: 'Un mot à double usage' },
      { type: 'qcm', instruction: 'Que signifie "عَفْوًا" (ʻAfwan) ?', options: ['De rien / Pardon', 'Au revoir', 'Absolument', 'Jamais'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 2 (Expressions) terminée ! Les formules de politesse. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'كَيْفَ حَالُكَ؟', name: 'Comment vas-tu ?', instruction: 'La question la plus courante pour prendre des nouvelles de quelqu\'un.', sound: 'Kayfa Ḥāluk', illustration: '❓', mnemonic: 'Se demande à un homme (Ḥāluki pour une femme)' },
      { type: 'qcm', instruction: 'Que signifie "كَيْفَ حَالُكَ؟" ?', options: ['Comment vas-tu ?', 'Où es-tu ?', 'Quel âge as-tu ?', 'Que fais-tu ?'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'مَا ٱسْمُكَ؟', name: 'Quel est ton nom ?', instruction: 'Question de base pour faire connaissance.', sound: 'Mā Ismuk', illustration: '🙋', mnemonic: 'Ismuki pour une femme' },
      { type: 'qcm', instruction: 'Que signifie "مَا ٱسْمُكَ؟" ?', options: ['Quel âge as-tu ?', 'Quel est ton nom ?', 'D\'où viens-tu ?', 'Que veux-tu ?'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'مِنْ أَيْنَ أَنْتَ؟', name: 'D\'où viens-tu ?', instruction: 'Pour demander l\'origine ou le pays de quelqu\'un.', sound: 'Min Ayna Anta', illustration: '🌍', mnemonic: 'Min Ayna Anti pour une femme' },
      { type: 'qcm', instruction: 'Que signifie "مِنْ أَيْنَ أَنْتَ؟" ?', options: ['Où vas-tu ?', 'D\'où viens-tu ?', 'Quel âge as-tu ?', 'Comment t\'appelles-tu ?'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 3 (Expressions) terminée ! Les questions de base. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أَنَا بِخَيْر', name: 'Je vais bien', instruction: 'La réponse la plus courante à "Comment vas-tu ?".', sound: 'Anā Bikhayr', illustration: '😊', mnemonic: 'Littéralement "je suis dans le bien"' },
      { type: 'qcm', instruction: 'Que signifie "أَنَا بِخَيْر" (Anā Bikhayr) ?', options: ['Je vais bien', 'Je suis fatigué', 'Je ne sais pas', 'Je m\'appelle...'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ٱسْمِي', name: 'Je m\'appelle...', instruction: 'Pour se présenter, suivi de son prénom.', sound: 'Ismī', illustration: '🪪', mnemonic: 'Littéralement "mon nom (est)"' },
      { type: 'qcm', instruction: 'Que signifie "ٱسْمِي" (Ismī) ?', options: ['Mon âge', 'Je m\'appelle... / Mon nom', 'Mon pays', 'Ma famille'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'نَعَمْ / لَا', name: 'Oui / Non', instruction: 'Les deux réponses de base à toute question fermée.', sound: 'Naʻam / Lā', illustration: '✅', mnemonic: 'Les deux mots les plus utilisés' },
      { type: 'qcm', instruction: 'Que signifie "نَعَمْ" (Naʻam) ?', options: ['Oui', 'Non', 'Peut-être', 'Jamais'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 4 (Expressions) terminée ! Les réponses courantes. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'كَمِ ٱلسَّاعَة؟', name: 'Quelle heure est-il ?', instruction: 'Question pratique du quotidien pour demander l\'heure.', sound: 'Kam is-Sāʻa', illustration: '🕐', mnemonic: 'Littéralement "combien l\'heure ?"' },
      { type: 'qcm', instruction: 'Que signifie "كَمِ ٱلسَّاعَة؟" (Kam is-Sāʻa) ?', options: ['Quel jour est-il ?', 'Quelle heure est-il ?', 'Quel âge as-tu ?', 'Combien ça coûte ?'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'أَيْنَ...؟', name: 'Où est... ?', instruction: 'Pour demander l\'emplacement de quelque chose ou quelqu\'un.', sound: 'Ayna', illustration: '📍', mnemonic: 'Suivi du nom de ce que l\'on cherche' },
      { type: 'qcm', instruction: 'Que signifie "أَيْنَ...؟" (Ayna) ?', options: ['Quand... ?', 'Où est... ?', 'Pourquoi... ?', 'Comment... ?'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أُرِيدُ', name: 'Je veux', instruction: 'Pour exprimer un souhait ou une demande, suivi d\'un nom ou verbe.', sound: 'Urīdu', illustration: '🙋‍♂️', mnemonic: 'Très utile pour faire une demande simple' },
      { type: 'qcm', instruction: 'Que signifie "أُرِيدُ" (Urīdu) ?', options: ['Je vais', 'Je veux', 'Je pense', 'Je sais'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 5 (Expressions) terminée ! Expressions pratiques du quotidien. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'إِن شَاءَ ٱللَّٰه', name: 'Si Dieu le veut', instruction: 'Expression utilisée en parlant du futur, rappelant que tout dépend de la volonté de Dieu.', sound: 'In Shāʼ Allāh', illustration: '🤲', mnemonic: 'Très courante avant toute projection future' },
      { type: 'qcm', instruction: 'Quand utilise-t-on "إِن شَاءَ ٱللَّٰه" (In Shāʼ Allāh) ?', options: ['En parlant du passé', 'En parlant du futur', 'Pour remercier', 'Pour s\'excuser'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ٱلْحَمْدُ لِلَّٰه', name: 'Louange à Dieu', instruction: 'Expression de gratitude envers Dieu, utilisée en toute occasion, bonne ou difficile.', sound: 'Al-Ḥamdu Lillāh', illustration: '🙌', mnemonic: 'Premier mot d\'Al-Fatiha après la Basmala', rootKey: 'H-M-D' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْحَمْدُ لِلَّٰه" (Al-Ḥamdu Lillāh) ?', options: ['Louange à Dieu', 'Que Dieu pardonne', 'Dieu est grand', 'Que la paix soit sur vous'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'بَارَكَ ٱللَّٰهُ فِيك', name: 'Que Dieu te bénisse', instruction: 'Formule de remerciement chaleureuse et bénédiction pour l\'autre.', sound: 'Bāraka Llāhu Fīk', illustration: '🌿', mnemonic: 'Une façon de dire merci en bénissant', rootKey: 'B-R-K' },
      { type: 'qcm', instruction: 'Que signifie "بَارَكَ ٱللَّٰهُ فِيك" ?', options: ['Que Dieu te punisse', 'Que Dieu te bénisse', 'Que Dieu t\'oublie', 'Que Dieu t\'éloigne'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 6 (Expressions) terminée ! Expressions religieuses courantes. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'وَاحِد', name: 'Un', instruction: 'Le premier nombre, base de tout le comptage.', sound: 'Wāḥid', illustration: '1️⃣', mnemonic: 'Même mot que "Wāḥid" (Unique, nom divin)', rootKey: 'W-H-D' },
      { type: 'qcm', instruction: 'Que signifie "وَاحِد" (Wāḥid) ?', options: ['Un', 'Deux', 'Trois', 'Zéro'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'اثْنَان', name: 'Deux', instruction: 'Le deuxième nombre.', sound: 'Ithnān', illustration: '2️⃣', mnemonic: 'Facile à retenir après Wāḥid' },
      { type: 'qcm', instruction: 'Que signifie "اثْنَان" (Ithnān) ?', options: ['Un', 'Deux', 'Trois', 'Quatre'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ثَلَاثَة', name: 'Trois', instruction: 'Le troisième nombre.', sound: 'Thalātha', illustration: '3️⃣', mnemonic: 'Complète les trois premiers nombres' },
      { type: 'qcm', instruction: 'Que signifie "ثَلَاثَة" (Thalātha) ?', options: ['Deux', 'Trois', 'Quatre', 'Cinq'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 7 (Expressions) terminée ! Les nombres 1 à 3. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أَب', name: 'Père', instruction: 'Le mot pour désigner son père.', sound: 'Ab', illustration: '👨', mnemonic: 'Court et simple à retenir' },
      { type: 'qcm', instruction: 'Que signifie "أَب" (Ab) ?', options: ['Père', 'Mère', 'Frère', 'Sœur'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أُمّ', name: 'Mère', instruction: 'Le mot pour désigner sa mère.', sound: 'Umm', illustration: '👩', mnemonic: 'À l\'origine du mot "Umma" (communauté)' },
      { type: 'qcm', instruction: 'Que signifie "أُمّ" (Umm) ?', options: ['Père', 'Mère', 'Fils', 'Fille'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَخ', name: 'Frère', instruction: 'Le mot pour désigner son frère, aussi utilisé entre amis proches.', sound: 'Akh', illustration: '👦', mnemonic: 'Terme d\'affection fraternelle' },
      { type: 'qcm', instruction: 'Que signifie "أَخ" (Akh) ?', options: ['Père', 'Sœur', 'Frère', 'Ami'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 8 (Expressions) terminée ! Vocabulaire de la famille. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'طَعَام', name: 'Nourriture', instruction: 'Le mot général pour désigner la nourriture ou un repas.', sound: 'Ṭaʻām', illustration: '🍽️', mnemonic: 'Utile pour tout repas' },
      { type: 'qcm', instruction: 'Que signifie "طَعَام" (Ṭaʻām) ?', options: ['Nourriture', 'Boisson', 'Vêtement', 'Maison'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مَاء', name: 'Eau', instruction: 'Le mot le plus simple et le plus utile pour demander de l\'eau.', sound: 'Māʼ', illustration: '💧', mnemonic: 'Un mot essentiel du quotidien' },
      { type: 'qcm', instruction: 'Que signifie "مَاء" (Māʼ) ?', options: ['Eau', 'Lait', 'Thé', 'Pain'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'خُبْز', name: 'Pain', instruction: 'L\'aliment de base dans de nombreux pays arabes.', sound: 'Khubz', illustration: '🍞', mnemonic: 'Présent à presque tous les repas' },
      { type: 'qcm', instruction: 'Que signifie "خُبْز" (Khubz) ?', options: ['Pain', 'Riz', 'Viande', 'Fruit'], correctIndex: 0, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 9 (Expressions) terminée ! Nourriture et boisson. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'يَمِين', name: 'Droite', instruction: 'Pour indiquer une direction à droite.', sound: 'Yamīn', illustration: '➡️', mnemonic: 'Opposé de Yasār (gauche)' },
      { type: 'qcm', instruction: 'Que signifie "يَمِين" (Yamīn) ?', options: ['Gauche', 'Droite', 'Devant', 'Derrière'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَسَار', name: 'Gauche', instruction: 'Pour indiquer une direction à gauche.', sound: 'Yasār', illustration: '⬅️', mnemonic: 'Opposé de Yamīn (droite)' },
      { type: 'qcm', instruction: 'Que signifie "يَسَار" (Yasār) ?', options: ['Droite', 'Gauche', 'Devant', 'Derrière'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَمَام', name: 'Devant', instruction: 'Pour indiquer ce qui se trouve devant soi.', sound: 'Amām', illustration: '⬆️', mnemonic: 'Utile pour se repérer' },
      { type: 'qcm', instruction: 'Que signifie "أَمَام" (Amām) ?', options: ['Derrière', 'Devant', 'À côté', 'Au-dessus'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 10 (Expressions) terminée ! Se repérer et donner une direction. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْيَوْم', name: 'Aujourd\'hui', instruction: 'Pour parler du jour présent.', sound: 'Al-Yawm', illustration: '📅', mnemonic: 'Même mot que "Yawm" (jour)', rootKey: 'Y-W-M' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْيَوْم" (Al-Yawm) ?', options: ['Hier', 'Aujourd\'hui', 'Demain', 'La semaine'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'غَدًا', name: 'Demain', instruction: 'Pour parler du jour suivant.', sound: 'Ghadan', illustration: '🌅', mnemonic: 'Le jour qui vient' },
      { type: 'qcm', instruction: 'Que signifie "غَدًا" (Ghadan) ?', options: ['Hier', 'Aujourd\'hui', 'Demain', 'Maintenant'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَمْس', name: 'Hier', instruction: 'Pour parler du jour précédent.', sound: 'Ams', illustration: '🌆', mnemonic: 'Le jour qui vient de passer' },
      { type: 'qcm', instruction: 'Que signifie "أَمْس" (Ams) ?', options: ['Demain', 'Aujourd\'hui', 'Hier', 'La semaine dernière'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 11 (Expressions) terminée ! Aujourd\'hui, demain, hier. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'لَا بَأْس', name: 'Pas de problème', instruction: 'Expression rassurante utilisée pour minimiser un souci.', sound: 'Lā Baʼs', illustration: '👌', mnemonic: 'Littéralement "pas de mal"' },
      { type: 'qcm', instruction: 'Que signifie "لَا بَأْس" (Lā Baʼs) ?', options: ['C\'est grave', 'Pas de problème', 'Je ne sais pas', 'Attends'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'تَفَضَّلْ', name: 'Je t\'en prie / Voici', instruction: 'Formule polie pour inviter quelqu\'un à prendre ou entrer, ou pour lui présenter quelque chose.', sound: 'Tafaḍḍal', illustration: '🤲', mnemonic: 'Un geste d\'accueil verbal' },
      { type: 'qcm', instruction: 'Quand utilise-t-on "تَفَضَّلْ" (Tafaḍḍal) ?', options: ['Pour dire au revoir', 'Pour inviter/offrir quelque chose', 'Pour s\'excuser', 'Pour refuser'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'مُمْتَاز', name: 'Excellent', instruction: 'Pour exprimer une forte approbation ou satisfaction.', sound: 'Mumtāz', illustration: '⭐', mnemonic: 'Le compliment par excellence' },
      { type: 'qcm', instruction: 'Que signifie "مُمْتَاز" (Mumtāz) ?', options: ['Médiocre', 'Excellent', 'Ordinaire', 'Mauvais'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 12 (Expressions) terminée ! Tafaḍḍal, Lā Baʼs, Mumtāz. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'أَرْبَعَة', name: 'Quatre', instruction: 'Le quatrième nombre, pour continuer le comptage après trois.', sound: 'Arbaʻa', illustration: '4️⃣', mnemonic: 'Suit directement Thalātha (trois)' },
      { type: 'qcm', instruction: 'Que signifie "أَرْبَعَة" (Arbaʻa) ?', options: ['Deux', 'Trois', 'Quatre', 'Cinq'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'خَمْسَة', name: 'Cinq', instruction: 'Le cinquième nombre, une main entière sur les doigts.', sound: 'Khamsa', illustration: '5️⃣', mnemonic: 'Comme les cinq doigts de la main' },
      { type: 'qcm', instruction: 'Que signifie "خَمْسَة" (Khamsa) ?', options: ['Trois', 'Quatre', 'Cinq', 'Six'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'سِتَّة', name: 'Six', instruction: 'Le sixième nombre, qui poursuit la série après cinq.', sound: 'Sitta', illustration: '6️⃣', mnemonic: 'Une main plus un doigt de l\'autre' },
      { type: 'qcm', instruction: 'Que signifie "سِتَّة" (Sitta) ?', options: ['Quatre', 'Cinq', 'Six', 'Sept'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 13 (Expressions) terminée ! Les nombres 4 à 6. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أُخْت', name: 'Sœur', instruction: 'Le mot pour désigner sa sœur, aussi utilisé entre amies proches.', sound: 'Ukht', illustration: '👧', mnemonic: 'Féminin de "Akh" (frère)' },
      { type: 'qcm', instruction: 'Que signifie "أُخْت" (Ukht) ?', options: ['Frère', 'Sœur', 'Mère', 'Fille'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱبْن', name: 'Fils', instruction: 'Le mot pour désigner son fils.', sound: 'Ibn', illustration: '👶', mnemonic: 'Aussi utilisé dans les noms de famille arabes (ex : Ibn Sīnā)' },
      { type: 'qcm', instruction: 'Que signifie "ٱبْن" (Ibn) ?', options: ['Fille', 'Fils', 'Père', 'Oncle'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱبْنَة', name: 'Fille', instruction: 'Le mot pour désigner sa fille.', sound: 'Ibna', illustration: '👧', mnemonic: 'Féminin de "Ibn" (fils)' },
      { type: 'qcm', instruction: 'Que signifie "ٱبْنَة" (Ibna) ?', options: ['Fils', 'Fille', 'Sœur', 'Mère'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 14 (Expressions) terminée ! Sœur, fils, fille. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'حَارّ', name: 'Chaud', instruction: 'Pour décrire une forte chaleur, du temps ou d\'un plat.', sound: 'Ḥārr', illustration: '🔥', mnemonic: 'Opposé de Bārid (froid)' },
      { type: 'qcm', instruction: 'Que signifie "حَارّ" (Ḥārr) ?', options: ['Froid', 'Chaud', 'Tiède', 'Humide'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'بَارِد', name: 'Froid', instruction: 'Pour décrire une basse température, du temps ou d\'une boisson.', sound: 'Bārid', illustration: '❄️', mnemonic: 'Opposé de Ḥārr (chaud)' },
      { type: 'qcm', instruction: 'Que signifie "بَارِد" (Bārid) ?', options: ['Chaud', 'Froid', 'Doux', 'Sec'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'ٱلطَّقْس جَمِيل', name: 'Il fait beau', instruction: 'Expression courante pour commenter un temps agréable.', sound: 'Aṭ-Ṭaqs Jamīl', illustration: '☀️', mnemonic: 'Littéralement "le temps (est) beau"' },
      { type: 'qcm', instruction: 'Que signifie "ٱلطَّقْس جَمِيل" (Aṭ-Ṭaqs Jamīl) ?', options: ['Il pleut', 'Il fait beau', 'Il fait froid', 'C\'est la nuit'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 15 (Expressions) terminée ! Parler de la météo. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سَعِيد', name: 'Heureux, Content', instruction: 'Pour exprimer la joie ou la satisfaction.', sound: 'Saʻīd', illustration: '😄', mnemonic: 'Opposé de Ḥazīn (triste)' },
      { type: 'qcm', instruction: 'Que signifie "سَعِيد" (Saʻīd) ?', options: ['Triste', 'Heureux, Content', 'Fatigué', 'En colère'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'حَزِين', name: 'Triste', instruction: 'Pour exprimer la tristesse ou la peine.', sound: 'Ḥazīn', illustration: '😢', mnemonic: 'Opposé de Saʻīd (heureux)' },
      { type: 'qcm', instruction: 'Que signifie "حَزِين" (Ḥazīn) ?', options: ['Heureux', 'Triste', 'Surpris', 'Calme'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'مُتْعَب', name: 'Fatigué', instruction: 'Pour exprimer la fatigue physique ou mentale.', sound: 'Mutʻab', illustration: '😴', mnemonic: 'Utile après une longue journée' },
      { type: 'qcm', instruction: 'Que signifie "مُتْعَب" (Mutʻab) ?', options: ['Reposé', 'En forme', 'Fatigué', 'Content'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 16 (Expressions) terminée ! Exprimer ses émotions. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'بِكَمْ هَذَا؟', name: 'Combien ça coûte ?', instruction: 'Question essentielle pour faire ses achats au marché ou en boutique.', sound: 'Bikam Hādhā', illustration: '💰', mnemonic: 'Littéralement "avec combien ceci ?"' },
      { type: 'qcm', instruction: 'Que signifie "بِكَمْ هَذَا؟" (Bikam Hādhā) ?', options: ['Qu\'est-ce que c\'est ?', 'Combien ça coûte ?', 'Où est-ce ?', 'C\'est à qui ?'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'غَالٍ', name: 'Cher', instruction: 'Pour dire qu\'un prix est élevé.', sound: 'Ghālin', illustration: '💸', mnemonic: 'Opposé de Rakhīṣ (bon marché)' },
      { type: 'qcm', instruction: 'Que signifie "غَالٍ" (Ghālin) ?', options: ['Bon marché', 'Cher', 'Gratuit', 'Petit'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'رَخِيص', name: 'Bon marché', instruction: 'Pour dire qu\'un prix est avantageux, peu élevé.', sound: 'Rakhīṣ', illustration: '🏷️', mnemonic: 'Opposé de Ghālin (cher)' },
      { type: 'qcm', instruction: 'Que signifie "رَخِيص" (Rakhīṣ) ?', options: ['Cher', 'Bon marché', 'Introuvable', 'Ancien'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 17 (Expressions) terminée ! Parcours Expressions du Quotidien (3e partie) : au marché. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'أَحْمَر', name: 'Rouge', instruction: 'La couleur rouge, utile pour décrire un objet ou un vêtement.', sound: 'Aḥmar', illustration: '🔴', mnemonic: 'Même racine que "Ḥamrāʼ" (l\'Alhambra, littéralement "la rouge")' },
      { type: 'qcm', instruction: 'Que signifie "أَحْمَر" (Aḥmar) ?', options: ['Bleu', 'Rouge', 'Vert', 'Jaune'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَزْرَق', name: 'Bleu', instruction: 'La couleur bleue, comme le ciel ou la mer.', sound: 'Azraq', illustration: '🔵', mnemonic: 'Pense au ciel (samāʼ) qui est azraq' },
      { type: 'qcm', instruction: 'Que signifie "أَزْرَق" (Azraq) ?', options: ['Rouge', 'Vert', 'Bleu', 'Noir'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَخْضَر', name: 'Vert', instruction: 'La couleur verte, comme les plantes ou le drapeau de nombreux pays musulmans.', sound: 'Akhḍar', illustration: '🟢', mnemonic: 'Même racine que "Khaḍra" (verdure)' },
      { type: 'qcm', instruction: 'Que signifie "أَخْضَر" (Akhḍar) ?', options: ['Jaune', 'Rouge', 'Bleu', 'Vert'], correctIndex: 3, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 18 (Expressions) terminée ! Les couleurs : rouge, bleu, vert. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'أَسْوَد', name: 'Noir', instruction: 'La couleur noire, la plus foncée de toutes.', sound: 'Aswad', illustration: '⚫', mnemonic: 'Opposé de Abyaḍ (blanc)' },
      { type: 'qcm', instruction: 'Que signifie "أَسْوَد" (Aswad) ?', options: ['Blanc', 'Noir', 'Gris', 'Doré'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَبْيَض', name: 'Blanc', instruction: 'La couleur blanche, la plus claire de toutes.', sound: 'Abyaḍ', illustration: '⚪', mnemonic: 'Opposé de Aswad (noir)' },
      { type: 'qcm', instruction: 'Que signifie "أَبْيَض" (Abyaḍ) ?', options: ['Noir', 'Blanc', 'Gris', 'Jaune'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَصْفَر', name: 'Jaune', instruction: 'La couleur jaune, comme le soleil.', sound: 'Aṣfar', illustration: '🟡', mnemonic: 'Même racine que "Ṣufra" (teinte jaune)' },
      { type: 'qcm', instruction: 'Que signifie "أَصْفَر" (Aṣfar) ?', options: ['Vert', 'Bleu', 'Jaune', 'Rouge'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 19 (Expressions) terminée ! Les couleurs : noir, blanc, jaune. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'يَذْهَب', name: 'Il va (Aller)', instruction: 'Le verbe pour indiquer un déplacement vers un lieu.', sound: 'Yadhhab', illustration: '🚶', mnemonic: 'Même racine que "Dhahāb" (aller, départ)' },
      { type: 'qcm', instruction: 'Que signifie "يَذْهَب" (Yadhhab) ?', options: ['Il vient', 'Il va', 'Il reste', 'Il dort'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَأْتِي', name: 'Il vient (Venir)', instruction: 'Le verbe pour indiquer un déplacement vers le locuteur.', sound: 'Yaʼtī', illustration: '🚶‍♂️', mnemonic: 'Opposé de Yadhhab (aller)' },
      { type: 'qcm', instruction: 'Que signifie "يَأْتِي" (Yaʼtī) ?', options: ['Il part', 'Il va', 'Il vient', 'Il attend'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَأْكُل', name: 'Il mange (Manger)', instruction: 'Le verbe le plus courant pour parler de nourriture.', sound: 'Yaʼkul', illustration: '🍽️', mnemonic: 'Même racine que "Akl" (nourriture)' },
      { type: 'qcm', instruction: 'Que signifie "يَأْكُل" (Yaʼkul) ?', options: ['Il boit', 'Il mange', 'Il dort', 'Il cuisine'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 20 (Expressions) terminée ! Les verbes : aller, venir, manger. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'يَشْرَب', name: 'Il boit (Boire)', instruction: 'Le verbe pour parler de toute boisson.', sound: 'Yashrab', illustration: '🥤', mnemonic: 'Même racine que "Sharāb" (boisson)' },
      { type: 'qcm', instruction: 'Que signifie "يَشْرَب" (Yashrab) ?', options: ['Il mange', 'Il boit', 'Il parle', 'Il écoute'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَنَام', name: 'Il dort (Dormir)', instruction: 'Le verbe pour indiquer le sommeil.', sound: 'Yanām', illustration: '😴', mnemonic: 'Même racine que "Nawm" (sommeil)' },
      { type: 'qcm', instruction: 'Que signifie "يَنَام" (Yanām) ?', options: ['Il se réveille', 'Il dort', 'Il court', 'Il travaille'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'يَعْمَل', name: 'Il travaille (Travailler)', instruction: 'Le verbe pour parler d\'une activité professionnelle ou d\'une action en général.', sound: 'Yaʻmal', illustration: '💼', mnemonic: 'Même racine que "ʻAmal" (travail, action)' },
      { type: 'qcm', instruction: 'Que signifie "يَعْمَل" (Yaʻmal) ?', options: ['Il se repose', 'Il joue', 'Il travaille', 'Il voyage'], correctIndex: 2, textStyle: 'text-2xl' },
      { type: 'success', instruction: 'Leçon 21 (Expressions) terminée ! Les verbes : boire, dormir, travailler. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلْمَطَار', name: 'L\'aéroport', instruction: 'Le lieu essentiel pour tout voyage en avion.', sound: 'Al-Maṭār', illustration: '✈️', mnemonic: 'Même racine que "Ṭayara" (voler)' },
      { type: 'qcm', instruction: 'Que signifie "ٱلْمَطَار" (Al-Maṭār) ?', options: ['La gare', 'L\'aéroport', 'Le port', 'L\'hôtel'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'تَذْكِرَة', name: 'Billet', instruction: 'Le document nécessaire pour prendre un transport.', sound: 'Tadhkira', illustration: '🎫', mnemonic: 'Même racine que "Dhikr" (mention, rappel)' },
      { type: 'qcm', instruction: 'Que signifie "تَذْكِرَة" (Tadhkira) ?', options: ['Passeport', 'Billet', 'Valise', 'Carte'], correctIndex: 1, textStyle: 'text-2xl' },
      { type: 'intro', letter: 'أَيْنَ ٱلْمَحَطَّة؟', name: 'Où est la gare ?', instruction: 'Question essentielle pour s\'orienter en voyage.', sound: 'Ayna al-Maḥaṭṭa', illustration: '🚉', mnemonic: 'Combine "Ayna" (où) et "Maḥaṭṭa" (gare, station)' },
      { type: 'qcm', instruction: 'Que signifie "أَيْنَ ٱلْمَحَطَّة؟" (Ayna al-Maḥaṭṭa) ?', options: ['Quelle heure est-il ?', 'Où est la gare ?', 'Combien ça coûte ?', 'Où est l\'hôtel ?'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 22 (Expressions) terminée ! Parcours Expressions du Quotidien (4e partie) : en voyage. +20 XP' }
    ]
  ];

  const calligraphyLessons = [
    [
      { type: 'intro', letter: 'ب', name: 'Bāʼ : les 4 formes', instruction: 'Chaque lettre arabe change de forme selon sa position dans le mot. Le Bāʼ isolé (ب) devient بـ en début de mot, ـبـ au milieu, et ـب à la fin.', sound: 'Bāʼ', illustration: '🔤', mnemonic: 'بَيْت (Bayt - Maison) : le Bāʼ y est en position initiale (بـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Bāʼ" en DÉBUT de mot ?', options: ['ـب', 'بـ', 'ـبـ', 'ب'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ت', name: 'Tāʼ : les 4 formes', instruction: 'Le Tāʼ isolé (ت) devient تـ en début de mot, ـتـ au milieu, et ـت à la fin. Les deux points restent toujours au-dessus, quelle que soit la forme.', sound: 'Tāʼ', illustration: '🔤', mnemonic: 'تَمْر (Tamr - Datte) : le Tāʼ y est en position initiale (تـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Tāʼ" au MILIEU d\'un mot ?', options: ['ت', 'تـ', 'ـتـ', 'ـت'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 1 (Calligraphie) terminée ! Bāʼ et Tāʼ : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ج', name: 'Jīm : les 4 formes', instruction: 'Le Jīm isolé (ج) devient جـ en début de mot, ـجـ au milieu, et ـج à la fin. Le point reste toujours sous la boucle.', sound: 'Jīm', illustration: '🔤', mnemonic: 'جَمَل (Jamal - Chameau) : le Jīm y est en position initiale (جـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Jīm" en FIN de mot ?', options: ['ج', 'جـ', 'ـجـ', 'ـج'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ح', name: 'Ḥāʼ : les 4 formes', instruction: 'Le Ḥāʼ isolé (ح) devient حـ en début de mot, ـحـ au milieu, et ـح à la fin. Sans aucun point, à toutes ses formes.', sound: 'Ḥāʼ', illustration: '🔤', mnemonic: 'حِصَان (Ḥiṣān - Cheval) : le Ḥāʼ y est en position initiale (حـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme isolée du "Ḥāʼ" ?', options: ['حـ', 'ـحـ', 'ح', 'ـح'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 2 (Calligraphie) terminée ! Jīm et Ḥāʼ : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'س', name: 'Sīn : les 4 formes', instruction: 'Le Sīn isolé (س) devient سـ en début de mot, ـسـ au milieu, et ـس à la fin. Les "trois dents" ne se voient bien que dans la forme isolée ou finale.', sound: 'Sīn', illustration: '🔤', mnemonic: 'سَمَكَة (Samaka - Poisson) : le Sīn y est en position initiale (سـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Sīn" au MILIEU d\'un mot ?', options: ['س', 'سـ', 'ـسـ', 'ـس'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ش', name: 'Shīn : les 4 formes', instruction: 'Le Shīn suit exactement le même tracé que le Sīn, avec trois points ajoutés au-dessus : شـ, ـشـ, ـش.', sound: 'Shīn', illustration: '🔤', mnemonic: 'شَمْس (Shams - Soleil) : le Shīn y est en position initiale (شـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Shīn" en DÉBUT de mot ?', options: ['ـش', 'شـ', 'ـشـ', 'ش'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 3 (Calligraphie) terminée ! Sīn et Shīn : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ع', name: 'ʿAyn : les 4 formes', instruction: 'Le ʿAyn isolé (ع) devient عـ en début de mot, ـعـ au milieu, et ـع à la fin. Sa forme change beaucoup plus que les autres lettres selon la position.', sound: 'ʿAyn', illustration: '🔤', mnemonic: 'عَيْن (ʿAyn - Œil) : le ʿAyn y est en position initiale (عـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "ʿAyn" en FIN de mot ?', options: ['عـ', 'ـعـ', 'ع', 'ـع'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ف', name: 'Fāʼ : les 4 formes', instruction: 'Le Fāʼ isolé (ف) devient فـ en début de mot, ـفـ au milieu, et ـف à la fin. Le point reste toujours au-dessus.', sound: 'Fāʼ', illustration: '🔤', mnemonic: 'فِيل (Fīl - Éléphant) : le Fāʼ y est en position initiale (فـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme isolée du "Fāʼ" ?', options: ['فـ', 'ـفـ', 'ـف', 'ف'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 4 (Calligraphie) terminée ! ʿAyn et Fāʼ : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ك', name: 'Kāf : les 4 formes', instruction: 'Le Kāf isolé (ك) devient كـ en début de mot, ـكـ au milieu, et ـك à la fin. La petite hampe interne disparaît souvent en position initiale.', sound: 'Kāf', illustration: '🔤', mnemonic: 'كَلْب (Kalb - Chien) : le Kāf y est en position initiale (كـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Kāf" au MILIEU d\'un mot ?', options: ['ك', 'كـ', 'ـكـ', 'ـك'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'م', name: 'Mīm : les 4 formes', instruction: 'Le Mīm isolé (م) devient مـ en début de mot, ـمـ au milieu, et ـم à la fin. Toujours ce petit cercle plein, plus ou moins étiré.', sound: 'Mīm', illustration: '🔤', mnemonic: 'مَاء (Māʼ - Eau) : le Mīm y est en position initiale (مـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Mīm" en FIN de mot ?', options: ['م', 'مـ', 'ـمـ', 'ـم'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 5 (Calligraphie) terminée ! Kāf et Mīm : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ا د ذ ر ز و', name: 'Les lettres non-connectrices', instruction: 'Six lettres ne se lient JAMAIS à la lettre suivante : ا (Alif), د (Dāl), ذ (Dhāl), ر (Rāʼ), ز (Zāy), و (Wāw). Elles n\'ont que 2 formes : isolée et finale, identiques.', sound: 'Alif, Dāl, Dhāl, Rāʼ, Zāy, Wāw', illustration: '🔗', mnemonic: 'Elles "cassent" toujours la liaison avec la lettre d\'après' },
      { type: 'qcm', instruction: 'Laquelle de ces lettres NE se lie PAS à la lettre suivante ?', options: ['ب', 'د', 'س', 'م'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'دَار', name: 'Exemple : Dār (maison)', instruction: 'Dans دَار (Dār), le Dāl garde sa forme isolée bien qu\'il ne soit pas en fin de mot : c\'est une lettre non-connectrice, elle ne se lie jamais à la lettre suivante (ici le Alif).', sound: 'Dār', illustration: '🏠', mnemonic: 'Après un Dāl, la lettre suivante recommence "détachée"' },
      { type: 'qcm', instruction: 'Pourquoi le Dāl de "دَار" garde-t-il sa forme isolée au milieu du mot ?', options: ['C\'est une erreur d\'écriture', 'Parce que Dāl est une lettre non-connectrice', 'Parce que Dāl est toujours en fin de mot', 'Parce que Dāl n\'a pas de point'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 6 (Calligraphie) terminée ! Vous connaissez les 6 lettres qui ne se lient jamais à la suivante (ا د ذ ر ز و). +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ث', name: 'Thāʼ : les 4 formes', instruction: 'Le Thāʼ isolé (ث) devient ثـ en début de mot, ـثـ au milieu, et ـث à la fin. Il suit exactement le tracé du Tāʼ, avec un point de plus (trois au lieu de deux).', sound: 'Thāʼ', illustration: '🔤', mnemonic: 'ثَعْلَب (Thaʻlab - Renard) : le Thāʼ y est en position initiale (ثـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Thāʼ" au MILIEU d\'un mot ?', options: ['ث', 'ثـ', 'ـثـ', 'ـث'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'خ', name: 'Khāʼ : les 4 formes', instruction: 'Le Khāʼ isolé (خ) devient خـ en début de mot, ـخـ au milieu, et ـخ à la fin. Même tracé que le Ḥāʼ, avec un point ajouté au-dessus.', sound: 'Khāʼ', illustration: '🔤', mnemonic: 'خُبْز (Khubz - Pain) : le Khāʼ y est en position initiale (خـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Khāʼ" en FIN de mot ?', options: ['خ', 'خـ', 'ـخـ', 'ـخ'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 7 (Calligraphie) terminée ! Thāʼ et Khāʼ : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ص', name: 'Ṣād : les 4 formes', instruction: 'Le Ṣād isolé (ص) devient صـ en début de mot, ـصـ au milieu, et ـص à la fin. La boucle emphatique reste bien visible à toutes les formes.', sound: 'Ṣād', illustration: '🔤', mnemonic: 'صَابُون (Ṣābūn - Savon) : le Ṣād y est en position initiale (صـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Ṣād" en DÉBUT de mot ?', options: ['ـص', 'صـ', 'ـصـ', 'ص'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ض', name: 'Ḍād : les 4 formes', instruction: 'Le Ḍād isolé (ض) devient ضـ en début de mot, ـضـ au milieu, et ـض à la fin. Même tracé que le Ṣād, avec un point ajouté au-dessus.', sound: 'Ḍād', illustration: '🔤', mnemonic: 'ضِفْدَع (Ḍifdaʻ - Grenouille) : le Ḍād y est en position initiale (ضـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Ḍād" au MILIEU d\'un mot ?', options: ['ض', 'ضـ', 'ـضـ', 'ـض'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 8 (Calligraphie) terminée ! Ṣād et Ḍād : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ط', name: 'Ṭāʼ : les 4 formes', instruction: 'Le Ṭāʼ isolé (ط) devient طـ en début de mot, ـطـ au milieu, et ـط à la fin. La hampe verticale raccourcit souvent en position initiale ou médiane.', sound: 'Ṭāʼ', illustration: '🔤', mnemonic: 'طَائِر (Ṭāʼir - Oiseau) : le Ṭāʼ y est en position initiale (طـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme isolée du "Ṭāʼ" ?', options: ['طـ', 'ـطـ', 'ط', 'ـط'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ظ', name: 'Ẓāʼ : les 4 formes', instruction: 'Le Ẓāʼ isolé (ظ) devient ظـ en début de mot, ـظـ au milieu, et ـظ à la fin. Même tracé que le Ṭāʼ, avec un point ajouté au-dessus.', sound: 'Ẓāʼ', illustration: '🔤', mnemonic: 'ظُهْر (Ẓuhr - Midi) : le Ẓāʼ y est en position initiale (ظـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Ẓāʼ" en FIN de mot ?', options: ['ظ', 'ظـ', 'ـظـ', 'ـظ'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 9 (Calligraphie) terminée ! Ṭāʼ et Ẓāʼ : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'غ', name: 'Ghayn : les 4 formes', instruction: 'Le Ghayn isolé (غ) devient غـ en début de mot, ـغـ au milieu, et ـغ à la fin. Même tracé que le ʿAyn, avec un point ajouté au-dessus.', sound: 'Ghayn', illustration: '🔤', mnemonic: 'غُرَاب (Ghurāb - Corbeau) : le Ghayn y est en position initiale (غـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Ghayn" au MILIEU d\'un mot ?', options: ['غ', 'غـ', 'ـغـ', 'ـغ'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ق', name: 'Qāf : les 4 formes', instruction: 'Le Qāf isolé (ق) devient قـ en début de mot, ـقـ au milieu, et ـق à la fin. Les deux points restent toujours au-dessus.', sound: 'Qāf', illustration: '🔤', mnemonic: 'قَمَر (Qamar - Lune) : le Qāf y est en position initiale (قـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Qāf" en DÉBUT de mot ?', options: ['ـق', 'قـ', 'ـقـ', 'ق'], correctIndex: 1, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 10 (Calligraphie) terminée ! Ghayn et Qāf : leurs 4 formes maîtrisées. 20 lettres explorées sur 28. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'ل', name: 'Lām : les 4 formes', instruction: 'Le Lām isolé (ل) devient لـ en début de mot, ـلـ au milieu, et ـل à la fin. Sa hampe verticale reste bien visible à toutes les formes.', sound: 'Lām', illustration: '🔤', mnemonic: 'لَيْث (Layth - Lion) : le Lām y est en position initiale (لـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Lām" en FIN de mot ?', options: ['ل', 'لـ', 'ـلـ', 'ـل'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ن', name: 'Nūn : les 4 formes', instruction: 'Le Nūn isolé (ن) devient نـ en début de mot, ـنـ au milieu, et ـن à la fin. Le point reste toujours au-dessus, comme pour le Bāʼ.', sound: 'Nūn', illustration: '🔤', mnemonic: 'نَحْلَة (Naḥla - Abeille) : le Nūn y est en position initiale (نـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Nūn" au MILIEU d\'un mot ?', options: ['ن', 'نـ', 'ـنـ', 'ـن'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 11 (Calligraphie) terminée ! Lām et Nūn : leurs 4 formes maîtrisées. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ه', name: 'Hāʼ : les 4 formes', instruction: 'Le Hāʼ isolé (ه) devient هـ en début de mot, ـهـ au milieu, et ـه à la fin. C\'est l\'une des lettres qui change le plus visuellement selon sa position.', sound: 'Hāʼ', illustration: '🔤', mnemonic: 'هِلَال (Hilāl - Croissant de lune) : le Hāʼ y est en position initiale (هـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme isolée du "Hāʼ" ?', options: ['هـ', 'ـهـ', 'ه', 'ـه'], correctIndex: 2, textStyle: 'text-5xl' },
      { type: 'intro', letter: 'ي', name: 'Yāʼ : les 4 formes', instruction: 'Le Yāʼ isolé (ي) devient يـ en début de mot, ـيـ au milieu, et ـي à la fin. Les deux points en dessous disparaissent souvent en position initiale ou médiane.', sound: 'Yāʼ', illustration: '🔤', mnemonic: 'يَد (Yad - Main) : le Yāʼ y est en position initiale (يـ)' },
      { type: 'qcm', instruction: 'Quelle est la forme du "Yāʼ" en FIN de mot ?', options: ['ي', 'يـ', 'ـيـ', 'ـي'], correctIndex: 3, textStyle: 'text-5xl' },
      { type: 'success', instruction: 'Leçon 12 (Calligraphie) terminée ! Hāʼ et Yāʼ : leurs 4 formes maîtrisées. Les 28 lettres de l\'alphabet arabe sont désormais toutes explorées ! +20 XP' }
    ],
    [
      { type: 'intro', letter: 'بَيْت', name: 'Liaison : Bayt (Maison)', instruction: 'Assemblons trois lettres liées en un mot complet : بـ (Bāʼ initiale) + ـيـ (Yāʼ médiane) + ـت (Tāʼ finale) donne بَيْت, "maison". Le stylo ne se lève jamais entre les trois lettres.', sound: 'Bayt', illustration: '🏠', mnemonic: 'Trois formes liées, un seul geste continu' },
      { type: 'trace', letter: 'بَيْت', instruction: 'Tracez "بَيْت" (Bayt) en liant bien les trois lettres, sans lever le stylo.' },
      { type: 'qcm', instruction: 'Dans "بَيْت", sous quelle forme apparaît le Yāʼ ?', options: ['Isolée', 'Initiale', 'Médiane', 'Finale'], correctIndex: 2, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 13 (Calligraphie) terminée ! Vous savez lier Bāʼ, Yāʼ et Tāʼ dans بَيْت (Bayt). +15 XP' }
    ],
    [
      { type: 'intro', letter: 'كِتَاب', name: 'Liaison : Kitāb (Livre)', instruction: 'Dans كِتَاب : ك (initiale) + ـتـ (médiane) + ا (finale, car l\'Alif reçoit la liaison) + ب. Le Bāʼ final apparaît ISOLÉ (ب), pas lié (ـب), car l\'Alif qui précède ne se lie JAMAIS vers l\'avant.', sound: 'Kitāb', illustration: '📖', mnemonic: 'Une lettre non-connectrice "casse" toujours la chaîne suivante' },
      { type: 'trace', letter: 'كِتَاب', instruction: 'Tracez "كِتَاب" (Kitāb), en observant bien le Bāʼ final isolé après l\'Alif.' },
      { type: 'qcm', instruction: 'Dans "كِتَاب", pourquoi le Bāʼ final apparaît-il ISOLÉ (ب) et non lié (ـب) ?', options: ['Parce que l\'Alif qui précède ne se lie jamais vers l\'avant', 'C\'est une erreur d\'écriture', 'Parce que Bāʼ est toujours isolé', 'Parce que Kitāb est un mot court'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 14 (Calligraphie) terminée ! Vous comprenez l\'effet d\'une lettre non-connectrice dans كِتَاب (Kitāb). +15 XP' }
    ],
    [
      { type: 'intro', letter: 'مُحَمَّد', name: 'Liaison : Muḥammad', instruction: 'Dans مُحَمَّد : م (initiale) + ح (médiane) + مّ (médiane, doublée par la Shadda) + د (finale). Le Dāl final ne change pas de forme : c\'est une lettre non-connectrice, sa forme finale est identique à sa forme isolée.', sound: 'Muḥammad', illustration: '🕌', mnemonic: 'Le Mīm apparaît deux fois, lié aux lettres voisines' },
      { type: 'trace', letter: 'مُحَمَّد', instruction: 'Tracez "مُحَمَّد" (Muḥammad), en liant les quatre lettres.' },
      { type: 'qcm', instruction: 'Combien de fois la lettre Mīm (م) apparaît-elle dans "مُحَمَّد" ?', options: ['Une fois', 'Deux fois', 'Trois fois', 'Quatre fois'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 15 (Calligraphie) terminée ! Vous savez lier les quatre lettres de مُحَمَّد (Muḥammad). +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سَلَام', name: 'Liaison : Salām (Paix)', instruction: 'Dans سَلَام : س (initiale) + ل (médiane) + ا (finale, l\'Alif reçoit la liaison du Lām) + م. Comme dans كِتَاب, le Mīm final apparaît ISOLÉ car l\'Alif ne transmet aucune liaison vers l\'avant.', sound: 'Salām', illustration: '☮️', mnemonic: 'Même logique que Kitāb : Alif casse la chaîne' },
      { type: 'trace', letter: 'سَلَام', instruction: 'Tracez "سَلَام" (Salām), en observant le Mīm final isolé.' },
      { type: 'qcm', instruction: 'Pourquoi le Mīm final de "سَلَام" est-il isolé, comme le Bāʼ dans "كِتَاب" ?', options: ['Parce qu\'il suit un Alif, lettre non-connectrice', 'Parce que Mīm ne se lie jamais', 'Parce que c\'est un nom divin', 'Parce que le mot est court'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 16 (Calligraphie) terminée ! Vous maîtrisez la liaison des lettres dans des mots complets : بَيْت, كِتَاب, مُحَمَّد, سَلَام. +20 XP' }
    ],
    [
      { type: 'intro', letter: 'رَجُل', name: 'Liaison : Rajul (Homme)', instruction: 'Nouvelle règle : quand un mot COMMENCE par une lettre non-connectrice, la lettre suivante repart "à zéro". Dans رَجُل : ر (isolée, 1ère lettre) puis جـ prend quand même sa forme INITIALE, comme si le mot recommençait après elle.', sound: 'Rajul', illustration: '🧑', mnemonic: 'Le Rāʼ initial ne transmet rien au Jīm qui suit' },
      { type: 'trace', letter: 'رَجُل', instruction: 'Tracez "رَجُل" (Rajul), en observant le petit espace après le Rāʼ.' },
      { type: 'qcm', instruction: 'Dans "رَجُل", sous quelle forme apparaît le Jīm (2e lettre) ?', options: ['Isolée', 'Initiale', 'Médiane', 'Finale'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'دِين', name: 'Liaison : Dīn (Religion)', instruction: 'Même logique dans دِين : د (isolée, 1ère lettre, non-connectrice) puis يـ prend sa forme INITIALE, et ن prend sa forme finale car reliée au Yāʼ.', sound: 'Dīn', illustration: '☪️', mnemonic: 'Le Dāl initial ne transmet rien au Yāʼ qui suit' },
      { type: 'trace', letter: 'دِين', instruction: 'Tracez "دِين" (Dīn), en observant le petit espace après le Dāl.' },
      { type: 'qcm', instruction: 'Pourquoi le Yāʼ de "دِين" prend-il sa forme initiale et non médiane ?', options: ['Le Dāl qui précède ne transmet aucune liaison', 'Le Yāʼ ne se lie jamais', 'C\'est la dernière lettre', 'C\'est une erreur'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 17 (Calligraphie) terminée ! Vous savez ce qui se passe quand un mot commence par une lettre non-connectrice. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'وَلَد', name: 'Liaison : Walad (Garçon)', instruction: 'Encore la même règle dans وَلَد : و (isolé, 1ère lettre non-connectrice) puis لـ prend sa forme INITIALE, et د garde sa forme habituelle (isolée = finale pour cette lettre non-connectrice).', sound: 'Walad', illustration: '👦', mnemonic: 'Le Wāw initial ne transmet rien au Lām qui suit' },
      { type: 'trace', letter: 'وَلَد', instruction: 'Tracez "وَلَد" (Walad), en observant le petit espace après le Wāw.' },
      { type: 'qcm', instruction: 'Dans "وَلَد", sous quelle forme apparaît le Lām (2e lettre) ?', options: ['Isolée', 'Initiale', 'Médiane', 'Finale'], correctIndex: 1, textStyle: 'text-lg' },
      { type: 'intro', letter: 'ذَهَب', name: 'Liaison : Dhahab (Or)', instruction: 'Dernier exemple de la règle dans ذَهَب : ذ (isolé, 1ère lettre non-connectrice) puis هـ prend sa forme INITIALE, et ب prend sa forme finale car reliée au Hāʼ.', sound: 'Dhahab', illustration: '🪙', mnemonic: 'Le Dhāl initial ne transmet rien au Hāʼ qui suit' },
      { type: 'trace', letter: 'ذَهَب', instruction: 'Tracez "ذَهَب" (Dhahab), en observant le petit espace après le Dhāl.' },
      { type: 'qcm', instruction: 'Pourquoi le Bāʼ de "ذَهَب" est-il en forme finale (ـب) ?', options: ['Il est relié au Hāʼ qui le précède', 'Il ne se lie jamais', 'C\'est la première lettre', 'Le Dhāl le relie directement'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 18 (Calligraphie) terminée ! Rajul, Dīn, Walad, Dhahab : la règle des mots commençant par une non-connectrice est acquise. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'جَمِيل', name: 'Liaison : Jamīl (Beau)', instruction: 'Un mot entièrement lié, sans aucune coupure : جـ (initiale) + ـمـ (médiane) + ـيـ (médiane) + ل (finale). Les quatre lettres s\'enchaînent en un seul geste.', sound: 'Jamīl', illustration: '🌺', mnemonic: 'Jīm, Mīm, Yāʼ, Lām : toutes connectrices' },
      { type: 'trace', letter: 'جَمِيل', instruction: 'Tracez "جَمِيل" (Jamīl) en un seul geste continu, sans lever le stylo.' },
      { type: 'qcm', instruction: 'Combien de "coupures" (lettres non-connectrices) y a-t-il dans "جَمِيل" ?', options: ['Aucune', 'Une', 'Deux', 'Trois'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'قَلَم', name: 'Liaison : Qalam (Stylo)', instruction: 'Autre mot entièrement lié : قـ (initiale) + ـلـ (médiane) + م (finale). Un mot court et fluide, parfait pour s\'entraîner à la liaison rapide.', sound: 'Qalam', illustration: '🖊️', mnemonic: 'Qāf, Lām, Mīm : toutes connectrices' },
      { type: 'trace', letter: 'قَلَم', instruction: 'Tracez "قَلَم" (Qalam) en un seul geste continu.' },
      { type: 'qcm', instruction: 'Dans "قَلَم", sous quelle forme apparaît le Mīm final ?', options: ['Isolée', 'Initiale', 'Médiane', 'Finale'], correctIndex: 3, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 19 (Calligraphie) terminée ! Jamīl et Qalam : deux mots entièrement liés, sans coupure. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'سُبْحَان', name: 'Liaison : Subḥān', instruction: 'Dans سُبْحَان (comme dans "SubḥanAllāh") : سـ + ـبـ + ـحـ + ا (l\'Alif reçoit la liaison du Ḥāʼ) + ن. Comme dans كِتَاب, le Nūn final est ISOLÉ car l\'Alif ne transmet rien vers l\'avant.', sound: 'Subḥān', illustration: '🤲', mnemonic: 'Encore la règle de l\'Alif qui casse la chaîne' },
      { type: 'trace', letter: 'سُبْحَان', instruction: 'Tracez "سُبْحَان" (Subḥān), en observant le Nūn final isolé après l\'Alif.' },
      { type: 'qcm', instruction: 'Pourquoi le Nūn final de "سُبْحَان" est-il isolé ?', options: ['Il suit un Alif, lettre non-connectrice', 'Le Nūn ne se lie jamais', 'C\'est un mot religieux', 'Erreur d\'écriture'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'intro', letter: 'نُور', name: 'Liaison : Nūr (Lumière)', instruction: 'Dans نُور : نـ (initiale) + و (le Wāw reçoit la liaison du Nūn, donc forme finale) + ر (isolée, car le Wāw, non-connecteur, ne transmet rien vers l\'avant). Deux non-connecteurs qui s\'enchaînent !', sound: 'Nūr', illustration: '💡', mnemonic: 'Wāw et Rāʼ sont tous deux non-connecteurs' },
      { type: 'trace', letter: 'نُور', instruction: 'Tracez "نُور" (Nūr), en observant les deux "coupures" successives.' },
      { type: 'qcm', instruction: 'Pourquoi le Rāʼ final de "نُور" est-il isolé ?', options: ['Le Wāw qui précède ne transmet rien (non-connecteur)', 'Le Rāʼ est toujours lié', 'C\'est la première lettre', 'Erreur d\'écriture'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 20 (Calligraphie) terminée ! Subḥān et Nūr : vous reconnaissez les chaînes de lettres non-connectrices. +15 XP' }
    ],
    [
      { type: 'intro', letter: 'ٱلسَّلَام', name: 'Synthèse : As-Salām', instruction: 'Synthèse finale : ٱ (Hamzat al-Waṣl, isolée) + لّ (Lām assimilé en Shadda sur le Sīn, lettre solaire) + سّـ + ـلـ + ا (finale) + م (isolé, car l\'Alif ne transmet rien). Ce mot combine liaison, Shadda et lettre solaire !', sound: 'As-Salām', illustration: '☮️', mnemonic: 'Le résumé parfait de tout ce que vous avez appris' },
      { type: 'trace', letter: 'ٱلسَّلَام', instruction: 'Tracez "ٱلسَّلَام" (As-Salām) en appliquant tout ce que vous avez appris sur la liaison.' },
      { type: 'qcm', instruction: 'Dans "ٱلسَّلَام", pourquoi le Mīm final est-il isolé ?', options: ['Il suit un Alif, non-connecteur', 'C\'est un nom divin', 'Le Mīm ne se lie jamais', 'Erreur d\'écriture'], correctIndex: 0, textStyle: 'text-lg' },
      { type: 'success', instruction: 'Leçon 21 (Calligraphie) terminée ! Avec ٱلسَّلَام, vous combinez liaison, Shadda et lettre solaire : la calligraphie arabe n\'a plus de secret pour vous. +25 XP' }
    ]
  ];

  // Associe chaque module à son tableau de leçons, pour l'écran de liste
  // des leçons et l'aperçu en lecture seule (sans lancer l'exercice).
  const moduleLessonsMap = { 1: qaidaLessons, 2: quranLessons, 3: freqVocabLessons, 4: rootsLessons, 5: tajwidLessons, 6: asmaLessons, 7: expressionsLessons, 8: calligraphyLessons };

  // Construit le paquet de cartes de révision à partir de ce que l'élève a
  // réellement étudié (leçons dont l'index < progression du module), plutôt
  // que d'un jeu de 3 cartes fixes. Le paquet grandit donc au fil des leçons
  // terminées, comme dans un vrai système de répétition espacée.
  const buildRevisionDeck = () => {
    const progressOf = (id) => modules.find(m => m.id === id)?.progress ?? 0;
    const cards = [];

    qaidaLessons.slice(0, progressOf(1)).forEach((lesson, li) => {
      lesson.forEach((step, si) => {
        if (step.type === 'intro') {
          cards.push({ id: `qaida-${li}-${si}`, front: step.letter, back: step.name, hint: 'Qaïda' });
        }
      });
    });

    freqVocabLessons.slice(0, progressOf(3)).forEach((lesson, li) => {
      lesson.forEach((step, si) => {
        if (step.type === 'intro') {
          cards.push({ id: `freq-${li}-${si}`, front: step.letter, back: `${step.name} (${step.sound})`, hint: 'Fréquence Lexicale' });
        }
      });
    });

    rootsLessons.slice(0, progressOf(4)).forEach((lesson) => {
      lesson.forEach((step) => {
        if (step.type === 'intro' && step.rootKey && rootsDatabase[step.rootKey]) {
          cards.push({ id: `root-${step.rootKey}`, front: step.letter, back: rootsDatabase[step.rootKey].trans, hint: 'Racines' });
        }
      });
    });

    tajwidLessons.slice(0, progressOf(5)).forEach((lesson, li) => {
      lesson.forEach((step, si) => {
        if (step.type === 'intro') {
          cards.push({ id: `tajwid-${li}-${si}`, front: step.letter, back: step.name, hint: 'Tajwid' });
        }
      });
    });

    const seen = new Set();
    return cards.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  };

  // Algorithme de répétition espacée simplifié (inspiré de SM-2) : "À revoir"
  // remet la carte à demain et réduit la facilité, "Correct"/"Facile"
  // espacent progressivement le prochain rappel.
  const scheduleSrsCard = (prevState, quality) => {
    let { interval = 0, ease = 2.5, reps = 0 } = prevState || {};
    if (quality === 'hard') {
      reps = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    } else {
      reps += 1;
      if (quality === 'easy') ease = Math.min(3, ease + 0.15);
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = quality === 'easy' ? 4 : 3;
      else interval = Math.round(interval * ease);
    }
    const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
    return { interval, ease, reps, dueDate, lastQuality: quality, lastReview: new Date().toISOString() };
  };

  // Extrait les éléments à afficher dans l'aperçu d'une leçon (lettres,
  // mots ou versets), sans dépendre de la logique interactive du quiz.
  const getLessonPreviewItems = (lessonSteps) => {
    const items = [];
    (lessonSteps || []).forEach((step, i) => {
      if (step.type === 'intro') {
        items.push({ key: `${i}`, main: step.letter, sub: step.name });
      } else if (step.type === 'reading' && step.words) {
        step.words.forEach((w) => items.push({ key: w.id, main: w.text, sub: w.trans }));
      }
    });
    return items;
  };

  const startLesson = (moduleId, lessonIndex) => {
    const lessons = moduleLessonsMap[moduleId] || [];
    setActiveModuleId(moduleId);
    setActiveLesson(lessons[lessonIndex]);
    resetLessonStates();
    setCurrentScreen('lesson');
  };

  const openLessonPreview = (moduleId, lessonIndex) => {
    setPreviewLesson({ moduleId, lessonIndex });
    setCurrentScreen('lessonPreview');
  };

  const streakData = [
    { date: 'Août 10', status: 'fire' },
    { date: 'Août 11', status: 'fire' },
    { date: 'Août 12', status: 'missed' },
    { date: 'Août 13', status: 'fire' },
    { date: 'Août 14', status: 'current' },
    { date: 'Août 15', status: 'future' },
  ];

  useEffect(() => {
    let interval = null;
    if (currentScreen === 'survival' && survivalPhase === 'playing' && survivalTime > 0) {
      interval = setInterval(() => {
        setSurvivalTime(time => time - 1);
      }, 1000);
    } else if (survivalTime <= 0 && survivalPhase === 'playing') {
      setSurvivalPhase('gameover');
      setUserXp(prev => prev + survivalScore);
    }
    return () => clearInterval(interval);
  }, [currentScreen, survivalPhase, survivalTime, survivalScore]);

  useEffect(() => {
    if (onboardingStep === 3) {
      const timer = setTimeout(() => {
        try { localStorage.setItem('maqra_onboarded', 'true'); } catch(e){}
        setCurrentScreen('launch');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [onboardingStep]);

  useEffect(() => {
    if (currentScreen === 'launch') {
      const timer = setTimeout(() => setCurrentScreen('dashboard'), 1300);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Construit la file de révision du jour à l'entrée sur l'écran Révisions :
  // seules les cartes jamais vues ou dont la date de rappel SRS est passée
  // sont incluses, comme un vrai deck de répétition espacée.
  useEffect(() => {
    if (currentScreen === 'revision') {
      const now = Date.now();
      const deck = buildRevisionDeck();
      const due = deck.filter(c => {
        const s = srsData[c.id];
        return !s || new Date(s.dueDate).getTime() <= now;
      });
      setDeckSize(deck.length);
      setSessionQueue(due);
      setCurrentCardIndex(due.length > 0 ? 0 : -1);
      setIsCardFlipped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // Les leçons 'match' stockent rightCol dans le même ordre que leftCol
  // (les deux triés par id) : sans mélange, la bonne réponse est toujours
  // à la même hauteur que son vis-à-vis, ce qui rend l'exercice trivial.
  // On mélange rightCol une seule fois par étape (pas à chaque re-render,
  // sinon les boutons changeraient de position à chaque clic).
  useEffect(() => {
    const step = activeLesson && activeLesson[lessonStep];
    if (step && step.type === 'match' && step.rightCol) {
      setShuffledMatchRight([...step.rightCol].sort(() => Math.random() - 0.5));
    }
  }, [activeLesson, lessonStep]);

  useEffect(() => {
    serverSyncedRef.current = false;
    if (!user || !supabase) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: moduleRows } = await supabase.from('module_progress').select('*').eq('user_id', user.id);
      if (cancelled) return;

      // Fusionne local et serveur en gardant toujours la valeur la plus avancée.
      // XP et progression des modules ne font qu'augmenter dans cette app, donc
      // max(local, serveur) ne peut jamais faire perdre de progression, contrairement
      // à l'ancien choix binaire "serveur vide -> local gagne, sinon -> serveur gagne"
      // qui écrasait la progression locale récente dès que le serveur avait la
      // moindre ancienne valeur non nulle.
      const serverXp = profile ? profile.xp : 0;
      setUserXp(prev => Math.max(prev, serverXp));

      setModules(prev => prev.map(m => {
        const row = moduleRows && moduleRows.find(r => r.module_id === m.id);
        const serverProgress = row ? row.progress : 0;
        return { ...m, progress: Math.max(m.progress, serverProgress) };
      }));

      if (profile) {
        setNotificationsEnabled(profile.notifications_enabled);
        setSoundEnabled(profile.sound_enabled);
        setDarkMode(profile.dark_mode);
        setLearningFocus(profile.learning_focus);
      }

      if (!cancelled) serverSyncedRef.current = true;
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    try {
      const modulesProgress = {};
      modules.forEach(m => { modulesProgress[m.id] = m.progress; });
      localStorage.setItem('maqra_progress', JSON.stringify({
        userXp, modulesProgress, notificationsEnabled, soundEnabled, darkMode, learningFocus
      }));
    } catch (e) {}

    if (user && supabase && serverSyncedRef.current) {
      supabase.from('profiles').upsert({
        id: user.id, xp: userXp, notifications_enabled: notificationsEnabled,
        sound_enabled: soundEnabled, dark_mode: darkMode, learning_focus: learningFocus,
        updated_at: new Date().toISOString()
      }).then(() => {});
      supabase.from('module_progress').upsert(
        modules.map(m => ({ user_id: user.id, module_id: m.id, progress: m.progress, updated_at: new Date().toISOString() }))
      ).then(() => {});
    }
  }, [userXp, modules, notificationsEnabled, soundEnabled, darkMode, learningFocus, user]);

  const resetLessonStates = () => {
    setLessonStep(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setMatchLeft(null);
    setMatchRight(null);
    setMatchWrong(false);
    setMatchedPairs([]);
    setShuffledMatchRight([]);
    setBuildSentence([]);
    setReadWordsStatus({});
    setActiveReadWord(null);
  };

  const handleModuleClick = (moduleId) => {
    setActiveModuleId(moduleId);
    const mod = modules.find(m => m.id === moduleId);

    // Le module 4, une fois toutes ses leçons terminées, ouvre l'encyclopédie
    // des racines en libre consultation plutôt que la liste de leçons.
    if (moduleId === 4 && mod && mod.progress >= mod.total) {
      setCurrentScreen('roots');
      return;
    }

    // Sinon, on affiche toujours la liste des leçons du module : chaque
    // leçon montre son contenu (aperçu) au clic, et ne se lance vraiment
    // que si elle est débloquée par la progression (voir startLesson /
    // openLessonPreview dans renderModuleLessonsList).
    setCurrentScreen('moduleLessons');
  };

  const handleActionClick = () => {
    const stepData = activeLesson[lessonStep];

    if (stepData.type === 'qcm' || stepData.type === 'listen' || stepData.type === 'build') {
      if (!isAnswerChecked) {
        setIsAnswerChecked(true);
        return;
      } else {
        let isCorrect = false;
        if (stepData.type === 'qcm' || stepData.type === 'listen') {
          isCorrect = selectedAnswer === stepData.correctIndex;
        } else if (stepData.type === 'build') {
          isCorrect = buildSentence.join('') === stepData.correctOrder.join('');
        }
        
        if (!isCorrect) {
          setIsAnswerChecked(false);
          if (stepData.type === 'qcm' || stepData.type === 'listen') setSelectedAnswer(null);
          return;
        }
      }
    }

    if (lessonStep < activeLesson.length - 1) {
      setLessonStep(lessonStep + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setMatchLeft(null);
      setMatchRight(null);
      setMatchWrong(false);
      setMatchedPairs([]);
      setBuildSentence([]);
      setReadWordsStatus({});
      setActiveReadWord(null);
    } else {
      completeLesson(activeModuleId);
    }
  };

  const completeLesson = (moduleId) => {
    setUserXp(prev => prev + 15);
    setModules(prevModules => 
      prevModules.map(mod => {
        if (mod.id === moduleId && mod.progress < mod.total) {
          return { ...mod, progress: mod.progress + 1 };
        }
        return mod;
      })
    );
    setCurrentScreen('dashboard');
    resetLessonStates();
  };

  const handleSrsAction = (quality) => {
    const card = sessionQueue[currentCardIndex];
    if (card) {
      setSrsData(prev => {
        const next = { ...prev, [card.id]: scheduleSrsCard(prev[card.id], quality) };
        try { localStorage.setItem('maqra_srs', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }
    setIsCardFlipped(false);
    if (currentCardIndex < sessionQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setCurrentCardIndex(-1);
      setUserXp(prev => prev + 15);
    }
  };

  const handleSurvivalAnswer = (selectedIndex) => {
    if (selectedIndex === survivalQuestions[currentSurvQuestion].correct) {
      setSurvivalScore(prev => prev + 10);
      setSurvivalTime(prev => prev + 2);
    } else {
      setSurvivalTime(prev => Math.max(0, prev - 3));
    }
    setCurrentSurvQuestion(prev => (prev + 1) % survivalQuestions.length);
  };

  const startSurvivalMode = () => {
    setSurvivalPhase('playing');
    setSurvivalTime(15);
    setSurvivalScore(0);
    setCurrentSurvQuestion(0);
  };
  
  const handleReadWordClick = (word) => {
     setActiveReadWord(word);
     setReadWordsStatus(prev => ({ ...prev, [word.id]: true }));
  };

  // La carte d'intro affichait tout, d'une simple lettre isolée à une
  // phrase entière (Noms d'Allah, Expressions), avec la même taille de
  // police fixe (64px) : les phrases longues débordaient du cadre. On
  // adapte la taille au nombre de caractères réels (espaces exclus).
  const arabicIntroSizeClass = (text) => {
    const len = (text || '').replace(/\s/g, '').length;
    if (len <= 3) return 'text-[64px]';
    if (len <= 8) return 'text-[42px]';
    if (len <= 16) return 'text-[30px]';
    return 'text-[22px]';
  };

  const speakArabic = (text) => {
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const audioRef = useRef(null);
  const playAyahAudio = (surah, ayah) => {
    try {
      const s = String(surah).padStart(3, '0');
      const a = String(ayah).padStart(3, '0');
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(`https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#f3efe4]">
      <div className="flex-1 overflow-y-auto px-6 pb-32 hide-scrollbar">
        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-[30px] font-extrabold text-gray-900 tracking-tight">Maqra</h1>
          <div className="flex items-center space-x-1.5 bg-yellow-100 px-3.5 py-1.5 rounded-full border border-yellow-200">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-bold text-yellow-700">{userXp} XP</span>
          </div>
        </div>

        <div className="bg-sky-100 rounded-3xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200 rounded-full blur-2xl -mr-10 -mt-10 opacity-50"></div>

          <div className="flex items-center space-x-2 mb-4 relative z-10">
            <span className="text-2xl">🔥</span>
            <h2 className="text-xl font-bold text-gray-800">1 jour de série !</h2>
          </div>

          <div className="flex justify-between items-center relative z-10">
            {streakData.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1.5 font-medium">{item.date}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${item.status === 'missed' ? '' : 'bg-white shadow-sm'}
                  ${item.status === 'current' ? 'border-2 border-sky-400 bg-sky-50' : ''}
                  ${item.status === 'future' ? 'bg-sky-50' : ''}
                `}>
                  {item.status === 'fire' && <span className="text-lg">🔥</span>}
                  {item.status === 'missed' && <X className="text-gray-800" size={16} strokeWidth={3}/>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="text-[15px] font-extrabold text-gray-900 mb-3.5 ml-0.5">Vos parcours</h3>
        <div className="grid grid-cols-2 gap-3.5">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              className={`${module.color} rounded-[24px] p-[18px] cursor-pointer hover:scale-[1.02] transition-transform shadow-sm flex flex-col min-h-[190px]`}
            >
              <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center text-[22px] shadow-sm mb-3">
                {module.icon}
              </div>
              <h4 className="text-[15px] font-extrabold text-gray-900 mb-1.5 leading-tight">{module.title}</h4>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed flex-1">
                {module.description}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-800 rounded-full" style={{ width: `${Math.round((module.progress / module.total) * 100)}%` }}></div>
                </div>
                <span className="text-[11px] font-bold text-gray-700">{module.progress}/{module.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModuleLessonsList = () => {
    const mod = modules.find(m => m.id === activeModuleId);
    const lessons = moduleLessonsMap[activeModuleId] || [];
    if (!mod) return null;
    return (
      <div className="flex-1 flex flex-col bg-[#f3efe4] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentScreen('dashboard')} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={24}/>
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{mod.title}</span>
          <div className="w-6"></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-10 hide-scrollbar">
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">{mod.description}</p>
          <div className="space-y-3">
            {lessons.map((lessonSteps, idx) => {
              const isDone = idx < mod.progress;
              const isCurrent = idx === mod.progress;
              const isLocked = idx > mod.progress;
              const itemCount = getLessonPreviewItems(lessonSteps).length;
              return (
                <div
                  key={idx}
                  onClick={() => isLocked ? openLessonPreview(activeModuleId, idx) : startLesson(activeModuleId, idx)}
                  className={`rounded-2xl p-4 flex items-center gap-3 cursor-pointer border transition-colors ${
                    isDone ? 'bg-green-50 border-green-200' :
                    isCurrent ? `${mod.color} border-transparent shadow-sm` :
                    'bg-white border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-lg ${
                    isDone ? 'bg-green-500 text-white' : isLocked ? 'bg-gray-200 text-gray-400' : 'bg-white'
                  }`}>
                    {isDone ? '✓' : isLocked ? '🔒' : mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Leçon {idx + 1}</p>
                    <p className="text-xs text-gray-500">
                      {isLocked ? 'Verrouillée — terminez la leçon précédente' : `${itemCount} élément${itemCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {isLocked && <span className="text-[11px] font-bold text-indigo-500 flex-shrink-0">Aperçu →</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLessonPreview = () => {
    if (!previewLesson) return null;
    const mod = modules.find(m => m.id === previewLesson.moduleId);
    const lessons = moduleLessonsMap[previewLesson.moduleId] || [];
    const steps = lessons[previewLesson.lessonIndex] || [];
    const items = getLessonPreviewItems(steps);
    const isLocked = mod ? previewLesson.lessonIndex > mod.progress : false;
    return (
      <div className="flex-1 flex flex-col bg-[#f3efe4] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentScreen('moduleLessons')} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={24}/>
          </button>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leçon {previewLesson.lessonIndex + 1} · Aperçu</span>
          <div className="w-6"></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-10 hide-scrollbar">
          {isLocked && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5 text-sm text-indigo-700 font-medium leading-relaxed">
              🔒 Terminez les leçons précédentes pour pouvoir jouer celle-ci. Vous pouvez déjà en voir le contenu ci-dessous.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <div key={item.key ?? i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <p className="font-arabic text-2xl font-bold text-gray-900 mb-1 leading-snug">{item.main}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLesson = () => {
    if (!activeLesson || activeLesson.length === 0) return null;
    const stepData = activeLesson[lessonStep];
    const progressPercent = (lessonStep / activeLesson.length) * 100;

    const isCurrentAnswerCorrect = () => {
       if (stepData.type === 'qcm' || stepData.type === 'listen') return selectedAnswer === stepData.correctIndex;
       if (stepData.type === 'build') return buildSentence.join('') === stepData.correctOrder.join('');
       return true;
    };
    
    const isReadingComplete = () => {
       if (stepData.type !== 'reading') return false;
       return stepData.words.every(w => readWordsStatus[w.id]);
    };

    const handleMatchSelection = (side, item) => {
       if (matchedPairs.includes(item.id) || matchWrong) return;

       const clearMismatch = () => {
          setMatchWrong(true);
          setTimeout(() => {
             setMatchLeft(null);
             setMatchRight(null);
             setMatchWrong(false);
          }, 600);
       };

       if (side === 'left') {
          setMatchLeft(item);
          if (matchRight) {
             if (item.id === matchRight.id) {
                setMatchedPairs(prev => [...prev, item.id]);
                setMatchLeft(null);
                setMatchRight(null);
             } else {
                clearMismatch();
             }
          }
       } else {
          setMatchRight(item);
          if (matchLeft) {
             if (matchLeft.id === item.id) {
                setMatchedPairs(prev => [...prev, item.id]);
                setMatchLeft(null);
                setMatchRight(null);
             } else {
                clearMismatch();
             }
          }
       }
    };

    return (
      <div className="flex flex-col h-full bg-[#f3efe4] relative">
        <div className="px-6 py-4 flex items-center space-x-4 bg-white shadow-sm z-10">
          <button onClick={() => setCurrentScreen('dashboard')} className="text-gray-400 hover:text-gray-800">
            <X size={24}/>
          </button>

          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center text-red-500 font-bold space-x-1">
            <span className="text-lg leading-none">♥</span>
            <span>5</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-center hide-scrollbar">

          {stepData.type === 'intro' && (
            <div className="flex flex-col items-center justify-center flex-1 animation-fade-in py-2 relative">
              <h2 className="text-base font-bold text-gray-800 mb-3 text-center leading-snug px-1">{stepData.instruction}</h2>

              <div className="bg-white w-full max-w-[320px] py-5 px-5 rounded-[2.5rem] shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center justify-center mb-3">
                <span className={`font-arabic ${arabicIntroSizeClass(stepData.letter)} font-bold text-gray-900 leading-tight mb-4 text-center break-words max-w-full`}>{stepData.letter}</span>
                <span className="text-[12px] text-gray-500 font-semibold tracking-wide bg-white px-3 py-1.5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4 text-center break-words max-w-full">{stepData.name}</span>
                {stepData.mnemonic && (
                  <div className="flex items-start space-x-2 bg-sky-50 px-3 py-1.5 rounded-2xl border border-sky-100 max-w-full">
                    <span className="text-lg flex-shrink-0">{stepData.illustration}</span>
                    <span className="font-arabic text-[13px] font-bold text-sky-900 text-left break-words">{stepData.mnemonic}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mb-6">
                <button onClick={() => speakArabic(stepData.letter)} className="bg-sky-100 py-2 px-4 rounded-full text-sky-600 hover:bg-sky-200 transition-colors flex items-center space-x-2">
                  <span>🔊</span>
                  <span className="font-bold text-[13px]">Écouter</span>
                </button>
              </div>

              {stepData.rootKey && rootsDatabase[stepData.rootKey] && (
                <div className="w-full mt-auto mb-4">
                   <button
                      onClick={() => {
                         setCurrentRootWord({ root: stepData.rootKey, ...rootsDatabase[stepData.rootKey] });
                         setShowContextualRoot(true);
                      }}
                      className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-[18px] hover:bg-indigo-100 transition-colors"
                   >
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-lg">
                            📘
                         </div>
                         <div className="text-left">
                            <p className="text-[13px] font-bold text-indigo-900">💡 Explorer la racine</p>
                            <p className="text-[11px] text-indigo-600 font-medium">Découvrez l'origine de ce mot</p>
                         </div>
                      </div>
                      <span className="text-indigo-300">→</span>
                   </button>
                </div>
              )}
            </div>
          )}

          {stepData.type === 'trace' && (
            <div className="flex flex-col items-center justify-start flex-1 animation-fade-in w-full max-w-sm mx-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{stepData.instruction}</h2>
              <DrawingCanvas backgroundLetter={stepData.letter}/>
              <div className="mt-4 flex items-center justify-center bg-yellow-50 text-yellow-800 px-4 py-3 rounded-2xl w-full border border-yellow-200">
                 <Info className="mr-2 flex-shrink-0" size={20}/>
                 <p className="text-xs font-medium">Utilisez votre doigt pour tracer la lettre.</p>
              </div>
            </div>
          )}

          {stepData.type === 'qcm' && (() => {
            // Le bouton carré (aspect-square) convient à une lettre ou un
            // mot court, mais les options plus longues (phrases des
            // modules Expressions/Noms d'Allah) y débordaient. Au-delà
            // d'un certain seuil, on bascule sur une liste empilée en
            // pleine largeur, sans contrainte carrée.
            const isLongOptions = stepData.options.some(o => o.length > 12);
            return (
            <div className="flex flex-col flex-1 animation-fade-in justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">{stepData.instruction}</h2>

              <div className={isLongOptions ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-4'}>
                {stepData.options.map((opt, idx) => {
                  let btnClass = 'bg-white border-transparent text-gray-800 hover:bg-gray-50 hover:border-gray-200';

                  if (selectedAnswer === idx) {
                    if (!isAnswerChecked) {
                      btnClass = 'bg-sky-50 border-sky-400 text-sky-900 scale-[0.98]';
                    } else if (idx === stepData.correctIndex) {
                      btnClass = 'bg-green-100 border-green-500 text-green-700 scale-[0.98]';
                    } else {
                      btnClass = 'bg-red-100 border-red-500 text-red-700 scale-[0.98]';
                    }
                  } else if (isAnswerChecked && idx === stepData.correctIndex) {
                    btnClass = 'bg-green-50 border-green-300 text-green-700';
                  }

                  const fontSizeClass = isLongOptions ? 'text-[16px]' : (opt.length > 2 ? 'text-[20px]' : 'text-[40px]');

                  return (
                    <button
                      key={idx}
                      onClick={() => !isAnswerChecked && setSelectedAnswer(idx)}
                      disabled={isAnswerChecked}
                      className={`font-arabic font-bold shadow-sm border-4 transition-all ${fontSizeClass} ${btnClass} ${
                        isLongOptions
                          ? 'w-full py-4 px-5 rounded-2xl text-left'
                          : 'aspect-square rounded-[22px] flex items-center justify-center'
                      }`}
                    >
                      <span className={`w-full px-1 break-words ${isLongOptions ? 'text-left' : 'text-center'}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {stepData.type === 'reading' && (
             <div className="flex flex-col flex-1 animation-fade-in py-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{stepData.instruction}</h2>

                {stepData.verses && (
                   <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {stepData.verses.map((v, i) => (
                         <button
                            key={i}
                            onClick={() => playAyahAudio(v.surah, v.ayah)}
                            className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                         >
                            <Volume2 size={14}/>
                            <span>Verset {v.ayah}</span>
                         </button>
                      ))}
                   </div>
                )}

                <div dir="rtl" className="flex flex-wrap justify-center gap-x-[14px] gap-y-[18px] mb-10 bg-white p-[22px] rounded-3xl shadow-inner border border-gray-100">
                   {stepData.words.map((word) => {
                      const isRead = readWordsStatus[word.id];
                      const isActive = activeReadWord?.id === word.id;
                      return (
                         <button
                            key={word.id}
                            onClick={() => handleReadWordClick(word)}
                            className={`font-arabic relative text-[34px] font-bold p-1.5 transition-all rounded-xl
                               ${isActive ? 'text-sky-600 bg-sky-50' :
                                 isRead ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                            {word.text}
                         </button>
                      )
                   })}
                </div>

                <div className={`transition-all duration-300 w-full ${activeReadWord ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                   {activeReadWord && (
                      <div className="bg-white rounded-3xl p-5 shadow-lg border border-sky-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full blur-xl -mr-8 -mt-8 opacity-70"></div>
                         
                         <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                               <h3 className="font-arabic text-2xl font-bold text-gray-900 mb-1">{activeReadWord.text}</h3>
                               <p className="text-sky-600 font-medium text-sm">{activeReadWord.trans}</p>
                            </div>
                            <button onClick={() => speakArabic(activeReadWord.text)} className="bg-sky-100 text-sky-600 p-3 rounded-full hover:bg-sky-200 transition-colors">
                               <Volume2 size={20}/>
                            </button>
                         </div>
                         
                         {activeReadWord.root && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                               <div className="flex items-center space-x-2">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Racine</span>
                                  <span className="bg-gray-100 text-gray-800 font-bold px-2 py-1 rounded text-sm">{activeReadWord.root}</span>
                               </div>
                               <button
                                  onClick={() => {
                                     const rootInfo = rootsDatabase[activeReadWord.root];
                                     setCurrentRootWord({
                                        root: activeReadWord.root,
                                        trans: rootInfo ? rootInfo.trans : activeReadWord.trans,
                                        derivatives: rootInfo ? rootInfo.derivatives : []
                                     });
                                     setShowContextualRoot(true);
                                  }}
                                  className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center"
                               >
                                  Explorer <ArrowLeft className="ml-1 transform rotate-180" size={12}/>
                               </button>
                            </div>
                         )}
                      </div>
                   )}
                </div>
             </div>
          )}

          {stepData.type === 'listen' && (
            <div className="flex flex-col flex-1 animation-fade-in justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">{stepData.instruction}</h2>
              <div className="flex justify-center mb-8">
                 <button className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-200 hover:scale-105 transition-transform">
                    <Volume2 size={40}/>
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stepData.options.map((opt, idx) => {
                  let btnClass = 'bg-white border-transparent text-gray-800 hover:bg-gray-50 hover:border-gray-200';
                  if (selectedAnswer === idx) {
                    if (!isAnswerChecked) {
                      btnClass = 'bg-sky-50 border-sky-400 text-sky-900 scale-[0.98]';
                    } else if (idx === stepData.correctIndex) {
                      btnClass = 'bg-green-100 border-green-500 text-green-700 scale-[0.98]';
                    } else {
                      btnClass = 'bg-red-100 border-red-500 text-red-700 scale-[0.98]';
                    }
                  } else if (isAnswerChecked && idx === stepData.correctIndex) {
                    btnClass = 'bg-green-50 border-green-300 text-green-700'; 
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => !isAnswerChecked && setSelectedAnswer(idx)}
                      disabled={isAnswerChecked}
                      className={`py-6 px-4 rounded-3xl flex items-center justify-center text-xl font-bold shadow-sm border-4 transition-all ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stepData.type === 'match' && (
             <div className="flex flex-col flex-1 animation-fade-in justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">{stepData.instruction}</h2>
              <div className="flex justify-between space-x-4">
                 <div className="flex-1 flex flex-col space-y-3">
                    {stepData.leftCol.map((item) => {
                       const isMatched = matchedPairs.includes(item.id);
                       const isSelected = matchLeft?.id === item.id;
                       const isWrong = isSelected && matchWrong;
                       return (
                         <button
                            key={`l-${item.id}`}
                            onClick={() => handleMatchSelection('left', item)}
                            disabled={isMatched || matchWrong}
                            className={`py-4 px-4 rounded-2xl border-4 font-bold text-base transition-all
                               ${isMatched ? 'bg-gray-100 border-gray-100 text-gray-300 opacity-50 shadow-inner' :
                                 isWrong ? 'bg-red-50 border-red-400 text-red-700' :
                                 isSelected ? 'bg-sky-50 border-sky-400 text-sky-700' : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'}`}
                         >
                            {item.text}
                         </button>
                       )
                    })}
                 </div>
                 <div className="flex-1 flex flex-col space-y-3">
                    {(shuffledMatchRight.length ? shuffledMatchRight : stepData.rightCol).map((item) => {
                       const isMatched = matchedPairs.includes(item.id);
                       const isSelected = matchRight?.id === item.id;
                       const isWrong = isSelected && matchWrong;
                       return (
                         <button
                            key={`r-${item.id}`}
                            onClick={() => handleMatchSelection('right', item)}
                            disabled={isMatched || matchWrong}
                            className={`py-4 px-4 rounded-2xl border-4 font-bold text-base transition-all
                               ${isMatched ? 'bg-gray-100 border-gray-100 text-gray-300 opacity-50 shadow-inner' :
                                 isWrong ? 'bg-red-50 border-red-400 text-red-700' :
                                 isSelected ? 'bg-sky-50 border-sky-400 text-sky-700' : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'}`}
                         >
                            {item.text}
                         </button>
                       )
                    })}
                 </div>
              </div>
            </div>
          )}

          {stepData.type === 'build' && (
             <div className="flex flex-col flex-1 animation-fade-in justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">{stepData.instruction}</h2>
              <div className="min-h-[80px] w-full border-b-2 border-dashed border-gray-300 mb-8 flex flex-wrap gap-2 items-start pb-4">
                 {buildSentence.map((word, idx) => (
                    <button
                       key={`ans-${idx}`}
                       onClick={() => {
                          if(isAnswerChecked) return;
                          setBuildSentence(prev => prev.filter((_, i) => i !== idx));
                       }}
                       className={`px-4 py-3 bg-white border-2 rounded-xl font-bold text-xl shadow-sm hover:bg-gray-50 transition-all
                          ${isAnswerChecked ? (buildSentence.join('') === stepData.correctOrder.join('') ? 'border-green-400 text-green-700 bg-green-50' : 'border-red-400 text-red-700 bg-red-50') : 'border-gray-200 text-gray-800'}
                       `}
                    >
                       {word}
                    </button>
                 ))}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                 {stepData.words.map((word, idx) => {
                    const isUsed = buildSentence.includes(word);
                    return (
                       <button
                          key={`bank-${idx}`}
                          onClick={() => {
                             if(isAnswerChecked || isUsed) return;
                             setBuildSentence(prev => [...prev, word]);
                          }}
                          disabled={isUsed || isAnswerChecked}
                          className={`px-5 py-3 rounded-xl font-bold text-xl transition-all
                             ${isUsed ? 'bg-gray-100 text-gray-300 border-2 border-transparent shadow-none' : 'bg-white border-2 border-gray-200 text-gray-800 shadow-sm hover:border-gray-300 active:scale-95'}
                          `}
                       >
                          {word}
                       </button>
                    )
                 })}
              </div>
            </div>
          )}

          {stepData.type === 'success' && (
            <div className="flex flex-col items-center justify-center flex-1 animation-fade-in">
               <div className="w-32 h-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Check size={64} strokeWidth={3}/>
               </div>
               <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Bravo !</h2>
               <p className="text-lg text-gray-500 font-medium text-center px-4">{stepData.instruction}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100 z-10">
          <button 
            onClick={() => {
              if (stepData.type === 'intro' || stepData.type === 'trace' || stepData.type === 'reading') {
                if (lessonStep < activeLesson.length - 1) {
                  setLessonStep(lessonStep + 1);
                  setSelectedAnswer(null);
                  setIsAnswerChecked(false);
                  setMatchLeft(null);
                  setMatchRight(null);
                  setMatchWrong(false);
                  setMatchedPairs([]);
                  setBuildSentence([]);
                  setReadWordsStatus({});
                  setActiveReadWord(null);
                } else {
                  completeLesson(activeModuleId);
                }
              } else {
                handleActionClick();
              }
            }}
            disabled={
              (stepData.type === 'qcm' && selectedAnswer === null) ||
              (stepData.type === 'listen' && selectedAnswer === null) ||
              (stepData.type === 'match' && matchedPairs.length < stepData.pairs.length) ||
              (stepData.type === 'build' && buildSentence.length === 0) ||
              (stepData.type === 'reading' && !isReadingComplete())
            }
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg
              ${(stepData.type === 'qcm' || stepData.type === 'listen') && selectedAnswer === null
                ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                : (stepData.type === 'match' && matchedPairs.length < stepData.pairs.length)
                  ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                  : (stepData.type === 'build' && buildSentence.length === 0)
                    ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                    : (stepData.type === 'reading' && !isReadingComplete())
                      ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                    : (stepData.type === 'match' || stepData.type === 'success' || stepData.type === 'intro' || stepData.type === 'trace' || stepData.type === 'reading')
                      ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600 hover:-translate-y-1'
                      : isAnswerChecked
                        ? (isCurrentAnswerCorrect()
                            ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600 hover:-translate-y-1'
                            : 'bg-red-500 text-white shadow-red-200 hover:bg-red-600 hover:-translate-y-1')
                        : 'bg-gray-900 text-white shadow-gray-200 hover:bg-black hover:-translate-y-1'
              }
            `}
          >
            {stepData.type === 'success' || stepData.type === 'intro' || stepData.type === 'trace'
              ? (stepData.type === 'success' ? 'Terminer' : 'Continuer')
              : stepData.type === 'reading'
                ? (isReadingComplete() ? 'Continuer' : 'Lisez chaque mot')
                : stepData.type === 'match'
                  ? 'Continuer'
                  : (!isAnswerChecked 
                      ? 'Vérifier' 
                      : (isCurrentAnswerCorrect() ? 'Correct ! Continuer' : 'Incorrect. Réessayer'))}
          </button>
        </div>
      </div>
    );
  };

  const renderRevision = () => {
    if (currentCardIndex === -1 || !sessionQueue[currentCardIndex]) {
      const nothingLearnedYet = deckSize === 0;
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f3efe4] relative overflow-hidden pb-32">
           <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <Check size={48} strokeWidth={3}/>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">{nothingLearnedYet ? 'Rien à réviser pour l\'instant' : 'Tout est à jour !'}</h2>
           <p className="text-gray-500 text-center text-sm px-4">
             {nothingLearnedYet
               ? 'Terminez quelques leçons pour commencer à constituer vos cartes de révision.'
               : 'Vous avez révisé toutes vos cartes pour aujourd\'hui.'}
           </p>
        </div>
      );
    }
    const card = sessionQueue[currentCardIndex];
    return (
      <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-32">
        <div className="px-6 pt-4 pb-2">
           <h1 className="text-3xl font-bold text-gray-900">Révisions</h1>
           <div className="flex items-center space-x-2 mt-1">
             <Flame className="text-orange-500" size={16}/>
             <p className="text-gray-600 font-medium text-sm">{sessionQueue.length - currentCardIndex} cartes pour aujourd'hui</p>
           </div>
        </div>
        <div className="px-6 mt-2 z-20">
           <div onClick={() => setCurrentScreen('survival')} className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-4 flex justify-between items-center cursor-pointer shadow-lg hover:scale-[1.02] transition-transform">
              <div>
                 <div className="flex items-center space-x-2 mb-1">
                    <Zap className="text-yellow-400 fill-current" size={16}/>
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">Mode Survie</h3>
                 </div>
                 <p className="text-indigo-200 text-xs font-medium">Révisez sous pression du temps !</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                 <Play className="ml-1" size={20}/>
              </div>
           </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative mt-2">
           <div className="absolute w-64 h-80 bg-gray-200 rounded-[2rem] transform scale-90 -translate-y-8 opacity-50 pointer-events-none"></div>
           <div className="absolute w-72 h-80 bg-gray-100 rounded-[2rem] transform scale-95 -translate-y-4 opacity-70 pointer-events-none"></div>
           <div 
              onClick={() => !isCardFlipped && setIsCardFlipped(true)}
              className={`relative w-full max-w-[320px] bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col z-10 transition-all duration-300 ${!isCardFlipped ? 'cursor-pointer hover:-translate-y-1' : ''}`}
              style={{ minHeight: '360px' }}
           >
              <div className="p-4 flex justify-between items-center border-b border-gray-50">
                 <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full uppercase tracking-wider">{card.hint}</span>
                 <button onClick={() => speakArabic(card.front)} className="text-gray-400 hover:text-sky-500 transition-colors">
                    <Volume2 size={20}/>
                 </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                 <span className={`font-arabic ${arabicIntroSizeClass(card.front)} font-bold text-gray-900 leading-tight mb-4 break-words max-w-full`}>{card.front}</span>
                 {isCardFlipped ? (
                    <div className="animation-fade-in flex flex-col items-center">
                       <div className="w-12 h-1 bg-gray-100 rounded-full mb-6"></div>
                       <span className="text-xl font-bold text-sky-600 mb-1">{card.back.includes('(') ? card.back.split(' (')[0] : card.back}</span>
                       {card.back.includes('(') && (
                         <span className="text-sm text-gray-500 font-medium">({card.back.split(' (')[1]}</span>
                       )}
                    </div>
                 ) : (
                    <div className="text-gray-300 text-sm font-medium flex items-center mt-6">
                       <RotateCcw className="mr-2" size={16}/>
                       Tapez pour révéler
                    </div>
                 )}
              </div>
           </div>
        </div>
        <div className="px-6 pt-6 pb-4 flex space-x-3 z-10 h-24">
           {!isCardFlipped ? (
              <button 
                onClick={() => setIsCardFlipped(true)}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-800 transition-colors h-14"
              >
                Révéler la réponse
              </button>
           ) : (
              <div className="flex w-full space-x-2 animation-fade-in">
                <button onClick={() => handleSrsAction('hard')} className="flex-1 bg-red-50 border border-red-200 text-red-700 font-bold rounded-2xl hover:bg-red-100 transition-colors flex flex-col items-center justify-center h-14">
                   <span className="text-sm">À revoir</span>
                </button>
                <button onClick={() => handleSrsAction('good')} className="flex-1 bg-orange-50 border border-orange-200 text-orange-700 font-bold rounded-2xl hover:bg-orange-100 transition-colors flex flex-col items-center justify-center h-14">
                   <span className="text-sm">Correct</span>
                </button>
                <button onClick={() => handleSrsAction('easy')} className="flex-1 bg-green-50 border border-green-200 text-green-700 font-bold rounded-2xl hover:bg-green-100 transition-colors flex flex-col items-center justify-center h-14">
                   <span className="text-sm">Facile</span>
                </button>
              </div>
           )}
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-32">
       <div className="px-6 pt-8 pb-6 bg-white rounded-b-[2.5rem] shadow-sm z-10 relative">
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
             <div className="flex items-center space-x-2">
                <button
                   onClick={() => setCurrentScreen('settings')}
                   className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                   ⚙️
                </button>
                <button
                   onClick={() => setShowProModal(true)}
                   className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-transform"
                >
                   👑 PRO
                </button>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="flex flex-col items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="text-2xl mb-1">🔥</span>
                <span className="font-bold text-gray-900">1</span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Jour</span>
             </div>
             <div className="flex flex-col items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="text-2xl mb-1">⭐</span>
                <span className="font-bold text-gray-900">{userXp}</span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">XP</span>
             </div>
             <div 
                onClick={() => setCurrentScreen('leaderboard')}
                className="flex flex-col items-center bg-orange-50 p-3 rounded-2xl border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
             >
                <span className="text-2xl mb-1">🥉</span>
                <span className="font-bold text-orange-800 text-sm mt-1 mb-0.5">Bronze</span>
                <span className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">Ligue</span>
             </div>
          </div>

          {isSupabaseConfigured && (
            <div className="mt-4">
              {user ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-[11px] text-gray-500">Connecté · progression synchronisée</p>
                    </div>
                  </div>
                  <button onClick={signOut} className="text-xs font-bold text-red-500 hover:text-red-600 flex-shrink-0">Déconnexion</button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-50 border border-gray-100 rounded-2xl p-3 font-bold text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <span>🔐</span>
                  <span>Se connecter avec Google</span>
                </button>
              )}
            </div>
          )}
       </div>

       <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Mon Objectif Principal</h3>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md uppercase">Modifiable</span>
          </div>
          
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 mb-8 flex flex-col space-y-2">
             <button 
                onClick={() => setLearningFocus('lecture')}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${learningFocus === 'lecture' ? 'bg-sky-50 border-sky-200 shadow-inner' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
             >
                <div className="flex items-center space-x-3">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${learningFocus === 'lecture' ? 'bg-sky-200 text-sky-700' : 'bg-gray-100 text-gray-500'}`}>📖</div>
                   <div className="text-left">
                      <p className={`font-bold ${learningFocus === 'lecture' ? 'text-sky-900' : 'text-gray-700'}`}>Lecture du Coran & Fusha</p>
                      <p className="text-xs text-gray-500 mt-0.5">Focus sur le décodage, le Tajweed et le vocabulaire coranique.</p>
                   </div>
                </div>
                {learningFocus === 'lecture' && <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-sm"><Check className="text-white" size={14} strokeWidth={3}/></div>}
             </button>

             <button 
                onClick={() => setLearningFocus('conversation')}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${learningFocus === 'conversation' ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
             >
                <div className="flex items-center space-x-3">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${learningFocus === 'conversation' ? 'bg-green-200' : 'bg-gray-100'}`}>🗣️</div>
                   <div className="text-left">
                      <p className={`font-bold ${learningFocus === 'conversation' ? 'text-green-900' : 'text-gray-700'}`}>Expression Littéraire</p>
                      <p className="text-xs text-gray-500 mt-0.5">S'exprimer en arabe classique et maîtriser les structures.</p>
                   </div>
                </div>
                {learningFocus === 'conversation' && <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm"><Check className="text-white" size={14} strokeWidth={3}/></div>}
             </button>
          </div>
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-32">
       <div className="px-6 py-4 bg-white shadow-sm z-10 flex items-center space-x-4 relative">
          <button onClick={() => setCurrentScreen('profile')} className="text-gray-400 hover:text-gray-800">
            <ArrowLeft size={24}/>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
       </div>

       <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 hide-scrollbar">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-6">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Préférences</h3>

             <div className="flex items-center justify-between">
                <div>
                   <p className="font-bold text-gray-900">Notifications de rappel</p>
                   <p className="text-xs text-gray-500">Pour maintenir votre série quotidienne</p>
                </div>
                <button
                   onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                   className={`w-12 h-7 rounded-full transition-colors relative p-1 ${notificationsEnabled ? 'bg-sky-500' : 'bg-gray-200'}`}
                >
                   <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'transform translate-x-5' : ''}`}></div>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                   <p className="font-bold text-gray-900">Effets sonores</p>
                   <p className="text-xs text-gray-500">Sons lors des réussites et des clics</p>
                </div>
                <button
                   onClick={() => setSoundEnabled(!soundEnabled)}
                   className={`w-12 h-7 rounded-full transition-colors relative p-1 ${soundEnabled ? 'bg-sky-500' : 'bg-gray-200'}`}
                >
                   <div className={`w-5 h-5 bg-white rounded-full transition-transform ${soundEnabled ? 'transform translate-x-5' : ''}`}></div>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div>
                   <p className="font-bold text-gray-900">Mode Sombre (Beta)</p>
                   <p className="text-xs text-gray-500">Interface à fort contraste</p>
                </div>
                <button
                   onClick={() => setDarkMode(!darkMode)}
                   className={`w-12 h-7 rounded-full transition-colors relative p-1 ${darkMode ? 'bg-sky-500' : 'bg-gray-200'}`}
                >
                   <div className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'transform translate-x-5' : ''}`}></div>
                </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Support & Légal</h3>
             <button className="w-full text-left font-bold text-gray-800 py-2 hover:text-sky-600 transition-colors">Centre d'aide</button>
             <button className="w-full text-left font-bold text-gray-800 py-2 hover:text-sky-600 transition-colors">Conditions d'utilisation</button>
             <button className="w-full text-left font-bold text-red-500 py-2 hover:text-red-600 transition-colors">Déconnexion</button>
          </div>
       </div>
    </div>
  );

  const renderLeaderboard = () => {
    const leaderboardData = [
      { id: 1, name: 'Sarah M.', xp: 3450, avatar: 'S', color: 'bg-emerald-100 text-emerald-700' },
      { id: 2, name: 'Karim D.', xp: 2890, avatar: 'K', color: 'bg-blue-100 text-blue-700' },
      { id: 3, name: 'Vous', xp: userXp, avatar: 'M', color: 'bg-sky-500 text-white', isUser: true },
      { id: 4, name: 'Julie L.', xp: 120, avatar: 'J', color: 'bg-purple-100 text-purple-700' },
      { id: 5, name: 'Omar B.', xp: 85, avatar: 'O', color: 'bg-rose-100 text-rose-700' },
    ].sort((a, b) => b.xp - a.xp);

    return (
      <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-32">
         <div className="px-6 pt-8 pb-8 bg-gradient-to-b from-orange-100 to-gray-50 relative z-10">
            <div className="flex flex-col items-center justify-center">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-orange-200 mb-4">🥉</div>
               <h1 className="text-2xl font-black text-gray-900 mb-1">Ligue de Bronze</h1>
               <p className="text-sm text-gray-500 font-medium">Les 3 premiers sont promus en Argent</p>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2">
               {leaderboardData.map((user, index) => (
                  <div key={user.id} className={`flex items-center p-3 rounded-2xl mb-1 ${user.isUser ? 'bg-sky-50 border border-sky-100' : ''}`}>
                     <div className="w-8 flex justify-center">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && <span className="text-sm font-bold text-gray-400">{index + 1}</span>}
                     </div>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ml-2 ${user.color}`}>
                        {user.avatar}
                     </div>
                     <div className="flex-1 ml-4">
                        <p className={`font-bold ${user.isUser ? 'text-sky-900' : 'text-gray-900'}`}>{user.name}</p>
                     </div>
                     <div className="text-right">
                        <p className={`font-black ${user.isUser ? 'text-sky-600' : 'text-gray-500'}`}>{user.xp}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">XP</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    );
  };

  const renderAiTutor = () => (
    <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-0">
       <div className="px-6 py-4 bg-white shadow-sm z-10 flex justify-between items-center relative">
          <button onClick={() => setCurrentScreen('dashboard')} className="text-gray-400 hover:text-gray-800">
            <ArrowLeft size={24}/>
          </button>
          <div className="flex flex-col items-center">
             <div className="flex items-center space-x-1.5">
                <Sparkles className="text-indigo-500" size={14}/>
                <span className="font-bold text-gray-900 text-lg">Maqra AI</span>
             </div>
             <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">En ligne</span>
          </div>
          <div className="w-8 h-8"></div>
       </div>
       <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 hide-scrollbar flex flex-col">
          <div className="text-center mb-2">
             <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">Aujourd'hui, 10:46</span>
          </div>
          {chatMessages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animation-fade-in`}>
                {msg.sender === 'ai' && (
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex-shrink-0 flex items-center justify-center text-white mr-2 mt-auto mb-1 shadow-sm">
                      <Sparkles size={14}/>
                   </div>
                )}
                <div className={`max-w-[75%] rounded-3xl px-5 py-3.5 shadow-sm ${
                   msg.sender === 'user' 
                   ? 'bg-gray-900 text-white rounded-br-sm' 
                   : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}>
                   <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                   {msg.sender === 'ai' && (
                      <div className="mt-3 flex items-center text-sky-500 space-x-2">
                         <button className="p-1.5 bg-sky-50 rounded-full hover:bg-sky-100 transition-colors">
                            <Volume2 size={16}/>
                         </button>
                         <span className="text-[10px] font-bold uppercase tracking-wider">Écouter</span>
                      </div>
                   )}
                </div>
             </div>
          ))}
          {isRecording && (
             <div className="flex justify-end animation-fade-in">
                <div className="bg-sky-50 border border-sky-100 rounded-3xl rounded-br-sm px-5 py-4 shadow-sm flex items-center space-x-2">
                   <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping"></div>
                   <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </div>
             </div>
          )}
       </div>
       <div className="px-6 py-4 bg-white border-t border-gray-100 z-10 flex flex-col items-center pb-8">
          <div className="w-full flex items-center justify-between mb-2">
             <button className="text-gray-400 hover:text-gray-600 p-2">
                <Keyboard size={24}/>
             </button>
             <button 
                onPointerDown={() => setIsRecording(true)}
                onPointerUp={() => {
                   setIsRecording(false);
                   if(chatMessages.length === 3) {
                      setChatMessages([...chatMessages, { id: 4, sender: 'user', text: 'Uridu shayan min fadlik.' }]);
                      setTimeout(() => {
                         setChatMessages(prev => [...prev, { id: 5, sender: 'ai', text: 'Mumtaz! 🌟 Votre prononciation s\'améliore. +15 XP.' }]);
                         setUserXp(prev => prev + 15);
                      }, 1200);
                   }
                }}
                onPointerLeave={() => setIsRecording(false)}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl select-none touch-none ${
                   isRecording 
                   ? 'bg-red-500 text-white scale-110 shadow-red-200' 
                   : 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white hover:scale-105 shadow-sky-200'
                }`}
             >
                <Mic size={32}/>
             </button>
             <button className="text-gray-400 hover:text-gray-600 p-2 opacity-50 cursor-not-allowed">
                <Send size={24}/>
             </button>
          </div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">
             {isRecording ? 'Relâchez pour envoyer' : 'Maintenez pour parler'}
          </span>
       </div>
    </div>
  );

  const renderSurvivalMode = () => (
    <div className="flex-1 flex flex-col bg-gray-950 relative overflow-hidden pb-0 text-white font-mono">
       {survivalPhase === 'playing' && (
         <>
           <div className="px-6 py-8 flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                 <span className="text-gray-500 text-xs uppercase tracking-widest">Score</span>
                 <span className="text-3xl font-black text-yellow-400">{survivalScore}</span>
              </div>
              <div className={`flex items-center justify-center w-20 h-20 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${survivalTime <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-emerald-400 text-emerald-400'}`}>
                 <span className="text-3xl font-black">{survivalTime}</span>
              </div>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              <span className="text-gray-400 text-sm mb-4 uppercase tracking-widest">Traduisez :</span>
              <h2 className="text-5xl font-black text-white mb-12 text-center break-words">{survivalQuestions[currentSurvQuestion].word}</h2>
              <div className="grid grid-cols-2 gap-4 w-full">
                 {survivalQuestions[currentSurvQuestion].options.map((opt, idx) => (
                    <button
                       key={idx}
                       onClick={() => handleSurvivalAnswer(idx)}
                       className="font-arabic bg-gray-900 border-2 border-gray-800 text-3xl font-bold py-8 rounded-2xl hover:border-emerald-500 hover:bg-emerald-900/20 transition-colors active:scale-95"
                    >
                       {opt}
                    </button>
                 ))}
              </div>
           </div>
         </>
       )}
       {(survivalPhase === 'intro' || survivalPhase === 'gameover') && (
         <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center">
            {survivalPhase === 'intro' ? (
               <>
                 <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-6 border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.3)]">
                    <Zap className="text-yellow-400 fill-current" size={48}/>
                 </div>
                 <h2 className="text-4xl font-black text-white mb-4 uppercase italic">Mode Survie</h2>
                 <p className="text-gray-400 text-sm mb-10 max-w-[250px]">Répondez vite. Bonne réponse = +2 sec. Mauvaise = -3 sec. Combien de temps tiendrez-vous ?</p>
                 <button onClick={startSurvivalMode} className="w-full bg-emerald-500 text-gray-950 font-black text-xl py-5 rounded-2xl uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-4">
                    Jouer
                 </button>
                 <button onClick={() => setCurrentScreen('revision')} className="text-gray-500 font-bold uppercase tracking-widest text-sm hover:text-white">Retour</button>
               </>
            ) : (
               <div className="animation-fade-in">
                 <h2 className="text-5xl font-black text-red-500 mb-2 uppercase">Temps Écoulé</h2>
                 <p className="text-gray-400 text-sm mb-10 uppercase tracking-widest">Jeu Terminé</p>
                 <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl mb-10 inline-block">
                    <span className="text-gray-500 text-sm uppercase tracking-widest block mb-2">Score Final</span>
                    <span className="text-7xl font-black text-yellow-400">{survivalScore}</span>
                 </div>
                 <p className="text-emerald-400 font-bold mb-10">+ {survivalScore} XP Gagnés !</p>
                 <button onClick={startSurvivalMode} className="w-full bg-emerald-500 text-gray-950 font-black text-xl py-5 rounded-2xl uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-4">
                    Rejouer
                 </button>
                 <button onClick={() => setCurrentScreen('revision')} className="text-gray-500 font-bold uppercase tracking-widest text-sm hover:text-white">Fermer</button>
               </div>
            )}
         </div>
       )}
    </div>
  );

  const renderRootsSystem = () => {
    const rootKeys = Object.keys(rootsDatabase);
    const activeRoot = rootsDatabase[activeRootKey];
    return (
    <div className="flex-1 flex flex-col bg-indigo-950 relative overflow-hidden pb-0">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800 via-indigo-950 to-black opacity-80"></div>
       <div className="px-6 py-4 z-10 flex justify-between items-center relative">
          <button onClick={() => setCurrentScreen('dashboard')} className="text-indigo-300 hover:text-white transition-colors">
            <X size={24}/>
          </button>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Concepts Avancés</span>
          <div className="w-6"></div>
       </div>
       <div className="flex-1 flex flex-col items-center px-6 py-8 relative z-10 overflow-y-auto hide-scrollbar">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Le Pouvoir des Racines</h2>
          <p className="text-indigo-300 text-center text-sm mb-8 leading-relaxed">
            En arabe, 85% des mots du Coran dérivent d'une matrice trilitère. Observez la racine <strong className="text-white">{activeRootKey}</strong>.
          </p>
          <div className="relative mb-8">
             <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.6)] z-10 relative border-4 border-indigo-400">
                <span className="font-arabic text-4xl font-bold text-white tracking-widest">{activeRoot.arabic}</span>
             </div>
             <div className="absolute top-full left-1/2 w-0.5 h-8 bg-indigo-500/50 -translate-x-1/2"></div>
          </div>
          <div className="flex space-x-2 overflow-x-auto w-full pb-3 mb-6 hide-scrollbar">
             {rootKeys.map((key) => (
                <button
                   key={key}
                   onClick={() => setActiveRootKey(key)}
                   className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeRootKey === key ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'bg-white/5 text-indigo-200 hover:bg-white/10'}`}
                >
                   {key}
                </button>
             ))}
          </div>
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 animation-fade-in shadow-2xl">
             <div className="text-center mb-5">
                <h3 className="text-2xl font-bold text-white mb-1">{activeRoot.trans}</h3>
                <p className="text-indigo-300 text-xs uppercase tracking-widest">Mots dérivés</p>
             </div>
             <div className="space-y-3">
                {activeRoot.words.map((item, idx) => (
                   <div key={idx} className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center space-x-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                         <div className="flex items-baseline space-x-2 mb-0.5">
                            <span className="font-arabic text-xl font-bold text-white">{item.word}</span>
                            <span className="text-indigo-300 text-xs font-medium">({item.trans})</span>
                         </div>
                         <p className="text-sm font-semibold text-indigo-100">{item.meaning}</p>
                         <p className="text-indigo-300 text-xs mt-0.5">{item.desc}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
    );
  };

  const renderContextualRootModal = () => {
     if (!showContextualRoot || !currentRootWord) return null;
     return (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animation-fade-in" onClick={() => setShowContextualRoot(false)}></div>
           <div className="bg-white w-full h-[75%] rounded-t-[2.5rem] relative z-10 flex flex-col p-6 shadow-2xl transform transition-transform translate-y-0">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <button onClick={() => setShowContextualRoot(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full">
                 <X size={20}/>
              </button>
              <div className="flex-1 overflow-y-auto hide-scrollbar pt-2 pb-6">
                 <div className="flex items-center space-x-2 text-indigo-600 mb-6">
                    <span>📘</span>
                    <span className="font-bold uppercase tracking-wider text-sm">Matrice Trilitère</span>
                 </div>
                 <div className="flex justify-center mb-8">
                    <div className="flex space-x-2">
                       {currentRootWord.root.split('-').map((letter, i) => (
                          <div key={i} className="font-arabic w-16 h-20 bg-indigo-50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center text-4xl font-bold text-indigo-900 shadow-sm">
                             {letter}
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{currentRootWord.trans}</h2>
                    <p className="text-gray-500 font-medium">De cette racine découlent plusieurs mots.</p>
                 </div>
                 <h3 className="font-bold text-gray-900 mb-4 px-2">Exemples dérivés dans le Coran :</h3>
                 <div className="space-y-3">
                    {currentRootWord.derivatives?.map((deriv, idx) => (
                       <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center">
                          <div>
                             <p className="font-bold text-gray-900">{deriv.translit}</p>
                             <p className="text-xs text-gray-500">{deriv.trans}</p>
                          </div>
                          <span className="font-arabic text-xl font-bold text-gray-800">{deriv.arabic}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
     );
  };

  const renderProModal = () => {
    if (!showProModal) return null;
    return (
      <div className="absolute inset-0 z-[100] flex flex-col justify-end">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProModal(false)}></div>
         <div className="bg-white w-full h-[85%] rounded-t-[2.5rem] relative z-10 flex flex-col p-6 shadow-2xl animation-fade-in">
            <button onClick={() => setShowProModal(false)} className="absolute top-4 right-6 text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full">
               <X size={20}/>
            </button>
            <div className="flex-1 overflow-y-auto hide-scrollbar pt-6 pb-20">
               <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-[2rem] rotate-12 flex items-center justify-center shadow-lg shadow-yellow-200">
                     <Crown className="text-white -rotate-12" size={40}/>
                  </div>
               </div>
               <h2 className="text-3xl font-black text-center text-gray-900 mb-2">Passez à Maqra <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">PRO</span></h2>
               <p className="text-center text-gray-500 mb-8 text-sm font-medium px-4">Accélérez votre lecture du Coran avec des outils exclusifs propulsés par l'IA.</p>
               <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                     <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20}/>
                     <div>
                        <p className="font-bold text-gray-900">Maqra AI Illimité</p>
                        <p className="text-xs text-gray-500">Parlez avec votre tuteur pour corriger votre Tajweed 24h/7j.</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-3">
                     <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20}/>
                     <div>
                        <p className="font-bold text-gray-900">Système des Racines Complet</p>
                        <p className="text-xs text-gray-500">Débloquez les 100 matrices essentielles du Coran.</p>
                     </div>
                  </div>
               </div>
               <div className="bg-gray-50 border-2 border-yellow-400 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-bl-lg uppercase">Populaire</div>
                  <div>
                     <p className="font-bold text-gray-900 text-lg">Annuel</p>
                     <p className="text-sm text-green-600 font-bold">4.99€ / mois</p>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-gray-900">59.88€</p>
                     <p className="text-xs text-gray-400 line-through">119.99€</p>
                  </div>
               </div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-20">
               <button className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                  Essayer 7 jours gratuits
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderOnboarding = () => {
    const obBg = onboardingStep === 0 ? 'bg-[#0c1a2e]' : 'bg-white';
    return (
      <div className={`flex-1 flex flex-col relative z-50 h-full overflow-hidden pb-0 ${obBg}`}>
        {onboardingStep > 0 && onboardingStep < 3 && (
          <div className="px-6 pt-5 pb-2 z-10 animation-fade-in flex gap-1.5">
             <div className={`flex-1 h-0.5 rounded-full ${onboardingStep >= 1 ? 'bg-[#0c1a2e]' : 'bg-gray-100'}`}></div>
             <div className={`flex-1 h-0.5 rounded-full ${onboardingStep >= 2 ? 'bg-[#0c1a2e]' : 'bg-gray-100'}`}></div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-7 flex flex-col hide-scrollbar relative">
          {onboardingStep === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 animation-fade-in text-white">
              <span className="font-arabic text-[88px] leading-none text-[#e8c874] mb-4">اقرأ</span>
              <div className="w-8 h-0.5 bg-[#e8c874] mb-5"></div>
              <h1 className="text-[34px] font-bold mb-3.5 text-center tracking-tight">Maqra</h1>
              <p className="text-[#9aa7bd] text-center text-[15px] font-normal leading-relaxed px-3 max-w-[280px]">
                De zéro au Coran : maîtrisez l'arabe classique et la lecture coranique, un verset à la fois.
              </p>
            </div>
          )}
          {onboardingStep === 1 && (
            <div className="flex flex-col flex-1 animation-fade-in pt-8">
              <span className="text-[11px] font-extrabold text-[#0c1a2e] uppercase tracking-[.2em] mb-4">Maqra · Étape 1 / 2</span>
              <h2 className="text-[28px] font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">Où commence votre lecture ?</h2>
              <p className="text-gray-500 text-[15px] mb-7 leading-snug">Chaque parcours du Coran démarre quelque part. Choisissez le vôtre.</p>
              <div className="flex flex-col gap-3">
                 {[
                   { id: 'beginner', num: '01', title: 'Grand débutant', desc: 'Je ne connais pas l\'alphabet arabe.' },
                   { id: 'intermediate', num: '02', title: 'Je connais les lettres', desc: 'Je sais les lire mais pas avec fluidité.' },
                   { id: 'advanced', num: '03', title: 'Intermédiaire', desc: 'Je veux me perfectionner sur le Coran.' }
                 ].map(level => {
                   const picked = userLevel === level.id;
                   return (
                   <button
                      key={level.id}
                      onClick={() => setUserLevel(level.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-[18px] border-[1.5px] text-left transition-all ${picked ? 'bg-[#0c1a2e] border-[#0c1a2e] shadow-[0_10px_24px_rgba(12,26,46,.25)]' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`}
                   >
                      <span className={`flex-shrink-0 w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-mono text-sm font-extrabold ${picked ? 'bg-white/10 text-[#e8c874]' : 'bg-gray-100 text-gray-500'}`}>{level.num}</span>
                      <div className="flex-1">
                         <p className={`font-extrabold text-[17px] ${picked ? 'text-white' : 'text-gray-900'}`}>{level.title}</p>
                         <p className={`text-[13px] mt-0.5 ${picked ? 'text-[#aab6c8]' : 'text-gray-500'}`}>{level.desc}</p>
                      </div>
                      {picked && <span className="flex-shrink-0 w-[26px] h-[26px] rounded-full bg-[#e8c874] text-[#0c1a2e] font-extrabold flex items-center justify-center text-sm">✓</span>}
                   </button>
                   );
                 })}
              </div>
            </div>
          )}
          {onboardingStep === 2 && (
            <div className="flex flex-col flex-1 animation-fade-in pt-8">
              <span className="text-[11px] font-extrabold text-[#0c1a2e] uppercase tracking-[.2em] mb-4">Maqra · Étape 2 / 2</span>
              <h2 className="text-[28px] font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">Combien de temps par jour ?</h2>
              <p className="text-gray-500 text-[15px] mb-7 leading-snug">La régularité — même courte — est la clé de la mémorisation.</p>
              <div className="flex flex-col gap-3">
                 {[
                   { id: 'casual', title: 'Détendu', time: '3 min / jour' },
                   { id: 'regular', title: 'Régulier', time: '10 min / jour' },
                   { id: 'serious', title: 'Sérieux', time: '15 min / jour' }
                 ].map(goal => {
                   const picked = dailyGoal === goal.id;
                   return (
                   <button
                      key={goal.id}
                      onClick={() => setDailyGoal(goal.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-[18px] border-[1.5px] text-left transition-all ${picked ? 'bg-[#0c1a2e] border-[#0c1a2e] shadow-[0_10px_24px_rgba(12,26,46,.25)]' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`}
                   >
                      <p className={`font-extrabold text-[17px] ${picked ? 'text-white' : 'text-gray-900'}`}>{goal.title}</p>
                      <span className="flex items-center gap-2.5">
                         <span className={`font-bold text-sm font-mono ${picked ? 'text-[#aab6c8]' : 'text-gray-400'}`}>{goal.time}</span>
                         {picked && <span className="flex-shrink-0 w-[26px] h-[26px] rounded-full bg-[#e8c874] text-[#0c1a2e] font-extrabold flex items-center justify-center text-sm">✓</span>}
                      </span>
                   </button>
                   );
                 })}
              </div>
            </div>
          )}
          {onboardingStep === 3 && (
            <div className="flex flex-col items-center justify-center flex-1 animation-fade-in">
              <div className="w-[200px] h-0.5 bg-gray-100 rounded-full overflow-hidden mb-7">
                 <div className="w-[60px] h-full bg-[#0c1a2e]" style={{ animation: 'loaderslide 1.1s ease-in-out infinite' }}></div>
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1.5">Préparation de votre parcours</h2>
              <p className="text-gray-400 text-[13px]">Calibration des modules de phonétique</p>
            </div>
          )}
        </div>
        {onboardingStep < 3 && (
          <div className={`p-6 ${obBg}`}>
            <button
              onClick={() => {
                if (onboardingStep === 1 && !userLevel) return;
                if (onboardingStep === 2 && !dailyGoal) return;
                setOnboardingStep(prev => prev + 1);
              }}
              disabled={(onboardingStep === 1 && !userLevel) || (onboardingStep === 2 && !dailyGoal)}
              className={`w-full py-[17px] rounded-2xl font-bold text-base transition-all ${
                ((onboardingStep === 1 && !userLevel) || (onboardingStep === 2 && !dailyGoal))
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : onboardingStep === 0
                  ? 'bg-[#e8c874] text-[#0c1a2e] hover:-translate-y-0.5'
                  : 'bg-[#0c1a2e] text-white hover:-translate-y-0.5'
              }`}
            >
              {onboardingStep === 0 ? 'Commencer' : 'Continuer'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLaunch = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0c1a2e] relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 42%, rgba(232,200,116,.22), transparent 60%)', animation: 'launchglow 2s ease-in-out infinite' }}></div>
      <span className="font-arabic text-[76px] leading-none text-[#e8c874] relative z-10" style={{ animation: 'launchpulse 1.6s ease-in-out infinite' }}>اقرأ</span>
      <p className="text-[#9aa7bd] text-[13px] font-semibold tracking-[.1em] uppercase mt-[22px] relative z-10">Préparation de votre lecture</p>
      <div className="w-[160px] h-0.5 bg-white/15 rounded-full overflow-hidden mt-4 relative z-10">
         <div className="w-full h-full bg-[#e8c874] rounded-full origin-left" style={{ animation: 'launchfill 1.3s ease-out forwards' }}></div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center h-[100dvh] w-screen overflow-hidden bg-[#e3dcc9] font-sans">
      <div className="relative w-full max-w-[560px] h-full bg-[#fbf9f4] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.12)]">

        {currentScreen === 'onboarding' && renderOnboarding()}
        {currentScreen === 'launch' && renderLaunch()}
        {currentScreen === 'dashboard' && renderDashboard()}
        {currentScreen === 'moduleLessons' && renderModuleLessonsList()}
        {currentScreen === 'lessonPreview' && renderLessonPreview()}
        {currentScreen === 'revision' && renderRevision()}
        {currentScreen === 'lesson' && renderLesson()}
        {currentScreen === 'profile' && renderProfile()}
        {currentScreen === 'settings' && renderSettings()}
        {currentScreen === 'ai-tutor' && renderAiTutor()}
        {currentScreen === 'roots' && renderRootsSystem()}
        {currentScreen === 'survival' && renderSurvivalMode()}
        {currentScreen === 'leaderboard' && renderLeaderboard()}
        
        {renderContextualRootModal()}
        {renderProModal()}

        {(currentScreen !== 'onboarding' && currentScreen !== 'launch' && currentScreen !== 'lesson' && currentScreen !== 'ai-tutor' && currentScreen !== 'roots' && currentScreen !== 'survival' && currentScreen !== 'moduleLessons' && currentScreen !== 'lessonPreview') && (
          <div className="absolute bottom-0 left-0 w-full z-50 bg-white border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
             <div className="relative flex items-center px-2 pt-2.5 pb-3.5">
                <button onClick={() => setCurrentScreen('dashboard')} className={`flex-1 flex flex-col items-center gap-1 py-2 ${currentScreen === 'dashboard' ? 'text-sky-600' : 'text-gray-400'}`}>
                   <span className={`w-10 h-7 rounded-[14px] flex items-center justify-center text-[17px] ${currentScreen === 'dashboard' ? 'bg-sky-100' : ''}`}>▦</span>
                   <span className="text-[11px] font-semibold">Modules</span>
                </button>
                <button onClick={() => setCurrentScreen('revision')} className={`flex-1 flex flex-col items-center gap-1 py-2 ${currentScreen === 'revision' ? 'text-sky-600' : 'text-gray-400'}`}>
                   <span className={`w-10 h-7 rounded-[14px] flex items-center justify-center text-[17px] ${currentScreen === 'revision' ? 'bg-sky-100' : ''}`}>📖</span>
                   <span className="text-[11px] font-semibold">Révision</span>
                </button>
                <div className="flex-1 flex flex-col items-center justify-end">
                   <button onClick={() => setCurrentScreen('ai-tutor')} className="w-14 h-14 -mt-8 bg-gradient-to-tr from-sky-400 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_12px_22px_rgba(56,189,248,0.4)] border-4 border-white text-xl hover:scale-105 transition-transform">
                      ✨
                   </button>
                </div>
                <button onClick={() => setCurrentScreen('leaderboard')} className={`flex-1 flex flex-col items-center gap-1 py-2 ${currentScreen === 'leaderboard' ? 'text-sky-600' : 'text-gray-400'}`}>
                   <span className={`w-10 h-7 rounded-[14px] flex items-center justify-center text-[17px] ${currentScreen === 'leaderboard' ? 'bg-sky-100' : ''}`}>🏆</span>
                   <span className="text-[11px] font-semibold">Ligue</span>
                </button>
                <button onClick={() => setCurrentScreen('profile')} className={`flex-1 flex flex-col items-center gap-1 py-2 ${currentScreen === 'profile' ? 'text-sky-600' : 'text-gray-400'}`}>
                   <span className={`w-10 h-7 rounded-[14px] flex items-center justify-center text-[17px] ${currentScreen === 'profile' ? 'bg-sky-100' : ''}`}>👤</span>
                   <span className="text-[11px] font-semibold">Profil</span>
                </button>
             </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animation-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes loaderslide {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(200px); }
        }
        @keyframes launchpulse {
          0%, 100% { opacity: .85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes launchfill {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes launchglow {
          0%, 100% { opacity: .5; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}