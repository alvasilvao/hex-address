# Hex Address - JavaScript/TypeScript Package

[![npm version](https://badge.fury.io/js/hex-address.svg)](https://badge.fury.io/js/hex-address)
[![Node.js 16+](https://img.shields.io/badge/node-16%2B-brightgreen.svg)](https://nodejs.org/en/download/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert GPS coordinates to memorable syllable addresses like `je-ma-su-cu|du-ve-gu-ba` with ~0.5 meter precision using spatially optimized H3 indexing.

## 🚀 Quick Start

```bash
npm install hex-address
```

### JavaScript (ES6+)
```javascript
import { H3SyllableSystem, isValidSyllableAddress } from 'hex-address';

// Initialize system (uses default ascii-fqwfmd config)
const system = new H3SyllableSystem();

// Convert coordinates to syllable address
const address = system.coordinateToSyllable(48.8566, 2.3522);
console.log(address); // "je-ma-su-cu|du-ve-gu-ba"

// Convert back to coordinates
const [lat, lon] = system.syllableToCoordinate(address);
console.log(`${lat.toFixed(6)}, ${lon.toFixed(6)}`); // 48.856602, 2.352198

// Validate addresses (some combinations don't exist)
if (system.isValidSyllableAddress(address)) {
    console.log('Valid address!');
}
```

### TypeScript
```typescript
import { 
    H3SyllableSystem, 
    Coordinates, 
    SyllableConfig 
} from 'hex-address';

const system = new H3SyllableSystem();

// Type-safe coordinate conversion
const coords: Coordinates = [48.8566, 2.3522];
const address: string = system.coordinateToSyllable(...coords);

// Get configuration details
const config: SyllableConfig = system.getConfig();
console.log(`Using ${config.consonants.length} consonants, ${config.vowels.length} vowels`);
```

### CommonJS
```javascript
const { H3SyllableSystem } = require('hex-address');

const system = new H3SyllableSystem();
const address = system.coordinateToSyllable(48.8566, 2.3522);
console.log(address); // "je-ma-su-cu|du-ve-gu-ba"
```

## 📋 Features

- **Sub-meter precision** (~0.5m) using H3 Level 15
- **Spatially optimized** with perfect Hamiltonian path (100% adjacency)
- **Memorable addresses** using pronounceable syllables
- **Perfect reversibility** for all real coordinates
- **Dynamic formatting** with pipe separators for readability
- **Multiple configurations** optimized for different use cases
- **Pure ASCII** letters for universal compatibility
- **TypeScript support** with full type definitions
- **Dual package** (ESM and CommonJS)

## 🎯 Configuration Options

Choose from multiple configurations based on your needs:

```javascript
// Full ASCII alphabet (21 consonants, 5 vowels, 8 syllables)
const system = new H3SyllableSystem('ascii-fqwfmd'); // Default

// Minimal balanced (10 consonants, 5 vowels, 9 syllables) 
const system2 = new H3SyllableSystem('ascii-cjbnb');

// Japanese-friendly (no L/R confusion)
const system3 = new H3SyllableSystem('ascii-fqwclj');

// List all available configurations
import { listConfigs } from 'hex-address';
console.log(listConfigs());
```

## 🌍 Use Cases

- **Emergency services**: Share precise locations memorably
- **Logistics**: Human-friendly delivery addresses  
- **Gaming**: Location-based game mechanics
- **International**: Cross-language location sharing with ASCII compatibility
- **Web apps**: User-friendly coordinate system
- **Navigation**: Easy-to-communicate waypoints

## 🔬 Technical Details

- **Precision**: ~0.5 meter accuracy (H3 Resolution 15)
- **Coverage**: 122 × 7^15 = 579,202,504,213,046 H3 positions
- **Constraint**: max_consecutive = 1 (no adjacent identical syllables)
- **Spatial optimization**: 100% adjacency through Hamiltonian path
- **Performance**: ~6,700 conversions/second

## 🛠️ API Reference

### Main Classes

#### `H3SyllableSystem`
```typescript
constructor(configName?: string)
coordinateToSyllable(latitude: number, longitude: number): string
syllableToCoordinate(syllableAddress: string): Coordinates
isValidSyllableAddress(syllableAddress: string): boolean
testRoundTrip(latitude: number, longitude: number): RoundTripResult
getSystemInfo(): SystemInfo
clearCache(): void
```

### Convenience Functions

```typescript
coordinateToSyllable(lat: number, lon: number, config?: string): string
syllableToCoordinate(address: string, config?: string): Coordinates
isValidSyllableAddress(address: string, config?: string): boolean
```

### Available Configurations

Current ASCII-based configurations:

- **ascii-fqwfmd**: Full ASCII alphabet (default)
- **ascii-jaxqt**: Common typing letters
- **ascii-fqwclj**: No L (Japanese-friendly)
- **ascii-fqsmnn**: No Q (Spanish-friendly) 
- **ascii-cjbnb**: Minimal balanced
- **ascii-dsyp**: Minimal compact

### Types

```typescript
type Coordinates = [number, number];

interface SyllableConfig {
  name: string;
  consonants: string[];
  vowels: string[];
  address_length: number;
  max_consecutive: number;
  h3_resolution: number;
}

interface RoundTripResult {
  success: boolean;
  originalCoordinates: Coordinates;
  syllableAddress: string;
  resultCoordinates: Coordinates;
  distanceErrorMeters: number;
  precise: boolean;
}
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

## 📖 Documentation

For complete documentation, architecture details, and research background, visit the [main repository](https://github.com/alvasilvao/hex-address).

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.