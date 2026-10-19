export type VaultItemType = 'sermon' | 'study' | 'illustration' | 'exegesis';

export type SermonStatus = 'draft' | 'in-progress' | 'preached' | 'archived';

export type PreacherRole =
  | 'Administrator'
  | 'Senior Pastor'
  | 'Associate Pastor'
  | 'Guest Preacher'
  | 'Teaching Elder'
  | 'Seminary Student'
  | 'Bible Teacher';

export interface UserProfile {
  id: string;
  username: string; // e.g. "saul", "admin", "guest"
  name: string; // e.g. "ADMIN", "Pastor Saul R."
  email?: string;
  role: PreacherRole;
  avatarInitials: string;
  color: string; // CSS color string e.g. "#991b1b", "#78350f"
  pin?: string; // e.g. "0129"
  isAdmin?: boolean; // Flag granting universal access and editing rights
  createdAt: string;
  lastActive: string;
}

export interface OutlinePoint {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  scriptureRef?: string;
  content: string;
  speakerCue?: string; // e.g., "Pause", "Emphasize", "Show Slide", "Congregation Response"
  illustrationSnippet?: string;
}

export interface HandoutItem {
  id: string;
  question: string; // The fill-in sentence e.g. "Grace is God's ______ favor towards us."
  answer: string; // e.g. "unmerited"
  scripture: string; // e.g. "Romans 8:32"
}

export interface KeyTermStudy {
  id: string;
  original: string; // e.g. "χάρις (charis)" or "חֶסֶד (chesed)"
  language: 'Greek' | 'Hebrew' | 'Aramaic';
  transliteration: string;
  meaning: string;
  notes: string;
}

export interface ExegesisData {
  historicalContext?: string;
  literaryStructure?: string;
  keyTerms: KeyTermStudy[];
  crossReferences: string[];
}

export interface VaultItem {
  id: string;
  slug: string;
  type: VaultItemType;
  title: string;
  subtitle?: string;
  series?: string;
  date: string; // YYYY-MM-DD
  preacher: string;
  authorId?: string; // ID of the user who owns or authored this sermon
  authorName?: string; // Display name of the author
  primaryScripture: string;
  secondaryScriptures: string[];
  tags: string[];
  status: SermonStatus;
  bigIdea: string; // The central homiletical proposition
  durationMinutes: number; // Target preaching time
  outline: OutlinePoint[];
  manuscript: string; // Full markdown content or sermon prose
  handoutItems: HandoutItem[];
  discussionQuestions: string[];
  exegesis: ExegesisData;
  createdAt: string;
  updatedAt: string;
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
  division: 'Law' | 'History' | 'Poetry/Wisdom' | 'Major Prophets' | 'Minor Prophets' | 'Gospels' | 'Church History' | 'Pauline Epistles' | 'General Epistles' | 'Apocalyptic';
  chapters: number;
  abbr: string;
}

export interface ScriptureVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: 'WEB' | 'KJV' | 'ESV-ref';
}
