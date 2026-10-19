import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Printer,
  ChevronRight,
  BookOpen,
  Volume2
} from 'lucide-react';
import { VaultItem } from '../../types';
import { printPulpitDocument } from '../../utils/vaultStorage';
import pulpitSanctuaryImage from '../../assets/images/pulpit_sanctuary_light_1792367925563.jpg';

interface PreachingModeProps {
  item: VaultItem;
  onExit: () => void;
  onViewHandout: () => void;
}

export const PreachingMode: React.FC<PreachingModeProps> = ({ item, onExit, onViewHandout }) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl' | 'huge'>('large');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);

  // Live real-world clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preaching stopwatch
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const targetSeconds = (item.durationMinutes || 35) * 60;
  const isNearTarget = elapsedSeconds >= targetSeconds * 0.85 && elapsedSeconds < targetSeconds;
  const isOverTarget = elapsedSeconds >= targetSeconds;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    printPulpitDocument(item, {
      fontSize: fontSize === 'normal' ? '12pt' : fontSize === 'large' ? '14pt' : '16pt',
      includeOutline: true,
      includeExegesis: true,
    });
  };

  // Font size class mapping
  const fontSizeClasses = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-xl sm:text-2xl leading-relaxed',
    xl: 'text-2xl sm:text-3xl leading-loose',
    huge: 'text-3xl sm:text-4xl leading-loose',
  }[fontSize];

  // Theme styling
  const themeClasses = {
    light: 'bg-[#FAF8F5] text-stone-900 border-stone-200',
    dark: 'bg-[#141414] text-stone-100 border-stone-800',
    sepia: 'bg-[#F4ECD8] text-[#241A11] border-[#E2D5BA]',
  }[theme];

  const themeCardClasses = {
    light: 'bg-white border-stone-200 text-stone-900',
    dark: 'bg-[#1E1E1E] border-stone-800 text-stone-100',
    sepia: 'bg-[#EDE2CA] border-[#DECFA9] text-[#241A11]',
  }[theme];

  // High-contrast Big Idea styling for lectern distance readability
  const bigIdeaStyles = {
    light: {
      container: 'bg-[#FFFDF7] border-2 border-amber-600/80 shadow-xs',
      label: 'text-amber-950 font-bold',
      text: 'text-stone-950 font-bold',
    },
    dark: {
      container: 'bg-[#1E1E1E] border-2 border-amber-400/70 shadow-xs',
      label: 'text-amber-400 font-bold',
      text: 'text-stone-50 font-bold',
    },
    sepia: {
      container: 'bg-[#EADEBE] border-2 border-[#8C4A15] shadow-xs',
      label: 'text-[#612E08] font-bold',
      text: 'text-[#1C1208] font-bold',
    },
  }[theme];

  // Primary scripture ribbon theme styling
  const scriptureRibbonStyles = {
    light: 'bg-stone-100 border-stone-300 text-stone-950',
    dark: 'bg-[#1F1F1F] border-stone-700 text-stone-100',
    sepia: 'bg-[#EAE0C8] border-[#C7B592] text-[#241A11]',
  }[theme];

  // Outline box theme styling
  const outlineBoxStyles = {
    light: 'bg-white border-stone-300 text-stone-900 shadow-xs',
    dark: 'bg-[#1A1A1A] border-stone-800 text-stone-100 shadow-xs',
    sepia: 'bg-[#EDE2C9] border-[#C9B794] text-[#281D13] shadow-xs',
  }[theme];

  // Outline border color for points
  const outlineBorderClass = (level: number) => {
    if (level === 1) {
      return theme === 'dark'
        ? 'border-amber-400'
        : theme === 'sepia'
        ? 'border-[#8C4A15]'
        : 'border-amber-800';
    }
    return theme === 'dark'
      ? 'border-stone-700'
      : theme === 'sepia'
      ? 'border-[#C9B794]'
      : 'border-stone-300';
  };

  // Helper to render manuscript with highlighted speaker cues
  const renderFormattedManuscript = (text: string) => {
    if (!text) return null;

    // Split text by lines
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();

      // Detect Speaker Cues like [PAUSE 3s]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return (
          <div
            key={idx}
            className={`my-4 py-2 px-4 rounded border text-xs font-mono-code font-bold uppercase tracking-wider inline-block ${
              theme === 'dark'
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-2xs'
                : theme === 'sepia'
                ? 'bg-[#E2CFAB] border-[#9E5316] text-[#4A2002] font-bold shadow-2xs'
                : 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs'
            }`}
          >
            {trimmed.slice(1, -1)}
          </div>
        );
      }

      // Detect markdown quotes
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.replace(/^>\s*/, '');
        return (
          <blockquote
            key={idx}
            className={`my-6 pl-4 border-l-3 italic font-reading ${
              theme === 'dark'
                ? 'border-amber-400 text-stone-100 bg-[#1C1C1C] p-3 rounded-r'
                : theme === 'sepia'
                ? 'border-[#8C4A15] text-[#241A11] bg-[#ECE0C6] p-3 rounded-r font-medium'
                : 'border-amber-800 text-stone-900 bg-amber-50/70 p-3 rounded-r'
            }`}
          >
            {quoteContent}
          </blockquote>
        );
      }

      // Detect markdown headers
      if (trimmed.startsWith('#')) {
        const headerLevel = trimmed.match(/^#+/)?.[0].length || 1;
        const headerText = trimmed.replace(/^#+\s*/, '');
        return (
          <h3
            key={idx}
            className={`font-serif-title font-bold mt-8 mb-3 ${
              headerLevel === 1 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
            } ${theme === 'dark' ? 'text-stone-50' : theme === 'sepia' ? 'text-[#1F150C]' : 'text-stone-950'}`}
          >
            {headerText}
          </h3>
        );
      }

      return (
        <p
          key={idx}
          className={`mb-6 font-reading leading-relaxed ${
            theme === 'dark' ? 'text-stone-100' : theme === 'sepia' ? 'text-[#241A11]' : 'text-stone-900'
          }`}
        >
          {para}
        </p>
      );
    });
  };

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
      {/* Pulpit Top Lectern Bar (Sticky, no-print) */}
      <header
        className={`no-print sticky top-0 z-50 border-b px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
          theme === 'dark' ? 'bg-[#141414]/90 border-stone-800' : 'bg-[#FAF8F5]/90 border-stone-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Studio</span>
          </button>
          <span className="hidden sm:inline text-stone-300">·</span>
          <span className="font-serif-title font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs">
            {item.title}
          </span>
        </div>

        {/* Center: Live Lectern Timer & Clock */}
        <div className="flex items-center gap-4 bg-stone-200/50 dark:bg-stone-800/60 px-4 py-1.5 rounded-md border border-stone-300/40 dark:border-stone-700/60">
          {/* Current Real Time */}
          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono-code tabular-nums hidden sm:block">
            {currentTime}
          </div>

          <span className="text-stone-300 dark:text-stone-700 hidden sm:inline">|</span>

          {/* Stopwatch */}
          <div className="flex items-center gap-2">
            <span
              className={`font-mono-code text-base font-bold tabular-nums ${
                isOverTarget
                  ? 'text-red-600 dark:text-red-400'
                  : isNearTarget
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-900 dark:text-stone-100'
              }`}
            >
              {formatTimer(elapsedSeconds)}
            </span>
            <span className="text-[11px] text-stone-400 tabular-nums">
              / {item.durationMinutes || 35}m
            </span>

            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-1 text-stone-700 dark:text-stone-200 hover:text-stone-950 transition-colors ml-1 cursor-pointer"
              title={timerRunning ? 'Pause timer' : 'Start timer'}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                setTimerRunning(false);
                setElapsedSeconds(0);
              }}
              className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Controls (Font size, Theme, Print) */}
        <div className="flex items-center gap-3">
          {/* Font Size Selector */}
          <div className="inline-flex items-center p-0.5 bg-stone-200/60 dark:bg-stone-800/80 rounded text-xs">
            {(['normal', 'large', 'xl', 'huge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold cursor-pointer ${
                  fontSize === size
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500'
                }`}
              >
                {size === 'normal' ? 'A' : size === 'large' ? 'A+' : size === 'xl' ? '2A' : '3A'}
              </button>
            ))}
          </div>

          {/* Theme Selector */}
          <div className="inline-flex items-center p-0.5 bg-stone-200/60 dark:bg-stone-800/80 rounded text-xs">
            <button
              onClick={() => setTheme('light')}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                theme === 'light' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-500'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                theme === 'dark' ? 'bg-stone-900 text-stone-100 shadow-2xs font-semibold' : 'text-stone-500'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                theme === 'sepia' ? 'bg-[#EDE2CA] text-[#3D332A] shadow-2xs font-semibold' : 'text-stone-500'
              }`}
            >
              Sepia
            </button>
          </div>

          <button
            onClick={handlePrint}
            title="Print or Save as PDF"
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-950 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Preaching Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10">
        {/* Printable/Podium Header */}
        <div className={`mb-10 pb-6 border-b ${theme === 'dark' ? 'border-stone-800' : theme === 'sepia' ? 'border-[#D4C3A3]' : 'border-stone-300'}`}>
          <div className={`text-xs uppercase tracking-widest mb-2 font-sans font-semibold ${theme === 'dark' ? 'text-stone-400' : theme === 'sepia' ? 'text-[#7A4B1A]' : 'text-stone-600'}`}>
            {item.series ? `${item.series} · ` : ''}
            {item.date} · {item.preacher}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-title font-bold leading-tight">
            {item.title}
          </h1>
          {item.subtitle && (
            <p className={`text-base sm:text-lg mt-2 font-reading italic ${theme === 'dark' ? 'text-stone-400' : theme === 'sepia' ? 'text-[#5C3F24]' : 'text-stone-600'}`}>
              {item.subtitle}
            </p>
          )}

          {/* Primary Scripture Ribbon */}
          <div className={`mt-4 p-3.5 rounded-lg border flex items-center justify-between ${scriptureRibbonStyles}`}>
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${theme === 'dark' ? 'text-amber-400' : theme === 'sepia' ? 'text-[#8C4A15]' : 'text-amber-800'}`} />
              <span className="font-semibold text-sm sm:text-base">
                Primary Text: {item.primaryScripture}
              </span>
            </div>
            {item.secondaryScriptures.length > 0 && (
              <span className={`text-xs font-mono-code hidden sm:inline ${theme === 'dark' ? 'text-stone-400' : theme === 'sepia' ? 'text-[#7A4B1A]' : 'text-stone-600'}`}>
                Refs: {item.secondaryScriptures.join(', ')}
              </span>
            )}
          </div>

          {/* Big Idea Banner (Ultra-readable in all modes) */}
          {item.bigIdea && (
            <div className={`mt-5 p-5 sm:p-6 rounded-lg transition-all ${bigIdeaStyles.container}`}>
              <span className={`block text-xs uppercase tracking-wider mb-2 font-sans ${bigIdeaStyles.label}`}>
                Central Truth / Big Idea:
              </span>
              <p className={`font-serif-title text-xl sm:text-2xl lg:text-3xl leading-relaxed italic ${bigIdeaStyles.text}`}>
                "{item.bigIdea}"
              </p>
            </div>
          )}
        </div>

        {/* Outline Navigator Strip (For quick lectern orientation) */}
        {item.outline && item.outline.length > 0 && (
          <div className={`mb-10 p-5 rounded-lg border ${outlineBoxStyles}`}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-stone-400' : theme === 'sepia' ? 'text-[#7A4B1A]' : 'text-stone-600'}`}>
              Homiletical Movements & Outline
            </h2>
            <div className="space-y-3">
              {item.outline.map((pt, idx) => (
                <div
                  key={pt.id}
                  className={`pl-3 border-l-3 transition-colors ${outlineBorderClass(pt.level)} ${pt.level > 1 ? 'ml-4' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`font-serif-title font-bold ${
                        pt.level === 1 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                      }`}
                    >
                      {pt.title}
                    </span>
                    {pt.scriptureRef && (
                      <span className={`text-xs font-mono-code font-semibold ${theme === 'dark' ? 'text-amber-400' : theme === 'sepia' ? 'text-[#8C4A15]' : 'text-amber-900'}`}>
                        {pt.scriptureRef}
                      </span>
                    )}
                  </div>
                  {pt.speakerCue && (
                    <div className={`mt-1 text-xs font-mono-code font-bold ${theme === 'dark' ? 'text-amber-300' : theme === 'sepia' ? 'text-[#964205]' : 'text-amber-800'}`}>
                      {pt.speakerCue}
                    </div>
                  )}
                  {pt.content && (
                    <p className={`mt-1 text-xs sm:text-sm leading-relaxed font-reading ${theme === 'dark' ? 'text-stone-300' : theme === 'sepia' ? 'text-[#3B2B1E]' : 'text-stone-700'}`}>
                      {pt.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pulpit Manuscript Body */}
        <div className={`prose max-w-none ${fontSizeClasses}`}>
          {item.manuscript ? (
            renderFormattedManuscript(item.manuscript)
          ) : (
            <p className="text-stone-400 italic">No manuscript drafted yet.</p>
          )}
        </div>

        {/* Printable Footer */}
        <div className="mt-16 pt-8 border-t border-stone-300 dark:border-stone-800 text-xs text-stone-400 flex items-center justify-between font-sans">
          <span>PHALANX Sermon Studio · {item.primaryScripture}</span>
          <span>Date: {item.date}</span>
        </div>
      </main>
    </div>
  );
};
