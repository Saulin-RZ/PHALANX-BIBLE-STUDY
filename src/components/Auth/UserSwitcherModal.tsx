import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Lock,
  Check,
  Shield,
  Trash2,
  Edit2,
  BookOpen,
  ArrowRight,
  LogOut,
  Download,
  Upload,
  AlertTriangle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, PreacherRole } from '../../types';
import {
  createUser,
  updateUser,
  deleteUser,
  loadUserVault,
  exportFullDatabaseBackup,
  importFullDatabaseBackup,
  FullLocalBackup
} from '../../utils/authStorage';
import { downloadFile } from '../../utils/vaultStorage';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onRefreshUsers: () => void;
  onLogout: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onRefreshUsers,
  onLogout,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'pin-prompt' | 'edit'>('list');
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // In-modal confirmation for deleting user
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<PreacherRole>('Guest Preacher');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [seedWithSample, setSeedWithSample] = useState(true);

  // Edit current profile state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<PreacherRole>('Senior Pastor');
  const [editEmail, setEditEmail] = useState('');
  const [editPin, setEditPin] = useState('');

  if (!isOpen) return null;

  const handleSwitchClick = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      onClose();
      return;
    }

    if (user.pin) {
      setPendingUser(user);
      setPinInput('');
      setPinError(false);
      setMode('pin-prompt');
    } else {
      onSelectUser(user);
      onClose();
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    if (pendingUser.pin === pinInput.trim()) {
      onSelectUser(pendingUser);
      setMode('list');
      setPendingUser(null);
      onClose();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = createUser({
      name: newName,
      username: newUsername || newName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      role: newRole,
      email: newEmail || undefined,
      pin: newPin || undefined,
      seedWithSample,
    });

    onRefreshUsers();
    onSelectUser(created);
    setMode('list');
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPin('');
    onClose();
  };

  const startEditProfile = () => {
    setEditName(currentUser.name);
    setEditRole(currentUser.role);
    setEditEmail(currentUser.email || '');
    setEditPin(currentUser.pin || '');
    setMode('edit');
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updated = updateUser(currentUser.id, {
      name: editName.trim(),
      role: editRole,
      email: editEmail.trim() || undefined,
      pin: editPin.trim() || undefined,
    });

    onRefreshUsers();
    onSelectUser(updated);
    setMode('list');
  };

  const confirmDeleteUser = (user: UserProfile) => {
    if (users.length <= 1) {
      setDeleteWarning('You cannot delete the only existing user profile. At least one profile is required.');
      return;
    }
    setUserToDelete(user);
    setDeleteWarning(null);
  };

  const executeDeleteUser = () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id;
    deleteUser(targetId);
    onRefreshUsers();
    setUserToDelete(null);

    if (currentUser.id === targetId) {
      const remaining = users.filter((u) => u.id !== targetId);
      if (remaining.length > 0) {
        onSelectUser(remaining[0]);
      } else {
        onLogout();
      }
    }
  };

  const handleExportFullBackup = () => {
    const backup = exportFullDatabaseBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(jsonStr, `phalanx-multi-user-backup-${dateStr}.json`, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-stone-800" />
            <div>
              <h3 className="text-base sm:text-lg font-serif-title font-bold text-stone-900">
                {mode === 'list'
                  ? 'Preacher Accounts & Local Profiles'
                  : mode === 'create'
                  ? 'Add New Preacher Profile'
                  : mode === 'edit'
                  ? 'Edit Preacher Profile'
                  : 'Profile PIN Verification'}
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                {mode === 'list'
                  ? 'Isolated local sermon vaults for each pastor, student, or guest.'
                  : mode === 'create'
                  ? 'Create an isolated workspace for notes, exegesis, and pulpit preaching.'
                  : mode === 'edit'
                  ? 'Update your name, ministry role, or security PIN.'
                  : `Enter PIN to access ${pendingUser?.name}'s private vault.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Delete Warning Banner */}
          {deleteWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
              <span>{deleteWarning}</span>
              <button
                onClick={() => setDeleteWarning(null)}
                className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {userToDelete && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">
                    Delete Profile "{userToDelete.name}"?
                  </h4>
                  <p className="text-red-700 mt-1">
                    This will permanently remove their profile and all sermons stored in their isolated local database. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDeleteUser}
                  className="px-3 py-1.5 bg-red-600 text-white rounded font-medium hover:bg-red-700 cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* MODE 1: Account List */}
          {mode === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {users.map((user) => {
                  const isActive = user.id === currentUser.id;
                  const vaultCount = loadUserVault(user.id).length;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSwitchClick(user)}
                      className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white border-stone-900 shadow-xs ring-1 ring-stone-900/10'
                          : 'bg-[#FCFBF9] border-stone-200 hover:border-stone-400 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: user.color || '#78350f' }}
                        >
                          {user.avatarInitials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-stone-900 truncate">
                              {user.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold text-stone-700 bg-stone-100 border border-stone-300 px-1.5 py-0.2 rounded">
                                Active
                              </span>
                            )}
                            {user.pin && (
                              <span title="PIN Protected Profile">
                                <Lock className="w-3 h-3 text-amber-700" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-sans flex items-center gap-1.5 truncate">
                            <span>{user.role}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {vaultCount} {vaultCount === 1 ? 'sermon' : 'sermons'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditProfile();
                              }}
                              title="Edit profile settings"
                              className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                              <Check className="w-4 h-4 text-emerald-700" />
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                          >
                            Switch
                          </button>
                        )}

                        {users.length > 1 && !isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteUser(user);
                            }}
                            title="Delete profile"
                            className="p-1 text-stone-300 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFullBackup}
                    title="Export complete database with all accounts and vaults to a JSON backup"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-600" />
                    <span>Backup All</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 rounded hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Create User */}
          {mode === 'create' && (
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
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
                  placeholder="e.g. Pastor David Vance"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Username / Slug
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. david"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Role in Ministry *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as PreacherRole)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
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
                    placeholder="david@church.org"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    4-Digit Security PIN (Optional)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500 font-mono"
                  />
                </div>
              </div>

              {/* Seed Sample Option */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                  <input
                    type="checkbox"
                    checked={seedWithSample}
                    onChange={(e) => setSeedWithSample(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-0"
                  />
                  <span>
                    Pre-populate with sample sermons (Romans 8, Philippians 1, Isaiah 53)
                  </span>
                </label>
                <p className="text-[11px] text-stone-400 ml-5 mt-0.5">
                  Uncheck to start with a completely empty personal vault.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Back to Profiles
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                >
                  Create & Switch
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Edit Profile */}
          {mode === 'edit' && (
            <form onSubmit={handleSaveProfileEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Role in Ministry *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as PreacherRole)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
                  >
                    <option value="Senior Pastor">Senior Pastor</option>
                    <option value="Associate Pastor">Associate Pastor</option>
                    <option value="Teaching Elder">Teaching Elder</option>
                    <option value="Guest Preacher">Guest Preacher</option>
                    <option value="Seminary Student">Seminary Student</option>
                    <option value="Bible Teacher">Bible Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="pastor@church.org"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Security PIN Passcode (4-6 digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="Leave empty for no PIN"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-xs focus:outline-none focus:border-stone-500 font-mono"
                />
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Protects this workspace from accidental switching by other users on this computer.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: PIN Verification */}
          {mode === 'pin-prompt' && pendingUser && (
            <form onSubmit={handleVerifyPin} className="space-y-4 py-2 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white font-bold text-sm shadow-xs"
                style={{ backgroundColor: pendingUser.color || '#78350f' }}
              >
                {pendingUser.avatarInitials}
              </div>

              <div>
                <h4 className="text-base font-serif-title font-bold text-stone-900">
                  Enter PIN for {pendingUser.name}
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  This profile is secured with a personal passcode.
                </p>
              </div>

              <div className="max-w-[180px] mx-auto">
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN"
                  className={`w-full text-center text-lg tracking-widest font-mono px-3 py-2 bg-white border rounded focus:outline-none ${
                    pinError ? 'border-red-500 bg-red-50' : 'border-stone-300 focus:border-stone-600'
                  }`}
                />
                {pinError && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    Incorrect PIN. Try again.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setPendingUser(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                >
                  Unlock Vault
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
