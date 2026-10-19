import React, { useState } from 'react';
import {
  Users,
  Lock,
  Plus,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Upload,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserProfile, PreacherRole } from '../../types';
import {
  loadUsers,
  createUser,
  loadUserVault,
  authenticateUser,
  importFullDatabaseBackup,
  FullLocalBackup
} from '../../utils/authStorage';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => loadUsers());
  const [activeTab, setActiveTab] = useState<'profiles' | 'credentials' | 'create'>('profiles');

  // Selected profile for PIN verification
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Manual username login
  const [usernameInput, setUsernameInput] = useState('');
  const [credentialPin, setCredentialPin] = useState('');
  const [credentialError, setCredentialError] = useState<string | null>(null);

  // Create new profile state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<PreacherRole>('Guest Preacher');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [seedSample, setSeedSample] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  // Backup restore notification
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshUsers = () => {
    setUsers(loadUsers());
  };

  const handleSelectProfile = (user: UserProfile) => {
    if (user.pin) {
      setSelectedUser(user);
      setPinInput('');
      setPinError(null);
    } else {
      const result = authenticateUser(user.id);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      }
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const result = authenticateUser(selectedUser.id, pinInput);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setPinError(result.error || 'Incorrect PIN passcode. Please try again.');
      setPinInput('');
    }
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError(null);

    if (!usernameInput.trim()) {
      setCredentialError('Please enter a username or preacher name.');
      return;
    }

    const result = authenticateUser(usernameInput, credentialPin || undefined);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else if (result.error === 'PIN_REQUIRED') {
      if (result.user) {
        setSelectedUser(result.user);
        setActiveTab('profiles');
        setPinError('This profile is secured. Please enter your PIN.');
      }
    } else {
      setCredentialError(result.error || 'Invalid credentials.');
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newName.trim()) {
      setCreateError('Full name is required.');
      return;
    }

    try {
      const newUser = createUser({
        name: newName.trim(),
        username: newUsername.trim() || newName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        role: newRole,
        email: newEmail.trim() || undefined,
        pin: newPin.trim() || undefined,
        seedWithSample: seedSample,
      });

      refreshUsers();
      onLoginSuccess(newUser);
    } catch (err) {
      setCreateError((err as Error).message || 'Failed to create profile.');
    }
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.format === 'phalanx_multi_user_backup') {
          const result = importFullDatabaseBackup(parsed as FullLocalBackup);
          if (result.success) {
            setRestoreMessage({
              type: 'success',
              text: `Successfully restored ${result.userCount} preacher profiles and all associated vaults!`,
            });
            refreshUsers();
          } else {
            setRestoreMessage({ type: 'error', text: result.error || 'Failed to restore backup' });
          }
        } else {
          setRestoreMessage({
            type: 'error',
            text: 'File does not appear to be a PHALANX multi-user backup. Please choose a valid .json backup file.',
          });
        }
      } catch (err) {
        setRestoreMessage({ type: 'error', text: 'Error parsing backup JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between selection:bg-stone-300 font-sans">
      {/* Top Banner */}
      <div className="border-b border-stone-200/80 bg-stone-100/50 py-2.5 px-4 text-center text-xs text-stone-600 font-sans tracking-wide">
        <span className="font-semibold text-stone-800">PHALANX TESTING & WORKSPACE</span>
        <span className="mx-2 text-stone-400">·</span>
        <span>Isolated Multi-User Local Storage</span>
        <span className="mx-2 text-stone-400">·</span>
        <span>Static GitHub Pages & Offline Ready</span>
      </div>

      {/* Main Authentication Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl bg-white border border-stone-300/90 rounded-2xl shadow-xl overflow-hidden my-4">
          {/* Header Banner */}
          <div className="bg-[#1C1917] text-stone-100 px-6 sm:px-8 py-8 text-center border-b border-stone-800 relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-800/80 border border-stone-700 mb-3 shadow-inner">
              <BookOpen className="w-6 h-6 text-amber-200/90" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-title font-bold tracking-widest uppercase text-white">
              PHALANX
            </h1>
            <p className="text-xs text-stone-400 uppercase tracking-widest mt-1 font-sans">
              Expositio · Theologia · Homiletica
            </p>
            <p className="text-xs sm:text-sm text-stone-300 font-reading mt-3 max-w-md mx-auto leading-relaxed">
              Select your preacher profile or sign in to access your personal sermon manuscript vault, exegesis studies, and preaching notes.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-200 bg-[#FAF8F5] text-xs font-medium text-stone-600">
            <button
              onClick={() => {
                setActiveTab('profiles');
                setSelectedUser(null);
                setPinError(null);
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer border-r border-stone-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'profiles'
                  ? 'bg-white text-stone-950 font-semibold border-b-2 border-stone-900 shadow-2xs'
                  : 'hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Select Preacher Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('credentials');
                setSelectedUser(null);
                setPinError(null);
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer border-r border-stone-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-white text-stone-950 font-semibold border-b-2 border-stone-900 shadow-2xs'
                  : 'hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In with Username</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('create');
                setSelectedUser(null);
                setPinError(null);
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-white text-stone-950 font-semibold border-b-2 border-stone-900 shadow-2xs'
                  : 'hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Profile</span>
            </button>
          </div>

          {/* Notification banner */}
          {restoreMessage && (
            <div
              className={`p-3.5 text-xs flex items-center justify-between border-b ${
                restoreMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {restoreMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                )}
                <span>{restoreMessage.text}</span>
              </div>
              <button
                onClick={() => setRestoreMessage(null)}
                className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {/* TAB 1: Select Profile */}
            {activeTab === 'profiles' && !selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700">
                    Registered Preacher Profiles ({users.length})
                  </h2>
                  <span className="text-xs text-stone-500">
                    Isolated local database per account
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {users.map((u) => {
                    const vaultCount = loadUserVault(u.id).length;
                    const isAccountAdmin = u.isAdmin || u.role === 'Administrator';

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectProfile(u)}
                        className={`group flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer text-left ${
                          isAccountAdmin
                            ? 'border-red-300 bg-red-50/40 hover:bg-white hover:border-red-500 hover:shadow-md'
                            : 'border-stone-200/90 bg-[#FAF8F5] hover:bg-white hover:border-stone-400 hover:shadow-md'
                        }`}
                      >
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: u.color || (isAccountAdmin ? '#991b1b' : '#78350f') }}
                        >
                          {u.avatarInitials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-stone-950 truncate">
                              {u.name}
                            </h3>
                            {isAccountAdmin && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.2 rounded uppercase">
                                Admin
                              </span>
                            )}
                            {u.pin && (
                              <span title={`PIN Protected (Admin PIN: 0129)`}>
                                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 font-sans mt-0.5 truncate">
                            {isAccountAdmin ? 'System Administrator (PIN: 0129)' : u.role}
                          </p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200/60 text-[11px] text-stone-600 font-mono">
                            <span className="bg-stone-200/70 px-1.5 py-0.5 rounded text-stone-800">
                              @{u.username}
                            </span>
                            <span>·</span>
                            <span className="text-stone-500">
                              {vaultCount} {vaultCount === 1 ? 'sermon' : 'sermons'}
                            </span>
                          </div>
                        </div>

                        <div className="self-center">
                          <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 mt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>All sermon data is saved locally in your browser</span>
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950 font-medium cursor-pointer underline">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore Full Backup JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackupFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 1 SUB-VIEW: PIN Prompt */}
            {activeTab === 'profiles' && selectedUser && (
              <form onSubmit={handleVerifyPin} className="max-w-md mx-auto text-center space-y-5 py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white mx-auto shadow-md"
                  style={{ backgroundColor: selectedUser.color || '#78350f' }}
                >
                  {selectedUser.avatarInitials}
                </div>

                <div>
                  <h3 className="text-lg font-serif-title font-bold text-stone-900">
                    Welcome back, {selectedUser.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {selectedUser.id === 'usr-admin' || selectedUser.username === 'admin'
                      ? 'ADMIN Master Security PIN is 0129.'
                      : 'Enter personal security PIN (or Master Admin PIN 0129).'}
                  </p>
                </div>

                <div>
                  <input
                    type="password"
                    autoFocus
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Enter PIN"
                    className={`w-40 text-center text-xl tracking-widest font-mono px-3 py-2 bg-white border rounded-lg focus:outline-none ${
                      pinError
                        ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500'
                        : 'border-stone-300 focus:border-stone-800'
                    }`}
                  />
                  {pinError && (
                    <p className="text-xs text-red-600 font-medium mt-1.5">
                      {pinError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setPinInput('');
                      setPinError(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    ← Switch Profile
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 text-stone-50 text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Unlock Vault
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Sign In with Username & PIN */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleCredentialLogin} className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Username, Handle, or Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. saul or mark"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:border-stone-700"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Default accounts: <code className="text-stone-700">saul</code>, <code className="text-stone-700">mark</code>, or <code className="text-stone-700">guest</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    PIN Passcode (if configured)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={credentialPin}
                    onChange={(e) => setCredentialPin(e.target.value)}
                    placeholder="Leave blank if no PIN"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:border-stone-700 font-mono"
                  />
                </div>

                {credentialError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {credentialError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Sign In to Vault
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Create New Preacher Profile */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Preacher Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newUsername) {
                        setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    placeholder="e.g. Pastor Timothy Keller"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Username / Slug (for quick login) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="e.g. timothy"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Ministry Role *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as PreacherRole)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-600"
                    >
                      <option value="Senior Pastor">Senior Pastor</option>
                      <option value="Associate Pastor">Associate Pastor</option>
                      <option value="Teaching Elder">Teaching Elder</option>
                      <option value="Guest Preacher">Guest Preacher</option>
                      <option value="Seminary Student">Seminary Student</option>
                      <option value="Bible Teacher">Bible Teacher</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="pastor@church.org"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Security PIN (Optional, 4-6 digits)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="e.g. 1234 (optional)"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                    <input
                      type="checkbox"
                      checked={seedSample}
                      onChange={(e) => setSeedSample(e.target.checked)}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <span>
                      Pre-populate vault with sample sermons (Romans 8, Philippians 1, Isaiah 53)
                    </span>
                  </label>
                  <p className="text-[11px] text-stone-400 ml-5 mt-0.5">
                    Uncheck if you want a clean, empty library to draft your own original manuscripts.
                  </p>
                </div>

                {createError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {createError}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profiles')}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 text-stone-50 font-semibold rounded hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                  >
                    Create Account & Enter Vault
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-4 px-6 text-center text-xs text-stone-500">
        <p>
          PHALANX Sermon & Exegesis Vault · Offline & Local Storage Architecture · Suitable for GitHub Pages Hosting
        </p>
      </footer>
    </div>
  );
};
