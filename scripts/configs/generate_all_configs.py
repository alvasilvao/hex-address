#!/usr/bin/env python3
"""
Generate All Standard Configurations

Generates a comprehensive set of configurations for different use cases,
all using the ASCII character set.
"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from configs.generate_configs import ConfigGenerator


def main():
    generator = ConfigGenerator()
    
    print("🔤 Generating Standard H3 Syllable Configurations")
    print("=" * 50)
    print(f"Target: {generator.h3_target:,} H3 positions")
    print(f"Alphabet: ASCII")
    print(f"Constraint: max_consecutive = 1")
    print()
    
    # Define letter combinations for different use cases
    letter_sets = [
        # Full ASCII set
        {
            'letters': list('abcdefghijklmnopqrstuvwxyz'),
            'description': 'Full ASCII alphabet'
        },
        
        # Standard consonants + vowels (most common)
        {
            'letters': list('bcdfghjklmnpqrstvwxyzaeiou'),
            'description': 'Standard consonants and vowels'
        },
        
        # Minimal viable sets
        {
            'letters': list('bcdfghjklmnaeiou'),
            'description': 'Minimal set (10 consonants, 5 vowels)'
        },
        {
            'letters': list('bcdfghjklmnpaeio'),
            'description': 'Minimal set (12 consonants, 4 vowels)'
        },
        
        # Easy pronunciation sets
        {
            'letters': list('bdfgjklmnprstaeiou'),
            'description': 'Easy to pronounce'
        },
        {
            'letters': list('bcdfglmnprstaeiou'),
            'description': 'Common sounds only'
        },
        
        # No similar sounds
        {
            'letters': list('bcdfghjkmnpqrstvwxyzaeiou'),
            'description': 'No L (avoid L/R confusion)'
        },
        {
            'letters': list('bcdfghjklmnprstvwxyzaeiou'),
            'description': 'No Q (uncommon sound)'
        },
        
        # Optimized for typing
        {
            'letters': list('asdfghjklaeiou'),
            'description': 'Home row keys'
        },
        {
            'letters': list('bcdfghjklmnprstvaeiou'),
            'description': 'Common typing letters'
        },
        
        # Different consonant/vowel ratios
        {
            'letters': list('bcdfghjklmnpqrstaeiu'),
            'description': 'More consonants (15:4 ratio)'
        },
        {
            'letters': list('bcdfghjklmaeiou'),
            'description': 'Balanced ratio (8:5)'
        },
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
    
    # Export to packages
    print(f"\n📦 Exporting to Python and JavaScript packages...")
    result = os.system("python3 scripts/configs/export_configs.py")
    
    if result == 0:
        print("✅ Export completed successfully!")
    else:
        print("❌ Export failed!")
    
    print(f"\n🎉 Configuration generation complete!")
    print(f"   Total configs: {len(all_configs)}")
    print(f"   Location: {config_dir}")


if __name__ == "__main__":
    main()