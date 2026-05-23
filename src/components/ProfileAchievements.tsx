import { Trophy, Milestone, BookmarkCheck, MessageSquareText, ShieldAlert, Award, Star } from "lucide-react";
import { UserProfile } from "../types";
import { AWARD_BADGES } from "../data";

interface ProfileAchievementsProps {
  profile: UserProfile;
  onSignOut: () => void;
}

export default function ProfileAchievements({ profile, onSignOut }: ProfileAchievementsProps) {
  // Map string names to Lucide elements
  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const classes = `w-7 h-7 ${isUnlocked ? "text-amber-500 fill-amber-100 animate-pulse" : "text-slate-300"}`;
    switch (iconName) {
      case "Milestone":
        return <Milestone className={classes} />;
      case "BookmarkCheck":
        return <BookmarkCheck className={classes} />;
      case "MessageSquareText":
        return <MessageSquareText className={classes} />;
      default:
        return <Trophy className={classes} />;
    }
  };

  const getRankName = (xp: number) => {
    if (xp >= 500) return "طليق مخرّف";
    if (xp >= 250) return "مُتحدث متمكن";
    if (xp >= 100) return "ممارس متعطش";
    return "مستكشف ناشئ";
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
      {/* Profile Header Block */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
            alt={profile.displayName}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-sm">
            <Star className="w-3.5 h-3.5 fill-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-sans font-bold text-slate-800 text-lg leading-tight">
            {profile.displayName}
          </h3>
          <p className="text-xs font-sans text-indigo-600 font-semibold mt-1 bg-indigo-50 inline-block px-2.5 py-0.5 rounded-full">
            رتبة {getRankName(profile.xp)}
          </p>
          <div className="text-[11px] text-slate-400 font-sans mt-0.5">
            تتعلم {profile.currentLanguage} • مستوى {profile.currentLevel}
          </div>
        </div>
      </div>

      {/* Basic Metrics Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80 text-center">
          <div className="text-2xl font-mono font-bold text-slate-800 leading-none">
            {profile.xp}
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-1">إجمالي النقاط (XP)</div>
        </div>
        
        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80 text-center">
          <div className="text-2xl font-mono font-bold text-orange-600 leading-none flex items-center justify-center gap-1">
            <span>{profile.streak}</span>
            <span className="text-sm">🔥</span>
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-1">حماسة الأيام المتتالية</div>
        </div>
      </div>

      {/* Professional Achievement Badges */}
      <div className="space-y-3">
        <h4 className="text-xs font-sans font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>الأوسمة والجوائز</span>
        </h4>

        <div className="grid grid-cols-1 gap-2.5">
          {AWARD_BADGES.map((badge) => {
            const isUnlocked = profile.xp >= badge.xpThreshold;
            return (
              <div
                key={badge.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isUnlocked
                    ? "bg-amber-50/30 border-amber-100"
                    : "bg-slate-100/20 border-slate-100 opacity-60"
                }`}
              >
                <div className="p-2 bg-white rounded-lg border border-slate-50 shadow-sm shrink-0">
                  {getBadgeIcon(badge.icon, isUnlocked)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-sans text-slate-700">
                      {badge.title}
                    </span>
                    {isUnlocked ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-semibold px-1 rounded">نشط</span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">{badge.xpThreshold} XP</span>
                    )}
                  </div>
                  <p className="text-[10px] font-sans text-slate-400 truncate">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Standard Google Ads Showcase Area */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-xl p-4 border border-indigo-900 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 font-sans font-bold text-7xl select-none">ADS</div>
        <div className="relative z-10 space-y-1 text-center">
          <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-800/50">إعلان مروّج</span>
          <p className="text-xs font-sans font-medium text-slate-100 pt-1">رعاة متميزين لرحلتك اللغوية</p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-2 mt-2 text-[10px] font-sans text-slate-300">
            احصل على نسخة premium لإلغاء الإعلانات والدعم غير المحدود!
          </div>
        </div>
      </div>

      {/* Disconnect Authentication button */}
      <button
        onClick={onSignOut}
        className="w-full text-center py-2 text-xs font-sans font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors border border-rose-100/40 cursor-pointer"
      >
        تسجيل الخروج من الحساب
      </button>
    </div>
  );
}
