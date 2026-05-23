export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  currentLanguage: string; // e.g., English, French, Spanish, German
  currentLevel: string; // Beginner, Intermediate, Advanced
  xp: number;
  streak: number;
  lastActiveDate: string; // L10N ISO or local date index
  unlockedAwards: string[]; // List of award IDs
}

export interface UserPrivateInfo {
  email: string;
  role: string; // standard, premium
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  sentence: string;
  sentenceTranslation: string;
  masteryLevel: number; // 0: new, 1: learning, 2: mastered
  updatedAt: string;
}

export interface ScenarioItem {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription: string;
  iconName: string; // e.g., 'Coffee', 'Plane', 'ShoppingBag'
  initialPrompt: string; // Starter line for AI
}

export interface ChatSession {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: string;
  updatedAt: string;
  score: number;
  evaluationFeedback: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  translation?: string;
  feedback?: string;
  timestamp: string;
}

export interface AwardBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpThreshold: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  arabicTitle: string;
  type: 'xp' | 'vocab' | 'chat';
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}
