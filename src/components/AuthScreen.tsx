import { Chrome, Sparkles, LogIn, UserX, Globe, ShieldCheck, Trophy, Badge } from "lucide-react";

interface AuthScreenProps {
  onSignInWithGoogle: () => void;
  onContinueAsGuest: () => void;
  loading: boolean;
}

export default function AuthScreen({ onSignInWithGoogle, onContinueAsGuest, loading }: AuthScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6" dir="rtl">
      {/* Top Branding Header */}
      <div className="text-center py-6 max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white rounded-2xl shadow-md rotate-3 hover:rotate-0 transition-transform duration-200">
          <Globe className="w-9 h-9 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-sans font-black tracking-tight text-slate-900">
          تطبيق تعلم اللغات الذكي
        </h1>
        <p className="text-sm font-sans text-slate-500 leading-relaxed font-semibold">
          استمتع بحفظ مفرداتك اليومية ومحادثة الذكاء الاصطناعي مع قياس فوري لمستواك في القراءة والنطق.
        </p>
      </div>

      {/* Main Core Features Card */}
      <div className="bg-white max-w-md w-full mx-auto rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="font-sans font-bold text-slate-800 text-base border-b border-slate-50 pb-3">
          مزايا المنصة الاحترافية:
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-sans font-semibold text-slate-800 text-xs sm:text-sm">نظام مستويات وجوائز تشجيعية</h4>
              <p className="text-[11px] font-sans text-slate-400 mt-0.5">ابدأ بالتدريج من رتبة مبتدئ وصولاً لطلاقة الحديث الكلية وجني شارات المتميزين.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="font-sans font-semibold text-slate-800 text-xs sm:text-sm">معلّم محادثة ذكي ومصحح نحوي</h4>
              <p className="text-[11px] font-sans text-slate-400 mt-0.5">تحدّث في سيناريوهات واقعية واحصل على تصحيحات نحوية مباشرة لتصويب كتابتك وقراءتك.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-sans font-semibold text-slate-800 text-xs sm:text-sm">مزامنة سحابية فائقة الأمان عبر Firebase</h4>
              <p className="text-[11px] font-sans text-slate-400 mt-0.5">سجل دخولك بجوجل لحفظ مفرداتك الصعبة وتقدمك اللغوي عبر جميع أنظمة الهواتف والحواسيب.</p>
            </div>
          </div>
        </div>

        {/* Buttons Controls Section */}
        <div className="space-y-3 pt-4 border-t border-slate-50">
          <button
            onClick={onSignInWithGoogle}
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>تسجيل الدخول الآمن بحساب Google</span>
          </button>

          {/* Iframe popup blocked friendly context hint */}
          <p className="text-[10px] text-slate-400 text-center font-sans leading-normal">
            💡 <strong className="font-semibold text-amber-600">تنويه للمعايير الأمنية:</strong> إذا تم حظر النوافذ المنبثقة من قِبل المتصفح داخل المعاينة، يمكنك ببساطة استخدام <span className="font-semibold text-indigo-600">"الاستمرار كزائر"</span> أو فتح التطبيق في نافذة جديدة.
          </p>

          <button
            onClick={onContinueAsGuest}
            disabled={loading}
            className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            <span>الاستمرار كزائر (تخزين محلي فقط)</span>
          </button>
        </div>
      </div>

      {/* Footer copyright labels */}
      <div className="text-center py-6 text-[10px] font-mono text-slate-400 space-y-1">
        <div>تطبيق تعلم اللغات • مأمن بحماية Google Firebase Authentication</div>
        <div className="text-[9px] text-slate-300">حقوق الطبع والنشر محفوظة © 2026. تواصل غامر ومتجاوب بالكامل.</div>
      </div>
    </div>
  );
}
