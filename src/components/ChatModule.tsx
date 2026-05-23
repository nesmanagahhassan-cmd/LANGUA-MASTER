import React, { useState, useRef, useEffect } from "react";
import { MessageSquareText, Coffee, Plane, Hotel, Map, Send, GraduationCap, Volume2, Sparkles, Loader2, ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { ChatMessage, ScenarioItem } from "../types";
import { PRESET_SCENARIOS, SUPPORTED_LANGUAGES } from "../data";

interface ChatModuleProps {
  userId: string | undefined;
  targetLanguage: string;
  level: string;
  onAddXP: (amount: number, challengeType?: 'xp' | 'vocab' | 'chat') => void;
  // Firestore sync callbacks
  onSaveMessageToFirebase: (chatId: string, msg: ChatMessage) => Promise<void>;
  onSaveChatSessionToFirebase: (chatId: string, scenarioTitle: string, score: number, feedback: string) => Promise<void>;
}

interface OfflineScenarioReply {
  reply: string;
  translation: string;
  corrections: string;
}

// Local smart conversation simulator data specifically tailored for preset scenarios, target languages, and various levels
const CHAT_FALLBACK_REPLIES: Record<string, Record<string, OfflineScenarioReply[]>> = {
  order_coffee: {
    English: [
      { reply: "Perfect! Would you like that hot or iced, and what size would you prefer?", translation: "رائع! هل تفضل ذلك ساخناً أم مثلجاً، وما هو الحجم الذي تفضله؟", corrections: "ممتاز! جملة جيدة وصحيحة. تلميح لغوي: يمكنك استخدام 'I would like to order...' لطلب مهذب ورسمي." },
      { reply: "Great choice! Would you like any milk, soy milk, or sweetener in it? We also have fresh butter croissants today.", translation: "اختيار رائع! هل ترغب في إضافة حليب أو حليب صويا أو محلي؟ لدينا أيضاً كرواسون زبدة طازج اليوم.", corrections: "أحسنت! قواعدك سليمة وتفاعلك بليغ ومفهوم." },
      { reply: "Awesome. That will be $5.50 in total. You can pay by cash or card. Enjoy your drink!", translation: "ممتاز الحساب سيكون 5.50 دولار إجمالاً. يمكنك الدفع نقداً أو بالبطاقة. استمتع بمشروبك!", corrections: "عمل مذهل! صياغة مفهومة واسترسال رائع ومستوى متقدم." }
    ],
    French: [
      { reply: "Très bien! Préférez-vous cela chaud ou glacé, et quelle taille désirez-vous?", translation: "رائع! هل تفضل ذلك ساخناً أم مثلجاً، وما هو الحجم الذي تفضله؟", corrections: "ممتاز! قواعد صحيحة. يمكنك القول 'Je voudrais' لجعل الطلب أكثر تهذيباً." },
      { reply: "Excellent choix! Voulez-vous du sucre ou du lait? Nous avons aussi de délicieux croissants.", translation: "اختيار ممتاز! هل ترغب في مضافة السكر أو الحليب؟ لدينا أيضاً كرواسون لذيذ.", corrections: "رائع جداً! جملتك واضحة. كلمة croissant تنطق بلكنة فرنسية لطيفة." },
      { reply: "C'est prêt! Ça fait 4.50 euros en tout. Voulez-vous payer par carte ou en espèces?", translation: "أصبح جاهزاً! الحساب هو 4.50 يورو إجمالاً. هل تود الدفع بالبطاقة أم نقداً؟", corrections: "عمل مذهل! صياغة مفهومة ومستوى متقدم." }
    ],
    Spanish: [
      { reply: "¡Perfecto! ¿Lo prefiere caliente o frío, y qué tamaño desea?", translation: "رائع! هل تفضله ساخناً أم بارداً، وما الحجم الذي تريده؟", corrections: "ممتاز! جملة متناسقة ورائعة باللغة الإسبانية. تلميح: استخدام 'Quiero' شائع جداً." },
      { reply: "¡Excelente elección! ¿Desea café con leche o azúcar? También tenemos croissants recién horneados.", translation: "اختيار ممتاز! هل تريد قهوة بالحليب أو السكر؟ لدينا أيضاً كرواسون مخبوز طازجاً.", corrections: "جيد جداً! قواعدك صحيحة مئة بالمئة واسترسالك ممتاز." },
      { reply: "Muy bien. Serían 3.50 euros en total. ¿Paga con tarjeta o en efectivo?", translation: "ممتاز الحساب سيكون 3.50 يورو إجمالاً. هل تود الدفع بالبطاقة أم نقداً؟", corrections: "أداء ناطق ممتاز باللغة الإسبانية وتفاعل كامل!" }
    ],
    German: [
      { reply: "Perfekt! Möchten Sie es heiß oder kalt, und welche Größe bevorzugen Sie?", translation: "رائع! هل ترغب فيه ساخناً أم بارداً، وأي حجم تفضل؟", corrections: "جيد جداً! صياغة ممتازة ومفهومة. تلميح: استخدم 'Ich hätte gerne' للطلب المهذب." },
      { reply: "Tolle Wahl! Möchten Sie Milch oder Zucker dazu? Wir haben heute auch frische Croissants.", translation: "اختيار ممتاز! هل تود إضافة حليب أو سكر؟ لدينا أيضاً كرواسون طازج اليوم.", corrections: "أحسنت! قواعد سليمة تماماً، وتفاعل ممتاز باللغة الألمانية." },
      { reply: "Ausgezeichnet. Das macht 4.20 Euro. Zahlen Sie bar oder mit Karte? Bitte schön!", translation: "ممتاز. الحساب هو 4.20 يورو. هل ستدفع نقداً أم بالبطاقة؟ تفضل!", corrections: "رائع جداً! استمر هكذا، لغتك تتقدم بشكل مذهل!" }
    ]
  },
  airport_checkin: {
    English: [
      { reply: "Perfect, thank you! Do you have any luggage to check-in today, or just carry-on bags?", translation: "ممتاز، شكراً لك! هل لديك أي أمتعة لتسجيلها اليوم، أم حقائب يد فقط؟", corrections: "مستوى رائع! جمل هادفة وصياغة دقيقة ومحققة للسيناريو." },
      { reply: "Great. Please place your suitcase on the scale. Would you prefer a window seat or an aisle seat?", translation: "جميل. من فضلك ضع حقيبتك على الميزان. هل تفضل مقعداً بجوار النافذة أم الممر؟", corrections: "رائع! تذكر أن 'Aisle seat' تنطق بإسقاط حرف الـ s صامتاً (آيل سيت)." },
      { reply: "All set! Here is your boarding pass. The gate opens in one hour. Have a wonderful flight!", translation: "كل شيء جاهز! تفضل بطاقة الصعود للطائرة. تفتح البوابة بعد ساعة. نتمنى لك رحلة ممتعة!", corrections: "ممتاز! ليس لديك أي أخطاء لفظية أو إملائية واستجابتك سريعة وطبيعية." }
    ],
    French: [
      { reply: "Parfait, merci! Avez-vous des bagages à enregistrer aujourd'hui ou seulement un sac à main?", translation: "ممتاز، شكراً لك! هل لديك أمتعة لتسجيلها اليوم أم حقيبة يد فقط؟", corrections: "ممتاز! لا توجد أخطاء في الصياغة." },
      { reply: "Veuillez poser votre valise sur la balance. Préférez-vous un siège près du couloir ou de la fenêtre?", translation: "يرجى وضع حقيبتك على الميزان. هل تفضل مقعداً بمحاذاة الممر أم النافذة؟", corrections: "رائع! تركيب لغوي ممتاز ومتقن." }
    ],
    Spanish: [
      { reply: "¡Perfecto, gracias! ¿Tiene equipaje para facturar hoy, o solo equipaje de mano?", translation: "ممتاز، شكراً لك! هل لديك أمتعة لشحنها اليوم، أم حقيبة يد فقط؟", corrections: "رائع! جملة ممتازة، تذكر أن 'Equipaje' تعني أمتعة." },
      { reply: "Muy bien. Por favor ponga su maleta en la báscula. ¿Prefiere asiento de pasillo o de ventana?", translation: "جيد جداً. من فضلك ضع حقيبتك على الميزان. هل تفضل مقعد الممر أم النافذة؟", corrections: "أحسنت! صياغة بليغة وسياق ممتع." }
    ],
    German: [
      { reply: "Perfekt, danke! Haben Sie Gepäck zum Einchecken oder nur Handgepäck?", translation: "ممتاز، شكراً! هل لديك حقائب لتسجيلها أم حقائب يد فقط؟", corrections: "ممتاز! تعبير ألماني رصين ومفهوم." },
      { reply: "Bitte stellen Sie Ihren Koffer auf die Waage. Bevorzugen Sie einen Fensterplatz oder einen Gangplatz?", translation: "يرجى وضع حقيبتك على الميزان. هل تفضل مقعداً بجانب النافذة أم الممر؟", corrections: "جميل جداً! اللفظ سليم وتفهم الألمانية بوضوح." }
    ]
  },
  hotel_booking: {
    English: [
      { reply: "Perfect! I see your reservation. Your room is on the 4th floor. Would you like a key card for extra amenities?", translation: "رائع! لقد وجدت حجزك. غرفتك في الطابق الرابع. هل ترغب في بطاقة مفتاح لمزيد من المرافق؟", corrections: "صياغة أنيقة جداً وصحيحة تماماً وملاءمة للسيناريو الفندقي." },
      { reply: "Great! Breakfast is served in our dining hall from 7 to 10 AM. Is there anything else I can assist you with today?", translation: "ممتاز! يُقدم الفطور في صالة الطعام من الساعة 7 إلى 10 صباحاً. هل هناك أي شيء آخر يمكنني مساعدتك به اليوم؟", corrections: "قواعد واضحة جداً وتواصل هادف وأداء رائع!" }
    ],
    French: [
      { reply: "Parfait! Je vois votre réservation. Votre chambre est au 4ème étage. Le petit-déjeuner est inclus.", translation: "رائع! أرى حجزك. غرفتك في الطابق الرابع. الفطور مشمول ضمن الإقامة.", corrections: "رائع جداً! جمل ممتازة وتفاعل مناسب مع موظف الفندق." }
    ],
    Spanish: [
      { reply: "¡Perfecto! Veo tu reserva. Tu habitación está en el cuarto piso. El desayuno está incluido.", translation: "ممتاز! أرى حجزك. غرفتك في الطابق الرابع. الفطور مشمول.", corrections: "رائع ولغة حوارية طبيعية ممتعة وخالية من الأخطاء النحوية." }
    ],
    German: [
      { reply: "Perfekt! Ich sehe Ihre Reservierung. Ihr Zimmer befindet sich im 4. Stock. Das Frühstück ist inklusive.", translation: "ممتاز! أرى حجزكم. جهتكم تقع في الطابق الرابع. الإفطار مشمول.", corrections: "قواعد وصياغة لغوية ممتازة وتقدم ملموس." }
    ]
  },
  ask_directions: {
    English: [
      { reply: "Oh, it is very close! Go straight for two blocks, then turn left at the traffic light.", translation: "أوه، إنه قريب جداً! سر في طريق مستقيم لتقاطعين، ثم انعطف يساراً عند إشارة المرور.", corrections: "رائع! استخدام ممتاز لأدوات التوجيه الجغرافي والمصطلحات الدلالية." },
      { reply: "Yes, you will see the subway entrance right next to the bakery. You cannot miss it!", translation: "نعم، سترى مدخل المترو بجوار المخبز مباشرة. لن تخطئه بالتأكيد!", corrections: "ممتاز! تعبيرك طبيعي جداً وسليم قواعدياً." }
    ],
    French: [
      { reply: "C'est tout près ! Allez tout droit, puis tournez à gauche au feu de signalisation.", translation: "إنه قريب جداً! اذهب مباشرة، ثم انعطف يساراً عند إشارة المرور.", corrections: "قواعد صحيحة واستخدام دقيق للأماكن الفرنسية وتوجيه صحيح وسلس." }
    ],
    Spanish: [
      { reply: "¡Está muy cerca! Siga recto y luego gire a la izquierda en el semáforo.", translation: "إنه قريب جداً! استمر في السير المستقيم ثم انعطف يساراً عند إشارة المرور.", corrections: "صياغة دقيقة وصحيحة للاستعلام بالاتجاهات بمرونة بالغة." }
    ],
    German: [
      { reply: "Es ist ganz in der Nähe! Gehen Sie geradeaus und biegen Sie an der Ampel links ab.", translation: "إنه قريب جداً! اذهب للأمام مباشرة وانعطف يساراً عند إشارة المرور.", corrections: "تعامل ألماني رائع بالاتجاهات ونطق ممتاز." }
    ]
  }
};

export default function ChatModule({
  userId,
  targetLanguage,
  level,
  onAddXP,
  onSaveMessageToFirebase,
  onSaveChatSessionToFirebase
}: ChatModuleProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem | null>(null);
  const [chatId, setChatId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [ttsState, setTtsState] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active chat session scores & evaluated tutor feedback
  const [overallScore, setOverallScore] = useState<number>(0);
  const [generalFeedback, setGeneralFeedback] = useState<string>("");

  const conversationEndRef = useRef<HTMLDivElement>(null);
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.id === targetLanguage) || SUPPORTED_LANGUAGES[0];

  // Auto scroll down chat bubbles on new entries
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Translate Scenario item icon name to Lucide element
  const getScenarioIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "Plane":
        return <Plane className={className} />;
      case "Hotel":
        return <Hotel className={className} />;
      case "Map":
        return <Map className={className} />;
      default:
        return <Coffee className={className} />;
    }
  };

  // Launch conversational exercise scenario
  const handleStartScenario = async (scenario: ScenarioItem) => {
    setSelectedScenario(scenario);
    setErrorMessage(null);
    setOverallScore(0);
    setGeneralFeedback("");
    
    const newChatId = `chat_${scenario.id}_${Date.now()}`;
    setChatId(newChatId);

    // Initial starter welcome message from Native Tutor
    const starterMsg: ChatMessage = {
      id: `msg_starter_${Date.now()}`,
      sender: "ai",
      content: scenario.initialPrompt,
      timestamp: new Date().toISOString()
    };
    setMessages([starterMsg]);

    if (userId) {
      try {
        await onSaveChatSessionToFirebase(newChatId, scenario.arabicTitle, 0, "");
        await onSaveMessageToFirebase(newChatId, starterMsg);
      } catch (err) {
        console.error("Firebase Chat init failure", err);
      }
    }
  };

  // Reads out loud using web speech browser synthesize
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLang.code;
      
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(activeLang.code.split("-")[0]));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => setTtsState(text);
      utterance.onend = () => setTtsState(null);
      utterance.onerror = () => setTtsState(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setErrorMessage("🔊 محرك النطق الصوتي غير متاح في متصفحك الحالي.");
    }
  };

  // Send human message and fetch tutor evaluation response from server API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || !selectedScenario) return;

    const userMsgVal = inputValue.trim();
    setInputValue("");
    setSending(true);
    setErrorMessage(null);

    // 1. Render User Message on screen
    const humanMsgItem: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: "user",
      content: userMsgVal,
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...messages, humanMsgItem];
    setMessages(updatedMessages);

    if (userId) {
      try {
        await onSaveMessageToFirebase(chatId, humanMsgItem);
      } catch (err) {
        console.error("Failed saving message element to cloud database", err);
      }
    }

    // 2. Query Gemini Full-Stack AI Tutor API
    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLanguage,
          level,
          scenario: selectedScenario.title,
          messages: messages,
          userMessage: userMsgVal
        })
      });

      if (!resp.ok) {
        throw new Error("Tutor API connection failed");
      }

      const data = await resp.json();

      // 3. Render AI Response with detailed parameters
      const aiReplyItem: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: "ai",
        content: data.reply,
        translation: data.translation,
        feedback: data.corrections,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiReplyItem]);

      // Award scored XP points automatically to user
      const earnedXP = data.points || 10;
      onAddXP(earnedXP, 'chat');

      // Update local cumulative scenario evaluation progress statistics
      setOverallScore(prev => Math.min(100, prev + earnedXP));
      if (data.corrections) {
        setGeneralFeedback(data.corrections);
      }

      // Sync both message and chat session status down to Firebase database
      if (userId) {
        try {
          await onSaveMessageToFirebase(chatId, aiReplyItem);
          await onSaveChatSessionToFirebase(chatId, selectedScenario.arabicTitle, Math.min(100, overallScore + earnedXP), data.corrections || "");
        } catch (f) {
          console.error("Failed executing background database operations syncing dialogue components", f);
        }
      }

    } catch (err) {
      console.warn("AI Communication Server Endpoint not found or failed (e.g. static host Vercel). Activating client fallback dialogue simulation...", err);
      
      // Determine the user's turn (count user messages in the dialogue)
      const userMessageCount = updatedMessages.filter(m => m.sender === "user").length;
      
      // Find replies map for scenario and language
      const scenarioMap = CHAT_FALLBACK_REPLIES[selectedScenario.id] || CHAT_FALLBACK_REPLIES["order_coffee"];
      const replyList = scenarioMap[targetLanguage] || scenarioMap["English"];
      
      // Pick reply based on turn count
      const fallbackIndex = Math.min(userMessageCount - 1, replyList.length - 1);
      const fallbackData = replyList[fallbackIndex] || replyList[0];

      // Simulate the tutor response
      const aiReplyItem: ChatMessage = {
        id: `msg_ai_fallback_${Date.now()}`,
        sender: "ai",
        content: fallbackData.reply,
        translation: fallbackData.translation,
        feedback: fallbackData.corrections,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiReplyItem]);

      // Award XP
      const earnedXP = 12;
      onAddXP(earnedXP, 'chat');

      // Update statistics
      setOverallScore(prev => Math.min(100, prev + earnedXP));
      if (fallbackData.corrections) {
        setGeneralFeedback(fallbackData.corrections);
      }

      // Sync message & session state if signed in
      if (userId) {
        try {
          await onSaveMessageToFirebase(chatId, aiReplyItem);
          await onSaveChatSessionToFirebase(chatId, selectedScenario.arabicTitle, Math.min(100, overallScore + earnedXP), fallbackData.corrections);
        } catch (f) {
          console.error("Failed executing background database operations syncing dialogue components", f);
        }
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 rounded-xl flex items-center justify-between gap-3 animate-fade-in font-sans">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold hover:text-rose-800 shrink-0 cursor-pointer">✕</button>
        </div>
      )}

      {/* Scenario select grid (If no scenario is active yet) */}
      {!selectedScenario ? (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="font-sans font-bold text-slate-800 text-lg flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-indigo-600" />
              <span>محادثات تفاعلية بالذكاء الاصطناعي</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              اختر أحد الحوارات الواقعية بالأسفل لتلقي تقييم وتصحيح مباشر من المعلم النحوي المعتمد لـ <span className="text-indigo-600 font-mono font-bold">{targetLanguage}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => handleStartScenario(scenario)}
                className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-100 cursor-pointer flex gap-4 group text-right"
              >
                <div className="p-3 bg-indigo-50/50 rounded-xl text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center w-12 h-12">
                  {getScenarioIcon(scenario.iconName, "w-6 h-6")}
                </div>

                <div className="space-y-1">
                  <h3 className="font-sans font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                    {scenario.arabicTitle}
                  </h3>
                  <p className="text-xs font-serif italic text-indigo-600 font-medium leading-none">
                    {scenario.title}
                  </p>
                  <p className="text-xs text-slate-400 font-sans pt-1 leading-relaxed">
                    {scenario.arabicDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Conversation Chat room workspace panel */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Chat room Header */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedScenario(null)}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="الرجوع للرئيسية"
              >
                <ArrowLeft className="w-4 h-4 transform rotate-180" />
              </button>
              
              <div>
                <h3 className="font-sans font-semibold text-slate-800 text-xs sm:text-sm">
                  محادثة: {selectedScenario.arabicTitle}
                </h3>
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  تمارس لغة {targetLanguage} • مستوى {level}
                </div>
              </div>
            </div>

            {/* Score gauge bubble */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-medium">سجل الأداء</span>
              <div className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full text-amber-700 font-mono text-xs font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 fill-amber-100" />
                <span>{overallScore} XP</span>
              </div>
            </div>
          </div>

          {/* Bubbles Speech panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm border text-right leading-relaxed ${
                      isUser
                        ? "bg-slate-800 text-slate-100 rounded-tr-none border-slate-700 text-left"
                        : "bg-white text-slate-800 rounded-tl-none border-slate-100"
                    }`}
                  >
                    {/* Message L2 Core content */}
                    <div className="font-serif text-sm sm:text-base tracking-wide font-medium">
                      {m.content}
                    </div>

                    {/* Speech Trigger for native models L2 */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between gap-3">
                        {/* Audio speaker buttons */}
                        <button
                          onClick={() => handleSpeak(m.content)}
                          className={`p-1 rounded-md text-[11px] font-sans font-medium hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer ${
                            ttsState === m.content ? "text-indigo-600 bg-indigo-50" : "text-slate-400"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>استمع للنطق الأصلي</span>
                        </button>

                        {/* Translation drop toggle */}
                        {m.translation && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-sans select-none">
                            {m.translation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Grammar feedback corrections displayed under user message balloons */}
                  {!isUser && m.feedback && (
                    <div className="mt-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-sans p-2.5 rounded-xl max-w-[85%] text-right shadow-sm flex items-start gap-1.5 animate-fade-in mr-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans font-bold block mb-0.5 text-[10px] text-emerald-700 border-b border-emerald-100 pb-0.5">تصحيح وملاحظات المعلم:</span>
                        <p className="leading-relaxed">{m.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex flex-col items-end">
                <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl p-4 inline-flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs font-sans">المعلم يفكر بنقاش ممتع لك...</span>
                </div>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>

          {/* Quick AI tips banner */}
          {generalFeedback && (
            <div className="bg-indigo-50/50 border-t border-indigo-100/50 px-4 py-2 text-[11px] font-sans text-indigo-800 text-right truncate shrink-0">
              💡 <span className="font-semibold font-sans">تلميح الدرس:</span> {generalFeedback}
            </div>
          )}

          {/* Input control tray bar form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 shrink-0 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={sending}
              placeholder={`أجب باللغة ${activeLang.nativeName} هنا... (مثال: "Yes, I want water")`}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
              dir="auto"
            />
            
            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 transition-colors shadow-sm shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 transform -rotate-180" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
