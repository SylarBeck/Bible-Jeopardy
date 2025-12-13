import { GoogleGenAI, Type } from "@google/genai";
import { GameBoardData, Category, Question, Difficulty, FinalJeopardyQuestion, Topic } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a creative and knowledgeable assistant designed to create a Jeopardy-style game board.
The topic is strictly Bible-based trivia, using the New World Translation (NWT) of the Holy Scriptures and themes commonly found on JW.org.
Avoid controversial or negative framing; keep the tone educational, spiritual, and fun.
Do not use multiple choice. 
The 'question' field is the Jeopardy clue (e.g., "This man built the ark"). Keep clues clear, concise, and direct.
The 'answer' field is the correct response (e.g., "Who is Noah?"). It MUST be between 1 and 5 words maximum.
`;

const DIFFICULTY_GUIDELINES = {
  EASY: "Difficulty: EASY. Questions should cover foundational concepts, well-known stories, and major Biblical figures. Language should be simple.",
  MEDIUM: "Difficulty: MEDIUM. Questions can delve into detailed accounts, ministry activities, and deeper spiritual gems.",
  HARD: "Difficulty: HARD. Questions should challenge users with nuanced interpretations, specific numbers/dates, and minor prophets."
};

const TOPIC_GUIDELINES: Record<Topic, string> = {
  GENERAL: "Topics: Mixed variety including people, places, events, and qualities.",
  JESUS: "Topics: Focus strictly on the life, ministry, miracles, and illustrations of Jesus Christ.",
  PROPHECY: "Topics: Focus on Daniel, Revelation, Isaiah, and Messianic prophecies.",
  HISTORY: "Topics: Focus on the history of Israel, the Kings, the Exodus, and first-century congregation history.",
  PERSONALITIES: "Topics: Focus on specific men and women of faith, their qualities, and their family lines.",
  FRUITAGE: "Topics: Focus on the Fruitage of the Spirit (Love, Joy, Peace, etc.) and Christian qualities."
};

// --- CACHING UTILS ---
const getCachedGame = (key: string): GameBoardData | null => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      console.log("Serving from cache:", key);
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Cache read error", e);
  }
  return null;
};

const setCachedGame = (key: string, data: GameBoardData) => {
  try {
    // Basic LRU: if storage full, clear all jeopardy caches
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // Clear old caches if quota exceeded
      Object.keys(localStorage).forEach(k => {
        if(k.startsWith('jeopardy_gen_')) localStorage.removeItem(k);
      });
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn("Cache write error", e);
  }
};

export const generateGame = async (difficulty: Difficulty, topic: Topic = 'GENERAL', round: 1 | 2 = 1): Promise<GameBoardData> => {
  // 1. Check Cache
  const cacheKey = `jeopardy_gen_${difficulty}_${topic}_${round}_v3`;
  const cached = getCachedGame(cacheKey);
  if (cached) return cached;

  try {
    const difficultyInstruction = DIFFICULTY_GUIDELINES[difficulty];
    const topicInstruction = TOPIC_GUIDELINES[topic];
    const values = round === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
    const roundName = round === 1 ? "Jeopardy" : "Double Jeopardy (Harder questions)";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a ${roundName} game board with 6 distinct categories.
      ${topicInstruction}
      ${difficultyInstruction}
      Each category must have exactly 5 questions with these specific point values: ${values.join(', ')}.
      CRITICAL: All answers must be 1 to 5 words maximum. Keep questions (clues) short, clear, and concise.
      For each question, provide a specific bible scripture reference (e.g. "Psalm 83:18") that supports the answer.
      Ensure categories in Round 2 are different from typical Round 1 categories if possible.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Category Title" },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        value: { type: Type.NUMBER, description: "Point value" },
                        question: { type: Type.STRING, description: "The clue text" },
                        answer: { type: Type.STRING, description: "The short answer text (1-5 words)" },
                        scripture: { type: Type.STRING, description: "Supporting scripture citation" }
                      },
                      required: ["value", "question", "answer", "scripture"]
                    }
                  }
                },
                required: ["name", "questions"]
              }
            }
          },
          required: ["categories"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No content generated");
    }

    const data = JSON.parse(response.text);
    
    const processedCategories: Category[] = data.categories.map((cat: any, catIndex: number) => ({
      id: `cat-${round}-${catIndex}`,
      name: cat.name,
      questions: cat.questions.map((q: any, qIndex: number) => ({
        id: `q-${round}-${catIndex}-${qIndex}`,
        value: q.value,
        question: q.question,
        answer: q.answer,
        scripture: q.scripture,
        isAnswered: false
      })).sort((a: Question, b: Question) => a.value - b.value)
    }));

    const result = { categories: processedCategories, round };
    
    // 2. Save to Cache
    setCachedGame(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Failed to generate game:", error);
    throw error;
  }
};

export const generateFinalJeopardy = async (): Promise<FinalJeopardyQuestion> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a single, challenging Final Jeopardy question based on deep Bible knowledge. Include a scripture reference. The answer must be extremely concise (1-5 words).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category" },
            question: { type: Type.STRING, description: "Clue" },
            answer: { type: Type.STRING, description: "Short Answer" },
            scripture: { type: Type.STRING, description: "Scripture" }
          },
          required: ["category", "question", "answer", "scripture"]
        }
      }
    });

    if (!response.text) return {
       category: "Bible Prophecy",
       question: "This world power is depicted as the feet of iron and clay in Nebuchadnezzar's dream.",
       answer: "What is Anglo-America?",
       scripture: "Daniel 2:41-43"
    };

    return JSON.parse(response.text);
  } catch (error) {
    return {
      category: "Scriptures",
      question: "This is the shortest book in the Hebrew Scriptures.",
      answer: "What is Obadiah?",
      scripture: "Obadiah 1:1"
    };
  }
};