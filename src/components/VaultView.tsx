import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Calendar,
  Mic,
  FileText,
  Download,
  Github,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Trash2,
  Copy
} from 'lucide-react';
import { VaultItem, VaultItemType, SermonStatus } from '../types';
import deskHeroImage from '../assets/images/sermon_manuscript_desk_1792367924247.jpg';
import { convertItemToMarkdown, downloadFile } from '../utils/vaultStorage';

interface VaultViewProps {
  items: VaultItem[];
  onSelectItem: (item: VaultItem, view: 'studio' | 'preach' | 'handout') => void;
  onNewItem: (type?: VaultItemType) => void;
  onDeleteItem: (id: string) => void;
  onOpenGitModal: () => void;
  onOpenBibleExplorer: (passage?: string) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  items,
  onSelectItem,
  onNewItem,
  onDeleteItem,
  onOpenGitModal,
  onOpenBibleExplorer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<VaultItemType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<SermonStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');

  // Compute all available tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.series && item.series.toLowerCase().includes(q)) ||
        item.primaryScripture.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.bigIdea.toLowerCase().includes(q) ||
        item.manuscript.toLowerCase().includes(q)
      );
    });
  }, [items, selectedType, selectedStatus, selectedTag, searchQuery]);

  // Aggregate Vault Stats
  const stats = useMemo(() => {
    const sermonsCount = items.filter((i) => i.type === 'sermon').length;
    const studiesCount = items.filter((i) => i.type === 'study').length;
    const illustrationsCount = items.filter((i) => i.type === 'illustration').length;
    const totalMinutes = items.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    return { sermonsCount, studiesCount, illustrationsCount, totalMinutes };
  }, [items]);

  const handleDownloadMarkdown = (e: React.MouseEvent, item: VaultItem) => {
    e.stopPropagation();
    const md = convertItemToMarkdown(item);
    const filename = `${item.date || 'note'}-${item.slug || 'sermon'}.md`;
    downloadFile(md, filename);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this document from your vault?')) {
      onDeleteItem(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Curatorial Header & Visual Anchor */}
      <section className="relative overflow-hidden rounded-xl border border-stone-200/90 bg-[#F5F2EB] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-600 mb-3 tracking-widest uppercase font-sans">
                <span>Homiletical & Exegetical Vault</span>
                <span aria-hidden="true">·</span>
                <span>Version-Controlled Archive</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-title font-medium text-stone-900 leading-tight">
                Crafted for the Pulpit, Anchored in the Word
              </h1>
              <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl font-reading">
                A sanctuary for pastoral manuscript drafting, verse-by-verse exegesis, canonical cross-referencing, and seamless preaching notes with congregation handouts.
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 mt-6 border-t border-stone-300/70 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-2xl font-serif-title font-semibold text-stone-900 tabular-nums">
                  {stats.sermonsCount}
                </span>
                <span className="text-xs text-stone-500">Sermons Prepared</span>
              </div>
              <div>
                <span className="block text-2xl font-serif-title font-semibold text-stone-900 tabular-nums">
                  {stats.studiesCount}
                </span>
                <span className="text-xs text-stone-500">Bible Studies</span>
              </div>
              <div>
                <span className="block text-2xl font-serif-title font-semibold text-stone-900 tabular-nums">
                  {stats.illustrationsCount}
                </span>
                <span className="text-xs text-stone-500">Illustrations</span>
              </div>
              <div>
                <span className="block text-2xl font-serif-title font-semibold text-stone-900 tabular-nums">
                  {Math.round(stats.totalMinutes / 60)} hrs
                </span>
                <span className="text-xs text-stone-500">Pulpit Preaching</span>
              </div>
            </div>
          </div>

          {/* Visual Desk Photo */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full">
            <img
              src={deskHeroImage}
              alt="Preacher study desk with open Bible and handwritten manuscript"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply" />
            <div className="absolute bottom-3 right-3 bg-stone-900/70 backdrop-blur-xs text-[11px] text-stone-200 px-2 py-0.5 rounded">
              PHALANX Study Desk
            </div>
          </div>
        </div>
      </section>

      {/* Control Strip & Operational Ribbon */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manuscripts, scriptures (e.g. Romans 8), series, topics..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-md text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={onOpenGitModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-stone-200 text-stone-700 rounded-md hover:bg-stone-50 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-stone-800" />
            <span>GitHub Sync & Export</span>
          </button>

          <button
            onClick={() => onNewItem('sermon')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-stone-900 text-stone-50 rounded-md hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Work</span>
          </button>
        </div>
      </section>

      {/* Segmented Filter Controls */}
      <section className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-200/80">
        {/* Document Type Segmented Tabs */}
        <div className="inline-flex p-1 bg-stone-200/70 rounded-md text-xs font-medium text-stone-700">
          {(['all', 'sermon', 'study', 'illustration'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer capitalize ${
                selectedType === type ? 'bg-white text-stone-950 shadow-xs font-semibold' : 'hover:text-stone-900'
              }`}
            >
              {type === 'all' ? 'All Works' : `${type}s`}
            </button>
          ))}
        </div>

        {/* Status & Tag Selectors */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-stone-600">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as SermonStatus | 'all')}
              className="bg-white border border-stone-200 rounded px-2 py-1 text-stone-800 focus:outline-none focus:border-stone-400"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="preached">Preached</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 text-stone-600">
              <span>Topic:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="bg-white border border-stone-200 rounded px-2 py-1 text-stone-800 focus:outline-none focus:border-stone-400 max-w-[140px]"
              >
                <option value="all">All Topics</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Grid of Vault Items */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            onClick={() => onSelectItem(item, 'studio')}
            className="group relative flex flex-col justify-between bg-white border border-stone-200/90 rounded-lg p-5 hover:border-stone-400 hover:shadow-sm transition-all cursor-pointer"
          >
            {/* Top Area: Clean unboxed metadata (ZERO-PILL compliant) */}
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2 font-sans">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="uppercase tracking-wider font-semibold text-stone-700 capitalize">
                    {item.type}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.date}</span>
                  {item.durationMinutes ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.durationMinutes} min</span>
                    </>
                  ) : null}
                </div>
                <span className="text-[11px] capitalize text-stone-500 font-medium">
                  {item.status}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-xl font-serif-title font-semibold text-stone-900 group-hover:text-stone-800 leading-snug">
                {item.title}
              </h2>

              {item.subtitle && (
                <p className="text-xs text-stone-500 mt-1 line-clamp-1 font-reading italic">
                  {item.subtitle}
                </p>
              )}

              {/* Primary Scripture Kicker */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBibleExplorer(item.primaryScripture);
                  }}
                  className="text-xs font-semibold text-amber-900 hover:underline hover:text-amber-950 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{item.primaryScripture}</span>
                </button>
                {item.series && (
                  <span className="text-xs text-stone-400 truncate">
                    ({item.series})
                  </span>
                )}
              </div>

              {/* Big Idea Excerpt */}
              {item.bigIdea && (
                <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed bg-[#FBF9F5] p-2.5 rounded border border-stone-100">
                  <strong className="font-semibold text-stone-800">Big Idea: </strong>
                  {item.bigIdea}
                </p>
              )}
            </div>

            {/* Bottom Area: Tags, Cross-references, and Quick Actions */}
            <div className="mt-5 pt-3 border-t border-stone-100">
              {/* Tags inline text (No static pills) */}
              {item.tags.length > 0 && (
                <div className="text-[11px] text-stone-500 mb-3 flex flex-wrap gap-x-2 gap-y-0.5">
                  {item.tags.map((t, idx) => (
                    <span key={t}>
                      #{t}
                      {idx < item.tags.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item, 'preach');
                    }}
                    title="Launch Pulpit Preach Mode"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                  >
                    <Mic className="w-3 h-3 text-stone-600" />
                    <span>Pulpit</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item, 'handout');
                    }}
                    title="View Handout & Bulletins"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                  >
                    <FileText className="w-3 h-3 text-stone-600" />
                    <span>Handout</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDownloadMarkdown(e, item)}
                    title="Download as Markdown (.md)"
                    className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Delete document"
                    className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white border border-stone-200/90 rounded-lg p-8">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-serif-title font-medium text-stone-800">
            No manuscripts found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or filters, or begin drafting a fresh sermon manuscript.
          </p>
          <button
            onClick={() => onNewItem('sermon')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 text-xs font-medium rounded hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Sermon</span>
          </button>
        </div>
      )}
    </div>
  );
};
