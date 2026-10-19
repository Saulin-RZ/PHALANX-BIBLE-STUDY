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
  ShieldCheck,
  Crown
} from 'lucide-react';
import { UserProfile, PreacherRole } from '../../types';
import {
  createUser,
  updateUser,
  deleteUser,
  loadUserVault,
  exportFullDatabaseBackup,
  ADMIN_SECURITY_PIN,
  isUserAdmin
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

  // Profile currently being edited (can be any user if admin, or currentUser)
  const [profileToEdit, setProfileToEdit] = useState<UserProfile | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<PreacherRole>('Guest Preacher');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [seedWithSample, setSeedWithSample] = useState(true);

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<PreacherRole>('Senior Pastor');
  const [editEmail, setEditEmail] = useState('');
  const [editPin, setEditPin] = useState('');

  if (!isOpen) return null;

  const userIsAdmin = isUserAdmin(currentUser);

  const handleSwitchClick = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      onClose();
      return;
    }

    // ADMIN user can access ANY account without needing its PIN!
    if (userIsAdmin) {
      onSelectUser(user);
      onClose();
      return;
    }

    // Regular users: if target has PIN, prompt for it (or master admin PIN 0129)
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

    const trimmed = pinInput.trim();
    // Verify against user's PIN OR Master Admin PIN 0129
    if (pendingUser.pin === trimmed || trimmed === ADMIN_SECURITY_PIN) {
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

  const startEditProfile = (targetUser: UserProfile) => {
    setProfileToEdit(targetUser);
    setEditName(targetUser.name);
    setEditRole(targetUser.role);
    setEditEmail(targetUser.email || '');
    setEditPin(targetUser.pin || '');
    setMode('edit');
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileToEdit || !editName.trim()) return;

    const updated = updateUser(profileToEdit.id, {
      name: editName.trim(),
      role: editRole,
      email: editEmail.trim() || undefined,
      pin: editPin.trim() || undefined,
    });

    onRefreshUsers();
    if (profileToEdit.id === currentUser.id) {
      onSelectUser(updated);
    }
    setProfileToEdit(null);
    setMode('list');
  };

  const confirmDeleteUser = (user: UserProfile) => {
    if (user.id === 'usr-admin' || user.username.toLowerCase() === 'admin') {
      setDeleteWarning('The Master ADMIN account cannot be deleted.');
      return;
    }
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
    const success = deleteUser(targetId);
    if (!success) {
      setDeleteWarning('Could not delete this user profile.');
      setUserToDelete(null);
      return;
    }

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
    downloadFile(jsonStr, `phalanx-multi-user-backup-${new Date().toISOString().slice(0, 10)}.json`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-stone-900 text-stone-100 shadow-2xs">
              {userIsAdmin ? <Crown className="w-4 h-4 text-amber-300" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-serif-title font-semibold text-stone-900 text-base leading-tight">
                {mode === 'list'
                  ? userIsAdmin
                    ? 'Admin Account Manager & Switcher'
                    : 'Preacher Profile Switcher'
                  : mode === 'create'
                  ? 'Register New Preacher Profile'
                  : mode === 'edit'
                  ? `Edit Profile (${profileToEdit?.name})`
                  : 'Profile PIN Verification'}
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                {mode === 'list'
                  ? userIsAdmin
                    ? 'Full master access: switch to any account, edit, delete, or create profiles.'
                    : 'Isolated local sermon vaults for each pastor, student, or guest.'
                  : mode === 'create'
                  ? 'Create an isolated workspace for notes, exegesis, and pulpit preaching.'
                  : mode === 'edit'
                  ? 'Update display name, ministry role, email, or security PIN.'
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
          {/* Admin Mode Ribbon */}
          {userIsAdmin && mode === 'list' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs flex items-start gap-2 text-red-900">
              <Shield className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">ADMIN Master Privileges Active (PIN: 0129):</span>
                <span className="text-red-800 ml-1">
                  You can access any account instantly without a PIN, delete or edit any profile, and edit any sermon in the global library.
                </span>
              </div>
            </div>
          )}

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
                    This will permanently remove this account and all sermons stored in their isolated local database. This action cannot be undone.
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
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {users.map((user) => {
                  const isActive = user.id === currentUser.id;
                  const vaultCount = loadUserVault(user.id).length;
                  const isAccountAdmin = user.isAdmin || user.role === 'Administrator';

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
                            {isAccountAdmin && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded uppercase">
                                Admin
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-bold text-stone-700 bg-stone-100 border border-stone-300 px-1.5 py-0.2 rounded">
                                Active
                              </span>
                            )}
                            {user.pin && (
                              <span title={`PIN Protected Profile (PIN: ${userIsAdmin ? user.pin : '••••'})`}>
                                <Lock className="w-3 h-3 text-amber-700" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-sans flex items-center gap-1.5 truncate">
                            <span>{user.role}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-stone-400">@{user.username}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {vaultCount} {vaultCount === 1 ? 'sermon' : 'sermons'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Edit button: Available for active user OR if current user is ADMIN */}
                        {(isActive || userIsAdmin) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditProfile(user);
                            }}
                            title={`Edit ${user.name}'s profile`}
                            className="p-1.5 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer rounded hover:bg-stone-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isActive ? (
                          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1 px-2 py-1 bg-stone-100 rounded">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="hidden sm:inline">Current</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchClick(user);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                          >
                            {userIsAdmin ? 'Access' : 'Switch'}
                          </button>
                        )}

                        {/* Delete button: ADMIN can delete anyone except usr-admin; non-admin can only delete self if others exist */}
                        {(userIsAdmin ? user.id !== 'usr-admin' : users.length > 1 && isActive) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteUser(user);
                            }}
                            title={`Delete profile "${user.name}"`}
                            className="p-1.5 text-stone-300 hover:text-red-600 transition-colors cursor-pointer rounded hover:bg-red-50"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-900 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
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
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pastor David Cohen"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Username Handle
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. david"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Ministry Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as PreacherRole)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 bg-white focus:outline-none focus:border-stone-600"
                  >
                    {userIsAdmin && <option value="Administrator">Administrator</option>}
                    <option value="Senior Pastor">Senior Pastor</option>
                    <option value="Associate Pastor">Associate Pastor</option>
                    <option value="Guest Preacher">Guest Preacher</option>
                    <option value="Teaching Elder">Teaching Elder</option>
                    <option value="Seminary Student">Seminary Student</option>
                    <option value="Bible Teacher">Bible Teacher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="pastor@church.org"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Security PIN (Optional)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="4–6 digits (or blank)"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600 font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sampleSermonsCheckbox"
                  checked={seedWithSample}
                  onChange={(e) => setSeedWithSample(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sampleSermonsCheckbox" className="text-xs text-stone-600 cursor-pointer">
                  Seed vault with initial sample sermons & illustrations
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-medium rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  Create & Access Account
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Edit Profile */}
          {mode === 'edit' && profileToEdit && (
            <form onSubmit={handleSaveProfileEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Ministry Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as PreacherRole)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 bg-white focus:outline-none focus:border-stone-600"
                  >
                    {(userIsAdmin || profileToEdit.isAdmin) && <option value="Administrator">Administrator</option>}
                    <option value="Senior Pastor">Senior Pastor</option>
                    <option value="Associate Pastor">Associate Pastor</option>
                    <option value="Guest Preacher">Guest Preacher</option>
                    <option value="Teaching Elder">Teaching Elder</option>
                    <option value="Seminary Student">Seminary Student</option>
                    <option value="Bible Teacher">Bible Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="pastor@church.org"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Change Security PIN (leave blank to remove PIN)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  placeholder="4–6 digits (or blank to disable)"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:border-stone-600 font-mono tracking-widest"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {profileToEdit.id === 'usr-admin'
                    ? 'Master ADMIN security PIN is set to 0129.'
                    : 'PIN protects profile access when switching on this browser.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setProfileToEdit(null);
                    setMode('list');
                  }}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-medium rounded hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: PIN Prompt */}
          {mode === 'pin-prompt' && pendingUser && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-stone-900 text-sm">
                  Enter PIN for {pendingUser.name}
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  This profile is protected with a security passcode.
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
                    setPinError(false);
                  }}
                  placeholder="••••"
                  className={`w-full py-2.5 text-center text-xl tracking-[0.4em] font-mono border rounded ${
                    pinError
                      ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-400'
                      : 'border-stone-300 focus:border-stone-600'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-600 text-center mt-1.5">
                    Incorrect PIN. Try again or enter the Master Admin PIN (0129).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setPendingUser(null);
                  }}
                  className="text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  ← Back to profiles
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-stone-50 text-xs font-semibold rounded hover:bg-stone-800 cursor-pointer"
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
