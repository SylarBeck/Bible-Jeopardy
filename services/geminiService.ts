
import { GoogleGenAI, Type } from "@google/genai";
import { GameBoardData, Category, Question, Difficulty, FinalJeopardyQuestion, Topic } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a creative and knowledgeable assistant designed to create a Jeopardy-style game board.
The topic is strictly Bible-based trivia, using the New World Translation (NWT) of the Holy Scriptures and themes commonly found on JW.org.
Avoid controversial or negative framing; keep the tone educational, spiritual, and fun.

STRICT FORMATTING RULES:
1. The 'question' field is the Jeopardy CLUE. It must be a clear, declarative statement (e.g., "He built the ark"). Do not write it as a question.
2. The 'answer' field is the RESPONSE. It MUST be phrased in the form of a question starting with "Who is", "Who are", "What is", or "What are" (e.g., "Who is Noah?", "What is faith?").
3. REDUNDANCY CHECK: The answer must not simply repeat the clue. (Bad Example -> Clue: "Jesus spoke to this man." Answer: "Who is the man?" -> WRONG. Correct Answer: "Who is Nicodemus?").
4. CLARITY: Make the clue easy to read and grammatically simple. The difficulty should come from the bible knowledge required, not from confusing sentence structure.
5. LENGTH: The core answer (excluding the "Who is" prefix) must be short (1-5 words).
`;

const DIFFICULTY_GUIDELINES = {
  EASY: "Difficulty: EASY. Clues should be very direct statements about famous people (Moses, Jesus, David, Peter) or major events. The answer should be obvious to a basic Bible student.",
  MEDIUM: "Difficulty: MEDIUM. Clues can range into specific details, parables, ministry activities, or well-known prophets.",
  HARD: "Difficulty: HARD. Clues should focus on specific numbers, minor characters, or less common geography. Ensure the clue statement is still clear and easy to read, even if the fact itself is obscure."
};

const TOPIC_GUIDELINES: Record<Topic, string> = {
  GENERAL: "Topics: Mixed variety including people, places, events, and qualities.",
  JESUS: "Topics: Focus strictly on the life, ministry, miracles, and illustrations of Jesus Christ.",
  PROPHECY: "Topics: Focus on Daniel, Revelation, Isaiah, and Messianic prophecies.",
  HISTORY: "Topics: Focus on the history of Israel, the Kings, the Exodus, and first-century congregation history.",
  PERSONALITIES: "Topics: Focus on specific men and women of faith, their qualities, and their family lines.",
  FRUITAGE: "Topics: Focus on the Fruitage of the Spirit (Love, Joy, Peace, etc.) and Christian qualities.",
  MEETING: "Topics: THIS IS A SPECIAL REQUEST. Generate questions based on a specific meeting or article theme provided in the context."
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

export const generateGame = async (difficulty: Difficulty, topic: Topic = 'GENERAL', round: 1 | 2 = 1, customTheme: string = ''): Promise<GameBoardData> => {
  // 1. Check Cache (Include customTheme in key if applicable)
  const cacheKey = `jeopardy_gen_${difficulty}_${topic}_${round}_${customTheme.replace(/\s/g, '')}_v5`;
  const cached = getCachedGame(cacheKey);
  if (cached) return cached;

  try {
    const difficultyInstruction = DIFFICULTY_GUIDELINES[difficulty];
    let topicInstruction = TOPIC_GUIDELINES[topic];

    if (topic === 'MEETING' && customTheme) {
      topicInstruction = `Topics: Focus specifically on the theme: "${customTheme}". Generate questions that would fit a review of a Watchtower study article or Midweek meeting part about this subject.`;
    }

    const values = round === 1 ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000];
    const roundName = round === 1 ? "Jeopardy" : "Double Jeopardy (Harder questions)";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a ${roundName} game board with 6 distinct categories.
      ${topicInstruction}
      ${difficultyInstruction}
      Each category must have exactly 5 questions with these specific point values: ${values.join(', ')}.
      
      CRITICAL INSTRUCTIONS:
      1. ANSWERS MUST BE IN QUESTION FORM: Start every answer with "Who is", "Who are", "What is", or "What are".
      2. SHORT ANSWERS: The core answer (excluding the "Who is") should be 1-5 words.
      3. CLARITY: The 'question' (clue) must be a simple statement describing the subject. 
      4. NO REDUNDANCY: Do not repeat the clue in the answer.
      5. SCRIPTURE: Provide a supporting NWT bible citation.
      
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
                        question: { type: Type.STRING, description: "The clue text (Statement)" },
                        answer: { type: Type.STRING, description: "The response (Question form, e.g., Who is...)" },
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
      contents: `Generate a single, challenging Final Jeopardy question based on deep Bible knowledge. 
      The clue should be a declarative statement.
      The answer must be in question form (e.g. "What is...") and extremely concise.
      Include a scripture reference.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category" },
            question: { type: Type.STRING, description: "Clue (Statement)" },
            answer: { type: Type.STRING, description: "Answer (Question Form)" },
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
