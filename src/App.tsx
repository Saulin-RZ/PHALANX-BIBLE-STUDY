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
import { LoginScreen } from './components/Auth/LoginScreen';
import { UserSwitcherModal } from './components/Auth/UserSwitcherModal';
import { VaultItem, VaultItemType, UserProfile } from './types';
import {
  getCurrentUser,
  loadUsers,
  setCurrentUserId,
  logoutUser,
  loadGlobalChurchLibrary,
  saveItemToTargetVault,
  deleteItemFromTargetVault,
  cloneSermonToWorkbench,
  canUserEditItem,
  saveUserVault,
  exportFullDatabaseBackup
} from './utils/authStorage';
import { downloadFile } from './utils/vaultStorage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>(() => loadUsers());
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Prompt to download global backup before closing the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = 'Would you like to download a global backup before exiting?';
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Global Church Library containing all sermons from all preachers
  const [churchItems, setChurchItems] = useState<VaultItem[]>(() => {
    return loadGlobalChurchLibrary();
  });

  const [activeItemId, setActiveItemId] = useState<string>(() => {
    const all = loadGlobalChurchLibrary();
    return all[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [selectedPassageForExplorer, setSelectedPassageForExplorer] = useState<string | undefined>(undefined);

  // Active item lookup
  const activeItem = churchItems.find((i) => i.id === activeItemId) || churchItems[0];

  // Refresh church items when currentUser changes
  const refreshLibrary = () => {
    const all = loadGlobalChurchLibrary();
    setChurchItems(all);
    if (!activeItemId && all.length > 0) {
      setActiveItemId(all[0].id);
    }
  };

  // Check if current user can edit the currently active item
  const canEditActiveItem = currentUser ? canUserEditItem(currentUser, activeItem) : false;

  // Handle successful login from LoginScreen
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setUsers(loadUsers());
    const all = loadGlobalChurchLibrary();
    setChurchItems(all);
    setActiveItemId(all[0]?.id || '');
    setActiveTab('vault');
  };

  // Switch between existing profiles
  const handleSelectUser = (newUser: UserProfile) => {
    setCurrentUserId(newUser.id);
    setCurrentUser(newUser);
    const all = loadGlobalChurchLibrary();
    setChurchItems(all);
    if (!activeItemId && all.length > 0) {
      setActiveItemId(all[0].id);
    }
    setActiveTab('vault');
  };

  // Log out to Login screen
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveItemId('');
  };

  // Refresh user profiles list
  const handleRefreshUsers = () => {
    const allUsers = loadUsers();
    setUsers(allUsers);
    if (currentUser) {
      const refreshedCurrent = allUsers.find((u) => u.id === currentUser.id);
      if (refreshedCurrent) {
        setCurrentUser(refreshedCurrent);
      }
    }
    refreshLibrary();
  };

  // Create new sermon/study/illustration
  const handleNewItem = (type: VaultItemType = 'sermon', initialScripture?: string) => {
    if (!currentUser) return;

    const today = new Date().toISOString().slice(0, 10);
    const preacherName = currentUser.name || 'Pastor';

    const newItem: VaultItem = {
      id: `work-${Date.now()}`,
      slug: `new-${type}-${Date.now().toString().slice(-4)}`,
      type,
      title: type === 'sermon' ? 'Untitled Sermon Manuscript' : type === 'study' ? 'Exegetical Bible Study' : 'Thematic Illustration',
      subtitle: '',
      series: '',
      date: today,
      preacher: preacherName,
      authorId: currentUser.id,
      authorName: currentUser.name,
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

    saveItemToTargetVault(newItem, currentUser.id);
    const updatedLibrary = [newItem, ...churchItems];
    setChurchItems(updatedLibrary);
    setActiveItemId(newItem.id);
    setActiveTab('studio');
  };

  // Update item
  const handleUpdateItem = (updated: VaultItem) => {
    if (!currentUser) return;
    saveItemToTargetVault(updated, currentUser.id);
    setChurchItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // Delete item
  const handleDeleteItem = (id: string, authorId?: string) => {
    if (!currentUser) return;
    deleteItemFromTargetVault(id, authorId, currentUser.id);
    const remaining = churchItems.filter((item) => item.id !== id);
    setChurchItems(remaining);
    if (activeItemId === id) {
      setActiveItemId(remaining[0]?.id || '');
    }
  };

  // Clone/Duplicate another preacher's sermon to the current user's workbench
  const handleCloneItem = (source: VaultItem) => {
    if (!currentUser) return;
    const cloned = cloneSermonToWorkbench(source, currentUser);
    const updatedLibrary = [cloned, ...churchItems];
    setChurchItems(updatedLibrary);
    setActiveItemId(cloned.id);
    setActiveTab('studio');
  };

  // Import vault replacement
  const handleImportVault = (imported: VaultItem[]) => {
    if (!currentUser) return;
    saveUserVault(currentUser.id, imported);
    const all = loadGlobalChurchLibrary();
    setChurchItems(all);
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

  // If not logged in, show dedicated Login & Profile Selector screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
          currentUser={currentUser}
          onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        />
      )}

      {/* Main Content Router */}
      <div className="flex-1">
        {activeTab === 'vault' && (
          <VaultView
            items={churchItems}
            currentUser={currentUser}
            onSelectItem={handleSelectItem}
            onNewItem={handleNewItem}
            onDeleteItem={handleDeleteItem}
            onCloneItem={handleCloneItem}
            onOpenGitModal={() => setIsGitModalOpen(true)}
            onOpenBibleExplorer={handleOpenBibleExplorer}
            onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
          />
        )}

        {activeTab === 'studio' && activeItem && (
          <SermonStudio
            item={activeItem}
            currentUser={currentUser}
            canEdit={canEditActiveItem}
            onUpdateItem={handleUpdateItem}
            onLaunchPreachMode={() => setActiveTab('preach')}
            onViewHandout={() => setActiveTab('handout')}
            onOpenBibleExplorer={handleOpenBibleExplorer}
            onCloneToWorkbench={handleCloneItem}
          />
        )}

        {activeTab === 'studio' && !activeItem && (
          <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
            <h2 className="text-xl font-serif-title font-semibold text-stone-800">
              No Sermon Selected
            </h2>
            <p className="text-sm text-stone-500">
              Your personal library currently has no selected manuscript. Choose an existing sermon from the Global Church Library or create a new one.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('vault')}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded text-xs font-medium hover:bg-stone-100 cursor-pointer"
              >
                Go to Vault
              </button>
              <button
                onClick={() => handleNewItem('sermon')}
                className="px-4 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800 cursor-pointer"
              >
                + Create New Sermon
              </button>
            </div>
          </div>
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
            canEdit={canEditActiveItem}
            onUpdateItem={handleUpdateItem}
            onReturnToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'scripture' && (
          <ScriptureExplorer
            vaultItems={churchItems}
            initialPassage={selectedPassageForExplorer}
            onSelectItem={(item) => {
              setActiveItemId(item.id);
              setActiveTab('studio');
            }}
            onNewSermonWithScripture={(scripture) => handleNewItem('sermon', scripture)}
          />
        )}
      </div>

      {/* User Switcher & Profile Management Modal */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onRefreshUsers={handleRefreshUsers}
        onLogout={handleLogout}
      />

      {/* GitHub Sync & Version Control Modal */}
      <GitSyncModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        vaultItems={churchItems}
        onImportVault={handleImportVault}
      />
    </div>
  );
}
