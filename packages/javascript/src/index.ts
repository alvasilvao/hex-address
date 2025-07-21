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
 * const system = new H3SyllableSystem('ascii-elomr');
 * 
 * // Convert coordinates to syllable address
 * const address = system.coordinateToAddress(48.8566, 2.3522);
 * console.log(address); // "dinenunukiwufeme"
 * 
 * // Convert back to coordinates
 * const [lat, lon] = system.addressToCoordinate(address);
 * console.log(`${lat.toFixed(6)}, ${lon.toFixed(6)}`); // 48.856602, 2.352198
 * 
 * // Validate addresses
 * const isValid = system.isValidAddress(address);
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
  ValidationResult,
  ValidationError,
  ValidationErrorType,
} from './types';

// Convenience functions
import { H3SyllableSystem } from './h3-syllable-system';
import { listConfigs } from './config-loader';
import { PartialLocationEstimate, AddressAnalysis, ValidationResult, GeographicBounds } from './types';

/**
 * Convert coordinates to syllable address using specified configuration
 */
export function coordinateToAddress(
  latitude: number,
  longitude: number,
  configName: string = 'ascii-elomr'
): string {
  const system = new H3SyllableSystem(configName);
  return system.coordinateToAddress(latitude, longitude);
}

/**
 * Convert syllable address to coordinates using specified configuration
 */
export function addressToCoordinate(
  syllableAddress: string,
  configName: string = 'ascii-elomr'
): [number, number] {
  const system = new H3SyllableSystem(configName);
  return system.addressToCoordinate(syllableAddress);
}

/**
 * Check if syllable address corresponds to a real location
 * 
 * Some syllable combinations don't map to actual H3 locations, just like
 * how "999999 Main Street" might not exist in the real world.
 * 
 * @param syllableAddress - The address to validate
 * @param configName - Configuration to use
 * @param detailed - If true, returns detailed ValidationResult with phonetic suggestions
 * 
 * @example
 * ```typescript
 * // Simple validation
 * isValidAddress("dinenunukiwufeme") // → true
 * isValidAddress("invalid") // → false
 * 
 * // Detailed validation with phonetic suggestions
 * const result = isValidAddress("helloworld", "ascii-elomr", true);
 * console.log(result.errors[0].suggestions); // → ['fello', 'jello', 'mello']
 * ```
 */
export function isValidAddress(
  syllableAddress: string,
  configName?: string
): boolean;
export function isValidAddress(
  syllableAddress: string,
  configName: string,
  detailed: true
): ValidationResult;
export function isValidAddress(
  syllableAddress: string,
  configName?: string,
  detailed?: boolean
): boolean | ValidationResult {
  const system = new H3SyllableSystem(configName || 'ascii-elomr');
  
  if (detailed) {
    return system.isValidAddress(syllableAddress, detailed);
  }
  
  return system.isValidAddress(syllableAddress);
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
  configName: string = 'ascii-elomr',
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
  configName: string = 'ascii-elomr'
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
export function createSystemFromLetters(letters: string[]): H3SyllableSystem {
  return H3SyllableSystem.fromLetters(letters);
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

/**
 * Calculate distance between two hex addresses in kilometers
 * 
 * @param address1 - First hex address
 * @param address2 - Second hex address  
 * @param configName - Configuration to use
 * @returns Distance in kilometers
 * 
 * @example
 * ```typescript
 * const distance = calculateDistance(
 *   "dinenunukiwufeme", 
 *   "dinenunukiwufene", 
 *   "ascii-elomr"
 * );
 * console.log(`Distance: ${distance.toFixed(2)} km`);
 * ```
 */
export function calculateDistance(
  address1: string,
  address2: string,
  configName: string = 'ascii-elomr'
): number {
  const system = new H3SyllableSystem(configName);
  const [lat1, lon1] = system.addressToCoordinate(address1);
  const [lat2, lon2] = system.addressToCoordinate(address2);
  
  return haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * Find hex addresses within a radius of a center address
 * 
 * @param centerAddress - Center hex address
 * @param radiusKm - Radius in kilometers
 * @param configName - Configuration to use
 * @returns Array of nearby addresses with distances
 * 
 * @example
 * ```typescript
 * const nearby = findNearbyAddresses("dinenunukiwufeme", 1.0);
 * nearby.forEach(item => {
 *   console.log(`${item.address}: ${item.distance.toFixed(3)}km`);
 * });
 * ```
 */
export function findNearbyAddresses(
  centerAddress: string,
  radiusKm: number,
  configName: string = 'ascii-elomr'
): Array<{ address: string; distance: number; coordinates: [number, number] }> {
  const system = new H3SyllableSystem(configName);
  const [centerLat, centerLon] = system.addressToCoordinate(centerAddress);
  
  // Generate grid of nearby coordinates to find addresses within radius
  const result: Array<{ address: string; distance: number; coordinates: [number, number] }> = [];
  const gridSize = radiusKm / 111; // Approximate degrees per km
  const stepSize = gridSize / 10; // Higher resolution for better coverage
  
  for (let latOffset = -gridSize; latOffset <= gridSize; latOffset += stepSize) {
    for (let lonOffset = -gridSize; lonOffset <= gridSize; lonOffset += stepSize) {
      const testLat = centerLat + latOffset;
      const testLon = centerLon + lonOffset;
      
      try {
        const address = system.coordinateToAddress(testLat, testLon);
        const distance = haversineDistance(centerLat, centerLon, testLat, testLon);
        
        if (distance <= radiusKm && address !== centerAddress) {
          // Check if we already have this address
          if (!result.find(item => item.address === address)) {
            result.push({ address, distance, coordinates: [testLat, testLon] });
          }
        }
      } catch {
        // Skip invalid coordinates
      }
    }
  }
  
  return result.sort((a, b) => a.distance - b.distance);
}

/**
 * Get geographic bounds (bounding box) for a hex address
 * 
 * @param address - Hex address
 * @param configName - Configuration to use
 * @returns Geographic bounds object
 * 
 * @example
 * ```typescript
 * const bounds = getAddressBounds("dinenunukiwufeme");
 * console.log(`SW: ${bounds.south}, ${bounds.west}`);
 * console.log(`NE: ${bounds.north}, ${bounds.east}`);
 * ```
 */
export function getAddressBounds(
  address: string,
  configName: string = 'ascii-elomr'
): GeographicBounds {
  const system = new H3SyllableSystem(configName);
  const [centerLat, centerLon] = system.addressToCoordinate(address);
  
  // H3 level 14 has ~3m precision, so create approximate bounds
  // Each H3 cell is roughly hexagonal with ~3m radius
  const cellRadiusKm = 0.003; // ~3m in km
  const degreeOffset = cellRadiusKm / 111; // Convert km to approximate degrees
  
  return {
    north: centerLat + degreeOffset,
    south: centerLat - degreeOffset,
    east: centerLon + degreeOffset / Math.cos(toRadians(centerLat)),
    west: centerLon - degreeOffset / Math.cos(toRadians(centerLat))
  };
}

/**
 * Cluster nearby hex addresses into groups
 * 
 * @param addresses - Array of hex addresses to cluster
 * @param maxDistanceKm - Maximum distance between addresses in same cluster
 * @param configName - Configuration to use
 * @returns Array of clusters, each containing grouped addresses
 * 
 * @example
 * ```typescript
 * const addresses = ["addr1", "addr2", "addr3", "addr4"];
 * const clusters = clusterAddresses(addresses, 0.5);
 * console.log(`Found ${clusters.length} clusters`);
 * ```
 */
export function clusterAddresses(
  addresses: string[],
  maxDistanceKm: number,
  configName: string = 'ascii-elomr'
): Array<{ addresses: string[]; center: [number, number]; bounds: GeographicBounds }> {
  const system = new H3SyllableSystem(configName);
  const coords = addresses.map(addr => {
    const [lat, lon] = system.addressToCoordinate(addr);
    return { address: addr, lat, lon };
  });
  
  const clusters: Array<{ addresses: string[]; coords: Array<{ lat: number; lon: number }> }> = [];
  const used = new Set<number>();
  
  for (let i = 0; i < coords.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = { 
      addresses: [coords[i].address], 
      coords: [{ lat: coords[i].lat, lon: coords[i].lon }] 
    };
    used.add(i);
    
    for (let j = i + 1; j < coords.length; j++) {
      if (used.has(j)) continue;
      
      const distance = haversineDistance(coords[i].lat, coords[i].lon, coords[j].lat, coords[j].lon);
      if (distance <= maxDistanceKm) {
        cluster.addresses.push(coords[j].address);
        cluster.coords.push({ lat: coords[j].lat, lon: coords[j].lon });
        used.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters.map(cluster => {
    const lats = cluster.coords.map(c => c.lat);
    const lons = cluster.coords.map(c => c.lon);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;
    
    return {
      addresses: cluster.addresses,
      center: [centerLat, centerLon] as [number, number],
      bounds: {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lons),
        west: Math.min(...lons)
      }
    };
  });
}

/**
 * Calculate the Haversine distance between two points in kilometers
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}


// Package metadata
export const version = '1.3.1';
export const author = 'Álvaro Silva';
export const license = 'MIT';
export const description = 'Convert GPS coordinates to memorable hex addresses';

