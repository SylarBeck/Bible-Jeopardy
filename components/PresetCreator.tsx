import React, { useState } from 'react';
import { GameBoardData, Category, FinalJeopardyQuestion } from '../types';
import { saveCustomPreset } from '../services/presetGameService';

interface PresetCreatorProps {
  onBack: () => void;
  onSave: () => void;
}

const EMPTY_BOARD: GameBoardData = {
  categories: Array.from({ length: 6 }).map((_, i) => ({
    id: `new-cat-${i}`,
    name: `Category ${i + 1}`,
    questions: [200, 400, 600, 800, 1000].map((val, qI) => ({
      id: `q-${i}-${qI}`,
      value: val,
      question: "",
      answer: "",
      scripture: "",
      isAnswered: false
    }))
  })),
  round: 1
};

const EMPTY_FINAL: FinalJeopardyQuestion = {
  category: "Final Category",
  question: "",
  answer: "",
  scripture: ""
};

export const PresetCreator: React.FC<PresetCreatorProps> = ({ onBack, onSave }) => {
  const [title, setTitle] = useState("My New Game");
  const [desc, setDesc] = useState("A custom game pack.");
  const [board, setBoard] = useState<GameBoardData>(EMPTY_BOARD);
  const [final, setFinal] = useState<FinalJeopardyQuestion>(EMPTY_FINAL);
  const [activeCatIndex, setActiveCatIndex] = useState(0);

  const handleCatNameChange = (val: string) => {
    const newCats = [...board.categories];
    newCats[activeCatIndex].name = val;
    setBoard({ ...board, categories: newCats });
  };

  const handleQuestionChange = (qIndex: number, field: 'question' | 'answer' | 'scripture', val: string) => {
    const newCats = [...board.categories];
    // @ts-ignore
    newCats[activeCatIndex].questions[qIndex][field] = val;
    setBoard({ ...board, categories: newCats });
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }
    saveCustomPreset(board, final, { title, description: desc });
    onSave();
  };

  const activeCat = board.categories[activeCatIndex];

  return (
    <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-[#120a1f] text-white rounded-xl shadow-2xl overflow-hidden border border-white/10">
      
      {/* Header */}
      <div className="bg-[#2a1a4a] p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="text-2xl font-bold header-font">Create Game Pack</h2>
        <div className="flex gap-4">
           <button onClick={onBack} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded font-bold uppercase text-sm">Cancel</button>
           <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold uppercase text-sm shadow-md">Save Pack</button>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden">
        
        {/* Sidebar / Config */}
        <div className="w-1/3 min-w-[300px] bg-[#1a1a2e] border-r border-white/10 p-6 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-xs uppercase font-bold text-white/50 mb-1">Pack Title</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 rounded p-2 text-white font-bold"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs uppercase font-bold text-white/50 mb-1">Description</label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              className="w-full bg-black/40 border border-white/20 rounded p-2 text-sm h-20"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-sm uppercase font-bold text-[#ffcc00] mb-2 border-b border-white/10 pb-1">Categories</h3>
            <div className="space-y-2">
              {board.categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCatIndex(idx)}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    activeCatIndex === idx 
                      ? 'bg-[#5e35b1] border-[#ffcc00] text-white font-bold' 
                      : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs opacity-50 block">Column {idx + 1}</span>
                  {cat.name || "(No Title)"}
                </button>
              ))}
              <button
                onClick={() => setActiveCatIndex(99)}
                className={`w-full text-left p-3 rounded border transition-all ${
                  activeCatIndex === 99
                    ? 'bg-[#b71c1c] border-[#ffcc00] text-white font-bold' 
                    : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/5'
                }`}
              >
                 <span className="text-xs opacity-50 block">End Game</span>
                 Final Jeopardy
              </button>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-grow p-8 overflow-y-auto bg-[#0f0f1a]">
          {activeCatIndex === 99 ? (
             <div className="max-w-3xl mx-auto animate-fade-in">
               <h3 className="text-3xl font-bold header-font mb-6 text-red-500">Edit Final Jeopardy</h3>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold uppercase text-white/60 mb-1">Category Title</label>
                   <input 
                      value={final.category}
                      onChange={e => setFinal({...final, category: e.target.value})}
                      className="w-full p-3 text-lg bg-black/30 border border-white/20 rounded focus:border-red-500 outline-none"
                   />
                 </div>
                 
                 <div className="p-6 bg-black/20 rounded border border-white/10">
                    <div className="mb-4">
                      <label className="block text-xs font-bold uppercase text-white/50 mb-1">The Question (Clue)</label>
                      <textarea 
                        value={final.question}
                        onChange={e => setFinal({...final, question: e.target.value})}
                        className="w-full p-3 bg-black/40 border border-white/20 rounded focus:border-red-500 outline-none h-32"
                        placeholder="e.g. This king..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-1">The Answer</label>
                        <input 
                          value={final.answer}
                          onChange={e => setFinal({...final, answer: e.target.value})}
                          className="w-full p-3 bg-black/40 border border-white/20 rounded focus:border-red-500 outline-none"
                          placeholder="e.g. Who is Solomon?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-1">Scripture Ref</label>
                        <input 
                          value={final.scripture}
                          onChange={e => setFinal({...final, scripture: e.target.value})}
                          className="w-full p-3 bg-black/40 border border-white/20 rounded focus:border-red-500 outline-none"
                          placeholder="e.g. 1 Kings 3:1"
                        />
                      </div>
                    </div>
                 </div>
               </div>
             </div>
          ) : (
             <div className="max-w-3xl mx-auto animate-fade-in">
               <div className="mb-8">
                 <label className="block text-sm font-bold uppercase text-white/60 mb-1">Column {activeCatIndex + 1} Title</label>
                 <input 
                    value={activeCat.name}
                    onChange={e => handleCatNameChange(e.target.value)}
                    className="w-full p-4 text-3xl font-bold header-font bg-black/30 border border-white/20 rounded focus:border-[#ffcc00] outline-none text-[#ffcc00]"
                    placeholder="ENTER CATEGORY NAME"
                 />
               </div>

               <div className="space-y-6">
                 {activeCat.questions.map((q, qIdx) => (
                   <div key={q.id} className="p-4 bg-black/20 rounded border border-white/10 hover:border-white/30 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                         <span className="font-bold text-[#ffcc00] text-xl">${q.value}</span>
                         <span className="text-xs uppercase bg-white/10 px-2 py-1 rounded text-white/50">Row {qIdx + 1}</span>
                      </div>
                      
                      <div className="mb-3">
                        <input 
                          value={q.question}
                          onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                          className="w-full p-2 bg-black/40 border border-white/10 rounded focus:border-blue-500 outline-none text-white placeholder-white/20"
                          placeholder={`Clue for $${q.value}...`}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          value={q.answer}
                          onChange={e => handleQuestionChange(qIdx, 'answer', e.target.value)}
                          className="w-full p-2 bg-black/40 border border-white/10 rounded focus:border-green-500 outline-none text-sm"
                          placeholder="Correct Answer..."
                        />
                         <input 
                          value={q.scripture}
                          onChange={e => handleQuestionChange(qIdx, 'scripture', e.target.value)}
                          className="w-full p-2 bg-black/40 border border-white/10 rounded focus:border-yellow-500 outline-none text-sm"
                          placeholder="Scripture..."
                        />
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};