#!/usr/bin/env python3
"""
Generate All Standard Configurations

Complete configuration generation and export system for different audiences.
Users must modify the letter_sets below to create configurations for their target audiences.

ASSUMPTIONS:
- ASCII alphabet only (a-z)
- Vowels are always: a, e, i, o, u
- Syllables are consonant + vowel pairs (CV pattern)
- max_consecutive = 1 (no repeated adjacent syllables)
- Address length automatically calculated for H3 coverage
- Target: 579,202,504,213,046 H3 positions (122 × 7^15)
"""

import sys
import os
import json
import math
import shutil
from pathlib import Path
from typing import List, Dict, Tuple, Set, Any

# Add package src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'python', 'src'))

from h3_syllable.config_loader import SyllableConfig


class ConfigGenerator:
    """Generate configurations from character sets."""
    
    def __init__(self):
        self.h3_target = 122 * (7 ** 15)  # 579,202,504,213,046 H3 positions
        self.config_dir = Path(__file__).parent.parent.parent / "configs"
        
        # Define character sets (alphabets)
        # Each alphabet is a complete set of characters used by that writing system
        self.alphabets = {
            'ascii': {
                'name': 'ASCII',
                'description': 'Basic Latin alphabet',
                'characters': list('abcdefghijklmnopqrstuvwxyz'),
                'vowels': set('aeiou'),  # Standard vowels in this alphabet
            },
            # Future alphabets can be added here:
            # 'cyrillic': {
            #     'name': 'Cyrillic',
            #     'description': 'Cyrillic alphabet',
            #     'characters': list('абвгдежзийклмнопрстуфхцчшщъыьэюя'),
            #     'vowels': set('аеёиоуыэюя'),
            # },
        }
    
    def calculate_min_syllables_needed(self, consonants: int, vowels: int) -> Tuple[int, int, float]:
        """
        Calculate minimum address length needed to cover H3 space.
        
        For max_consecutive = 1, we use the exact formula for sequences
        where no two adjacent elements are the same.
        
        Returns:
            Tuple of (min_length, total_combinations, coverage_ratio)
        """
        total_syllables = consonants * vowels
        
        # Start from length 1 and find minimum that covers H3 space
        for length in range(1, 20):  # Max reasonable length
            if length == 1:
                space = total_syllables
            elif length == 2:
                space = total_syllables * (total_syllables - 1)
            else:
                # Use recurrence relation for max_consecutive = 1
                prev_prev = total_syllables  # f(1)
                prev = total_syllables * (total_syllables - 1)  # f(2)
                
                for i in range(3, length + 1):
                    current = (total_syllables - 1) * (prev + prev_prev)
                    prev_prev = prev
                    prev = current
                
                space = prev
            
            if space >= self.h3_target:
                coverage_ratio = space / self.h3_target
                return length, space, coverage_ratio
        
        return None, None, None  # Cannot achieve with reasonable length
    
    def create_binary_array(self, alphabet_name: str, selected_letters: List[str]) -> List[int]:
        """Create binary array showing which letters from alphabet are selected."""
        alphabet = self.alphabets[alphabet_name]
        binary_array = []
        
        for char in alphabet['characters']:
            binary_array.append(1 if char in selected_letters else 0)
        
        return binary_array
    
    def binary_to_base26(self, binary_array: List[int]) -> str:
        """Convert binary array to base26 identifier."""
        # Convert binary to decimal
        decimal_value = 0
        for i, bit in enumerate(binary_array):
            decimal_value += bit * (2 ** i)
        
        # Convert decimal to base26
        if decimal_value == 0:
            return 'a'
        
        result = ''
        while decimal_value > 0:
            result = chr(ord('a') + (decimal_value % 26)) + result
            decimal_value //= 26
        
        return result
    
    def generate_config_from_letters(self, alphabet_name: str, letters: List[str]) -> Tuple[str, Dict]:
        """
        Generate a configuration from a list of letters.
        
        Returns:
            Tuple of (config_name, config_dict)
        """
        if alphabet_name not in self.alphabets:
            raise ValueError(f"Unknown alphabet: {alphabet_name}")
        
        alphabet = self.alphabets[alphabet_name]
        
        # Validate all letters are in the alphabet
        letter_set = set(letters)
        if not letter_set.issubset(set(alphabet['characters'])):
            invalid = letter_set - set(alphabet['characters'])
            raise ValueError(f"Letters not in {alphabet_name} alphabet: {invalid}")
        
        # Separate consonants and vowels
        vowels = [l for l in letters if l in alphabet['vowels']]
        consonants = [l for l in letters if l not in alphabet['vowels']]
        
        if not vowels:
            raise ValueError("At least one vowel is required")
        if not consonants:
            raise ValueError("At least one consonant is required")
        
        # Find minimum syllables needed and calculate coverage metrics
        min_length, total_combinations, coverage_ratio = self.calculate_min_syllables_needed(len(consonants), len(vowels))
        
        if min_length is None:
            raise ValueError(f"Cannot cover H3 space with {len(consonants)} consonants and {len(vowels)} vowels")
        
        # Create binary array and base26 identifier
        binary_array = self.create_binary_array(alphabet_name, letters)
        base26_id = self.binary_to_base26(binary_array)
        
        # Create configuration name (always ascii-xxxxx format)
        config_name = f"{alphabet_name}-{base26_id}"
        
        # Create configuration
        config = {
            'name': config_name,
            'description': f"{alphabet['description']}, {len(consonants)} consonants, {len(vowels)} vowels, {min_length} syllables, max 1 consecutive",
            'consonants': sorted(consonants),
            'vowels': sorted(vowels),
            'address_length': min_length,
            'max_consecutive': 1,  # Always 1
            'h3_resolution': 15,
            'metadata': {
                'alphabet': alphabet_name,
                'base26_identifier': base26_id,
                'binary_array': binary_array,
                'selected_letters': sorted(letters),
                'auto_generated': True,
                'generation_method': 'minimum_syllables',
                'total_syllables': len(consonants) * len(vowels),
                'total_combinations': total_combinations,
                'h3_target_space': self.h3_target,
                'coverage_ratio': coverage_ratio,
                'coverage_multiple': f"{coverage_ratio:.2f}x"
            }
        }
        
        return config_name, config
    
    def save_config(self, config_name: str, config: Dict) -> str:
        """Save configuration to JSON file."""
        self.config_dir.mkdir(exist_ok=True)
        filepath = self.config_dir / f"{config_name}.json"
        
        with open(filepath, 'w') as f:
            json.dump(config, f, indent=2)
        
        return str(filepath)


class ConfigExporter:
    """Exports configurations to both Python and JavaScript packages."""
    
    def __init__(self, repo_root: str = None):
        if repo_root is None:
            repo_root = Path(__file__).parent.parent.parent
        
        self.repo_root = Path(repo_root)
        self.shared_configs_dir = self.repo_root / "configs"
        self.python_configs_dir = self.repo_root / "packages" / "python" / "src" / "h3_syllable" / "configs"
        self.js_configs_dir = self.repo_root / "packages" / "javascript" / "src" / "configs"
        
        # Ensure directories exist
        self.python_configs_dir.mkdir(parents=True, exist_ok=True)
        self.js_configs_dir.mkdir(parents=True, exist_ok=True)
    
    def export_all_configs(self):
        """Export all configurations to both packages."""
        print("🚀 Exporting configurations...")
        
        # Get all JSON config files
        config_files = list(self.shared_configs_dir.glob("*.json"))
        
        if not config_files:
            print("⚠️  No configuration files found in configs/")
            return
        
        # Export to Python
        self._export_to_python(config_files)
        
        # Export to JavaScript
        self._export_to_javascript(config_files)
        
        print(f"✅ Successfully exported {len(config_files)} configurations")
    
    def _export_to_python(self, config_files: List[Path]):
        """Export configurations to Python package."""
        print("📦 Exporting to Python package...")
        
        # Copy all JSON files directly
        for config_file in config_files:
            dest_file = self.python_configs_dir / config_file.name
            shutil.copy2(config_file, dest_file)
        
        # Create Python config index
        self._create_python_config_index(config_files)
        
        print(f"  ✅ Python: {len(config_files)} configs exported")
    
    def _export_to_javascript(self, config_files: List[Path]):
        """Export configurations to JavaScript package."""
        print("📦 Exporting to JavaScript package...")
        
        # Copy all JSON files directly
        for config_file in config_files:
            dest_file = self.js_configs_dir / config_file.name
            shutil.copy2(config_file, dest_file)
        
        # Create JavaScript config index
        self._create_javascript_config_index(config_files)
        
        print(f"  ✅ JavaScript: {len(config_files)} configs exported")
    
    def _create_python_config_index(self, config_files: List[Path]):
        """Create Python configuration index file."""
        configs_info = []
        
        for config_file in config_files:
            try:
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                
                config_info = {
                    'filename': config_file.name,
                    'name': config_data.get('name', config_file.stem),
                    'description': config_data.get('description', ''),
                    'consonants_count': len(config_data.get('consonants', [])),
                    'vowels_count': len(config_data.get('vowels', [])),
                    'address_length': config_data.get('address_length', 8),
                    'max_consecutive': config_data.get('max_consecutive', 2),
                    'identifier': config_data.get('metadata', {}).get('identifier', ''),
                    'auto_generated': config_data.get('metadata', {}).get('auto_generated', False)
                }
                
                configs_info.append(config_info)
                
            except Exception as e:
                print(f"⚠️  Warning: Could not process {config_file.name}: {e}")
        
        # Write Python config index
        index_content = f'''"""Configuration Index - Auto-generated

This file is automatically generated by scripts/configs/generate_all_configs.py
Do not edit manually.
"""

AVAILABLE_CONFIGS = {json.dumps(configs_info, indent=2)}

def get_config_info(config_name: str):
    """Get information about a configuration."""
    for config in AVAILABLE_CONFIGS:
        if config['name'] == config_name or config['filename'] == config_name:
            return config
    return None

def list_configs():
    """List all available configuration names."""
    return [config['name'] for config in AVAILABLE_CONFIGS]

def list_config_files():
    """List all configuration filenames."""
    return [config['filename'] for config in AVAILABLE_CONFIGS]
'''
        
        with open(self.python_configs_dir / "config_index.py", 'w') as f:
            f.write(index_content)
    
    def _create_javascript_config_index(self, config_files: List[Path]):
        """Create JavaScript configuration index file."""
        configs_info = []
        
        for config_file in config_files:
            try:
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                
                config_info = {
                    'filename': config_file.name,
                    'name': config_data.get('name', config_file.stem),
                    'description': config_data.get('description', ''),
                    'consonantsCount': len(config_data.get('consonants', [])),
                    'vowelsCount': len(config_data.get('vowels', [])),
                    'addressLength': config_data.get('address_length', 8),
                    'maxConsecutive': config_data.get('max_consecutive', 2),
                    'identifier': config_data.get('metadata', {}).get('identifier', ''),
                    'autoGenerated': config_data.get('metadata', {}).get('auto_generated', False)
                }
                
                configs_info.append(config_info)
                
            except Exception as e:
                print(f"⚠️  Warning: Could not process {config_file.name}: {e}")
        
        # Write JavaScript config index
        index_content = f'''/**
 * Configuration Index - Auto-generated
 * 
 * This file is automatically generated by scripts/configs/generate_all_configs.py
 * Do not edit manually.
 */

export const AVAILABLE_CONFIGS = {json.dumps(configs_info, indent=2)};

export function getConfigInfo(configName: string) {{
  return AVAILABLE_CONFIGS.find(config => 
    config.name === configName || config.filename === configName
  );
}}

export function listConfigs(): string[] {{
  return AVAILABLE_CONFIGS.map(config => config.name);
}}

export function listConfigFiles(): string[] {{
  return AVAILABLE_CONFIGS.map(config => config.filename);
}}
'''
        
        with open(self.js_configs_dir / "config-index.ts", 'w') as f:
            f.write(index_content)
    
    def validate_export(self) -> bool:
        """Validate that the export was successful."""
        python_files = list(self.python_configs_dir.glob("*.json"))
        js_files = list(self.js_configs_dir.glob("*.json"))
        shared_files = list(self.shared_configs_dir.glob("*.json"))
        
        print(f"📊 Validation details:")
        print(f"  Shared configs: {len(shared_files)}")
        print(f"  Python configs: {len(python_files)}")
        print(f"  JavaScript configs: {len(js_files)}")
        
        if len(python_files) != len(shared_files):
            print(f"❌ Python export incomplete: {len(python_files)} != {len(shared_files)}")
            return False
        
        if len(js_files) != len(shared_files):
            print(f"❌ JavaScript export incomplete: {len(js_files)} != {len(shared_files)}")
            return False
        
        # Check index files exist
        if not (self.python_configs_dir / "config_index.py").exists():
            print("❌ Python config index missing")
            return False
        
        if not (self.js_configs_dir / "config-index.ts").exists():
            print("❌ JavaScript config index missing")
            return False
        
        print("✅ Export validation successful")
        return True


def main():
    generator = ConfigGenerator()
    
    print("🔤 Generating Standard H3 Syllable Configurations")
    print("=" * 50)
    print(f"Target: {generator.h3_target:,} H3 positions")
    print(f"Alphabet: ASCII")
    print(f"Constraint: max_consecutive = 1")
    print()
    
    # MODIFY THESE LETTER SETS FOR YOUR TARGET AUDIENCES
    # Each set defines letters to use for a specific audience or use case
    letter_sets = [
        # 1. BROAD INTERNATIONAL AUDIENCE - focuses on universally pronounceable sounds
        {
            'letters': list('bdfghkmnpstwyzbcaeiou'),  # 15C × 5V = 75 syllables → 8 length
            'description': 'International - universally pronounceable sounds for global users, avoids problematic r/l, v, j sounds'
        },
        
        # 2. JAPANESE-FRIENDLY - avoids L/R confusion and difficult sounds
        {
            'letters': list('bdfghkmnpstyaeiou'),  # 10C × 5V = 50 syllables → 9 length  
            'description': 'Japanese-friendly - no L/R/V/F sounds for Japanese speakers'
        },
        
        # 3. SPANISH/ROMANCE LANGUAGES - leverages familiar sounds
        {
            'letters': list('bcdfgjlmnprstvaeio'),  # 14C × 4V = 56 syllables → 9 length
            'description': 'Spanish/Romance languages - familiar phonetics for Spanish, Italian, French speakers'
        },
        
        # 4. GERMANIC LANGUAGES - includes sounds common in German/Dutch/Nordic
        {
            'letters': list('bdfghklmnprstvwaeiou'),  # 14C × 5V = 70 syllables → 9 length
            'description': 'Germanic languages - German/Dutch/Nordic sounds for Northern European speakers'
        },
        
        # 5. MINIMAL SET - smallest viable configuration
        {
            'letters': list('bdgkmnpstaeio'),  # 9C × 4V = 36 syllables → 10 length
            'description': 'Minimal viable - core sounds only for testing/development with shortest syllable set'
        },
        
        # 6. TYPING-OPTIMIZED - home row and common keys
        {
            'letters': list('dfghjklsaeiou'),  # 8C × 5V = 40 syllables → 9 length
            'description': 'Typing-optimized - home row focused for heavy keyboard users'
        },
        
        # 7. VOICE-FRIENDLY - distinct sounds for voice recognition
        {
            'letters': list('bdfghkmnpstvaeio'),  # 11C × 4V = 44 syllables → 9 length
            'description': 'Voice recognition - distinct sounds for voice input/dictation users'
        },
        
        # 8. MAXIMUM COVERAGE - uses most letters for shortest addresses
        {
            'letters': list('bcdfghjklmnpqrstvwxyzaeiou'),  # 20C × 5V = 100 syllables → 8 length
            'description': 'Maximum coverage - shortest addresses for advanced users wanting 8-syllable addresses'
        }
    ]
    
    # Clean old configs first
    print("🧹 Cleaning old configuration files...")
    config_dir = generator.config_dir
    if config_dir.exists():
        removed = 0
        for config_file in config_dir.glob("*.json"):
            config_file.unlink()
            removed += 1
        print(f"   Removed {removed} old files")
    print()
    
    # Generate configurations
    print("📝 Generating configurations...")
    all_configs = []
    
    for letter_set in letter_sets:
        try:
            letters = letter_set['letters']
            desc = letter_set['description']
            
            config_name, config = generator.generate_config_from_letters('ascii', letters)
            all_configs.append((config_name, config))
            
            print(f"✅ {config_name}")
            print(f"   {desc}")
            print(f"   {len(config['consonants'])}C × {len(config['vowels'])}V = "
                  f"{len(config['consonants']) * len(config['vowels'])} syllables, "
                  f"{config['address_length']} length")
            print(f"   Combinations: {config['metadata']['total_combinations']:,}")
            print(f"   Coverage: {config['metadata']['coverage_multiple']} H3 space")
            
        except ValueError as e:
            print(f"❌ Failed for {desc}: {e}")
        except Exception as e:
            print(f"❌ Unexpected error for {desc}: {e}")
    
    # Save all configurations
    print(f"\n💾 Saving {len(all_configs)} configurations...")
    saved = 0
    for config_name, config in all_configs:
        filepath = generator.save_config(config_name, config)
        saved += 1
    
    print(f"✅ Saved {saved} configurations to {config_dir}")
    
    # Export to packages (integrated)
    print(f"\n📦 Exporting to Python and JavaScript packages...")
    try:
        exporter = ConfigExporter()
        exporter.export_all_configs()
        
        if exporter.validate_export():
            print("✅ Export completed successfully!")
        else:
            print("❌ Export validation failed!")
    except Exception as e:
        print(f"❌ Export failed: {e}")
    
    print(f"\n🎉 Configuration generation complete!")
    print(f"   Total configs: {len(all_configs)}")
    print(f"   Location: {config_dir}")
    print(f"\nTo modify configurations for different audiences:")
    print(f"   Edit letter_sets in {__file__}")
    print(f"   Then run: python3 {__file__}")


if __name__ == "__main__":
    main()