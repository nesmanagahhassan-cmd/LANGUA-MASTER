import { CheckCircle2, Circle, Flame, Sparkles, Award } from "lucide-react";
import { DailyChallenge } from "../types";

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  onClaimReward: (challengeId: string) => void;
}

export default function DailyChallenges({ challenges, onClaimReward }: DailyChallengesProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <h3 className="font-sans font-semibold text-slate-800 text-lg">التحديات اليومية</h3>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-full">تتجدد يومياً</span>
      </div>

      <p className="text-xs text-slate-500 mb-4 font-sans">
        أكمل هذه المهام اليوم لكسب نقاط خبرة (XP) إضافية لترقية مستواك.
      </p>

      <div className="space-y-3">
        {challenges.map((challenge) => {
          const percentage = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all ${
                challenge.completed
                  ? "bg-emerald-50/50 border-emerald-100"
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans font-medium text-slate-700">
                      {challenge.arabicTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    {challenge.title}
                  </p>
                </div>

                <div>
                  {challenge.completed ? (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-6 h-6 text-slate-300">
                      <Circle className="w-5 h-5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                  <span>{percentage}%</span>
                  <span>{challenge.current} / {challenge.target}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      challenge.completed ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Claim Reward Action */}
              {!challenge.completed && challenge.current >= challenge.target && (
                <button
                  onClick={() => onClaimReward(challenge.id)}
                  className="mt-3 w-full py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-xs font-sans font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:from-indigo-700 hover:to-violet-700 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>احصل على {challenge.xpReward} XP كمكافأة!</span>
                </button>
              )}
              {challenge.completed && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 font-sans font-medium">
                  <Award className="w-3.5 h-3.5" />
                  <span>تم استلام المكافأة (+{challenge.xpReward} XP)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
