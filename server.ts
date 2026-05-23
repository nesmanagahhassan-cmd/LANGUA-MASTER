import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini L2 Tutor AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY is not defined. AI interactions will run in helper mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_STANDALONE",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. AI Conversation Partner Endpoint L2
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { targetLanguage, level, scenario, messages, userMessage } = req.body;
    
    // Fallback if no API key is specified
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `Hi! This is a mock feedback because GEMINI_API_KEY is not configured yet. You are practicing ${scenario} in ${targetLanguage} at a ${level} level.`,
        translation: `مرحباً! هذا رد تجريبي لأن مفتاح الذكاء الاصطناعي غير مفعل بعد. أنت تتدرب على "${scenario}" باللغة "${targetLanguage}" للمستوى "${level}".`,
        corrections: `تصحيح تجريبي: رائع جداً، استمر بالحديث!`,
        points: 10
      });
    }

    const client = getGeminiClient();
    
    // We construct a specific tutor prompt with constraints
    const systemInstruction = `You are an elite, highly encouraging personal native language tutor specializing in teaching ${targetLanguage} to an Arabic speaker.
The user's proficiency level is ${level}.
The scenario they are practicing is: "${scenario}".
Conduct a natural, immersion-based conversational dialogue in ${targetLanguage}. Keep your sentences length and vocabulary complexity fully adapted to the user's level (${level}).
You MUST also evaluate the user's last sentence: "${userMessage}".
Check if there are any grammatical errors, spelling typos, or better word selections, and write a friendly explanation in Arabic.
Be polite and positive. Respond in strict JSON format.`;

    const contents = [
      // Format chat messages
      ...messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      })),
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ];

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Your conversational response in L2 target language (e.g. English, Spanish, etc.). It must advance the scenario."
            },
            translation: {
              type: Type.STRING,
              description: "The direct translation of your L2 reply into Arabic so the user can verify if they don't understand."
            },
            corrections: {
              type: Type.STRING,
              description: "Analyze userMessage. Point out any errors, vocabulary improvements, or pronunciation hints, and explain clearly in Arabic what could be said better. Tell them 'ممتاز! ليس لديك أي أخطاء' if it's flawless."
            },
            points: {
              type: Type.INTEGER,
              description: "From 5 to 15, score how good the user's effort was based on grammar complexity and appropriateness."
            }
          },
          required: ["reply", "translation", "corrections", "points"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini Tutor Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong in conversational partner" });
  }
});

// 2. Vocabulary Generation / Daily Word List generator
app.post("/api/ai/vocabulary", async (req, res) => {
  try {
    const { targetLanguage, level } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Return beautiful default words in L2 and L1 depending on chosen target language, randomized for dynamics
      const fallbackVocab: Record<string, any[]> = {
        English: [
          { word: "Immersive", translation: "غمر تفاعلي / استيعابي", pronunciation: "/ɪˈmɜːsɪv/", sentence: "Immersive learning helps you master languages.", sentenceTranslation: "التعلم الاستيعابي يساعدك على إتقان اللغات." },
          { word: "Fluency", translation: "الطلاقة", pronunciation: "/ˈfluːənsi/", sentence: "Daily practice is the key to fluency.", sentenceTranslation: "الممارسة اليومية هي مفتاح الطلاقة الإملائية." },
          { word: "Vocabulary", translation: "مفردات لغوية", pronunciation: "/vəˈkæbjʊləri/", sentence: "Write down new vocabulary in your logs.", sentenceTranslation: "اكتب المفردات الجديدة في سجلاتك." },
          { word: "Cognitive", translation: "معرفي / إدراكي", pronunciation: "/ˈkɒɡnətɪv/", sentence: "Learning bilingual skills improves cognitive flexibility.", sentenceTranslation: "تعلم المهارات ثنائية اللغة يحسن المرونة المعرفية." },
          { word: "Articulate", translation: "فصيح / بليغ", pronunciation: "/ɑːˈtɪkjʊlət/", sentence: "She is an articulate speaker of English.", sentenceTranslation: "إنها متحدثة فصيحة باللغة الإنجليزية." },
          { word: "Persistence", translation: "المثابرة / الإصرار", pronunciation: "/pəˈsɪstəns/", sentence: "Your persistence in learning will pay off.", sentenceTranslation: "مثابرتك في التعلم ستؤتي ثمارها." },
          { word: "Comprehend", translation: "يستوعب / يفهم", pronunciation: "/ˌkɒmprɪˈhɛnd/", sentence: "Listen carefully to comprehend native speech.", sentenceTranslation: "استمع بعناية لفهم واستيعاب كلام أهل الكلمة الأصليين." },
          { word: "Ecolocation", translation: "تحديد الموقع بالصدى", pronunciation: "/ˌɛkoʊloʊˈkeɪʃən/", sentence: "Bats use ecolocation to navigate the night sky.", sentenceTranslation: "تستخدم الخفافيش تحديد الموقع بالصدى للتنقل في سماء الليل." }
        ],
        French: [
          { word: "Apprentissage", translation: "التعلم", pronunciation: "/ap.ʁɑ̃.ti.saʒ/", sentence: "L'apprentissage est un long voyage.", sentenceTranslation: "التعلم رحلة طويلة." },
          { word: "Courageux", translation: "شجاع", pronunciation: "/ku.ʁa.ʒø/", sentence: "Il faut être courageux pour parler une nouvelle langue.", sentenceTranslation: "يجب أن تكون شجاعاً لتتحدث لغة جديدة." },
          { word: "Améliorer", translation: "يُحسن / يطوّر", pronunciation: "/a.me.ljo.ʁe/", sentence: "Je veux améliorer ma prononciation.", sentenceTranslation: "أريد تحسين نطق الكلمات الخاص بي." },
          { word: "Bilingue", translation: "ثنائي اللغة", pronunciation: "/bi.lɛ̃ɡ/", sentence: "Devenir bilingue ouvre de nombreuses portes.", sentenceTranslation: "أن تصبح ثنائي اللغة يفتح لك أبواباً كثيرة." },
          { word: "Quotidien", translation: "يومي", pronunciation: "/kɔ.ti.djɛ̃/", sentence: "La pratique quotidienne est indispensable.", sentenceTranslation: "الممارسة اليومية أمر لا غنى عنه." }
        ],
        Spanish: [
          { word: "Aprender", translation: "يتعلم", pronunciation: "/a.pɾenˈdeɾ/", sentence: "Quiero aprender español con fluidez.", sentenceTranslation: "أريد تعلم الإسبانية بطلاقة." },
          { word: "Éxito", translation: "النجاح", pronunciation: "/ˈeɡ.si.to/", sentence: "La persistencia lleva al éxito.", sentenceTranslation: "المثابرة تؤدي إلى النجاح." },
          { word: "Desafío", translation: "التحدي", pronunciation: "/de.saˈfi.o/", sentence: "Aprender un idioma es un hermoso desafío.", sentenceTranslation: "تعلم لغة هو تحدٍ جميل." },
          { word: "Entender", translation: "يفهم", pronunciation: "/en.tenˈdeɾ/", sentence: "Ahora puedo entender mejor las canciones.", sentenceTranslation: "الآن يمكنني فهم الأغاني بشكل أفضل." },
          { word: "Vocabulario", translation: "المفردات", pronunciation: "/bo.ka.βuˈla.ɾjo/", sentence: "Practico vocabulario nuevo cada mañana.", sentenceTranslation: "أتدرب على مفردات جديدة كل صباح." }
        ],
        German: [
          { word: "Wortschatz", translation: "الثروة اللغوية / المفردات", pronunciation: "/ˈvɔʁtˌʃats/", sentence: "Er erweitert seinen Wortschatz täglich.", sentenceTranslation: "إنّه يوسع ثروته اللغوية يومياً." },
          { word: "Erfolg", translation: "النجاح", pronunciation: "/ɛɐ̯ˈfɔlk/", sentence: "Übung bringt Erfolg.", sentenceTranslation: "الممارسة تجلب النجاح." },
          { word: "Herausforderung", translation: "تحدي / صعوبة ممتعة", pronunciation: "/hɛˈʁaʊ̯sfɔʁdəʁʊŋ/", sentence: "Die Aussprache ist eine kleine Herausforderung.", sentenceTranslation: "النطق يمثل تحدياً صغيراً." },
          { word: "Verstehen", translation: "يفهم / يستوعب", pronunciation: "/fɛɐ̯/ˈʃteːən/", sentence: "Ich kann dich jetzt gut verstehen.", sentenceTranslation: "أستطيع فهمك جيداً الآن." },
          { word: "Geduld", translation: "الصبر", pronunciation: "/ɡəˈdʊlt/", sentence: "Sprachenlernen erfordert viel Geduld.", sentenceTranslation: "تعلم اللغات يتطلب الكثير من الصبر." }
        ]
      };

      const selectedList = fallbackVocab[targetLanguage] || fallbackVocab["English"];
      const shuffled = [...selectedList].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      return res.json({ words: selected });
    }

    const client = getGeminiClient();
    const systemInstruction = `You are a professional dictionary database engine generating top vocabulary words of the day for learning ${targetLanguage} adapted to level ${level}.
Return exactly 3 high-impact words with their translation to Arabic, phonetic IPA pronunciations, illustrative sample L2 sentence, and the Arabic translation of that sentence.
Response must be in strict JSON representation according to the schema.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate 3 vocabulary words of the day for learning ${targetLanguage} at level ${level}.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  sentence: { type: Type.STRING },
                  sentenceTranslation: { type: Type.STRING }
                },
                required: ["word", "translation", "pronunciation", "sentence", "sentenceTranslation"]
              }
            }
          },
          required: ["words"]
        }
      }
    });

    const resultText = response.text || '{"words": []}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Vocabulary generation error:", error);
    res.status(500).json({ error: error.message || "Failed generating vocabulary" });
  }
});

// Vite Middleware orchestration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Language Hub Server (Express + Vite) booting up on http://localhost:${PORT}`);
  });
}

startServer();
