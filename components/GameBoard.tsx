
import React from 'react';
import { GameBoardData, Category, Question, VisualMode } from '../types';
import { playSound } from '../services/soundService';

interface GameBoardProps {
  data: GameBoardData;
  visualMode: VisualMode;
  onQuestionClick: (categoryIndex: number, questionIndex: number) => void;
}

const getCategoryTheme = (name: string, visualMode: VisualMode) => {
  const n = name.toLowerCase();

  // THEME: ANCIENT
  if (visualMode === 'ANCIENT') {
    return {
      headerClass: 'bg-[#3d2b1f] border-[#8b5a2b] font-serif',
      headerGradient: 'linear-gradient(180deg, #5c4033 0%, #3e2723 100%)',
      cardTint: 'rgba(139, 69, 19, 0.2)', // sepia tint
      textClass: 'text-[#d7ccc8] font-serif tracking-widest',
      valueClass: 'text-[#d4af37] font-serif drop-shadow-sm',
      containerClass: 'bg-[#2b1d14] border-2 border-[#5d4037]',
      answeredClass: 'bg-[#1a120b] opacity-50'
    };
  }

  // THEME: NEON
  if (visualMode === 'NEON') {
     return {
      headerClass: 'bg-black border-[#ff00ff] shadow-[0_0_10px_#ff00ff] lcd-font',
      headerGradient: 'linear-gradient(180deg, #220022 0%, #000000 100%)',
      cardTint: 'rgba(255, 0, 255, 0.05)',
      textClass: 'text-[#ff00ff] lcd-font tracking-widest',
      valueClass: 'text-[#00ffff] lcd-font drop-shadow-[0_0_5px_#00ffff]',
      containerClass: 'bg-black border border-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.3)]',
      answeredClass: 'bg-black border border-gray-800 opacity-30 grayscale'
    };
  }
  
  // THEME: CLASSIC (Default) - Adaptive colors
  let classicTheme = {
    headerClass: 'bg-blue-900 border-blue-400/30',
    headerGradient: 'linear-gradient(180deg, #0a10c2 0%, #030666 100%)',
    cardTint: 'transparent',
    textClass: 'text-white header-font uppercase',
    valueClass: 'text-[#ffcc00] header-font drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)]',
    containerClass: 'jeopardy-texture border-blue-400/30',
    answeredClass: 'bg-[#0b0b2b] shadow-inner opacity-80'
  };

  // Apply subtle variations for Classic
  if (n.match(/sea|water|river|fish|boat|rain|flood|lake|ocean/)) {
    classicTheme.headerClass = 'bg-cyan-950 border-cyan-500';
    classicTheme.headerGradient = 'linear-gradient(180deg, #083344 0%, #164e63 100%)';
    classicTheme.cardTint = 'rgba(6, 182, 212, 0.15)';
  } else if (n.match(/fire|spirit|light|sun|prophecy|vision|miracle|power/)) {
    classicTheme.headerClass = 'bg-orange-950 border-orange-500';
    classicTheme.headerGradient = 'linear-gradient(180deg, #431407 0%, #7c2d12 100%)';
    classicTheme.cardTint = 'rgba(249, 115, 22, 0.15)';
  } else if (n.match(/king|queen|royal|gold|wealth|crown|david|solomon|jesus|messiah|lord/)) {
    classicTheme.headerClass = 'bg-purple-950 border-yellow-500';
    classicTheme.headerGradient = 'linear-gradient(180deg, #3b0764 0%, #581c87 100%)';
    classicTheme.cardTint = 'rgba(168, 85, 247, 0.15)';
  } else if (n.match(/tree|fruit|garden|land|animal|creature|mountain|earth|food|bread/)) {
    classicTheme.headerClass = 'bg-emerald-950 border-emerald-500';
    classicTheme.headerGradient = 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)';
    classicTheme.cardTint = 'rgba(16, 185, 129, 0.15)';
  } else if (n.match(/city|wall|temple|building|stone|rock|jerusalem|babel/)) {
    classicTheme.headerClass = 'bg-stone-900 border-stone-500';
    classicTheme.headerGradient = 'linear-gradient(180deg, #1c1917 0%, #44403c 100%)';
    classicTheme.cardTint = 'rgba(168, 162, 158, 0.15)';
  } else if (n.match(/love|heart|kindness|mercy|faith|peace|joy|women|wife|mother/)) {
    classicTheme.headerClass = 'bg-rose-950 border-rose-400';
    classicTheme.headerGradient = 'linear-gradient(180deg, #4c0519 0%, #881337 100%)';
    classicTheme.cardTint = 'rgba(244, 63, 94, 0.15)';
  }

  return classicTheme;
};

export const GameBoard: React.FC<GameBoardProps> = ({ data, visualMode, onQuestionClick }) => {
  
  const handleCardClick = (catIndex: number, qIndex: number) => {
    playSound('select');
    onQuestionClick(catIndex, qIndex);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center overflow-hidden p-4 md:p-6">
      {/* Grid Container */}
      <div className="grid grid-cols-6 gap-3 md:gap-4 w-full h-full max-h-[90vh] max-w-[1800px] mx-auto">
        
        {/* Categories Header */}
        {data.categories.map((category) => {
          const theme = getCategoryTheme(category.name, visualMode);
          return (
            <div 
              key={category.id} 
              className={`border-2 rounded flex items-center justify-center p-2 text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] relative overflow-hidden group ${theme.headerClass}`}
              style={{
                background: theme.headerGradient,
              }}
            >
              <h3 className={`font-bold text-xs md:text-sm lg:text-xl uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 ${theme.textClass}`}>
                {category.name}
              </h3>
            </div>
          );
        })}

        {/* Questions Grid */}
        {[0, 1, 2, 3, 4].map((rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {data.categories.map((category, catIndex) => {
              const question = category.questions[rowIndex];
              const theme = getCategoryTheme(category.name, visualMode);
              
              return (
                <button 
                  key={question.id}
                  disabled={question.isAnswered}
                  className={`
                    relative rounded flex items-center justify-center transition-transform duration-150 outline-none focus:ring-4 focus:ring-[#ffcc00] overflow-hidden
                    ${question.isAnswered 
                      ? theme.answeredClass
                      : `${theme.containerClass} interactive hover:scale-[1.02] cursor-pointer`}
                  `}
                  onClick={() => !question.isAnswered && handleCardClick(catIndex, rowIndex)}
                  aria-label={`Category ${category.name}, value ${question.value}`}
                >
                  {/* Subtle Theme Tint Overlay */}
                  {!question.isAnswered && theme.cardTint !== 'transparent' && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-0" 
                      style={{ backgroundColor: theme.cardTint }}
                    />
                  )}

                  {!question.isAnswered && (
                    <span className={`font-bold text-4xl md:text-5xl lg:text-7xl tracking-tighter z-10 ${theme.valueClass}`}>
                      ${question.value}
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
