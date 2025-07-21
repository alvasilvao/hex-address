/**
 * Unit tests for core functionality
 */

const {
  coordinateToAddress,
  addressToCoordinate,
  H3SyllableSystem,
  listAvailableConfigs,
  getConfigInfo,
  estimateLocationFromPartial
} = require('../dist/index.js');

describe('Core Functions', () => {
  
  describe('coordinateToAddress', () => {
    test('should convert coordinates to address', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(0);
      expect(address).toMatch(/^[a-z]+$/); // Should be lowercase letters only
    });

    test('should handle different coordinate ranges', () => {
      const testCoords = [
        [0, 0],           // Equator, Prime Meridian
        [90, 180],        // North Pole area
        [-90, -180],      // South Pole area
        [48.8566, 2.3522], // Paris
        [40.7580, -73.9855], // New York
        [-33.8568, 151.2153], // Sydney
      ];
      
      testCoords.forEach(([lat, lon]) => {
        const address = coordinateToAddress(lat, lon);
        expect(typeof address).toBe('string');
        expect(address.length).toBeGreaterThan(0);
      });
    });

    test('should use different configurations', () => {
      const coords = [48.8566, 2.3522];
      const configs = ['ascii-elomr'];
      
      configs.forEach(config => {
        const address = coordinateToAddress(...coords, config);
        expect(typeof address).toBe('string');
        expect(address.length).toBeGreaterThan(0);
      });
    });

    test('should throw error for invalid coordinates', () => {
      expect(() => coordinateToAddress(91, 0)).toThrow(); // Invalid latitude
      expect(() => coordinateToAddress(-91, 0)).toThrow(); // Invalid latitude
      expect(() => coordinateToAddress(0, 181)).toThrow(); // Invalid longitude
      expect(() => coordinateToAddress(0, -181)).toThrow(); // Invalid longitude
    });
  });

  describe('addressToCoordinate', () => {
    test('should convert address back to coordinates', () => {
      const originalCoords = [48.8566, 2.3522];
      const address = coordinateToAddress(...originalCoords);
      const [lat, lon] = addressToCoordinate(address);
      
      expect(typeof lat).toBe('number');
      expect(typeof lon).toBe('number');
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
      
      // Should be close to original coordinates (within H3 precision)
      expect(Math.abs(lat - originalCoords[0])).toBeLessThan(0.01);
      expect(Math.abs(lon - originalCoords[1])).toBeLessThan(0.01);
    });

    test('should handle round-trip conversion accurately', () => {
      const testCoords = [
        [48.8566, 2.3522],
        [40.7580, -73.9855],
        [-33.8568, 151.2153],
        [35.6762, 139.6503],
      ];
      
      testCoords.forEach(([originalLat, originalLon]) => {
        const address = coordinateToAddress(originalLat, originalLon);
        const [newLat, newLon] = addressToCoordinate(address);
        
        // Should be very close due to H3 precision
        expect(Math.abs(newLat - originalLat)).toBeLessThan(0.001);
        expect(Math.abs(newLon - originalLon)).toBeLessThan(0.001);
      });
    });

    test('should work with different configurations', () => {
      const coords = [48.8566, 2.3522];
      const address = coordinateToAddress(...coords, 'ascii-elomr');
      const [lat, lon] = addressToCoordinate(address, 'ascii-elomr');
      
      expect(typeof lat).toBe('number');
      expect(typeof lon).toBe('number');
    });

    test('should throw error for invalid addresses', () => {
      expect(() => addressToCoordinate('invalid')).toThrow();
      expect(() => addressToCoordinate('')).toThrow();
      expect(() => addressToCoordinate('xyxyxyxyxyxyxyxy')).toThrow();
    });
  });

  describe('H3SyllableSystem', () => {
    test('should create system with default configuration', () => {
      const system = new H3SyllableSystem();
      expect(system).toBeInstanceOf(H3SyllableSystem);
    });

    test('should create system with specific configuration', () => {
      const system = new H3SyllableSystem('ascii-elomr');
      expect(system).toBeInstanceOf(H3SyllableSystem);
    });

    test('should have all required methods', () => {
      const system = new H3SyllableSystem();
      
      expect(typeof system.coordinateToAddress).toBe('function');
      expect(typeof system.addressToCoordinate).toBe('function');
      expect(typeof system.isValidAddress).toBe('function');
      expect(typeof system.getSystemInfo).toBe('function');
      expect(typeof system.getConfig).toBe('function');
      expect(typeof system.clearCache).toBe('function');
    });

    test('should provide system information', () => {
      const system = new H3SyllableSystem();
      const info = system.getSystemInfo();
      
      expect(typeof info).toBe('object');
      expect(info).toHaveProperty('h3Resolution');
      expect(info).toHaveProperty('totalH3Cells');
      expect(info).toHaveProperty('consonants');
      expect(info).toHaveProperty('vowels');
      expect(info).toHaveProperty('totalSyllables');
      expect(info).toHaveProperty('addressLength');
      expect(info).toHaveProperty('addressSpace');
      expect(info).toHaveProperty('coveragePercentage');
      expect(info).toHaveProperty('precisionMeters');
      
      expect(typeof info.h3Resolution).toBe('number');
      expect(typeof info.totalH3Cells).toBe('number');
      expect(Array.isArray(info.consonants)).toBe(true);
      expect(Array.isArray(info.vowels)).toBe(true);
    });

    test('should provide configuration details', () => {
      const system = new H3SyllableSystem();
      const config = system.getConfig();
      
      expect(typeof config).toBe('object');
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('consonants');
      expect(config).toHaveProperty('vowels');
      expect(config).toHaveProperty('address_length');
      expect(config).toHaveProperty('h3_resolution');
      
      expect(Array.isArray(config.consonants)).toBe(true);
      expect(Array.isArray(config.vowels)).toBe(true);
      expect(config.consonants.length).toBeGreaterThan(0);
      expect(config.vowels.length).toBeGreaterThan(0);
    });

    test('should clear cache', () => {
      const system = new H3SyllableSystem();
      
      // Generate some addresses to populate cache
      system.coordinateToAddress(48.8566, 2.3522);
      system.coordinateToAddress(40.7580, -73.9855);
      
      // Should not throw when clearing cache
      expect(() => system.clearCache()).not.toThrow();
    });

    test('should handle caching correctly', () => {
      const system = new H3SyllableSystem();
      const coords = [48.8566, 2.3522];
      
      // First call
      const start1 = Date.now();
      const address1 = system.coordinateToAddress(...coords);
      const time1 = Date.now() - start1;
      
      // Second call (should be faster due to caching)
      const start2 = Date.now();
      const address2 = system.coordinateToAddress(...coords);
      const time2 = Date.now() - start2;
      
      expect(address1).toBe(address2);
      // Second call should generally be faster (though not guaranteed in tests)
    });
  });

  describe('Configuration Management', () => {
    test('should list available configurations', () => {
      const configs = listAvailableConfigs();
      
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      
      configs.forEach(config => {
        expect(typeof config).toBe('string');
        expect(config.length).toBeGreaterThan(0);
      });
    });

    test('should get configuration information', () => {
      const configs = listAvailableConfigs();
      
      configs.forEach(configName => {
        const info = getConfigInfo(configName);
        
        expect(typeof info).toBe('object');
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('consonants');
        expect(info).toHaveProperty('vowels');
        expect(info).toHaveProperty('totalSyllables');
        expect(info).toHaveProperty('addressLength');
        expect(info).toHaveProperty('h3Resolution');
        expect(info).toHaveProperty('addressSpace');
        
        expect(Array.isArray(info.consonants)).toBe(true);
        expect(Array.isArray(info.vowels)).toBe(true);
        expect(info.totalSyllables).toBe(info.consonants.length * info.vowels.length);
      });
    });

    test('should throw error for invalid configuration', () => {
      expect(() => getConfigInfo('nonexistent-config')).toThrow();
      expect(() => new H3SyllableSystem('invalid-config')).toThrow();
    });
  });

  describe('estimateLocationFromPartial', () => {
    test('should estimate location from partial address', () => {
      const fullAddress = coordinateToAddress(48.8566, 2.3522);
      const partialAddress = fullAddress.substring(0, 8); // First 8 characters
      
      const estimate = estimateLocationFromPartial(partialAddress);
      
      expect(typeof estimate).toBe('object');
      expect(estimate).toHaveProperty('centerCoordinate');
      expect(estimate).toHaveProperty('bounds');
      expect(estimate).toHaveProperty('confidence');
      
      expect(Array.isArray(estimate.centerCoordinate)).toBe(true);
      expect(estimate.centerCoordinate.length).toBe(2);
      expect(typeof estimate.bounds).toBe('object');
      expect(estimate.bounds).toHaveProperty('north');
      expect(estimate.bounds).toHaveProperty('south');
      expect(estimate.bounds).toHaveProperty('east');
      expect(estimate.bounds).toHaveProperty('west');
    });

    test('should handle comprehensive estimation', () => {
      const fullAddress = coordinateToAddress(48.8566, 2.3522);
      const partialAddress = fullAddress.substring(0, 6);
      
      const estimate = estimateLocationFromPartial(partialAddress, 'ascii-elomr', true);
      
      expect(typeof estimate).toBe('object');
      expect(estimate.confidence).toBeGreaterThan(0);
      expect(estimate.estimatedAreaKm2).toBeGreaterThan(0);
    });

    test('should work with different partial lengths', () => {
      const fullAddress = coordinateToAddress(48.8566, 2.3522);
      
      for (let len = 2; len < fullAddress.length; len += 2) {
        const partialAddress = fullAddress.substring(0, len);
        const estimate = estimateLocationFromPartial(partialAddress);
        
        expect(estimate.confidence).toBeGreaterThan(0);
        expect(estimate.bounds.north).toBeGreaterThan(estimate.bounds.south);
      }
    });

    test('should handle empty or invalid partial addresses', () => {
      expect(() => estimateLocationFromPartial('')).toThrow();
      expect(() => estimateLocationFromPartial('xy')).toThrow();
    });
  });

  describe('Performance and Memory', () => {
    test('should handle batch operations efficiently', () => {
      const testCoords = [];
      for (let i = 0; i < 100; i++) {
        testCoords.push([
          48.8 + (Math.random() - 0.5) * 0.1, // Paris area
          2.3 + (Math.random() - 0.5) * 0.1
        ]);
      }
      
      const start = Date.now();
      const addresses = testCoords.map(([lat, lon]) => coordinateToAddress(lat, lon));
      const addressTime = Date.now() - start;
      
      const start2 = Date.now();
      const coords = addresses.map(addr => addressToCoordinate(addr));
      const coordTime = Date.now() - start2;
      
      expect(addresses.length).toBe(100);
      expect(coords.length).toBe(100);
      
      // Should complete within reasonable time (adjust based on system)
      expect(addressTime).toBeLessThan(5000); // 5 seconds
      expect(coordTime).toBeLessThan(5000);
    });

    test('should handle memory efficiently with large cache', () => {
      const system = new H3SyllableSystem();
      
      // Generate many addresses to test cache behavior
      for (let i = 0; i < 1000; i++) {
        const lat = 48.8 + (Math.random() - 0.5) * 0.1;
        const lon = 2.3 + (Math.random() - 0.5) * 0.1;
        system.coordinateToAddress(lat, lon);
      }
      
      // Should not crash or consume excessive memory
      expect(() => system.clearCache()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should provide meaningful error messages', () => {
      const testCases = [
        () => coordinateToAddress(91, 0),
        () => coordinateToAddress(0, 181),
        () => addressToCoordinate('invalid'),
        () => new H3SyllableSystem('nonexistent'),
      ];
      
      testCases.forEach(testCase => {
        expect(testCase).toThrow();
        try {
          testCase();
        } catch (error) {
          expect(error.message.length).toBeGreaterThan(0);
          expect(typeof error.message).toBe('string');
        }
      });
    });

    test('should handle edge case coordinates', () => {
      const edgeCases = [
        [0, 0],
        [90, 0],
        [-90, 0],
        [0, 180],
        [0, -180],
      ];
      
      edgeCases.forEach(([lat, lon]) => {
        expect(() => {
          const address = coordinateToAddress(lat, lon);
          const coords = addressToCoordinate(address);
          expect(Array.isArray(coords)).toBe(true);
        }).not.toThrow();
      });
    });
  });
});