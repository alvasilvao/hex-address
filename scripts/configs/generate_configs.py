#!/usr/bin/env python3
"""
Generate H3 Syllable Configurations

Creates configurations from character sets (alphabets) with minimum syllables needed
to cover H3 space (122 × 7^15 positions).

Configuration naming: {alphabet}-{base26_identifier}
Where base26_identifier is derived from the binary array of selected letters.
"""

import sys
import os
import json
import math
from pathlib import Path
from typing import List, Dict, Tuple, Set

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
            # 'arabic': {
            #     'name': 'Arabic',
            #     'description': 'Arabic alphabet',
            #     'characters': [...],
            #     'vowels': set([...]),
            # },
            # 'chinese': {
            #     'name': 'Chinese',
            #     'description': 'Chinese characters (pinyin)',
            #     'characters': [...],
            #     'vowels': set([...]),
            # }
        }
    
    def calculate_min_syllables_needed(self, consonants: int, vowels: int) -> int:
        """
        Calculate minimum address length needed to cover H3 space.
        
        For max_consecutive = 1, we use the exact formula for sequences
        where no two adjacent elements are the same.
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
                return length
        
        return None  # Cannot achieve with reasonable length
    
    def calculate_constrained_space_exact(self, total_syllables: int, address_length: int, max_consecutive: int) -> int:
        """
        Calculate exact constrained space for given parameters.
        
        For max_consecutive = 1, uses recurrence relation:
        f(n) = (k-1) * (f(n-1) + f(n-2))
        """
        if address_length == 1:
            return total_syllables
        elif address_length == 2:
            if max_consecutive == 1:
                return total_syllables * (total_syllables - 1)
            else:
                return total_syllables ** 2
        else:
            if max_consecutive == 1:
                # Use recurrence relation for max_consecutive = 1
                prev_prev = total_syllables  # f(1)
                prev = total_syllables * (total_syllables - 1)  # f(2)
                
                for i in range(3, address_length + 1):
                    current = (total_syllables - 1) * (prev + prev_prev)
                    prev_prev = prev
                    prev = current
                
                return prev
            else:
                # For other max_consecutive values, return unconstrained for simplicity
                return total_syllables ** address_length
    
    def find_min_address_length(self, consonants: int, vowels: int, max_consecutive: int) -> Tuple[int, int, float]:
        """
        Find minimum address length needed for given parameters.
        
        Returns:
            Tuple of (length, space, coverage_ratio)
        """
        total_syllables = consonants * vowels
        
        for length in range(1, 20):
            space = self.calculate_constrained_space_exact(total_syllables, length, max_consecutive)
            
            if space >= self.h3_target:
                coverage = space / self.h3_target
                return length, space, coverage
        
        return None, None, None
    
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
        
        # Find minimum syllables needed
        min_length = self.calculate_min_syllables_needed(len(consonants), len(vowels))
        
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
                'generation_method': 'minimum_syllables'
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
    
    def generate_from_letter_combinations(self, alphabet_name: str, letter_combinations: List[List[str]]) -> List[Tuple[str, Dict]]:
        """Generate configurations from multiple letter combinations."""
        configs = []
        
        for letters in letter_combinations:
            try:
                config_name, config = self.generate_config_from_letters(alphabet_name, letters)
                configs.append((config_name, config))
                print(f"✅ Generated {config_name}")
            except ValueError as e:
                print(f"❌ Failed for {letters}: {e}")
        
        return configs


def main():
    """Example usage of the configuration generator."""
    generator = ConfigGenerator()
    
    print("🔤 H3 Syllable Configuration Generator")
    print("=" * 50)
    print(f"Target: {generator.h3_target:,} H3 positions")
    print(f"Constraint: max_consecutive = 1")
    print()
    
    # Example: Generate configs for different letter selections
    letter_combinations = [
        # Standard selections
        list('abcdefghijklmnopqrstu'),      # 16 consonants, 5 vowels
        list('bcdfghjklmnpqrstvwxyzaeiou'),  # All standard consonants and vowels
        
        # Minimal selections
        list('bcdfghjklmnaeiou'),           # 10 consonants, 5 vowels
        list('bcdfghjklmnpaeio'),           # 12 consonants, 4 vowels
        
        # Language-optimized selections (still ASCII)
        list('bcdfghjkmnpqrstvwxyzaeiou'),  # No L (Japanese-friendly)
        list('bcdfgjlmnprstvaeiou'),        # Spanish-friendly consonants
    ]
    
    print("📝 Generating configurations...")
    configs = generator.generate_from_letter_combinations('ascii', letter_combinations)
    
    print(f"\n💾 Saving {len(configs)} configurations...")
    for config_name, config in configs:
        filepath = generator.save_config(config_name, config)
        print(f"  Saved: {config_name}.json")
    
    print(f"\n🎉 Generated {len(configs)} configurations!")
    print(f"📂 All saved to {generator.config_dir}")


if __name__ == "__main__":
    main()