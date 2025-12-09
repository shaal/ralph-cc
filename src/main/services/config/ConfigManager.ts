/**
 * ConfigManager - Configuration management service
 *
 * Features:
 * - Load/save config from ~/.constellation/config.json
 * - Type-safe get/set operations
 * - Deep merge with defaults
 * - Auto-save on changes
 * - Singleton pattern
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { DEFAULT_CONFIG, ConstellationConfig } from './defaults';

/**
 * Deep merge utility for config objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue as any);
      } else {
        result[key] = sourceValue as any;
      }
    } else {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Get value at nested path in object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set value at nested path in object
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * ConfigManager class - Singleton
 */
export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private config: ConstellationConfig;
  private configDir: string;
  private configPath: string;
  private autoSave: boolean = true;

  private constructor() {
    this.configDir = path.join(homedir(), '.constellation');
    this.configPath = path.join(this.configDir, 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from disk
   */
  private loadConfig(): ConstellationConfig {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Load existing config or use defaults
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(fileContent);

        // Deep merge with defaults to handle new config keys
        return deepMerge(DEFAULT_CONFIG, savedConfig);
      }

      // No config file exists, save defaults
      this.saveConfig(DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to disk
   */
  private saveConfig(config: ConstellationConfig): void {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Write config file with pretty formatting
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Get entire configuration
   */
  public getAll(): ConstellationConfig {
    return { ...this.config };
  }

  /**
   * Get configuration value by path
   *
   * @param key - Dot-notation path (e.g., 'app.theme', 'agent.defaultModel')
   */
  public get<T = any>(key: string): T {
    return getNestedValue(this.config, key);
  }

  /**
   * Set configuration value by path
   *
   * @param key - Dot-notation path (e.g., 'app.theme', 'agent.defaultModel')
   * @param value - Value to set
   */
  public set(key: string, value: any): void {
    setNestedValue(this.config, key, value);

    if (this.autoSave) {
      this.saveConfig(this.config);
    }
  }

  /**
   * Update multiple configuration values
   */
  public update(updates: Partial<ConstellationConfig>): void {
    this.config = deepMerge(this.config, updates);

    if (this.autoSave) {
      this.saveConfig(this.config);
    }
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig(this.config);
  }

  /**
   * Reset a specific section to defaults
   */
  public resetSection(section: keyof ConstellationConfig): void {
    this.config[section] = { ...DEFAULT_CONFIG[section] };

    if (this.autoSave) {
      this.saveConfig(this.config);
    }
  }

  /**
   * Get config file path
   */
  public getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get config directory path
   */
  public getConfigDir(): string {
    return this.configDir;
  }

  /**
   * Enable/disable auto-save
   */
  public setAutoSave(enabled: boolean): void {
    this.autoSave = enabled;
  }

  /**
   * Manually save current configuration
   */
  public save(): void {
    this.saveConfig(this.config);
  }

  /**
   * Reload configuration from disk
   */
  public reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * Export configuration as JSON string
   */
  public export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  public import(json: string): void {
    try {
      const imported = JSON.parse(json);
      this.config = deepMerge(DEFAULT_CONFIG, imported);

      if (this.autoSave) {
        this.saveConfig(this.config);
      }
    } catch (error) {
      console.error('Failed to import config:', error);
      throw new Error('Invalid configuration JSON');
    }
  }

  /**
   * Validate configuration
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate app config
    if (!['light', 'dark', 'system'].includes(this.config.app.theme)) {
      errors.push('Invalid app.theme value');
    }

    // Validate agent config
    if (this.config.agent.maxTokens < 1 || this.config.agent.maxTokens > 200000) {
      errors.push('agent.maxTokens must be between 1 and 200000');
    }

    if (this.config.agent.maxIterations < 1) {
      errors.push('agent.maxIterations must be at least 1');
    }

    if (this.config.agent.maxSubagentDepth < 0) {
      errors.push('agent.maxSubagentDepth must be non-negative');
    }

    // Validate budget
    if (this.config.safety.budget.defaultLimit <= 0) {
      errors.push('safety.budget.defaultLimit must be positive');
    }

    if (
      this.config.safety.budget.warningThreshold < 0 ||
      this.config.safety.budget.warningThreshold > 1
    ) {
      errors.push('safety.budget.warningThreshold must be between 0 and 1');
    }

    // Validate circuit breaker
    if (this.config.safety.circuitBreaker.maxConsecutiveFailures < 1) {
      errors.push('safety.circuitBreaker.maxConsecutiveFailures must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * For testing: reset singleton instance
   */
  public static resetInstance(): void {
    ConfigManager.instance = null;
  }
}

/**
 * Export singleton instance getter
 */
export const getConfigManager = () => ConfigManager.getInstance();
