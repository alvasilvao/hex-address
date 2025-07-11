#!/usr/bin/env python3
"""
Create Individual H3 Syllable Configuration

Simple CLI tool to create a configuration from a list of letters.

Usage:
    python3 create_config.py --alphabet ascii --letters abcdefghijklmnopqrstu
    python3 create_config.py -a ascii -l bcdfghjkmnpqrstvwxyzaeiou
"""

import sys
import os
import argparse
import json
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from configs.generate_configs import ConfigGenerator


def main():
    parser = argparse.ArgumentParser(
        description="Create H3 syllable configuration from letters",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Standard ASCII with all letters
  python3 create_config.py -a ascii -l abcdefghijklmnopqrstuvwxyz
  
  # Minimal set
  python3 create_config.py -a ascii -l bcdfghjklmnaeiou
  
  # No L (Japanese-friendly)
  python3 create_config.py -a ascii -l bcdfghjkmnpqrstvwxyzaeiou
        """
    )
    
    parser.add_argument(
        '-a', '--alphabet',
        default='ascii',
        help='Alphabet/character set to use (default: ascii)'
    )
    
    parser.add_argument(
        '-l', '--letters',
        required=True,
        help='Letters to include (as a single string, e.g., "abcdefghijklmno")'
    )
    
    parser.add_argument(
        '--save',
        action='store_true',
        help='Save configuration to file'
    )
    
    parser.add_argument(
        '--export',
        action='store_true',
        help='Export to Python and JavaScript packages'
    )
    
    args = parser.parse_args()
    
    # Convert letters string to list
    letters = list(args.letters.lower())
    
    # Create generator
    generator = ConfigGenerator()
    
    print(f"🔤 Creating configuration from {len(letters)} letters...")
    print(f"   Alphabet: {args.alphabet}")
    print(f"   Letters: {args.letters}")
    print()
    
    try:
        # Generate configuration
        config_name, config = generator.generate_config_from_letters(args.alphabet, letters)
        
        # Display results
        print(f"✅ Generated configuration: {config_name}")
        print(f"   Description: {config['description']}")
        print(f"   Consonants: {len(config['consonants'])} - {', '.join(config['consonants'])}")
        print(f"   Vowels: {len(config['vowels'])} - {', '.join(config['vowels'])}")
        print(f"   Address length: {config['address_length']} syllables")
        print(f"   Base26 ID: {config['metadata']['base26_identifier']}")
        
        # Calculate address space
        total_syllables = len(config['consonants']) * len(config['vowels'])
        print(f"   Total syllables: {total_syllables}")
        
        # Save if requested
        if args.save:
            filepath = generator.save_config(config_name, config)
            print(f"\n💾 Saved to: {filepath}")
        
        # Export if requested
        if args.export:
            print(f"\n📦 Exporting to packages...")
            os.system("python3 scripts/configs/export_configs.py")
        
        # Show JSON if not saving
        if not args.save:
            print(f"\n📄 Configuration JSON:")
            print(json.dumps(config, indent=2))
            
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()