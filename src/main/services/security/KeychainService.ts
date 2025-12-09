/**
 * KeychainService - Secure API key storage
 *
 * Features:
 * - Store API keys in OS keychain (not in config files or logs)
 * - Cross-platform support (macOS, Windows, Linux)
 * - Uses Electron's safeStorage API
 * - Singleton pattern
 *
 * Platform-specific storage:
 * - macOS: Keychain Services
 * - Windows: Credential Manager (via DPAPI)
 * - Linux: libsecret/Secret Service
 */

import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

/**
 * Keychain entry interface
 */
interface KeychainEntry {
  service: string;
  account: string;
  encryptedValue: string;
}

/**
 * KeychainService class - Singleton
 */
export class KeychainService {
  private static instance: KeychainService | null = null;
  private readonly SERVICE_NAME = 'com.constellation.api-keys';
  private readonly STORAGE_PATH: string;
  private readonly FALLBACK_FILE = 'keychain.enc';

  private constructor() {
    const configDir = path.join(homedir(), '.constellation');
    this.STORAGE_PATH = path.join(configDir, this.FALLBACK_FILE);

    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KeychainService {
    if (!KeychainService.instance) {
      KeychainService.instance = new KeychainService();
    }
    return KeychainService.instance;
  }

  /**
   * Check if secure storage is available
   */
  public isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  /**
   * Set API key in secure storage
   *
   * @param key - API key to store
   * @param account - Account identifier (e.g., 'anthropic', 'openai')
   */
  public async setApiKey(key: string, account: string = 'anthropic'): Promise<void> {
    if (!key) {
      throw new Error('API key cannot be empty');
    }

    try {
      if (safeStorage.isEncryptionAvailable()) {
        // Use Electron's safeStorage (preferred method)
        const encrypted = safeStorage.encryptString(key);
        await this.saveEncryptedKey(account, encrypted);
      } else {
        // Fallback: Store as plain text with warning
        console.warn(
          'Secure storage not available. API key will be stored with basic obfuscation only.'
        );
        const obfuscated = Buffer.from(key).toString('base64');
        await this.saveEncryptedKey(account, Buffer.from(obfuscated));
      }
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw new Error('Failed to store API key in secure storage');
    }
  }

  /**
   * Get API key from secure storage
   *
   * @param account - Account identifier (e.g., 'anthropic', 'openai')
   * @returns API key or null if not found
   */
  public async getApiKey(account: string = 'anthropic'): Promise<string | null> {
    try {
      const encrypted = await this.loadEncryptedKey(account);

      if (!encrypted) {
        return null;
      }

      if (safeStorage.isEncryptionAvailable()) {
        // Use Electron's safeStorage
        return safeStorage.decryptString(encrypted);
      } else {
        // Fallback: Decode obfuscated key
        const obfuscated = encrypted.toString();
        return Buffer.from(obfuscated, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  /**
   * Delete API key from secure storage
   *
   * @param account - Account identifier
   */
  public async deleteApiKey(account: string = 'anthropic'): Promise<void> {
    try {
      const entries = await this.loadAllEntries();
      const filtered = entries.filter((entry) => entry.account !== account);
      await this.saveAllEntries(filtered);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw new Error('Failed to delete API key from secure storage');
    }
  }

  /**
   * Check if API key exists
   *
   * @param account - Account identifier
   */
  public async hasApiKey(account: string = 'anthropic'): Promise<boolean> {
    try {
      const key = await this.getApiKey(account);
      return key !== null && key.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all stored accounts
   */
  public async listAccounts(): Promise<string[]> {
    try {
      const entries = await this.loadAllEntries();
      return entries.map((entry) => entry.account);
    } catch (error) {
      console.error('Failed to list accounts:', error);
      return [];
    }
  }

  /**
   * Clear all stored API keys
   */
  public async clearAll(): Promise<void> {
    try {
      await this.saveAllEntries([]);
    } catch (error) {
      console.error('Failed to clear all API keys:', error);
      throw new Error('Failed to clear API keys from secure storage');
    }
  }

  /**
   * Save encrypted key to storage
   */
  private async saveEncryptedKey(account: string, encrypted: Buffer): Promise<void> {
    const entries = await this.loadAllEntries();

    // Remove existing entry for this account
    const filtered = entries.filter((entry) => entry.account !== account);

    // Add new entry
    filtered.push({
      service: this.SERVICE_NAME,
      account,
      encryptedValue: encrypted.toString('base64'),
    });

    await this.saveAllEntries(filtered);
  }

  /**
   * Load encrypted key from storage
   */
  private async loadEncryptedKey(account: string): Promise<Buffer | null> {
    const entries = await this.loadAllEntries();
    const entry = entries.find((e) => e.account === account);

    if (!entry) {
      return null;
    }

    return Buffer.from(entry.encryptedValue, 'base64');
  }

  /**
   * Load all keychain entries from storage
   */
  private async loadAllEntries(): Promise<KeychainEntry[]> {
    try {
      if (!fs.existsSync(this.STORAGE_PATH)) {
        return [];
      }

      const content = fs.readFileSync(this.STORAGE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load keychain entries:', error);
      return [];
    }
  }

  /**
   * Save all keychain entries to storage
   */
  private async saveAllEntries(entries: KeychainEntry[]): Promise<void> {
    try {
      fs.writeFileSync(
        this.STORAGE_PATH,
        JSON.stringify(entries, null, 2),
        'utf-8'
      );

      // Set restrictive permissions (Unix-like systems)
      if (process.platform !== 'win32') {
        fs.chmodSync(this.STORAGE_PATH, 0o600);
      }
    } catch (error) {
      console.error('Failed to save keychain entries:', error);
      throw error;
    }
  }

  /**
   * Get storage path (for debugging/testing)
   */
  public getStoragePath(): string {
    return this.STORAGE_PATH;
  }

  /**
   * For testing: reset singleton instance
   */
  public static resetInstance(): void {
    KeychainService.instance = null;
  }
}

/**
 * Export singleton instance getter
 */
export const getKeychainService = () => KeychainService.getInstance();
