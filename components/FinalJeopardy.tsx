
import React, { useState, useEffect } from 'react';
import { FinalJeopardyQuestion, Team } from '../types';
import { playSound } from '../services/soundService';
import { connectionService } from '../services/connectionService';

interface FinalJeopardyProps {
  data: FinalJeopardyQuestion;
  teams: Team[];
  onGameEnd: (updatedTeams: Team[]) => void;
  externalWagers?: Record<string, number>;
}

type Phase = 'BETTING' | 'PLAYING' | 'REVEAL_ANSWER' | 'SCORING';

export const FinalJeopardy: React.FC<FinalJeopardyProps> = ({ data, teams, onGameEnd, externalWagers }) => {
  const [phase, setPhase] = useState<Phase>('BETTING');
  const [wagers, setWagers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, 'CORRECT' | 'WRONG' | null>>({});
  const [timeLeft, setTimeLeft] = useState(30);

  // Initialize wagers for teams with > 0 score
  useEffect(() => {
    const initialWagers: Record<string, number> = {};
    const initialResults: Record<string, 'CORRECT' | 'WRONG' | null> = {};
    teams.forEach(t => {
      initialWagers[t.id] = 0;
      initialResults[t.id] = null;
    });
    setWagers(initialWagers);
    setResults(initialResults);

    // Broadcast initial FJ state
    connectionService.sendMessage({
      type: 'FJ_UPDATE',
      payload: {
        phase: 'BETTING',
        category: data.category
      }
    });
  }, [teams, data.category]);

  // Sync external wagers (from Controllers)
  useEffect(() => {
    if (externalWagers) {
      setWagers(prev => ({
        ...prev,
        ...externalWagers
      }));
    }
  }, [externalWagers]);

  // Timer logic for PLAYING phase
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    if (timeLeft <= 0) {
      setPhase('REVEAL_ANSWER');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleWagerChange = (teamId: string, value: string, maxScore: number) => {
    let numVal = parseInt(value, 10);
    if (isNaN(numVal)) numVal = 0;
    if (numVal < 0) numVal = 0;
    if (numVal > maxScore) numVal = maxScore;
    setWagers(prev => ({ ...prev, [teamId]: numVal }));
  };

  const startRound = () => {
    playSound('select');
    setTimeLeft(30);
    setPhase('PLAYING');

    // Broadcast Question
    connectionService.sendMessage({
      type: 'FJ_UPDATE',
      payload: {
        phase: 'PLAYING',
        category: data.category,
        question: data.question
      }
    });
  };

  const revealAnswer = () => {
    playSound('reveal');
    setPhase('REVEAL_ANSWER');

    // Broadcast Answer phase (Controller just shows wait/listen usually)
    connectionService.sendMessage({
      type: 'FJ_UPDATE',
      payload: {
        phase: 'REVEAL_ANSWER',
        category: data.category
      }
    });
  };

  const startScoring = () => {
    playSound('select');
    setPhase('SCORING');
  };

  const toggleResult = (teamId: string, result: 'CORRECT' | 'WRONG') => {
    if (result === 'CORRECT') playSound('correct');
    else playSound('wrong');

    setResults(prev => ({
      ...prev,
      [teamId]: prev[teamId] === result ? null : result
    }));
  };

  const finishGame = () => {
    // Calculate final scores
    const updatedTeams = teams.map(team => {
      const wager = wagers[team.id] || 0;
      const result = results[team.id];
      let newScore = team.score;
      let newCorrect = team.correctAnswers;
      let newWrong = team.wrongAnswers;

      if (team.score > 0) {
        if (result === 'CORRECT') {
          newScore += wager;
          newCorrect += 1;
        } else if (result === 'WRONG') {
          newScore -= wager;
          newWrong += 1;
        }
      }

      return {
        ...team,
        score: newScore,
        correctAnswers: newCorrect,
        wrongAnswers: newWrong
      };
    });
    onGameEnd(updatedTeams);
  };

  const activeTeams = teams.filter(t => t.score > 0);
  const inactiveTeams = teams.filter(t => t.score <= 0);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-6xl jeopardy-texture rounded-xl shadow-2xl border-2 border-[#7e57c2] overflow-hidden flex flex-col min-h-[60vh] animate-fade-in relative backdrop-blur-sm">

        {/* Header */}
        <div className="bg-black/20 p-6 text-center border-b border-white/10 shadow-lg">
          <h2 className="text-3xl md:text-5xl font-bold header-font text-white tracking-widest uppercase text-shadow-md">
            Final Jeopardy
          </h2>
          <div className="inline-block mt-3 px-6 py-2 bg-black/30 rounded-full border border-white/10">
            <p className="text-[#ffcc00] text-xl md:text-2xl font-bold uppercase header-font tracking-wide">{data.category}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-black/10 overflow-y-auto">

          {phase === 'BETTING' && (
            <div className="w-full max-w-5xl animate-fade-in">
              <h3 className="text-2xl text-white mb-8 header-font uppercase tracking-wide opacity-90">Place Your Wagers</h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
                {activeTeams.map(team => (
                  <div key={team.id} className="bg-black/30 p-6 rounded-lg border border-white/20 backdrop-blur-md shadow-xl hover:bg-black/40 transition-colors relative overflow-hidden">
                    {externalWagers && externalWagers[team.id] !== undefined && (
                      <div className="absolute top-0 right-0 bg-green-600 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                        Ready
                      </div>
                    )}
                    <div className="text-[#ffcc00] font-bold text-2xl header-font mb-2">{team.name}</div>
                    <div className="text-white/70 text-sm mb-4 font-mono">Current: ${team.score.toLocaleString()}</div>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffcc00] font-bold text-xl">$</span>
                      <input
                        type="number"
                        min="0"
                        max={team.score}
                        value={wagers[team.id]}
                        onChange={(e) => handleWagerChange(team.id, e.target.value, team.score)}
                        className="w-full bg-black/40 border-2 border-white/20 rounded-md py-3 pl-8 pr-4 text-white text-xl font-bold focus:border-[#ffcc00] outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {inactiveTeams.length > 0 && (
                <div className="mt-8 text-white/40 text-sm bg-black/20 inline-block px-4 py-2 rounded">
                  Spectating: {inactiveTeams.map(t => t.name).join(', ')}
                </div>
              )}

              <div className="mt-12">
                <button
                  onClick={startRound}
                  className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-16 rounded shadow-lg transform hover:scale-105 transition-all text-2xl uppercase header-font tracking-wider"
                >
                  REVEAL QUESTION
                </button>
              </div>
            </div>
          )}

          {(phase === 'PLAYING' || phase === 'REVEAL_ANSWER') && (
            <div className="w-full max-w-5xl animate-fade-in flex flex-col items-center">
              <p className="text-white text-3xl md:text-5xl font-bold leading-tight uppercase tracking-wide drop-shadow-lg text-shadow-md mb-12">
                {data.question}
              </p>

              {phase === 'PLAYING' && (
                <div className="w-full h-6 bg-black/50 rounded-full mb-8 overflow-hidden max-w-xl shadow-inner border border-white/10 relative">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-1000 linear"
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black/70">
                    {timeLeft}s
                  </span>
                </div>
              )}

              {phase === 'REVEAL_ANSWER' ? (
                <div className="animate-reveal w-full max-w-4xl p-10 rounded-lg border-l-8 border-yellow-500 shadow-2xl bg-gradient-to-r from-[#311b92]/90 to-[#4a148c]/90 backdrop-blur-md mb-8 border-y border-r border-white/10">
                  <p className="text-yellow-400 text-xl font-bold uppercase mb-4 tracking-wider header-font">Correct Answer</p>
                  <p
                    className="text-white text-4xl md:text-6xl font-bold header-font drop-shadow-md animate-slide-up"
                    style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
                  >
                    {data.answer}
                  </p>
                </div>
              ) : (
                <button
                  onClick={revealAnswer}
                  className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-16 rounded shadow-lg transform hover:scale-105 transition-all text-2xl header-font"
                >
                  REVEAL ANSWER
                </button>
              )}

              {phase === 'REVEAL_ANSWER' && (
                <button
                  onClick={startScoring}
                  className="mt-8 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-12 rounded text-xl shadow-lg transition-transform hover:scale-105 header-font"
                >
                  PROCEED TO SCORING
                </button>
              )}
            </div>
          )}

          {phase === 'SCORING' && (
            <div className="w-full max-w-6xl animate-fade-in">
              <h3 className="text-2xl text-white mb-8 header-font uppercase tracking-wide">Determine Results</h3>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center mb-12">
                {activeTeams.map(team => (
                  <div key={team.id} className="bg-black/30 p-6 rounded-lg border border-white/10 flex flex-col items-center shadow-lg backdrop-blur-sm">
                    <div className="text-xl font-bold text-white mb-2 header-font">{team.name}</div>
                    <div className="text-sm text-white/70 mb-4">Wager: ${wagers[team.id] ? wagers[team.id].toLocaleString() : 0}</div>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => toggleResult(team.id, 'CORRECT')}
                        className={`p-3 rounded flex-1 font-bold transition-all border outline-none ${results[team.id] === 'CORRECT' ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/70'}`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => toggleResult(team.id, 'WRONG')}
                        className={`p-3 rounded flex-1 font-bold transition-all border outline-none ${results[team.id] === 'WRONG' ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/70'}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={finishGame}
                  className="bg-[#ffcc00] hover:bg-yellow-400 text-black font-bold py-4 px-12 rounded-full text-xl shadow-lg transition-transform hover:scale-105 header-font"
                >
                  FINALIZE GAME
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
