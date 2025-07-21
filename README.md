# Hex Address System

A human-friendly addressing system that converts GPS coordinates to memorable syllable addresses using H3 hexagonal indexing with optimized spatial ordering.

[![npm version](https://badge.fury.io/js/%40alvarosilva%2Fhex-address.svg)](https://www.npmjs.com/package/@alvarosilva/hex-address)
[![PyPI version](https://badge.fury.io/py/hex-address.svg)](https://pypi.org/project/hex-address/)

📦 **Available Packages:**
- **JavaScript/TypeScript**: [`@alvarosilva/hex-address`](https://www.npmjs.com/package/@alvarosilva/hex-address) on npm
- **Python**: [`hex-address`](https://pypi.org/project/hex-address/) on PyPI

## 🎯 Overview

Transform GPS coordinates into easy-to-remember syllable addresses like `dinenunukiwufeme`. This system provides meter-level precision (~3m) while maintaining perfect reversibility and human readability.

### Why Hex Address?

**The Problem**: GPS coordinates like `48.8566, 2.3522` are impossible to remember or communicate verbally. Traditional addressing systems fail in remote areas, during emergencies, or for precise outdoor locations.

**The Solution**: Convert any GPS location into a memorable syllable address that humans can easily speak, remember, and share.

### Core Features

- **🎯 Meter-level precision**: ~3 meter accuracy using H3 resolution 14
- **🗣️ Human-readable**: Syllable addresses using consonant-vowel pairs for easy pronunciation
- **🔄 Perfectly reversible**: Bijective mapping between coordinates and syllables
- **🗺️ Spatially optimized**: Hamiltonian path ordering for 6.0x improved spatial locality
- **🌍 Pure ASCII**: Uses only basic Latin letters for global compatibility
- **⚡ Minimal syllables**: Automatically finds minimum address length needed

### 📱 Why Resolution 14?

We use H3 resolution level 14 (~3m precision) instead of the maximum resolution 15 (~0.5m precision) because:

- **📱 Phone GPS Reality**: Modern smartphones typically achieve 3-5 meter accuracy under normal conditions
- **⚖️ Practical Balance**: Resolution 14 provides sufficient precision for real-world use cases while maintaining efficiency
- **🔋 Reduced Complexity**: Shorter computational requirements and smaller address space
- **🌐 Global Consistency**: Consistent precision expectations worldwide, regardless of local GPS infrastructure

This makes our system more aligned with actual device capabilities and user expectations.

### Real-World Applications

- **Emergency Services**: "Send help to `dinenunukiwufeme`"
- **Delivery & Logistics**: Precise location sharing for outdoor deliveries
- **Outdoor Activities**: Hiking, camping, and adventure meetup points
- **IoT & Asset Tracking**: Memorable identifiers for devices and equipment

## 📂 Repository Structure

This repository follows a clean, production-ready architecture designed for maintainability and clarity:

```
hex-address/
├── packages/            # 📦 Production packages (ready for distribution)
│   ├── python/          # Python package → PyPI (pip install hex-address)
│   └── javascript/      # JavaScript package → npm (npm install @alvarosilva/hex-address)
├── scripts/             # 🔧 Development and research tools
│   ├── configs/         # Configuration generation and export
│   ├── hamiltonian/     # Hamiltonian path algorithm and results
│   └── tests/           # Testing utilities
└── configs/             # 🗃️ Configuration files (single source of truth)
```

### Architecture Principles

**🎯 Separation of Concerns**
- **`packages/`**: Contains only distribution-ready code, no development artifacts
- **`scripts/`**: Houses all research, tooling, and development utilities
- **`configs/`**: Single source of truth for all configuration files

**🔄 Automated Synchronization**
- Configurations are generated in `configs/` and automatically exported to both packages
- Ensures consistency across Python and JavaScript implementations
- Eliminates manual synchronization errors

**🚀 Production Ready**
- Each package is independently deployable
- Clean build processes with proper dependencies
- Comprehensive testing and validation

### Package Structure

#### Python Package (`packages/python/`)
- **Ready for PyPI**: `pip install hex-address`
- **Complete API**: Full H3 syllable conversion system
- **CLI included**: Command-line interface

#### JavaScript Package (`packages/javascript/`)
- **Ready for npm**: `npm install @alvarosilva/hex-address`
- **TypeScript**: Full type definitions included
- **Modern build**: ESM and CommonJS support

#### Development Scripts (`scripts/`)
- **Configuration management**: Generate and export configs
- **Hamiltonian path**: Algorithm implementation and analysis
- **Testing tools**: Validation and testing utilities

## 🚀 Quick Start

### Python Installation & Usage

```bash
# Install from PyPI
pip install hex-address
```

```python
# Note: Package installs as 'hex-address' but imports as 'h3_syllable'
from h3_syllable import H3SyllableSystem

# Initialize the system
system = H3SyllableSystem()

# Convert coordinates to syllable address
address = system.coordinate_to_syllable(48.8566, 2.3522)  # Eiffel Tower
print(address)  # "dinenunukiwufeme"

# Convert back to coordinates
lat, lon = system.syllable_to_coordinate("dinenunukiwufeme")
print(f"Latitude: {lat}, Longitude: {lon}")  # 48.8566, 2.3522

# Validate an address
is_valid = system.is_valid_address("dinenunukiwufeme")
print(f"Valid address: {is_valid}")  # True
```

### JavaScript Installation & Usage

```bash
# Install from npm
npm install @alvarosilva/hex-address
```

```javascript
import { H3SyllableSystem } from '@alvarosilva/hex-address';

// Initialize the system
const system = new H3SyllableSystem();

// Convert coordinates to syllable address
const address = system.coordinateToAddress(48.8566, 2.3522);  // Eiffel Tower
console.log(address);  // "dinenunukiwufeme"

// Convert back to coordinates
const [lat, lon] = system.addressToCoordinate("dinenunukiwufeme");
console.log(`Latitude: ${lat}, Longitude: ${lon}`);  // 48.8566, 2.3522

// Validate an address
const isValid = system.isValidAddress("dinenunukiwufeme");
console.log(`Valid address: ${isValid}`);  // true
```

### Try Different Locations

```python
# Python examples
system = H3SyllableSystem()

# Times Square, New York
print(system.coordinate_to_address(40.7580, -73.9855))

# Big Ben, London  
print(system.coordinate_to_address(51.5007, -0.1246))

# Sydney Opera House
print(system.coordinate_to_address(-33.8568, 151.2153))
```

### CLI
```bash
# Convert coordinates
python3 -m h3_syllable.cli coordinate 48.8566 2.3522

# Convert syllable address  
python3 -m h3_syllable.cli syllable "dinenunukiwufeme"

# List available configurations
python3 -m h3_syllable.cli configs

# Use specific configuration
python3 -m h3_syllable.cli --config ascii-dnqqwn coordinate 48.8566 2.3522
```

Note: The CLI is available through the Python module. If you've installed the package globally, you may also use the `hex-address` command directly.

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

### Available Configuration

The system currently includes one optimized configuration:

| Config Name | Letters | Consonants | Vowels | Address Length | Description |
|-------------|---------|------------|--------|----------------|-------------|
| **ascii-dnqqwn** | 20 | 15 | 5 | 8 | Basic Latin alphabet, optimized for global compatibility (default) |

**Configuration Details:**
- **Consonants**: d, f, h, k, l, m, n, p, r, s, t (11 letters)
- **Vowels**: a, e, i, o, u (5 letters)
- **Total Syllables**: 55 (11 × 5)
- **Address Space**: 986,912,191,996,800 possible addresses
- **Coverage**: 1.70x of required H3 space for global precision

### Address Format

Addresses are generated as concatenated consonant-vowel syllables:

- **8 syllables** (default): `dinenunukiwufeme` (16 characters: di-ne-nu-nu-ki-wu-fe-me)
- **9 syllables** (minimal configs): `dinenunukiwufemedo` (18 characters)
- Each syllable is **2 characters**: consonant + vowel
- No separators in the actual address string
- Easy pronunciation with alternating consonant-vowel pattern

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
system = H3SyllableSystem('ascii-dnqqwn')

# Convert coordinates to syllable
address = system.coordinate_to_syllable(48.8566, 2.3522)
# Returns: "dinenunukiwufeme"

# Convert syllable to coordinates
lat, lon = system.syllable_to_coordinate("dinenunukiwufeme")

# Validate address
is_valid = system.is_valid_address(address)

# Get system information
info = system.get_system_info()
```

### JavaScript API

```javascript
import { H3SyllableSystem } from '@alvarosilva/hex-address';

// Initialize
const system = new H3SyllableSystem('ascii-dnqqwn');

// Convert coordinates to syllable
const address = system.coordinateToAddress(48.8566, 2.3522);

// Convert syllable to coordinates
const [lat, lon] = system.addressToCoordinate(address);

// Validate address
const isValid = system.isValidAddress(address);
```

## 🔬 Technical Details

### Precision & Coverage
- **H3 Resolution 14**: ~3 meter precision
- **Target Coverage**: 122 × 7^14 = 82,743,214,887,578 H3 positions
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

## 🔍 Detailed Step-by-Step Conversion Process

### System Configuration
The Bologna example uses these parameters:
- **Consonants (11)**: [d, f, h, k, l, m, n, p, r, s, t]
- **Vowels (5)**: [a, e, i, o, u]  
- **Total syllables**: 55 (11 × 5)
- **Address length**: 8 syllables
- **H3 resolution**: 14 (~3m precision)

---

## 🌍 Coordinate → Address Conversion

**Bologna coordinates (44.4949°N, 11.3426°E) → `dijuwedihejasopo`**

### Step 1: GPS Coordinates → H3 Cell ID
```
Input:  44.4949°N, 11.3426°E (Bologna, Italy)
Process: h3.latlng_to_cell(44.4949, 11.3426, 15)
Output: 8f1ea05866e5628 (hexadecimal H3 cell identifier)
Binary: 0b100011110001111010100000010110000110011011100101011000101000
Decimal: 644,553,531,141,805,608
```

### Step 2: H3 Cell ID → Hierarchical Array
```
Input:  8f1ea05866e5628
Output: [15, 2, 4, 0, 2, 6, 0, 6, 3, 3, 4, 5, 3, 0, 5, 0]
```
**Hierarchical path breakdown:**
- Position 0: **15** (base cell - one of 122 H3 icosahedral faces)
- Position 1: **2** (resolution 1 - child cell 0-6)
- Position 2: **4** (resolution 2 - child cell 0-6)
- Position 3: **0** (resolution 3 - child cell 0-6)
- ...continuing through resolution 15...
- Position 15: **0** (resolution 15 - final child cell 0-6)

### Step 3: Hierarchical Array → Integer Index
```
Input:  [15, 2, 4, 0, 2, 6, 0, 6, 3, 3, 4, 5, 3, 0, 5, 0]
Output: 30,235,058,244,643
```
**Mixed-radix calculation (right to left):**
- Position 15: 0 × 1 = 0
- Position 14: 5 × 7 = 35  
- Position 13: 0 × 49 = 0
- Position 12: 3 × 343 = 1,029
- Position 11: 5 × 2,401 = 12,005
- Position 10: 4 × 16,807 = 67,228
- Position 9: 3 × 117,649 = 352,947
- Position 8: 3 × 823,543 = 2,470,629
- Position 7: 6 × 5,764,801 = 34,588,806
- Position 6: 0 × 40,353,607 = 0
- Position 5: 6 × 282,475,249 = 1,694,851,494
- Position 4: 2 × 1,977,326,743 = 3,954,653,486
- Position 3: 0 × 13,841,287,201 = 0
- Position 2: 4 × 96,889,010,407 = 387,556,041,628
- Position 1: 2 × 678,223,072,849 = 1,356,446,145,698
- Position 0: 15 → **6** (Hamiltonian mapping) × 4,747,561,509,943 = 28,485,369,059,658

**Total: 30,235,058,244,643**

### Step 4: Integer Index → Syllable Address
```
Input:  30,235,058,244,643
Output: dijuwedihejasopo
```
**Base-75 conversion (processing right to left):**
- Position 0: 30,235,058,244,643 ÷ 75 = remainder **43** → consonant[8](p) + vowel[3](o) = "**po**"
- Position 1: 403,134,109,928 ÷ 75 = remainder **53** → consonant[10](s) + vowel[3](o) = "**so**"  
- Position 2: 5,375,121,465 ÷ 75 = remainder **15** → consonant[3](j) + vowel[0](a) = "**ja**"
- Position 3: 71,668,286 ÷ 75 = remainder **11** → consonant[2](h) + vowel[1](e) = "**he**"
- Position 4: 955,577 ÷ 75 = remainder **2** → consonant[0](d) + vowel[2](i) = "**di**"
- Position 5: 12,741 ÷ 75 = remainder **66** → consonant[13](w) + vowel[1](e) = "**we**"
- Position 6: 169 ÷ 75 = remainder **19** → consonant[3](j) + vowel[4](u) = "**ju**"
- Position 7: 2 ÷ 75 = remainder **2** → consonant[0](d) + vowel[2](i) = "**di**"

**Final syllables (reversed): [di, ju, we, di, he, ja, so, po] → `dijuwedihejasopo`**

---

## 🎯 Address → Coordinate Conversion

**`dijuwedihejasopo` → Bologna coordinates (44.494902°N, 11.342603°E)**

### Step 1: Syllable Address → Integer Index
```
Input:  dijuwedihejasopo
Output: 30,235,058,244,643
```
**Syllable parsing and indexing:**
- "di" = d[0] + i[2] → index **2**
- "ju" = j[3] + u[4] → index **19**  
- "we" = w[13] + e[1] → index **66**
- "di" = d[0] + i[2] → index **2**
- "he" = h[2] + e[1] → index **11**
- "ja" = j[3] + a[0] → index **15**
- "so" = s[10] + o[3] → index **53**
- "po" = p[8] + o[3] → index **43**

**Base-75 to integer conversion:**
- 43 × 75⁰ = 43 × 1 = 43
- 53 × 75¹ = 53 × 75 = 3,975
- 15 × 75² = 15 × 5,625 = 84,375
- 11 × 75³ = 11 × 421,875 = 4,640,625
- 2 × 75⁴ = 2 × 31,640,625 = 63,281,250
- 66 × 75⁵ = 66 × 2,373,046,875 = 156,621,093,750
- 19 × 75⁶ = 19 × 177,978,515,625 = 3,381,591,796,875
- 2 × 75⁷ = 2 × 13,348,388,671,875 = 26,696,777,343,750

**Sum: 30,235,058,244,643**

### Step 2: Integer Index → Hierarchical Array
```
Input:  30,235,058,244,643
Output: [15, 2, 4, 0, 2, 6, 0, 6, 3, 3, 4, 5, 3, 0, 5, 0]
```
**Reverse mixed-radix conversion:**

**Base cell extraction:**
- Base multiplier: 7¹⁵ = 4,747,561,509,943
- Hamiltonian base cell: 30,235,058,244,643 ÷ 4,747,561,509,943 = **6**
- Original base cell: Hamiltonian⁻¹[6] = **15**
- Remainder: 1,749,689,184,985

**Child position extraction (right to left):**
- Position 15: 1,749,689,184,985 % 7 = **0**
- Position 14: 249,955,597,855 % 7 = **5**
- Position 13: 35,707,942,550 % 7 = **0**
- Position 12: 5,101,134,650 % 7 = **3**
- ...continuing until...
- Position 1: 2 % 7 = **2**

### Step 3: Hierarchical Array → H3 Cell ID
```
Input:  [15, 2, 4, 0, 2, 6, 0, 6, 3, 3, 4, 5, 3, 0, 5, 0]
Output: 8f1ea05866e5628
```
Reconstructing H3's hexadecimal format from hierarchical path using H3's internal algorithms.

### Step 4: H3 Cell ID → GPS Coordinates
```
Input:  8f1ea05866e5628
Process: h3.cell_to_latlng("8f1ea05866e5628")
Output: 44.494902°N, 11.342603°E
```

---

## ✅ Accuracy Verification
```
Original coordinates: 44.4949°N, 11.3426°E
Converted result:     44.494902°N, 11.342603°E
Precision error:      0.0000016° lat, 0.0000034° lon
Distance error:       0.32 meters
```
**Perfect round-trip accuracy within H3's ~3m cell precision.**

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
- **Meter-level accuracy** maintained globally
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
