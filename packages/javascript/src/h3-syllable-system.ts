import { latLngToCell, cellToLatLng, cellToParent, cellToChildren, getBaseCellNumber } from 'h3-js';
import { 
  SyllableConfig, 
  Coordinates, 
  RoundTripResult, 
  SystemInfo, 
  ConversionError,
  GeographicBounds,
  PartialLocationEstimate,
  AddressAnalysis,
  PhoneticAlternative
} from './types';
import { getConfig } from './config-loader';

/**
 * Comprehensive phonetic confusion database
 * Maps characters to their phonetically similar alternatives across different languages
 */
const PHONETIC_CONFUSIONS: Record<string, string[]> = {
  // Common English consonant confusions
  'd': ['t'],
  't': ['d'], 
  'f': ['v'],
  'v': ['f'],
  's': ['z'],
  'z': ['s'],
  'm': ['n'],
  'n': ['m'],
  'p': ['b'],
  'b': ['p'],
  'k': ['c', 'q'],
  'c': ['k'],
  'g': ['j'],
  'j': ['g'],
  'w': ['v'],  // German w/v confusion
  'l': ['r'],  // For non-Japanese configs
  'r': ['l'],
  'x': ['s'],  // Spanish x/s confusion
  'y': ['j'],  // Spanish y/j confusion
  
  // Vowel confusions (less common but can occur)
  'e': ['i'],  // Common in many languages
  'i': ['e'],
  'o': ['u'],  // Some dialects
  'u': ['o']
};

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

  constructor(configName: string = 'ascii-dnqqwn') {
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
   * Get valid phonetic substitutions for a character based on current config
   */
  private getValidPhoneticSubstitutions(char: string): string[] {
    const allSubstitutions = PHONETIC_CONFUSIONS[char] || [];
    const validChars = [...this.config.consonants, ...this.config.vowels];
    
    // Only return substitutions that exist in current config
    return allSubstitutions.filter(sub => validChars.includes(sub));
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
    const [lat1, lng1] = coord1;
    const [lat2, lng2] = coord2;
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Analyze a syllable address and provide phonetic alternatives
   */
  analyzeAddress(syllableAddress: string): AddressAnalysis {
    // Validate the original address
    const isValid = this.isValidSyllableAddress(syllableAddress);
    let coordinates: Coordinates | undefined;
    
    if (isValid) {
      try {
        coordinates = this.syllableToCoordinate(syllableAddress);
      } catch {
        // This shouldn't happen if isValid is true, but being safe
      }
    }

    const phoneticAlternatives: PhoneticAlternative[] = [];

    // Only generate alternatives if we have valid coordinates to compare distance
    if (coordinates) {
      // Remove separators for character-by-character analysis
      const cleanAddress = syllableAddress.replace(/[-|]/g, '');
      
      // For each character position, try phonetic substitutions
      for (let i = 0; i < cleanAddress.length; i++) {
        const char = cleanAddress[i];
        const substitutions = this.getValidPhoneticSubstitutions(char);
        
        for (const substitution of substitutions) {
          // Create alternative address
          const altChars = cleanAddress.split('');
          altChars[i] = substitution;
          
          // Reconstruct address with original formatting
          const altAddress = this.reconstructAddressFormat(altChars.join(''), syllableAddress);
          
          // Check if alternative is valid
          if (this.isValidSyllableAddress(altAddress)) {
            try {
              const altCoordinates = this.syllableToCoordinate(altAddress);
              const distance = this.calculateDistanceKm(coordinates, altCoordinates);
              
              phoneticAlternatives.push({
                address: altAddress,
                coordinates: altCoordinates,
                distanceKm: Math.round(distance * 100) / 100, // Round to 2 decimal places
                change: {
                  position: i,
                  from: char,
                  to: substitution
                }
              });
            } catch {
              // Alternative address is not convertible, skip it
            }
          }
        }
      }
    }

    // Sort alternatives by distance (closest first)
    phoneticAlternatives.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      isValid,
      address: syllableAddress,
      coordinates,
      phoneticAlternatives
    };
  }

  /**
   * Reconstruct address format (with separators) from clean character string
   */
  private reconstructAddressFormat(cleanChars: string, originalFormat: string): string {
    let result = '';
    let cleanIndex = 0;
    
    for (let i = 0; i < originalFormat.length; i++) {
      const char = originalFormat[i];
      if (char === '-' || char === '|') {
        result += char;
      } else {
        result += cleanChars[cleanIndex];
        cleanIndex++;
      }
    }
    
    return result;
  }

  /**
   * Estimate location and bounds from a partial syllable address
   */
  estimateLocationFromPartial(partialAddress: string, comprehensive: boolean = false): PartialLocationEstimate {
    try {
      // Parse partial address and validate format
      const parsed = this.parsePartialAddress(partialAddress);
      
      let samplePoints: Coordinates[] = [];
      let bounds: GeographicBounds;
      let center: Coordinates;
      let areaKm2: number;

      if (comprehensive) {
        // Generate sample addresses using comprehensive sampling for the next level
        const sampleAddresses = this.generateComprehensiveSamples(parsed);
        
        // Convert all sample addresses to coordinates
        samplePoints = sampleAddresses.map(addr => this.syllableToCoordinate(addr));
        
        // Calculate bounds from all sample points
        bounds = this.calculateBoundsFromPoints(samplePoints);
        center = this.calculateCenterFromPoints(samplePoints);
        areaKm2 = this.calculateAreaKm2(bounds);
      } else {
        // Original approach: Calculate address range (min and max complete addresses)
        const addressRange = this.calculateAddressRange(parsed);
        
        // Find valid addresses within the range, with smart fallback if initial addresses are invalid
        const validRange = this.findValidAddressRange(addressRange.minAddress, addressRange.maxAddress, parsed.completeSyllables);
        
        // Convert both addresses to coordinates
        const minCoords = this.syllableToCoordinate(validRange.minAddress);
        const maxCoords = this.syllableToCoordinate(validRange.maxAddress);
        samplePoints = [minCoords, maxCoords];
        
        // Calculate geographic bounds and metrics
        bounds = this.calculateGeographicBounds(minCoords, maxCoords);
        center = this.calculateCenter(minCoords, maxCoords);
        areaKm2 = this.calculateAreaKm2(bounds);
      }
      const confidence = this.calculateConfidence(parsed);
      
      // Get suggested refinements (next possible syllables)
      const suggestedRefinements = this.getSuggestedRefinements(parsed);
      
      const completenessLevel = parsed.completeSyllables.length + (parsed.partialConsonant ? 0.5 : 0);
      
      return {
        centerCoordinate: center,
        bounds,
        confidence,
        estimatedAreaKm2: areaKm2,
        completenessLevel,
        suggestedRefinements,
        samplePoints: comprehensive ? samplePoints : undefined,
        comprehensiveMode: comprehensive
      };
    } catch (error) {
      if (error instanceof ConversionError) {
        throw error;
      }
      throw new ConversionError(`Partial address estimation failed: ${error instanceof Error ? error.message : String(error)}`);
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
        configName = 'ascii-dnqqwn'; // Default to international config (16 consonants, 5 vowels, 8 syllables)
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
    
    // Process from fine to coarse (right to left, least significant first)
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
    
    // Extract child positions from fine to coarse (right to left)
    for (let pos = this.config.h3_resolution; pos >= 1; pos--) {
      const childPos = remaining % 7;
      hierarchicalArray[pos] = childPos;
      remaining = Math.floor(remaining / 7);
    }
    
    return hierarchicalArray;
  }

  /**
   * Convert Integer Index to Syllable Address
   * Orders syllables from coarse to fine geography (most significant first)
   */
  private integerIndexToSyllableAddress(integerIndex: number): string {
    const totalSyllables = this.config.consonants.length * this.config.vowels.length;
    const addressSpace = totalSyllables ** this.config.address_length;
    
    if (integerIndex < 0 || integerIndex >= addressSpace) {
      throw new Error(`Integer Index ${integerIndex} out of range [0, ${addressSpace})`);
    }
    
    const syllables: string[] = [];
    let remaining = integerIndex;
    
    // Base conversion with geographic ordering (most significant first)
    for (let pos = 0; pos < this.config.address_length; pos++) {
      const syllableIdx = remaining % totalSyllables;
      const syllable = this.indexToSyllable.get(syllableIdx);
      if (!syllable) {
        throw new Error(`Invalid syllable index: ${syllableIdx}`);
      }
      // Add to front so coarse geography appears first
      syllables.unshift(syllable);
      remaining = Math.floor(remaining / totalSyllables);
    }
    
    return this.formatSyllableAddress(syllables);
  }

  /**
   * Format syllable address as concatenated string
   */
  private formatSyllableAddress(syllables: string[]): string {
    return syllables.join('');
  }

  /**
   * Convert Syllable Address to Integer Index
   * Processes syllables from coarse to fine geography (most significant first)
   */
  private syllableAddressToIntegerIndex(syllableAddress: string): number {
    const cleanAddress = syllableAddress.toLowerCase();
    
    // Parse 2-character syllables from concatenated string
    const syllables: string[] = [];
    for (let i = 0; i < cleanAddress.length; i += 2) {
      syllables.push(cleanAddress.substring(i, i + 2));
    }
    
    if (syllables.length !== this.config.address_length) {
      throw new Error(`Address must have ${this.config.address_length} syllables`);
    }
    
    const totalSyllables = this.config.consonants.length * this.config.vowels.length;
    let integerValue = 0;
    
    // Process syllables from right to left (fine to coarse) to match the reversed ordering
    for (let pos = 0; pos < syllables.length; pos++) {
      const syllable = syllables[syllables.length - 1 - pos]; // Process from right to left
      const syllableIndex = this.syllableToIndex.get(syllable);
      if (syllableIndex === undefined) {
        throw new Error(`Unknown syllable: ${syllable}`);
      }
      
      // Use the same base conversion logic as forward direction
      integerValue += syllableIndex * (totalSyllables ** pos);
    }
    
    return integerValue;
  }

  /**
   * Parse partial address into syllables array
   */
  private parsePartialAddress(partialAddress: string): { completeSyllables: string[]; partialConsonant?: string } {
    if (!partialAddress || partialAddress.trim() === '') {
      throw new ConversionError('Partial address cannot be empty');
    }

    const cleanAddress = partialAddress.toLowerCase().trim();
    
    // Parse 2-character syllables from concatenated string
    const syllables: string[] = [];
    for (let i = 0; i < cleanAddress.length; i += 2) {
      syllables.push(cleanAddress.substring(i, i + 2));
    }
    
    if (syllables.length === 0) {
      throw new ConversionError('No valid syllables found in partial address');
    }

    // Check if we have a partial syllable (single character at the end)
    let partialConsonant: string | undefined;
    let completeSyllables = syllables;
    
    const lastSyllable = syllables[syllables.length - 1];
    if (lastSyllable.length === 1) {
      // We have a partial syllable - validate it's a consonant
      if (!this.config.consonants.includes(lastSyllable)) {
        throw new ConversionError(`Invalid partial consonant: ${lastSyllable}. Must be one of: ${this.config.consonants.join(', ')}`);
      }
      partialConsonant = lastSyllable;
      completeSyllables = syllables.slice(0, -1); // Remove the partial syllable from complete ones
      
      // Special case: if only a single consonant was provided with no complete syllables
      if (completeSyllables.length === 0) {
        throw new ConversionError(`Partial address must contain at least one complete syllable. '${partialAddress}' only contains a partial consonant.`);
      }
    }

    if (completeSyllables.length + (partialConsonant ? 1 : 0) >= this.config.address_length) {
      throw new ConversionError(`Partial address cannot have ${completeSyllables.length + (partialConsonant ? 1 : 0)} or more syllables (max: ${this.config.address_length - 1})`);
    }

    // Validate each complete syllable
    for (const syllable of completeSyllables) {
      if (!this.syllableToIndex.has(syllable)) {
        throw new ConversionError(`Invalid syllable: ${syllable}`);
      }
    }

    return { completeSyllables, partialConsonant };
  }

  /**
   * Calculate the range of complete addresses for a partial address
   */
  private calculateAddressRange(parsed: { completeSyllables: string[]; partialConsonant?: string }): { minAddress: string; maxAddress: string } {
    const totalSyllables = parsed.completeSyllables.length + (parsed.partialConsonant ? 1 : 0);
    const remainingSyllables = this.config.address_length - totalSyllables;
    
    if (remainingSyllables < 0) {
      throw new ConversionError('Partial address is already complete or too long');
    }

    // Get min and max syllables for padding
    const { minSyllable, maxSyllable } = this.getMinMaxSyllables();
    
    let minSyllables: string[];
    let maxSyllables: string[];
    
    if (parsed.partialConsonant) {
      // Handle partial consonant: create range from consonant+firstVowel to consonant+lastVowel
      const firstVowel = this.config.vowels[0]; // 'a'
      const lastVowel = this.config.vowels[this.config.vowels.length - 1]; // 'u'
      
      const minPartialSyllable = parsed.partialConsonant + firstVowel;
      const maxPartialSyllable = parsed.partialConsonant + lastVowel;
      
      // Create min address: complete syllables + min partial syllable + padding
      minSyllables = [...parsed.completeSyllables, minPartialSyllable];
      for (let i = 0; i < remainingSyllables; i++) {
        minSyllables.push(minSyllable);
      }
      
      // Create max address: complete syllables + max partial syllable + padding
      maxSyllables = [...parsed.completeSyllables, maxPartialSyllable];
      for (let i = 0; i < remainingSyllables; i++) {
        maxSyllables.push(maxSyllable);
      }
    } else {
      // No partial consonant, handle normally
      minSyllables = [...parsed.completeSyllables];
      for (let i = 0; i < remainingSyllables; i++) {
        minSyllables.push(minSyllable);
      }
      
      maxSyllables = [...parsed.completeSyllables];
      for (let i = 0; i < remainingSyllables; i++) {
        maxSyllables.push(maxSyllable);
      }
    }
    
    return {
      minAddress: this.formatSyllableAddress(minSyllables),
      maxAddress: this.formatSyllableAddress(maxSyllables)
    };
  }

  /**
   * Get the minimum and maximum syllables for the current config
   */
  private getMinMaxSyllables(): { minSyllable: string; maxSyllable: string } {
    const syllables = Array.from(this.syllableToIndex.keys()).sort();
    return {
      minSyllable: syllables[0],
      maxSyllable: syllables[syllables.length - 1]
    };
  }

  /**
   * Calculate geographic bounds from min and max coordinates
   */
  private calculateGeographicBounds(minCoords: Coordinates, maxCoords: Coordinates): GeographicBounds {
    const [minLat, minLon] = minCoords;
    const [maxLat, maxLon] = maxCoords;
    
    return {
      north: Math.max(minLat, maxLat),
      south: Math.min(minLat, maxLat),
      east: Math.max(minLon, maxLon),
      west: Math.min(minLon, maxLon)
    };
  }

  /**
   * Calculate center point from min and max coordinates
   */
  private calculateCenter(minCoords: Coordinates, maxCoords: Coordinates): Coordinates {
    const [minLat, minLon] = minCoords;
    const [maxLat, maxLon] = maxCoords;
    
    return [
      (minLat + maxLat) / 2,
      (minLon + maxLon) / 2
    ];
  }

  /**
   * Calculate area in square kilometers from geographic bounds
   */
  private calculateAreaKm2(bounds: GeographicBounds): number {
    const latDiff = bounds.north - bounds.south;
    const lonDiff = bounds.east - bounds.west;
    
    // Convert to approximate distance in kilometers
    const avgLat = (bounds.north + bounds.south) / 2;
    const latKm = latDiff * 111.32; // ~111.32 km per degree latitude
    const lonKm = lonDiff * 111.32 * Math.cos(avgLat * Math.PI / 180); // Adjust for longitude at this latitude
    
    return latKm * lonKm;
  }

  /**
   * Calculate confidence score based on completeness level
   */
  private calculateConfidence(parsed: { completeSyllables: string[]; partialConsonant?: string }): number {
    // Calculate effective completeness level
    // Complete syllables count as 1.0, partial consonants as 0.5
    const completenessLevel = parsed.completeSyllables.length + (parsed.partialConsonant ? 0.5 : 0);
    
    // Higher completeness = higher confidence
    // Scale from 0.1 (1 syllable) to 0.95 (7 syllables for 8-syllable addresses)
    const maxLevel = this.config.address_length - 1;
    const confidence = 0.1 + (completenessLevel / maxLevel) * 0.85;
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Get suggested refinements (next possible syllables or vowels)
   */
  private getSuggestedRefinements(parsed: { completeSyllables: string[]; partialConsonant?: string }): string[] {
    const totalSyllables = parsed.completeSyllables.length + (parsed.partialConsonant ? 1 : 0);
    
    if (totalSyllables >= this.config.address_length - 1) {
      return []; // Already almost complete, no meaningful refinements
    }
    
    if (parsed.partialConsonant) {
      // For partial consonants, suggest possible vowels to complete the syllable
      return this.config.vowels.map(vowel => parsed.partialConsonant + vowel).sort();
    } else {
      // For complete syllables, suggest all available syllables as potential next options
      return Array.from(this.syllableToIndex.keys()).sort();
    }
  }

  /**
   * Find valid address range with smart fallback when min/max addresses are invalid
   */
  private findValidAddressRange(minAddress: string, maxAddress: string, partialSyllables: string[]): { minAddress: string; maxAddress: string } {
    // First, try the exact range
    const minValid = this.isValidSyllableAddress(minAddress);
    const maxValid = this.isValidSyllableAddress(maxAddress);
    
    if (minValid && maxValid) {
      // Perfect! Both addresses are valid
      return { minAddress, maxAddress };
    }
    
    // If either is invalid, try limited search (10 attempts max to avoid infinite loops)
    const maxAttempts = 10;
    let validMinAddress = minAddress;
    let validMaxAddress = maxAddress;
    
    if (!minValid) {
      let attempts = 0;
      while (!this.isValidSyllableAddress(validMinAddress) && attempts < maxAttempts) {
        validMinAddress = this.incrementAddress(validMinAddress, partialSyllables);
        attempts++;
      }
    }
    
    if (!maxValid) {
      let attempts = 0;
      while (!this.isValidSyllableAddress(validMaxAddress) && attempts < maxAttempts) {
        validMaxAddress = this.decrementAddress(validMaxAddress, partialSyllables);
        attempts++;
      }
    }
    
    // Check if we found valid addresses
    if (this.isValidSyllableAddress(validMinAddress) && this.isValidSyllableAddress(validMaxAddress)) {
      return { minAddress: validMinAddress, maxAddress: validMaxAddress };
    }
    
    // If still no luck, try fallback to shorter prefix
    if (partialSyllables.length > 1) {
      console.warn(`Address range for '${partialSyllables.join('')}' is unmappable, falling back to shorter prefix`);
      const shorterPartial = partialSyllables.slice(0, -1);
      const fallbackRange = this.calculateAddressRange({ completeSyllables: shorterPartial });
      return this.findValidAddressRange(fallbackRange.minAddress, fallbackRange.maxAddress, shorterPartial);
    }
    
    // Last resort: throw error with helpful message
    throw new ConversionError(
      `The partial address '${partialSyllables.join('')}' maps to an unmappable region of the H3 address space. ` +
      `This occurs when syllable combinations don't correspond to valid geographic locations. ` +
      `Try a different partial address or use a shorter prefix.`
    );
  }

  /**
   * Increment address intelligently from left to right with carry-over
   */
  private incrementAddress(address: string, partialSyllables: string[]): string {
    const cleanAddress = address.toLowerCase();
    
    // Parse 2-character syllables from concatenated string
    const syllables: string[] = [];
    for (let i = 0; i < cleanAddress.length; i += 2) {
      syllables.push(cleanAddress.substring(i, i + 2));
    }
    
    const allSyllables = Array.from(this.syllableToIndex.keys()).sort();
    const partialLength = partialSyllables.length;
    
    // Start incrementing from the first syllable after the partial prefix
    for (let i = partialLength; i < syllables.length; i++) {
      const currentSyllable = syllables[i];
      const currentIndex = allSyllables.indexOf(currentSyllable);
      
      if (currentIndex < allSyllables.length - 1) {
        // Can increment this syllable
        syllables[i] = allSyllables[currentIndex + 1];
        // Reset all syllables after this one to min values
        for (let j = i + 1; j < syllables.length; j++) {
          syllables[j] = allSyllables[0];
        }
        break;
      } else {
        // This syllable is at max, continue to next position
        syllables[i] = allSyllables[0];
      }
    }
    
    return this.formatSyllableAddress(syllables);
  }

  /**
   * Decrement address intelligently from left to right with borrow
   */
  private decrementAddress(address: string, partialSyllables: string[]): string {
    const cleanAddress = address.toLowerCase();
    
    // Parse 2-character syllables from concatenated string
    const syllables: string[] = [];
    for (let i = 0; i < cleanAddress.length; i += 2) {
      syllables.push(cleanAddress.substring(i, i + 2));
    }
    
    const allSyllables = Array.from(this.syllableToIndex.keys()).sort();
    const partialLength = partialSyllables.length;
    
    // Start decrementing from the first syllable after the partial prefix
    for (let i = partialLength; i < syllables.length; i++) {
      const currentSyllable = syllables[i];
      const currentIndex = allSyllables.indexOf(currentSyllable);
      
      if (currentIndex > 0) {
        // Can decrement this syllable
        syllables[i] = allSyllables[currentIndex - 1];
        // Reset all syllables after this one to max values
        for (let j = i + 1; j < syllables.length; j++) {
          syllables[j] = allSyllables[allSyllables.length - 1];
        }
        break;
      } else {
        // This syllable is at min, continue to next position
        syllables[i] = allSyllables[allSyllables.length - 1];
      }
    }
    
    return this.formatSyllableAddress(syllables);
  }

  /**
   * Generate sample addresses using comprehensive sampling for all possible syllables at the next level
   */
  private generateComprehensiveSamples(parsed: { completeSyllables: string[]; partialConsonant?: string }): string[] {
    const sampleAddresses: string[] = [];
    const allSyllables = Array.from(this.syllableToIndex.keys());
    
    // Calculate how many syllables we need to complete the address
    // For partial consonants, we count them as taking up one syllable position that needs completion
    const currentCompleteLength = parsed.completeSyllables.length;
    const remainingSyllables = this.config.address_length - currentCompleteLength;
    
    if (remainingSyllables <= 0) {
      throw new ConversionError('Address is already complete or too long for comprehensive sampling');
    }

    if (parsed.partialConsonant) {
      // Handle partial consonant case: try all vowels to complete the syllable
      for (const vowel of this.config.vowels) {
        const completedSyllable = parsed.partialConsonant + vowel;
        const prefix = [...parsed.completeSyllables, completedSyllable];
        
        // Add samples with different completions for remaining syllables
        this.addComprehensiveSamplesForPrefix(prefix, remainingSyllables - 1, sampleAddresses, allSyllables);
      }
    } else {
      // Handle complete syllables case: try all syllables for the next position
      for (const nextSyllable of allSyllables) {
        const prefix = [...parsed.completeSyllables, nextSyllable];
        
        // Add samples with different completions for remaining syllables
        this.addComprehensiveSamplesForPrefix(prefix, remainingSyllables - 1, sampleAddresses, allSyllables);
      }
    }
    
    return sampleAddresses;
  }

  /**
   * Helper method to add sample addresses for a given prefix using comprehensive sampling
   */
  private addComprehensiveSamplesForPrefix(prefix: string[], remainingSyllables: number, sampleAddresses: string[], allSyllables: string[]): void {
    if (remainingSyllables === 0) {
      // Complete address found
      sampleAddresses.push(this.formatSyllableAddress(prefix));
      return;
    }

    // For efficiency, we'll sample strategically rather than generating ALL possible combinations
    // This prevents exponential explosion while still giving good geographic coverage
    const sampleStrategies = [
      () => allSyllables[0], // Min syllable
      () => allSyllables[Math.floor(allSyllables.length / 4)], // 25% point
      () => allSyllables[Math.floor(allSyllables.length / 2)], // Middle
      () => allSyllables[Math.floor(3 * allSyllables.length / 4)], // 75% point
      () => allSyllables[allSyllables.length - 1], // Max syllable
    ];

    // Generate a sample address for each strategy
    for (const getNextSyllable of sampleStrategies) {
      const completion: string[] = [];
      for (let i = 0; i < remainingSyllables; i++) {
        completion.push(getNextSyllable());
      }
      sampleAddresses.push(this.formatSyllableAddress([...prefix, ...completion]));
    }
  }

  /**
   * Calculate geographic bounds from multiple coordinate points
   */
  private calculateBoundsFromPoints(points: Coordinates[]): GeographicBounds {
    if (points.length === 0) {
      throw new ConversionError('Cannot calculate bounds from empty points array');
    }

    let north = points[0][0];
    let south = points[0][0];
    let east = points[0][1];
    let west = points[0][1];

    for (const [lat, lon] of points) {
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      west = Math.min(west, lon);
    }

    return { north, south, east, west };
  }

  /**
   * Calculate center coordinate from multiple points
   */
  private calculateCenterFromPoints(points: Coordinates[]): Coordinates {
    if (points.length === 0) {
      throw new ConversionError('Cannot calculate center from empty points array');
    }

    const avgLat = points.reduce((sum, [lat]) => sum + lat, 0) / points.length;
    const avgLon = points.reduce((sum, [, lon]) => sum + lon, 0) / points.length;

    return [avgLat, avgLon];
  }
}