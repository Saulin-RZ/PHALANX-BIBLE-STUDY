import { UserProfile, VaultItem } from '../types';
import { INITIAL_VAULT } from '../data/initialVault';

const USERS_STORAGE_KEY = 'phalanx_users_v1';
const CURRENT_USER_ID_KEY = 'phalanx_current_user_id_v1';
const LEGACY_STORAGE_KEY = 'kerygma_sermon_vault_v1';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-saul',
    username: 'saul',
    name: 'Pastor Saul R.',
    email: 'saul@church.org',
    role: 'Senior Pastor',
    avatarInitials: 'SR',
    color: '#78350f', // deep amber
    createdAt: '2026-10-01T00:00:00Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr-mark',
    username: 'mark',
    name: 'Associate Pastor Mark',
    email: 'mark@church.org',
    role: 'Associate Pastor',
    avatarInitials: 'AM',
    color: '#065f46', // emerald
    createdAt: '2026-10-05T00:00:00Z',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'usr-guest',
    username: 'guest',
    name: 'Guest Preacher',
    role: 'Guest Preacher',
    avatarInitials: 'GP',
    color: '#44403c', // stone
    createdAt: '2026-10-10T00:00:00Z',
    lastActive: new Date().toISOString(),
  },
];

export function loadUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_USERS;
  } catch (err) {
    console.error('Failed to load users from localStorage', err);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage', err);
  }
}

export function getCurrentUserId(): string | null {
  try {
    const id = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (id === 'LOGGED_OUT') return null;
    if (id) return id;
    // Default to the first user if none set yet
    const users = loadUsers();
    const defaultId = users[0]?.id || 'usr-saul';
    setCurrentUserId(defaultId);
    return defaultId;
  } catch {
    return 'usr-saul';
  }
}

export function setCurrentUserId(userId: string | null): void {
  try {
    if (!userId) {
      localStorage.setItem(CURRENT_USER_ID_KEY, 'LOGGED_OUT');
    } else {
      localStorage.setItem(CURRENT_USER_ID_KEY, userId);
    }
  } catch (err) {
    console.error('Failed to set current user ID', err);
  }
}

export function logoutUser(): void {
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, 'LOGGED_OUT');
  } catch (err) {
    console.error('Failed to log out user', err);
  }
}

export function getCurrentUser(): UserProfile | null {
  const currentId = getCurrentUserId();
  if (!currentId) return null;
  const users = loadUsers();
  const match = users.find((u) => u.id === currentId);
  return match || null;
}

export function authenticateUser(
  identifier: string,
  pin?: string
): { success: boolean; user?: UserProfile; error?: string } {
  const users = loadUsers();
  const cleanId = identifier.trim().toLowerCase();
  const user = users.find(
    (u) =>
      u.id.toLowerCase() === cleanId ||
      u.username.toLowerCase() === cleanId ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      u.name.toLowerCase() === cleanId
  );

  if (!user) {
    return { success: false, error: 'User profile not found. Please check your username or select an account.' };
  }

  if (user.pin) {
    if (!pin) {
      return { success: false, user, error: 'PIN_REQUIRED' };
    }
    if (user.pin.trim() !== pin.trim()) {
      return { success: false, user, error: 'Incorrect PIN. Please try again.' };
    }
  }

  // Update last active
  const updatedUser: UserProfile = {
    ...user,
    lastActive: new Date().toISOString(),
  };
  updateUser(user.id, updatedUser);
  setCurrentUserId(user.id);

  return { success: true, user: updatedUser };
}

export function verifyUserPin(userId: string, pin: string): boolean {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user || !user.pin) return true;
  return user.pin.trim() === pin.trim();
}

export function createUser(profileData: {
  name: string;
  username: string;
  role: UserProfile['role'];
  email?: string;
  pin?: string;
  color?: string;
  seedWithSample?: boolean;
}): UserProfile {
  const users = loadUsers();
  const initials = profileData.name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  const colors = ['#78350f', '#065f46', '#1e3a8a', '#701a75', '#831843', '#44403c', '#9a3412', '#0f766e'];
  const color = profileData.color || colors[users.length % colors.length];

  const cleanUsername = profileData.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '') ||
    `preacher-${users.length + 1}`;

  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    name: profileData.name.trim(),
    role: profileData.role,
    email: profileData.email?.trim() || undefined,
    avatarInitials: initials || 'PR',
    color,
    pin: profileData.pin?.trim() || undefined,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  // If user requested sample sermons, seed their vault with sample items
  if (profileData.seedWithSample) {
    saveUserVault(newUser.id, INITIAL_VAULT);
  } else {
    saveUserVault(newUser.id, []);
  }

  setCurrentUserId(newUser.id);
  return newUser;
}

export function updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
  const users = loadUsers();
  const updated = users.map((u) => (u.id === id ? { ...u, ...updates, lastActive: new Date().toISOString() } : u));
  saveUsers(updated);
  return updated.find((u) => u.id === id)!;
}

export function deleteUser(id: string): void {
  const users = loadUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length > 0) {
    saveUsers(filtered);
    // Remove their isolated local storage
    try {
      localStorage.removeItem(getUserVaultKey(id));
    } catch {
      // ignore
    }
    if (getCurrentUserId() === id) {
      setCurrentUserId(filtered[0].id);
    }
  }
}

// ----------------------------------------------------
// User-Isolated Vault Storage
// ----------------------------------------------------

export function getUserVaultKey(userId: string): string {
  return `phalanx_vault_${userId}`;
}

export function loadUserVault(userId: string): VaultItem[] {
  try {
    const key = getUserVaultKey(userId);
    const raw = localStorage.getItem(key);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Check if legacy data exists to migrate to primary user
    if (userId === 'usr-saul') {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyItems = JSON.parse(legacyRaw);
          if (Array.isArray(legacyItems) && legacyItems.length > 0) {
            saveUserVault(userId, legacyItems);
            return legacyItems;
          }
        } catch {
          // ignore
        }
      }
      // Seed default initial vault for Pastor Saul
      saveUserVault(userId, INITIAL_VAULT);
      return INITIAL_VAULT;
    }

    return [];
  } catch (err) {
    console.error(`Failed to load vault for user ${userId}`, err);
    return [];
  }
}

export function saveUserVault(userId: string, items: VaultItem[]): void {
  try {
    const key = getUserVaultKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`Failed to save vault for user ${userId}`, err);
  }
}

// ----------------------------------------------------
// Multi-User Full Local Database Backup & Restore
// ----------------------------------------------------

export interface FullLocalBackup {
  format: 'phalanx_multi_user_backup';
  version: 1;
  exportedAt: string;
  users: UserProfile[];
  vaults: Record<string, VaultItem[]>;
}

export function exportFullDatabaseBackup(): FullLocalBackup {
  const users = loadUsers();
  const vaults: Record<string, VaultItem[]> = {};

  users.forEach((user) => {
    vaults[user.id] = loadUserVault(user.id);
  });

  return {
    format: 'phalanx_multi_user_backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    users,
    vaults,
  };
}

export function importFullDatabaseBackup(backup: FullLocalBackup): { success: boolean; userCount: number; error?: string } {
  try {
    if (!backup || backup.format !== 'phalanx_multi_user_backup' || !Array.isArray(backup.users)) {
      return { success: false, userCount: 0, error: 'Invalid backup format. File is not a PHALANX multi-user backup.' };
    }

    saveUsers(backup.users);

    if (backup.vaults && typeof backup.vaults === 'object') {
      Object.entries(backup.vaults).forEach(([userId, items]) => {
        if (Array.isArray(items)) {
          saveUserVault(userId, items);
        }
      });
    }

    if (backup.users.length > 0) {
      setCurrentUserId(backup.users[0].id);
    }

    return { success: true, userCount: backup.users.length };
  } catch (err) {
    return { success: false, userCount: 0, error: (err as Error).message || 'Failed to restore backup' };
  }
}
