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
  const [matchLeft, setMatchLeft] = useState(null);
  const [matchRight, setMatchRight] = useState(null);
  const [matchWrong, setMatchWrong] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [buildSentence, setBuildSentence] = useState([]);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
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

  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'ai', text: 'مرحباً ! (Marhaban) Prêt à pratiquer la lecture coranique et le Tajweed aujourd\'hui ? 📖' },
    { id: 2, sender: 'user', text: 'Oui, comment bien prononcer les lettres emphatiques ?' },
    { id: 3, sender: 'ai', text: 'Excellente question. Pour le "Sad" (ص), la langue s\'élève vers le palais comparativement au "Sin" (س). Écoute et répète : ص - س' }
  ]);

  const [revisionCards] = useState([
    { id: 1, front: 'مَرْحَبًا', back: 'Marhaban (Bonjour)', hint: 'Vocabulaire' },
    { id: 2, front: 'ص', back: 'Sad (Lettre emphatique)', hint: 'Qaïda Phonétique' },
    { id: 3, front: 'س', back: 'Sin (Lettre légère)', hint: 'Qaïda Phonétique' }
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
      total: 9,
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
      total: 11,
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
       total: 10,
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
       total: 1,
       tags: ['Morphologie', 'Grammaire'],
       color: 'bg-indigo-100',
       tagColor: 'bg-indigo-100 text-indigo-800'
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
      { type: 'success', instruction: 'Sourate Quraysh validée ! Parcours Lecture Coranique terminé. +25 XP' }
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
      { type: 'success', instruction: 'Leçon 10 : parcours Fréquence Lexicale terminé, 30 mots mémorisés ! +20 XP' }
    ]
  ];

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

  useEffect(() => {
    serverSyncedRef.current = false;
    if (!user || !supabase) return;
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const { data: moduleRows } = await supabase.from('module_progress').select('*').eq('user_id', user.id);
      if (cancelled) return;

      const localHasProgress = userXp !== 140 || modules.some(m => m.progress > 0);
      const serverIsDefault = !profile || (profile.xp === 140 && (!moduleRows || moduleRows.length === 0));

      if (serverIsDefault && localHasProgress) {
        await supabase.from('profiles').upsert({
          id: user.id, xp: userXp, notifications_enabled: notificationsEnabled,
          sound_enabled: soundEnabled, dark_mode: darkMode, learning_focus: learningFocus,
          updated_at: new Date().toISOString()
        });
        await supabase.from('module_progress').upsert(
          modules.map(m => ({ user_id: user.id, module_id: m.id, progress: m.progress, updated_at: new Date().toISOString() }))
        );
      } else {
        if (profile) {
          setUserXp(profile.xp);
          setNotificationsEnabled(profile.notifications_enabled);
          setSoundEnabled(profile.sound_enabled);
          setDarkMode(profile.dark_mode);
          setLearningFocus(profile.learning_focus);
        }
        if (moduleRows && moduleRows.length > 0) {
          setModules(prev => prev.map(m => {
            const row = moduleRows.find(r => r.module_id === m.id);
            return row ? { ...m, progress: row.progress } : m;
          }));
        }
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
    setBuildSentence([]);
    setReadWordsStatus({});
    setActiveReadWord(null);
  };

  const handleModuleClick = (moduleId) => {
    setActiveModuleId(moduleId);
    const mod = modules.find(m => m.id === moduleId);
    const pickLesson = (lessons) => lessons[Math.min(mod ? mod.progress : 0, lessons.length - 1)];

    if (moduleId === 1) {
      setActiveLesson(pickLesson(qaidaLessons));
      resetLessonStates();
      setCurrentScreen('lesson');
    } else if (moduleId === 2) {
      setActiveLesson(pickLesson(quranLessons));
      resetLessonStates();
      setCurrentScreen('lesson');
    } else if (moduleId === 3) {
       setActiveLesson(pickLesson(freqVocabLessons));
       resetLessonStates();
       setCurrentScreen('lesson');
    } else if (moduleId === 4) {
      setCurrentScreen('roots');
    }
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
    setIsCardFlipped(false);
    if (currentCardIndex < revisionCards.length - 1) {
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

              <div className="bg-white w-full max-w-[280px] py-5 px-5 rounded-[2.5rem] shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center justify-center mb-3">
                <span className="font-arabic text-[64px] font-bold text-gray-900 leading-none mb-4">{stepData.letter}</span>
                <span className="text-[12px] text-gray-500 font-semibold tracking-wide bg-white px-3 py-1 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-4">{stepData.name}</span>
                {stepData.mnemonic && (
                  <div className="flex items-center space-x-2 bg-sky-50 px-3 py-1.5 rounded-2xl border border-sky-100">
                    <span className="text-lg">{stepData.illustration}</span>
                    <span className="font-arabic text-[13px] font-bold text-sky-900">{stepData.mnemonic}</span>
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

          {stepData.type === 'qcm' && (
            <div className="flex flex-col flex-1 animation-fade-in justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-8 text-center">{stepData.instruction}</h2>

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

                  const fontSizeClass = opt.length > 2 ? 'text-[20px]' : 'text-[40px]';

                  return (
                    <button
                      key={idx}
                      onClick={() => !isAnswerChecked && setSelectedAnswer(idx)}
                      disabled={isAnswerChecked}
                      className={`font-arabic aspect-square rounded-[22px] flex items-center justify-center font-bold shadow-sm border-4 transition-all ${fontSizeClass} ${btnClass}`}
                    >
                      <span className="text-center w-full px-1 break-words">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                    {stepData.rightCol.map((item) => {
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
    if (currentCardIndex === -1) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f3efe4] relative overflow-hidden pb-32">
           <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <Check size={48} strokeWidth={3}/>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Tout est à jour !</h2>
           <p className="text-gray-500 text-center text-sm px-4">Vous avez révisé toutes vos cartes pour aujourd'hui.</p>
        </div>
      );
    }
    const card = revisionCards[currentCardIndex];
    return (
      <div className="flex-1 flex flex-col bg-[#f3efe4] relative overflow-hidden pb-32">
        <div className="px-6 pt-4 pb-2">
           <h1 className="text-3xl font-bold text-gray-900">Révisions</h1>
           <div className="flex items-center space-x-2 mt-1">
             <Flame className="text-orange-500" size={16}/>
             <p className="text-gray-600 font-medium text-sm">{revisionCards.length - currentCardIndex} cartes pour aujourd'hui</p>
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
                 <span className="font-arabic text-[72px] font-bold text-gray-900 leading-none mb-4">{card.front}</span>
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

        {(currentScreen !== 'onboarding' && currentScreen !== 'launch' && currentScreen !== 'lesson' && currentScreen !== 'ai-tutor' && currentScreen !== 'roots' && currentScreen !== 'survival') && (
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