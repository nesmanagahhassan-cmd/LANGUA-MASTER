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
      console.error("AI Communication critical malfunction", err);
      setErrorMessage("⚠️ عذراً! واجهت منصة الذكاء الاصطناعي صعوبات في معالجة الجملة المكتوبة. يرجى المحاولة لاحقاً.");
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
