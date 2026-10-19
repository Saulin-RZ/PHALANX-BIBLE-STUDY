export type VaultItemType = 'sermon' | 'study' | 'illustration' | 'exegesis';

export type SermonStatus = 'draft' | 'in-progress' | 'preached' | 'archived';

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
