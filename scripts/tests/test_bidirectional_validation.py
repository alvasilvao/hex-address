#!/usr/bin/env python3
"""
Bidirectional Validation Test

Tests both coordinate -> syllable and syllable -> coordinate conversions
to ensure perfect round-trip accuracy in both directions.
"""

import sys
import os
import random
import math
from pathlib import Path

# Add package src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'python', 'src'))

from h3_syllable.h3_syllable_system import H3SyllableSystem
from h3_syllable.config_loader import list_configs


def generate_global_coordinates(count: int) -> list:
    """Generate realistic global coordinates."""
    coordinates = []
    
    # Add some fixed important locations
    important_locations = [
        (40.7128, -74.0060),   # New York
        (48.8566, 2.3522),     # Paris
        (35.6762, 139.6503),   # Tokyo
        (-33.8688, 151.2093),  # Sydney
        (51.5074, -0.1278),    # London
        (0.0, 0.0),            # Equator/Prime Meridian
        (90.0, 0.0),           # North Pole
        (-90.0, 0.0),          # South Pole
    ]
    
    coordinates.extend(important_locations)
    
    # Add random coordinates
    for _ in range(count - len(important_locations)):
        # Use population-weighted distribution
        if random.random() < 0.7:  # 70% in populated areas
            lat = random.uniform(-60, 75)  # Most populated latitudes
            lon = random.uniform(-180, 180)
        else:  # 30% truly random
            lat = random.uniform(-90, 90)
            lon = random.uniform(-180, 180)
        
        coordinates.append((lat, lon))
    
    return coordinates


def test_coordinate_to_syllable_validation(system: H3SyllableSystem, coordinates: list) -> dict:
    """Test coordinate -> syllable conversion."""
    results = {
        'total_tests': len(coordinates),
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    for i, (lat, lon) in enumerate(coordinates):
        try:
            syllable = system.coordinate_to_syllable(lat, lon)
            results['successful'] += 1
            
            # Verify format
            if '|' in syllable:
                parts = syllable.split('|')
                for part in parts:
                    if not all(len(syl) == 2 for syl in part.split('-')):
                        results['errors'].append(f"Invalid syllable format: {syllable}")
                        results['failed'] += 1
                        results['successful'] -= 1
                        break
            
        except Exception as e:
            results['failed'] += 1
            results['errors'].append(f"Coordinate {lat}, {lon}: {str(e)}")
            
        if (i + 1) % 10000 == 0:
            print(f"  Coordinate->Syllable: {i+1:,} / {len(coordinates):,} processed")
    
    return results


def test_syllable_to_coordinate_validation(system: H3SyllableSystem, coordinates: list) -> dict:
    """Test syllable -> coordinate conversion."""
    results = {
        'total_tests': len(coordinates),
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    for i, (lat, lon) in enumerate(coordinates):
        try:
            # First convert to syllable
            syllable = system.coordinate_to_syllable(lat, lon)
            
            # Then convert back to coordinate
            result_lat, result_lon = system.syllable_to_coordinate(syllable)
            
            # Verify accuracy
            lat_diff = abs(result_lat - lat)
            lon_diff = abs(result_lon - lon)
            
            # Calculate distance error
            lat_rad = math.radians(lat)
            meters_per_degree_lat = 111320
            meters_per_degree_lon = 111320 * math.cos(lat_rad)
            
            distance_error = math.sqrt(
                (lat_diff * meters_per_degree_lat) ** 2 + 
                (lon_diff * meters_per_degree_lon) ** 2
            )
            
            if distance_error > 1.0:  # More than 1 meter error
                results['errors'].append(f"High precision error: {distance_error:.3f}m for {syllable}")
                results['failed'] += 1
            else:
                results['successful'] += 1
                
        except Exception as e:
            results['failed'] += 1
            results['errors'].append(f"Syllable conversion failed for {lat}, {lon}: {str(e)}")
            
        if (i + 1) % 10000 == 0:
            print(f"  Syllable->Coordinate: {i+1:,} / {len(coordinates):,} processed")
    
    return results


def test_invalid_syllable_validation(system: H3SyllableSystem) -> dict:
    """Test validation of invalid syllables."""
    results = {
        'total_tests': 0,
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    # Test invalid syllables
    invalid_syllables = [
        "xx-yy-zz-aa-bb-cc-dd-ee",  # Invalid syllables
        "po-su-du-ca-de-ta-we",     # Wrong length
        "po-su-du-ca-de-ta-we-da-extra",  # Too long
        "po|su|du|ca|de|ta|we|da|extra",  # Too long with pipes
        "po-su-xxx-ca-de-ta-we-da",  # Invalid 3-letter syllable
        "",  # Empty
        "po",  # Too short
    ]
    
    for syllable in invalid_syllables:
        results['total_tests'] += 1
        try:
            system.syllable_to_coordinate(syllable)
            results['failed'] += 1
            results['errors'].append(f"Invalid syllable '{syllable}' was accepted")
        except Exception:
            results['successful'] += 1  # Expected to fail
    
    return results


def test_config_bidirectional_validation(config_name: str, coordinate_count: int = 1000) -> dict:
    """Test bidirectional validation for a specific configuration."""
    print(f"\n🔄 Testing {config_name}")
    
    try:
        system = H3SyllableSystem(config_name)
        
        # Generate test coordinates
        coordinates = generate_global_coordinates(coordinate_count)
        
        # Test coordinate -> syllable
        print(f"  📍 Testing coordinate -> syllable conversion...")
        coord_results = test_coordinate_to_syllable_validation(system, coordinates)
        
        # Test syllable -> coordinate  
        print(f"  🔤 Testing syllable -> coordinate conversion...")
        syllable_results = test_syllable_to_coordinate_validation(system, coordinates)
        
        # Test invalid syllables
        print(f"  ❌ Testing invalid syllable validation...")
        invalid_results = test_invalid_syllable_validation(system)
        
        config_info = system.get_config_info()
        
        return {
            'config_name': config_name,
            'config_info': config_info,
            'coordinate_to_syllable': coord_results,
            'syllable_to_coordinate': syllable_results,
            'invalid_syllable_validation': invalid_results,
            'total_coordinates_tested': coordinate_count,
            'success': (coord_results['failed'] == 0 and 
                       syllable_results['failed'] == 0 and
                       invalid_results['failed'] == 0)
        }
        
    except Exception as e:
        return {
            'config_name': config_name,
            'error': str(e),
            'success': False
        }


def main():
    """Run comprehensive bidirectional validation tests."""
    print("🔄 Bidirectional Validation Test Suite")
    print("=" * 50)
    
    # Get available configurations
    configs = list_configs()
    
    # Test with current configs
    test_configs = [
        "ascii-fqwfmd",
        "ascii-jaxqt", 
        "ascii-fqwclj",
        "ascii-cjbnb",
        "ascii-dsyp"
    ]
    
    available_test_configs = [c for c in test_configs if c in configs]
    
    if not available_test_configs:
        print("❌ No test configurations available")
        return
    
    print(f"📊 Testing {len(available_test_configs)} configurations with 1,000 coordinates each")
    print()
    
    all_results = []
    successful_configs = 0
    
    for config_name in available_test_configs:
        result = test_config_bidirectional_validation(config_name, 1000)
        all_results.append(result)
        
        if result['success']:
            successful_configs += 1
            print(f"  ✅ {config_name}: PASSED")
        else:
            print(f"  ❌ {config_name}: FAILED")
            if 'error' in result:
                print(f"     Error: {result['error']}")
    
    print(f"\n📈 Summary:")
    print(f"  Configurations tested: {len(available_test_configs)}")
    print(f"  Successful: {successful_configs}")
    print(f"  Failed: {len(available_test_configs) - successful_configs}")
    
    # Show detailed results for failed configs
    failed_configs = [r for r in all_results if not r['success']]
    if failed_configs:
        print(f"\n❌ Failed Configuration Details:")
        for result in failed_configs:
            print(f"  {result['config_name']}:")
            if 'coordinate_to_syllable' in result:
                c2s = result['coordinate_to_syllable']
                print(f"    Coordinate->Syllable: {c2s['successful']}/{c2s['total_tests']} successful")
                if c2s['errors']:
                    print(f"    First error: {c2s['errors'][0]}")
                    
            if 'syllable_to_coordinate' in result:
                s2c = result['syllable_to_coordinate']
                print(f"    Syllable->Coordinate: {s2c['successful']}/{s2c['total_tests']} successful")
                if s2c['errors']:
                    print(f"    First error: {s2c['errors'][0]}")
    
    if successful_configs == len(available_test_configs):
        print(f"\n🎉 All bidirectional validation tests passed!")
    else:
        print(f"\n⚠️  {len(available_test_configs) - successful_configs} configurations failed validation")


if __name__ == "__main__":
    main()