# Hex Address System

A human-friendly addressing system that converts GPS coordinates to memorable syllable addresses using H3 hexagonal indexing with optimized spatial ordering.

## 🎯 Overview

Transform GPS coordinates into easy-to-remember syllable addresses like `je-ma-su-cu|du-ve-gu-ba`. This system provides sub-meter precision (~0.5m) while maintaining perfect reversibility and human readability.

**Key Features:**
- **Sub-meter precision**: ~0.5 meter accuracy using H3 resolution 15
- **Human-readable**: Syllable addresses with intelligent formatting (pipes separate groups)
- **Perfectly reversible**: Bijective mapping between coordinates and syllables
- **Spatially optimized**: Hamiltonian path ordering for 6.0x improved spatial locality
- **Pure ASCII**: Uses only basic Latin letters for global compatibility
- **Minimal syllables**: Automatically finds minimum address length needed

## 📂 Repository Structure

This repository is cleanly organized into three main parts:

```
h3syl/
├── packages/            # 📦 Production packages
│   ├── python/          # Python package (pip install hex-address)
│   └── javascript/      # JavaScript package (npm install hex-address)
├── scripts/             # 🔧 Development and research tools
│   ├── configs/         # Configuration generation and export
│   ├── hamiltonian/     # Hamiltonian path algorithm and results
│   └── tests/           # Testing utilities
└── configs/             # 🗃️ Configuration files (single source of truth)
```

**Clean Architecture:**
- **Packages contain only distribution files** - no development artifacts
- **Scripts contain all research and tools** - Hamiltonian path, config generation
- **Single configs directory** - exported to both packages automatically

### Package Structure

#### Python Package (`packages/python/`)
- **Ready for PyPI**: `pip install hex-address`
- **Complete API**: Full H3 syllable conversion system
- **CLI included**: Command-line interface

#### JavaScript Package (`packages/javascript/`)
- **Ready for npm**: `npm install hex-address`
- **TypeScript**: Full type definitions included
- **Modern build**: ESM and CommonJS support

#### Development Scripts (`scripts/`)
- **Configuration management**: Generate and export configs
- **Hamiltonian path**: Algorithm implementation and analysis
- **Testing tools**: Validation and testing utilities

## 🚀 Quick Start

### Python
```bash
# Install
pip install hex-address

# Use
from hex_address import H3SyllableSystem
system = H3SyllableSystem()
address = system.coordinate_to_syllable(48.8566, 2.3522)
# Result: "je-ma-su-cu|du-ve-gu-ba"
```

### JavaScript
```bash
# Install
npm install hex-address

# Use
import { H3SyllableSystem } from 'hex-address';
const system = new H3SyllableSystem();
const address = system.coordinateToSyllable(48.8566, 2.3522);
// Result: "je-ma-su-cu|du-ve-gu-ba"
```

### CLI
```bash
# Convert coordinates
hex-address coordinate 48.8566 2.3522

# Convert syllable address
hex-address syllable "je-ma-su-cu|du-ve-gu-ba"

# List available configurations
hex-address configs

# Use specific configuration
hex-address --config ascii-cjbnb coordinate 48.8566 2.3522
```

## 🔧 Development

### Configuration Management

All configurations are generated from character sets and automatically exported to both packages:

```bash
# Generate a single configuration from letters
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou

# Generate all standard configurations
python3 scripts/configs/generate_all_configs.py

# Export configurations to packages
python3 scripts/configs/export_configs.py
```

### Testing

```bash
# Run comprehensive validation tests
python3 scripts/tests/test_bidirectional_validation.py

# Test basic functionality
python3 scripts/tests/test_basic_functionality.py

# Validate configuration generation
python3 scripts/tests/validate_config_generation.py
```

## 🗺️ Spatial Optimization: Perfect Hamiltonian Path

### 🎯 Mission Accomplished: 100% Adjacency

We achieved the **theoretical maximum** for spatial locality in H3 level 0 cells by finding a perfect Hamiltonian path through all 122 cells.

| Metric | Original H3 | Our Solution | Improvement |
|--------|-------------|--------------|-------------|
| **Spatial Adjacency** | 16.5% | **100%** | **6.0x** |
| **Path Continuity** | Broken | Perfect | ∞ |
| **Global Coverage** | 122 cells | 122 cells | Complete |

### Algorithm Achievement

**Perfect Hamiltonian Path Details:**
- **Start**: Cell 4 → **End**: Cell 93
- **Length**: 122 cells (all H3 level 0 cells)
- **Breaks**: 0 (single continuous line)
- **Algorithm**: Deterministic backtracking
- **Result**: Every consecutive pair is spatially adjacent

## 🎯 Configuration System

### Simple Character-Based Generation

Configurations are created from character sets (alphabets) using a deterministic algorithm:

1. **Input**: List of letters from an alphabet (e.g., ASCII)
2. **Process**: Separate consonants/vowels, calculate minimum syllables needed
3. **Output**: Configuration named `{alphabet}-{base26_identifier}`

### Available Configurations

All configurations use the ASCII character set with different letter selections:

| Config Name | Letters | Consonants | Vowels | Address Length | Use Case |
|-------------|---------|------------|--------|----------------|----------|
| **ascii-fqwfmd** | 26 | 21 | 5 | 8 | Full ASCII (default) |
| **ascii-jaxqt** | 21 | 16 | 5 | 8 | Common typing letters |
| **ascii-fqwclj** | 25 | 20 | 5 | 8 | No L (Japanese-friendly) |
| **ascii-fqsmnn** | 25 | 20 | 5 | 8 | No Q (Spanish-friendly) |
| **ascii-cjbnb** | 15 | 10 | 5 | 9 | Minimal balanced |
| **ascii-dsyp** | 16 | 12 | 4 | 9 | Minimal compact |

### Address Formatting

Addresses are dynamically formatted based on length:

- **6 syllables**: `xx-xx-xx|xx-xx-xx`
- **7 syllables**: `xx-xx-xx-xx|xx-xx-xx`
- **8 syllables**: `xx-xx-xx-xx|xx-xx-xx-xx`
- **9 syllables**: `xx-xx-xx|xx-xx-xx|xx-xx-xx`
- **10+ syllables**: Groups of 3 separated by pipes

### Creating New Configurations

```bash
# Create from specific letters
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou

# Save and export to packages
python3 scripts/configs/create_config.py -a ascii -l bcdfghjklmnaeiou --save --export
```

## 📖 API Documentation

### Python API

```python
from h3_syllable import H3SyllableSystem

# Initialize with default config
system = H3SyllableSystem()

# Initialize with specific config
system = H3SyllableSystem('ascii-cjbnb')

# Convert coordinates to syllable
address = system.coordinate_to_syllable(48.8566, 2.3522)
# Returns: "je-ma-su-cu|du-ve-gu-ba"

# Convert syllable to coordinates
lat, lon = system.syllable_to_coordinate("je-ma-su-cu|du-ve-gu-ba")

# Validate address
is_valid = system.is_valid_syllable_address(address)

# Get system information
info = system.get_system_info()
```

### JavaScript API

```javascript
import { H3SyllableSystem } from 'hex-address';

// Initialize
const system = new H3SyllableSystem('ascii-fqwfmd');

// Convert coordinates to syllable
const address = system.coordinateToSyllable(48.8566, 2.3522);

// Convert syllable to coordinates
const [lat, lon] = system.syllableToCoordinate(address);

// Validate address
const isValid = system.isValidSyllableAddress(address);
```

## 🔬 Technical Details

### Precision & Coverage
- **H3 Resolution 15**: ~0.5 meter precision
- **Target Coverage**: 122 × 7^15 = 579,202,504,213,046 H3 positions
- **Constraint**: max_consecutive = 1 (no adjacent identical syllables)
- **Algorithm**: Exact mathematical calculation (no approximations)

### Address Generation Algorithm

1. **Character Set**: Define available characters (ASCII: a-z)
2. **Letter Selection**: Choose subset of characters
3. **Consonant/Vowel Split**: Based on alphabet definition
4. **Minimum Calculation**: Find smallest address length where:
   ```
   constrained_space(consonants × vowels, length) ≥ 579,202,504,213,046
   ```
5. **Base26 Identifier**: Generate from binary array of selected letters

### Spatial Optimization
- **Perfect adjacency**: 100% spatial locality through Hamiltonian path
- **Deterministic**: Reproducible results across all platforms
- **Global**: Covers entire planet including polar regions

### Performance
- **Conversion Speed**: ~6,700 ops/second
- **Memory Usage**: Minimal (hardcoded mappings)
- **Cache Efficiency**: Two-way caching for optimal performance

## 🧪 Testing & Validation

### Comprehensive Test Suite

```bash
# Bidirectional validation (5,000 coordinates)
python3 scripts/tests/test_bidirectional_validation.py

# Basic functionality tests
python3 scripts/tests/test_basic_functionality.py

# Configuration generation validation
python3 scripts/tests/validate_config_generation.py
```

### Test Results
- **100% success rate** across all configurations
- **Sub-meter accuracy** maintained globally
- **Perfect round-trip** conversion accuracy
- **5,000+ coordinates tested** with diverse global distribution

## 🚀 Publishing

### Prerequisites
- **Python**: `pip install build twine`
- **JavaScript**: `npm` with publish access

### Publish Python Package
```bash
cd packages/python
python scripts/build.py
twine upload dist/*
```

### Publish JavaScript Package
```bash
cd packages/javascript
npm run build
npm publish
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Add tests for new functionality**
4. **Ensure all tests pass**
5. **Submit pull request**

### Development Workflow
1. **Modify configurations** using `scripts/configs/`
2. **Run export script** to sync packages
3. **Test both packages** to ensure compatibility
4. **Build and validate** before committing

## 📝 License

MIT License - see LICENSE file for details

## 🎉 Achievements

### Research Breakthrough
- **Solved spatial locality problem** in H3 level 0 cells
- **Achieved perfect adjacency** (100%) with Hamiltonian path
- **6.0x improvement** in spatial performance

### Engineering Excellence
- **Dual-package architecture** for Python and JavaScript
- **Character set-based configuration** for global compatibility
- **Dynamic address formatting** for optimal readability
- **Comprehensive testing** with 100% validation success

### Real-World Impact
- **Sub-meter precision** for global addressing
- **Human-friendly** syllable addresses with intelligent formatting
- **Production-ready** packages for both ecosystems
- **ASCII-only** for universal compatibility

---

**Transform the way the world shares locations - one syllable at a time.**