import React from 'react';
import { BookOpen, Mic, FileText, Library, Compass } from 'lucide-react';

export type ActiveTab = 'vault' | 'studio' | 'preach' | 'handout' | 'scripture' | 'canonical';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewSermon: () => void;
  hasActiveItem: boolean;
  activeItemTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewSermon,
  hasActiveItem,
  activeItemTitle,
}) => {
  return (
    <header className="no-print bg-[#FAF8F5] border-b border-stone-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('vault')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="text-xl sm:text-2xl font-serif-title font-semibold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
                Kerygma
              </div>
            </button>
            {activeItemTitle && activeTab !== 'vault' && (
              <span className="hidden lg:inline text-xs text-stone-500 font-sans max-w-xs truncate border-l border-stone-300 pl-3">
                {activeItemTitle}
              </span>
            )}
          </div>

          {/* Zone 2: 4-5 Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 cursor-pointer ${
                activeTab === 'vault' ? 'text-stone-950 font-semibold border-b-2 border-stone-900' : ''
              }`}
            >
              <Library className="w-4 h-4 text-stone-500" />
              <span>Vault</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 cursor-pointer ${
                activeTab === 'studio' ? 'text-stone-950 font-semibold border-b-2 border-stone-900' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 text-stone-500" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('preach')}
              className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 cursor-pointer ${
                activeTab === 'preach' ? 'text-stone-950 font-semibold border-b-2 border-stone-900' : ''
              }`}
            >
              <Mic className="w-4 h-4 text-stone-500" />
              <span>Preach Mode</span>
            </button>

            <button
              onClick={() => setActiveTab('handout')}
              className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 cursor-pointer ${
                activeTab === 'handout' ? 'text-stone-950 font-semibold border-b-2 border-stone-900' : ''
              }`}
            >
              <FileText className="w-4 h-4 text-stone-500" />
              <span>Handout & PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('scripture')}
              className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-stone-900 cursor-pointer ${
                activeTab === 'scripture' || activeTab === 'canonical' ? 'text-stone-950 font-semibold border-b-2 border-stone-900' : ''
              }`}
            >
              <Compass className="w-4 h-4 text-stone-500" />
              <span>Bible & Canon</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewSermon}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-50 bg-stone-900 rounded-md hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              + New Sermon
            </button>
          </div>
        </div>

        {/* Mobile secondary nav row */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-4 border-t border-stone-200/60 text-xs font-medium text-stone-600">
          <button
            onClick={() => setActiveTab('vault')}
            className={`whitespace-nowrap px-2 py-1 ${activeTab === 'vault' ? 'text-stone-950 font-semibold' : ''}`}
          >
            Vault
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`whitespace-nowrap px-2 py-1 ${activeTab === 'studio' ? 'text-stone-950 font-semibold' : ''}`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('preach')}
            className={`whitespace-nowrap px-2 py-1 ${activeTab === 'preach' ? 'text-stone-950 font-semibold' : ''}`}
          >
            Preach
          </button>
          <button
            onClick={() => setActiveTab('handout')}
            className={`whitespace-nowrap px-2 py-1 ${activeTab === 'handout' ? 'text-stone-950 font-semibold' : ''}`}
          >
            Handouts
          </button>
          <button
            onClick={() => setActiveTab('scripture')}
            className={`whitespace-nowrap px-2 py-1 ${activeTab === 'scripture' ? 'text-stone-950 font-semibold' : ''}`}
          >
            Bible
          </button>
        </div>
      </div>
    </header>
  );
};
