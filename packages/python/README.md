# Hex Address - Python Package

[![PyPI version](https://badge.fury.io/py/hex-address.svg)](https://badge.fury.io/py/hex-address)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Convert GPS coordinates to memorable syllable addresses like `je-ma-su-cu|du-ve-gu-ba` with ~0.5 meter precision using spatially optimized H3 indexing.

## 🚀 Quick Start

```bash
pip install hex-address
```

```python
from hex_address import H3SyllableSystem

# Initialize system (uses default ascii-fqwfmd config)
system = H3SyllableSystem()

# Convert coordinates to syllable address  
address = system.coordinate_to_syllable(48.8566, 2.3522)
print(address)  # "je-ma-su-cu|du-ve-gu-ba"

# Convert back to coordinates
lat, lon = system.syllable_to_coordinate(address)
print(f"{lat:.6f}, {lon:.6f}")  # 48.856602, 2.352198

# Validate addresses (some combinations don't exist)
if system.is_valid_syllable_address(address):
    print("Valid address!")
```

## 🛠️ Command Line Interface

```bash
# Convert coordinates to syllable address
hex-address coordinate 48.8566 2.3522

# Convert syllable address to coordinates  
hex-address syllable "je-ma-su-cu|du-ve-gu-ba"

# Validate an address
hex-address validate "je-ma-su-cu|du-ve-gu-ba"

# List available configurations
hex-address configs

# Use specific configuration
hex-address --config ascii-cjbnb coordinate 48.8566 2.3522
```

## 📋 Features

- **Sub-meter precision** (~0.5m) using H3 Level 15
- **Spatially optimized** with perfect Hamiltonian path (100% adjacency)
- **Memorable addresses** using pronounceable syllables
- **Perfect reversibility** for all real coordinates
- **Dynamic formatting** with pipe separators for readability
- **Multiple configurations** optimized for different use cases
- **Pure ASCII** letters for universal compatibility
- **CLI tool** for easy integration

## 🎯 Configuration Options

Choose from multiple configurations based on your needs:

```python
# Full ASCII alphabet (21 consonants, 5 vowels, 8 syllables)
system = H3SyllableSystem('ascii-fqwfmd')  # Default

# Minimal balanced (10 consonants, 5 vowels, 9 syllables) 
system = H3SyllableSystem('ascii-cjbnb')

# Japanese-friendly (no L/R confusion)
system = H3SyllableSystem('ascii-fqwclj')

# List all available configurations
from h3_syllable import list_available_configs
print(list_available_configs())
```

## 🌍 Use Cases

- **Emergency services**: Share precise locations memorably
- **Logistics**: Human-friendly delivery addresses  
- **Gaming**: Location-based game mechanics
- **International**: Cross-language location sharing with ASCII compatibility
- **Navigation**: Easy-to-communicate waypoints

## 🔬 Technical Details

- **Precision**: ~0.5 meter accuracy (H3 Resolution 15)
- **Coverage**: 122 × 7^15 = 579,202,504,213,046 H3 positions
- **Constraint**: max_consecutive = 1 (no adjacent identical syllables)
- **Spatial optimization**: 100% adjacency through Hamiltonian path
- **Performance**: ~6,700 conversions/second

## 📖 API Reference

### Core Functions

```python
from hex_address import H3SyllableSystem

# Initialize with specific configuration
system = H3SyllableSystem('ascii-fqwfmd')

# Convert coordinates to syllable
address = system.coordinate_to_syllable(latitude, longitude)

# Convert syllable to coordinates
latitude, longitude = system.syllable_to_coordinate(address)

# Validate syllable address
is_valid = system.is_valid_syllable_address(address)

# Get system information
info = system.get_system_info()

# Test round-trip accuracy
result = system.test_round_trip(latitude, longitude)
```

### Convenience Functions

```python
from h3_syllable import coordinate_to_syllable, syllable_to_coordinate

# Quick conversions with default config
address = coordinate_to_syllable(48.8566, 2.3522)
lat, lon = syllable_to_coordinate(address)

# With specific config
address = coordinate_to_syllable(48.8566, 2.3522, config_name='ascii-cjbnb')
```

## 📖 Documentation

For complete documentation, architecture details, and research background, visit the [main repository](https://github.com/alvasilvao/hex-address).

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.