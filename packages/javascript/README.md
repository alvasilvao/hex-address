# Hex Address - JavaScript/TypeScript Package

[![npm version](https://badge.fury.io/js/@alvarosilva/hex-address.svg)](https://badge.fury.io/js/@alvarosilva/hex-address)
[![Node.js 16+](https://img.shields.io/badge/node-16%2B-brightgreen.svg)](https://nodejs.org/en/download/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert GPS coordinates to memorable hex addresses like `dinenunukiwufeme` with ~0.5 meter precision using H3 spatial indexing.

## 🚀 Quick Start

```bash
npm install @alvarosilva/hex-address
```

### JavaScript (ES6+)
```javascript
import { coordinateToAddress, addressToCoordinate, isValidAddress } from '@alvarosilva/hex-address';

// Convert coordinates to hex address
const address = coordinateToAddress(48.8566, 2.3522);
console.log(address); // "dinenunukiwufeme"

// Convert back to coordinates
const [lat, lon] = addressToCoordinate(address);
console.log(`${lat.toFixed(6)}, ${lon.toFixed(6)}`); // 48.856602, 2.352198

// Validate addresses
const isValid = isValidAddress(address);
console.log(isValid); // true
```

### TypeScript
```typescript
import { 
  H3SyllableSystem, 
  coordinateToAddress,
  isValidAddress,
  ValidationResult
} from '@alvarosilva/hex-address';

// Type-safe coordinate conversion
const coords: [number, number] = [48.8566, 2.3522];
const address: string = coordinateToAddress(...coords);

// Advanced validation with error details
const validation: ValidationResult = isValidAddress(address, 'ascii-dnqqwn', true);
if (!validation.isValid) {
  validation.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
    if (error.suggestions) {
      console.log(`Suggestions: ${error.suggestions.join(', ')}`);
    }
  });
}
```

### CommonJS
```javascript
const { coordinateToAddress, addressToCoordinate } = require('@alvarosilva/hex-address');

const address = coordinateToAddress(48.8566, 2.3522);
console.log(address); // "dinenunukiwufeme"
```

## 📋 Features

### Core Features
- **Sub-meter precision** (~0.5m) using H3 Level 15
- **Memorable addresses** using pronounceable syllables
- **Perfect reversibility** for all real coordinates
- **TypeScript support** with full type definitions
- **Comprehensive validation** with intelligent error messages
- **Phonetic suggestions** for misheard/misspelled addresses

### Geographic Analysis (New in v1.3.0!)
- **Distance calculation** between addresses
- **Nearby address search** within radius
- **Address clustering** for route optimization
- **Geographic bounds** calculation
- **Spatial utilities** for location-based applications

### Technical Features
- **Pure ASCII** letters for universal compatibility
- **Multiple configurations** optimized for different languages
- **Dual package** (ESM and CommonJS)
- **Browser compatible** with polyfills
- **Comprehensive error handling**

## 🎯 New Utility Functions (v1.3.0)

### Distance & Location Analysis
```javascript
import { 
  calculateDistance, 
  findNearbyAddresses, 
  getAddressBounds,
  clusterAddresses 
} from '@alvarosilva/hex-address';

// Calculate distance between two addresses
const distance = calculateDistance("addr1", "addr2");
console.log(`Distance: ${distance.toFixed(2)} km`);

// Find addresses within radius
const nearby = findNearbyAddresses("centerAddress", 1.0); // 1km radius
console.log(`Found ${nearby.length} nearby addresses`);

// Get geographic bounds for an address
const bounds = getAddressBounds("address");
console.log(`Bounds: ${bounds.north}, ${bounds.south}, ${bounds.east}, ${bounds.west}`);

// Cluster addresses for route optimization
const clusters = clusterAddresses(["addr1", "addr2", "addr3"], 0.5); // 500m max distance
console.log(`Organized into ${clusters.length} clusters`);
```

### Enhanced Validation (v1.3.0)
```javascript
// Simple validation
const isValid = isValidAddress("dinenunukiwufeme"); // returns boolean

// Detailed validation with phonetic suggestions
const result = isValidAddress("helloworld", "ascii-dnqqwn", true);
if (!result.isValid) {
  result.errors.forEach(error => {
    console.log(`[${error.type}] ${error.message}`);
    if (error.suggestions) {
      console.log(`Try: ${error.suggestions.slice(0, 3).join(', ')}`);
    }
  });
}
```

## 🌍 Use Cases

- **Emergency Services**: Share precise locations with phonetic alternatives for radio communication
- **Delivery & Logistics**: Route optimization with address clustering
- **Real Estate**: Property analysis with nearby location search
- **Gaming**: Location-based mechanics with memorable addresses
- **Navigation**: User-friendly waypoint system
- **International**: Cross-language compatibility with ASCII addresses

## 🛠️ API Reference

### Coordinate Conversion
```typescript
// Convert coordinates to address
coordinateToAddress(latitude: number, longitude: number, configName?: string): string

// Convert address to coordinates  
addressToCoordinate(address: string, configName?: string): [number, number]
```

### Validation
```typescript
// Simple validation (returns boolean)
isValidAddress(address: string, configName?: string): boolean

// Detailed validation (returns ValidationResult with errors/suggestions)
isValidAddress(address: string, configName: string, detailed: true): ValidationResult
```

### Geographic Analysis
```typescript
// Calculate distance between addresses
calculateDistance(address1: string, address2: string, configName?: string): number

// Find nearby addresses within radius
findNearbyAddresses(
  centerAddress: string, 
  radiusKm: number, 
  configName?: string
): Array<{address: string, distance: number, coordinates: [number, number]}>

// Get geographic bounds for address
getAddressBounds(address: string, configName?: string): GeographicBounds

// Cluster addresses by proximity
clusterAddresses(
  addresses: string[], 
  maxDistanceKm: number, 
  configName?: string
): Array<{addresses: string[], center: [number, number], bounds: GeographicBounds}>
```

### Advanced Analysis
```typescript
// Get partial location estimates
estimateLocationFromPartial(
  partialAddress: string, 
  configName?: string, 
  comprehensive?: boolean
): PartialLocationEstimate

// Analyze address with phonetic alternatives
analyzeAddress(address: string, configName?: string): AddressAnalysis
```

### Configuration Management
```typescript
// List available configurations
listAvailableConfigs(): string[]

// Get configuration details
getConfigInfo(configName: string): ConfigInfo

// Find configs by letters
findConfigsByLetters(letters: string[]): string[]

// System optimization
suggestSystemForLanguage(language?: string, precisionMeters?: number): H3SyllableSystem
```

### H3SyllableSystem Class
```typescript
const system = new H3SyllableSystem(configName?: string);

// Core methods
system.coordinateToAddress(lat: number, lon: number): string
system.addressToCoordinate(address: string): [number, number]
system.isValidAddress(address: string, detailed?: boolean): boolean | ValidationResult

// Analysis methods  
system.analyzeAddress(address: string): AddressAnalysis
system.estimateLocationFromPartial(partial: string, comprehensive?: boolean): PartialLocationEstimate

// System information
system.getSystemInfo(): SystemInfo
system.getConfig(): SyllableConfig
system.clearCache(): void
```

## 🎯 Configuration Options

Choose from multiple configurations optimized for different languages and use cases:

```javascript
// Default configuration (21 consonants, 5 vowels)
const system = new H3SyllableSystem('ascii-dnqqwn'); // Default

// Japanese-friendly (no L/R confusion)
const system2 = new H3SyllableSystem('ascii-fqwclj');

// List all available configurations
import { listAvailableConfigs, getConfigInfo } from '@alvarosilva/hex-address';

const configs = listAvailableConfigs();
configs.forEach(config => {
  const info = getConfigInfo(config);
  console.log(`${config}: ${info.totalSyllables} syllables, ${info.addressLength} length`);
});
```

## 🔬 Technical Details

- **Precision**: ~0.5 meter accuracy (H3 Resolution 15)
- **Coverage**: Global coverage with 122 × 7^15 ≈ 579 trillion addresses
- **Performance**: Optimized with caching and efficient algorithms
- **Memory**: Minimal footprint with configurable cache limits
- **Browser Support**: Works in all modern browsers with polyfills

### Geographic Similarity

Nearby locations share address prefixes, making addresses intuitive:

```javascript
// Coordinates ~75m apart in Paris
coordinateToAddress(48.8566, 2.3522); // "dinenunukiwufeme"
coordinateToAddress(48.8567, 2.3523); // "dinenunukiwufene"
//                                     ^^^^^^^^^^^^^^^ shared prefix (93%)
```

## 📖 Examples & Documentation

- **[Complete Examples](EXAMPLES.md)** - Real-world use cases and code samples
- **[Validation Guide](VALIDATION_FEATURES.md)** - Detailed validation and error handling
- **[System Comparison](LOCATION_SYSTEMS_COMPARISON.md)** - How hex-address compares to What3Words, Plus Codes, etc.

## 🧪 Testing Your Integration

```javascript
import { coordinateToAddress, addressToCoordinate, calculateDistance } from '@alvarosilva/hex-address';

// Test round-trip accuracy
function testAccuracy(lat, lon) {
  const address = coordinateToAddress(lat, lon);
  const [newLat, newLon] = addressToCoordinate(address);
  const error = calculateDistance(
    coordinateToAddress(lat, lon),
    coordinateToAddress(newLat, newLon)
  );
  
  console.log(`Original: ${lat}, ${lon}`);
  console.log(`Address: ${address}`);
  console.log(`Converted: ${newLat}, ${newLon}`);
  console.log(`Error: ${(error * 1000).toFixed(1)}m`);
}

testAccuracy(48.8566, 2.3522); // Test with Eiffel Tower coordinates
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run linting  
npm run lint

# Type checking
npm run type-check
```

## 📦 Package Information

- **Size**: ~50KB minified
- **Dependencies**: h3-js only
- **Node.js**: 16+ required
- **Browser**: Modern browsers with ES2020 support
- **TypeScript**: Full type definitions included

## 🆕 What's New in v1.3.0

- ✅ **Enhanced Validation**: Detailed error messages with phonetic suggestions
- ✅ **Geographic Utilities**: Distance calculation, nearby search, clustering
- ✅ **Better Error Handling**: Comprehensive validation with specific error types
- ✅ **Phonetic Suggestions**: 54 phonetic confusion patterns for voice applications
- ✅ **Performance Improvements**: Optimized algorithms and caching
- ✅ **Complete Documentation**: Extensive examples and guides

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Need help?** Check out our [Examples](EXAMPLES.md) or [open an issue](https://github.com/alvasilvao/hex-address/issues) on GitHub.