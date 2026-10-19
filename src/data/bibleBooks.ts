import { BibleBook } from '../types';

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament - Law (Pentateuch)
  { id: 'GEN', name: 'Genesis', testament: 'OT', division: 'Law', chapters: 50, abbr: 'Gen' },
  { id: 'EXO', name: 'Exodus', testament: 'OT', division: 'Law', chapters: 40, abbr: 'Exod' },
  { id: 'LEV', name: 'Leviticus', testament: 'OT', division: 'Law', chapters: 27, abbr: 'Lev' },
  { id: 'NUM', name: 'Numbers', testament: 'OT', division: 'Law', chapters: 36, abbr: 'Num' },
  { id: 'DEU', name: 'Deuteronomy', testament: 'OT', division: 'Law', chapters: 34, abbr: 'Deut' },

  // Old Testament - Historical
  { id: 'JOS', name: 'Joshua', testament: 'OT', division: 'History', chapters: 24, abbr: 'Josh' },
  { id: 'JDG', name: 'Judges', testament: 'OT', division: 'History', chapters: 21, abbr: 'Judg' },
  { id: 'RUT', name: 'Ruth', testament: 'OT', division: 'History', chapters: 4, abbr: 'Ruth' },
  { id: '1SA', name: '1 Samuel', testament: 'OT', division: 'History', chapters: 31, abbr: '1 Sam' },
  { id: '2SA', name: '2 Samuel', testament: 'OT', division: 'History', chapters: 24, abbr: '2 Sam' },
  { id: '1KI', name: '1 Kings', testament: 'OT', division: 'History', chapters: 22, abbr: '1 Kgs' },
  { id: '2KI', name: '2 Kings', testament: 'OT', division: 'History', chapters: 25, abbr: '2 Kgs' },
  { id: '1CH', name: '1 Chronicles', testament: 'OT', division: 'History', chapters: 29, abbr: '1 Chr' },
  { id: '2CH', name: '2 Chronicles', testament: 'OT', division: 'History', chapters: 36, abbr: '2 Chr' },
  { id: 'EZR', name: 'Ezra', testament: 'OT', division: 'History', chapters: 10, abbr: 'Ezra' },
  { id: 'NEH', name: 'Nehemiah', testament: 'OT', division: 'History', chapters: 13, abbr: 'Neh' },
  { id: 'EST', name: 'Esther', testament: 'OT', division: 'History', chapters: 10, abbr: 'Esth' },

  // Old Testament - Poetry & Wisdom
  { id: 'JOB', name: 'Job', testament: 'OT', division: 'Poetry/Wisdom', chapters: 42, abbr: 'Job' },
  { id: 'PSA', name: 'Psalms', testament: 'OT', division: 'Poetry/Wisdom', chapters: 150, abbr: 'Ps' },
  { id: 'PRO', name: 'Proverbs', testament: 'OT', division: 'Poetry/Wisdom', chapters: 31, abbr: 'Prov' },
  { id: 'ECC', name: 'Ecclesiastes', testament: 'OT', division: 'Poetry/Wisdom', chapters: 12, abbr: 'Eccl' },
  { id: 'SNG', name: 'Song of Solomon', testament: 'OT', division: 'Poetry/Wisdom', chapters: 8, abbr: 'Song' },

  // Old Testament - Major Prophets
  { id: 'ISA', name: 'Isaiah', testament: 'OT', division: 'Major Prophets', chapters: 66, abbr: 'Isa' },
  { id: 'JER', name: 'Jeremiah', testament: 'OT', division: 'Major Prophets', chapters: 52, abbr: 'Jer' },
  { id: 'LAM', name: 'Lamentations', testament: 'OT', division: 'Major Prophets', chapters: 5, abbr: 'Lam' },
  { id: 'EZK', name: 'Ezekiel', testament: 'OT', division: 'Major Prophets', chapters: 48, abbr: 'Ezek' },
  { id: 'DAN', name: 'Daniel', testament: 'OT', division: 'Major Prophets', chapters: 12, abbr: 'Dan' },

  // Old Testament - Minor Prophets
  { id: 'HOS', name: 'Hosea', testament: 'OT', division: 'Minor Prophets', chapters: 14, abbr: 'Hos' },
  { id: 'JOL', name: 'Joel', testament: 'OT', division: 'Minor Prophets', chapters: 3, abbr: 'Joel' },
  { id: 'AMO', name: 'Amos', testament: 'OT', division: 'Minor Prophets', chapters: 9, abbr: 'Amos' },
  { id: 'OBA', name: 'Obadiah', testament: 'OT', division: 'Minor Prophets', chapters: 1, abbr: 'Obad' },
  { id: 'JON', name: 'Jonah', testament: 'OT', division: 'Minor Prophets', chapters: 4, abbr: 'Jonah' },
  { id: 'MIC', name: 'Micah', testament: 'OT', division: 'Minor Prophets', chapters: 7, abbr: 'Mic' },
  { id: 'NAM', name: 'Nahum', testament: 'OT', division: 'Minor Prophets', chapters: 3, abbr: 'Nah' },
  { id: 'HAB', name: 'Habakkuk', testament: 'OT', division: 'Minor Prophets', chapters: 3, abbr: 'Hab' },
  { id: 'ZEP', name: 'Zephaniah', testament: 'OT', division: 'Minor Prophets', chapters: 3, abbr: 'Zeph' },
  { id: 'HAG', name: 'Haggai', testament: 'OT', division: 'Minor Prophets', chapters: 2, abbr: 'Hag' },
  { id: 'ZEC', name: 'Zechariah', testament: 'OT', division: 'Minor Prophets', chapters: 14, abbr: 'Zech' },
  { id: 'MAL', name: 'Malachi', testament: 'OT', division: 'Minor Prophets', chapters: 4, abbr: 'Mal' },

  // New Testament - Gospels & Acts
  { id: 'MAT', name: 'Matthew', testament: 'NT', division: 'Gospels', chapters: 28, abbr: 'Matt' },
  { id: 'MRK', name: 'Mark', testament: 'NT', division: 'Gospels', chapters: 16, abbr: 'Mark' },
  { id: 'LUK', name: 'Luke', testament: 'NT', division: 'Gospels', chapters: 24, abbr: 'Luke' },
  { id: 'JHN', name: 'John', testament: 'NT', division: 'Gospels', chapters: 21, abbr: 'John' },
  { id: 'ACT', name: 'Acts', testament: 'NT', division: 'Church History', chapters: 28, abbr: 'Acts' },

  // New Testament - Pauline Epistles
  { id: 'ROM', name: 'Romans', testament: 'NT', division: 'Pauline Epistles', chapters: 16, abbr: 'Rom' },
  { id: '1CO', name: '1 Corinthians', testament: 'NT', division: 'Pauline Epistles', chapters: 16, abbr: '1 Cor' },
  { id: '2CO', name: '2 Corinthians', testament: 'NT', division: 'Pauline Epistles', chapters: 13, abbr: '2 Cor' },
  { id: 'GAL', name: 'Galatians', testament: 'NT', division: 'Pauline Epistles', chapters: 6, abbr: 'Gal' },
  { id: 'EPH', name: 'Ephesians', testament: 'NT', division: 'Pauline Epistles', chapters: 6, abbr: 'Eph' },
  { id: 'PHP', name: 'Philippians', testament: 'NT', division: 'Pauline Epistles', chapters: 4, abbr: 'Phil' },
  { id: 'COL', name: 'Colossians', testament: 'NT', division: 'Pauline Epistles', chapters: 4, abbr: 'Col' },
  { id: '1TH', name: '1 Thessalonians', testament: 'NT', division: 'Pauline Epistles', chapters: 5, abbr: '1 Thess' },
  { id: '2TH', name: '2 Thessalonians', testament: 'NT', division: 'Pauline Epistles', chapters: 3, abbr: '2 Thess' },
  { id: '1TI', name: '1 Timothy', testament: 'NT', division: 'Pauline Epistles', chapters: 6, abbr: '1 Tim' },
  { id: '2TI', name: '2 Timothy', testament: 'NT', division: 'Pauline Epistles', chapters: 4, abbr: '2 Tim' },
  { id: 'TIT', name: 'Titus', testament: 'NT', division: 'Pauline Epistles', chapters: 3, abbr: 'Titus' },
  { id: 'PHM', name: 'Philemon', testament: 'NT', division: 'Pauline Epistles', chapters: 1, abbr: 'Phlm' },

  // New Testament - General Epistles
  { id: 'HEB', name: 'Hebrews', testament: 'NT', division: 'General Epistles', chapters: 13, abbr: 'Heb' },
  { id: 'JAS', name: 'James', testament: 'NT', division: 'General Epistles', chapters: 5, abbr: 'Jas' },
  { id: '1PE', name: '1 Peter', testament: 'NT', division: 'General Epistles', chapters: 5, abbr: '1 Pet' },
  { id: '2PE', name: '2 Peter', testament: 'NT', division: 'General Epistles', chapters: 3, abbr: '2 Pet' },
  { id: '1JN', name: '1 John', testament: 'NT', division: 'General Epistles', chapters: 5, abbr: '1 John' },
  { id: '2JN', name: '2 John', testament: 'NT', division: 'General Epistles', chapters: 1, abbr: '2 John' },
  { id: '3JN', name: '3 John', testament: 'NT', division: 'General Epistles', chapters: 1, abbr: '3 John' },
  { id: 'JUD', name: 'Jude', testament: 'NT', division: 'General Epistles', chapters: 1, abbr: 'Jude' },

  // New Testament - Apocalyptic
  { id: 'REV', name: 'Revelation', testament: 'NT', division: 'Apocalyptic', chapters: 22, abbr: 'Rev' }
];

export const SCRIPTURE_CANON_DIVISIONS = [
  'Law',
  'History',
  'Poetry/Wisdom',
  'Major Prophets',
  'Minor Prophets',
  'Gospels',
  'Church History',
  'Pauline Epistles',
  'General Epistles',
  'Apocalyptic'
] as const;
