import { useState, useEffect } from "react";
import { Volume2, Sparkles, Check, BookmarkCheck, BookOpen, Loader2, PlayCircle, Award } from "lucide-react";
import { VocabularyItem } from "../types";
import { SUPPORTED_LANGUAGES } from "../data";

interface VocabModuleProps {
  userId: string | undefined;
  targetLanguage: string;
  level: string;
  onAddXP: (amount: number, challengeType?: 'xp' | 'vocab' | 'chat') => void;
  // Firestore sync callbacks
  onSaveWordToFirebase: (word: VocabularyItem) => Promise<void>;
  savedWordsList: VocabularyItem[];
  onNavigateToChat?: () => void;
}

// Comprehensive local fallback database for learning target languages offline or on static Vercel deploys
const CLIENT_FALLBACK_VOCAB: Record<string, Record<string, any[]>> = {
  English: {
    Beginner: [
      { word: "Welcome", translation: "أهلاً وسهلاً", pronunciation: "/ˈwelkəm/", sentence: "Welcome to our beautiful country!", sentenceTranslation: "مرحباً بك في بلدنا الجميل!" },
      { word: "Journey", translation: "رحلة / مسيرة ممتعة", pronunciation: "/ˈdʒɜːrni/", sentence: "Learning a language is an amazing journey.", sentenceTranslation: "تعلم لغة هو رحلة مذهلة." },
      { word: "Explore", translation: "يستكشف", pronunciation: "/ɪkˈsplɔːr/", sentence: "Let's explore new words every day.", sentenceTranslation: "دعنا نستكشف كلمات جديدة كل يوم." },
      { word: "Patience", translation: "الصبر", pronunciation: "/ˈpeɪʃəns/", sentence: "Learning English needs some patience.", sentenceTranslation: "تعلم الإنجليزية يتطلب الصبر." },
      { word: "Nurture", translation: "يغذي / يرعى الموهبة", pronunciation: "/ˈnɜːrtʃər/", sentence: "We must nurture our pronunciation skills.", sentenceTranslation: "يجب علينا رعاية وتغذية مهارات نطقنا الصوتي." }
    ],
    Intermediate: [
      { word: "Immersive", translation: "غمر تفاعلي / استيعابي", pronunciation: "/ɪˈmɜːsɪv/", sentence: "Immersive learning helps you master languages.", sentenceTranslation: "التعلم الاستيعابي يساعدك على إتقان اللغات." },
      { word: "Fluency", translation: "الطلاقة والتحدث بمرونة", pronunciation: "/ˈfluːənsi/", sentence: "Daily practice is the key to fluency.", sentenceTranslation: "الممارسة اليومية هي مفتاح الطلاقة." },
      { word: "Cognitive", translation: "معرفي / إدراكي", pronunciation: "/ˈkɒɡnətɪv/", sentence: "Learning bilingual skills improves cognitive flexibility.", sentenceTranslation: "تعلم المهارات ثنائية اللغة يحسن المرونة المعرفية." },
      { word: "Articulate", translation: "فصيح / بليغ بالقول", pronunciation: "/ɑːˈtɪkjʊlət/", sentence: "She is an articulate speaker of English.", sentenceTranslation: "إنها متحدثة فصيحة باللغة الإنجليزية." }
    ],
    Advanced: [
      { word: "Serendipity", translation: "صدفة سعيدة / توفيق غير متوقع", pronunciation: "/ˌserənˈdɪpəti/", sentence: "They met by pure serendipity at the library.", sentenceTranslation: "التقوا بالصدفة السعيدة المحضة في المكتبة." },
      { word: "Quintessential", translation: "جوهري / نموذج مثالي", pronunciation: "/ˌkwɪntɪˈsenʃl/", sentence: "This is the quintessential English cottage.", sentenceTranslation: "هذا هو الكوخ الإنجليزي الأكثر نموذجية وجوهرية." }
    ]
  },
  French: {
    Beginner: [
      { word: "Bonjour", translation: "مرحباً / صباح الخير", pronunciation: "/bɔ̃.ʒuʁ/", sentence: "Bonjour mon cher ami!", sentenceTranslation: "صباح الخير يا صديقي العزيز!" },
      { word: "Merci", translation: "شكراً لك", pronunciation: "/mɛʁ.si/", sentence: "Merci beaucoup pour votre aide précieuse.", sentenceTranslation: "شكراً جزيلاً لك على مساعدتك القيمة." },
      { word: "Voyage", translation: "سفر / رحلة", pronunciation: "/vwa.jaʒ/", sentence: "Bon voyage à Paris!", sentenceTranslation: "رحلة سعيدة إلى باريس!" }
    ],
    Intermediate: [
      { word: "Apprentissage", translation: "التعلّم / عملية التدريب", pronunciation: "/ap.ʁɑ̃.ti.saʒ/", sentence: "L'apprentissage est un long voyage.", sentenceTranslation: "التعلم رحلة طويلة." },
      { word: "Améliorer", translation: "يُحسن / يطوّر", pronunciation: "/a.me.ljo.ʁe/", sentence: "Je veux améliorer ma prononciation.", sentenceTranslation: "أريد تحسين نطق الكلمات الخاص بي." },
      { word: "Bilingue", translation: "ثنائي اللغة", pronunciation: "/bi.lɛ̃ɡ/", sentence: "Devenir bilingue ouvre de nombreuses portes.", sentenceTranslation: "أن تصبح ثنائي اللغة يفتح لك أبواباً كثيرة." }
    ],
    Advanced: [
      { word: "Inébranlable", translation: "راسخ / ثابت لا يتزعزع", pronunciation: "/i.ne.bʁɑ̃.labl/", sentence: "Il a une confiance inébranlable en sa mémoire.", sentenceTranslation: "لديه ثقة راسخة لا تتزعزع في ذاكرته." }
    ]
  },
  Spanish: {
    Beginner: [
      { word: "Aprender", translation: "يتعلم", pronunciation: "/a.pɾenˈdeɾ/", sentence: "Quiero aprender español.", sentenceTranslation: "أريد تعلم الإسبانية." },
      { word: "Hola", translation: "مرحباً", pronunciation: "/ˈo.la/", sentence: "Hola, ¿cómo estás hoy?", sentenceTranslation: "مرحباً، كيف حالك اليوم؟" },
      { word: "Gracias", translation: "شكراً لك", pronunciation: "/ˈɡɾa.sjas/", sentence: "Muchas gracias por tu amistad.", sentenceTranslation: "شكراً جزيلاً لك على صداقتك." }
    ],
    Intermediate: [
      { word: "Éxito", translation: "النجاح", pronunciation: "/ˈeɡ.si.to/", sentence: "La persistencia lleva al éxito.", sentenceTranslation: "المثابرة تؤدي إلى النجاح." },
      { word: "Desafío", translation: "التحدي اللغوي القوي", pronunciation: "/de.saˈfi.o/", sentence: "Aprender un idioma es un hermoso desafío.", sentenceTranslation: "تعلم لغة هو تحدٍ جميل." }
    ],
    Advanced: [
      { word: "Inexorable", translation: "حتمي / لا مفر منه", pronunciation: "/in.ek.soˈɾa.βle/", sentence: "El paso del tiempo es inexorable.", sentenceTranslation: "مرور الوقت حتمي ولا مفر منه." }
    ]
  },
  German: {
    Beginner: [
      { word: "Hallo", translation: "مرحباً", pronunciation: "/haˈloː/", sentence: "Hallo, mein Name ist Lukas.", sentenceTranslation: "مرحباً، اسمي لوكاس." },
      { word: "Danke", translation: "شكراً", pronunciation: "/ˈdaŋkə/", sentence: "Vielen danke für alles.", sentenceTranslation: "شكراً جزيلاً على كل شيء." }
    ],
    Intermediate: [
      { word: "Wortschatz", translation: "الثروة اللغوية / المفردات", pronunciation: "/ˈvɔʁtˌʃats/", sentence: "Er erweitert seinen Wortschatz täglich.", sentenceTranslation: "إنّه يوسع ثروته اللغوية يومياً." },
      { word: "Erfolg", translation: "النجاح المشرق", pronunciation: "/ɛɐ̯ˈfɔlk/", sentence: "Übung bringt Erfolg.", sentenceTranslation: "الممارسة تجلب النجاح." }
    ],
    Advanced: [
      { word: "Ausgezeichnet", translation: "ممتاز / بارز الجودة", pronunciation: "/ˈaʊ̯sɡəˌtsaɪ̯çnət/", sentence: "Ihre Aussprache ist ausgezeichnet.", sentenceTranslation: "نطق الكلمات الخاص بك ممتاز للغاية." }
    ]
  }
};

export default function VocabModule({
  userId,
  targetLanguage,
  level,
  onAddXP,
  onSaveWordToFirebase,
  savedWordsList,
  onNavigateToChat
}: VocabModuleProps) {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ttsState, setTtsState] = useState<string | null>(null); // tracks active spoken word to animate icon
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.id === targetLanguage) || SUPPORTED_LANGUAGES[0];

  // Load new vocabulary word set of the day from backend AI with fallback mechanics
  const fetchNewWordsOfTheDay = async () => {
    setLoading(true);
    setToastMessage(null);
    try {
      const resp = await fetch("/api/ai/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage, level })
      });
      
      if (!resp.ok) {
        throw new Error(`API returned standard error status ${resp.status}`);
      }

      const data = await resp.json();
      if (data.words && data.words.length > 0) {
        const mapped: VocabularyItem[] = data.words.map((w: any, idx: number) => ({
          id: `${targetLanguage.toLowerCase()}_${w.word.toLowerCase()}_${Date.now()}_${idx}`,
          word: w.word,
          translation: w.translation,
          pronunciation: w.pronunciation || "/---/",
          sentence: w.sentence || "",
          sentenceTranslation: w.sentenceTranslation || "",
          masteryLevel: 0,
          updatedAt: new Date().toISOString()
        }));
        setWords(mapped);
        
        // Award modest XP for requesting new dictionary words
        onAddXP(5);
        showToast("💡 تم توليد مجموعة كلمات ذكية جديدة للمستوى الحالي!");
        return;
      }
      throw new Error("No words array received in response structure");
    } catch (e) {
      console.warn("Express endpoint failed or returned non-JSON/404. Switching to local interactive database fallback...", e);
      
      // Select appropriate fallback list based on language and level
      const languageMap = CLIENT_FALLBACK_VOCAB[targetLanguage] || CLIENT_FALLBACK_VOCAB["English"];
      const levelKey = level === "Advanced" ? "Advanced" : level === "Intermediate" ? "Intermediate" : "Beginner";
      const rawList = languageMap[levelKey] || languageMap["Beginner"];
      
      // Shuffle the list and take 3 items always!
      const shuffled = [...rawList].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      
      const mappedFallbacks: VocabularyItem[] = selected.map((w: any, idx: number) => ({
        id: `${targetLanguage.toLowerCase()}_${w.word.toLowerCase()}_${Date.now()}_${idx}`,
        word: w.word,
        translation: w.translation,
        pronunciation: w.pronunciation || "/---/",
        sentence: w.sentence || "",
        sentenceTranslation: w.sentenceTranslation || "",
        masteryLevel: 0,
        updatedAt: new Date().toISOString()
      }));

      setWords(mappedFallbacks);
      onAddXP(5);
      showToast("💡 تم تجديد وتوليد الكلمات محلياً وبنجاح تام! (تم التجديد بمرونة)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewWordsOfTheDay();
  }, [targetLanguage, level]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Speaks aloud L2 words using standard Web Speech API
  const handleTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop active speeches
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLang.code;
      
      // Attempt to bind an L2 voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(activeLang.code.split("-")[0]));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => setTtsState(text);
      utterance.onend = () => setTtsState(null);
      utterance.onerror = () => setTtsState(null);

      window.speechSynthesis.speak(utterance);
    } else {
      showToast("🔊 عذراً، محرك النطق الصوتي غير مدعوم في متصفحك الحالي.");
    }
  };

  // Change individual word mastery state and sync back with Firestore
  const handleUpdateMastery = async (wordItem: VocabularyItem, newMastery: number) => {
    const updated = {
      ...wordItem,
      masteryLevel: newMastery,
      updatedAt: new Date().toISOString()
    };

    // Update state lists
    setWords(prev => prev.map(w => w.id === wordItem.id ? updated : w));

    if (userId) {
      try {
        await onSaveWordToFirebase(updated);
        
        if (newMastery === 2) {
          // Award mastery experience points!
          onAddXP(15, 'vocab');
          showToast(`🏆 أحسنت! كسبت +15 نقطة خبرة لإتقانك كلمة "${wordItem.word}"`);
        } else {
          onAddXP(5, 'vocab');
        }
      } catch (err) {
        console.error("Firestore Vocabulary update error", err);
        showToast("⚠️ تم حفظ الكلمة محلياً فقط. فشل تحديث السحابية.");
      }
    } else {
      showToast("📝 تم التحديث محلياً! قم بتسجيل الدخول لمزامنة تقويم مفرداتك.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-slate-900 border border-slate-800 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 font-bold hover:text-white shrink-0 cursor-pointer">✕</button>
        </div>
      )}

      {/* Vocab Header control panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-sans font-bold text-slate-800 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>قاموس الكلمات الذكي</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            توسيع رصيدك اللغوي في <span className="text-indigo-600 font-medium font-sans">{activeLang.name}</span> للمستوى <span className="text-indigo-600 font-medium font-sans">{level}</span>.
          </p>
        </div>

        <button
          onClick={fetchNewWordsOfTheDay}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-indigo-400 disabled:to-violet-400 text-white font-sans font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>توليد مفردات جديدة</span>
        </button>
      </div>

      {/* Dynamic Conversational Reminder Box */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="font-sans font-bold text-slate-800 text-xs sm:text-sm">💬 ممارسة التحدث والتقييم الفوري متوفرة الآن!</h4>
          <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
            لقياس مهارات التحدث والتفاعل والذكاء الاصطناعي، يرجى الانتقال إلى تبويب <strong className="text-indigo-700 font-semibold font-sans">"محادثة الذكاء الاصطناعي 💬"</strong> في الشريط العلوي لتشغيل حوار محاكاة حي والحصول على تصحيح فوري لقواعدك النحوية ونطقك الصوتي!
          </p>
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="mt-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-sans font-bold rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 duration-100 flex items-center gap-1 shrink-0"
            >
              <span>انتقل إلى محادثة الذكاء الاصطناعي الآن 💬 🚀</span>
            </button>
          )}
        </div>
      </div>

      {/* Flashcards List Box Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-1 md:col-span-3 py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-sans font-medium text-slate-500">جاري الاستعلام عن الكلمات وحفظ الترجمات من الذكاء الاصطناعي...</p>
          </div>
        ) : words.length === 0 ? (
          <div className="col-span-1 md:col-span-3 py-16 text-slate-400 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            لم نجد أي كلمات مفردات بعد. جرب توليد الكلمات باستخدام الزر بالأعلى!
          </div>
        ) : (
          words.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between h-full"
            >
              {/* Mastery state banner decor */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-slate-100">
                <div
                  className={`h-full transition-all duration-300 ${
                    w.masteryLevel === 2
                      ? "bg-emerald-500"
                      : w.masteryLevel === 1
                      ? "bg-amber-400"
                      : "bg-slate-200"
                  }`}
                />
              </div>

              {/* Upper Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-medium text-indigo-600 tracking-wide">
                      {w.pronunciation}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-tight mt-0.5">
                      {w.word}
                    </h3>
                  </div>

                  {/* Speak Aloud Button */}
                  <button
                    onClick={() => handleTTS(w.word)}
                    className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                      ttsState === w.word
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600 scale-105"
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                    }`}
                    title="استمع للنطق الصوتي"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Translation translation line */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] text-slate-400 block font-sans">الترجمة العربية</span>
                  <p className="text-sm font-sans font-bold text-slate-700 mt-0.5">
                    {w.translation}
                  </p>
                </div>

                {/* Practical Example Sentence */}
                {w.sentence && (
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-sans block">مثال تطبيقي:</span>
                    <p className="font-serif italic text-slate-600 font-medium">
                      "{w.sentence}"
                    </p>
                    <p className="text-slate-500 font-sans text-[11px]">
                      {w.sentenceTranslation}
                    </p>
                  </div>
                )}
              </div>

              {/* Spaced repetition button triggers */}
              <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between gap-1.5">
                <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider text-slate-400">حالة الكلمة</span>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button
                    onClick={() => handleUpdateMastery(w, 1)}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-sans font-semibold transition-all cursor-pointer ${
                      w.masteryLevel === 1
                        ? "bg-amber-400 text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    أتعلمها
                  </button>
                  <button
                    onClick={() => handleUpdateMastery(w, 2)}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-sans font-semibold transition-all flex items-center gap-0.5 cursor-pointer ${
                      w.masteryLevel === 2
                        ? "bg-emerald-500 text-white shadow-sm font-sans"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>أتقنتها!</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historical Learned Words log panel */}
      {savedWordsList.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-500" />
              <span>أرشيف كلماتك المحفوظة مؤخراً ({savedWordsList.length})</span>
            </h3>
            <span className="text-[10px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">تحديث فوري سحابي</span>
          </div>

          <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto pr-1">
            {savedWordsList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleTTS(item.word)}
                className="bg-slate-50 border border-slate-100/80 hover:border-indigo-100 px-3 py-2 rounded-xl text-left cursor-pointer transition-all hover:bg-indigo-50/20 flex items-center justify-between gap-4 group"
              >
                <div>
                  <span className="font-sans font-bold text-xs text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {item.word}
                  </span>
                  <div className="text-[10px] text-slate-400 font-sans">
                    {item.translation}
                  </div>
                </div>
                
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  item.masteryLevel === 2 ? "bg-emerald-500" : "bg-amber-400"
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
