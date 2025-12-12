import React from 'react';
import { GameBoardData, Category, Question } from '../types';
import { playSound } from '../services/soundService';

interface GameBoardProps {
  data: GameBoardData;
  onQuestionClick: (categoryIndex: number, questionIndex: number) => void;
}

const getCategoryTheme = (name: string) => {
  const n = name.toLowerCase();
  
  if (n.match(/sea|water|river|fish|boat|rain|flood|lake|ocean/)) {
    return {
      headerClass: 'bg-cyan-950 border-cyan-500',
      headerGradient: 'linear-gradient(180deg, #083344 0%, #164e63 100%)',
      cardTint: 'rgba(6, 182, 212, 0.15)', // cyan
      icon: '🌊'
    };
  }
  if (n.match(/fire|spirit|light|sun|prophecy|vision|miracle|power/)) {
    return {
      headerClass: 'bg-orange-950 border-orange-500',
      headerGradient: 'linear-gradient(180deg, #431407 0%, #7c2d12 100%)',
      cardTint: 'rgba(249, 115, 22, 0.15)', // orange
      icon: '🔥'
    };
  }
  if (n.match(/king|queen|royal|gold|wealth|crown|david|solomon|jesus|messiah|lord/)) {
    return {
      headerClass: 'bg-purple-950 border-yellow-500',
      headerGradient: 'linear-gradient(180deg, #3b0764 0%, #581c87 100%)',
      cardTint: 'rgba(168, 85, 247, 0.15)', // purple
      icon: '👑'
    };
  }
  if (n.match(/tree|fruit|garden|land|animal|creature|mountain|earth|food|bread/)) {
    return {
      headerClass: 'bg-emerald-950 border-emerald-500',
      headerGradient: 'linear-gradient(180deg, #022c22 0%, #064e3b 100%)',
      cardTint: 'rgba(16, 185, 129, 0.15)', // emerald
      icon: '🌿'
    };
  }
  if (n.match(/city|wall|temple|building|stone|rock|jerusalem|babel/)) {
    return {
      headerClass: 'bg-stone-900 border-stone-500',
      headerGradient: 'linear-gradient(180deg, #1c1917 0%, #44403c 100%)',
      cardTint: 'rgba(168, 162, 158, 0.15)', // stone
      icon: '🏛️'
    };
  }
  if (n.match(/love|heart|kindness|mercy|faith|peace|joy|women|wife|mother/)) {
    return {
      headerClass: 'bg-rose-950 border-rose-400',
      headerGradient: 'linear-gradient(180deg, #4c0519 0%, #881337 100%)',
      cardTint: 'rgba(244, 63, 94, 0.15)', // rose
      icon: '❤️'
    };
  }
  
  // Default Theme
  return {
    headerClass: 'bg-blue-900 border-blue-400/30',
    headerGradient: 'linear-gradient(180deg, #0a10c2 0%, #030666 100%)',
    cardTint: 'transparent',
    icon: ''
  };
};

export const GameBoard: React.FC<GameBoardProps> = ({ data, onQuestionClick }) => {
  
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
          const theme = getCategoryTheme(category.name);
          return (
            <div 
              key={category.id} 
              className={`border-2 rounded flex items-center justify-center p-2 text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] relative overflow-hidden group ${theme.headerClass}`}
              style={{
                background: theme.headerGradient,
              }}
            >
              {theme.icon && <div className="absolute top-1 right-1 opacity-20 text-3xl select-none">{theme.icon}</div>}
              <h3 className="text-white font-bold text-xs md:text-sm lg:text-xl uppercase tracking-wide header-font leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">
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
              const theme = getCategoryTheme(category.name);
              
              return (
                <button 
                  key={question.id}
                  disabled={question.isAnswered}
                  className={`
                    relative rounded flex items-center justify-center transition-transform duration-150 outline-none focus:ring-4 focus:ring-[#ffcc00] overflow-hidden
                    ${question.isAnswered 
                      ? 'bg-[#0b0b2b] shadow-inner opacity-80 cursor-default' 
                      : 'jeopardy-texture interactive shadow-[0_4px_8px_rgba(0,0,0,0.5)] border-blue-400/30 hover:scale-[1.02] cursor-pointer'}
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
                    <span className="text-[#ffcc00] font-bold text-4xl md:text-5xl lg:text-7xl header-font drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] tracking-tighter z-10">
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