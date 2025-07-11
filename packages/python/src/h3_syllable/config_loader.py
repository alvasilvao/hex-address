#!/usr/bin/env python3
"""
JSON-First Configuration Loader

Loads configurations from JSON files instead of hardcoding them.
"""

import json
import os
import re
from typing import Dict, List
from dataclasses import dataclass
from pathlib import Path


@dataclass
class SyllableConfig:
    """Configuration for syllable system."""
    name: str
    description: str
    consonants: List[str]
    vowels: List[str]
    address_length: int
    max_consecutive: int
    h3_resolution: int = 15
    metadata: Dict = None
    
    def __post_init__(self):
        """Initialize default metadata if not provided."""
        if self.metadata is None:
            self.metadata = {}
    
    @property
    def total_syllables(self) -> int:
        """Calculate total syllables."""
        return len(self.consonants) * len(self.vowels)
    
    @property
    def address_space(self) -> int:
        """Calculate address space without consecutive restrictions."""
        return self.total_syllables ** self.address_length
    
    @property
    def config_id(self) -> str:
        """Generate configuration ID."""
        return self.name.lower().replace(' ', '-')
    
    @property
    def is_auto_generated(self) -> bool:
        """Check if configuration was auto-generated."""
        return self.metadata.get('auto_generated', False)
    
    @property
    def identifier(self) -> str:
        """Get the unique identifier for this configuration."""
        return self.metadata.get('identifier', '')
    
    @property
    def coverage_percentage(self) -> float:
        """Get coverage percentage of H3 space."""
        return self.metadata.get('coverage_percentage', 0.0)


class ConfigLoader:
    """Loads configurations from JSON files."""
    
    def __init__(self, config_dir: str = None):
        if config_dir is None:
            # Default to package configs directory
            config_dir = Path(__file__).parent / "configs"
        
        self.config_dir = Path(config_dir)
        self._configs = {}
        self._load_all_configs()
    
    def _load_all_configs(self):
        """Load all JSON configuration files."""
        if not self.config_dir.exists():
            raise FileNotFoundError(f"Config directory not found: {self.config_dir}")
        
        for json_file in self.config_dir.glob("*.json"):
            config_name = json_file.stem  # filename without .json
            try:
                # Check file size limit (1MB max)
                if json_file.stat().st_size > 1024 * 1024:
                    print(f"⚠️ Warning: Config file {json_file} exceeds size limit")
                    continue
                
                with open(json_file, 'r') as f:
                    config_data = json.load(f)
                
                config = SyllableConfig(**config_data)
                self._configs[config_name] = config
                
            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Warning: Could not load config {json_file}: Invalid format")
            except Exception as e:
                print(f"⚠️ Warning: Could not load config {json_file}: {type(e).__name__}")
    
    def get_config(self, config_name: str) -> SyllableConfig:
        """Get configuration by name."""
        # Validate config name format to prevent path traversal
        if not re.match(r'^[a-zA-Z0-9_-]+$', config_name):
            raise ValueError(f"Invalid configuration name format: {config_name}")
        
        if config_name not in self._configs:
            available = ", ".join(self._configs.keys())
            raise ValueError(f"Configuration '{config_name}' not found. Available: {available}")
        return self._configs[config_name]
    
    def list_configs(self) -> List[str]:
        """List all available configuration names."""
        return list(self._configs.keys())
    
    def get_all_configs(self) -> Dict[str, SyllableConfig]:
        """Get all configurations."""
        return self._configs.copy()
    
    def add_config(self, config_name: str, config: SyllableConfig, save_to_file: bool = True):
        """Add a new configuration."""
        self._configs[config_name] = config
        
        if save_to_file:
            self.save_config(config_name, config)
    
    def save_config(self, config_name: str, config: SyllableConfig):
        """Save configuration to JSON file."""
        config_dict = {
            'name': config.name,
            'description': config.description,
            'consonants': config.consonants,
            'vowels': config.vowels,
            'address_length': config.address_length,
            'max_consecutive': config.max_consecutive,
            'h3_resolution': config.h3_resolution
        }
        
        # Include metadata if present
        if config.metadata:
            config_dict['metadata'] = config.metadata
        
        self.config_dir.mkdir(exist_ok=True)
        filepath = self.config_dir / f"{config_name}.json"
        
        with open(filepath, 'w') as f:
            json.dump(config_dict, f, indent=2)
    
    def list_auto_generated_configs(self) -> List[str]:
        """List all auto-generated configuration names."""
        return [name for name, config in self._configs.items() if config.is_auto_generated]
    
    def list_manual_configs(self) -> List[str]:
        """List all manually created configuration names."""
        return [name for name, config in self._configs.items() if not config.is_auto_generated]
    
    def find_configs_by_identifier(self, identifier: str) -> List[str]:
        """Find configurations by identifier pattern."""
        matching_configs = []
        for name, config in self._configs.items():
            if config.identifier == identifier:
                matching_configs.append(name)
        return matching_configs
    
    def find_configs_by_letters(self, letters: List[str]) -> List[str]:
        """Find configurations that use exactly these letters."""
        letter_set = set(letter.lower() for letter in letters)
        matching_configs = []
        
        for name, config in self._configs.items():
            config_letters = set(config.consonants + config.vowels)
            if config_letters == letter_set:
                matching_configs.append(name)
        
        return matching_configs
    
    def get_config_by_criteria(self, 
                             consonant_count: int = None,
                             vowel_count: int = None,
                             address_length: int = None,
                             max_consecutive: int = None) -> List[str]:
        """Find configurations matching specific criteria."""
        matching_configs = []
        
        for name, config in self._configs.items():
            match = True
            
            if consonant_count is not None and len(config.consonants) != consonant_count:
                match = False
            if vowel_count is not None and len(config.vowels) != vowel_count:
                match = False
            if address_length is not None and config.address_length != address_length:
                match = False
            if max_consecutive is not None and config.max_consecutive != max_consecutive:
                match = False
            
            if match:
                matching_configs.append(name)
        
        return matching_configs
    
    def get_config_stats(self) -> Dict:
        """Get statistics about all loaded configurations."""
        stats = {
            'total_configs': len(self._configs),
            'auto_generated': len(self.list_auto_generated_configs()),
            'manual': len(self.list_manual_configs()),
            'by_consecutive': {},
            'by_address_length': {},
            'by_syllable_count': {}
        }
        
        for config in self._configs.values():
            # Count by max consecutive
            max_cons = config.max_consecutive
            stats['by_consecutive'][max_cons] = stats['by_consecutive'].get(max_cons, 0) + 1
            
            # Count by address length
            addr_len = config.address_length
            stats['by_address_length'][addr_len] = stats['by_address_length'].get(addr_len, 0) + 1
            
            # Count by syllable count
            syllable_count = config.total_syllables
            stats['by_syllable_count'][syllable_count] = stats['by_syllable_count'].get(syllable_count, 0) + 1
        
        return stats


# Global instance
_config_loader = None

def get_config_loader() -> ConfigLoader:
    """Get the global configuration loader."""
    global _config_loader
    if _config_loader is None:
        _config_loader = ConfigLoader()
    return _config_loader


# Convenience functions
def get_config(config_name: str) -> SyllableConfig:
    """Get configuration by name."""
    return get_config_loader().get_config(config_name)


def list_configs() -> List[str]:
    """List all available configuration names."""
    return get_config_loader().list_configs()


def get_all_configs() -> Dict[str, SyllableConfig]:
    """Get all configurations."""
    return get_config_loader().get_all_configs()


def list_auto_generated_configs() -> List[str]:
    """List all auto-generated configuration names."""
    return get_config_loader().list_auto_generated_configs()


def find_configs_by_identifier(identifier: str) -> List[str]:
    """Find configurations by identifier."""
    return get_config_loader().find_configs_by_identifier(identifier)


def find_configs_by_letters(letters: List[str]) -> List[str]:
    """Find configurations that use exactly these letters."""
    return get_config_loader().find_configs_by_letters(letters)


def get_config_stats() -> Dict:
    """Get statistics about all loaded configurations."""
    return get_config_loader().get_config_stats()


if __name__ == "__main__":
    # Demo
    loader = ConfigLoader()
    
    print("📂 JSON-First Configuration System")
    print("=" * 40)
    print(f"Config directory: {loader.config_dir}")
    print(f"Loaded configs: {len(loader.list_configs())}")
    
    # Show statistics
    stats = loader.get_config_stats()
    print(f"\n📊 Statistics:")
    print(f"   Total configs: {stats['total_configs']}")
    print(f"   Auto-generated: {stats['auto_generated']}")
    print(f"   Manual: {stats['manual']}")
    
    # List auto-generated configs
    auto_configs = loader.list_auto_generated_configs()
    if auto_configs:
        print(f"\n🤖 Auto-generated configs:")
        for config_name in auto_configs:
            config = loader.get_config(config_name)
            print(f"   {config_name}: {config.identifier} ({config.total_syllables} syllables)")
    
    # List manual configs
    manual_configs = loader.list_manual_configs()
    if manual_configs:
        print(f"\n👤 Manual configs:")
        for config_name in manual_configs:
            config = loader.get_config(config_name)
            print(f"   {config_name}: {config.description}")
    
    # Show all configs
    print(f"\n📋 All configurations:")
    for config_name in loader.list_configs():
        config = loader.get_config(config_name)
        print(f"   {config_name}: {len(config.consonants)}C × {len(config.vowels)}V = {config.total_syllables} syllables")