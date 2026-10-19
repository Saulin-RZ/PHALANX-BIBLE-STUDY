import React, { useState } from 'react';
import { X, Printer, Download, Eye, FileText, Check, Settings2, BookOpen } from 'lucide-react';
import { VaultItem } from '../../types';
import { downloadFile, generatePulpitHtml, printPulpitDocument } from '../../utils/vaultStorage';

interface PulpitPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItem;
}

export const PulpitPdfModal: React.FC<PulpitPdfModalProps> = ({ isOpen, onClose, item }) => {
  const [fontSize, setFontSize] = useState<'12pt' | '14pt' | '16pt'>('14pt');
  const [includeOutline, setIncludeOutline] = useState(true);
  const [includeExegesis, setIncludeExegesis] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    printPulpitDocument(item, {
      fontSize,
      includeOutline,
      includeExegesis,
    });
  };

  const handleDownloadHtml = () => {
    const html = generatePulpitHtml(item, {
      fontSize,
      includeOutline,
      includeExegesis,
    });
    const filename = `${item.date || 'sermon'}-${item.slug || 'pulpit-notes'}-pulpit.html`;
    downloadFile(html, filename, 'text/html;charset=utf-8;');
  };

  const fontSizeClass =
    fontSize === '12pt' ? 'text-sm' : fontSize === '14pt' ? 'text-base' : 'text-lg';

  // Render paragraphs with highlighted speaker cues
  const renderFormattedManuscript = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return (
          <div
            key={idx}
            className="my-3 py-1 px-3 bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-mono-code font-bold uppercase tracking-wider inline-block rounded"
          >
            {trimmed.slice(1, -1)}
          </div>
        );
      }

      if (trimmed.startsWith('>')) {
        return (
          <blockquote
            key={idx}
            className="my-4 pl-4 border-l-3 border-amber-800 text-stone-800 italic bg-stone-50 py-2 pr-3 rounded-r font-reading"
          >
            {trimmed.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      if (trimmed.startsWith('#')) {
        const headerLevel = trimmed.match(/^#+/)?.[0].length || 1;
        const headerText = trimmed.replace(/^#+\s*/, '');
        return (
          <h3
            key={idx}
            className={`font-serif-title font-bold text-stone-900 mt-6 mb-2 ${
              headerLevel === 1 ? 'text-2xl' : 'text-xl'
            }`}
          >
            {headerText}
          </h3>
        );
      }

      return (
        <p key={idx} className="mb-4 leading-relaxed font-reading text-stone-800">
          {para}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:static print:bg-transparent print:p-0 print:overflow-visible">
      <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:m-0 print:bg-white print:overflow-visible">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-stone-800" />
            <div>
              <h3 className="text-base sm:text-lg font-serif-title font-bold text-stone-900">
                Pulpit Preaching Notes — Print & PDF Export
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Formatted specifically for lectern readability, physical binders, and Save to PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Bar (Hidden on print) */}
        <div className="no-print px-6 py-3 bg-stone-100/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Font size choice */}
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="font-semibold">Pulpit Font:</span>
              <div className="inline-flex p-0.5 bg-white border border-stone-300 rounded">
                {(['12pt', '14pt', '16pt'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                      fontSize === size
                        ? 'bg-stone-900 text-stone-50 font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {size === '12pt' ? '12pt Regular' : size === '14pt' ? '14pt Large (Recommended)' : '16pt Large+'}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-700">
              <input
                type="checkbox"
                checked={includeOutline}
                onChange={(e) => setIncludeOutline(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-0"
              />
              <span>Include Outline Summary</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-stone-700">
              <input
                type="checkbox"
                checked={includeExegesis}
                onChange={(e) => setIncludeExegesis(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-0"
              />
              <span>Include Exegesis Appendix</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 hover:text-stone-950 text-xs font-medium rounded transition-colors cursor-pointer"
              title="Download standalone offline HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Offline HTML</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs font-semibold rounded transition-colors cursor-pointer shadow-xs"
              title="Trigger browser print to paper or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-200/40 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="pulpit-printable-doc"
            className={`bg-white border border-stone-300 rounded p-8 sm:p-12 shadow-sm font-reading max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 ${fontSizeClass}`}
          >
            {/* Header */}
            <div className="border-b-2 border-stone-900 pb-4 mb-6">
              <div className="text-[11px] uppercase tracking-widest text-stone-500 font-sans mb-1.5">
                {item.series ? `Series: ${item.series} · ` : ''}Date: {item.date} · Preacher: {item.preacher}
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-stone-950 leading-tight">
                {item.title}
              </h1>
              {item.subtitle && (
                <p className="text-sm text-stone-600 italic mt-1 font-reading">
                  {item.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs font-sans pt-2 border-t border-stone-200">
                <div>
                  <strong className="text-stone-700">Primary Scripture: </strong>
                  <span className="font-semibold text-amber-950">{item.primaryScripture}</span>
                </div>
                <div>
                  <span className="text-stone-500">Target Time: {item.durationMinutes || 35} mins</span>
                </div>
              </div>
            </div>

            {/* Big Idea / Proposition */}
            {item.bigIdea && (
              <div className="mb-6 p-3.5 bg-stone-50 border border-stone-200 rounded print:bg-stone-50">
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-sans mb-1">
                  Homiletical Proposition (Big Idea):
                </div>
                <p className="font-serif-title text-base sm:text-lg font-semibold italic text-stone-900 leading-snug">
                  "{item.bigIdea}"
                </p>
              </div>
            )}

            {/* Outline Summary */}
            {includeOutline && item.outline && item.outline.length > 0 && (
              <section className="mb-6 p-4 bg-[#FAF8F5] border border-stone-200/90 rounded page-break-inside-avoid">
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-sans mb-2 border-b border-stone-200 pb-1">
                  Homiletical Movements & Outline
                </div>
                <div className="space-y-2.5">
                  {item.outline.map((pt, i) => (
                    <div
                      key={pt.id}
                      className={`pl-2.5 border-l-2 ${
                        pt.level === 1
                          ? 'border-stone-800'
                          : 'border-stone-300 ml-4'
                      }`}
                    >
                      <div className="flex items-baseline justify-between text-xs sm:text-sm">
                        <span className="font-serif-title font-bold text-stone-900">
                          {pt.title}
                        </span>
                        {pt.scriptureRef && (
                          <span className="font-mono-code text-[11px] text-amber-900 font-semibold">
                            {pt.scriptureRef}
                          </span>
                        )}
                      </div>
                      {pt.speakerCue && (
                        <div className="text-[11px] font-mono-code font-bold text-amber-800">
                          {pt.speakerCue}
                        </div>
                      )}
                      {pt.content && (
                        <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                          {pt.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Manuscript Body */}
            <div className="manuscript-content">
              {renderFormattedManuscript(item.manuscript)}
            </div>

            {/* Exegesis Appendix */}
            {includeExegesis && item.exegesis && (item.exegesis.historicalContext || (item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0)) && (
              <section className="mt-8 pt-6 border-t-2 border-stone-200 page-break-before">
                <div className="text-[11px] uppercase font-bold tracking-wider text-stone-500 font-sans mb-3">
                  Exegesis & Original Language Notes (Appendix)
                </div>

                {item.exegesis.historicalContext && (
                  <div className="mb-4 text-xs">
                    <strong className="block text-stone-800 mb-0.5 font-sans">
                      Historical & Cultural Setting:
                    </strong>
                    <p className="text-stone-700 leading-relaxed font-reading">
                      {item.exegesis.historicalContext}
                    </p>
                  </div>
                )}

                {item.exegesis.keyTerms && item.exegesis.keyTerms.length > 0 && (
                  <div className="text-xs space-y-1.5">
                    <strong className="block text-stone-800 font-sans">Key Original Terms:</strong>
                    {item.exegesis.keyTerms.map((kt) => (
                      <div key={kt.id} className="text-stone-700">
                        <strong className="text-stone-900">{kt.original}</strong> (
                        <em>{kt.transliteration}</em> · {kt.language}): {kt.meaning}.{' '}
                        <span className="text-stone-500">{kt.notes}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Print Footer */}
            <div className="mt-12 pt-3 border-t border-stone-200 text-xs text-stone-400 flex items-center justify-between font-sans">
              <span>PHALANX Sermon Vault · {item.primaryScripture}</span>
              <span>Preached: {item.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
