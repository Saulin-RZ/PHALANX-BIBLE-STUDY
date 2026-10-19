import React, { useState } from 'react';
import { Printer, Download, Plus, Trash2, CheckCircle2, FileText, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { VaultItem, HandoutItem } from '../../types';
import { downloadFile } from '../../utils/vaultStorage';

interface HandoutViewProps {
  item: VaultItem;
  onUpdateItem: (updated: VaultItem) => void;
  onReturnToStudio: () => void;
}

export const HandoutView: React.FC<HandoutViewProps> = ({
  item,
  onUpdateItem,
  onReturnToStudio,
}) => {
  const [isLeaderKey, setIsLeaderKey] = useState(false);
  const [includeDiscussion, setIncludeDiscussion] = useState(true);
  const [includeNotesSection, setIncludeNotesSection] = useState(true);

  // Handout Item actions
  const handleAddHandoutItem = () => {
    const newItem: HandoutItem = {
      id: `h-${Date.now()}`,
      question: 'The grace of God is ________ in Christ Jesus.',
      answer: 'unconditional',
      scripture: item.primaryScripture || 'Scripture ref',
    };
    onUpdateItem({
      ...item,
      handoutItems: [...item.handoutItems, newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateHandoutItem = (id: string, updates: Partial<HandoutItem>) => {
    const updated = item.handoutItems.map((h) => (h.id === id ? { ...h, ...updates } : h));
    onUpdateItem({
      ...item,
      handoutItems: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveHandoutItem = (id: string) => {
    onUpdateItem({
      ...item,
      handoutItems: item.handoutItems.filter((h) => h.id !== id),
      updatedAt: new Date().toISOString(),
    });
  };

  // Discussion Questions actions
  const handleAddQuestion = () => {
    const newQ = 'How does this truth challenge our everyday decisions this week?';
    onUpdateItem({
      ...item,
      discussionQuestions: [...(item.discussionQuestions || []), newQ],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    const updated = [...(item.discussionQuestions || [])];
    updated[index] = val;
    onUpdateItem({
      ...item,
      discussionQuestions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = (item.discussionQuestions || []).filter((_, i) => i !== index);
    onUpdateItem({
      ...item,
      discussionQuestions: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Export clean markdown handout
  const exportHandoutMarkdown = () => {
    let md = `# ${item.title}\n`;
    if (item.subtitle) md += `*${item.subtitle}*\n\n`;
    md += `**Scripture**: ${item.primaryScripture}  \n`;
    md += `**Date**: ${item.date} | **Speaker**: ${item.preacher}  \n`;
    if (item.series) md += `**Series**: ${item.series}  \n`;
    md += `\n---\n\n`;

    if (item.bigIdea) {
      md += `> **Main Truth**: ${item.bigIdea}\n\n`;
    }

    md += `## Sermon Listening Guide\n\n`;
    item.handoutItems.forEach((h, idx) => {
      if (isLeaderKey) {
        md += `${idx + 1}. ${h.question.replace(/_{3,}/g, `**[${h.answer}]**`)} *(Ref: ${h.scripture})*\n`;
      } else {
        md += `${idx + 1}. ${h.question} *(Ref: ${h.scripture})*\n`;
      }
    });

    if (includeDiscussion && item.discussionQuestions?.length) {
      md += `\n## Community Group Discussion Questions\n\n`;
      item.discussionQuestions.forEach((q, idx) => {
        md += `${idx + 1}. ${q}\n`;
      });
    }

    downloadFile(md, `${item.slug || 'sermon'}-handout-${isLeaderKey ? 'leader' : 'congregation'}.md`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToStudio}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Studio</span>
          </button>
          <span className="text-stone-300">·</span>
          <h2 className="text-sm font-semibold text-stone-900">
            Handout & Handover Note Generator
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Congregation / Leader Key */}
          <div className="inline-flex p-1 bg-stone-200/70 rounded-md text-xs font-medium text-stone-700">
            <button
              onClick={() => setIsLeaderKey(false)}
              className={`px-3 py-1 rounded transition-colors ${
                !isLeaderKey ? 'bg-white text-stone-950 font-semibold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Congregation (Blanks)
            </button>
            <button
              onClick={() => setIsLeaderKey(true)}
              className={`px-3 py-1 rounded transition-colors ${
                isLeaderKey ? 'bg-white text-stone-950 font-semibold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Leader Key (With Answers)
            </button>
          </div>

          <button
            onClick={exportHandoutMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-700 rounded hover:bg-stone-50 transition-colors"
            title="Download Handout as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors shadow-xs"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Drawer for adding/editing questions (Hidden during print) */}
      <div className="no-print bg-white border border-stone-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Handout Items & Fill-in-the-Blanks
            </h3>
            <p className="text-xs text-stone-500">
              Type <code className="font-mono text-stone-700 font-semibold">______</code> (underscores) where you want a blank for the listener to write in.
            </p>
          </div>
          <button
            onClick={handleAddHandoutItem}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add Blank Point</span>
          </button>
        </div>

        <div className="space-y-3">
          {item.handoutItems.map((h, idx) => (
            <div
              key={h.id}
              className="p-3 bg-[#FAF8F5] border border-stone-200 rounded text-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-bold text-stone-500 pt-1">{idx + 1}.</span>
                <input
                  type="text"
                  value={h.question}
                  onChange={(e) => handleUpdateHandoutItem(h.id, { question: e.target.value })}
                  placeholder="e.g. God causes all things to work together for good because He is ______."
                  className="flex-1 px-2.5 py-1 bg-white border border-stone-200 rounded text-stone-900 font-reading focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveHandoutItem(h.id)}
                  className="text-stone-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone-500">Answer:</span>
                  <input
                    type="text"
                    value={h.answer}
                    onChange={(e) => handleUpdateHandoutItem(h.id, { answer: e.target.value })}
                    placeholder="e.g. sovereign"
                    className="flex-1 px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-900 font-semibold focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone-500">Scripture Ref:</span>
                  <input
                    type="text"
                    value={h.scripture}
                    onChange={(e) => handleUpdateHandoutItem(h.id, { scripture: e.target.value })}
                    placeholder="e.g. Romans 8:28"
                    className="flex-1 px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          {item.handoutItems.length === 0 && (
            <div className="text-center py-4 text-stone-400 text-xs">
              No blanks added yet. Click "+ Add Blank Point" to create fill-in-the-blank notes.
            </div>
          )}
        </div>

        {/* Small Group Discussion Questions Editor */}
        <div className="pt-4 border-t border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-stone-900">
              Community / Small Group Discussion Questions
            </h4>
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1 text-xs text-stone-700 hover:text-stone-950 font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Question</span>
            </button>
          </div>

          <div className="space-y-2">
            {(item.discussionQuestions || []).map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-400">{idx + 1}.</span>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-200 rounded text-stone-800 focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="text-stone-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRINTABLE BULLETIN / HANDOUT CANVAS (This is what prints to PDF!) */}
      <div className="bg-white border border-stone-300 rounded-lg p-8 sm:p-12 shadow-sm font-reading print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-stone-800 pb-5 mb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs uppercase tracking-widest text-stone-500 font-sans mb-2">
            <span>
              {item.series ? `Series: ${item.series}` : 'Sermon Study Notes'}
            </span>
            <span>
              {isLeaderKey ? '• LEADER FACILITATOR KEY •' : '• CONGREGATION STUDY GUIDE •'}
            </span>
            <span>{item.date}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-stone-900 leading-tight">
            {item.title}
          </h1>

          {item.subtitle && (
            <p className="text-sm text-stone-600 italic mt-1">{item.subtitle}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-stone-700 font-sans pt-3 border-t border-stone-200">
            <div>
              <strong>Primary Scripture:</strong>{' '}
              <span className="font-semibold text-stone-900">{item.primaryScripture}</span>
            </div>
            <div>
              <strong>Preacher:</strong> {item.preacher}
            </div>
          </div>
        </div>

        {/* Central Proposition */}
        {item.bigIdea && (
          <div className="mb-6 p-4 rounded bg-stone-50 border border-stone-200 print:bg-stone-50 print:border-stone-300">
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-500 font-sans mb-1">
              Central Truth:
            </span>
            <p className="text-sm sm:text-base italic text-stone-800 font-serif-title leading-relaxed">
              "{item.bigIdea}"
            </p>
          </div>
        )}

        {/* Fill in the Blanks Section */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans mb-4 border-b border-stone-200 pb-1">
            Sermon Outline & Notes
          </h2>

          <div className="space-y-4">
            {item.handoutItems.map((h, idx) => {
              // If leader key, replace blanks with highlighted answer
              if (isLeaderKey) {
                const parts = h.question.split(/_{3,}/);
                return (
                  <div key={h.id} className="text-sm leading-relaxed text-stone-800">
                    <span className="font-semibold mr-1.5">{idx + 1}.</span>
                    {parts.map((p, i) => (
                      <React.Fragment key={i}>
                        {p}
                        {i < parts.length - 1 && (
                          <span className="font-bold underline decoration-amber-600 text-stone-950 px-1 bg-amber-50">
                            {h.answer}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                    {h.scripture && (
                      <span className="text-xs text-stone-500 font-mono ml-2">
                        ({h.scripture})
                      </span>
                    )}
                  </div>
                );
              }

              // Congregation view with underline blanks
              return (
                <div key={h.id} className="text-sm leading-relaxed text-stone-800">
                  <span className="font-semibold mr-1.5">{idx + 1}.</span>
                  <span>{h.question}</span>
                  {h.scripture && (
                    <span className="text-xs text-stone-500 font-mono ml-2">
                      ({h.scripture})
                    </span>
                  )}
                </div>
              );
            })}

            {item.handoutItems.length === 0 && (
              <p className="text-xs text-stone-400 italic">No handout points defined yet.</p>
            )}
          </div>
        </section>

        {/* Discussion Questions Section */}
        {includeDiscussion && item.discussionQuestions && item.discussionQuestions.length > 0 && (
          <section className="mb-8 page-break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 font-sans mb-4 border-b border-stone-200 pb-1">
              Reflection & Discussion Questions
            </h2>
            <ol className="list-decimal list-inside space-y-2.5 text-sm text-stone-800">
              {item.discussionQuestions.map((q, idx) => (
                <li key={idx} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Personal Notes Lined Area (Congregational copy) */}
        {!isLeaderKey && includeNotesSection && (
          <section className="mt-8 page-break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-sans mb-3">
              Personal Notes & Application:
            </h2>
            <div className="space-y-4">
              <div className="border-b border-dashed border-stone-300 h-6"></div>
              <div className="border-b border-dashed border-stone-300 h-6"></div>
              <div className="border-b border-dashed border-stone-300 h-6"></div>
              <div className="border-b border-dashed border-stone-300 h-6"></div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-stone-200 text-center text-xs text-stone-400 font-sans">
          <span>Kerygma Sermon Vault · Published for Christ’s Church</span>
        </div>
      </div>
    </div>
  );
};
