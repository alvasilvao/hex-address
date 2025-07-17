/**
 * Batch operations tests for performance and scalability
 */

const {
  coordinateToAddress,
  addressToCoordinate,
  H3SyllableSystem,
  calculateDistance,
  clusterAddresses
} = require('../dist/index.js');

describe('Batch Operations', () => {
  
  describe('Batch coordinate conversion', () => {
    test('should handle large batches of coordinates efficiently', () => {
      const testCoords = [];
      
      // Generate 100 coordinates around Paris  
      for (let i = 0; i < 100; i++) {
        testCoords.push([
          48.8 + (Math.random() - 0.5) * 0.1,
          2.3 + (Math.random() - 0.5) * 0.1
        ]);
      }
      
      const start = Date.now();
      const addresses = testCoords.map(([lat, lon]) => coordinateToAddress(lat, lon));
      const conversionTime = Date.now() - start;
      
      expect(addresses.length).toBe(100);
      addresses.forEach(address => {
        expect(typeof address).toBe('string');
        expect(address.length).toBeGreaterThan(0);
      });
      
      // Should complete within reasonable time
      expect(conversionTime).toBeLessThan(5000); // 5 seconds
    });

    test('should handle batch address to coordinate conversion', () => {
      // Generate test addresses
      const addresses = [];
      for (let i = 0; i < 100; i++) {
        const lat = 48.8 + (Math.random() - 0.5) * 0.1;
        const lon = 2.3 + (Math.random() - 0.5) * 0.1;
        addresses.push(coordinateToAddress(lat, lon));
      }
      
      const start = Date.now();
      const coordinates = addresses.map(addr => addressToCoordinate(addr));
      const conversionTime = Date.now() - start;
      
      expect(coordinates.length).toBe(100);
      coordinates.forEach(([lat, lon]) => {
        expect(typeof lat).toBe('number');
        expect(typeof lon).toBe('number');
        expect(lat).toBeGreaterThan(-90);
        expect(lat).toBeLessThan(90);
        expect(lon).toBeGreaterThan(-180);
        expect(lon).toBeLessThan(180);
      });
      
      expect(conversionTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Batch distance calculations', () => {
    test('should calculate distances for multiple address pairs', () => {
      const baseAddress = coordinateToAddress(48.8566, 2.3522);
      const testAddresses = [];
      
      // Generate nearby addresses
      for (let i = 0; i < 50; i++) {
        const lat = 48.8566 + (Math.random() - 0.5) * 0.01;
        const lon = 2.3522 + (Math.random() - 0.5) * 0.01;
        testAddresses.push(coordinateToAddress(lat, lon));
      }
      
      const distances = testAddresses.map(addr => calculateDistance(baseAddress, addr));
      
      expect(distances.length).toBe(50);
      distances.forEach(distance => {
        expect(typeof distance).toBe('number');
        expect(distance).toBeGreaterThanOrEqual(0);
        expect(distance).toBeLessThan(10); // Should be within 10km
      });
    });
  });

  describe('Memory efficiency', () => {
    test('should handle large datasets without memory issues', () => {
      const system = new H3SyllableSystem();
      
      // Process many addresses to test memory handling
      for (let batch = 0; batch < 10; batch++) {
        const batchAddresses = [];
        
        for (let i = 0; i < 100; i++) {
          const lat = 48.8 + (Math.random() - 0.5) * 0.1;
          const lon = 2.3 + (Math.random() - 0.5) * 0.1;
          batchAddresses.push(system.coordinateToAddress(lat, lon));
        }
        
        // Clear cache periodically to test memory management
        if (batch % 3 === 0) {
          system.clearCache();
        }
        
        expect(batchAddresses.length).toBe(100);
      }
      
      // Final cleanup
      system.clearCache();
    });

    test('should handle clustering of large address sets', () => {
      // Generate addresses across different regions
      const addresses = [];
      
      // Paris region
      for (let i = 0; i < 30; i++) {
        addresses.push(coordinateToAddress(
          48.8566 + (Math.random() - 0.5) * 0.01,
          2.3522 + (Math.random() - 0.5) * 0.01
        ));
      }
      
      // London region
      for (let i = 0; i < 30; i++) {
        addresses.push(coordinateToAddress(
          51.5074 + (Math.random() - 0.5) * 0.01,
          -0.1278 + (Math.random() - 0.5) * 0.01
        ));
      }
      
      const clusters = clusterAddresses(addresses, 50); // 50km max distance
      
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.length).toBe(2); // Should create 2 clusters (Paris + London)
      
      // Verify all addresses are accounted for
      const totalAddresses = clusters.reduce((sum, cluster) => sum + cluster.addresses.length, 0);
      expect(totalAddresses).toBe(addresses.length);
    });
  });

  describe('Performance benchmarking', () => {
    test('should maintain consistent performance', () => {
      const system = new H3SyllableSystem();
      const testCoord = [48.8566, 2.3522];
      
      // Warm up
      for (let i = 0; i < 10; i++) {
        system.coordinateToAddress(...testCoord);
      }
      
      // Measure performance over multiple iterations
      const times = [];
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        system.coordinateToAddress(...testCoord);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Times should be reasonable (Date.now() is less precise than performance.now())
      expect(avgTime).toBeLessThan(10); // Less than 10ms on average
      expect(maxTime).toBeLessThan(100); // Max time should be reasonable
    });

    test('should scale linearly with input size', () => {
      const batchSizes = [10, 25, 50, 100];
      const timings = [];
      
      for (const size of batchSizes) {
        const coords = [];
        for (let i = 0; i < size; i++) {
          coords.push([
            48.8 + (Math.random() - 0.5) * 0.1,
            2.3 + (Math.random() - 0.5) * 0.1
          ]);
        }
        
        const start = Date.now();
        coords.forEach(([lat, lon]) => coordinateToAddress(lat, lon));
        const duration = Date.now() - start;
        
        timings.push({ size, duration });
      }
      
      // Verify reasonable scaling (not exponential)
      for (let i = 1; i < timings.length; i++) {
        const prev = timings[i - 1];
        const curr = timings[i];
        const scaleFactor = curr.size / prev.size;
        const timeIncrease = curr.duration / prev.duration;
        
        // Time increase should not be much worse than the scale factor
        expect(timeIncrease).toBeLessThan(scaleFactor * 2);
      }
    });
  });

  describe('Stress testing', () => {
    test('should handle concurrent operations', () => {
      const promises = [];
      
      // Simulate concurrent requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          new Promise((resolve) => {
            const lat = 48.8 + (Math.random() - 0.5) * 0.1;
            const lon = 2.3 + (Math.random() - 0.5) * 0.1;
            const address = coordinateToAddress(lat, lon);
            const coords = addressToCoordinate(address);
            resolve({ address, coords });
          })
        );
      }
      
      return Promise.all(promises).then(results => {
        expect(results.length).toBe(20);
        results.forEach(result => {
          expect(typeof result.address).toBe('string');
          expect(Array.isArray(result.coords)).toBe(true);
          expect(result.coords.length).toBe(2);
        });
      });
    });

    test('should handle error conditions gracefully in batch', () => {
      const validCoords = [48.8566, 2.3522];
      const invalidInputs = [
        [91, 0],      // Invalid latitude
        [0, 181],     // Invalid longitude
        [null, null], // Null values
        ['invalid', 'coords'], // String coordinates
      ];
      
      const results = [];
      
      // Test mixed valid/invalid inputs
      [validCoords, ...invalidInputs].forEach(coords => {
        try {
          const address = coordinateToAddress(coords[0], coords[1]);
          results.push({ success: true, address });
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      });
      
      expect(results.length).toBe(5);
      expect(results[0].success).toBe(true); // Valid coords should work
      
      // Invalid inputs should be handled gracefully
      results.slice(1).forEach(result => {
        expect(result.success).toBe(false);
        expect(typeof result.error).toBe('string');
      });
    });
  });
});