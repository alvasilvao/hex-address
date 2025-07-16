# Validation Features - Version 1.3.0

## Overview

Version 1.3.0 introduces comprehensive address validation with intelligent error messages and phonetic similarity suggestions. This enhancement significantly improves the user experience when working with hex addresses.

## New Validation Features

### 1. Enhanced `isValidAddress` Function

The `isValidAddress` function now supports detailed validation with comprehensive error reporting:

#### JavaScript/TypeScript
```typescript
// Simple validation (returns boolean)
isValidAddress("dinenunukiwufeme") // → true
isValidAddress("invalid") // → false

// Detailed validation (returns ValidationResult)
const result = isValidAddress("helloworld", "ascii-dnqqwn", true);
console.log(result.errors[0].suggestions); // → ['fello', 'jello', 'mello']
```

#### Python
```python
# Simple validation (returns bool)
system.is_valid_address("dinenunukiwufeme") # → True
system.is_valid_address("invalid") # → False

# Detailed validation (returns dict)
result = system.is_valid_address("helloworld", detailed=True)
print(result['errors'][0]['suggestions'])  # → ['fello', 'jello', 'mello']
```

### 2. Validation Error Types

The system now provides specific error types for different validation failures:

- **`format`**: Invalid characters or structure
- **`length`**: Address is too short or too long  
- **`syllable`**: Invalid syllable combinations
- **`geographic`**: Valid syllables but no real location
- **`config`**: Configuration-related issues

### 3. Phonetic Similarity Suggestions

When validation fails, the system provides intelligent suggestions based on phonetic similarity:

```typescript
const result = isValidAddress("helo-woard", "ascii-dnqqwn", true);
// Provides suggestions like: ['hello', 'fello', 'jello'] for 'helo'
// and ['world', 'ward', 'word'] for 'woard'
```

### 4. Comprehensive Error Information

Each validation error includes:
- **type**: The category of error
- **message**: Human-readable description
- **position**: Character position where error occurred (optional)
- **suggestions**: Array of similar valid alternatives (optional)
- **received**: What was actually provided (optional)
- **expected**: What was expected (optional)

## Phonetic Confusion Database

The system includes a comprehensive phonetic confusion database covering:

### Voiced/Unvoiced Consonant Pairs
- d ↔ t
- f ↔ v, p
- s ↔ z, c
- p ↔ b, f
- k ↔ c, g
- g ↔ k, j

### Liquid Consonants
- l ↔ r, n (common in many languages)
- n ↔ m, l
- r ↔ l

### Vowel Confusions
- a ↔ e, o
- e ↔ i, a
- i ↔ e, y
- o ↔ u, a
- u ↔ o, w

### Other Common Confusions
- h ↔ f
- w ↔ v, u
- y ↔ j, i
- j ↔ g, y

## Migration Guide

### From v1.2.0 to v1.3.0

The validation API is backward compatible. Existing code will continue to work:

```typescript
// This still works exactly as before
const isValid = isValidAddress("someaddress");
```

To use the new detailed validation:

```typescript
// Add the detailed parameter
const result = isValidAddress("someaddress", "ascii-dnqqwn", true);

// Check if valid
if (result.isValid) {
  // Address is valid
} else {
  // Process errors with suggestions
  result.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
    if (error.suggestions) {
      console.log(`Suggestions: ${error.suggestions.join(', ')}`);
    }
  });
}
```

## Example Usage

### JavaScript Example
```typescript
import { isValidAddress } from '@alvarosilva/hex-address';

// Test with a misspelled address
const result = isValidAddress("helo-woard", "ascii-dnqqwn", true);

if (!result.isValid) {
  console.log('Validation failed:');
  result.errors.forEach((error, index) => {
    console.log(`${index + 1}. [${error.type}] ${error.message}`);
    if (error.suggestions) {
      console.log(`   Suggestions: ${error.suggestions.slice(0, 3).join(', ')}`);
    }
  });
}
```

### Python Example
```python
from h3_syllable import H3SyllableSystem

system = H3SyllableSystem('ascii-dnqqwn')

# Test with a misspelled address
result = system.is_valid_address("helo-woard", detailed=True)

if not result['is_valid']:
    print('Validation failed:')
    for i, error in enumerate(result['errors']):
        print(f"{i + 1}. [{error['type']}] {error['message']}")
        if error.get('suggestions'):
            suggestions = error['suggestions'][:3]
            print(f"   Suggestions: {', '.join(suggestions)}")
```

## Performance Notes

- Simple validation (`detailed=False`) maintains the same performance as v1.2.0
- Detailed validation has minimal overhead (~10-20% slower) due to comprehensive error analysis
- Phonetic suggestions are computed on-demand only when errors are found
- Internal caching ensures repeated validations are fast

## Breaking Changes

**None.** Version 1.3.0 is fully backward compatible with v1.2.0.

## Benefits

1. **Better User Experience**: Users get helpful suggestions instead of just "invalid"
2. **Reduced Support Issues**: Clear error messages reduce confusion
3. **Improved Debugging**: Detailed error information helps developers
4. **International Support**: Phonetic confusions cover multiple languages
5. **Accessibility**: Helps users with hearing or pronunciation difficulties