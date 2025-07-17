/**
 * Browser-optimized entry point for hex-address
 * Excludes Node.js specific features for smaller bundle size
 */

// Core functions
export {
  coordinateToAddress,
  addressToCoordinate,
  isValidAddress,
  analyzeAddress,
  estimateLocationFromPartial,
  H3SyllableSystem
} from './index';

// Geographic utilities
export {
  calculateDistance,
  findNearbyAddresses,
  getAddressBounds,
  clusterAddresses
} from './index';

// Core utilities only - no batch operations

// Configuration functions
export {
  listAvailableConfigs,
  getConfigInfo,
  findConfigsByLetters
} from './index';

// Types
export type {
  Coordinates,
  ValidationResult,
  ValidationError,
  ValidationErrorType,
  AddressAnalysis,
  PhoneticAlternative,
  GeographicBounds,
  PartialLocationEstimate,
  SyllableConfig,
  SystemInfo
} from './types';

// Browser-specific utilities
export function createWorkerScript(): string {
  return `
    // Import hex-address library
    importScripts('https://unpkg.com/@alvarosilva/hex-address@latest/dist/index.browser.js');
    
    self.onmessage = function(e) {
      const { type, data } = e.data;
      
      try {
        switch (type) {
          case 'coordinateToAddress':
            const address = HexAddress.coordinateToAddress(data.lat, data.lon, data.configName);
            self.postMessage({ type: 'result', data: address });
            break;
            
          case 'addressToCoordinate':
            const coords = HexAddress.addressToCoordinate(data.address, data.configName);
            self.postMessage({ type: 'result', data: coords });
            break;
            
          case 'calculateDistance':
            const distance = HexAddress.calculateDistance(data.addr1, data.addr2, data.configName);
            self.postMessage({ type: 'result', data: distance });
            break;
            
          case 'isValidAddress':
            const result = HexAddress.isValidAddress(data.address, data.configName, data.detailed);
            self.postMessage({ type: 'result', data: result });
            break;
            
          default:
            throw new Error(\`Unknown operation: \${type}\`);
        }
      } catch (error) {
        self.postMessage({ 
          type: 'error', 
          data: error.message 
        });
      }
    };
  `;
}

export function createWebWorker(): Worker {
  const workerScript = createWorkerScript();
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// Package metadata
export const version = '1.3.0';
export const author = 'Álvaro Silva';
export const license = 'MIT';
export const description = 'Convert GPS coordinates to memorable hex addresses - Browser optimized';