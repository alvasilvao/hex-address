/**
 * Configuration metadata
 */
export interface ConfigMetadata {
  alphabet: string;
  base26_identifier: string;
  binary_array: number[];
  selected_letters: string[];
  auto_generated: boolean;
  generation_method: string;
  total_syllables: number;
  total_combinations: number;
  h3_target_space: number;
  coverage_ratio: number;
  coverage_multiple: string;
}

/**
 * Configuration for syllable system
 */
export interface SyllableConfig {
  name: string;
  description: string;
  consonants: string[];
  vowels: string[];
  address_length: number;
  max_consecutive: number;
  h3_resolution: number;
  metadata?: ConfigMetadata;
}

/**
 * GPS coordinates (latitude, longitude)
 */
export type Coordinates = [number, number];

/**
 * Result from round-trip testing
 */
export interface RoundTripResult {
  success: boolean;
  originalCoordinates: Coordinates;
  syllableAddress: string;
  resultCoordinates: Coordinates;
  distanceErrorMeters: number;
  precise: boolean;
}

/**
 * System information and statistics
 */
export interface SystemInfo {
  h3Resolution: number;
  totalH3Cells: number;
  consonants: string[];
  vowels: string[];
  totalSyllables: number;
  addressLength: number;
  addressSpace: number;
  coveragePercentage: number;
  precisionMeters: number;
}

/**
 * Geographic bounds
 */
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Result from partial address location estimation
 */
export interface PartialLocationEstimate {
  centerCoordinate: Coordinates;
  bounds: GeographicBounds;
  confidence: number;
  estimatedAreaKm2: number;
  completenessLevel: number;
  suggestedRefinements?: string[];
}

/**
 * Custom error class for H3 syllable system errors
 */
export class H3SyllableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'H3SyllableError';
  }
}

/**
 * Error thrown when coordinate/syllable conversion fails
 */
export class ConversionError extends H3SyllableError {
  constructor(message: string) {
    super(message);
    this.name = 'ConversionError';
  }
}