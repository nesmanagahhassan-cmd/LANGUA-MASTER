import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from "firebase/auth";
import { db, auth, handleFirestoreError, googleProvider, OperationType } from "./firebase";
import { UserProfile, DailyChallenge, VocabularyItem, ChatMessage } from "./types";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS, INITIAL_CHALLENGES } from "./data";

// Sub-components
import AuthScreen from "./components/AuthScreen";
import ProfileAchievements from "./components/ProfileAchievements";
import DailyChallenges from "./components/DailyChallenges";
import VocabModule from "./components/VocabModule";
import ChatModule from "./components/ChatModule";

// UI Icons
import { Globe, BookOpen, MessageSquareText, Settings, Sparkles, Loader2, Award, Info, Laptop, Check, HelpCircle } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // App profile & statistics state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [savedWords, setSavedWords] = useState<VocabularyItem[]>([]);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'vocab' | 'chat'>('vocab');
  const [showSettings, setShowSettings] = useState(false);
  const [profileSyncing, setProfileSyncing] = useState(false);

  // 1. Listen to Authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(true);
      if (currentUser) {
        setUser(currentUser);
        setGuestMode(false);
        try {
          await setupUserProfile(currentUser);
        } catch (e) {
          console.error("Failed setting up user database entry: ", e);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Load User Profile statistics from Firestore OR create index
  const setupUserProfile = async (firebaseUser: any) => {
    const profileRef = doc(db, "users", firebaseUser.uid);
    let profileData: UserProfile;

    try {
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        profileData = snap.data() as UserProfile;
        setProfile(profileData);
      } else {
        // Create standard initial profile
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "متعلم مجتهد",
          photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          currentLanguage: "English",
          currentLevel: "Beginner",
          xp: 20, // start with welcome points
          streak: 1,
          lastActiveDate: new Date().toISOString().split("T")[0],
          unlockedAwards: ["badge_first_step"]
        };

        profileData = newProfile;
        // Save public profile
        await setDoc(profileRef, newProfile);
        
        // Save isolated private PII partition
        await setDoc(doc(db, "users", firebaseUser.uid, "private", "info"), {
          email: firebaseUser.email || "",
          role: "standard"
        });

        setProfile(newProfile);
      }

      // Initialize initial challenges for their target L2 language
      setChallenges(INITIAL_CHALLENGES(profileData.currentLanguage));

      // 3. Keep real-time snapshot listener on their vocabulary subcollection
      const wordColRef = collection(db, "users", firebaseUser.uid, "words");
      onSnapshot(wordColRef, (colSnap) => {
        const loaded: VocabularyItem[] = [];
        colSnap.forEach((docSnap) => {
          loaded.push(docSnap.data() as VocabularyItem);
        });
        // Sort by updatedAt descending
        loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setSavedWords(loaded);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/words`);
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  // Setup guest dummy profile (Fallback when no Google sign-in is used)
  const setupGuestProfile = () => {
    const dummy: UserProfile = {
      uid: "guest_user",
      displayName: "متعلم زائر",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      currentLanguage: "English",
      currentLevel: "Beginner",
      xp: 20,
      streak: 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
      unlockedAwards: ["badge_first_step"]
    };

    setProfile(dummy);
    setChallenges(INITIAL_CHALLENGES(dummy.currentLanguage));
    setGuestMode(true);
    setSavedWords([]);
  };

  const handleSignInGoogle = async () => {
    setLoadingAuth(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google Auth failed", e);
      setupGuestProfile(); // fallback gracefully
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOutNow = async () => {
    try {
      await signOut(auth);
      setGuestMode(false);
      setProfile(null);
      setUser(null);
    } catch (e) {
      console.error("Signout fail", e);
    }
  };

  // Helper trigger to increment XP and automatically advance corresponding daily challenges
  const handleAddXPPoints = async (amount: number, challengeType?: 'xp' | 'vocab' | 'chat') => {
    if (!profile) return;

    const newXP = profile.xp + amount;
    
    // Check if milestone badges unlocked!
    const badges = [...profile.unlockedAwards];
    if (newXP >= 100 && !badges.includes("badge_word_collector")) {
      badges.push("badge_word_collector");
    }
    if (newXP >= 250 && !badges.includes("badge_chat_master")) {
      badges.push("badge_chat_master");
    }
    if (newXP >= 500 && !badges.includes("badge_polyglot")) {
      badges.push("badge_polyglot");
    }

    const updatedProfile = {
      ...profile,
      xp: newXP,
      unlockedAwards: badges
    };

    setProfile(updatedProfile);

    // Sync progress to cloud Firestore if available
    if (user && !guestMode) {
      setProfileSyncing(true);
      try {
        const pRef = doc(db, "users", user.uid);
        await updateDoc(pRef, {
          xp: newXP,
          unlockedAwards: badges
        });
      } catch (e) {
        console.error("Error updating user statistics in cloud database", e);
      } finally {
        setProfileSyncing(false);
      }
    }

    // Refresh Daily Challenge Progress tracker
    setChallenges(prev =>
      prev.map(ch => {
        let progressIncrement = 0;
        if (ch.type === "xp") progressIncrement = amount;
        else if (ch.type === challengeType) progressIncrement = 1;

        const nextVal = ch.current + progressIncrement;
        return {
          ...ch,
          current: nextVal,
          completed: ch.completed || (nextVal >= ch.target)
        };
      })
    );
  };

  // Update learner settings
  const handleUpdateLanguageOrLevel = async (newLang: string, newLevel: string) => {
    if (!profile) return;

    const updated = {
      ...profile,
      currentLanguage: newLang,
      currentLevel: newLevel
    };

    setProfile(updated);
    setChallenges(INITIAL_CHALLENGES(newLang));

    if (user && !guestMode) {
      try {
        const pRef = doc(db, "users", user.uid);
        await updateDoc(pRef, {
          currentLanguage: newLang,
          currentLevel: newLevel
        });
      } catch (err) {
        console.error("Failed saving language settings to database", err);
      }
    }
    setShowSettings(false);
  };

  // Claim experience points from completed challenges
  const handleClaimChallengeReward = (challengeId: string) => {
    const claim = challenges.find((ch) => ch.id === challengeId);
    if (claim && !claim.completed) {
      handleAddXPPoints(claim.xpReward);
      setChallenges((prev) =>
        prev.map((ch) => (ch.id === challengeId ? { ...ch, completed: true } : ch))
      );
    }
  };

  // Fire-safe helper: Save a newly learned vocabulary word directly to cloud database
  const saveVocabularyWordToCloud = async (word: VocabularyItem) => {
    if (!user || guestMode) return;
    try {
      const docRef = doc(db, "users", user.uid, "words", word.id);
      await setDoc(docRef, word);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/words/${word.id}`);
    }
  };

  // Fire-safe helper: Save chat scenario session status directly to cloud database
  const saveChatSessionToCloud = async (chatId: string, titleName: string, score: number, comment: string) => {
    if (!user || guestMode) return;
    try {
      const docRef = doc(db, "users", user.uid, "chats", chatId);
      await setDoc(docRef, {
        id: chatId,
        scenarioId: chatId.split("_")[1],
        scenarioTitle: titleName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        score,
        evaluationFeedback: comment
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/chats/${chatId}`);
    }
  };

  // Fire-safe helper: Add message element directly to cloud database
  const saveChatMessageToCloud = async (chatId: string, msg: ChatMessage) => {
    if (!user || guestMode) return;
    try {
      const docRef = doc(db, "users", user.uid, "chats", chatId, "messages", msg.id);
      await setDoc(docRef, msg);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/chats/${chatId}/messages/${msg.id}`);
    }
  };

  // If loading authentication status on initial boot, show beautiful clean spinner
  if (loadingAuth && !guestMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-sans font-semibold text-slate-500">جاري الإعداد للمنصة اللغوية الفائقة...</p>
      </div>
    );
  }

  // If no auth user exists and guestMode is off, show beautiful login welcome screen
  if (!profile) {
    return (
      <AuthScreen
        onSignInWithGoogle={handleSignInGoogle}
        onContinueAsGuest={setupGuestProfile}
        loading={loadingAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 flex flex-col" dir="rtl">
      
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3.5 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl shadow-sm flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-black text-slate-900 text-sm sm:text-base leading-none">تطبيق تعلم اللغات</h1>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">نسخة 2026</span>
            </div>
          </div>

          {/* Center Navigation Toggle Links */}
          <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-100 shrink-0">
            <button
              onClick={() => setActiveTab('vocab')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'vocab'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">دروس الكلمات</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثات تفاعلية</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            
            {/* Syncing loader status */}
            {profileSyncing && (
              <span className="text-[10px] text-indigo-500 flex items-center gap-1 font-sans font-medium" title="سحابة Firebase">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden md:inline">جاري المزامنة...</span>
              </span>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors relative cursor-pointer"
              title="تعديل تفضيلات التعلم"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Interactive Quick preferences modal settings overlay */}
      {showSettings && (
        <div className="bg-slate-900/30 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 shadow-xl space-y-6 text-right">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 className="font-sans font-bold text-slate-800 text-base">تفضيلات تعلم اللغات</h3>
            </div>

            {/* Target L2 Selection */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-bold text-slate-500">اللغة الهدف للتعلم (L2):</label>
              <select
                id="target-lang-select"
                value={profile.currentLanguage}
                onChange={(e) => handleUpdateLanguageOrLevel(e.target.value, profile.currentLevel)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>

            {/* Target Level selection */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-bold text-slate-500">مستواك الحالي بالاستناد للتقييم:</label>
              <select
                id="target-level-select"
                value={profile.currentLevel}
                onChange={(e) => handleUpdateLanguageOrLevel(profile.currentLanguage, e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-sans focus:outline-none"
              >
                {PROFICIENCY_LEVELS.map((lev) => (
                  <option key={lev.id} value={lev.id}>{lev.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-sans font-bold cursor-pointer"
              >
                حفظ التغييرات
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-sans font-medium cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Dashboard grid layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        
        {/* L10N quick reminder banner if in Guest mode */}
        {guestMode && (
          <div className="bg-amber-50/50 border border-amber-100 text-amber-800 text-xs px-4 py-3 rounded-2xl mb-6 flex items-center justify-between gap-4 font-sans leading-relaxed">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>أنت الآن تتصفح التطبيق كزائر. لن يتم حفظ تقدمك والكلمات المفتاحية سحابياً.</span>
            </div>
            <button
              onClick={handleSignOutNow}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold font-sans text-[10px] shrink-0 transition-colors"
            >
              مزامنة الحساب السحابي مجاناً!
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main activity window (Left component col, fits 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'vocab' ? (
              <VocabModule
                userId={guestMode ? undefined : profile.uid}
                targetLanguage={profile.currentLanguage}
                level={profile.currentLevel}
                onAddXP={handleAddXPPoints}
                onSaveWordToFirebase={saveVocabularyWordToCloud}
                savedWordsList={savedWords}
              />
            ) : (
              <ChatModule
                userId={guestMode ? undefined : profile.uid}
                targetLanguage={profile.currentLanguage}
                level={profile.currentLevel}
                onAddXP={handleAddXPPoints}
                onSaveMessageToFirebase={saveChatMessageToCloud}
                onSaveChatSessionToFirebase={saveChatSessionToCloud}
              />
            )}

          </div>

          {/* Right Status Panel (Achievements & daily goals, 1 col dashboard) */}
          <div className="lg:col-span-1 space-y-6">
            
            <ProfileAchievements
              profile={profile}
              onSignOut={handleSignOutNow}
            />

            <DailyChallenges
              challenges={challenges}
              onClaimReward={handleClaimChallengeReward}
            />

          </div>

        </div>
      </main>

    </div>
  );
}
