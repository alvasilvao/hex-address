import * as fs from 'fs';
import * as path from 'path';
import { SyllableConfig } from './types';

/**
 * Loads configurations from JSON files
 */
export class ConfigLoader {
  private configs: Map<string, SyllableConfig> = new Map();
  private configDir: string;

  constructor(configDir?: string) {
    // Default to shared configs directory at repository root
    this.configDir = configDir || path.join(__dirname, '..', '..', '..', 'configs');
    this.loadAllConfigs();
  }

  /**
   * Load all JSON configuration files
   */
  private loadAllConfigs(): void {
    try {
      if (!fs.existsSync(this.configDir)) {
        throw new Error(`Config directory not found: ${this.configDir}`);
      }

      const files = fs.readdirSync(this.configDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          // Validate filename to prevent path traversal
          if (!/^[a-zA-Z0-9_-]+\.json$/.test(file)) {
            console.warn(`Skipping invalid config file name: ${file}`);
            continue;
          }
          
          const configPath = path.join(this.configDir, file);
          
          // Check file size limit (1MB max)
          const stats = fs.statSync(configPath);
          if (stats.size > 1024 * 1024) {
            console.warn(`Skipping oversized config file: ${file}`);
            continue;
          }
          
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          // Create config object with computed properties
          const config: SyllableConfig = {
            ...configData,
            h3_resolution: configData.h3_resolution || 15
          };

          // Use filename without extension as config name
          const configName = path.basename(file, '.json');
          this.configs.set(configName, config);
        } catch (error) {
          if (error instanceof SyntaxError) {
            console.warn(`Invalid JSON in config file ${file}`);
          } else {
            console.warn(`Failed to load config file ${file}`);
          }
        }
      }

      if (this.configs.size === 0) {
        throw new Error('No valid configuration files found');
      }
    } catch (error) {
      throw new Error(`Failed to load configurations: ${error}`);
    }
  }

  /**
   * Get a configuration by name
   */
  getConfig(configName: string): SyllableConfig {
    // Validate config name format to prevent path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(configName)) {
      throw new Error(`Invalid configuration name format: ${configName}`);
    }
    
    const config = this.configs.get(configName);
    if (!config) {
      const available = Array.from(this.configs.keys()).join(', ');
      throw new Error(`Configuration '${configName}' not found. Available: ${available}`);
    }
    return config;
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): Map<string, SyllableConfig> {
    return new Map(this.configs);
  }

  /**
   * List all configuration names
   */
  listConfigs(): string[] {
    return Array.from(this.configs.keys());
  }
}

// Global config loader instance
let globalConfigLoader: ConfigLoader;

/**
 * Get a configuration by name using the global loader
 */
export function getConfig(configName: string): SyllableConfig {
  if (!globalConfigLoader) {
    globalConfigLoader = new ConfigLoader();
  }
  return globalConfigLoader.getConfig(configName);
}

/**
 * Get all configurations using the global loader
 */
export function getAllConfigs(): Map<string, SyllableConfig> {
  if (!globalConfigLoader) {
    globalConfigLoader = new ConfigLoader();
  }
  return globalConfigLoader.getAllConfigs();
}

/**
 * List all configuration names using the global loader
 */
export function listConfigs(): string[] {
  if (!globalConfigLoader) {
    globalConfigLoader = new ConfigLoader();
  }
  return globalConfigLoader.listConfigs();
}