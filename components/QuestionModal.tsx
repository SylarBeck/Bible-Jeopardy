
import React, { useState, useEffect } from 'react';
import { Question, Team } from '../types';
import { playSound } from '../services/soundService';

interface QuestionModalProps {
  question: Question;
  teams: Team[];
  activeBuzzer: string | null; // Team ID who buzzed
  onClose: (result?: { winnerId: string | null, wrongIds: string[] }) => void;
  onUpdateScore: (teamId: string, type: 'add' | 'subtract') => void;
  onClearBuzzer: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ 
  question, teams, activeBuzzer, onClose, onUpdateScore, onClearBuzzer 
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  
  const [popTeam, setPopTeam] = useState<string | null>(null);
  const [shakeTeam, setShakeTeam] = useState<string | null>(null);
  
  // Track local results for this specific question
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setAnimateIn(true));
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!timerActive || showAnswer || activeBuzzer) return;

    if (timeLeft <= 0) {
      playSound('alarm');
      setTimerActive(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
         if (prev > 1) playSound('tick');
         return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive, showAnswer, activeBuzzer]);

  // Keyboard Navigation Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Space
      if (e.code === 'Space') {
        // Only prevent default if we're not typing in an input (not applicable here usually)
        e.preventDefault();
      }

      if (activeBuzzer) {
        // --- BUZZER LOCKED STATE ---
        if (!showAnswer) {
           // Space to reveal
           if (e.code === 'Space') {
             handleReveal();
           }
        } else {
           // Y for Yes (Correct), N for No (Wrong)
           if (e.key.toLowerCase() === 'y' || e.code === 'KeyY') {
             handleScore(activeBuzzer, 'add');
           }
           if (e.key.toLowerCase() === 'n' || e.code === 'KeyN') {
             handleScore(activeBuzzer, 'subtract');
           }
        }
      } else {
        // --- STANDARD VIEW ---
        if (!showAnswer) {
          // Space to reveal
          if (e.code === 'Space') {
            handleReveal();
          }
        } else {
          // Esc or Enter to close/return
          if (e.code === 'Escape' || e.code === 'Enter') {
            handleClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBuzzer, showAnswer, timeLeft, timerActive]); // Dependencies for closure stability

  const handleReveal = () => {
    if (showAnswer) return;
    playSound('reveal');
    setShowAnswer(true);
    setTimerActive(false);
  };

  const handleScore = (teamId: string, type: 'add' | 'subtract', close: boolean = true) => {
    if (type === 'add') {
      playSound('correct');
      setPopTeam(teamId);
      // Only set winnerID if closing, otherwise it's a manual adjustment
      if (close) setWinnerId(teamId);
      onUpdateScore(teamId, type);
      
      if (close) {
        setTimeout(() => {
          onClose({ winnerId: teamId, wrongIds });
        }, 1000); 
      } else {
        setTimeout(() => setPopTeam(null), 500);
      }

    } else {
      playSound('wrong');
      setShakeTeam(teamId);
      if (close) setWrongIds(prev => [...prev, teamId]);
      
      setTimeout(() => setShakeTeam(null), 300);
      onUpdateScore(teamId, type);
      
      if (close) {
        if (showAnswer) {
          onClose({ winnerId: null, wrongIds: [...wrongIds, teamId] });
        } else {
          onClearBuzzer();
        }
      }
    }
  };

  const handleClose = () => {
    onClose({ winnerId, wrongIds });
  };

  const timerPercentage = (timeLeft / 30) * 100;
  let timerColor = 'bg-yellow-400'; 
  if (timeLeft < 10) timerColor = 'bg-orange-500';
  if (timeLeft < 5) timerColor = 'bg-red-500';

  const buzzedTeamName = teams.find(t => t.id === activeBuzzer)?.name;

  // Determine glow class based on value
  const getGlowClass = (val: number) => {
    if (val <= 200) return 'glow-200';
    if (val <= 400) return 'glow-400';
    if (val <= 600) return 'glow-600';
    if (val <= 800) return 'glow-800';
    return 'glow-1000';
  };

  const jwLink = `https://www.jw.org/en/search/?q=${encodeURIComponent(question.scripture)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-bg)] p-4 md:p-8 backdrop-blur-md">
      <div 
        className={`
          w-full h-full rounded-xl shadow-2xl overflow-hidden border-2
          transform transition-all duration-500 flex flex-col relative
          jeopardy-texture ${getGlowClass(question.value)}
          ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header Bar */}
        <div className="bg-[#120a1f] text-white p-6 flex justify-between items-center shadow-lg border-b-2 border-[#7e57c2]">
           <span className="font-bold text-3xl header-font tracking-wide opacity-90 text-white">QUESTION</span>
           <span className={`font-bold text-4xl header-font text-[#ffcc00] bg-white/10 px-6 py-2 rounded shadow-inner ${getGlowClass(question.value)} border`}>
            ${question.value}
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 md:p-16 text-center overflow-y-auto relative">
          
          {/* Locked Buzzer Overlay */}
          {activeBuzzer && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-8">
               <div className="bg-[#5e35b1] border-4 border-[#ffcc00] p-8 md:p-12 rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.5)] transform animate-pop text-center max-w-4xl w-full">
                 
                 {!showAnswer ? (
                   <>
                     <p className="text-[#ffcc00] text-xl font-bold uppercase tracking-widest mb-4">BUZZER LOCKED</p>
                     <h2 className="text-white text-5xl md:text-7xl font-bold header-font mb-12">{buzzedTeamName}</h2>
                     <button 
                       onClick={handleReveal}
                       className="bg-[#ffcc00] hover:bg-yellow-400 text-black py-5 px-10 rounded-lg font-bold text-2xl shadow-xl transition-transform hover:scale-105"
                     >
                       REVEAL ANSWER <span className="text-xs block font-normal opacity-50 mt-1">(Space)</span>
                     </button>
                   </>
                 ) : (
                   <>
                      <p className="text-[#ffcc00] text-xl font-bold uppercase tracking-widest mb-4">JUDGE ANSWER</p>
                      <div className="mb-8 p-6 bg-black/30 rounded-lg border-l-4 border-[#ffcc00]">
                         <p className="text-white/60 text-sm uppercase mb-2">Correct Answer</p>
                         <h3 className="text-white text-3xl md:text-5xl font-bold header-font">{question.answer}</h3>
                      </div>
                      
                      <h2 className="text-white text-4xl font-bold mb-8">Was {buzzedTeamName} correct?</h2>

                      <div className="flex gap-6 justify-center">
                        <button 
                          onClick={() => handleScore(activeBuzzer, 'subtract')}
                          className="bg-red-600 hover:bg-red-500 text-white py-4 px-10 rounded-lg font-bold text-xl shadow-lg transition-transform hover:scale-105"
                        >
                          NO (Incorrect) <span className="text-xs block font-normal opacity-50 mt-1">(Key: N)</span>
                        </button>
                        <button 
                          onClick={() => handleScore(activeBuzzer, 'add')}
                          className="bg-green-600 hover:bg-green-500 text-white py-4 px-10 rounded-lg font-bold text-xl shadow-lg transition-transform hover:scale-105"
                        >
                          YES (Correct) <span className="text-xs block font-normal opacity-50 mt-1">(Key: Y)</span>
                        </button>
                     </div>
                   </>
                 )}
               </div>
             </div>
          )}

          <p className="text-white text-4xl md:text-6xl font-bold leading-tight mb-12 uppercase tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
            {question.question}
          </p>

          {showAnswer && !activeBuzzer && (
            <div className="w-full max-w-5xl flex flex-col items-center">
             <div className={`animate-reveal w-full p-10 rounded-lg border-l-8 shadow-2xl transform origin-center bg-gradient-to-r from-[#311b92] to-[#4a148c] relative ${getGlowClass(question.value)} mb-8`}>
              <p className="text-[#ffcc00] text-xl font-bold uppercase mb-4 tracking-wider">Correct Answer</p>
              <p className="text-white text-5xl md:text-7xl font-bold header-font drop-shadow-md mb-6">{question.answer}</p>
              
              <div className="border-t border-white/20 pt-6 mt-4">
                 <a 
                   href={jwLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[#ffcc00] px-6 py-3 rounded-full transition-colors border border-[#ffcc00]/30 hover:border-[#ffcc00]"
                 >
                   <span className="text-2xl">📖</span>
                   <span className="font-bold text-xl uppercase tracking-wide">{question.scripture}</span>
                   <span className="text-sm opacity-70 ml-1">(Open NWT)</span>
                 </a>
              </div>
            </div>

            {/* Manual Adjustment Section */}
            <div className="w-full bg-black/30 rounded-lg border border-white/10 p-4 animate-fade-in">
              <h4 className="text-xs uppercase font-bold text-white/50 mb-3 tracking-wider">Manual Score Adjustment</h4>
              <div className="flex flex-wrap justify-center gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-black/40 rounded px-4 py-2 border border-white/10 flex items-center gap-3">
                     <span className="font-bold text-white">{team.name}</span>
                     <div className="flex gap-1">
                        <button 
                          onClick={() => handleScore(team.id, 'subtract', false)}
                          className="w-8 h-8 rounded bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white border border-red-700/50 flex items-center justify-center font-bold transition-colors"
                          title="Subtract Points"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => handleScore(team.id, 'add', false)}
                          className="w-8 h-8 rounded bg-green-900/50 hover:bg-green-600 text-green-200 hover:text-white border border-green-700/50 flex items-center justify-center font-bold transition-colors"
                          title="Add Points"
                        >
                          +
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
           </div>
          )}
        </div>

        {/* Footer: Timer & Controls */}
        <div className="p-8 border-t-2 border-[#7e57c2] bg-[#120a1f]">
          
          {/* Timer */}
          {!showAnswer && !activeBuzzer && (
            <div className="w-full h-8 bg-black/50 rounded-full mb-8 overflow-hidden relative shadow-inner border border-white/10">
               <div 
                 className={`h-full transition-all duration-1000 linear ${timerColor}`}
                 style={{ width: `${timerPercentage}%` }}
               />
               <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md z-10">
                 {timeLeft > 0 ? `${timeLeft}s` : "TIME'S UP"}
               </span>
            </div>
          )}

          {!showAnswer && !activeBuzzer ? (
            <div className="flex justify-center">
              <button
                onClick={handleReveal}
                className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-16 rounded shadow-lg transform hover:scale-105 transition-all text-2xl uppercase tracking-wider"
              >
                Reveal Answer <span className="text-xs block font-normal opacity-50 mt-1 lowercase">(Space)</span>
              </button>
            </div>
          ) : !activeBuzzer && (
            <div className="w-full">
              {/* Teams List (Summary) */}
              <div className="flex flex-wrap gap-6 justify-center mb-8">
                {teams.map(team => (
                  <div 
                    key={team.id} 
                    className={`
                      flex flex-col items-center p-4 rounded shadow-lg min-w-[180px]
                      transition-all duration-300 border-2
                      bg-[#2a1a4a] border-[#7e57c2]
                      ${shakeTeam === team.id ? 'animate-shake border-red-500 ring-2 ring-red-500 bg-red-900' : ''}
                      ${popTeam === team.id ? 'animate-pop border-green-500 ring-2 ring-green-500 bg-green-900' : ''}
                    `}
                  >
                    <span className="text-white font-bold text-xl mb-1 truncate max-w-[160px]">{team.name}</span>
                    <span className="text-[#ffcc00] header-font font-bold text-2xl mb-3 drop-shadow-md">${team.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded shadow-lg text-xl transition-all transform hover:scale-105 uppercase tracking-wide"
                >
                  Return to Board <span className="text-xs block font-normal opacity-50 mt-1 lowercase">(Esc/Enter)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
