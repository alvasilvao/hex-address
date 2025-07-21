# Hex Address JavaScript Examples

## 🚀 Quick Start

```typescript
import { coordinateToAddress, addressToCoordinate, isValidAddress } from '@alvarosilva/hex-address';

// Convert GPS coordinates to hex address
const address = coordinateToAddress(48.8566, 2.3522); // Eiffel Tower
console.log(address); // "dinenunukiwufeme"

// Convert back to coordinates
const [lat, lon] = addressToCoordinate(address);
console.log(`${lat.toFixed(6)}, ${lon.toFixed(6)}`); // 48.856602, 2.352198

// Validate an address
const isValid = isValidAddress(address);
console.log(isValid); // true
```

## 📍 Basic Address Operations

### Creating Addresses
```typescript
import { coordinateToAddress } from '@alvarosilva/hex-address';

// Famous landmarks
const eiffelTower = coordinateToAddress(48.8566, 2.3522);
const timesSquare = coordinateToAddress(40.7580, -73.9855);
const sydneyOpera = coordinateToAddress(-33.8568, 151.2153);

console.log('Eiffel Tower:', eiffelTower);
console.log('Times Square:', timesSquare);
console.log('Sydney Opera House:', sydneyOpera);
```

### Converting Back to Coordinates
```typescript
import { addressToCoordinate } from '@alvarosilva/hex-address';

const address = "dinenunukiwufeme";
const [latitude, longitude] = addressToCoordinate(address);

console.log(`Address: ${address}`);
console.log(`Coordinates: ${latitude}, ${longitude}`);
console.log(`Google Maps: https://maps.google.com/?q=${latitude},${longitude}`);
```

## ✅ Address Validation

### Simple Validation
```typescript
import { isValidAddress } from '@alvarosilva/hex-address';

const addresses = [
  "dinenunukiwufeme", // Valid
  "invalidaddress",   // Invalid syllables
  "xy",              // Too short
  ""                 // Empty
];

addresses.forEach(addr => {
  const valid = isValidAddress(addr);
  console.log(`${addr || '(empty)'}: ${valid ? '✅ Valid' : '❌ Invalid'}`);
});
```

### Detailed Validation with Error Messages
```typescript
import { isValidAddress } from '@alvarosilva/hex-address';

function validateWithDetails(address: string) {
  const result = isValidAddress(address, 'ascii-elomr', true);
  
  console.log(`\nValidating: "${address}"`);
  console.log(`Valid: ${result.isValid}`);
  
  if (!result.isValid) {
    console.log('Errors:');
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. [${error.type}] ${error.message}`);
      if (error.suggestions) {
        console.log(`     Suggestions: ${error.suggestions.slice(0, 3).join(', ')}`);
      }
    });
  }
}

// Test with various invalid addresses
validateWithDetails("helloworld");     // Invalid syllables with suggestions
validateWithDetails("di");             // Too short
validateWithDetails("invalidstuff");   // Multiple invalid syllables
```

## 📏 Distance & Geographic Analysis

### Calculate Distance Between Addresses
```typescript
import { calculateDistance, coordinateToAddress } from '@alvarosilva/hex-address';

// Create addresses for two famous landmarks
const eiffelTower = coordinateToAddress(48.8566, 2.3522);
const louvre = coordinateToAddress(48.8606, 2.3376);

const distance = calculateDistance(eiffelTower, louvre);
console.log(`Distance from Eiffel Tower to Louvre: ${distance.toFixed(2)} km`);

// Calculate distances between multiple points
const landmarks = [
  { name: 'Eiffel Tower', address: eiffelTower },
  { name: 'Louvre', address: louvre },
  { name: 'Notre Dame', address: coordinateToAddress(48.8530, 2.3499) }
];

console.log('\nDistances between Paris landmarks:');
for (let i = 0; i < landmarks.length; i++) {
  for (let j = i + 1; j < landmarks.length; j++) {
    const dist = calculateDistance(landmarks[i].address, landmarks[j].address);
    console.log(`${landmarks[i].name} ↔ ${landmarks[j].name}: ${dist.toFixed(2)} km`);
  }
}
```

### Find Nearby Addresses
```typescript
import { findNearbyAddresses, coordinateToAddress } from '@alvarosilva/hex-address';

const centerAddress = coordinateToAddress(48.8566, 2.3522); // Eiffel Tower
const nearby = findNearbyAddresses(centerAddress, 0.5); // Within 500m

console.log(`Found ${nearby.length} addresses within 500m of ${centerAddress}:`);
nearby.slice(0, 10).forEach((item, i) => {
  console.log(`${i + 1}. ${item.address} (${item.distance.toFixed(0)}m away)`);
});
```

### Get Address Bounds
```typescript
import { getAddressBounds } from '@alvarosilva/hex-address';

const address = coordinateToAddress(48.8566, 2.3522);
const bounds = getAddressBounds(address);

console.log(`Bounds for ${address}:`);
console.log(`North: ${bounds.north.toFixed(6)}`);
console.log(`South: ${bounds.south.toFixed(6)}`);
console.log(`East: ${bounds.east.toFixed(6)}`);
console.log(`West: ${bounds.west.toFixed(6)}`);

// Create a bounding box URL for mapping services
const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
console.log(`Bounding box: ${bbox}`);
```

## 🏘️ Address Clustering

### Group Nearby Addresses
```typescript
import { clusterAddresses, coordinateToAddress } from '@alvarosilva/hex-address';

// Create addresses around Paris landmarks
const addresses = [
  coordinateToAddress(48.8566, 2.3522), // Eiffel Tower area
  coordinateToAddress(48.8567, 2.3523), // Very close to Eiffel Tower
  coordinateToAddress(48.8606, 2.3376), // Louvre area
  coordinateToAddress(48.8607, 2.3377), // Very close to Louvre
  coordinateToAddress(48.8530, 2.3499), // Notre Dame area
];

const clusters = clusterAddresses(addresses, 1.0); // Max 1km between addresses

console.log(`Created ${clusters.length} clusters from ${addresses.length} addresses:`);
clusters.forEach((cluster, i) => {
  console.log(`\nCluster ${i + 1}:`);
  console.log(`  Addresses: ${cluster.addresses.length}`);
  console.log(`  Center: ${cluster.center[0].toFixed(4)}, ${cluster.center[1].toFixed(4)}`);
  console.log(`  Addresses: ${cluster.addresses.join(', ')}`);
});
```

## 🛠️ Advanced Configuration

### Using Different Configurations
```typescript
import { 
  coordinateToAddress, 
  listAvailableConfigs, 
  getConfigInfo 
} from '@alvarosilva/hex-address';

// List all available configurations
const configs = listAvailableConfigs();
console.log('Available configurations:', configs);

// Get detailed info about a configuration
const configInfo = getConfigInfo('ascii-elomr');
console.log('\nConfiguration details:');
console.log(`Name: ${configInfo.name}`);
console.log(`Total syllables: ${configInfo.totalSyllables}`);
console.log(`Address length: ${configInfo.addressLength}`);
console.log(`H3 resolution: ${configInfo.h3Resolution}`);
console.log(`Address space: ${configInfo.addressSpace.toLocaleString()}`);

// Use different configurations
const coords = [48.8566, 2.3522];
configs.slice(0, 3).forEach(config => {
  try {
    const address = coordinateToAddress(coords[0], coords[1], config);
    console.log(`${config}: ${address}`);
  } catch (error) {
    console.log(`${config}: Error - ${error.message}`);
  }
});
```

### Creating Custom Systems
```typescript
import { createSystemFromLetters, suggestSystemForLanguage } from '@alvarosilva/hex-address';

// Create a system optimized for a specific language
const intlSystem = suggestSystemForLanguage('international', 0.5);
const address = intlSystem.coordinateToAddress(48.8566, 2.3522);
console.log('International system address:', address);

// Create system from specific letters (if available)
try {
  const customSystem = createSystemFromLetters(['d', 'n', 'q', 'w']);
  console.log('Custom system created successfully');
} catch (error) {
  console.log('Custom system creation not available yet');
}
```

## 🎯 Real-World Use Cases

### Emergency Services Integration
```typescript
import { coordinateToAddress, isValidAddress, analyzeAddress } from '@alvarosilva/hex-address';

function emergencyLocationHandler(latitude: number, longitude: number) {
  // Generate address for emergency dispatch
  const address = coordinateToAddress(latitude, longitude);
  
  console.log('=== Emergency Location ===');
  console.log(`Coordinates: ${latitude}, ${longitude}`);
  console.log(`Hex Address: ${address}`);
  console.log(`Validation: ${isValidAddress(address) ? 'VALID' : 'INVALID'}`);
  
  // Provide phonetic alternatives for radio communication
  const analysis = analyzeAddress(address);
  if (analysis.phoneticAlternatives && analysis.phoneticAlternatives.length > 0) {
    console.log('\nPhonetic alternatives for verification:');
    analysis.phoneticAlternatives.slice(0, 3).forEach((alt, i) => {
      console.log(`${i + 1}. ${alt.address} (${alt.distanceKm.toFixed(0)}m away)`);
    });
  }
}

// Simulate emergency call
emergencyLocationHandler(48.8566, 2.3522);
```

### Delivery & Logistics
```typescript
import { 
  coordinateToAddress, 
  findNearbyAddresses, 
  clusterAddresses,
  calculateDistance 
} from '@alvarosilva/hex-address';

function optimizeDeliveryRoute(deliveryCoordinates: Array<[number, number]>) {
  // Convert coordinates to addresses
  const deliveries = deliveryCoordinates.map((coords, i) => ({
    id: i + 1,
    address: coordinateToAddress(coords[0], coords[1]),
    coordinates: coords
  }));
  
  console.log('=== Delivery Route Optimization ===');
  console.log(`${deliveries.length} delivery points:`);
  
  // Group nearby deliveries
  const clusters = clusterAddresses(
    deliveries.map(d => d.address), 
    2.0 // 2km max distance for same route
  );
  
  console.log(`\nOptimized into ${clusters.length} routes:`);
  clusters.forEach((cluster, i) => {
    console.log(`\nRoute ${i + 1}: ${cluster.addresses.length} stops`);
    console.log(`Center: ${cluster.center[0].toFixed(4)}, ${cluster.center[1].toFixed(4)}`);
    
    // Calculate total route distance (simplified)
    let totalDistance = 0;
    for (let j = 0; j < cluster.addresses.length - 1; j++) {
      totalDistance += calculateDistance(cluster.addresses[j], cluster.addresses[j + 1]);
    }
    console.log(`Estimated route distance: ${totalDistance.toFixed(1)} km`);
  });
}

// Example delivery coordinates (Paris area)
const deliveryPoints: Array<[number, number]> = [
  [48.8566, 2.3522], // Eiffel Tower
  [48.8606, 2.3376], // Louvre
  [48.8530, 2.3499], // Notre Dame
  [48.8738, 2.2950], // Arc de Triomphe
  [48.8584, 2.2945], // Trocadéro
];

optimizeDeliveryRoute(deliveryPoints);
```

### Real Estate & Property Management
```typescript
import { 
  coordinateToAddress, 
  getAddressBounds, 
  findNearbyAddresses 
} from '@alvarosilva/hex-address';

function analyzeProperty(latitude: number, longitude: number) {
  const propertyAddress = coordinateToAddress(latitude, longitude);
  const bounds = getAddressBounds(propertyAddress);
  const nearby = findNearbyAddresses(propertyAddress, 1.0); // 1km radius
  
  console.log('=== Property Analysis ===');
  console.log(`Property Address: ${propertyAddress}`);
  console.log(`Coordinates: ${latitude}, ${longitude}`);
  
  console.log('\nProperty Bounds:');
  console.log(`  NE Corner: ${bounds.north.toFixed(6)}, ${bounds.east.toFixed(6)}`);
  console.log(`  SW Corner: ${bounds.south.toFixed(6)}, ${bounds.west.toFixed(6)}`);
  
  console.log(`\nNearby Properties (within 1km): ${nearby.length}`);
  console.log('Closest properties:');
  nearby.slice(0, 5).forEach((prop, i) => {
    console.log(`  ${i + 1}. ${prop.address} (${(prop.distance * 1000).toFixed(0)}m)`);
  });
  
  // Property density analysis
  const density = nearby.length / (Math.PI * 1 * 1); // properties per km²
  console.log(`\nProperty density: ${density.toFixed(1)} properties/km²`);
  
  return {
    address: propertyAddress,
    bounds,
    nearbyCount: nearby.length,
    density
  };
}

// Analyze a property in Paris
analyzeProperty(48.8566, 2.3522);
```

## 🔧 Error Handling Best Practices

```typescript
import { coordinateToAddress, addressToCoordinate, isValidAddress } from '@alvarosilva/hex-address';

function safeCoordinateToAddress(lat: number, lon: number): string | null {
  try {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Invalid coordinates');
    }
    
    return coordinateToAddress(lat, lon);
  } catch (error) {
    console.error('Failed to convert coordinates:', error.message);
    return null;
  }
}

function safeAddressToCoordinate(address: string): [number, number] | null {
  try {
    // First validate the address
    if (!isValidAddress(address)) {
      // Get detailed validation info
      const validation = isValidAddress(address, 'ascii-elomr', true);
      console.error('Invalid address:', validation.errors);
      return null;
    }
    
    return addressToCoordinate(address);
  } catch (error) {
    console.error('Failed to convert address:', error.message);
    return null;
  }
}

// Example usage with error handling
const coords = safeCoordinateToAddress(48.8566, 2.3522);
if (coords) {
  console.log('Generated address:', coords);
  
  const backToCoords = safeAddressToCoordinate(coords);
  if (backToCoords) {
    console.log('Round-trip successful:', backToCoords);
  }
}
```

## 🧪 Testing Your Integration

```typescript
import { 
  coordinateToAddress, 
  addressToCoordinate, 
  calculateDistance 
} from '@alvarosilva/hex-address';

function testRoundTripAccuracy() {
  const testPoints = [
    [48.8566, 2.3522],  // Paris
    [40.7580, -73.9855], // New York
    [-33.8568, 151.2153], // Sydney
    [35.6762, 139.6503], // Tokyo
  ];
  
  console.log('=== Round-trip Accuracy Test ===');
  
  testPoints.forEach(([lat, lon], i) => {
    const address = coordinateToAddress(lat, lon);
    const [newLat, newLon] = addressToCoordinate(address);
    const error = calculateDistance(
      coordinateToAddress(lat, lon),
      coordinateToAddress(newLat, newLon)
    );
    
    console.log(`Test ${i + 1}:`);
    console.log(`  Original: ${lat}, ${lon}`);
    console.log(`  Address: ${address}`);
    console.log(`  Converted: ${newLat.toFixed(6)}, ${newLon.toFixed(6)}`);
    console.log(`  Error: ${(error * 1000).toFixed(1)}m`);
    console.log('');
  });
}

testRoundTripAccuracy();
```

---

## 📚 Next Steps

- Check out the [API Reference](README.md) for complete function documentation
- See [VALIDATION_FEATURES.md](VALIDATION_FEATURES.md) for detailed validation information
- Read [LOCATION_SYSTEMS_COMPARISON.md](LOCATION_SYSTEMS_COMPARISON.md) to understand how hex-address compares to other systems
- Visit our [GitHub repository](https://github.com/alvasilvao/hex-address) for more examples and community contributions

## 🤝 Contributing

Found a useful example? [Submit a PR](https://github.com/alvasilvao/hex-address/pulls) to help other developers!