
import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { GameBoard } from './components/GameBoard';
import { QuestionModal } from './components/QuestionModal';
import { FinalJeopardy } from './components/FinalJeopardy';
import { ControllerView } from './components/ControllerView';
import { PresetCreator } from './components/PresetCreator';
import { generateGame, generateFinalJeopardy } from './services/geminiService';
import { getPresetGameById, getAvailablePresets, deleteCustomPreset } from './services/presetGameService';
import { connectionService } from './services/connectionService';
import { GameBoardData, GameState, Question, Difficulty, GameMode, Team, FinalJeopardyQuestion, AppMode, QuestionRecord, Avatar, Topic, FullGameData, VisualMode, NetworkMessage } from './types';
import { playSound, setMusicState, getMusicState } from './services/soundService';
import { MUSIC_DATA } from './services/musicData';
import Balatro from './components/Balatro';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
);
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
);
const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" /></svg>
);
const TvIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></svg>
);
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);

// New SVG Icons for Config
const RobotIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>);
const LibraryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
);

const HelpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const MuteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>);
const SoundIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>);

const MusicNoteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>);
const MusicOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);

const TOPICS: { id: Topic, label: string, icon: React.ReactNode }[] = [
  { id: 'GENERAL', label: 'General Mix', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z" /></svg> },
  { id: 'JESUS', label: 'Life of Jesus', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
  { id: 'PROPHECY', label: 'Prophecy', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  { id: 'HISTORY', label: 'Bible History', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8.5a1.5 1.5 0 0 0-1.5-1.5h-7a1.5 1.5 0 0 0-1.5 1.5V21" /></svg> },
  { id: 'PERSONALITIES', label: 'Characters', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { id: 'FRUITAGE', label: 'Qualities', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.74 5.88a1 1 0 0 1 0 1.42l-9.48 9.48a2 2 0 0 1-2.83 0l-2.83-2.83a2 2 0 0 1 0-2.83L12 2.69z" /><path d="M12 2.69l-5.74 5.88a1 1 0 0 0 0 1.42l9.48 9.48a2 2 0 0 0 2.83 0l2.83-2.83a2 2 0 0 0 0-2.83L12 2.69z" /></svg> },
  { id: 'MEETING', label: 'Weekly Meeting', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
];

const DEFAULT_AVATAR: Avatar = { id: 'default', name: 'Default', color: 'bg-gray-600', icon: '👤' };

const TutorialModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-[#2a1a4a] border-2 border-[#ffcc00] rounded-xl max-w-2xl w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl font-bold">✕</button>
      <h2 className="text-3xl font-bold text-[#ffcc00] mb-6 header-font tracking-wide">HOW TO PLAY</h2>

      <div className="space-y-6 text-white/90">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold shrink-0 shadow-lg">1</div>
          <div>
            <h4 className="font-bold text-lg text-blue-300">Start the Host</h4>
            <p className="text-sm opacity-70">Select "TV MODE" on the main screen (Laptop/TV). This is your game board.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold shrink-0 shadow-lg">2</div>
          <div>
            <h4 className="font-bold text-lg text-purple-300">Join Players</h4>
            <p className="text-sm opacity-70">Players open the site on phones, select "CONTROLLER", and enter the Room Code shown in the Lobby.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold shrink-0 shadow-lg">3</div>
          <div>
            <h4 className="font-bold text-lg text-green-300">Play!</h4>
            <p className="text-sm opacity-70">Host selects a clue. Players race to hit their buzzer button. The host judges the answer.</p>
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded border border-white/10 mt-4">
          <h4 className="font-bold text-xs uppercase text-[#ffcc00] mb-2">Keyboard Shortcuts (Host)</h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono opacity-80">
            <div><span className="bg-white/10 px-1 rounded">SPACE</span> : Reveal Answer</div>
            <div><span className="bg-white/10 px-1 rounded">ESC</span> : Close Question</div>
            <div><span className="bg-white/10 px-1 rounded">Y</span> : Mark Correct</div>
            <div><span className="bg-white/10 px-1 rounded">N</span> : Mark Wrong</div>
          </div>
        </div>
      </div>

      <button onClick={onClose} className="w-full mt-8 bg-[#ffcc00] text-black font-bold py-3 rounded uppercase tracking-widest hover:bg-yellow-400 shadow-lg">Got it</button>
    </div>
  </div>
);

const MobileWarningModal = ({ onCancel, onContinue }: { onCancel: () => void, onContinue: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
    <div className="bg-[#1a1a2e] border-2 border-red-500 rounded-xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center relative">
      <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4 border border-red-500 text-3xl">
        ⚠️
      </div>
      <h2 className="text-2xl font-bold text-white mb-2 header-font">TV Mode Not Supported</h2>
      <p className="text-white/70 mb-6 text-sm leading-relaxed">
        The Host View is designed for large screens (TV/Laptop). It may not function correctly on a mobile device.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded uppercase tracking-wider"
        >
          Go Back
        </button>
        <button
          onClick={onContinue}
          className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white/50 hover:text-white font-bold py-3 rounded uppercase tracking-wider text-xs"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  </div>
);

function App() {
  const [appMode, setAppMode] = useState<AppMode>('MENU');
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [gameData, setGameData] = useState<GameBoardData | null>(null);
  // Stored for round 2
  const [fullGameData, setFullGameData] = useState<FullGameData | null>(null);

  const [activeQuestion, setActiveQuestion] = useState<{ catIndex: number; qIndex: number; data: Question } | null>(null);
  const [showAnswerOnTV, setShowAnswerOnTV] = useState(false); // Controls the TV display of answer

  const [loadingMessage, setLoadingMessage] = useState("Preparing...");

  // Host State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [activeBuzzer, setActiveBuzzer] = useState<string | null>(null);
  const [lockedOutTeams, setLockedOutTeams] = useState<Set<string>>(new Set());
  const [questionHistory, setQuestionHistory] = useState<QuestionRecord[]>([]);
  const [gameOverView, setGameOverView] = useState<'SUMMARY' | 'REVIEW'>('SUMMARY');
  const [qrUrl, setQrUrl] = useState('');

  // Wagers State (Map teamId -> amount)
  const [fjWagers, setFjWagers] = useState<Record<string, number>>({});

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [visualMode, setVisualMode] = useState<VisualMode>('CLASSIC');

  // TTS State
  const [announceCode, setAnnounceCode] = useState(true);
  const announceIntervalRef = useRef<number | null>(null);

  // Music State
  const [isMusicOn, setIsMusicOn] = useState(true);
  // Default to local project file. User should place 'background.mp3' in 'public/music/' folder.
  const [musicFile, setMusicFile] = useState<string>(MUSIC_DATA);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Game Config
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [topic, setTopic] = useState<Topic>('GENERAL');
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('AI');

  // Teams
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team 1', avatar: DEFAULT_AVATAR, score: 0, correctAnswers: 0, wrongAnswers: 0 }
  ]);
  const [newTeamName, setNewTeamName] = useState('');

  // Auto-Detect Controller Mode URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Check if PWA (Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (params.get('mode') === 'controller' || isStandalone) {
      setAppMode('CONTROLLER');
    }
  }, []);

  // Sync music state with service
  const toggleMusic = () => {
    const newState = !isMusicOn;
    setIsMusicOn(newState);
    setMusicState(newState);
  };

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, isMusicOn]);


  // Generate QR Code for Host
  useEffect(() => {
    if (appMode === 'HOST' && !qrUrl) {
      // Use clean origin + pathname to avoid appending to existing params
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('mode', 'controller');

      // Theme matching Dark Mode Purple Palette
      QRCode.toDataURL(url.toString(), {
        margin: 2,
        scale: 8,
        color: {
          dark: '#7e57c2', // Light Purple
          light: '#ffffff' // White background for reliability or check if scanner supports transparent
        }
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [appMode, qrUrl]);

  // TTS Announcement Loop
  useEffect(() => {
    if (appMode === 'HOST' && gameState === GameState.LOBBY && roomCode && announceCode) {
      // Clear previous interval if exists
      if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);

      const announce = () => {
        if ('speechSynthesis' in window) {
          // Space out characters for clear reading
          const codeSpoken = roomCode.split('').join(' ');
          const utterance = new SpeechSynthesisUtterance(`Room Code: ${codeSpoken}`);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      };

      // Initial announcement delay
      const initialTimer = setTimeout(announce, 2000);

      // Interval every 60 seconds
      announceIntervalRef.current = window.setInterval(announce, 60000);

      return () => {
        clearTimeout(initialTimer);
        if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
        window.speechSynthesis.cancel();
      };
    } else {
      if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
      window.speechSynthesis.cancel();
    }
  }, [appMode, gameState, roomCode, announceCode]);

  // Apply body class for theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Broadcast Scores and Teams whenever they change
  useEffect(() => {
    if (appMode === 'HOST') {
      connectionService.sendMessage({ type: 'SCORE_UPDATE', payload: teams });
    }
  }, [teams, appMode]);

  // Broadcast Buzzer Status whenever it changes
  useEffect(() => {
    if (appMode === 'HOST') {
      const buzzedTeam = teams.find(t => t.id === activeBuzzer);
      connectionService.sendMessage({
        type: 'BUZZER_STATUS',
        payload: {
          locked: !!activeBuzzer,
          teamId: activeBuzzer,
          teamName: buzzedTeam?.name
        }
      });
    }
  }, [activeBuzzer, appMode, teams]);

  // --- Logic ---

  const lockedOutTeamsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    lockedOutTeamsRef.current = lockedOutTeams;
  }, [lockedOutTeams]);

  // Handle Admin Commands from Host Console
  const handleAdminAction = (msg: NetworkMessage) => {
    if (msg.action === 'REVEAL') {
      setShowAnswerOnTV(true);
    } else if (msg.action === 'SCORE_ADD') {
      if (msg.payload.teamId) {
        playSound('correct');
        updateTeamScore(msg.payload.teamId, 'add');
        setTimeout(() => {
          handleModalClose({ winnerId: msg.payload.teamId, wrongIds: [] });
        }, 1000);
      }
    } else if (msg.action === 'SCORE_SUB') {
      if (msg.payload.teamId) {
        playSound('wrong');
        updateTeamScore(msg.payload.teamId, 'subtract');
        // Keep open if wrong, just clear buzzer
        setActiveBuzzer(null);
      }
    } else if (msg.action === 'CLOSE') {
      handleModalClose();
    } else if (msg.action === 'CLEAR_BUZZER') {
      setActiveBuzzer(null);
    } else if (msg.action === 'TOGGLE_MUSIC') {
      toggleMusic();
    } else if (msg.action === 'RESTART_GAME') {
      restartGame();
    } else if (msg.action === 'SCORE_EDIT') {
      if (msg.payload.teamId && msg.payload.amount) {
        const teamId = msg.payload.teamId;
        const amount = parseInt(msg.payload.amount);
        if (!isNaN(amount)) {
          setTeams(prev => prev.map(t => {
            if (t.id !== teamId) return t;
            return { ...t, score: t.score + amount };
          }));
        }
      }
    }
  };

  const initHost = async () => {
    try {
      // Try enabling music on user interaction
      if (!isMusicOn) {
        setIsMusicOn(true);
        setMusicState(true);
      }

      setLoadingMessage("Creating Room...");
      const code = await connectionService.initializeHost(
        (name, id, avatar) => {
          // On Join
          playSound('join');
          setTeams(prev => {
            // Check if re-joining
            const exists = prev.find(t => t.id === id);
            if (exists) return prev;
            return [...prev, {
              id,
              name,
              avatar: avatar || DEFAULT_AVATAR,
              score: 0,
              correctAnswers: 0,
              wrongAnswers: 0
            }];
          });
        },
        (msg, id) => {
          // On Buzz
          if (msg.type === 'BUZZ') {
            setActiveBuzzer(prev => {
              if (prev) return prev;
              if (lockedOutTeamsRef.current.has(id)) return prev;

              playSound('buzz');
              return id;
            });
          } else if (msg.type === 'ADMIN_ACTION') {
            handleAdminAction(msg);
          } else if (msg.type === 'FJ_WAGER') {
            // Handle Player Wagers in Final Jeopardy
            if (msg.payload && typeof msg.payload.amount === 'number') {
              setFjWagers(prev => ({
                ...prev,
                [id]: msg.payload.amount
              }));
            }
          }
        }
      );
      setRoomCode(code);
      setTeams([]);
      setAppMode('HOST');
      setGameState(GameState.LOBBY);
    } catch (e) {
      console.error(e);
      alert("Failed to initialize host. Check connection.");
    }
  };

  const checkTvCompat = () => {
    if (window.innerWidth < 768) {
      setShowMobileWarning(true);
    } else {
      setAppMode('HOST');
      setGameState(GameState.START);
      // Try start music
      if (!isMusicOn) {
        setIsMusicOn(true);
        setMusicState(true);
      }
    }
  };

  const addTeam = () => {
    if (newTeamName.trim()) {
      setTeams([...teams, { id: Date.now().toString(), name: newTeamName.trim(), avatar: DEFAULT_AVATAR, score: 0, correctAnswers: 0, wrongAnswers: 0 }]);
      setNewTeamName('');
    } else if (teams.length < 4) {
      setTeams([...teams, { id: Date.now().toString(), name: `Team ${teams.length + 1}`, avatar: DEFAULT_AVATAR, score: 0, correctAnswers: 0, wrongAnswers: 0 }]);
    }
  };

  const removeTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
  };

  const updateTeamScore = (teamId: string, type: 'add' | 'subtract') => {
    if (!activeQuestion) return;
    const value = activeQuestion.data.value;

    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t;

      if (type === 'add') {
        return {
          ...t,
          score: t.score + value,
          correctAnswers: t.correctAnswers + 1
        };
      } else {
        return {
          ...t,
          score: t.score - value,
          wrongAnswers: t.wrongAnswers + 1
        };
      }
    }));

    if (type === 'subtract') {
      setLockedOutTeams(prev => new Set(prev).add(teamId));
      setActiveBuzzer(null);
    }
  };

  const startGame = useCallback(async () => {
    playSound('select');
    if (appMode !== 'HOST') setTeams(prev => prev.map(t => ({ ...t, score: 0, correctAnswers: 0, wrongAnswers: 0 })));
    setFullGameData(null);
    setQuestionHistory([]);
    setFjWagers({});
    setGameOverView('SUMMARY');

    if (gameMode === 'PRESET') {
      setGameState(GameState.LIBRARY);
    } else {
      setGameState(GameState.LOADING);
      setLoadingMessage(`Consulting ${topic.toLowerCase()}...`);
      if (appMode === 'HOST') {
        connectionService.sendMessage({ type: 'GAME_STATE', payload: 'PLAYING' });
      }
      try {
        setTimeout(() => setLoadingMessage(`Researching ${difficulty.toLowerCase()} clues...`), 1000);
        setTimeout(() => setLoadingMessage("Building game board..."), 2500);

        const [data, finalQ] = await Promise.all([
          generateGame(difficulty, topic, 1, customThemeInput),
          generateFinalJeopardy()
        ]);
        setGameData(data);
        setFullGameData({
          round1: data,
          final: finalQ
        });
        setGameState(GameState.PLAYING);
      } catch (error) {
        console.error(error);
        setGameState(GameState.ERROR);
      }
    }
  }, [difficulty, topic, gameMode, appMode, customThemeInput]);

  const loadPreset = (presetId: string) => {
    playSound('select');
    setLoadingMessage("Loading Library Data...");
    setGameState(GameState.LOADING);
    if (appMode === 'HOST') {
      connectionService.sendMessage({ type: 'GAME_STATE', payload: 'PLAYING' });
    }
    setTimeout(() => {
      const result = getPresetGameById(presetId);
      if (result) {
        setGameData(result.round1);
        setFullGameData(result);
        setGameState(GameState.PLAYING);
      } else {
        setGameState(GameState.ERROR);
      }
    }, 600);
  };

  const handleDeletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this custom pack?")) {
      deleteCustomPreset(id);
      // Force refresh
      setGameState(GameState.LOBBY);
      setTimeout(() => setGameState(GameState.LIBRARY), 10);
    }
  };

  const handleQuestionClick = (catIndex: number, qIndex: number) => {
    if (!gameData) return;
    const question = gameData.categories[catIndex].questions[qIndex];
    if (!question.isAnswered) {
      setActiveQuestion({ catIndex, qIndex, data: question });
      setActiveBuzzer(null);
      setShowAnswerOnTV(false); // Reset reveal state
      setLockedOutTeams(new Set());

      // Send question details to everyone (Host Remote uses it, Controller ignores answer)
      connectionService.sendMessage({
        type: 'QUESTION_OPEN',
        payload: { text: question.question, value: question.value, answer: question.answer, scripture: question.scripture, question: question.question }
      });
    }
  };

  const handleModalClose = async (result?: { winnerId: string | null, wrongIds: string[] }) => {
    if (!activeQuestion || !gameData) return;
    const newData = { ...gameData };
    newData.categories[activeQuestion.catIndex].questions[activeQuestion.qIndex].isAnswered = true;
    setGameData(newData);

    if (result) {
      setQuestionHistory(prev => [...prev, {
        questionId: activeQuestion.data.id,
        category: gameData.categories[activeQuestion.catIndex].name,
        question: activeQuestion.data.question,
        answer: activeQuestion.data.answer,
        scripture: activeQuestion.data.scripture,
        value: activeQuestion.data.value,
        winnerTeamId: result.winnerId,
        wrongTeamIds: result.wrongIds
      }]);
    }
    setActiveQuestion(null);
    setActiveBuzzer(null);
    setLockedOutTeams(new Set());
    connectionService.sendMessage({ type: 'QUESTION_CLOSE' });

    const allAnswered = newData.categories.every(cat =>
      cat.questions.every(q => q.isAnswered)
    );

    if (allAnswered) {
      // Logic for moving between rounds
      if (gameData.round === 1) {
        setGameState(GameState.ROUND_TRANSITION);
        setLoadingMessage("DOUBLE JEOPARDY");

        setTimeout(async () => {
          // Check if we already have round 2 data (Preset) or need to generate it (AI)
          if (fullGameData?.round2) {
            setGameData(fullGameData.round2);
            setGameState(GameState.PLAYING);
          } else {
            // AI Generation for Round 2
            setLoadingMessage("Generating Harder Questions...");
            try {
              const r2Data = await generateGame(difficulty, topic, 2, customThemeInput);
              setGameData(r2Data);
              setGameState(GameState.PLAYING);
            } catch (e) {
              // Fallback to Final Jeopardy if generation fails
              setGameState(GameState.FINAL_JEOPARDY);
            }
          }
        }, 2500);

      } else {
        // End of Round 2 -> Final Jeopardy
        if (fullGameData?.final && teams.some(t => t.score > 0)) {
          setGameState(GameState.FINAL_JEOPARDY);
        } else {
          setGameState(GameState.GAME_OVER);
          connectionService.sendMessage({ type: 'GAME_OVER', payload: { teams, history: [...questionHistory] } });
        }
      }
    }
  };

  const handleFinalJeopardyEnd = (updatedTeams: Team[]) => {
    setTeams(updatedTeams);
    setGameState(GameState.GAME_OVER);
    connectionService.sendMessage({ type: 'GAME_OVER', payload: { teams: updatedTeams, history: questionHistory } });
  };

  const restartGame = () => {
    playSound('select');
    if (appMode === 'HOST') {
      setGameState(GameState.LOBBY);
    } else {
      setGameState(GameState.START);
      setGameData(null);
    }
  };

  const getGlowClass = (val: number) => {
    if (val <= 200) return 'glow-200';
    if (val <= 400) return 'glow-400';
    if (val <= 600) return 'glow-600';
    if (val <= 800) return 'glow-800';
    return 'glow-1000';
  };

  // Calculate Leader
  const maxScore = Math.max(...teams.map(t => t.score));
  const leaders = teams.filter(t => t.score === maxScore && t.score > 0).map(t => t.id);

  if (appMode === 'CONTROLLER') {
    return <ControllerView onBack={() => setAppMode('MENU')} />;
  }

  if (appMode === 'MENU') {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden relative">
        <Balatro isRotate={true} mouseInteraction={true} color1="#5e35b1" color2="#311b92" color3="#120a1f" spinSpeed={4} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(94,53,177,0.3)_0%,_#090510_80%)] pointer-events-none"></div>

        {/* Music Controls - Absolute Position in Corner */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {isMusicOn && (
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/20 mr-2 transition-all animate-fade-in">
              <span className="text-xs text-white/50"><SoundIcon /></span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ffcc00]"
              />
            </div>
          )}

          <button
            onClick={toggleMusic}
            className={`p-3 rounded-full border border-white/20 transition-all ${isMusicOn ? 'bg-[#ffcc00] text-black shadow-lg shadow-yellow-500/20' : 'bg-black/40 text-white/30 hover:bg-black/60'}`}
            title="Background Music"
          >
            {isMusicOn ? <MusicNoteIcon /> : <MusicOffIcon />}
          </button>
        </div>

        {/* Background Music Player */}
        <div className="absolute top-0 left-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
          {isMusicOn && (
            <audio
              ref={audioRef}
              src={musicFile}
              autoPlay
              loop
              preload="auto"
              onEnded={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(() => { });
                }
              }}
              onPlay={() => {
                if (audioRef.current) audioRef.current.volume = volume;
              }}
              onError={(e) => {
                console.warn("Audio error", e);
              }}
            />
          )}
        </div>

        {/* Autoplay Helper */}
        <div className="hidden">
          {isMusicOn && (
            <button
              ref={(btn) => {
                if (btn && audioRef.current && audioRef.current.paused) {
                  const play = () => {
                    audioRef.current?.play().catch(() => { });
                    document.removeEventListener('click', play);
                    document.removeEventListener('keydown', play);
                    document.removeEventListener('touchstart', play);
                  };
                  document.addEventListener('click', play);
                  document.addEventListener('keydown', play);
                  document.addEventListener('touchstart', play);
                }
              }}
            />
          )}
        </div>

        {/* Modals */}
        {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
        {showMobileWarning && (
          <MobileWarningModal
            onCancel={() => setShowMobileWarning(false)}
            onContinue={() => {
              setShowMobileWarning(false);
              setAppMode('HOST');
              setGameState(GameState.START);
              if (!isMusicOn) {
                setIsMusicOn(true);
                setMusicState(true);
              }
            }}
          />
        )}

        <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col h-full py-8 md:py-12 overflow-y-auto no-scrollbar">
          <div className="text-center mb-8 md:mb-12 shrink-0">
            <h1 className="text-4xl md:text-7xl font-bold header-font text-white drop-shadow-2xl mb-4 tracking-tighter">BIBLE JEOPARDY</h1>
            <div className="h-1 w-32 bg-[#ffcc00] mx-auto rounded-full mb-4 md:mb-6"></div>
            <p className="text-lg md:text-xl text-white/60">The interactive spiritual trivia experience.</p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl mx-auto flex-grow justify-center">

            {/* 1. TV MODE (Server) */}
            <div
              onClick={checkTvCompat}
              className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-white/10 hover:border-[#ffcc00] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,204,0,0.2)] bg-[#2a1a4a]/50 backdrop-blur-sm flex flex-col min-h-[220px] md:min-h-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
              <div className="absolute top-0 right-0 p-6 md:p-8 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500">
                <TvIcon />
              </div>

              <div className="relative z-10 p-6 flex flex-col h-full justify-end">
                <div className="w-12 h-12 rounded-full bg-[#ffcc00] text-black flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <TvIcon />
                </div>
                <h2 className="text-xl md:text-2xl font-bold header-font mb-2">TV DISPLAY</h2>
                <p className="text-white/70 mb-4 text-xs md:text-sm">Use this device as the main game board. Connects to Players.</p>
                <div className="flex items-center text-[#ffcc00] font-bold uppercase tracking-widest text-xs group-hover:gap-2 transition-all">
                  Start Board <span>&rarr;</span>
                </div>
              </div>
            </div>

            {/* 2. PLAYER CONTROLLER (Client) */}
            <div
              onClick={() => {
                setMusicState(false);
                setIsMusicOn(false);
                setAppMode('CONTROLLER');
              }}
              className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-white/10 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-[#1a237e]/30 backdrop-blur-sm flex flex-col min-h-[220px] md:min-h-[280px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0"></div>
              <div className="absolute top-0 right-0 p-6 md:p-8 text-white/5 opacity-50 group-hover:scale-110 transition-transform duration-500">
                <PhoneIcon />
              </div>

              <div className="relative z-10 p-6 flex flex-col h-full justify-end">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <PhoneIcon />
                </div>
                <h2 className="text-xl md:text-2xl font-bold header-font mb-2">PLAYER JOIN</h2>
                <p className="text-white/70 mb-4 text-xs md:text-sm">Join a game as a team using your phone as the buzzer.</p>
                <div className="flex items-center text-blue-400 font-bold uppercase tracking-widest text-xs group-hover:gap-2 transition-all">
                  Join Room <span>&rarr;</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTutorial(true)}
            className="mt-8 mx-auto text-white/40 hover:text-white flex items-center gap-2 transition-colors uppercase text-xs font-bold tracking-widest pb-4"
          >
            <HelpIcon /> How to Play
          </button>
        </div>
      </div>
    );
  }

  // HOST APP (TV DISPLAY)
  return (
    <div className="h-screen w-screen font-sans flex flex-col overflow-hidden bg-black text-white transition-colors duration-300 relative">
      <Balatro isRotate={true} mouseInteraction={true} color1="#5e35b1" color2="#311b92" color3="#120a1f" spinSpeed={4} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(94,53,177,0.3)_0%,_#090510_80%)] pointer-events-none"></div>

      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* Background Music Player (Host Mode) */}
      <div className="absolute top-0 left-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
        {isMusicOn && (
          <audio
            ref={audioRef}
            src={musicFile}
            autoPlay
            loop
            onPlay={() => {
              if (audioRef.current) audioRef.current.volume = volume;
            }}
            onError={(e) => {
              console.warn("Audio file failed to load.");
            }}
          />
        )}
      </div>

      {/* Header - Now Sticky & Centered */}
      <header className="jeopardy-texture shadow-lg flex-none z-50 transition-colors duration-300 sticky top-0 bg-[#120a1f]/95 backdrop-blur-md border-b-2 border-[#7e57c2]">
        <div className="max-w-[1920px] mx-auto px-6 h-24 flex justify-between items-center relative">

          {/* Logo / Title (Left) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="p-3 rounded-lg bg-black/40 shadow-inner border border-white/10 hidden lg:block">
              <BookIcon />
            </div>
            <h1 className="text-xl md:text-3xl font-bold header-font tracking-wide text-white drop-shadow-md hidden lg:block">
              BIBLE JEOPARDY
            </h1>
          </div>

          {/* 3D SCOREBOARD (Absolutely Centered) */}
          {(gameState === GameState.PLAYING || gameState === GameState.FINAL_JEOPARDY) ? (
            <div className="flex items-center justify-center gap-3 md:gap-6 absolute left-1/2 transform -translate-x-1/2 w-full px-4 md:w-auto pointer-events-none">
              {[...teams].sort((a, b) => b.score - a.score).map((team) => {
                const isLeader = leaders.includes(team.id);
                return (
                  <div
                    key={team.id}
                    className={`
                      relative flex flex-col items-center justify-center pointer-events-auto
                      bg-[#2a1a4a]/90 backdrop-blur-md rounded-lg
                      transition-all duration-500 ease-out
                      ${isLeader
                        ? 'border-2 border-[#ffcc00] shadow-[0_0_20px_rgba(255,204,0,0.5)] transform scale-110 z-10 py-2 px-6 min-w-[110px]'
                        : 'border border-white/10 opacity-90 scale-95 py-1 px-4 min-w-[90px] grayscale-[0.3]'}
                    `}
                  >
                    {isLeader && (
                      <div className="absolute -top-4 animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        <CrownIcon />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-inner ${team.avatar.color}`}>
                        {team.avatar.icon}
                      </div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest ${isLeader ? 'text-[#ffcc00]' : 'text-white/60'}`}>
                        {team.name}
                      </div>
                    </div>

                    <div className={`font-bold header-font drop-shadow-md lcd-font tracking-widest leading-none ${isLeader ? 'text-xl text-white' : 'text-lg text-white/80'}`}>
                      ${team.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Non-Game Title Centered */
            <h1 className="lg:hidden text-2xl font-bold header-font tracking-wide text-white drop-shadow-md absolute left-1/2 -translate-x-1/2">
              JEOPARDY
            </h1>
          )}

          {/* Right Controls - Only show locally if NOT host mode, or as backup */}
          {appMode !== 'HOST' && (
            <div className="flex items-center gap-4 flex-shrink-0">
              {isMusicOn && (
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/20 transition-all animate-fade-in">
                  <span className="text-xs text-white/50"><SoundIcon /></span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ffcc00]"
                  />
                </div>
              )}

              <button
                onClick={toggleMusic}
                className={`p-2 rounded-full border border-white/20 transition-all ${isMusicOn ? 'bg-[#ffcc00] text-black shadow-lg shadow-yellow-500/20' : 'bg-black/40 text-white/30'}`}
                title="Toggle Background Music"
              >
                {isMusicOn ? <MusicNoteIcon /> : <MusicOffIcon />}
              </button>

              <button
                onClick={() => setShowTutorial(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Help / Tutorial"
              >
                <HelpIcon />
              </button>
              <button
                onClick={restartGame}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                title="Restart Game"
              >
                <RefreshIcon />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-[1920px] mx-auto relative z-10">

        {/* START SCREEN */}
        {gameState === GameState.START && (
          <div className="w-full max-w-4xl p-12 rounded-xl shadow-2xl animate-fade-in flex flex-col items-center justify-center text-center gap-8 jeopardy-texture border-t-4 border-[#ffcc00]">
            <h2 className="text-6xl font-bold header-font text-white text-shadow-lg tracking-wide">TV DISPLAY</h2>
            <p className="text-xl opacity-80 max-w-lg text-white">
              This screen is the main game board. Connect "Host Remote" and "Players" using the Room Code on the next screen.
            </p>

            <div className="flex gap-6 mt-4">
              <button
                onClick={initHost}
                className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-lg text-xl shadow-lg transition-transform hover:scale-105 uppercase tracking-wider"
              >
                Create Room
              </button>
            </div>

            <button onClick={() => setAppMode('MENU')} className="text-sm underline opacity-50 mt-4 hover:opacity-100">Back to Menu</button>
          </div>
        )}

        {/* LOBBY */}
        {gameState === GameState.LOBBY && (
          <div className="w-full max-w-7xl p-6 rounded-xl shadow-2xl animate-fade-in flex flex-col h-[85vh] jeopardy-texture">
            <div className="flex justify-between items-start mb-6 border-b border-white/20 pb-4">
              <div>
                <h2 className="text-4xl font-bold header-font text-white text-shadow-md">LOBBY</h2>
                <p className="opacity-70 text-base mt-1">Waiting for players to join...</p>
              </div>
              {roomCode ? (
                <div className="flex gap-6 items-center">

                  {qrUrl && (
                    <div className="p-2 rounded-lg shadow-lg hidden md:block animate-pop border-2 border-[#ffcc00] bg-[#120a1f]">
                      <img src={qrUrl} alt="Join Game QR" className="w-24 h-24" />
                    </div>
                  )}
                  <div className="text-right bg-black/30 p-3 rounded-lg border border-white/10 shadow-inner">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">Room Code</div>
                    <div className="text-5xl font-bold header-font text-[#ffcc00] tracking-widest text-shadow-sm lcd-font">{roomCode}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-grow overflow-auto mb-6 pr-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="p-4 rounded-lg bg-black/30 border border-white/10 shadow-[0_4px_0_rgba(255,255,255,0.1)] hover:translate-y-1 transition-transform flex flex-col items-center justify-between animate-pop backdrop-blur-sm h-40 relative overflow-hidden group">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white/20 mb-2 ${team.avatar.color}`}>
                      {team.avatar.icon}
                    </div>
                    <span className="font-bold text-lg text-white truncate w-full text-center">{team.name}</span>
                    <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] uppercase font-bold text-white/60 mt-1">{team.avatar.name}</div>
                    <button onClick={() => removeTeam(team.id)} className="absolute top-2 right-2 text-white/20 hover:text-red-400 transition-colors"><TrashIcon /></button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - teams.length) }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center opacity-30 bg-black/10 h-40">
                    <span className="font-bold uppercase tracking-widest text-xs">Empty Slot</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-stretch p-6 bg-black/20 rounded-lg border border-white/5 shadow-inner">
              {/* Manual Add & Visual Theme */}
              <div className="w-full md:w-1/4 flex flex-col gap-4">
                <div>
                  <p className="text-xs uppercase font-bold opacity-60 mb-2">Add Manually</p>
                  <div className="flex gap-2">
                    <input
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      className="flex-grow p-3 rounded border border-white/20 bg-black/30 text-white placeholder-white/30 focus:border-[#ffcc00] outline-none text-sm"
                      placeholder="Team Name"
                    />
                    <button onClick={addTeam} className="bg-green-700 hover:bg-green-600 text-white px-4 rounded font-bold shadow-md">+</button>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase font-bold opacity-60 mb-2">Visual Theme</p>
                  <select
                    value={visualMode}
                    onChange={(e) => setVisualMode(e.target.value as VisualMode)}
                    className="w-full p-2 bg-black/30 border border-white/20 rounded text-sm font-bold uppercase"
                  >
                    <option value="CLASSIC">Classic Blue</option>
                    <option value="NEON">Neon Cyber</option>
                    <option value="ANCIENT">Ancient Scroll</option>
                  </select>
                </div>
              </div>

              {/* GAME CONFIGURATION */}
              <div className="w-full md:w-3/4 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                  <p className="text-xs uppercase font-bold opacity-60">Game Configuration</p>

                  {/* Mode Toggle */}
                  <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setGameMode('AI')}
                      className={`px-4 py-1 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 ${gameMode === 'AI' ? 'bg-blue-600 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
                    >
                      <RobotIcon /> AI Mode
                    </button>
                    <button
                      onClick={() => setGameMode('PRESET')}
                      className={`px-4 py-1 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 ${gameMode === 'PRESET' ? 'bg-[#ffcc00] text-black shadow-md' : 'text-white/40 hover:text-white'}`}
                    >
                      <LibraryIcon /> Library
                    </button>
                  </div>
                </div>

                {gameMode === 'AI' ? (
                  <div className="flex gap-4 items-start animate-fade-in h-full">
                    <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-2">
                      {TOPICS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTopic(t.id)}
                          className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${topic === t.id ? 'bg-blue-900 border-blue-400 shadow-md transform scale-105' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">{t.icon}</div>
                          <span className="text-xs font-bold uppercase">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 w-48 shrink-0 h-full">
                      <label className="text-[10px] uppercase font-bold opacity-50">Difficulty</label>
                      <div className="flex gap-1 mb-2">
                        {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
                          <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            className={`flex-1 py-1 text-[10px] font-bold border rounded ${difficulty === diff ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white/50'}`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>

                      {topic === 'MEETING' && (
                        <div className="animate-fade-in flex flex-col gap-1 mb-2">
                          <label className="text-[10px] uppercase font-bold text-[#ffcc00]">Article / Theme Title</label>
                          <input
                            value={customThemeInput}
                            onChange={(e) => setCustomThemeInput(e.target.value)}
                            placeholder="e.g. Watchtower Article 40"
                            className="w-full p-2 text-xs bg-black/40 border border-[#ffcc00] rounded text-white"
                          />
                        </div>
                      )}

                      <button
                        onClick={startGame}
                        disabled={teams.length < 1 || (topic === 'MEETING' && !customThemeInput.trim())}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg text-lg uppercase flex-grow transition-all"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between h-full animate-fade-in bg-black/20 p-4 rounded border border-[#ffcc00]/20">
                    <div>
                      <h4 className="font-bold text-[#ffcc00] text-lg mb-1">Select a Premade Game</h4>
                      <p className="text-sm text-white/60">Choose from curated packs or your own creations.</p>
                      <span className="text-xs text-green-400 font-bold uppercase tracking-wider mt-1 block">Offline Ready</span>
                    </div>
                    <button
                      onClick={startGame}
                      disabled={teams.length < 1}
                      className="px-8 py-4 bg-[#ffcc00] hover:bg-yellow-400 disabled:opacity-50 text-black font-bold rounded-lg shadow-lg text-lg uppercase flex items-center gap-2"
                    >
                      <LibraryIcon /> Open Library
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {gameState === GameState.LIBRARY && (
          <div className="w-full max-w-6xl p-8 rounded-xl shadow-2xl animate-fade-in flex flex-col h-[85vh] jeopardy-texture overflow-hidden">
            <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold header-font text-white text-shadow-md">GAME LIBRARY</h2>
                <p className="opacity-70 text-lg mt-2">Select a topic to begin.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setGameState(GameState.CREATOR)} className="px-6 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-bold uppercase transition-colors shadow-md">Create Custom Pack</button>
                <button onClick={() => setGameState(GameState.LOBBY)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-bold uppercase transition-colors">Back</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
              {getAvailablePresets().map(preset => (
                <div
                  key={preset.id}
                  onClick={() => loadPreset(preset.id)}
                  className="p-8 rounded-xl bg-black/30 border-2 border-[#5e35b1] hover:border-[#ffcc00] hover:bg-black/50 cursor-pointer transition-all transform hover:scale-[1.02] shadow-lg group relative overflow-hidden"
                >
                  {preset.isCustom && (
                    <button
                      onClick={(e) => handleDeletePreset(e, preset.id)}
                      className="absolute top-2 left-2 p-2 text-white/20 hover:text-red-500 z-20"
                      title="Delete Pack"
                    >
                      <TrashIcon />
                    </button>
                  )}
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 text-6xl transition-opacity">{preset.icon}</div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold header-font text-[#ffcc00] mb-3">{preset.title}</h3>
                    <p className="text-white/80 leading-relaxed line-clamp-2 min-h-[3rem]">{preset.description}</p>

                    <div className="mt-4 flex gap-2">
                      {preset.hasTwoRounds && (
                        <span className="px-2 py-1 bg-purple-600/50 rounded text-[10px] font-bold uppercase border border-purple-400/30">Double Jeopardy</span>
                      )}
                      {preset.isCustom && (
                        <span className="px-2 py-1 bg-blue-600/50 rounded text-[10px] font-bold uppercase border border-blue-400/30">Custom</span>
                      )}
                    </div>

                    <div className="mt-6 flex items-center text-sm font-bold text-blue-300 group-hover:text-blue-200">
                      LOAD GAME &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATOR */}
        {gameState === GameState.CREATOR && (
          <PresetCreator
            onBack={() => setGameState(GameState.LIBRARY)}
            onSave={() => setGameState(GameState.LIBRARY)}
          />
        )}

        {/* LOADING / TRANSITION */}
        {(gameState === GameState.LOADING || gameState === GameState.ROUND_TRANSITION) && (
          <div className="text-center p-12 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in">
            <div className="w-20 h-20 border-8 border-transparent border-t-[#ffcc00] rounded-full animate-spin mx-auto mb-8 bg-white/5"></div>
            <p className="text-3xl font-bold animate-pulse header-font text-white text-shadow-md">
              {loadingMessage}
            </p>
          </div>
        )}

        {/* GAME BOARD */}
        {gameState === GameState.PLAYING && gameData && (
          <div className="w-full h-full flex flex-col animate-fade-in relative">
            <div className="absolute top-2 left-4 text-xs font-bold uppercase opacity-50 tracking-widest pointer-events-none">
              {gameData.round === 2 ? "ROUND 2: DOUBLE JEOPARDY" : "ROUND 1: JEOPARDY"}
            </div>
            <GameBoard data={gameData} visualMode={visualMode} onQuestionClick={handleQuestionClick} />
          </div>
        )}

        {/* FINAL JEOPARDY */}
        {gameState === GameState.FINAL_JEOPARDY && fullGameData?.final && (
          <FinalJeopardy
            data={fullGameData.final}
            teams={teams}
            onGameEnd={handleFinalJeopardyEnd}
            externalWagers={fjWagers} // Pass wagers from controllers down to component
          />
        )}

        {/* ERROR */}
        {gameState === GameState.ERROR && (
          <div className="text-center max-w-md mx-auto p-8 bg-black/80 rounded-lg shadow-xl border-t-4 border-red-500 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
            <p className="mb-4">Something went wrong. Please try again.</p>
            <button onClick={restartGame} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors">Restart</button>
          </div>
        )}

        {/* GAME OVER & STATS */}
        {gameState === GameState.GAME_OVER && (
          <div className="w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col h-[85vh] jeopardy-texture">
            {/* Tab Bar */}
            <div className="flex border-b border-white/20 bg-black/30">
              <button
                onClick={() => setGameOverView('SUMMARY')}
                className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${gameOverView === 'SUMMARY' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
              >
                Scoreboard
              </button>
              <button
                onClick={() => setGameOverView('REVIEW')}
                className={`flex-1 py-4 text-center font-bold uppercase tracking-wider transition-colors ${gameOverView === 'REVIEW' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}
              >
                Review Questions
              </button>
            </div>

            {gameOverView === 'SUMMARY' && (
              <>
                <div className="bg-black/20 p-8 text-center text-white shrink-0 border-b border-white/10">
                  <h2 className="text-6xl font-bold header-font mb-2 text-shadow-lg tracking-wide text-[#ffcc00]">GAME SUMMARY</h2>
                </div>

                <div className="flex-grow overflow-auto p-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-white/20 text-white/60">
                        <th className="p-4 uppercase text-sm tracking-wider">Rank</th>
                        <th className="p-4 uppercase text-sm tracking-wider">Character</th>
                        <th className="p-4 uppercase text-sm tracking-wider">Team</th>
                        <th className="p-4 text-center uppercase text-sm tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...teams].sort((a, b) => b.score - a.score).map((team, index) => (
                        <tr key={team.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="p-6 font-bold text-2xl">
                            {index === 0 ? '👑 ' : ''}{index + 1}
                          </td>
                          <td className="p-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${team.avatar.color} shadow-md`}>
                              {team.avatar.icon}
                            </div>
                          </td>
                          <td className="p-6 font-bold text-3xl header-font">{team.name}</td>
                          <td className="p-6 text-center">
                            <span className="text-4xl header-font font-black text-3d-gold tracking-widest">
                              ${team.score.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {gameOverView === 'REVIEW' && (
              <div className="flex-grow overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {questionHistory.length === 0 && <div className="col-span-3 text-center opacity-50 p-12">No questions were answered.</div>}
                {questionHistory.map((rec) => (
                  <div key={rec.questionId} className={`p-6 rounded-lg border bg-black/30 flex flex-col ${getGlowClass(rec.value)} relative`}>
                    <div className="mb-2 flex justify-between items-start">
                      <span className="text-xs font-bold uppercase opacity-70 bg-white/10 px-2 py-1 rounded">{rec.category}</span>
                      <span className={`text-xl font-bold text-[#ffcc00]`}>${rec.value}</span>
                    </div>
                    <p className="text-sm opacity-90 mb-4 flex-grow">{rec.question}</p>

                    <div className="bg-white/5 p-3 rounded mb-3 border-l-2 border-[#ffcc00]">
                      <p className="text-xs uppercase opacity-60">Answer</p>
                      <p className="font-bold">{rec.answer}</p>
                    </div>

                    <a
                      href={`https://www.jw.org/en/search/?q=${encodeURIComponent(rec.scripture)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center block bg-[#ffcc00]/20 hover:bg-[#ffcc00]/30 text-[#ffcc00] py-2 rounded text-sm font-bold border border-[#ffcc00]/50 transition-colors"
                    >
                      📖 {rec.scripture}
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="p-8 border-t border-white/10 flex justify-center bg-black/20">
              <button onClick={restartGame} className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded text-xl shadow-lg transition-transform hover:scale-105 uppercase tracking-wider">New Game</button>
            </div>
          </div>
        )}
      </main>

      {/* Active Question Modal */}
      {activeQuestion && (
        <QuestionModal
          question={activeQuestion.data}
          teams={teams}
          activeBuzzer={activeBuzzer}
          showAnswer={showAnswerOnTV}
          onUpdateScore={(teamId, type) => updateTeamScore(teamId, type)}
          onClearBuzzer={() => setActiveBuzzer(null)}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default App;
