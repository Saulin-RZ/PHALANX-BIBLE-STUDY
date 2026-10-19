import { UserProfile, VaultItem } from '../types';
import { INITIAL_VAULT } from '../data/initialVault';

const USERS_STORAGE_KEY = 'phalanx_users_v1';
const CURRENT_USER_ID_KEY = 'phalanx_current_user_id_v1';
const LEGACY_STORAGE_KEY = 'kerygma_sermon_vault_v1';

export const ADMIN_SECURITY_PIN = '0129';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'ADMIN',
    email: 'admin@phalanx.church',
    role: 'Administrator',
    avatarInitials: 'AD',
    color: '#991b1b', // imperial crimson
    pin: ADMIN_SECURITY_PIN,
    isAdmin: true,
    createdAt: '2026-10-01T00:00:00Z',
    lastActive: new Date().toISOString(),
  },
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

/**
 * Ensures the ADMIN user exists with PIN 0129 and Administrator role.
 */
function ensureAdminExists(users: UserProfile[]): UserProfile[] {
  const adminIndex = users.findIndex(
    (u) => u.id === 'usr-admin' || u.username.toLowerCase() === 'admin' || u.name.toUpperCase() === 'ADMIN'
  );

  const adminProfile: UserProfile = {
    id: 'usr-admin',
    username: 'admin',
    name: 'ADMIN',
    email: 'admin@phalanx.church',
    role: 'Administrator',
    avatarInitials: 'AD',
    color: '#991b1b',
    pin: ADMIN_SECURITY_PIN,
    isAdmin: true,
    createdAt: '2026-10-01T00:00:00Z',
    lastActive: new Date().toISOString(),
  };

  if (adminIndex === -1) {
    return [adminProfile, ...users];
  } else {
    // Ensure credentials and admin flag match specification
    const updated = [...users];
    updated[adminIndex] = {
      ...updated[adminIndex],
      name: 'ADMIN',
      username: 'admin',
      pin: ADMIN_SECURITY_PIN,
      role: 'Administrator',
      isAdmin: true,
    };
    return updated;
  }
}

export function loadUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const securedUsers = ensureAdminExists(parsed);
      // Persist if admin was injected
      if (securedUsers.length !== parsed.length || !parsed.some((u) => u.isAdmin)) {
        saveUsers(securedUsers);
      }
      return securedUsers;
    }
    saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  } catch (err) {
    console.error('Failed to load users from localStorage', err);
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: UserProfile[]): void {
  try {
    const secured = ensureAdminExists(users);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(secured));
  } catch (err) {
    console.error('Failed to save users to localStorage', err);
  }
}

export function getCurrentUserId(): string | null {
  try {
    const id = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (id === 'LOGGED_OUT') return null;
    if (id) return id;
    const users = loadUsers();
    const defaultId = users[0]?.id || 'usr-admin';
    setCurrentUserId(defaultId);
    return defaultId;
  } catch {
    return 'usr-admin';
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

  // Master Admin Override: The PIN 0129 can access any account
  const isMasterPin = pin?.trim() === ADMIN_SECURITY_PIN;

  if (user.pin) {
    if (!pin) {
      return { success: false, user, error: 'PIN_REQUIRED' };
    }
    if (!isMasterPin && user.pin.trim() !== pin.trim()) {
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
  if (pin.trim() === ADMIN_SECURITY_PIN) return true; // Master Admin override
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

  const cleanUsername =
    profileData.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '') ||
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
    isAdmin: profileData.role === 'Administrator' || cleanUsername === 'admin',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  // If user requested sample sermons, seed their vault with sample items tagged with their ID
  if (profileData.seedWithSample) {
    const seeded = INITIAL_VAULT.map((item) => ({
      ...item,
      id: `work-${Date.now()}-${item.slug}`,
      authorId: newUser.id,
      authorName: newUser.name,
      preacher: newUser.name,
    }));
    saveUserVault(newUser.id, seeded);
  } else {
    saveUserVault(newUser.id, []);
  }

  return newUser;
}

export function updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
  const users = loadUsers();
  const updated = users.map((u) => {
    if (u.id === id) {
      // Prevent removing admin status from the primary ADMIN
      const isAdminUser = u.id === 'usr-admin' || u.username.toLowerCase() === 'admin';
      return {
        ...u,
        ...updates,
        isAdmin: isAdminUser ? true : updates.isAdmin ?? u.isAdmin,
        lastActive: new Date().toISOString(),
      };
    }
    return u;
  });
  saveUsers(updated);
  return updated.find((u) => u.id === id)!;
}

export function deleteUser(id: string): boolean {
  // Protect ADMIN account from deletion
  if (id === 'usr-admin') {
    console.warn('Cannot delete Master ADMIN account');
    return false;
  }

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
    return true;
  }
  return false;
}

// ----------------------------------------------------
// Permission System: Role-Based & Author-Based Access
// ----------------------------------------------------

export function isUserAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return Boolean(user.isAdmin || user.role === 'Administrator' || user.username.toLowerCase() === 'admin');
}

export function canUserEditItem(user: UserProfile | null, item: VaultItem): boolean {
  if (!user) return false;
  // ADMIN can edit any sermon
  if (isUserAdmin(user)) return true;

  // Author can edit their own sermon
  if (item.authorId && item.authorId === user.id) return true;

  // Legacy fallback: if authorId is not set, Saul owns the initial sermons
  if (!item.authorId) {
    if (user.id === 'usr-saul') return true;
    if (item.preacher && item.preacher.toLowerCase().includes(user.name.toLowerCase())) return true;
  }

  return false;
}

export function canUserDeleteItem(user: UserProfile | null, item: VaultItem): boolean {
  return canUserEditItem(user, item);
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
        return parsed.map((item) => ({
          ...item,
          authorId: item.authorId || userId,
          authorName: item.authorName || (userId === 'usr-saul' ? 'Pastor Saul R.' : undefined),
        }));
      }
    }

    // Check if legacy data exists to migrate to primary user
    if (userId === 'usr-saul' || userId === 'usr-admin') {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyItems = JSON.parse(legacyRaw);
          if (Array.isArray(legacyItems) && legacyItems.length > 0) {
            const tagged = legacyItems.map((item: VaultItem) => ({
              ...item,
              authorId: item.authorId || 'usr-saul',
              authorName: item.authorName || 'Pastor Saul R.',
            }));
            saveUserVault(userId, tagged);
            return tagged;
          }
        } catch {
          // ignore
        }
      }
      // Seed default initial vault
      const seeded = INITIAL_VAULT.map((item) => ({
        ...item,
        authorId: item.authorId || (userId === 'usr-admin' ? 'usr-saul' : userId),
        authorName: item.authorName || 'Pastor Saul R.',
      }));
      saveUserVault(userId, seeded);
      return seeded;
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
// Global Church Library: Aggregation & Cross-User Sharing
// ----------------------------------------------------

/**
 * Loads all sermons from all users into the unified Global Church Library.
 */
export function loadGlobalChurchLibrary(): (VaultItem & { authorId: string; authorName: string })[] {
  const users = loadUsers();
  const allItemsMap = new Map<string, VaultItem & { authorId: string; authorName: string }>();

  users.forEach((user) => {
    const vault = loadUserVault(user.id);
    vault.forEach((item) => {
      const authorId = item.authorId || user.id;
      const authorName = item.authorName || user.name;
      // If duplicate key exists across vaults, keep the first or user-specific
      if (!allItemsMap.has(item.id)) {
        allItemsMap.set(item.id, {
          ...item,
          authorId,
          authorName,
        });
      }
    });
  });

  return Array.from(allItemsMap.values());
}

/**
 * Saves or updates a sermon in the author's respective vault storage.
 * If ADMIN is editing someone else's sermon, this saves it to that author's persistent vault!
 */
export function saveItemToTargetVault(item: VaultItem, activeUserId: string): void {
  const targetUserId = item.authorId || activeUserId;
  const targetVault = loadUserVault(targetUserId);
  const exists = targetVault.some((i) => i.id === item.id);

  let updatedVault: VaultItem[];
  if (exists) {
    updatedVault = targetVault.map((i) => (i.id === item.id ? item : i));
  } else {
    updatedVault = [item, ...targetVault];
  }
  saveUserVault(targetUserId, updatedVault);

  // If the active user has a copy in their personal list as well, update it too
  if (activeUserId !== targetUserId) {
    const activeVault = loadUserVault(activeUserId);
    if (activeVault.some((i) => i.id === item.id)) {
      const updatedActive = activeVault.map((i) => (i.id === item.id ? item : i));
      saveUserVault(activeUserId, updatedActive);
    }
  }
}

/**
 * Deletes a sermon from the author's vault (and any active user copy).
 */
export function deleteItemFromTargetVault(itemId: string, authorId?: string, activeUserId?: string): void {
  if (authorId) {
    const vault = loadUserVault(authorId);
    saveUserVault(authorId, vault.filter((i) => i.id !== itemId));
  }
  if (activeUserId && activeUserId !== authorId) {
    const activeVault = loadUserVault(activeUserId);
    saveUserVault(activeUserId, activeVault.filter((i) => i.id !== itemId));
  }
}

/**
 * Clones a sermon from another preacher to the current user's personal workbench.
 */
export function cloneSermonToWorkbench(source: VaultItem, targetUser: UserProfile): VaultItem {
  const cloned: VaultItem = {
    ...source,
    id: `work-${Date.now()}`,
    slug: `copy-${source.slug}-${Date.now().toString().slice(-4)}`,
    title: source.title.startsWith('Copy of ') ? source.title : `Copy of ${source.title}`,
    authorId: targetUser.id,
    authorName: targetUser.name,
    preacher: targetUser.name,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentVault = loadUserVault(targetUser.id);
  saveUserVault(targetUser.id, [cloned, ...currentVault]);
  return cloned;
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

    const secured = ensureAdminExists(backup.users);
    saveUsers(secured);

    if (backup.vaults && typeof backup.vaults === 'object') {
      Object.entries(backup.vaults).forEach(([userId, items]) => {
        if (Array.isArray(items)) {
          saveUserVault(userId, items);
        }
      });
    }

    if (secured.length > 0) {
      setCurrentUserId(secured[0].id);
    }

    return { success: true, userCount: secured.length };
  } catch (err) {
    return { success: false, userCount: 0, error: (err as Error).message || 'Failed to restore backup' };
  }
}
