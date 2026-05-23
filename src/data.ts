import { AwardBadge, ScenarioItem, DailyChallenge } from "./types";

export const SUPPORTED_LANGUAGES = [
  { id: "English", name: "الإنجليزية (English)", nativeName: "English", code: "en-US", flag: "🇺🇸" },
  { id: "French", name: "الفرنسية (Français)", nativeName: "Français", code: "fr-FR", flag: "🇫🇷" },
  { id: "Spanish", name: "الإسبانية (Español)", nativeName: "Español", code: "es-ES", flag: "🇪🇸" },
  { id: "German", name: "الألمانية (Deutsch)", nativeName: "Deutsch", code: "de-DE", flag: "🇩🇪" }
];

export const PROFICIENCY_LEVELS = [
  { id: "Beginner", name: "مبتدئ (Beginner)", desc: "مفردات أساسية وحوارات بسيطة" },
  { id: "Intermediate", name: "متوسط (Intermediate)", desc: "قدرة على إدارة نقاشات يومية" },
  { id: "Advanced", name: "متقدم (Advanced)", desc: "طلاقة في التعبير ونقاش مواضيع معقدة" }
];

export const PRESET_SCENARIOS: ScenarioItem[] = [
  {
    id: "order_coffee",
    title: "Ordering Coffee",
    arabicTitle: "طلب قهوة في المقهى",
    description: "Learn to order your favorite coffee and interact with the barista.",
    arabicDescription: "تدرب على طلب مشروبك المفضل والحديث مع النادل في مقهى محلي.",
    iconName: "Coffee",
    initialPrompt: "Hello! Welcome to our cafe. What can I get started for you today?"
  },
  {
    id: "airport_checkin",
    title: "Airport Check-in",
    arabicTitle: "تسجيل الوصول في المطار",
    description: "Navigate security, luggage weight, and boarding gate questions.",
    arabicDescription: "تجاوز عقبات فحص الأمتعة، الاستفسار عن المقعد وبوابة الصعود للطائرة.",
    iconName: "Plane",
    initialPrompt: "Good morning. Can I please see your passport and booking confirmation?"
  },
  {
    id: "hotel_booking",
    title: "Hotel Reception",
    arabicTitle: "استقبال الفندق",
    description: "Check in to your reserved room and ask about hotel amenities.",
    arabicDescription: "قم بتسجيل الدخول في الفندق، الاستفسار عن كود الواي فاي، وموعد الفطور.",
    iconName: "Hotel",
    initialPrompt: "Welcome to Grand Central Hotel. How can I assist you with your booking today?"
  },
  {
    id: "ask_directions",
    title: "Asking for Directions",
    arabicTitle: "السؤال عن الاتجاهات",
    description: "Find your way around a new city, asking locals for help.",
    arabicDescription: "تعلم الاستفسار عن معالم المدينة، كيف تصل للمترو أو للمتحف القريب.",
    iconName: "Map",
    initialPrompt: "Excuse me, are you looking for some help finding a location?"
  }
];

export const AWARD_BADGES: AwardBadge[] = [
  {
    id: "badge_first_step",
    title: "الخطوة الأولى",
    description: "ابدأ رحلتك التعليمية واكسب أولى نقاطك",
    icon: "Milestone",
    xpThreshold: 20
  },
  {
    id: "badge_word_collector",
    title: "جامع المفردات",
    description: "احفظ 5 كلمات في سجل مفرداتك اليومي",
    icon: "BookmarkCheck",
    xpThreshold: 100
  },
  {
    id: "badge_chat_master",
    title: "فصيح الحوار",
    description: "أجرِ محادثات تفصيلية لتصل لـ 250 نقطة",
    icon: "MessageSquareText",
    xpThreshold: 250
  },
  {
    id: "badge_polyglot",
    title: "طليق اللسان",
    description: "تجاوز حاجز 500 نقطة خبرة بتميز واقتدار",
    icon: "Trophy",
    xpThreshold: 500
  }
];

export const INITIAL_CHALLENGES = (language: string): DailyChallenge[] => [
  {
    id: "challenge_xp",
    title: `Earn 50 XP today in ${language}`,
    arabicTitle: `احصد 50 نقطة خبرة اليوم باللغة ${language}`,
    type: "xp",
    target: 50,
    current: 0,
    xpReward: 15,
    completed: false
  },
  {
    id: "challenge_vocab",
    title: "Practice 3 words of the day",
    arabicTitle: "قم بإضافة أو مراجعة 3 كلمات جديدة",
    type: "vocab",
    target: 3,
    current: 0,
    xpReward: 20,
    completed: false
  },
  {
    id: "challenge_chat",
    title: "Send 3 message lines in AI Chat Scenario",
    arabicTitle: "أرسل 3 رسائل على الأقل في درس المحادثات بالذكاء الاصطناعي",
    type: "chat",
    target: 3,
    current: 0,
    xpReward: 25,
    completed: false
  }
];
