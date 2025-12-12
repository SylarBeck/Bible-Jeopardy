import React, { useState, useRef, useEffect } from 'react';
import { connectionService } from '../services/connectionService';
import { playSound } from '../services/soundService';
import { Team, QuestionRecord, Avatar } from '../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Polyfill for React Three Fiber JSX types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      torusGeometry: any;
      sphereGeometry: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      torusGeometry: any;
      sphereGeometry: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
    }
  }
}

interface ControllerViewProps {
  onBack: () => void;
}

type ControllerState = 'CONNECT' | 'SELECT_AVATAR' | 'LOBBY' | 'GAME' | 'FINAL_JEOPARDY' | 'GAME_OVER';

interface CurrentQuestion {
  text: string;
  value: number;
}

interface FJState {
  phase: 'BETTING' | 'PLAYING' | 'REVEAL_ANSWER';
  category: string;
  question?: string;
}

const AVATARS: Avatar[] = [
  { id: 'david', name: 'David', color: 'bg-blue-600', icon: '👑' },
  { id: 'moses', name: 'Moses', color: 'bg-stone-600', icon: '📜' },
  { id: 'esther', name: 'Esther', color: 'bg-purple-600', icon: '💎' },
  { id: 'noah', name: 'Noah', color: 'bg-blue-400', icon: '🌊' },
  { id: 'daniel', name: 'Daniel', color: 'bg-orange-700', icon: '🦁' },
  { id: 'mary', name: 'Mary', color: 'bg-sky-500', icon: '🕊️' },
  { id: 'paul', name: 'Paul', color: 'bg-red-700', icon: '⛵' },
  { id: 'peter', name: 'Peter', color: 'bg-teal-600', icon: '🐟' },
];

// --- 3D COMPONENTS ---

const BuzzerButton3D = ({ 
  pressed, 
  locked, 
  onPress 
}: { 
  pressed: boolean, 
  locked: boolean, 
  onPress: () => void 
}) => {
  const buttonRef = useRef<THREE.Group>(null);
  
  // Animation logic
  useFrame((state, delta) => {
    if (buttonRef.current) {
      const targetY = pressed ? 0.2 : 0.6;
      const targetScale = pressed ? 0.98 : 1.0;
      buttonRef.current.position.y = THREE.MathUtils.lerp(buttonRef.current.position.y, targetY, delta * 20);
      // Subtle squish
      buttonRef.current.scale.setScalar(THREE.MathUtils.lerp(buttonRef.current.scale.x, targetScale, delta * 20));
    }
  });

  return (
    <group>
      {/* Base/Housing - Metallic Bezel */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.5, 1.5, 64]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Inner Black Ring */}
      <mesh position={[0, 0.76, 0]}>
         <cylinderGeometry args={[2.6, 2.6, 0.1, 64]} />
         <meshStandardMaterial color="#111" />
      </mesh>

      {/* The Button Plunger */}
      <group ref={buttonRef} position={[0, 0.6, 0]}>
        <mesh 
          onPointerDown={(e) => {
             e.stopPropagation();
             onPress();
          }}
          castShadow 
          receiveShadow
        >
          {/* Main Dome */}
          <sphereGeometry args={[2.5, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          <meshStandardMaterial 
            color={locked ? "#333" : "#D90429"} 
            emissive={locked ? "#000" : "#EF233C"}
            emissiveIntensity={locked ? 0 : 0.3}
            roughness={0.15} 
            metalness={0.2} 
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
};

export const ControllerView: React.FC<ControllerViewProps> = ({ onBack }) => {
  const [state, setState] = useState<ControllerState>('CONNECT');
  const [roomCode, setRoomCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  
  const [myTeamId, setMyTeamId] = useState<string>('');
  const [error, setError] = useState('');
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  // Game State sync
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [buzzerLockedBy, setBuzzerLockedBy] = useState<{name: string, isMe: boolean} | null>(null);
  const [fjState, setFjState] = useState<FJState | null>(null);
  const [gameHistory, setGameHistory] = useState<QuestionRecord[]>([]);
  
  // Review Mode in Game Over
  const [reviewTab, setReviewTab] = useState<'WON' | 'MISSED'>('WON');

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore haptic errors
      }
    }
  };

  const proceedToAvatar = () => {
    triggerHaptic(20);
    if (!roomCode || !teamName) {
      setError("Please enter both Room Code and Team Name");
      return;
    }
    setError('');
    setState('SELECT_AVATAR');
  };
  
  const handleConnect = async (avatar: Avatar) => {
    triggerHaptic([10, 30, 10]);
    try {
      setError('');
      setConnectionStatus('Initializing...');
      await connectionService.initializeClient(
        roomCode.toUpperCase(),
        teamName,
        avatar,
        () => {
          setTimeout(() => {
            setState('LOBBY');
            setConnectionStatus('');
          }, 800);
        },
        (data) => {
          if (data.type === 'GAME_STATE') {
             if (data.payload === 'PLAYING') setState('GAME');
          } else if (data.type === 'SCORE_UPDATE') {
             const allTeams = data.payload as Team[];
             setTeams(allTeams);
             
             // @ts-ignore
             const myId = connectionService.peer?.id;
             if (myId) setMyTeamId(myId);
             
             const myTeam = allTeams.find(t => t.id === myId);
             if (myTeam) setScore(myTeam.score);
             
          } else if (data.type === 'QUESTION_OPEN') {
            setCurrentQuestion(data.payload);
            setBuzzerLockedBy(null); 
          } else if (data.type === 'QUESTION_CLOSE') {
            setCurrentQuestion(null);
            setBuzzerLockedBy(null);
          } else if (data.type === 'GAME_OVER') {
            setTeams(data.payload.teams);
            if (data.payload.history) setGameHistory(data.payload.history);
            setState('GAME_OVER');
          } else if (data.type === 'BUZZER_STATUS') {
             const { locked, teamId, teamName } = data.payload;
             if (locked) {
                // @ts-ignore
                const myId = connectionService.peer?.id;
                setBuzzerLockedBy({ name: teamName, isMe: teamId === myId });
             } else {
                setBuzzerLockedBy(null);
             }
          } else if (data.type === 'FJ_UPDATE') {
             setState('FINAL_JEOPARDY');
             setFjState(data.payload);
          }
        },
        (status) => {
          setConnectionStatus(status);
        }
      );
    } catch (err) {
      setError("Could not connect. Check the code and try again.");
      setConnectionStatus('');
      setState('CONNECT');
    }
  };

  const handleBuzz = () => {
    if (!currentQuestion || buzzerLockedBy) {
      // Optional: error haptic if locked
      if (buzzerLockedBy) triggerHaptic([50, 50, 50]);
      return; 
    }
    
    setIsBuzzing(true);
    triggerHaptic(80); // Distinct heavy buzz for successful press
    
    setTimeout(() => setIsBuzzing(false), 150); 
    
    connectionService.sendMessage({ type: 'BUZZ', teamId: 'CLIENT', teamName });
  };

  const isConnecting = !!connectionStatus;

  return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-center p-4 md:p-6 bg-[#1a1a2e] text-white overflow-hidden fixed inset-0 overscroll-none">
      
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(60,60,80,0.5)_0%,_#000_100%)] pointer-events-none"></div>

      {state === 'CONNECT' && (
        <div className="w-full max-w-md space-y-4 relative z-10 flex flex-col justify-center h-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold header-font text-[#ffcc00] tracking-widest drop-shadow-md">JOIN GAME</h2>
            <div className="h-1 w-24 bg-[#ffcc00] mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="bg-[#222] p-6 rounded-xl shadow-2xl border border-white/10">
            <div className="mb-6">
              <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-white/50">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="w-full p-4 bg-black border-2 border-[#333] rounded-lg text-center text-3xl font-bold tracking-[0.5em] uppercase focus:border-[#ffcc00] outline-none placeholder-white/10 text-white lcd-font"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold mb-2 uppercase tracking-widest text-white/50">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="ENTER NAME"
                className="w-full p-4 bg-black border-2 border-[#333] rounded-lg text-lg focus:border-[#ffcc00] outline-none placeholder-white/10 text-white font-bold uppercase"
              />
            </div>

            {error && <p className="text-red-400 text-center text-xs font-bold bg-red-900/20 p-2 rounded mb-4 border border-red-900/50">{error}</p>}

            <button
              onClick={proceedToAvatar}
              className="w-full bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 rounded-lg shadow-lg text-xl transition-all active:scale-95 uppercase tracking-wider"
            >
              NEXT
            </button>
          </div>
          
          <button onClick={onBack} className="w-full text-white/40 text-xs mt-4 hover:text-white pb-4 uppercase tracking-widest">Exit to Menu</button>
        </div>
      )}

      {state === 'SELECT_AVATAR' && (
         <div className="w-full max-w-md relative z-10 flex flex-col h-full">
            <div className="text-center mb-6 pt-4">
               <h2 className="text-2xl font-bold header-font text-white tracking-widest">SELECT CHARACTER</h2>
               <p className="text-white/50 text-xs uppercase mt-1">Who will represent you?</p>
            </div>

            {isConnecting ? (
               <div className="flex-grow flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-[#ffcc00]/30 border-t-[#ffcc00] rounded-full animate-spin mb-4"></div>
                  <span className="lcd-font uppercase tracking-wider text-sm animate-pulse">{connectionStatus}</span>
               </div>
            ) : (
               <div className="flex-grow overflow-y-auto pb-4 px-2 no-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                     {AVATARS.map(avatar => (
                        <button
                           key={avatar.id}
                           onClick={() => { triggerHaptic(15); setSelectedAvatar(avatar); handleConnect(avatar); }}
                           className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center aspect-square shadow-lg ${
                              selectedAvatar?.id === avatar.id ? 'border-[#ffcc00] bg-white/10' : 'border-[#333] bg-[#222]'
                           }`}
                        >
                           <div className={`w-16 h-16 rounded-full ${avatar.color} flex items-center justify-center text-3xl shadow-inner mb-3`}>
                              {avatar.icon}
                           </div>
                           <span className="font-bold text-white uppercase tracking-wider">{avatar.name}</span>
                        </button>
                     ))}
                  </div>
               </div>
            )}
            
            <button onClick={() => setState('CONNECT')} disabled={isConnecting} className="w-full text-white/40 text-xs mt-2 hover:text-white pb-6 uppercase tracking-widest text-center">Back</button>
         </div>
      )}

      {state === 'LOBBY' && (
        <div className="text-center animate-fade-in w-full max-w-md relative z-10 flex flex-col items-center h-full justify-center">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-4 border-[#1a1a2e] ${selectedAvatar?.color || 'bg-gray-600'}`}>
             <span className="text-6xl drop-shadow-md">{selectedAvatar?.icon || '✓'}</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">READY</h2>
          <p className="text-white/50 mb-10 text-sm uppercase tracking-widest">Waiting for host...</p>
          
          <div className="w-full bg-[#222] p-1 rounded-xl border border-white/10 shadow-xl">
             <div className="bg-black p-6 rounded-lg">
                <span className="block text-[10px] uppercase text-white/40 mb-1 tracking-widest">Registered As</span>
                <span className="text-2xl font-bold text-[#ffcc00] tracking-wide block truncate">{teamName}</span>
             </div>
          </div>
        </div>
      )}

      {(state === 'GAME' || state === 'FINAL_JEOPARDY') && (
        <div className="flex flex-col h-full w-full max-w-lg animate-fade-in relative z-10">
           
           {/* Top Bar - Digital Display */}
           <div className="flex justify-between items-center bg-black border-b-2 border-[#333] p-4 mb-4 shadow-lg flex-shrink-0">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAvatar?.color || 'bg-gray-600'} border border-white/20`}>
                    <span className="text-lg">{selectedAvatar?.icon}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Player</span>
                    <span className="font-bold text-white text-lg leading-none truncate max-w-[120px]">{teamName}</span>
                 </div>
              </div>
              <div className="text-right flex flex-col">
                 <span className="text-[10px] text-white/40 uppercase tracking-widest">Credit</span>
                 <span className="font-bold text-2xl text-[#ffcc00] lcd-font leading-none">${score}</span>
              </div>
           </div>
           
           <div className="flex-grow flex flex-col items-center justify-center relative min-h-0">
             
             {/* REGULAR GAME BUZZER */}
             {state === 'GAME' && (
               <>
                 <div className="w-full flex-grow flex flex-col items-center justify-center mb-6">
                    {/* LCD Question Display */}
                    <div className="w-full bg-[#111] border-4 border-[#333] rounded-lg p-4 mb-4 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] min-h-[80px] flex flex-col items-center justify-center">
                       {currentQuestion ? (
                          <>
                            <div className="text-[#ffcc00] font-bold text-3xl lcd-font mb-2">${currentQuestion.value}</div>
                            <div className="text-green-500/80 text-xs md:text-sm font-mono leading-relaxed text-center uppercase">{currentQuestion.text.substring(0, 80)}{currentQuestion.text.length > 80 ? '...' : ''}</div>
                            {/* Scanline effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
                          </>
                       ) : (
                          <div className="flex flex-col items-center opacity-30">
                             <div className="w-full h-1 bg-white/20 mb-2 rounded animate-pulse"></div>
                             <div className="w-2/3 h-1 bg-white/20 rounded animate-pulse"></div>
                             <div className="mt-2 text-[10px] uppercase">Standby</div>
                          </div>
                       )}
                    </div>

                    {/* THE 3D BUTTON */}
                    {/* Adjusted height and max-width for visibility on all devices */}
                    <div className="relative w-full h-[50vh] max-h-[500px] min-h-[300px] mx-auto">
                      <Canvas shadows dpr={[1, 2]} orthographic camera={{ position: [0, 10, 0], zoom: 30, near: 0.1, far: 100 }}>
                         <ambientLight intensity={0.5} />
                         <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                         <Environment preset="night" />
                         
                         <BuzzerButton3D 
                            pressed={isBuzzing} 
                            locked={!currentQuestion || !!buzzerLockedBy} 
                            onPress={handleBuzz}
                         />
                         <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
                      </Canvas>
                    </div>
                    
                    {buzzerLockedBy && (
                       <div className="absolute bottom-20 md:bottom-24 bg-black/80 px-4 py-2 rounded text-[#ffcc00] font-bold border border-[#ffcc00] animate-pulse">
                          {buzzerLockedBy.isMe ? "LOCKED BY YOU" : `LOCKED BY ${buzzerLockedBy.name}`}
                       </div>
                    )}

                 </div>

                 <div className="h-12 flex items-center justify-center flex-shrink-0">
                    {currentQuestion && !buzzerLockedBy && (
                       <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">System Armed</p>
                    )}
                    {!currentQuestion && (
                       <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em]">Waiting for Host</p>
                    )}
                 </div>
               </>
             )}

             {/* FINAL JEOPARDY VIEW */}
             {state === 'FINAL_JEOPARDY' && fjState && (
               <div className="w-full text-center h-full flex flex-col justify-center">
                  <div className="text-[#ffcc00] font-bold text-xl uppercase tracking-widest mb-6 lcd-font border-b border-[#333] pb-2">Final Jeopardy</div>
                  
                  {fjState.phase === 'BETTING' && (
                    <div className="animate-fade-in p-6 bg-[#222] rounded-xl border-t-4 border-[#ffcc00] shadow-xl">
                       <h3 className="text-xl md:text-2xl font-bold mb-4 header-font text-white">{fjState.category}</h3>
                       <div className="bg-black p-4 rounded mb-4">
                         <span className="text-xs uppercase text-white/40 block mb-1">Max Wager</span>
                         <span className="text-3xl text-[#ffcc00] lcd-font">${score}</span>
                       </div>
                       <p className="text-sm text-white/70">Tell the host your wager now.</p>
                    </div>
                  )}

                  {fjState.phase === 'PLAYING' && (
                    <div className="animate-fade-in flex flex-col items-center">
                       <div className="inline-block px-3 py-1 bg-white/10 rounded text-[10px] uppercase tracking-widest mb-6 text-white/60">{fjState.category}</div>
                       <div className="p-6 bg-[#222] rounded-xl border border-white/10 mb-8 shadow-xl w-full">
                          <p className="text-lg md:text-xl font-medium leading-relaxed font-serif italic text-white/90">"{fjState.question}"</p>
                       </div>
                       <div className="flex items-center gap-2 text-[#ffcc00] animate-pulse">
                          <div className="w-2 h-2 bg-[#ffcc00] rounded-full"></div>
                          <span className="font-bold text-sm uppercase tracking-wider">Write Down Answer</span>
                       </div>
                    </div>
                  )}

                  {fjState.phase === 'REVEAL_ANSWER' && (
                    <div className="animate-fade-in">
                       <div className="text-red-500 font-bold text-2xl uppercase tracking-widest mb-2 lcd-font">TIME'S UP</div>
                       <div className="p-6 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-sm text-white/50">Look at the main screen.</p>
                       </div>
                    </div>
                  )}
               </div>
             )}
             
           </div>
        </div>
      )}
      
      {state === 'GAME_OVER' && (
        <div className="h-full w-full flex flex-col animate-fade-in max-w-lg relative z-10">
           <div className="text-center mb-6 pt-4 shrink-0">
              <h2 className="text-4xl font-bold text-white header-font tracking-tighter">GAME OVER</h2>
           </div>
           
           <div className="bg-[#222] rounded-xl border border-white/10 overflow-hidden flex flex-col flex-grow shadow-2xl">
             <div className="flex bg-black">
               <button onClick={() => setReviewTab('WON')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${reviewTab === 'WON' ? 'bg-[#222] text-green-400 border-t-2 border-green-500' : 'text-white/30 hover:bg-[#1a1a1a]'}`}>Correct</button>
               <button onClick={() => setReviewTab('MISSED')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider ${reviewTab === 'MISSED' ? 'bg-[#222] text-red-400 border-t-2 border-red-500' : 'text-white/30 hover:bg-[#1a1a1a]'}`}>Missed</button>
             </div>

             <div className="flex-grow overflow-auto p-4 space-y-3 bg-[#181818]">
               {gameHistory
                  .filter(rec => reviewTab === 'WON' ? rec.winnerTeamId === myTeamId : rec.wrongTeamIds.includes(myTeamId))
                  .map(rec => (
                   <div key={rec.questionId} className="p-4 rounded bg-[#2a2a2a] border border-white/5 relative shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase bg-white/5 text-white/50 px-2 py-1 rounded">{rec.category}</span>
                        <span className="text-[#ffcc00] font-bold lcd-font">${rec.value}</span>
                      </div>
                      <p className="text-sm mb-3 text-white/90 leading-snug">{rec.question}</p>
                      <div className="bg-black/30 p-2 rounded border-l-2 border-[#ffcc00] text-xs">
                        <span className="text-white/40 uppercase mr-2 text-[10px]">Answer</span>
                        <span className="font-bold text-white/80">{rec.answer}</span>
                      </div>
                   </div>
               ))}
               {gameHistory.filter(rec => reviewTab === 'WON' ? rec.winnerTeamId === myTeamId : rec.wrongTeamIds.includes(myTeamId)).length === 0 && (
                 <div className="text-center p-12 opacity-30 text-sm uppercase tracking-widest">List Empty</div>
               )}
             </div>
           </div>
           <button onClick={() => window.location.reload()} className="mt-4 w-full py-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 font-bold tracking-widest text-white/50 hover:text-white uppercase mb-2 shrink-0 text-xs">Exit Game</button>
        </div>
      )}
    </div>
  );
};