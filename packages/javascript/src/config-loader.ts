import { SyllableConfig } from './types';

// Import all configurations statically for browser compatibility
import asciiElomrConfig from './configs/ascii-elomr.json';

/**
 * Pre-loaded configurations for browser and Node.js compatibility
 */
const BUNDLED_CONFIGS: Record<string, SyllableConfig> = {
  'ascii-elomr': asciiElomrConfig as SyllableConfig,
};

/**
 * Browser-compatible configuration loader
 * Configurations are bundled at build time for universal compatibility
 */
export class ConfigLoader {
  private configs: Map<string, SyllableConfig> = new Map();

  constructor() {
    this.loadBundledConfigs();
  }

  /**
   * Load bundled configurations
   */
  private loadBundledConfigs(): void {
    for (const [name, configData] of Object.entries(BUNDLED_CONFIGS)) {
      try {
        // Create config object with computed properties
        const config: SyllableConfig = {
          ...configData,
          h3_resolution: configData.h3_resolution || 14
        };

        this.configs.set(name, config);
      } catch (error) {
        console.warn(`Failed to load bundled config ${name}:`, error);
      }
    }

    if (this.configs.size === 0) {
      throw new Error('No valid configuration files found');
    }
  }

  /**
   * Get a configuration by name
   */
  getConfig(configName: string): SyllableConfig {
    // Validate config name format to prevent injection
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

  /**
   * Get configuration metadata
   */
  getConfigInfo(configName: string): {
    name: string;
    description: string;
    consonantsCount: number;
    vowelsCount: number;
    addressLength: number;
    totalCombinations?: number;
    coverageRatio?: number;
  } {
    const config = this.getConfig(configName);
    return {
      name: config.name,
      description: config.description,
      consonantsCount: config.consonants.length,
      vowelsCount: config.vowels.length,
      addressLength: config.address_length,
      totalCombinations: config.metadata?.total_combinations,
      coverageRatio: config.metadata?.coverage_ratio,
    };
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

/**
 * Get configuration metadata using the global loader
 */
export function getConfigInfo(configName: string) {
  if (!globalConfigLoader) {
    globalConfigLoader = new ConfigLoader();
  }
  return globalConfigLoader.getConfigInfo(configName);
}