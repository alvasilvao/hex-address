# H3 Syllable Development Scripts

Development tools and research scripts for the H3 Syllable Address System.

## 📁 Directory Structure

```
scripts/
├── configs/          # Configuration management
├── hamiltonian/      # Spatial optimization research
└── tests/           # Testing and validation utilities
```

## 🔧 Configuration Management (`configs/`)

Tools for generating and managing syllable configurations.

### Create Single Configuration
```bash
# Create configuration from specific letters
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou

# Save to configs directory
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou --save

# Save and export to packages
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou --save --export
```

### Generate All Standard Configurations
```bash
# Generate comprehensive set of ASCII-based configurations
python3 scripts/configs/generate_all_configs.py
```

### Export to Packages
```bash
# Export configurations from configs/ to both Python and JavaScript packages
python3 scripts/configs/export_configs.py
```

### How It Works

1. **Character Set Definition**: Define alphabet (ASCII: a-z) with vowel set
2. **Letter Selection**: Choose subset of characters for configuration
3. **Minimum Calculation**: Find smallest address length where:
   ```
   constrained_space(consonants × vowels, length) ≥ 122 × 7^15
   ```
4. **Base26 Identifier**: Generate unique ID from binary array of selected letters
5. **Configuration Creation**: Name as `{alphabet}-{base26_id}`

## 🗺️ Hamiltonian Path Research (`hamiltonian/`)

Research tools for spatial optimization of H3 level 0 cells.

### Generate Hamiltonian Path
```bash
# Find optimal Hamiltonian path through all 122 H3 level 0 cells
python3 scripts/hamiltonian/h3_hamiltonian_ordering.py
```

### Compare Orderings
```bash
# Compare spatial adjacency of different ordering strategies
python3 scripts/hamiltonian/compare_orderings.py
```

### Visualize Results
```bash
# Create visualizations of Hamiltonian path
python3 scripts/hamiltonian/visualize_hamiltonian_ordering.py
```

### Achievement

- **Perfect spatial adjacency**: 100% (vs 16.5% original H3)
- **Complete Hamiltonian path**: All 122 cells in single continuous line
- **6.0x improvement** in spatial locality

## 🧪 Testing & Validation (`tests/`)

Comprehensive testing utilities for validation and quality assurance.

### Basic Functionality Test
```bash
# Test core conversion functionality
python3 scripts/tests/test_basic_functionality.py
```

### Bidirectional Validation
```bash
# Test round-trip accuracy with 5,000 global coordinates
python3 scripts/tests/test_bidirectional_validation.py
```

### Comprehensive Testing
```bash
# Large-scale testing with 800,000+ coordinates
python3 scripts/tests/test_comprehensive.py
```

### Configuration Generation Validation
```bash
# Validate configuration generation mathematics
python3 scripts/tests/validate_config_generation.py
```

### Test Results

- **100% success rate** across all configurations
- **Sub-meter accuracy** maintained globally
- **Perfect round-trip** conversion accuracy
- **5,000+ coordinates tested** with diverse global distribution

## 🔬 Technical Details

### Configuration Algorithm
The minimum syllable calculation uses exact mathematics for `max_consecutive = 1`:

```python
def calculate_min_syllables_needed(consonants: int, vowels: int) -> int:
    total_syllables = consonants * vowels
    target = 122 * (7 ** 15)  # 579,202,504,213,046
    
    for length in range(1, 20):
        if length == 1:
            space = total_syllables
        elif length == 2:
            space = total_syllables * (total_syllables - 1)
        else:
            # Recurrence relation for max_consecutive = 1
            # f(n) = (k-1) * (f(n-1) + f(n-2))
            prev_prev = total_syllables
            prev = total_syllables * (total_syllables - 1)
            
            for i in range(3, length + 1):
                current = (total_syllables - 1) * (prev + prev_prev)
                prev_prev = prev
                prev = current
            
            space = prev
        
        if space >= target:
            return length
```

### Hamiltonian Path Algorithm
Deterministic backtracking algorithm that:

1. Starts from H3 cell 4
2. Uses neighbor relationships from H3 library
3. Explores all possible paths through backtracking
4. Finds complete path visiting all 122 cells exactly once
5. Results in perfect spatial adjacency (100%)

### Testing Strategy
- **Global distribution**: Tests poles, equator, major cities, random points
- **Multiple configurations**: Validates across all generated configs
- **Round-trip accuracy**: Ensures perfect reversibility
- **Performance measurement**: Tracks conversion speed and accuracy
- **Statistical analysis**: Detailed error reporting and metrics

## 🚀 Usage in Development

1. **Generate configurations**: Use `configs/` tools to create new letter combinations
2. **Export to packages**: Run export script to sync configs to Python/JavaScript
3. **Test thoroughly**: Use `tests/` tools to validate functionality
4. **Research optimization**: Use `hamiltonian/` tools for spatial analysis

All scripts are designed to work independently and can be run in any order as needed for development and research.