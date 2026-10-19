import React, { useState, useMemo } from 'react';
import {
  Save,
  Mic,
  FileText,
  BookOpen,
  Calendar,
  Clock,
  Tag,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  ListOrdered,
  FileCode,
  Languages,
  Eye,
  CornerDownRight,
  Quote,
  Sparkles,
  Printer,
  Lock,
  Copy,
  Shield,
  Crown
} from 'lucide-react';
import { VaultItem, OutlinePoint, KeyTermStudy, UserProfile } from '../../types';
import { convertItemToMarkdown, downloadFile } from '../../utils/vaultStorage';
import { SAMPLE_SCRIPTURES } from '../../data/scripturePassages';
import { PulpitPdfModal } from './PulpitPdfModal';

interface SermonStudioProps {
  item: VaultItem;
  currentUser?: UserProfile | null;
  canEdit?: boolean;
  onUpdateItem: (updated: VaultItem) => void;
  onLaunchPreachMode: () => void;
  onViewHandout: () => void;
  onOpenBibleExplorer: (passage?: string) => void;
  onCloneToWorkbench?: (item: VaultItem) => void;
}

export const SermonStudio: React.FC<SermonStudioProps> = ({
  item,
  currentUser,
  canEdit = true,
  onUpdateItem,
  onLaunchPreachMode,
  onViewHandout,
  onOpenBibleExplorer,
  onCloneToWorkbench,
}) => {
  const [activeTab, setActiveTab] = useState<'manuscript' | 'outline' | 'exegesis'>('manuscript');
  const [showPreview, setShowPreview] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showScriptureSidebar, setShowScriptureSidebar] = useState(true);
  const [scriptureSearch, setScriptureSearch] = useState('');
  const [isPulpitPdfOpen, setIsPulpitPdfOpen] = useState(false);

  const authorDisplay = item.authorName || item.preacher || 'Pastor';
  const isOtherAuthor = item.authorId && currentUser && item.authorId !== currentUser.id;
  const userIsAdmin = Boolean(currentUser?.isAdmin || currentUser?.role === 'Administrator');

  // Field change helper
  const handleChange = <K extends keyof VaultItem>(field: K, value: VaultItem[K]) => {
    if (!canEdit) return;
    onUpdateItem({
      ...item,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Live Homiletical Statistics
  const wordsCount = useMemo(() => {
    const raw = `${item.manuscript} ${item.outline.map((o) => `${o.title} ${o.content}`).join(' ')}`;
    return raw.trim().split(/\s+/).filter(Boolean).length;
  }, [item.manuscript, item.outline]);

  const estimatedPulpitMinutes = useMemo(() => {
    // Standard sermon speaking cadence is 125-135 words per minute
    return Math.max(1, Math.round(wordsCount / 130));
  }, [wordsCount]);

  // Tag helpers
  const handleAddTag = () => {
    if (!canEdit) return;
    const trimmed = newTagInput.trim();
    if (trimmed && !item.tags.includes(trimmed)) {
      handleChange('tags', [...item.tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!canEdit) return;
    handleChange(
      'tags',
      item.tags.filter((t) => t !== tagToRemove)
    );
  };

  // Outline item modifications
  const handleAddOutlinePoint = (level: 1 | 2 = 1) => {
    if (!canEdit) return;
    const newPoint: OutlinePoint = {
      id: `pt-${Date.now()}`,
      level,
      title: level === 1 ? 'New Main Point' : 'Subpoint',
      scriptureRef: '',
      content: '',
      speakerCue: '',
    };
    handleChange('outline', [...item.outline, newPoint]);
  };

  const handleUpdateOutlinePoint = (id: string, updates: Partial<OutlinePoint>) => {
    if (!canEdit) return;
    const updated = item.outline.map((p) => (p.id === id ? { ...p, ...updates } : p));
    handleChange('outline', updated);
  };

  const handleRemoveOutlinePoint = (id: string) => {
    if (!canEdit) return;
    handleChange(
      'outline',
      item.outline.filter((p) => p.id !== id)
    );
  };

  // Speaker cue quick insertion into manuscript
  const insertSpeakerCue = (cue: string) => {
    if (!canEdit) return;
    const snippet = `\n\n[${cue.toUpperCase()}]\n\n`;
    handleChange('manuscript', (item.manuscript || '') + snippet);
  };

  // Insert verse text directly into manuscript
  const insertScriptureToManuscript = (ref: string, text: string) => {
    if (!canEdit) return;
    const quote = `\n\n> *"${text}"* — **${ref}**\n\n`;
    handleChange('manuscript', (item.manuscript || '') + quote);
  };

  // Exegesis Key Terms
  const handleAddKeyTerm = () => {
    if (!canEdit) return;
    const newTerm: KeyTermStudy = {
      id: `kt-${Date.now()}`,
      original: '',
      language: 'Greek',
      transliteration: '',
      meaning: '',
      notes: '',
    };
    handleChange('exegesis', {
      ...item.exegesis,
      keyTerms: [...item.exegesis.keyTerms, newTerm],
    });
  };

  const handleUpdateKeyTerm = (id: string, updates: Partial<KeyTermStudy>) => {
    if (!canEdit) return;
    const updatedTerms = item.exegesis.keyTerms.map((t) => (t.id === id ? { ...t, ...updates } : t));
    handleChange('exegesis', {
      ...item.exegesis,
      keyTerms: updatedTerms,
    });
  };

  const handleRemoveKeyTerm = (id: string) => {
    if (!canEdit) return;
    handleChange('exegesis', {
      ...item.exegesis,
      keyTerms: item.exegesis.keyTerms.filter((t) => t.id !== id),
    });
  };

  // Filter scriptures for sidebar
  const matchingScriptures = useMemo(() => {
    if (!scriptureSearch.trim()) return SAMPLE_SCRIPTURES.slice(0, 8);
    const q = scriptureSearch.toLowerCase();
    return SAMPLE_SCRIPTURES.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        `${s.book} ${s.chapter}:${s.verse}`.toLowerCase().includes(q)
    );
  }, [scriptureSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Read-Only Banner for non-authors */}
      {!canEdit && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Read-Only Church Manuscript</span>
                <span className="bg-amber-200/80 text-amber-950 text-[10px] font-mono px-1.5 py-0.2 rounded uppercase">
                  Global Library
                </span>
              </div>
              <p className="text-amber-900 mt-0.5 leading-relaxed">
                Authored by <strong>{authorDisplay}</strong>. You can study, preach live from the pulpit, or print/download this manuscript. Only the author or ADMIN can modify the original.
              </p>
            </div>
          </div>

          {onCloneToWorkbench && (
            <button
              type="button"
              onClick={() => onCloneToWorkbench(item)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-lg font-medium transition-colors shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate to My Workbench</span>
            </button>
          )}
        </div>
      )}

      {/* Admin Override Banner */}
      {userIsAdmin && isOtherAuthor && (
        <div className="bg-red-50/90 border border-red-300/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-200/80 rounded-lg text-red-900 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">ADMIN Master Override Active</span>
                <span className="bg-red-200 text-red-900 text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold">
                  Administrator Privileges
                </span>
              </div>
              <p className="text-red-900 mt-0.5">
                You are editing <strong>{authorDisplay}</strong>’s manuscript with full master privileges. All changes will be saved to their church vault.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-red-800 bg-red-100 border border-red-200 px-2 py-1 rounded">
            Full Editing Enabled
          </span>
        </div>
      )}

      {/* Studio Top Control Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-sans">
            {item.type} Workbench
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-500 tabular-nums">
            {wordsCount} words · ~{estimatedPulpitMinutes} min speaking
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-600 font-medium">
            Author: {authorDisplay}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onCloneToWorkbench && !canEdit && (
            <button
              onClick={() => onCloneToWorkbench(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
              title="Clone this sermon into your personal workbench to edit and adapt"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone to Edit</span>
            </button>
          )}

          <button
            onClick={() => {
              const md = convertItemToMarkdown(item);
              downloadFile(md, `${item.date || 'note'}-${item.slug || 'work'}.md`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-700 rounded hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            title="Download sermon manuscript and outline as Markdown (.md) with YAML frontmatter"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Download .md</span>
          </button>

          <button
            onClick={() => setIsPulpitPdfOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 border border-amber-300 text-amber-950 rounded hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
            title="Print or Save PDF formatted specifically for preaching at the pulpit lectern"
          >
            <Printer className="w-3.5 h-3.5 text-amber-800" />
            <span>Pulpit PDF</span>
          </button>

          <button
            onClick={onViewHandout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-700 rounded hover:bg-stone-50 transition-colors cursor-pointer"
            title="Generate Congregation Handout & Leader Key"
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>Handout</span>
          </button>

          <button
            onClick={onLaunchPreachMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
            title="Launch live pulpit lectern mode"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Preach Mode</span>
          </button>
        </div>
      </div>

      {/* Primary Metadata Box */}
      <section className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Title & Subtitle */}
          <div className="md:col-span-8 space-y-2">
            <input
              type="text"
              disabled={!canEdit}
              value={item.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Sermon or Study Title..."
              className="w-full text-2xl sm:text-3xl font-serif-title font-semibold text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-0 border-b border-transparent hover:border-stone-200 focus:border-stone-400 pb-1 transition-colors disabled:cursor-default"
            />
            <input
              type="text"
              disabled={!canEdit}
              value={item.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Add optional subtitle or theological focus..."
              className="w-full text-sm text-stone-500 placeholder-stone-300 focus:outline-none border-b border-transparent hover:border-stone-200 focus:border-stone-400 pb-0.5 transition-colors font-reading disabled:cursor-default"
            />
          </div>

          {/* Type & Status */}
          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between bg-stone-50 p-2 rounded border border-stone-200/70">
              <span className="text-stone-500">Status</span>
              <select
                disabled={!canEdit}
                value={item.status}
                onChange={(e) => handleChange('status', e.target.value as any)}
                className="bg-transparent font-medium text-stone-800 focus:outline-none text-right capitalize cursor-pointer disabled:cursor-default"
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="preached">Preached</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-stone-50 p-2 rounded border border-stone-200/70">
              <span className="text-stone-500">Target Time</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  disabled={!canEdit}
                  min="5"
                  max="120"
                  value={item.durationMinutes || 35}
                  onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value) || 0)}
                  className="w-12 text-right bg-transparent font-medium text-stone-800 focus:outline-none tabular-nums disabled:cursor-default"
                />
                <span className="text-stone-500">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Scripture, Series, Date, Preacher */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Primary Scripture
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={!canEdit}
                value={item.primaryScripture}
                onChange={(e) => handleChange('primaryScripture', e.target.value)}
                placeholder="e.g. Romans 8:28-39"
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-stone-800 font-semibold focus:outline-none focus:border-stone-400 disabled:cursor-default"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Sermon Series
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={item.series || ''}
              onChange={(e) => handleChange('series', e.target.value)}
              placeholder="e.g. Joy in the Wilderness"
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-stone-800 focus:outline-none focus:border-stone-400 disabled:cursor-default"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Preaching Date
            </label>
            <input
              type="date"
              disabled={!canEdit}
              value={item.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-stone-800 focus:outline-none focus:border-stone-400 disabled:cursor-default"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">Preacher / Author</label>
            <input
              type="text"
              disabled={!canEdit}
              value={item.preacher}
              onChange={(e) => handleChange('preacher', e.target.value)}
              placeholder="Pastor Name"
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded text-stone-800 focus:outline-none focus:border-stone-400 disabled:cursor-default"
            />
          </div>
        </div>

        {/* Big Idea (Homiletical Central Proposition) */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Homiletical Big Idea (The One Central Truth):
          </label>
          <textarea
            rows={2}
            disabled={!canEdit}
            value={item.bigIdea}
            onChange={(e) => handleChange('bigIdea', e.target.value)}
            placeholder="In a single sentence: What is the timeless theological truth and practical thrust of this passage?"
            className="w-full px-3 py-2 text-xs text-stone-800 bg-[#FBF9F5] border border-stone-200 rounded focus:outline-none focus:border-stone-400 leading-relaxed font-reading disabled:cursor-default"
          />
        </div>

        {/* Tags management */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500">Tags:</span>
          {item.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded transition-colors"
            >
              #{t}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-stone-400 hover:text-stone-700 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {canEdit && (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="+ add tag"
                className="px-2 py-0.5 text-xs bg-transparent border-b border-stone-300 focus:outline-none focus:border-stone-600 w-20"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Studio Tabs & Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Main Area (8 or 12 cols) */}
        <div className={`space-y-4 ${showScriptureSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="inline-flex p-1 bg-stone-200/70 rounded-md text-xs font-medium text-stone-700">
              <button
                onClick={() => setActiveTab('manuscript')}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'manuscript'
                    ? 'bg-white text-stone-950 font-semibold shadow-xs'
                    : 'hover:text-stone-900'
                }`}
              >
                Manuscript & Notes
              </button>
              <button
                onClick={() => setActiveTab('outline')}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'outline'
                    ? 'bg-white text-stone-950 font-semibold shadow-xs'
                    : 'hover:text-stone-900'
                }`}
              >
                Homiletical Outline ({item.outline.length})
              </button>
              <button
                onClick={() => setActiveTab('exegesis')}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'exegesis'
                    ? 'bg-white text-stone-950 font-semibold shadow-xs'
                    : 'hover:text-stone-900'
                }`}
              >
                Exegesis & Languages
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScriptureSidebar(!showScriptureSidebar)}
                className="text-xs text-stone-600 hover:text-stone-900 border border-stone-200 bg-white px-2.5 py-1 rounded cursor-pointer"
              >
                {showScriptureSidebar ? 'Hide Scripture Drawer' : 'Show Scripture Drawer'}
              </button>
            </div>
          </div>

          {/* TAB 1: Manuscript & Notes */}
          {activeTab === 'manuscript' && (
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs">
              {/* Speaker Cue Insertion Bar & Quick Pulpit Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                {canEdit ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mr-1">
                      Insert Cue:
                    </span>
                    {[
                      'PAUSE 3s',
                      'LOOK UP',
                      'EMPHASIZE',
                      'READ SCRIPTURE',
                      'ILLUSTRATION',
                      'LOWER VOICE',
                      'CONGREGATION RESPONSE',
                    ].map((cue) => (
                      <button
                        key={cue}
                        onClick={() => insertSpeakerCue(cue)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-mono-code transition-colors cursor-pointer"
                      >
                        +{cue}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-stone-500 italic">
                    Reading {authorDisplay}'s manuscript in study view.
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <button
                    onClick={() => {
                      const md = convertItemToMarkdown(item);
                      downloadFile(md, `${item.date || 'note'}-${item.slug || 'work'}.md`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded border border-stone-200 transition-colors"
                    title="Download .md file"
                  >
                    <Download className="w-3 h-3 text-stone-500" />
                    <span>.md</span>
                  </button>

                  <button
                    onClick={() => setIsPulpitPdfOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-300/80 transition-colors"
                    title="Print / Save Pulpit PDF"
                  >
                    <Printer className="w-3 h-3 text-amber-800" />
                    <span>Pulpit PDF</span>
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={20}
                  disabled={!canEdit}
                  value={item.manuscript}
                  onChange={(e) => handleChange('manuscript', e.target.value)}
                  placeholder="Draft your sermon manuscript, exegesis observations, historical context, or preaching notes here (supports Markdown: # Heading, > Quote, - List, **Bold**)..."
                  className="w-full px-4 py-3 bg-[#FCFBF9] border border-stone-200 rounded-md text-sm text-stone-900 leading-relaxed font-reading placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white transition-all disabled:cursor-default"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Supports standard markdown, blockquotes, and speaker cues</span>
                <span className="font-mono-code tabular-nums">
                  {wordsCount} words | ~{estimatedPulpitMinutes} minutes
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Homiletical Outline */}
          {activeTab === 'outline' && (
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif-title font-semibold text-stone-900">
                    Homiletical Outline Architecture
                  </h3>
                  <p className="text-xs text-stone-500">
                    Organize your main biblical movements, subpoints, and pulpit stage cues.
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddOutlinePoint(1)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Main Point</span>
                    </button>
                    <button
                      onClick={() => handleAddOutlinePoint(2)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>+ Subpoint</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {item.outline.map((point, index) => (
                  <div
                    key={point.id}
                    className={`p-4 rounded-lg border transition-all ${
                      point.level === 1
                        ? 'bg-white border-stone-300'
                        : 'bg-[#FAF8F5] border-stone-200 ml-4 sm:ml-6'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-mono font-bold text-stone-500">
                          {point.level === 1 ? `POINT ${index + 1}` : `SUBPOINT`}
                        </span>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={point.title}
                          onChange={(e) =>
                            handleUpdateOutlinePoint(point.id, { title: e.target.value })
                          }
                          placeholder="Point Title..."
                          className="font-serif-title font-semibold text-stone-900 text-sm flex-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-500 focus:outline-none disabled:cursor-default"
                        />
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveOutlinePoint(point.id)}
                            className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                            title="Remove point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={point.scriptureRef || ''}
                        onChange={(e) =>
                          handleUpdateOutlinePoint(point.id, { scriptureRef: e.target.value })
                        }
                        placeholder="Scripture reference (e.g. Rom 8:28)"
                        className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-700 focus:outline-none disabled:cursor-default"
                      />
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={point.speakerCue || ''}
                        onChange={(e) =>
                          handleUpdateOutlinePoint(point.id, { speakerCue: e.target.value })
                        }
                        placeholder="Pulpit cue (e.g. [PAUSE 3s], [EMPHASIZE])"
                        className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-600 font-mono text-[11px] focus:outline-none disabled:cursor-default"
                      />
                    </div>

                    <textarea
                      rows={2}
                      disabled={!canEdit}
                      value={point.content}
                      onChange={(e) =>
                        handleUpdateOutlinePoint(point.id, { content: e.target.value })
                      }
                      placeholder="Exposition, explanation, homiletical illustration, or application..."
                      className="w-full px-2.5 py-1.5 text-xs text-stone-800 bg-white border border-stone-200 rounded focus:outline-none focus:border-stone-400 font-reading leading-relaxed disabled:cursor-default"
                    />
                  </div>
                ))}

                {item.outline.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    No outline points yet. {canEdit && 'Click "+ Main Point" above to structure your sermon flow.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Exegesis & Original Languages */}
          {activeTab === 'exegesis' && (
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-5 shadow-2xs">
              <div>
                <h3 className="text-base font-serif-title font-semibold text-stone-900">
                  Exegetical Workbench & Historical Setting
                </h3>
                <p className="text-xs text-stone-500">
                  Record historical-grammatical context, literary structure, and Greek/Hebrew word analyses.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Historical & Cultural Context:
                </label>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  value={item.exegesis?.historicalContext || ''}
                  onChange={(e) =>
                    handleChange('exegesis', {
                      ...item.exegesis,
                      historicalContext: e.target.value,
                    })
                  }
                  placeholder="Author, original recipients, date, political/cultural pressures, purpose of letter/book..."
                  className="w-full text-xs text-stone-800 bg-[#FCFBF9] border border-stone-200 rounded p-2.5 focus:outline-none focus:border-stone-400 leading-relaxed font-reading disabled:cursor-default"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Literary Structure & Macro Flow:
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={item.exegesis?.literaryStructure || ''}
                  onChange={(e) =>
                    handleChange('exegesis', {
                      ...item.exegesis,
                      literaryStructure: e.target.value,
                    })
                  }
                  placeholder="e.g. Epistolary argument, chiasm, prophetic lament, narrative arc..."
                  className="w-full text-xs text-stone-800 bg-[#FCFBF9] border border-stone-200 rounded p-2.5 focus:outline-none focus:border-stone-400 leading-relaxed font-reading disabled:cursor-default"
                />
              </div>

              {/* Key Terms Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700">
                    Original Language Key Terms:
                  </label>
                  {canEdit && (
                    <button
                      onClick={handleAddKeyTerm}
                      className="inline-flex items-center gap-1 text-xs font-medium text-stone-800 hover:text-stone-950 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Term</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {item.exegesis?.keyTerms.map((term) => (
                    <div
                      key={term.id}
                      className="p-3 bg-stone-50 border border-stone-200 rounded text-xs space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={term.original}
                          onChange={(e) =>
                            handleUpdateKeyTerm(term.id, { original: e.target.value })
                          }
                          placeholder="e.g. συνεργεῖ (synergei)"
                          className="sm:col-span-4 px-2 py-1 bg-white border border-stone-200 rounded font-semibold text-stone-900 focus:outline-none disabled:cursor-default"
                        />
                        <select
                          disabled={!canEdit}
                          value={term.language}
                          onChange={(e) =>
                            handleUpdateKeyTerm(term.id, { language: e.target.value as any })
                          }
                          className="sm:col-span-2 px-2 py-1 bg-white border border-stone-200 rounded text-stone-800 focus:outline-none disabled:cursor-default"
                        >
                          <option value="Greek">Greek</option>
                          <option value="Hebrew">Hebrew</option>
                          <option value="Aramaic">Aramaic</option>
                        </select>
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={term.transliteration}
                          onChange={(e) =>
                            handleUpdateKeyTerm(term.id, { transliteration: e.target.value })
                          }
                          placeholder="transliteration"
                          className="sm:col-span-2 px-2 py-1 bg-white border border-stone-200 rounded italic text-stone-700 focus:outline-none disabled:cursor-default"
                        />
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={term.meaning}
                          onChange={(e) => handleUpdateKeyTerm(term.id, { meaning: e.target.value })}
                          placeholder="Primary lexical gloss"
                          className="sm:col-span-3 px-2 py-1 bg-white border border-stone-200 rounded text-stone-800 focus:outline-none disabled:cursor-default"
                        />
                        {canEdit && (
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              onClick={() => handleRemoveKeyTerm(term.id)}
                              className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={term.notes}
                        onChange={(e) => handleUpdateKeyTerm(term.id, { notes: e.target.value })}
                        placeholder="Syntax, morphology, or theological nuances..."
                        className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-stone-600 focus:outline-none disabled:cursor-default"
                      />
                    </div>
                  ))}

                  {(!item.exegesis?.keyTerms || item.exegesis.keyTerms.length === 0) && (
                    <div className="text-center py-4 text-stone-400 text-xs">
                      No key terms recorded yet. {canEdit && 'Click "+ Add Term" to record Greek/Hebrew word insights.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Scripture Drawer / Cross Reference Assistant (4 cols) */}
        {showScriptureSidebar && (
          <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-lg p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                <BookOpen className="w-4 h-4 text-amber-900" />
                <span>Scripture Desk</span>
              </div>
              <button
                onClick={() => onOpenBibleExplorer(item.primaryScripture)}
                className="text-xs text-amber-900 hover:underline hover:text-amber-950 font-medium cursor-pointer"
              >
                Open Full Bible Explorer →
              </button>
            </div>

            {/* Quick search input */}
            <input
              type="text"
              value={scriptureSearch}
              onChange={(e) => setScriptureSearch(e.target.value)}
              placeholder="Search verses (e.g. grace, Rom 8:28)..."
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:border-stone-400"
            />

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {matchingScriptures.map((s, idx) => {
                const ref = `${s.book} ${s.chapter}:${s.verse}`;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#FAF8F5] border border-stone-200/80 rounded text-xs space-y-1.5 hover:border-stone-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-950 font-sans">
                        {ref} ({s.version})
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => insertScriptureToManuscript(ref, s.text)}
                          className="text-[11px] text-stone-500 hover:text-stone-900 hover:underline cursor-pointer"
                          title="Insert quote block directly into manuscript text"
                        >
                          + Insert Quote
                        </button>
                      )}
                    </div>
                    <p className="text-stone-700 leading-relaxed font-reading text-xs italic">
                      "{s.text}"
                    </p>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Pulpit Preacher PDF Modal */}
      <PulpitPdfModal
        isOpen={isPulpitPdfOpen}
        onClose={() => setIsPulpitPdfOpen(false)}
        item={item}
      />
    </div>
  );
};
