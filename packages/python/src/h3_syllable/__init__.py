"""
Hex Address System

A reversible system for converting GPS coordinates to memorable syllable-based 
addresses using Uber's H3 spatial indexing system.

Features:
- Sub-meter precision (~0.5m) using H3 Level 15
- Memorable syllable addresses (e.g., "je-ma-su-cu|du-ve-gu-ba")
- Perfect reversible mapping for all real coordinates
- Multiple language-specific configurations
- Address validation (some combinations don't exist, like street addresses)
- International pronunciation optimization

Example:
    >>> from hex_address import H3SyllableSystem, is_valid_syllable_address
    >>> 
    >>> # Initialize system
    >>> system = H3SyllableSystem("ascii-fqwfmd")
    >>> 
    >>> # Convert coordinate to syllable address
    >>> address = system.coordinate_to_syllable(48.8566, 2.3522)
    >>> print(address)  # "je-ma-su-cu|du-ve-gu-ba"
    >>> 
    >>> # Convert back to coordinates
    >>> lat, lon = system.syllable_to_coordinate(address)
    >>> print(f"{lat:.6f}, {lon:.6f}")  # 48.856602, 2.352198
    >>> 
    >>> # Validate addresses (some combinations don't exist)
    >>> is_valid = system.is_valid_syllable_address(address)
    >>> print(is_valid)  # True
"""

from .h3_syllable_system import (
    H3SyllableSystem,
    H3SyllableError,
    ConversionError,
    SystemInfo,
    coordinate_to_syllable,
    syllable_to_coordinate,
    is_valid_syllable_address,
    list_available_configs,
    get_config_info,
)

from .config_loader import (
    SyllableConfig,
    get_config,
    get_all_configs,
    list_configs,
)

__version__ = "1.0.0"
__author__ = "Álvaro Silva"
__license__ = "MIT"
__description__ = "Convert GPS coordinates to memorable hex addresses"

# Public API
__all__ = [
    # Main classes
    "H3SyllableSystem",
    "SyllableConfig",
    "SystemInfo",
    
    # Exceptions
    "H3SyllableError", 
    "ConversionError",
    
    # Convenience functions
    "coordinate_to_syllable",
    "syllable_to_coordinate", 
    "is_valid_syllable_address",
    
    # Configuration functions
    "get_config",
    "get_all_configs",
    "list_configs",
    "list_available_configs",
    "get_config_info",
    
    # Package metadata
    "__version__",
    "__author__",
    "__license__",
    "__description__",
]