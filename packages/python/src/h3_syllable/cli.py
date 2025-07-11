#!/usr/bin/env python3
"""
Command Line Interface for H3 Syllable System

Provides a simple CLI tool for converting coordinates to syllable addresses.
"""

import argparse
import sys
from typing import Optional

from .h3_syllable_system import H3SyllableSystem, is_valid_syllable_address
from .config_loader import list_configs


def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Convert GPS coordinates to memorable syllable addresses",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  h3-syllable coordinate 48.8566 2.3522
  h3-syllable syllable po-su-du-ca-de-ta-we-da
  h3-syllable validate po-su-du-ca-de-ta-we-da
  h3-syllable configs
        """
    )
    
    parser.add_argument(
        "--config", 
        default="ascii-fqwfmd",
        help="Configuration to use (default: ascii-fqwfmd)"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Coordinate to syllable command
    coord_parser = subparsers.add_parser(
        "coordinate", 
        help="Convert coordinates to syllable address"
    )
    coord_parser.add_argument("latitude", type=float, help="Latitude (-90 to 90)")
    coord_parser.add_argument("longitude", type=float, help="Longitude (-180 to 180)")
    
    # Syllable to coordinate command
    syllable_parser = subparsers.add_parser(
        "syllable",
        help="Convert syllable address to coordinates"
    )
    syllable_parser.add_argument("address", help="Syllable address (e.g., po-su-du-ca-de-ta-we-da)")
    
    # Validate command
    validate_parser = subparsers.add_parser(
        "validate",
        help="Check if syllable address is valid"
    )
    validate_parser.add_argument("address", help="Syllable address to validate")
    
    # List configs command
    subparsers.add_parser("configs", help="List available configurations")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "configs":
            print("Available configurations:")
            for config_name in sorted(list_configs()):
                system = H3SyllableSystem(config_name)
                print(f"  {config_name:20} - {system.config.description}")
        
        elif args.command == "coordinate":
            system = H3SyllableSystem(args.config)
            address = system.coordinate_to_syllable(args.latitude, args.longitude)
            print(f"Coordinate: {args.latitude}, {args.longitude}")
            print(f"Address:    {address}")
            print(f"Config:     {args.config}")
            
        elif args.command == "syllable":
            system = H3SyllableSystem(args.config)
            lat, lon = system.syllable_to_coordinate(args.address)
            print(f"Address:    {args.address}")
            print(f"Coordinate: {lat:.6f}, {lon:.6f}")
            print(f"Config:     {args.config}")
            
        elif args.command == "validate":
            is_valid = is_valid_syllable_address(args.address, args.config)
            status = "✅ VALID" if is_valid else "❌ INVALID"
            print(f"Address: {args.address}")
            print(f"Status:  {status}")
            if is_valid:
                system = H3SyllableSystem(args.config)
                lat, lon = system.syllable_to_coordinate(args.address)
                print(f"Location: {lat:.6f}, {lon:.6f}")
            else:
                print("This address doesn't exist (like '999999 Main Street')")
                
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()