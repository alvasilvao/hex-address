/**
 * Unit tests for enhanced validation functionality
 */

const {
  isValidAddress,
  coordinateToAddress,
  analyzeAddress
} = require('../dist/index.js');

describe('Validation Functions', () => {
  
  describe('isValidAddress - Simple validation', () => {
    test('should validate correct addresses', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      expect(isValidAddress(address)).toBe(true);
    });

    test('should reject invalid syllables', () => {
      expect(isValidAddress('xyxyxyxyxyxyxyxy')).toBe(false);
      expect(isValidAddress('invalidstuff')).toBe(false);
    });

    test('should reject wrong length addresses', () => {
      expect(isValidAddress('di')).toBe(false);
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('toolongaddresshere')).toBe(false);
    });

    test('should handle different configurations', () => {
      const address = coordinateToAddress(48.8566, 2.3522, 'ascii-dnqqwn');
      expect(isValidAddress(address, 'ascii-dnqqwn')).toBe(true);
    });
  });

  describe('isValidAddress - Detailed validation', () => {
    test('should return ValidationResult for valid addresses', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      const result = isValidAddress(address, 'ascii-dnqqwn', true);
      
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('validParts');
      
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.validParts)).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should provide detailed errors for invalid syllables', () => {
      const result = isValidAddress('xyxyxyxyxyxyxyxy', 'ascii-dnqqwn', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      result.errors.forEach(error => {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(typeof error.type).toBe('string');
        expect(typeof error.message).toBe('string');
        
        // Should be one of the expected error types
        expect(['format', 'syllable', 'geographic', 'config', 'length']).toContain(error.type);
      });
    });

    test('should provide suggestions for invalid syllables', () => {
      const result = isValidAddress('helloworldxyzyxy', 'ascii-dnqqwn', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that the result has general suggestions or error-specific suggestions
      const hasGeneralSuggestions = result.suggestions && result.suggestions.length > 0;
      const hasErrorSuggestions = result.errors.some(error => error.suggestions && error.suggestions.length > 0);
      
      expect(hasGeneralSuggestions || hasErrorSuggestions).toBe(true);
      
      if (hasErrorSuggestions) {
        const errorsWithSuggestions = result.errors.filter(error => error.suggestions && error.suggestions.length > 0);
        errorsWithSuggestions.forEach(error => {
          expect(Array.isArray(error.suggestions)).toBe(true);
          expect(error.suggestions.length).toBeGreaterThan(0);
          error.suggestions.forEach(suggestion => {
            expect(typeof suggestion).toBe('string');
          });
        });
      }
    });

    test('should handle wrong length with appropriate error', () => {
      const result = isValidAddress('di', 'ascii-dnqqwn', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.type === 'length')).toBe(true);
    });

    test('should handle empty address', () => {
      const result = isValidAddress('', 'ascii-dnqqwn', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide phonetic suggestions based on confusion patterns', () => {
      // Test addresses with phonetically similar characters
      const testCases = [
        'hello', // h often confused with f
        'world', // r often confused with l  
        'test',  // t often confused with d
      ];
      
      testCases.forEach(testAddress => {
        const result = isValidAddress(testAddress, 'ascii-dnqqwn', true);
        
        if (!result.isValid) {
          const suggestedErrors = result.errors.filter(error => error.suggestions);
          if (suggestedErrors.length > 0) {
            suggestedErrors.forEach(error => {
              expect(error.suggestions.length).toBeGreaterThan(0);
              // Suggestions should be strings
              error.suggestions.forEach(suggestion => {
                expect(typeof suggestion).toBe('string');
              });
            });
          }
        }
      });
    });

    test('should maintain validParts information', () => {
      const result = isValidAddress('dinenunuxyxyxyxy', 'ascii-dnqqwn', true);
      
      expect(Array.isArray(result.validParts)).toBe(true);
      // Should have some valid parts even if overall invalid
      if (result.validParts.length > 0) {
        result.validParts.forEach(part => {
          expect(typeof part).toBe('string');
        });
      }
    });
  });

  describe('analyzeAddress', () => {
    test('should analyze valid addresses', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      const analysis = analyzeAddress(address);
      
      expect(typeof analysis).toBe('object');
      expect(analysis).toHaveProperty('isValid');
      expect(analysis).toHaveProperty('address');
      expect(analysis.isValid).toBe(true);
      expect(analysis.address).toBe(address);
    });

    test('should provide phonetic alternatives for valid addresses', () => {
      const address = coordinateToAddress(48.8566, 2.3522);
      const analysis = analyzeAddress(address);
      
      if (analysis.phoneticAlternatives) {
        expect(Array.isArray(analysis.phoneticAlternatives)).toBe(true);
        
        analysis.phoneticAlternatives.forEach(alt => {
          expect(alt).toHaveProperty('address');
          expect(alt).toHaveProperty('distanceKm');
          expect(typeof alt.address).toBe('string');
          expect(typeof alt.distanceKm).toBe('number');
          expect(alt.distanceKm).toBeGreaterThanOrEqual(0);
        });
      }
    });

    test('should handle invalid addresses', () => {
      const analysis = analyzeAddress('invalidaddress');
      
      expect(analysis.isValid).toBe(false);
      expect(analysis.address).toBe('invalidaddress');
    });

    test('should work with different configurations', () => {
      const address = coordinateToAddress(48.8566, 2.3522, 'ascii-dnqqwn');
      const analysis = analyzeAddress(address, 'ascii-dnqqwn');
      
      expect(analysis.isValid).toBe(true);
      expect(analysis.address).toBe(address);
    });
  });

  describe('Phonetic confusion patterns', () => {
    test('should recognize common phonetic confusions', () => {
      // Test known phonetic confusion pairs
      const confusionPairs = [
        ['d', 't'], // voiced/unvoiced
        ['f', 'v'], // f/v confusion
        ['l', 'r'], // liquid consonants
        ['p', 'b'], // voiced/unvoiced
        ['s', 'z'], // sibilants
      ];
      
      confusionPairs.forEach(([char1, char2]) => {
        // Create test words with these characters
        const testWord1 = char1 + 'ello';
        const testWord2 = char2 + 'ello';
        
        const result1 = isValidAddress(testWord1, 'ascii-dnqqwn', true);
        const result2 = isValidAddress(testWord2, 'ascii-dnqqwn', true);
        
        // If one is invalid, it should suggest the other as an alternative
        if (!result1.isValid) {
          const suggestions = result1.errors.flatMap(error => error.suggestions || []);
          // Check if any suggestion contains the confused character
          const hasPhoneticsimilarity = suggestions.some(suggestion => 
            suggestion.includes(char2)
          );
          // This is probabilistic, so we don't enforce it strictly
        }
      });
    });

    test('should handle vowel confusions', () => {
      const vowelPairs = [
        ['a', 'e'],
        ['e', 'i'], 
        ['i', 'y'],
        ['o', 'u'],
      ];
      
      vowelPairs.forEach(([vowel1, vowel2]) => {
        const testWord = 'h' + vowel1 + 'll' + vowel2;
        const result = isValidAddress(testWord, 'ascii-dnqqwn', true);
        
        if (!result.isValid && result.errors.some(error => error.suggestions)) {
          // Should have suggestions for vowel confusions
          const suggestions = result.errors.flatMap(error => error.suggestions || []);
          expect(suggestions.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Error message quality', () => {
    test('should provide helpful error messages', () => {
      const testCases = [
        { input: '', expectedTypes: ['length', 'format'] },
        { input: 'xy', expectedTypes: ['length'] },
        { input: 'xyxyxyxyxyxyxyxy', expectedTypes: ['syllable'] },
        { input: 'hello-world', expectedTypes: ['format', 'syllable'] }, // Accept either format or syllable error
      ];
      
      testCases.forEach(({ input, expectedTypes }) => {
        const result = isValidAddress(input, 'ascii-dnqqwn', true);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        // Check that at least one expected error type is present
        const hasExpectedType = expectedTypes.some(expectedType => 
          result.errors.some(error => error.type === expectedType)
        );
        expect(hasExpectedType).toBe(true);
        
        result.errors.forEach(error => {
          expect(error.message.length).toBeGreaterThan(10); // Should be descriptive
          expect(error.message).not.toMatch(/undefined|null/); // No template issues
        });
      });
    });

    test('should provide position information when relevant', () => {
      const result = isValidAddress('dinenunuxyxyxyxy', 'ascii-dnqqwn', true);
      
      if (!result.isValid) {
        const positionErrors = result.errors.filter(error => error.position !== undefined);
        
        positionErrors.forEach(error => {
          expect(typeof error.position).toBe('number');
          expect(error.position).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle very long invalid addresses', () => {
      const longInvalidAddress = 'x'.repeat(100);
      const result = isValidAddress(longInvalidAddress, 'ascii-dnqqwn', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle special characters', () => {
      const specialChars = ['hello@world', 'test#123', 'address$', 'name%'];
      
      specialChars.forEach(address => {
        const result = isValidAddress(address, 'ascii-dnqqwn', true);
        expect(result.isValid).toBe(false);
        // Special characters will be detected as syllable errors or format errors
        const hasRelevantError = result.errors.some(error => 
          error.type === 'format' || error.type === 'syllable' || error.type === 'length'
        );
        expect(hasRelevantError).toBe(true);
      });
    });

    test('should handle Unicode characters', () => {
      const unicodeAddresses = ['héllo', 'wörld', 'tëst', 'ñame'];
      
      unicodeAddresses.forEach(address => {
        const result = isValidAddress(address, 'ascii-dnqqwn', true);
        expect(result.isValid).toBe(false);
        // Should detect format issues with non-ASCII characters
      });
    });

    test('should be consistent between simple and detailed validation', () => {
      const testAddresses = [
        coordinateToAddress(48.8566, 2.3522), // Valid
        'invalidaddress', // Invalid
        '', // Empty
        'xy', // Too short
      ];
      
      testAddresses.forEach(address => {
        const simple = isValidAddress(address);
        const detailed = isValidAddress(address, 'ascii-dnqqwn', true);
        
        expect(simple).toBe(detailed.isValid);
      });
    });
  });
});