// Test script for new utility functions
const { 
  coordinateToAddress,
  calculateDistance, 
  findNearbyAddresses, 
  getAddressBounds, 
  clusterAddresses 
} = require('./dist/index.js');

console.log('=== Testing New Utility Functions ===\n');

// Test coordinates (Eiffel Tower area)
const lat = 48.8566;
const lon = 2.3522;
const address = coordinateToAddress(lat, lon);
console.log(`Test address: ${address}`);
console.log(`Coordinates: ${lat}, ${lon}\n`);

// Test 1: Distance calculation
console.log('1. Testing distance calculation:');
const address2 = coordinateToAddress(48.8570, 2.3525); // Slightly different location
const distance = calculateDistance(address, address2);
console.log(`   Distance between ${address} and ${address2}: ${distance.toFixed(3)} km\n`);

// Test 2: Address bounds
console.log('2. Testing address bounds:');
const bounds = getAddressBounds(address);
console.log(`   Bounds for ${address}:`);
console.log(`   North: ${bounds.north.toFixed(6)}, South: ${bounds.south.toFixed(6)}`);
console.log(`   East: ${bounds.east.toFixed(6)}, West: ${bounds.west.toFixed(6)}\n`);

// Test 3: Nearby addresses (small radius for testing)
console.log('3. Testing nearby addresses:');
try {
  const nearby = findNearbyAddresses(address, 0.1); // 100m radius
  console.log(`   Found ${nearby.length} nearby addresses within 100m:`);
  nearby.slice(0, 5).forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.address}: ${item.distance.toFixed(3)}km`);
  });
} catch (error) {
  console.log(`   Error finding nearby addresses: ${error.message}`);
}
console.log('');

// Test 4: Address clustering
console.log('4. Testing address clustering:');
const testAddresses = [
  address,
  coordinateToAddress(48.8567, 2.3523),
  coordinateToAddress(48.8568, 2.3524),
  coordinateToAddress(48.8580, 2.3540) // Further away
];

try {
  const clusters = clusterAddresses(testAddresses, 0.5); // 500m max distance
  console.log(`   Created ${clusters.length} clusters from ${testAddresses.length} addresses:`);
  clusters.forEach((cluster, i) => {
    console.log(`   Cluster ${i + 1}: ${cluster.addresses.length} addresses`);
    console.log(`   Center: ${cluster.center[0].toFixed(6)}, ${cluster.center[1].toFixed(6)}`);
  });
} catch (error) {
  console.log(`   Error clustering addresses: ${error.message}`);
}

console.log('\n=== Utility Functions Test Complete ===');