import { latLngToCell, cellToLatLng, cellToParent, cellToChildren, getBaseCellNumber } from 'h3-js';
import { 
  SyllableConfig, 
  Coordinates, 
  RoundTripResult, 
  SystemInfo, 
  ConversionError 
} from './types';
import { getConfig } from './config-loader';

/**
 * H3 Syllable Address System
 * 
 * Converts GPS coordinates to memorable syllable addresses using H3 Level 15 cells.
 * 
 * Standard Process:
 * 1. GPS Coordinates → H3 Cell ID (H3 hexagonal identifier)
 * 2. H3 Cell ID → Hierarchical Array (path through H3 tree structure)  
 * 3. Hierarchical Array → Integer Index (unique mathematical index)
 * 4. Integer Index → Syllable Address (human-readable syllables)
 */
export class H3SyllableSystem {
  private config: SyllableConfig;
  private configName: string;
  private syllableToIndex: Map<string, number> = new Map();
  private indexToSyllable: Map<number, string> = new Map();
  private cache: Map<string, any> = new Map();
  private hamiltonianPath: number[] = [];
  private readonly cacheMaxSize: number = 1000;

  constructor(configName: string = 'ascii-sfnmh') {
    this.configName = configName;
    this.config = getConfig(configName);
    this.initializeSyllableTables();
    this.initializeHamiltonianPath();
  }

  /**
   * Initialize syllable lookup tables for fast conversion
   */
  private initializeSyllableTables(): void {
    this.syllableToIndex.clear();
    this.indexToSyllable.clear();

    let index = 0;
    for (const consonant of this.config.consonants) {
      for (const vowel of this.config.vowels) {
        const syllable = consonant + vowel;
        this.syllableToIndex.set(syllable, index);
        this.indexToSyllable.set(index, syllable);
        index++;
      }
    }
  }

  /**
   * Initialize Hamiltonian path for level 0 cells (optimized array-based approach)
   */
  private initializeHamiltonianPath(): void {
    // Pre-computed Hamiltonian path for perfect spatial adjacency (100%)
    // Array where index = original_base_cell, value = hamiltonian_position
    this.hamiltonianPath = [
      1, 2, 3, 8, 0, 4, 12, 9, 5, 10,
      14, 13, 7, 22, 11, 6, 17, 39, 16, 42,
      41, 23, 18, 37, 15, 38, 21, 40, 20, 25,
      34, 19, 35, 33, 43, 47, 44, 36, 24, 69,
      45, 31, 27, 26, 29, 48, 46, 57, 65, 32,
      66, 56, 67, 30, 55, 54, 50, 68, 28, 70,
      52, 63, 59, 49, 58, 61, 64, 75, 51, 93,
      74, 92, 53, 91, 72, 62, 60, 87, 71, 86,
      89, 77, 107, 73, 94, 76, 109, 82, 90, 96,
      88, 97, 84, 121, 78, 85, 108, 95, 106, 100,
      83, 80, 81, 98, 110, 99, 101, 79, 119, 120,
      111, 105, 113, 103, 114, 112, 104, 102, 118, 116,
      115, 117
    ];
  }

  /**
   * Convert geographic coordinates to syllable address
   */
  coordinateToSyllable(latitude: number, longitude: number): string {
    try {
      this.validateCoordinates(latitude, longitude);

      // Check cache
      const coordKey = `${Math.round(latitude * 100000000)},${Math.round(longitude * 100000000)}`;
      if (this.cache.has(coordKey)) {
        return this.cache.get(coordKey);
      }

      // Step 1: Convert GPS Coordinates to H3 Cell ID
      const h3CellId = latLngToCell(latitude, longitude, this.config.h3_resolution);

      // Step 2: Convert H3 Cell ID to Hierarchical Array
      const hierarchicalArray = this.h3CellIdToHierarchicalArray(h3CellId);

      // Step 3: Convert Hierarchical Array to Integer Index
      const integerIndex = this.hierarchicalArrayToIntegerIndex(hierarchicalArray);

      // Step 4: Convert Integer Index to Syllable Address
      const syllableAddress = this.integerIndexToSyllableAddress(integerIndex);

      // Cache result (with size limit)
      if (this.cache.size >= this.cacheMaxSize) {
        // Remove oldest entry (FIFO)
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(coordKey, syllableAddress);
      return syllableAddress;
    } catch (error) {
      if (error instanceof ConversionError) {
        throw error;
      }
      throw new ConversionError(`Coordinate conversion failed`);
    }
  }

  /**
   * Convert syllable address to geographic coordinates
   */
  syllableToCoordinate(syllableAddress: string): Coordinates {
    try {
      // Check cache
      if (this.cache.has(syllableAddress)) {
        return this.cache.get(syllableAddress);
      }

      // Step 1: Convert Syllable Address to Integer Index
      const integerIndex = this.syllableAddressToIntegerIndex(syllableAddress);

      // Step 2: Convert Integer Index to Hierarchical Array
      const hierarchicalArray = this.integerIndexToHierarchicalArray(integerIndex);

      // Step 3: Convert Hierarchical Array to H3 Cell ID
      const h3CellId = this.hierarchicalArrayToH3CellId(hierarchicalArray);

      // Step 4: Convert H3 Cell ID to GPS Coordinates
      const [latitude, longitude] = cellToLatLng(h3CellId);

      const result: Coordinates = [latitude, longitude];
      // Cache result (with size limit)
      if (this.cache.size >= this.cacheMaxSize) {
        // Remove oldest entry (FIFO)
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(syllableAddress, result);
      return result;
    } catch (error) {
      if (error instanceof ConversionError) {
        throw error;
      }
      console.error('Syllable conversion error:', error);
      throw new ConversionError(`Syllable conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a syllable address maps to a real H3 location
   */
  isValidSyllableAddress(syllableAddress: string): boolean {
    try {
      this.syllableToCoordinate(syllableAddress);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test round-trip conversion accuracy
   */
  testRoundTrip(latitude: number, longitude: number): RoundTripResult {
    try {
      const syllableAddress = this.coordinateToSyllable(latitude, longitude);
      const [resultLat, resultLon] = this.syllableToCoordinate(syllableAddress);

      // Calculate precision
      const latDiff = Math.abs(resultLat - latitude);
      const lonDiff = Math.abs(resultLon - longitude);

      const latRad = (latitude * Math.PI) / 180;
      const metersPerDegreeLat = 111320;
      const metersPerDegreeLon = 111320 * Math.cos(latRad);

      const distanceErrorM = Math.sqrt(
        (latDiff * metersPerDegreeLat) ** 2 + 
        (lonDiff * metersPerDegreeLon) ** 2
      );

      return {
        success: true,
        originalCoordinates: [latitude, longitude],
        syllableAddress,
        resultCoordinates: [resultLat, resultLon],
        distanceErrorMeters: distanceErrorM,
        precise: distanceErrorM < 1.0
      };
    } catch (error) {
      throw new ConversionError(`Round-trip test failed: ${error}`);
    }
  }

  /**
   * Get system information and statistics
   */
  getSystemInfo(): SystemInfo {
    const totalSyllables = this.config.consonants.length * this.config.vowels.length;
    const addressSpace = totalSyllables ** this.config.address_length;
    const h3Target = 122 * (7 ** 15); // H3 Level 15 cells: 122 base cells × 7^15 hierarchical positions

    return {
      h3Resolution: this.config.h3_resolution,
      totalH3Cells: h3Target,
      consonants: [...this.config.consonants],
      vowels: [...this.config.vowels],
      totalSyllables,
      addressLength: this.config.address_length,
      addressSpace,
      coveragePercentage: (addressSpace / h3Target) * 100,
      precisionMeters: 0.5
    };
  }

  /**
   * Clear internal cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): SyllableConfig {
    return { ...this.config };
  }

  /**
   * Get current configuration name
   */
  getConfigName(): string {
    return this.configName;
  }

  /**
   * Create H3 system from a list of letters
   */
  static fromLetters(_letters: string[], _maxConsecutive: number = 1): H3SyllableSystem {
    // For now, use default config since we don't have dynamic config generation
    // This would need to be implemented with the config generation system
    throw new Error('Dynamic config generation not implemented. Use existing configurations.');
  }

  /**
   * Create H3 system with language-optimized configuration
   */
  static suggestForLanguage(language: string = 'international', _precisionMeters: number = 0.5): H3SyllableSystem {
    // Select configuration based on language preference
    // Note: All are ASCII character sets, optimized for different use cases
    let configName: string;
    
    switch (language) {
      case 'english':
        configName = 'ascii-jaxqt';  // Common typing letters
        break;
      case 'spanish':
        configName = 'ascii-fqsmnn'; // No Q confusion
        break;
      case 'japanese':
        configName = 'ascii-fqwclj'; // No L (avoid L/R confusion)
        break;
      default:
        configName = 'ascii-sfnmh'; // Default to safe config (15 consonants, 5 vowels, 8 syllables)
    }
    
    return new H3SyllableSystem(configName);
  }

  /**
   * Validate coordinates are within valid ranges
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    // Check for invalid numbers
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error(`Invalid coordinate values: latitude=${latitude}, longitude=${longitude}`);
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Latitude must be between -90 and 90, got ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Longitude must be between -180 and 180, got ${longitude}`);
    }
  }

  /**
   * Convert H3 Cell ID to Hierarchical Array
   */
  private h3CellIdToHierarchicalArray(h3CellId: string): number[] {
    const hierarchicalArray = new Array(16).fill(-1);
    
    // Get the complete parent chain from target resolution to base
    let current = h3CellId;
    const parentChain = [current];
    
    // Walk up the hierarchy to get all ancestors
    for (let res = this.config.h3_resolution - 1; res >= 0; res--) {
      const parent = cellToParent(current, res);
      parentChain.push(parent);
      current = parent;
    }
    
    // Extract base cell number
    const baseCell = getBaseCellNumber(parentChain[parentChain.length - 1]);
    hierarchicalArray[0] = baseCell;
    
    // Extract child positions at each resolution level
    for (let res = 1; res <= this.config.h3_resolution; res++) {
      const parent = parentChain[parentChain.length - res];
      const child = parentChain[parentChain.length - res - 1];
      
      const children = cellToChildren(parent, res);
      const childPosition = children.indexOf(child);
      
      if (childPosition === -1) {
        throw new Error(`Could not find child position for resolution ${res}`);
      }
      
      hierarchicalArray[res] = childPosition;
    }
    
    return hierarchicalArray;
  }

  /**
   * Convert Hierarchical Array to H3 Cell ID
   */
  private hierarchicalArrayToH3CellId(hierarchicalArray: number[]): string {
    const baseCellNumber = hierarchicalArray[0];
    
    // Pre-computed mapping of base cell numbers to H3 indices
    const BASE_CELL_H3_INDICES: Record<number, string> = {
      0: "8001fffffffffff", 1: "8003fffffffffff", 2: "8005fffffffffff", 3: "8007fffffffffff",
      4: "8009fffffffffff", 5: "800bfffffffffff", 6: "800dfffffffffff", 7: "800ffffffffffff",
      8: "8011fffffffffff", 9: "8013fffffffffff", 10: "8015fffffffffff", 11: "8017fffffffffff",
      12: "8019fffffffffff", 13: "801bfffffffffff", 14: "801dfffffffffff", 15: "801ffffffffffff",
      16: "8021fffffffffff", 17: "8023fffffffffff", 18: "8025fffffffffff", 19: "8027fffffffffff",
      20: "8029fffffffffff", 21: "802bfffffffffff", 22: "802dfffffffffff", 23: "802ffffffffffff",
      24: "8031fffffffffff", 25: "8033fffffffffff", 26: "8035fffffffffff", 27: "8037fffffffffff",
      28: "8039fffffffffff", 29: "803bfffffffffff", 30: "803dfffffffffff", 31: "803ffffffffffff",
      32: "8041fffffffffff", 33: "8043fffffffffff", 34: "8045fffffffffff", 35: "8047fffffffffff",
      36: "8049fffffffffff", 37: "804bfffffffffff", 38: "804dfffffffffff", 39: "804ffffffffffff",
      40: "8051fffffffffff", 41: "8053fffffffffff", 42: "8055fffffffffff", 43: "8057fffffffffff",
      44: "8059fffffffffff", 45: "805bfffffffffff", 46: "805dfffffffffff", 47: "805ffffffffffff",
      48: "8061fffffffffff", 49: "8063fffffffffff", 50: "8065fffffffffff", 51: "8067fffffffffff",
      52: "8069fffffffffff", 53: "806bfffffffffff", 54: "806dfffffffffff", 55: "806ffffffffffff",
      56: "8071fffffffffff", 57: "8073fffffffffff", 58: "8075fffffffffff", 59: "8077fffffffffff",
      60: "8079fffffffffff", 61: "807bfffffffffff", 62: "807dfffffffffff", 63: "807ffffffffffff",
      64: "8081fffffffffff", 65: "8083fffffffffff", 66: "8085fffffffffff", 67: "8087fffffffffff",
      68: "8089fffffffffff", 69: "808bfffffffffff", 70: "808dfffffffffff", 71: "808ffffffffffff",
      72: "8091fffffffffff", 73: "8093fffffffffff", 74: "8095fffffffffff", 75: "8097fffffffffff",
      76: "8099fffffffffff", 77: "809bfffffffffff", 78: "809dfffffffffff", 79: "809ffffffffffff",
      80: "80a1fffffffffff", 81: "80a3fffffffffff", 82: "80a5fffffffffff", 83: "80a7fffffffffff",
      84: "80a9fffffffffff", 85: "80abfffffffffff", 86: "80adfffffffffff", 87: "80affffffffffff",
      88: "80b1fffffffffff", 89: "80b3fffffffffff", 90: "80b5fffffffffff", 91: "80b7fffffffffff",
      92: "80b9fffffffffff", 93: "80bbfffffffffff", 94: "80bdfffffffffff", 95: "80bffffffffffff",
      96: "80c1fffffffffff", 97: "80c3fffffffffff", 98: "80c5fffffffffff", 99: "80c7fffffffffff",
      100: "80c9fffffffffff", 101: "80cbfffffffffff", 102: "80cdfffffffffff", 103: "80cffffffffffff",
      104: "80d1fffffffffff", 105: "80d3fffffffffff", 106: "80d5fffffffffff", 107: "80d7fffffffffff",
      108: "80d9fffffffffff", 109: "80dbfffffffffff", 110: "80ddfffffffffff", 111: "80dffffffffffff",
      112: "80e1fffffffffff", 113: "80e3fffffffffff", 114: "80e5fffffffffff", 115: "80e7fffffffffff",
      116: "80e9fffffffffff", 117: "80ebfffffffffff", 118: "80edfffffffffff", 119: "80effffffffffff",
      120: "80f1fffffffffff", 121: "80f3fffffffffff"
    };
    
    const baseCell = BASE_CELL_H3_INDICES[baseCellNumber];
    if (!baseCell) {
      throw new Error(`Invalid base cell number: ${baseCellNumber}. Must be 0-121.`);
    }
    
    let currentH3 = baseCell;
    
    // Navigate through child positions
    for (let res = 1; res <= this.config.h3_resolution; res++) {
      const childPosition = hierarchicalArray[res];
      const children = cellToChildren(currentH3, res);
      
      if (childPosition >= children.length) {
        throw new Error(`Child position ${childPosition} out of range for resolution ${res}`);
      }
      
      currentH3 = children[childPosition];
    }
    
    return currentH3;
  }

  /**
   * Convert Hierarchical Array to Integer Index using mixed-radix encoding
   */
  private hierarchicalArrayToIntegerIndex(hierarchicalArray: number[]): number {
    let result = 0;
    let multiplier = 1;
    
    // Process from right to left (least significant first)
    for (let pos = this.config.h3_resolution; pos >= 1; pos--) {
      const childPos = hierarchicalArray[pos];
      if (childPos !== -1) {
        result += childPos * multiplier;
        multiplier *= 7; // 7 possible child positions
      } else {
        multiplier *= 7;
      }
    }
    
    // Apply Hamiltonian path ordering to base cell (most significant)
    const originalBaseCell = hierarchicalArray[0];
    const hamiltonianBaseCell = this.hamiltonianPath[originalBaseCell];
    result += hamiltonianBaseCell * multiplier;
    
    return result;
  }

  /**
   * Convert Integer Index to Hierarchical Array
   */
  private integerIndexToHierarchicalArray(integerIndex: number): number[] {
    const hierarchicalArray = new Array(16).fill(-1);
    let remaining = integerIndex;
    
    // Calculate base multiplier
    const baseMultiplier = 7 ** this.config.h3_resolution;
    
    // Extract Hamiltonian base cell and convert back to original
    const hamiltonianBaseCell = Math.floor(remaining / baseMultiplier);
    const originalBaseCell = this.hamiltonianPath.indexOf(hamiltonianBaseCell);
    hierarchicalArray[0] = originalBaseCell;
    remaining = remaining % baseMultiplier;
    
    // Extract child positions from right to left
    for (let pos = this.config.h3_resolution; pos >= 1; pos--) {
      const childPos = remaining % 7;
      hierarchicalArray[pos] = childPos;
      remaining = Math.floor(remaining / 7);
    }
    
    return hierarchicalArray;
  }

  /**
   * Convert Integer Index to Syllable Address
   */
  private integerIndexToSyllableAddress(integerIndex: number): string {
    const totalSyllables = this.config.consonants.length * this.config.vowels.length;
    const addressSpace = totalSyllables ** this.config.address_length;
    
    if (integerIndex < 0 || integerIndex >= addressSpace) {
      throw new Error(`Integer Index ${integerIndex} out of range [0, ${addressSpace})`);
    }
    
    const syllables: string[] = [];
    let remaining = integerIndex;
    
    // Simple base conversion
    for (let pos = 0; pos < this.config.address_length; pos++) {
      const syllableIdx = remaining % totalSyllables;
      const syllable = this.indexToSyllable.get(syllableIdx);
      if (!syllable) {
        throw new Error(`Invalid syllable index: ${syllableIdx}`);
      }
      syllables.push(syllable);
      remaining = Math.floor(remaining / totalSyllables);
    }
    
    return this.formatSyllableAddress(syllables);
  }

  /**
   * Format syllable address based on address length
   */
  private formatSyllableAddress(syllables: string[]): string {
    const length = syllables.length;
    
    if (length === 6) {
      // xx-xx-xx|xx-xx-xx
      return `${syllables.slice(0, 3).join('-')}|${syllables.slice(3).join('-')}`;
    } else if (length === 7) {
      // xx-xx-xx-xx|xx-xx-xx
      return `${syllables.slice(0, 4).join('-')}|${syllables.slice(4).join('-')}`;
    } else if (length === 8) {
      // xx-xx-xx-xx|xx-xx-xx-xx
      return `${syllables.slice(0, 4).join('-')}|${syllables.slice(4).join('-')}`;
    } else if (length === 9) {
      // xx-xx-xx|xx-xx-xx|xx-xx-xx
      return `${syllables.slice(0, 3).join('-')}|${syllables.slice(3, 6).join('-')}|${syllables.slice(6).join('-')}`;
    } else if (length === 10) {
      // xx-xx-xx|xx-xx-xx|xx-xx-xx-xx
      return `${syllables.slice(0, 3).join('-')}|${syllables.slice(3, 6).join('-')}|${syllables.slice(6).join('-')}`;
    } else if (length === 12) {
      // xx-xx-xx|xx-xx-xx|xx-xx-xx|xx-xx-xx
      return `${syllables.slice(0, 3).join('-')}|${syllables.slice(3, 6).join('-')}|${syllables.slice(6, 9).join('-')}|${syllables.slice(9).join('-')}`;
    } else {
      // Default: split into groups of 3, with remainder in last group
      const groups: string[] = [];
      for (let i = 0; i < length; i += 3) {
        groups.push(syllables.slice(i, i + 3).join('-'));
      }
      return groups.join('|');
    }
  }

  /**
   * Convert Syllable Address to Integer Index
   */
  private syllableAddressToIntegerIndex(syllableAddress: string): number {
    const syllables = syllableAddress.toLowerCase().replace(/\|/g, '-').split('-');
    
    if (syllables.length !== this.config.address_length) {
      throw new Error(`Address must have ${this.config.address_length} syllables`);
    }
    
    const totalSyllables = this.config.consonants.length * this.config.vowels.length;
    let integerValue = 0;
    
    // Process syllables in same order as forward conversion
    for (let pos = 0; pos < syllables.length; pos++) {
      const syllable = syllables[pos];
      const syllableIndex = this.syllableToIndex.get(syllable);
      if (syllableIndex === undefined) {
        throw new Error(`Unknown syllable: ${syllable}`);
      }
      
      // Use the same base conversion logic as forward direction
      integerValue += syllableIndex * (totalSyllables ** pos);
    }
    
    return integerValue;
  }
}