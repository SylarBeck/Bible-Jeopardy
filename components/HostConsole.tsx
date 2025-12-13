
import React, { useState, useEffect } from 'react';
import { connectionService } from '../services/connectionService';
import { Team, Avatar, Question, NetworkMessage } from '../types';

interface HostConsoleProps {
  onBack: () => void;
}

type ConsoleState = 'CONNECT' | 'LOBBY' | 'GAME' | 'QUESTION_ACTIVE' | 'FINAL_JEOPARDY' | 'GAME_OVER';
type Tab = 'GAME' | 'SCORES' | 'SETTINGS';

const ADMIN_AVATAR: Avatar = {
  id: 'host', name: 'Host', color: 'bg-white', icon: '🎤'
};

const SettingsIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const GameIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const EditIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const TvIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
);

export const HostConsole: React.FC<HostConsoleProps> = ({ onBack }) => {
  const [state, setState] = useState<ConsoleState>('CONNECT');
  const [activeTab, setActiveTab] = useState<Tab>('GAME');
  const [roomCode, setRoomCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [error, setError] = useState('');
  
  // Game Sync
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeBuzzer, setActiveBuzzer] = useState<{id: string, name: string} | null>(null);
  const [fjData, setFjData] = useState<{phase: string, category: string, question?: string, answer?: string} | null>(null);

  // Score Management
  const [editingScore, setEditingScore] = useState<string>('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!roomCode) {
       setError("Enter Room Code");
       return;
    }
    setError('');
    setConnectionStatus('Connecting...');
    
    try {
      await connectionService.initializeClient(
        roomCode.toUpperCase(),
        "HOST_REMOTE",
        ADMIN_AVATAR,
        () => {
          setState('LOBBY');
          setConnectionStatus('');
        },
        (data: NetworkMessage) => {
           processNetworkData(data);
        },
        (status) => setConnectionStatus(status)
      );
    } catch (e) {
      setError("Failed to connect. Check Room Code.");
      setConnectionStatus('');
    }
  };

  const processNetworkData = (data: NetworkMessage) => {
     if (data.type === 'GAME_STATE') {
        if (data.payload === 'PLAYING') setState('GAME');
     } else if (data.type === 'SCORE_UPDATE') {
        setTeams(data.payload);
     } else if (data.type === 'QUESTION_OPEN') {
        setActiveQuestion(data.payload);
        setState('QUESTION_ACTIVE');
        setActiveBuzzer(null);
     } else if (data.type === 'QUESTION_CLOSE') {
        setActiveQuestion(null);
        setState('GAME');
        setActiveBuzzer(null);
     } else if (data.type === 'BUZZER_STATUS') {
        if (data.payload.locked) {
           setActiveBuzzer({ id: data.payload.teamId, name: data.payload.teamName });
        } else {
           setActiveBuzzer(null);
        }
     } else if (data.type === 'FJ_UPDATE') {
        setState('FINAL_JEOPARDY');
        setFjData(data.payload);
     } else if (data.type === 'GAME_OVER') {
        setState('GAME_OVER');
     }
  };

  const sendAdminCmd = (action: string, payload: any = {}) => {
     // Optimistic updates for Close
     if (action === 'CLOSE') {
        setState('GAME');
        setActiveQuestion(null);
        setActiveBuzzer(null);
     }

     connectionService.sendMessage({
        type: 'ADMIN_ACTION',
        action: action as any,
        payload
     });
  };

  const updateScoreManually = (teamId: string, amount: number) => {
     sendAdminCmd('SCORE_EDIT', { teamId, amount });
     setEditingScore('');
     setEditingTeam(null);
  };

  // Render different views based on tabs and game state
  const renderGameContent = () => {
    if (state === 'LOBBY') {
       return (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse border border-green-500/50">
               <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 header-font">CONNECTED</h2>
            <p className="text-white/60 mb-8">Manage start from TV</p>
            
            <div className="w-full bg-black/40 rounded-xl overflow-hidden border border-white/10">
               <div className="bg-white/10 p-2 text-xs font-bold uppercase tracking-wider text-white/50">Lobby Players</div>
               <div className="p-4 flex flex-wrap gap-2 justify-center">
                  {teams.length === 0 && <span className="text-white/30 italic">Waiting...</span>}
                  {teams.map(t => (
                     <div key={t.id} className="bg-[#2a1a4a] px-3 py-2 rounded-lg border border-[#ffcc00]/30 flex items-center gap-2">
                        <span>{t.avatar.icon}</span>
                        <span className="font-bold text-sm">{t.name}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
       );
    }

    if (state === 'GAME') {
       return (
          <div className="flex flex-col h-full">
             <div className="flex-grow flex items-center justify-center p-8 text-center opacity-40">
                <div className="flex flex-col items-center">
                   <TvIcon />
                   <p className="mt-4 font-bold">Look at the TV</p>
                   <p className="text-sm">Select a question on the main board to begin.</p>
                </div>
             </div>
             {/* Mini Scoreboard */}
             <div className="grid grid-cols-2 gap-2 mt-auto">
                 {teams.map(t => (
                    <div key={t.id} className="bg-black/40 p-3 rounded flex justify-between items-center border border-white/10">
                       <span className="text-xs font-bold truncate pr-2 w-20">{t.name}</span>
                       <span className="text-[#ffcc00] font-bold font-mono">${t.score}</span>
                    </div>
                 ))}
             </div>
          </div>
       );
    }

    if (state === 'QUESTION_ACTIVE' && activeQuestion) {
       return (
         <div className="flex flex-col h-full">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col flex-grow shadow-lg">
               <div className="bg-[#ffcc00] text-black p-3 font-bold text-center text-xl shadow-sm header-font">
                  ${activeQuestion.value}
               </div>
               
               <div className="p-6 flex-grow flex flex-col">
                  <div className="mb-6">
                     <p className="text-xs uppercase text-white/40 font-bold mb-2 tracking-widest">Question (Clue)</p>
                     <p className="text-xl leading-relaxed font-medium">{activeQuestion.question}</p>
                  </div>
                  
                  <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30 mb-6">
                     <p className="text-xs uppercase text-green-400 font-bold mb-1 tracking-widest">Answer (Response)</p>
                     <p className="text-2xl font-bold text-white mb-2">{activeQuestion.answer}</p>
                     <p className="text-xs text-green-300/70 italic flex items-center gap-1">
                        <span>📖</span> {activeQuestion.scripture}
                     </p>
                  </div>

                  {/* BUZZER STATUS */}
                  <div className={`p-4 rounded-xl mb-6 text-center border-2 transition-all ${activeBuzzer ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-black/20 border-white/5'}`}>
                     {activeBuzzer ? (
                        <>
                           <p className="text-xs uppercase font-bold text-red-300 mb-1 tracking-widest">BUZZED IN</p>
                           <p className="text-3xl font-bold text-white header-font">{activeBuzzer.name}</p>
                        </>
                     ) : (
                        <p className="text-sm text-white/40 font-bold uppercase tracking-wide">Waiting for buzz...</p>
                     )}
                  </div>

                  {/* CONTROLS */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                     {activeBuzzer ? (
                        <>
                           <button 
                             onClick={() => sendAdminCmd('SCORE_SUB', { teamId: activeBuzzer.id })}
                             className="bg-red-600 hover:bg-red-500 py-6 rounded-xl font-bold text-xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
                           >
                              WRONG
                           </button>
                           <button 
                             onClick={() => sendAdminCmd('SCORE_ADD', { teamId: activeBuzzer.id })}
                             className="bg-green-600 hover:bg-green-500 py-6 rounded-xl font-bold text-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
                           >
                              CORRECT
                           </button>
                           <button 
                              onClick={() => sendAdminCmd('CLEAR_BUZZER')} 
                              className="col-span-2 py-3 bg-white/10 rounded-lg text-sm font-bold uppercase text-white/60 hover:bg-white/20"
                           >
                              Clear Buzzer (No Score Change)
                           </button>
                        </>
                     ) : (
                        <>
                           <button 
                             onClick={() => sendAdminCmd('REVEAL')}
                             className="col-span-1 bg-yellow-600 hover:bg-yellow-500 py-4 rounded-xl font-bold text-white shadow-lg uppercase text-sm border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1"
                           >
                              Reveal Answer
                           </button>
                           <button 
                             onClick={() => sendAdminCmd('CLOSE')}
                             className="col-span-1 bg-gray-600 hover:bg-gray-500 py-4 rounded-xl font-bold text-white shadow-lg uppercase text-sm border-b-4 border-gray-800 active:border-b-0 active:translate-y-1"
                           >
                              Close Board
                           </button>
                        </>
                     )}
                  </div>
               </div>
            </div>
         </div>
       );
    }
    
    // Fallback/Default for other states handled generically
    return <div className="p-4 text-center opacity-50">State: {state}</div>;
  };

  const renderScoresContent = () => (
     <div className="flex flex-col gap-4 h-full">
        <h2 className="text-xl font-bold header-font text-[#ffcc00] border-b border-white/10 pb-2">Score Manager</h2>
        <div className="overflow-y-auto flex-grow space-y-3">
           {teams.map(t => (
              <div key={t.id} className="bg-black/30 p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="text-2xl">{t.avatar.icon}</span>
                       <span className="font-bold text-lg">{t.name}</span>
                    </div>
                    <span className="font-mono text-2xl font-bold text-[#ffcc00]">${t.score}</span>
                 </div>
                 
                 {editingTeam === t.id ? (
                    <div className="bg-white/5 p-3 rounded-lg animate-fade-in">
                       <input 
                         type="number" 
                         value={editingScore}
                         onChange={e => setEditingScore(e.target.value)}
                         placeholder="Amount (e.g. 100)"
                         className="w-full p-2 bg-black border border-white/30 rounded mb-2 text-white font-mono"
                       />
                       <div className="flex gap-2">
                          <button 
                             onClick={() => updateScoreManually(t.id, parseInt(editingScore))}
                             className="flex-1 bg-green-700 py-2 rounded font-bold text-xs uppercase"
                          >
                             Add
                          </button>
                          <button 
                             onClick={() => updateScoreManually(t.id, -parseInt(editingScore))}
                             className="flex-1 bg-red-700 py-2 rounded font-bold text-xs uppercase"
                          >
                             Subtract
                          </button>
                          <button 
                             onClick={() => setEditingTeam(null)}
                             className="px-3 bg-white/10 rounded font-bold text-xs"
                          >
                             ✕
                          </button>
                       </div>
                    </div>
                 ) : (
                    <button 
                       onClick={() => { setEditingTeam(t.id); setEditingScore(''); }}
                       className="w-full py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold uppercase tracking-wider text-white/50"
                    >
                       Edit Score
                    </button>
                 )}
              </div>
           ))}
        </div>
     </div>
  );

  const renderSettingsContent = () => (
     <div className="flex flex-col gap-6 h-full">
        <h2 className="text-xl font-bold header-font text-[#ffcc00] border-b border-white/10 pb-2">TV Settings</h2>
        
        <div className="space-y-4">
           <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                 <h3 className="font-bold">Background Music</h3>
                 <p className="text-xs text-white/50">Toggle music on the TV display</p>
              </div>
              <button 
                onClick={() => sendAdminCmd('TOGGLE_MUSIC')}
                className="px-4 py-2 bg-purple-600 rounded-lg font-bold text-sm uppercase shadow-md active:scale-95 transition-transform"
              >
                 Toggle
              </button>
           </div>

           <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-red-300">Restart Game</h3>
                 <p className="text-xs text-white/50">Reset board to Lobby</p>
              </div>
              <button 
                onClick={() => { if(confirm("Restart game?")) sendAdminCmd('RESTART_GAME'); }}
                className="px-4 py-2 bg-red-900/50 border border-red-500 rounded-lg font-bold text-sm uppercase text-red-300 shadow-md active:scale-95 transition-transform"
              >
                 Restart
              </button>
           </div>
        </div>

        <div className="mt-auto text-center opacity-30 text-xs">
           <p>Host Remote v1.0</p>
           <p>Connected to Room: {roomCode}</p>
        </div>
     </div>
  );

  // --- MAIN RENDER ---

  if ((state as string) === 'CONNECT') {
     return (
        <div className="h-[100dvh] w-screen bg-[#120a1f] text-white flex flex-col font-sans p-6 items-center justify-center jeopardy-texture">
           <div className="w-full max-w-md bg-[#2a1a4a] p-8 rounded-2xl border-2 border-[#ffcc00] shadow-2xl">
              <h1 className="text-2xl font-bold text-[#ffcc00] header-font text-center mb-8 tracking-widest">HOST REMOTE</h1>
              
              <div className="mb-6">
                 <label className="text-xs uppercase font-bold text-white/50 mb-2 block">Room Code</label>
                 <input 
                   className="w-full p-4 bg-black border-2 border-white/20 rounded-xl text-3xl font-bold text-center uppercase text-white tracking-widest focus:border-[#ffcc00] outline-none"
                   maxLength={4}
                   value={roomCode}
                   onChange={e => setRoomCode(e.target.value.toUpperCase())}
                   placeholder="ABCD"
                 />
              </div>

              {error && <p className="text-red-400 text-sm mb-4 text-center font-bold bg-red-900/20 p-2 rounded">{error}</p>}
              {connectionStatus && <p className="text-blue-300 text-sm mb-4 text-center animate-pulse">{connectionStatus}</p>}
              
              <button 
                 onClick={handleConnect}
                 className="w-full bg-[#ffcc00] hover:bg-yellow-400 text-black py-4 rounded-xl font-bold text-xl shadow-lg uppercase tracking-wider transform transition-transform active:scale-95"
              >
                 Connect
              </button>
              
              <button onClick={onBack} className="w-full mt-4 text-white/30 text-sm hover:text-white">Cancel</button>
           </div>
        </div>
     );
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#120a1f] text-white flex flex-col font-sans jeopardy-texture overflow-hidden">
      
      {/* HEADER */}
      <div className="p-3 bg-[#2a1a4a]/90 backdrop-blur border-b border-white/10 flex justify-between items-center shadow-lg z-10 shrink-0">
         <div>
            <h1 className="text-lg font-bold text-[#ffcc00] header-font tracking-wide">HOST REMOTE</h1>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${state === 'CONNECT' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
               <p className="text-[10px] text-white/50 uppercase tracking-widest">{state.replace('_', ' ')}</p>
            </div>
         </div>
         <div className="bg-black/40 px-3 py-1 rounded text-sm font-mono font-bold text-white/80 border border-white/10">
            {roomCode}
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow overflow-y-auto p-4 relative">
         {activeTab === 'GAME' && renderGameContent()}
         {activeTab === 'SCORES' && renderScoresContent()}
         {activeTab === 'SETTINGS' && renderSettingsContent()}
      </div>

      {/* BOTTOM TAB BAR */}
      <div className="bg-[#1a0b2e] border-t border-white/10 pb-safe pt-2 px-2 flex justify-around items-end shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20">
         <button 
            onClick={() => setActiveTab('GAME')}
            className={`flex flex-col items-center p-3 w-1/3 transition-colors ${activeTab === 'GAME' ? 'text-[#ffcc00]' : 'text-white/40 hover:text-white/60'}`}
         >
            <GameIcon />
            <span className="text-[10px] uppercase font-bold mt-1">Control</span>
         </button>
         
         <button 
            onClick={() => setActiveTab('SCORES')}
            className={`flex flex-col items-center p-3 w-1/3 transition-colors ${activeTab === 'SCORES' ? 'text-[#ffcc00]' : 'text-white/40 hover:text-white/60'}`}
         >
            <EditIcon />
            <span className="text-[10px] uppercase font-bold mt-1">Scores</span>
         </button>
         
         <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col items-center p-3 w-1/3 transition-colors ${activeTab === 'SETTINGS' ? 'text-[#ffcc00]' : 'text-white/40 hover:text-white/60'}`}
         >
            <SettingsIcon />
            <span className="text-[10px] uppercase font-bold mt-1">Settings</span>
         </button>
      </div>
    </div>
  );
};
