/**
 * Unit tests for new utility functions
 */

const {
  calculateDistance,
  findNearbyAddresses, 
  getAddressBounds,
  clusterAddresses,
  coordinateToAddress,
  addressToCoordinate
} = require('../dist/index.js');

describe('Utility Functions', () => {
  
  describe('calculateDistance', () => {
    test('should calculate distance between identical addresses as 0', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      const distance = calculateDistance(address, address);
      expect(distance).toBe(0);
    });

    test('should calculate distance between nearby addresses', () => {
      const addr1 = coordinateToAddress(48.8566, 2.3522); // Eiffel Tower
      const addr2 = coordinateToAddress(48.8606, 2.3376); // Louvre
      const distance = calculateDistance(addr1, addr2);
      
      // Should be approximately 1-2km between Eiffel Tower and Louvre
      expect(distance).toBeGreaterThan(1.0);
      expect(distance).toBeLessThan(2.0);
    });

    test('should handle different configurations', () => {
      const coords1 = [48.8566, 2.3522];
      const coords2 = [48.8567, 2.3523];
      
      const addr1 = coordinateToAddress(...coords1, 'ascii-dnqqwn');
      const addr2 = coordinateToAddress(...coords2, 'ascii-dnqqwn');
      
      const distance = calculateDistance(addr1, addr2, 'ascii-dnqqwn');
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be small distance
    });

    test('should throw error for invalid addresses', () => {
      expect(() => {
        calculateDistance('invalid', 'alsoinvalid');
      }).toThrow(/conversion|syllable|address/i);
    });
  });

  describe('findNearbyAddresses', () => {
    test('should find nearby addresses within radius', () => {
      const centerAddress = coordinateToAddress(48.8566, 2.3522);
      const nearby = findNearbyAddresses(centerAddress, 0.1); // 100m radius
      
      expect(Array.isArray(nearby)).toBe(true);
      expect(nearby.length).toBeGreaterThan(0);
      
      // All addresses should be within the specified radius
      nearby.forEach(item => {
        expect(item).toHaveProperty('address');
        expect(item).toHaveProperty('distance');
        expect(item).toHaveProperty('coordinates');
        expect(typeof item.address).toBe('string');
        expect(typeof item.distance).toBe('number');
        expect(Array.isArray(item.coordinates)).toBe(true);
        expect(item.distance).toBeLessThanOrEqual(0.1);
        expect(item.address).not.toBe(centerAddress); // Should exclude center
      });
    });

    test('should return empty array for very small radius', () => {
      const centerAddress = coordinateToAddress(48.8566, 2.3522);
      const nearby = findNearbyAddresses(centerAddress, 0.0001); // 0.1m radius
      
      expect(Array.isArray(nearby)).toBe(true);
      // Might be empty or very few results for such a small radius
    });

    test('should sort results by distance', () => {
      const centerAddress = coordinateToAddress(48.8566, 2.3522);
      const nearby = findNearbyAddresses(centerAddress, 0.5);
      
      if (nearby.length > 1) {
        for (let i = 1; i < nearby.length; i++) {
          expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i-1].distance);
        }
      }
    });

    test('should handle invalid center address', () => {
      expect(() => {
        findNearbyAddresses('invalid', 1.0);
      }).toThrow(/conversion|syllable|address/i);
    });
  });

  describe('getAddressBounds', () => {
    test('should return valid bounds for an address', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      const bounds = getAddressBounds(address);
      
      expect(bounds).toHaveProperty('north');
      expect(bounds).toHaveProperty('south'); 
      expect(bounds).toHaveProperty('east');
      expect(bounds).toHaveProperty('west');
      
      expect(typeof bounds.north).toBe('number');
      expect(typeof bounds.south).toBe('number');
      expect(typeof bounds.east).toBe('number');
      expect(typeof bounds.west).toBe('number');
      
      // North should be greater than south
      expect(bounds.north).toBeGreaterThan(bounds.south);
      // East should be greater than west (for non-crossing meridian)
      expect(bounds.east).toBeGreaterThan(bounds.west);
      
      // Bounds should be very small for sub-meter precision
      const latDiff = bounds.north - bounds.south;
      const lonDiff = bounds.east - bounds.west;
      expect(latDiff).toBeLessThan(0.01); // Less than ~1km
      expect(lonDiff).toBeLessThan(0.01);
    });

    test('should handle different configurations', () => {
      const coords = [48.8566, 2.3522];
      const address = coordinateToAddress(...coords, 'ascii-dnqqwn');
      const bounds = getAddressBounds(address, 'ascii-dnqqwn');
      
      expect(bounds.north).toBeGreaterThan(coords[0] - 0.01);
      expect(bounds.south).toBeLessThan(coords[0] + 0.01);
    });

    test('should throw error for invalid address', () => {
      expect(() => {
        getAddressBounds('invalid');
      }).toThrow(/conversion|syllable|address/i);
    });
  });

  describe('clusterAddresses', () => {
    test('should cluster nearby addresses', () => {
      // Create test addresses around Paris landmarks  
      const addresses = [
        coordinateToAddress(48.8566, 2.3522), // Eiffel Tower
        coordinateToAddress(48.8567, 2.3523), // Very close to Eiffel Tower
        coordinateToAddress(48.8606, 2.3376), // Louvre (further away)
      ];
      
      const clusters = clusterAddresses(addresses, 1.0); // 1km max distance
      
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters.length).toBeLessThanOrEqual(addresses.length);
      
      clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('addresses');
        expect(cluster).toHaveProperty('center');
        expect(cluster).toHaveProperty('bounds');
        
        expect(Array.isArray(cluster.addresses)).toBe(true);
        expect(Array.isArray(cluster.center)).toBe(true);
        expect(cluster.center.length).toBe(2);
        expect(cluster.bounds).toHaveProperty('north');
        expect(cluster.bounds).toHaveProperty('south');
        expect(cluster.bounds).toHaveProperty('east');
        expect(cluster.bounds).toHaveProperty('west');
      });
      
      // All original addresses should be in some cluster
      const allClusteredAddresses = clusters.flatMap(c => c.addresses);
      addresses.forEach(addr => {
        expect(allClusteredAddresses).toContain(addr);
      });
    });

    test('should create separate clusters for distant addresses', () => {
      const addresses = [
        coordinateToAddress(48.8566, 2.3522), // Paris
        coordinateToAddress(40.7580, -73.9855), // New York
      ];
      
      const clusters = clusterAddresses(addresses, 100); // 100km max (still too small for Paris-NYC)
      
      expect(clusters.length).toBe(2); // Should be separate clusters
    });

    test('should handle single address', () => {
      const addresses = [coordinateToAddress(48.8566, 2.3522)];
      const clusters = clusterAddresses(addresses, 1.0);
      
      expect(clusters.length).toBe(1);
      expect(clusters[0].addresses.length).toBe(1);
      expect(clusters[0].addresses[0]).toBe(addresses[0]);
    });

    test('should handle empty address array', () => {
      const clusters = clusterAddresses([], 1.0);
      expect(clusters.length).toBe(0);
    });

    test('should throw error for invalid addresses', () => {
      expect(() => {
        clusterAddresses(['invalid1', 'invalid2'], 1.0);
      }).toThrow(/conversion|syllable|address/i);
    });
  });

  describe('Integration tests', () => {
    test('should work together for real-world scenario', () => {
      // Simulate delivery route optimization
      const deliveryCoords = [
        [48.8566, 2.3522], // Eiffel Tower
        [48.8567, 2.3523], // Near Eiffel Tower
        [48.8606, 2.3376], // Louvre
      ];
      
      // Convert to addresses
      const addresses = deliveryCoords.map(coords => coordinateToAddress(...coords));
      
      // Cluster for route optimization
      const clusters = clusterAddresses(addresses, 2.0); // 2km max
      
      // Calculate distances within clusters
      clusters.forEach(cluster => {
        if (cluster.addresses.length > 1) {
          for (let i = 0; i < cluster.addresses.length - 1; i++) {
            const distance = calculateDistance(cluster.addresses[i], cluster.addresses[i + 1]);
            expect(distance).toBeLessThanOrEqual(2.0); // Within cluster max distance
          }
        }
      });
      
      // Find nearby addresses for each delivery point
      addresses.forEach(address => {
        const nearby = findNearbyAddresses(address, 0.5);
        expect(Array.isArray(nearby)).toBe(true);
        
        // Get bounds for each address
        const bounds = getAddressBounds(address);
        expect(bounds.north).toBeGreaterThan(bounds.south);
      });
    });

    test('should maintain consistency across function calls', () => {
      const coords = [48.8566, 2.3522];
      const address = coordinateToAddress(...coords);
      
      // Distance from address to itself should always be 0
      expect(calculateDistance(address, address)).toBe(0);
      
      // Bounds should contain the original coordinates
      const bounds = getAddressBounds(address);
      expect(coords[0]).toBeGreaterThanOrEqual(bounds.south);
      expect(coords[0]).toBeLessThanOrEqual(bounds.north);
      expect(coords[1]).toBeGreaterThanOrEqual(bounds.west);
      expect(coords[1]).toBeLessThanOrEqual(bounds.east);
      
      // Address should not appear in its own nearby results
      const nearby = findNearbyAddresses(address, 1.0);
      expect(nearby.map(item => item.address)).not.toContain(address);
    });
  });
});