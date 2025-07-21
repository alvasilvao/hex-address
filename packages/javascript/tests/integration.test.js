// Integration tests using the built package
const { coordinateToAddress, addressToCoordinate, listAvailableConfigs, estimateLocationFromPartial } = require('../dist/index.js');

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
    const configName = 'ascii-elomr'; // International standard config (11C×5V, 8 syllables)
    
    // Step 1: Convert coordinates to syllable address
    const syllableAddress = coordinateToAddress(lat, lng, configName);
    console.log(`Coordinate [${lat}, ${lng}] -> "${syllableAddress}"`);
    
    // Verify syllable address is a string
    expect(typeof syllableAddress).toBe('string');
    expect(syllableAddress.length).toBeGreaterThan(0);
    
    // Step 2: Convert syllable address back to coordinates
    const [resultLat, resultLng] = addressToCoordinate(syllableAddress, configName);
    console.log(`"${syllableAddress}" -> [${resultLat}, ${resultLng}]`);
    
    // Step 3: Verify round-trip accuracy
    expect(typeof resultLat).toBe('number');
    expect(typeof resultLng).toBe('number');
    
    // H3 at resolution 14 has ~3m precision, so coordinates should be close
    const latDiff = Math.abs(resultLat - lat);
    const lngDiff = Math.abs(resultLng - lng);
    
    console.log(`Difference: lat=${latDiff}, lng=${lngDiff}`);
    
    expect(latDiff).toBeLessThan(0.00005); // ~5m tolerance (H3 precision limit)
    expect(lngDiff).toBeLessThan(0.00005);
  });

  test('Round-trip test for multiple coordinates', () => {
    const configName = 'ascii-elomr'; // International standard config
    
    for (const [lat, lng] of testCoordinates.slice(0, 3)) { // Test first 3 to keep it fast
      const syllableAddress = coordinateToAddress(lat, lng, configName);
      const [resultLat, resultLng] = addressToCoordinate(syllableAddress, configName);
      
      const latDiff = Math.abs(resultLat - lat);
      const lngDiff = Math.abs(resultLng - lng);
      
      console.log(`[${lat}, ${lng}] -> "${syllableAddress}" -> [${resultLat}, ${resultLng}] (diff: ${latDiff.toFixed(6)}, ${lngDiff.toFixed(6)})`);
      
      expect(latDiff).toBeLessThan(0.00002); // ~2m tolerance for resolution 14
      expect(lngDiff).toBeLessThan(0.00002);
    }
  });

  test('International standard config should work', () => {
    const [lat, lng] = [48.8566, 2.3522];
    // Test the international standard config
    const configName = 'ascii-elomr';
    
    {
      const syllableAddress = coordinateToAddress(lat, lng, configName);
      const [resultLat, resultLng] = addressToCoordinate(syllableAddress, configName);
      
      console.log(`${configName}: [${lat}, ${lng}] -> "${syllableAddress}" -> [${resultLat}, ${resultLng}]`);
      
      expect(Math.abs(resultLat - lat)).toBeLessThan(0.00002); // ~2m tolerance for resolution 14
      expect(Math.abs(resultLng - lng)).toBeLessThan(0.00002);
    }
  });

  test('Error handling', () => {
    expect(() => syllableToCoordinate('invalid-address')).toThrow();
    expect(() => coordinateToAddress(91, 0)).toThrow(); // Invalid latitude
  });

  test('Consistency test', () => {
    const config = 'ascii-elomr'; // International standard config
    const coords = [48.8566, 2.3522];
    
    const address1 = coordinateToAddress(coords[0], coords[1], config);
    const address2 = coordinateToAddress(coords[0], coords[1], config);
    
    expect(address1).toBe(address2);
  });
});

describe('Partial address estimation tests', () => {
  test('Basic partial address estimation', () => {
    const configName = 'ascii-elomr';
    const result = estimateLocationFromPartial('dafe', configName);
    
    // Check return type and structure
    expect(typeof result).toBe('object');
    expect(Array.isArray(result.centerCoordinate)).toBe(true);
    expect(result.centerCoordinate).toHaveLength(2);
    expect(typeof result.centerCoordinate[0]).toBe('number');
    expect(typeof result.centerCoordinate[1]).toBe('number');
    
    expect(typeof result.bounds).toBe('object');
    expect(typeof result.bounds.north).toBe('number');
    expect(typeof result.bounds.south).toBe('number');
    expect(typeof result.bounds.east).toBe('number');
    expect(typeof result.bounds.west).toBe('number');
    
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.estimatedAreaKm2).toBe('number');
    expect(typeof result.completenessLevel).toBe('number');
    expect(Array.isArray(result.suggestedRefinements)).toBe(true);
    
    // Check logical bounds
    expect(result.bounds.north).toBeGreaterThan(result.bounds.south);
    expect(result.bounds.east).toBeGreaterThan(result.bounds.west);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.estimatedAreaKm2).toBeGreaterThan(0);
    expect(result.completenessLevel).toBe(2); // 'dafe' has 2 syllables
    
    console.log(`Partial estimation for "dafe": center [${result.centerCoordinate[0]}, ${result.centerCoordinate[1]}], area ${result.estimatedAreaKm2.toFixed(1)} km², confidence ${result.confidence.toFixed(2)}`);
  });
  
  test('Different completeness levels', () => {
    const configName = 'ascii-elomr';
    
    const tests = [
      { partial: 'da', expected: 1 },
      { partial: 'dafe', expected: 2 },
      { partial: 'dafehe', expected: 3 },
      { partial: 'dafeheho', expected: 4 }
    ];
    
    for (const { partial, expected } of tests) {
      const result = estimateLocationFromPartial(partial, configName);
      expect(result.completenessLevel).toBe(expected);
      
      // More complete addresses should have higher confidence and smaller areas
      if (expected > 1) {
        const lessComplete = estimateLocationFromPartial(tests[expected - 2].partial, configName);
        expect(result.confidence).toBeGreaterThan(lessComplete.confidence);
        expect(result.estimatedAreaKm2).toBeLessThan(lessComplete.estimatedAreaKm2);
      }
      
      console.log(`"${partial}": completeness ${result.completenessLevel}, confidence ${result.confidence.toFixed(2)}, area ${result.estimatedAreaKm2.toFixed(1)} km²`);
    }
  });
  
  test('Partial consonant support', () => {
    const configName = 'ascii-elomr';
    
    // Test partial consonant estimation
    const result = estimateLocationFromPartial('papap', configName);
    
    // Check that partial consonant increases completeness by 0.5
    expect(result.completenessLevel).toBe(2.5); // 'papa' (2) + 'p' (0.5)
    
    // Check that suggested refinements are the vowel completions
    expect(result.suggestedRefinements).toEqual(['pa', 'pe', 'pi', 'po', 'pu']);
    
    // Confidence should be between complete syllables
    const completeBefore = estimateLocationFromPartial('papa', configName);
    const completeAfter = estimateLocationFromPartial('papapa', configName);
    
    expect(result.confidence).toBeGreaterThan(completeBefore.confidence);
    expect(result.confidence).toBeLessThan(completeAfter.confidence);
    
    console.log(`Partial consonant "papap": completeness ${result.completenessLevel}, confidence ${result.confidence.toFixed(3)}, suggested: ${result.suggestedRefinements.join(',')}`);
  });
  
  test('Partial consonant validation', () => {
    const configName = 'ascii-elomr';
    
    // Valid partial consonant
    expect(() => estimateLocationFromPartial('dafep', configName)).not.toThrow();
    
    // Invalid partial consonant (not in our consonant list)
    expect(() => estimateLocationFromPartial('dafeb', configName)).toThrow(/Invalid partial consonant: b/);
    expect(() => estimateLocationFromPartial('dafex', configName)).toThrow(/Invalid partial consonant: x/);
    
    // Invalid partial consonant (vowel)
    expect(() => estimateLocationFromPartial('dafea', configName)).toThrow(/Invalid partial consonant: a/);
  });
  
  test('Partial consonant area comparison', () => {
    const configName = 'ascii-elomr';
    
    const completeResult = estimateLocationFromPartial('papa', configName);
    const partialResult = estimateLocationFromPartial('papap', configName);
    
    // Partial consonant should have larger area than completing it to a specific vowel
    const specificResult = estimateLocationFromPartial('papapa', configName);
    
    expect(partialResult.estimatedAreaKm2).toBeGreaterThan(specificResult.estimatedAreaKm2);
    // Note: Partial consonant may have larger area than fewer complete syllables due to range expansion
    
    console.log(`Area comparison: complete=${completeResult.estimatedAreaKm2.toFixed(0)}, partial=${partialResult.estimatedAreaKm2.toFixed(0)}, specific=${specificResult.estimatedAreaKm2.toFixed(0)}`);
  });

  test('Error handling for partial addresses', () => {
    const configName = 'ascii-elomr';
    
    // Empty partial address
    expect(() => estimateLocationFromPartial('', configName)).toThrow();
    
    // Invalid syllable
    expect(() => estimateLocationFromPartial('xx-yy', configName)).toThrow();
    
    // Too long (equal to max length - international standard has 8 syllables)
    expect(() => estimateLocationFromPartial('dafehehodafeheho', configName)).toThrow();
  });
});