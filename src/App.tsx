/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { VaultView } from './components/VaultView';
import { SermonStudio } from './components/Editor/SermonStudio';
import { PreachingMode } from './components/Preach/PreachingMode';
import { HandoutView } from './components/Handout/HandoutView';
import { ScriptureExplorer } from './components/Scripture/ScriptureExplorer';
import { GitSyncModal } from './components/GitSyncModal';
import { VaultItem, VaultItemType } from './types';
import { loadVault, saveVault } from './utils/vaultStorage';

export default function App() {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => loadVault());
  const [activeItemId, setActiveItemId] = useState<string>(() => {
    const initial = loadVault();
    return initial[0]?.id || '';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [selectedPassageForExplorer, setSelectedPassageForExplorer] = useState<string | undefined>(undefined);

  // Active item lookup
  const activeItem = vaultItems.find((i) => i.id === activeItemId) || vaultItems[0];

  // Auto-save on state change
  useEffect(() => {
    saveVault(vaultItems);
  }, [vaultItems]);

  // Create new sermon/study/illustration
  const handleNewItem = (type: VaultItemType = 'sermon', initialScripture?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const newItem: VaultItem = {
      id: `work-${Date.now()}`,
      slug: `new-${type}-${Date.now().toString().slice(-4)}`,
      type,
      title: type === 'sermon' ? 'Untitled Sermon Manuscript' : type === 'study' ? 'Exegetical Bible Study' : 'Thematic Illustration',
      subtitle: '',
      series: '',
      date: today,
      preacher: 'Pastor',
      primaryScripture: initialScripture || 'Romans 8:28',
      secondaryScriptures: [],
      tags: ['Grace'],
      status: 'draft',
      bigIdea: '',
      durationMinutes: 35,
      outline: [
        {
          id: `pt-1`,
          level: 1,
          title: 'I. Biblical Foundation & Textual Anchor',
          scriptureRef: initialScripture || 'Romans 8:28',
          content: 'Exposition of the historical context and original meaning.',
          speakerCue: '[PAUSE 2s - Welcome congregation]'
        }
      ],
      manuscript: `### Introduction\nOpen your Bibles to **${initialScripture || 'Romans 8:28'}**.\n\n[PAUSE 2s]\n\n### I. The Core Exposition\nHere we see the grace of God revealed...`,
      handoutItems: [
        {
          id: `h-1`,
          question: 'The supreme message of the Gospel is ________ by grace through faith.',
          answer: 'salvation',
          scripture: initialScripture || 'Romans 8:28'
        }
      ],
      discussionQuestions: [
        'How does this scripture passage speak directly into our everyday battles this week?'
      ],
      exegesis: {
        historicalContext: '',
        keyTerms: [],
        crossReferences: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setVaultItems((prev) => [newItem, ...prev]);
    setActiveItemId(newItem.id);
    setActiveTab('studio');
  };

  // Update item
  const handleUpdateItem = (updated: VaultItem) => {
    setVaultItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setVaultItems((prev) => prev.filter((item) => item.id !== id));
    if (activeItemId === id) {
      const remaining = vaultItems.filter((item) => item.id !== id);
      if (remaining.length > 0) {
        setActiveItemId(remaining[0].id);
      }
    }
  };

  // Import vault replacement
  const handleImportVault = (imported: VaultItem[]) => {
    setVaultItems(imported);
    if (imported.length > 0) {
      setActiveItemId(imported[0].id);
    }
  };

  // Select item from Vault list
  const handleSelectItem = (item: VaultItem, view: 'studio' | 'preach' | 'handout') => {
    setActiveItemId(item.id);
    setActiveTab(view);
  };

  // Open Scripture Explorer directly to a passage
  const handleOpenBibleExplorer = (passage?: string) => {
    setSelectedPassageForExplorer(passage);
    setActiveTab('scripture');
  };

  // Preach mode exit
  const handleExitPreachMode = () => {
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-stone-300">
      {/* Top Header Navigation (Except in live pulpit preach mode for full immersion) */}
      {activeTab !== 'preach' && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewSermon={() => handleNewItem('sermon')}
          hasActiveItem={Boolean(activeItem)}
          activeItemTitle={activeItem?.title}
        />
      )}

      {/* Main Content Router */}
      <div className="flex-1">
        {activeTab === 'vault' && (
          <VaultView
            items={vaultItems}
            onSelectItem={handleSelectItem}
            onNewItem={handleNewItem}
            onDeleteItem={handleDeleteItem}
            onOpenGitModal={() => setIsGitModalOpen(true)}
            onOpenBibleExplorer={handleOpenBibleExplorer}
          />
        )}

        {activeTab === 'studio' && activeItem && (
          <SermonStudio
            item={activeItem}
            onUpdateItem={handleUpdateItem}
            onLaunchPreachMode={() => setActiveTab('preach')}
            onViewHandout={() => setActiveTab('handout')}
            onOpenBibleExplorer={handleOpenBibleExplorer}
          />
        )}

        {activeTab === 'preach' && activeItem && (
          <PreachingMode
            item={activeItem}
            onExit={handleExitPreachMode}
            onViewHandout={() => setActiveTab('handout')}
          />
        )}

        {activeTab === 'handout' && activeItem && (
          <HandoutView
            item={activeItem}
            onUpdateItem={handleUpdateItem}
            onReturnToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'scripture' && (
          <ScriptureExplorer
            vaultItems={vaultItems}
            initialPassage={selectedPassageForExplorer}
            onSelectItem={(item) => {
              setActiveItemId(item.id);
              setActiveTab('studio');
            }}
            onNewSermonWithScripture={(scripture) => handleNewItem('sermon', scripture)}
          />
        )}
      </div>

      {/* GitHub Sync & Version Control Modal */}
      <GitSyncModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        vaultItems={vaultItems}
        onImportVault={handleImportVault}
      />
    </div>
  );
}
