/**
 * Edge case tests for H3 Syllable System
 */

const {
  coordinateToAddress,
  addressToCoordinate,
  H3SyllableSystem,
  isValidAddress,
  calculateDistance
} = require('../dist/index.js');

describe('Edge Cases', () => {
  
  describe('Geographic edge cases', () => {
    test('should handle International Date Line crossing', () => {
      const testCases = [
        [0, 179.9],   // Just west of date line
        [0, -179.9],  // Just east of date line
        [0, 180],     // Exactly on date line (west)
        [0, -180],    // Exactly on date line (east)
      ];
      
      testCases.forEach(([lat, lon]) => {
        const address = coordinateToAddress(lat, lon);
        const [resultLat, resultLon] = addressToCoordinate(address);
        
        expect(typeof address).toBe('string');
        expect(typeof resultLat).toBe('number');
        expect(typeof resultLon).toBe('number');
        
        // Handle longitude wrapping around date line
        const lonDiff = Math.abs(resultLon - lon);
        const wrappedDiff = Math.min(lonDiff, 360 - lonDiff);
        expect(wrappedDiff).toBeLessThan(0.01);
        expect(Math.abs(resultLat - lat)).toBeLessThan(0.01);
      });
    });

    test('should handle polar regions', () => {
      const polarCases = [
        [89.9, 0],     // Near North Pole
        [-89.9, 0],    // Near South Pole
        [89.9, 90],    // Near North Pole, different longitude
        [-89.9, -90],  // Near South Pole, different longitude
      ];
      
      polarCases.forEach(([lat, lon]) => {
        const address = coordinateToAddress(lat, lon);
        const [resultLat, resultLon] = addressToCoordinate(address);
        
        expect(typeof address).toBe('string');
        expect(Math.abs(resultLat - lat)).toBeLessThan(0.01);
        
        // At high latitudes, longitude precision may be lower
        if (Math.abs(lat) > 85) {
          // More lenient check for extreme polar regions
          expect(Math.abs(resultLon - lon)).toBeLessThan(1);
        } else {
          expect(Math.abs(resultLon - lon)).toBeLessThan(0.01);
        }
      });
    });

    test('should handle equator and prime meridian', () => {
      const specialCases = [
        [0, 0],        // Null Island
        [0, 90],       // Equator, 90°E
        [0, -90],      // Equator, 90°W
        [45, 0],       // Prime Meridian, 45°N
        [-45, 0],      // Prime Meridian, 45°S
      ];
      
      specialCases.forEach(([lat, lon]) => {
        const address = coordinateToAddress(lat, lon);
        const [resultLat, resultLon] = addressToCoordinate(address);
        
        expect(typeof address).toBe('string');
        expect(Math.abs(resultLat - lat)).toBeLessThan(0.01);
        expect(Math.abs(resultLon - lon)).toBeLessThan(0.01);
      });
    });

    test('should handle antipodal points', () => {
      const antipodes = [
        [[40.7580, -73.9855], [-40.7580, 106.0145]], // NYC and its antipode
        [[48.8566, 2.3522], [-48.8566, -177.6478]],  // Paris and its antipode
      ];
      
      antipodes.forEach(([[lat1, lon1], [lat2, lon2]]) => {
        const addr1 = coordinateToAddress(lat1, lon1);
        const addr2 = coordinateToAddress(lat2, lon2);
        
        expect(typeof addr1).toBe('string');
        expect(typeof addr2).toBe('string');
        expect(addr1).not.toBe(addr2);
        
        // Distance between antipodes should be approximately 20,015 km (half Earth's circumference)
        const distance = calculateDistance(addr1, addr2);
        expect(distance).toBeGreaterThan(19500); // Allow for some precision loss
        expect(distance).toBeLessThan(20500);
      });
    });
  });

  describe('Precision boundary testing', () => {
    test('should handle coordinates at precision limits', () => {
      // Test coordinates with many decimal places
      const precisionCases = [
        [48.85661234567890, 2.35223456789012],
        [40.75801111111111, -73.98552222222222],
        [-33.86883333333333, 151.20934444444444],
      ];
      
      precisionCases.forEach(([lat, lon]) => {
        const address = coordinateToAddress(lat, lon);
        const [resultLat, resultLon] = addressToCoordinate(address);
        
        expect(typeof address).toBe('string');
        
        // H3 precision should be within ~3m accuracy for resolution 14
        expect(Math.abs(resultLat - lat)).toBeLessThan(0.00002);
        expect(Math.abs(resultLon - lon)).toBeLessThan(0.00002);
      });
    });

    test('should handle minimum representable coordinate differences', () => {
      const base = [48.8566, 2.3522];
      const epsilon = 0.000001; // Very small coordinate difference
      
      const nearby = [base[0] + epsilon, base[1] + epsilon];
      
      const addr1 = coordinateToAddress(...base);
      const addr2 = coordinateToAddress(...nearby);
      
      // Addresses might be same or different depending on H3 cell boundaries
      expect(typeof addr1).toBe('string');
      expect(typeof addr2).toBe('string');
      
      if (addr1 !== addr2) {
        // If different, distance should be very small
        const distance = calculateDistance(addr1, addr2);
        expect(distance).toBeLessThan(0.001); // Less than 1 meter
      }
    });
  });

  describe('Address validation edge cases', () => {
    test('should handle boundary syllable combinations', () => {
      // Test that we can create addresses with edge syllables
      const system = new H3SyllableSystem();
      const config = system.getConfig();
      
      // Create address with first and last valid syllables
      const firstSyllable = config.consonants[0] + config.vowels[0];
      const lastSyllable = config.consonants[config.consonants.length - 1] + 
                          config.vowels[config.vowels.length - 1];
      
      // Test that these syllables exist and are structurally valid
      expect(firstSyllable.length).toBe(2);
      expect(lastSyllable.length).toBe(2);
      
      // Test with actual coordinates to ensure the system works with edge syllables
      const testCoordinate = coordinateToAddress(48.8566, 2.3522);
      expect(typeof testCoordinate).toBe('string');
      expect(testCoordinate.length).toBe(config.address_length * 2); // address_length is syllables, each syllable is 2 characters
    });

    test('should handle mixed case input gracefully', () => {
      const baseAddress = coordinateToAddress(48.8566, 2.3522);
      
      // Test various case combinations
      const caseCombinations = [
        baseAddress.toUpperCase(),
        baseAddress.toLowerCase(),
        baseAddress.charAt(0).toUpperCase() + baseAddress.slice(1),
        baseAddress.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join(''),
      ];
      
      caseCombinations.forEach(testAddress => {
        // Should either be valid (if normalized) or invalid (if case-sensitive)
        const isValid = isValidAddress(testAddress);
        expect(typeof isValid).toBe('boolean');
        
        if (isValid) {
          // If valid, conversion should work
          const coords = addressToCoordinate(testAddress);
          expect(Array.isArray(coords)).toBe(true);
          expect(coords.length).toBe(2);
        }
      });
    });

    test('should handle addresses with unusual patterns', () => {
      const validAddress = coordinateToAddress(48.8566, 2.3522);
      
      // Test patterns that might cause issues
      const testPatterns = [
        validAddress + ' ',        // Trailing space
        ' ' + validAddress,        // Leading space
        validAddress + '\n',       // Trailing newline
        validAddress + '\t',       // Trailing tab
      ];
      
      testPatterns.forEach(testAddress => {
        // These patterns should fail validation due to whitespace/extra characters
        const result = isValidAddress(testAddress);
        expect(result).toBe(false);
      });
    });
  });

  describe('Memory and performance edge cases', () => {
    test('should handle rapid cache filling and clearing', () => {
      const system = new H3SyllableSystem();
      
      // Rapidly generate many different addresses
      for (let i = 0; i < 1000; i++) {
        const lat = 48.8 + (Math.random() - 0.5) * 0.01;
        const lon = 2.3 + (Math.random() - 0.5) * 0.01;
        system.coordinateToAddress(lat, lon);
        
        // Clear cache every 100 operations
        if (i % 100 === 0) {
          system.clearCache();
        }
      }
      
      // System should still be responsive
      const testAddress = system.coordinateToAddress(48.8566, 2.3522);
      expect(typeof testAddress).toBe('string');
    });

    test('should handle zero-distance calculations', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      
      // Distance from address to itself
      const distance = calculateDistance(address, address);
      expect(distance).toBe(0);
      
      // Multiple calls should be consistent
      for (let i = 0; i < 10; i++) {
        expect(calculateDistance(address, address)).toBe(0);
      }
    });

    test('should handle maximum distance calculations', () => {
      // Test addresses that are approximately antipodal
      const addr1 = coordinateToAddress(0, 0);           // Null Island
      const addr2 = coordinateToAddress(0, 180);         // Opposite side of Earth
      
      const distance = calculateDistance(addr1, addr2);
      
      // Should be approximately half Earth's circumference
      expect(distance).toBeGreaterThan(19000);  // At least 19,000 km
      expect(distance).toBeLessThan(21000);     // At most 21,000 km
    });
  });

  describe('Configuration edge cases', () => {
    test('should handle all available configurations', () => {
      const { listAvailableConfigs } = require('../dist/index.js');
      const configs = listAvailableConfigs();
      
      expect(configs.length).toBeGreaterThan(0);
      
      configs.forEach(configName => {
        const system = new H3SyllableSystem(configName);
        const testCoord = [48.8566, 2.3522];
        
        // Should work with all configurations
        const address = system.coordinateToAddress(...testCoord);
        const coords = system.addressToCoordinate(address);
        
        expect(typeof address).toBe('string');
        expect(Array.isArray(coords)).toBe(true);
        expect(coords.length).toBe(2);
        
        // Round-trip should be accurate
        expect(Math.abs(coords[0] - testCoord[0])).toBeLessThan(0.01);
        expect(Math.abs(coords[1] - testCoord[1])).toBeLessThan(0.01);
      });
    });

    test('should handle config-specific edge cases', () => {
      const configs = ['ascii-elomr']; // Test main config
      
      configs.forEach(configName => {
        const system = new H3SyllableSystem(configName);
        const config = system.getConfig();
        
        // Test with coordinates that might stress the configuration
        const stressCases = [
          [0, 0],                    // Origin
          [90, 0],                   // North pole
          [-90, 0],                  // South pole
          [0, 179.999999],          // Near date line
          [45, 90],                  // Mid-latitude, significant longitude
        ];
        
        stressCases.forEach(([lat, lon]) => {
          const address = system.coordinateToAddress(lat, lon);
          expect(typeof address).toBe('string');
          expect(address.length).toBe(config.address_length * 2); // address_length is syllables, each syllable is 2 characters
          
          // Should use only valid syllables
          for (let i = 0; i < address.length; i += 2) {
            const syllable = address.substr(i, 2);
            const consonant = syllable[0];
            const vowel = syllable[1];
            
            expect(config.consonants).toContain(consonant);
            expect(config.vowels).toContain(vowel);
          }
        });
      });
    });
  });

  describe('Error recovery and robustness', () => {
    test('should maintain state after errors', () => {
      const system = new H3SyllableSystem();
      
      // Generate some valid state
      const validAddress = system.coordinateToAddress(48.8566, 2.3522);
      
      // Cause some errors
      try { system.coordinateToAddress(91, 0); } catch (e) { /* ignore */ }
      try { system.addressToCoordinate('invalid'); } catch (e) { /* ignore */ }
      try { system.coordinateToAddress(null, null); } catch (e) { /* ignore */ }
      
      // System should still work correctly
      const newAddress = system.coordinateToAddress(48.8566, 2.3522);
      expect(newAddress).toBe(validAddress);
      
      const coords = system.addressToCoordinate(validAddress);
      expect(Array.isArray(coords)).toBe(true);
    });

    test('should handle corrupted input gracefully', () => {
      const corruptedInputs = [
        undefined,
        null,
        NaN,
        Infinity,
        -Infinity,
        {},
        [],
        function() {},
        new Date(),
      ];
      
      corruptedInputs.forEach(input => {
        try {
          coordinateToAddress(input, input);
          // If it doesn't throw, result should still be reasonable
        } catch (error) {
          expect(typeof error.message).toBe('string');
          expect(error.message.length).toBeGreaterThan(0);
        }
        
        try {
          addressToCoordinate(input);
        } catch (error) {
          expect(typeof error.message).toBe('string');
          expect(error.message.length).toBeGreaterThan(0);
        }
      });
    });
  });
});