import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Layers, Plus, ExternalLink, ArrowRight, Bookmark } from 'lucide-react';
import { BIBLE_BOOKS, SCRIPTURE_CANON_DIVISIONS } from '../../data/bibleBooks';
import { SAMPLE_SCRIPTURES } from '../../data/scripturePassages';
import { VaultItem } from '../../types';

interface ScriptureExplorerProps {
  vaultItems: VaultItem[];
  initialPassage?: string;
  onSelectItem: (item: VaultItem, view: 'studio') => void;
  onNewSermonWithScripture: (scripture: string) => void;
}

export const ScriptureExplorer: React.FC<ScriptureExplorerProps> = ({
  vaultItems,
  initialPassage,
  onSelectItem,
  onNewSermonWithScripture,
}) => {
  const [activeTab, setActiveTab] = useState<'canonical' | 'reader'>('canonical');
  const [selectedBook, setSelectedBook] = useState<string>('Romans');
  const [searchQuery, setSearchQuery] = useState(initialPassage || '');
  const [selectedTestament, setSelectedTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Compute sermon/study references per Bible book
  const bookReferenceCounts = useMemo(() => {
    const counts: Record<string, { sermons: number; studies: number; items: VaultItem[] }> = {};
    BIBLE_BOOKS.forEach((b) => {
      counts[b.name] = { sermons: 0, studies: 0, items: [] };
    });

    vaultItems.forEach((item) => {
      const allText = `${item.primaryScripture} ${item.secondaryScriptures.join(' ')}`;
      BIBLE_BOOKS.forEach((b) => {
        if (
          allText.toLowerCase().includes(b.name.toLowerCase()) ||
          allText.toLowerCase().includes(b.abbr.toLowerCase())
        ) {
          if (!counts[b.name]) {
            counts[b.name] = { sermons: 0, studies: 0, items: [] };
          }
          if (item.type === 'sermon') counts[b.name].sermons++;
          else counts[b.name].studies++;
          if (!counts[b.name].items.some((i) => i.id === item.id)) {
            counts[b.name].items.push(item);
          }
        }
      });
    });

    return counts;
  }, [vaultItems]);

  // Filter books by testament
  const displayedBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((b) => {
      if (selectedTestament === 'OT') return b.testament === 'OT';
      if (selectedTestament === 'NT') return b.testament === 'NT';
      return true;
    });
  }, [selectedTestament]);

  // Active book details
  const activeBookObj = useMemo(() => {
    return BIBLE_BOOKS.find((b) => b.name.toLowerCase() === selectedBook.toLowerCase()) || BIBLE_BOOKS[0];
  }, [selectedBook]);

  // Associated vault items for selected book
  const bookVaultItems = useMemo(() => {
    return bookReferenceCounts[activeBookObj.name]?.items || [];
  }, [bookReferenceCounts, activeBookObj]);

  // Filtered scripture verses
  const displayedVerses = useMemo(() => {
    let list = SAMPLE_SCRIPTURES;
    if (selectedBook) {
      const bookMatches = list.filter(
        (v) => v.book.toLowerCase() === selectedBook.toLowerCase()
      );
      if (bookMatches.length > 0) list = bookMatches;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = SAMPLE_SCRIPTURES.filter(
        (v) =>
          v.text.toLowerCase().includes(q) ||
          v.book.toLowerCase().includes(q) ||
          `${v.book} ${v.chapter}:${v.verse}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedBook, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-serif-title font-semibold text-stone-900">
            Canonical Cross-Reference Matrix & Bible Explorer
          </h1>
          <p className="text-xs text-stone-500 font-reading">
            Track biblical coverage across the 66 canonical books and find linked sermon manuscripts.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex p-1 bg-stone-200/70 rounded-md text-xs font-medium text-stone-700">
          <button
            onClick={() => setActiveTab('canonical')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'canonical'
                ? 'bg-white text-stone-950 font-semibold shadow-2xs'
                : 'hover:text-stone-900'
            }`}
          >
            Canonical Map
          </button>
          <button
            onClick={() => setActiveTab('reader')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'reader'
                ? 'bg-white text-stone-950 font-semibold shadow-2xs'
                : 'hover:text-stone-900'
            }`}
          >
            Passage Reader & Concordance
          </button>
        </div>
      </div>

      {/* VIEW 1: CANONICAL MAP */}
      {activeTab === 'canonical' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 66 Books Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              {/* Filter OT/NT */}
              <div className="inline-flex p-0.5 bg-stone-200/60 rounded text-xs">
                {(['ALL', 'OT', 'NT'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTestament(t)}
                    className={`px-3 py-1 rounded ${
                      selectedTestament === t
                        ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                        : 'text-stone-600'
                    }`}
                  >
                    {t === 'ALL' ? 'Entire Canon (66 Books)' : t === 'OT' ? 'Old Testament (39)' : 'New Testament (27)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Books */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {displayedBooks.map((book) => {
                const countData = bookReferenceCounts[book.name] || { sermons: 0, studies: 0, items: [] };
                const totalWorks = countData.items.length;
                const isSelected = selectedBook.toLowerCase() === book.name.toLowerCase();

                return (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book.name)}
                    className={`p-3 text-left rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-stone-400 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-mono text-[10px] ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                        {book.abbr}
                      </span>
                      {totalWorks > 0 ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            isSelected ? 'bg-amber-400 text-stone-950' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {totalWorks} {totalWorks === 1 ? 'work' : 'works'}
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isSelected ? 'text-stone-500' : 'text-stone-300'}`}>
                          0
                        </span>
                      )}
                    </div>
                    <div className="font-serif-title font-semibold text-sm truncate">
                      {book.name}
                    </div>
                    <div className={`text-[11px] truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {book.division} · {book.chapters} ch
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Book Details & Linked Manuscripts (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 font-sans">
                {activeBookObj.testament === 'OT' ? 'Old Testament' : 'New Testament'} · {activeBookObj.division}
              </div>
              <h2 className="text-2xl font-serif-title font-bold text-stone-900 mt-1">
                {activeBookObj.name}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeBookObj.chapters} Chapters · Cross-referenced in {bookVaultItems.length} vault manuscripts
              </p>
            </div>

            <button
              onClick={() => onNewSermonWithScripture(`${activeBookObj.name} 1`)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 text-stone-50 text-xs font-medium rounded hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft New Sermon on {activeBookObj.name}</span>
            </button>

            {/* List of Sermons referencing this book */}
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <span className="text-xs font-semibold text-stone-700 block">
                Manuscripts in Vault ({bookVaultItems.length}):
              </span>

              {bookVaultItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item, 'studio')}
                  className="p-3 bg-[#FAF8F5] border border-stone-200 rounded hover:border-stone-400 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="uppercase font-semibold text-stone-700">{item.type}</span>
                    <span>{item.date}</span>
                  </div>
                  <h4 className="text-sm font-serif-title font-semibold text-stone-900">
                    {item.title}
                  </h4>
                  <div className="text-xs font-mono text-amber-900">
                    {item.primaryScripture}
                  </div>
                </div>
              ))}

              {bookVaultItems.length === 0 && (
                <div className="text-center py-6 text-stone-400 text-xs">
                  No sermons or studies created on {activeBookObj.name} yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PASSAGE READER & CONCORDANCE */}
      {activeTab === 'reader' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-stone-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Bible concordance (e.g. grace, love, Romans 8)..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500">Select Book:</span>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSearchQuery('');
                }}
                className="bg-white border border-stone-200 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none"
              >
                {BIBLE_BOOKS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.abbr})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verses Grid */}
          <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif-title font-semibold text-lg text-stone-900">
                {selectedBook} Passage Reading
              </h3>
              <span className="text-xs text-stone-500">Public Domain WEB Text</span>
            </div>

            <div className="space-y-3 font-reading text-sm text-stone-800 leading-relaxed">
              {displayedVerses.map((v, i) => (
                <div
                  key={`${v.book}-${v.chapter}-${v.verse}-${i}`}
                  className="p-3 rounded hover:bg-stone-50 transition-colors flex items-start gap-3 border-b border-stone-100 last:border-b-0"
                >
                  <span className="font-mono text-xs font-bold text-amber-900 pt-0.5 shrink-0">
                    {v.book} {v.chapter}:{v.verse}
                  </span>
                  <div className="flex-1">
                    <p className="leading-relaxed">{v.text}</p>
                  </div>
                  <button
                    onClick={() => onNewSermonWithScripture(`${v.book} ${v.chapter}:${v.verse}`)}
                    className="text-xs text-stone-500 hover:text-stone-900 shrink-0 font-sans border border-stone-200 px-2 py-0.5 rounded bg-white shadow-2xs"
                    title="Draft sermon on this verse"
                  >
                    + Sermon
                  </button>
                </div>
              ))}

              {displayedVerses.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-xs">
                  No verses found for this search. Try searching another term like "grace", "love", or "faith".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
