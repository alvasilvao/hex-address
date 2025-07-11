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