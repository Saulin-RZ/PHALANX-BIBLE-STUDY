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
  loadUserVault,
  saveUserVault
} from './utils/authStorage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [users, setUsers] = useState<UserProfile[]>(() => loadUsers());
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  // Vault items for the active user
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    const user = getCurrentUser();
    return user ? loadUserVault(user.id) : [];
  });

  const [activeItemId, setActiveItemId] = useState<string>(() => {
    const user = getCurrentUser();
    if (!user) return '';
    const initial = loadUserVault(user.id);
    return initial[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [selectedPassageForExplorer, setSelectedPassageForExplorer] = useState<string | undefined>(undefined);

  // Active item lookup
  const activeItem = vaultItems.find((i) => i.id === activeItemId) || vaultItems[0];

  // Auto-save vault on state change for the current user
  useEffect(() => {
    if (currentUser) {
      saveUserVault(currentUser.id, vaultItems);
    }
  }, [vaultItems, currentUser]);

  // Handle successful login from LoginScreen
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setUsers(loadUsers());
    const items = loadUserVault(user.id);
    setVaultItems(items);
    setActiveItemId(items[0]?.id || '');
    setActiveTab('vault');
  };

  // Switch between existing profiles
  const handleSelectUser = (newUser: UserProfile) => {
    if (currentUser) {
      // Save outgoing user's data first
      saveUserVault(currentUser.id, vaultItems);
    }
    setCurrentUserId(newUser.id);
    setCurrentUser(newUser);
    const loaded = loadUserVault(newUser.id);
    setVaultItems(loaded);
    setActiveItemId(loaded[0]?.id || '');
    setActiveTab('vault');
  };

  // Log out to Login screen
  const handleLogout = () => {
    if (currentUser) {
      saveUserVault(currentUser.id, vaultItems);
    }
    logoutUser();
    setCurrentUser(null);
    setVaultItems([]);
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
  };

  // Create new sermon/study/illustration
  const handleNewItem = (type: VaultItemType = 'sermon', initialScripture?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const preacherName = currentUser?.name || 'Pastor';

    const newItem: VaultItem = {
      id: `work-${Date.now()}`,
      slug: `new-${type}-${Date.now().toString().slice(-4)}`,
      type,
      title: type === 'sermon' ? 'Untitled Sermon Manuscript' : type === 'study' ? 'Exegetical Bible Study' : 'Thematic Illustration',
      subtitle: '',
      series: '',
      date: today,
      preacher: preacherName,
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
      } else {
        setActiveItemId('');
      }
    }
  };

  // Import vault replacement
  const handleImportVault = (imported: VaultItem[]) => {
    setVaultItems(imported);
    if (imported.length > 0) {
      setActiveItemId(imported[0].id);
    }
    if (currentUser) {
      saveUserVault(currentUser.id, imported);
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
            items={vaultItems}
            currentUser={currentUser}
            onSelectItem={handleSelectItem}
            onNewItem={handleNewItem}
            onDeleteItem={handleDeleteItem}
            onOpenGitModal={() => setIsGitModalOpen(true)}
            onOpenBibleExplorer={handleOpenBibleExplorer}
            onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
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

        {activeTab === 'studio' && !activeItem && (
          <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
            <h2 className="text-xl font-serif-title font-semibold text-stone-800">
              No Sermon Selected
            </h2>
            <p className="text-sm text-stone-500">
              Your personal library currently has no selected manuscript. Choose an existing sermon from your vault or create a new one.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('vault')}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded text-xs font-medium hover:bg-stone-100"
              >
                Go to Vault
              </button>
              <button
                onClick={() => handleNewItem('sermon')}
                className="px-4 py-2 bg-stone-900 text-stone-50 rounded text-xs font-medium hover:bg-stone-800"
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
        vaultItems={vaultItems}
        onImportVault={handleImportVault}
      />
    </div>
  );
}
