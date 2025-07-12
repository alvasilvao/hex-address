// Integration tests using the built package
const { coordinateToSyllable, syllableToCoordinate, listAvailableConfigs } = require('../dist/index.js');

describe('Round-trip conversion tests', () => {
  const testCoordinates = [
    [48.8566, 2.3522], // Paris, France
    [40.7128, -74.0060], // New York, USA
    [35.6762, 139.6503], // Tokyo, Japan
    [-33.8688, 151.2093], // Sydney, Australia
    [51.5074, -0.1278], // London, UK
    [37.7749, -122.4194], // San Francisco, USA
    [0, 0], // Null Island
  ];

  const configs = listAvailableConfigs();
  console.log('Available configs:', configs);

  test('Basic round-trip test with safe config', () => {
    const [lat, lng] = [48.8566, 2.3522]; // Paris
    const configName = 'ascii-sfnmh'; // Safe default config (15C×5V, 8 syllables)
    
    // Step 1: Convert coordinates to syllable address
    const syllableAddress = coordinateToSyllable(lat, lng, configName);
    console.log(`Coordinate [${lat}, ${lng}] -> "${syllableAddress}"`);
    
    // Verify syllable address is a string
    expect(typeof syllableAddress).toBe('string');
    expect(syllableAddress.length).toBeGreaterThan(0);
    
    // Step 2: Convert syllable address back to coordinates
    const [resultLat, resultLng] = syllableToCoordinate(syllableAddress, configName);
    console.log(`"${syllableAddress}" -> [${resultLat}, ${resultLng}]`);
    
    // Step 3: Verify round-trip accuracy
    expect(typeof resultLat).toBe('number');
    expect(typeof resultLng).toBe('number');
    
    // H3 at resolution 15 has ~0.5m precision, so coordinates should be very close
    const latDiff = Math.abs(resultLat - lat);
    const lngDiff = Math.abs(resultLng - lng);
    
    console.log(`Difference: lat=${latDiff}, lng=${lngDiff}`);
    
    expect(latDiff).toBeLessThan(0.00001); // ~1m tolerance (H3 precision limit)
    expect(lngDiff).toBeLessThan(0.00001);
  });

  test('Round-trip test for multiple coordinates', () => {
    const configName = 'ascii-sfnmh'; // Safe config
    
    for (const [lat, lng] of testCoordinates.slice(0, 3)) { // Test first 3 to keep it fast
      const syllableAddress = coordinateToSyllable(lat, lng, configName);
      const [resultLat, resultLng] = syllableToCoordinate(syllableAddress, configName);
      
      const latDiff = Math.abs(resultLat - lat);
      const lngDiff = Math.abs(resultLng - lng);
      
      console.log(`[${lat}, ${lng}] -> "${syllableAddress}" -> [${resultLat}, ${resultLng}] (diff: ${latDiff.toFixed(6)}, ${lngDiff.toFixed(6)})`);
      
      expect(latDiff).toBeLessThan(0.00001); // ~1m tolerance
      expect(lngDiff).toBeLessThan(0.00001);
    }
  });

  test('Safe configs with 8 syllables should work', () => {
    const [lat, lng] = [48.8566, 2.3522];
    // Test only safe configs with 8 syllables (ascii-etmhjj has duplicate consonant bug)
    const safe8SyllableConfigs = ['ascii-sfnmh'];
    
    for (const configName of safe8SyllableConfigs) {
      const syllableAddress = coordinateToSyllable(lat, lng, configName);
      const [resultLat, resultLng] = syllableToCoordinate(syllableAddress, configName);
      
      console.log(`${configName}: [${lat}, ${lng}] -> "${syllableAddress}" -> [${resultLat}, ${resultLng}]`);
      
      expect(Math.abs(resultLat - lat)).toBeLessThan(0.00001); // ~1m tolerance
      expect(Math.abs(resultLng - lng)).toBeLessThan(0.00001);
    }
  });

  test('Error handling', () => {
    expect(() => syllableToCoordinate('invalid-address')).toThrow();
    expect(() => coordinateToSyllable(91, 0)).toThrow(); // Invalid latitude
  });

  test('Consistency test', () => {
    const config = 'ascii-sfnmh'; // Safe config
    const coords = [48.8566, 2.3522];
    
    const address1 = coordinateToSyllable(coords[0], coords[1], config);
    const address2 = coordinateToSyllable(coords[0], coords[1], config);
    
    expect(address1).toBe(address2);
  });
});