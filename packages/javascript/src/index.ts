/**
 * Hex Address System - JavaScript/TypeScript Package
 * 
 * Convert GPS coordinates to memorable hex addresses using H3.
 * 
 * @example
 * ```typescript
 * import { H3SyllableSystem, isValidSyllableAddress } from 'hex-address';
 * 
 * // Initialize system
 * const system = new H3SyllableSystem('ascii-dnqqwn');
 * 
 * // Convert coordinates to syllable address
 * const address = system.coordinateToSyllable(48.8566, 2.3522);
 * console.log(address); // "dinenunukiwufeme"
 * 
 * // Convert back to coordinates
 * const [lat, lon] = system.syllableToCoordinate(address);
 * console.log(`${lat.toFixed(6)}, ${lon.toFixed(6)}`); // 48.856602, 2.352198
 * 
 * // Validate addresses
 * const isValid = system.isValidSyllableAddress(address);
 * console.log(isValid); // true
 * ```
 */

// Main classes and types
export { H3SyllableSystem } from './h3-syllable-system';
export { ConfigLoader, getConfig, getAllConfigs, listConfigs } from './config-loader';
export {
  SyllableConfig,
  Coordinates,
  RoundTripResult,
  SystemInfo,
  H3SyllableError,
  ConversionError,
  GeographicBounds,
  PartialLocationEstimate,
  AddressAnalysis,
  PhoneticAlternative,
  PhoneticChange,
} from './types';

// Convenience functions
import { H3SyllableSystem } from './h3-syllable-system';
import { listConfigs } from './config-loader';
import { PartialLocationEstimate, AddressAnalysis } from './types';

/**
 * Convert coordinates to syllable address using specified configuration
 */
export function coordinateToSyllable(
  latitude: number,
  longitude: number,
  configName: string = 'ascii-dnqqwn'
): string {
  const system = new H3SyllableSystem(configName);
  return system.coordinateToSyllable(latitude, longitude);
}

/**
 * Convert syllable address to coordinates using specified configuration
 */
export function syllableToCoordinate(
  syllableAddress: string,
  configName: string = 'ascii-dnqqwn'
): [number, number] {
  const system = new H3SyllableSystem(configName);
  return system.syllableToCoordinate(syllableAddress);
}

/**
 * Check if syllable address corresponds to a real location
 * 
 * Some syllable combinations don't map to actual H3 locations, just like
 * how "999999 Main Street" might not exist in the real world.
 */
export function isValidSyllableAddress(
  syllableAddress: string,
  configName: string = 'ascii-dnqqwn'
): boolean {
  const system = new H3SyllableSystem(configName);
  return system.isValidSyllableAddress(syllableAddress);
}

/**
 * Estimate location and bounds from a partial syllable address
 * 
 * This function calculates the geographic area that could be represented by
 * a partial syllable address by determining the minimum and maximum complete
 * addresses that start with the given partial address.
 */
export function estimateLocationFromPartial(
  partialAddress: string,
  configName: string = 'ascii-dnqqwn',
  comprehensive: boolean = false
): PartialLocationEstimate {
  const system = new H3SyllableSystem(configName);
  return system.estimateLocationFromPartial(partialAddress, comprehensive);
}

/**
 * Analyze a syllable address and provide phonetic alternatives
 * 
 * This function validates the address and generates alternative addresses
 * for characters that could have been misheard due to phonetic similarity.
 * Useful for confirming addresses received verbally.
 * 
 * @example
 * ```typescript
 * const analysis = analyzeAddress("de-ma-su-cu|du-ve-gu-ba");
 * console.log(analysis.isValid); // true
 * console.log(analysis.phoneticAlternatives.length); // Number of valid alternatives
 * analysis.phoneticAlternatives.forEach(alt => {
 *   console.log(`${alt.address} (${alt.distanceKm}km away, ${alt.change.from}→${alt.change.to})`);
 * });
 * ```
 */
export function analyzeAddress(
  syllableAddress: string,
  configName: string = 'ascii-dnqqwn'
): AddressAnalysis {
  const system = new H3SyllableSystem(configName);
  return system.analyzeAddress(syllableAddress);
}

/**
 * Get detailed information about a configuration
 */
export function getConfigInfo(configName: string): any {
  const system = new H3SyllableSystem(configName);
  const config = system.getConfig();
  
  return {
    name: config.name,
    description: config.description,
    consonants: config.consonants,
    vowels: config.vowels,
    totalSyllables: config.consonants.length * config.vowels.length,
    addressLength: config.address_length,
    maxConsecutive: config.max_consecutive,
    h3Resolution: config.h3_resolution,
    addressSpace: (config.consonants.length * config.vowels.length) ** config.address_length,
  };
}

/**
 * List all available configuration names
 */
export function listAvailableConfigs(): string[] {
  return listConfigs();
}

/**
 * Create H3 system from a list of letters
 */
export function createSystemFromLetters(letters: string[], maxConsecutive: number = 1): H3SyllableSystem {
  return H3SyllableSystem.fromLetters(letters, maxConsecutive);
}

/**
 * Create H3 system with language-optimized configuration
 */
export function suggestSystemForLanguage(language: string = 'international', precisionMeters: number = 0.5): H3SyllableSystem {
  return H3SyllableSystem.suggestForLanguage(language, precisionMeters);
}

/**
 * List all auto-generated configuration names
 */
export function listAutoGeneratedConfigs(): string[] {
  return listConfigs().filter(name => name.startsWith('ascii-'));
}

/**
 * Find configurations that use exactly these letters
 */
export function findConfigsByLetters(letters: string[]): string[] {
  const configs = listConfigs();
  const result: string[] = [];
  
  for (const configName of configs) {
    try {
      const system = new H3SyllableSystem(configName);
      const config = system.getConfig();
      const configLetters = [...config.consonants, ...config.vowels].sort();
      const inputLetters = letters.sort();
      
      if (JSON.stringify(configLetters) === JSON.stringify(inputLetters)) {
        result.push(configName);
      }
    } catch {
      // Skip configs that can't be loaded
    }
  }
  
  return result;
}

// Package metadata
export const version = '1.1.1';
export const author = 'Álvaro Silva';
export const license = 'MIT';
export const description = 'Convert GPS coordinates to memorable hex addresses';

