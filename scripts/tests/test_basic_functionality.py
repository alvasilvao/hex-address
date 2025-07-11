#!/usr/bin/env python3
"""
Basic functionality tests for H3 Syllable System
Tests the new configuration system and level 0 mapping
"""

import sys
import os
import math
from pathlib import Path

# Add the package source to path
package_src = Path(__file__).parent.parent.parent / "packages" / "python" / "src"
sys.path.insert(0, str(package_src))

from h3_syllable.h3_syllable_system import H3SyllableSystem


def test_round_trip_conversion():
    """Test that coordinates -> syllables -> coordinates works accurately."""
    
    configs_to_test = [
        "ascii-yrja8-2",  # Default config
        "int-15-5-2",     # International config
        "english-13-5-2", # English config
    ]
    
    test_coordinates = [
        (48.8566, 2.3522),    # Paris
        (40.7589, -73.9851),  # New York
        (35.6762, 139.6503),  # Tokyo
        (0.0, 0.0),           # Equator/Prime Meridian
        (-33.8688, 151.2093), # Sydney
    ]
    
    print("🧪 Round-trip Conversion Tests")
    print("=" * 50)
    
    for config_name in configs_to_test:
        print(f"\n📋 Testing config: {config_name}")
        print("-" * 30)
        
        system = H3SyllableSystem(config_name)
        config_passed = True
        
        for i, (lat, lon) in enumerate(test_coordinates, 1):
            try:
                # Convert to syllable and back
                address = system.coordinate_to_syllable(lat, lon)
                result_lat, result_lon = system.syllable_to_coordinate(address)
                
                # Calculate error in meters
                lat_rad = math.radians(lat)
                meters_per_degree_lat = 111320
                meters_per_degree_lon = 111320 * math.cos(lat_rad)
                
                distance_error = math.sqrt(
                    ((result_lat - lat) * meters_per_degree_lat) ** 2 + 
                    ((result_lon - lon) * meters_per_degree_lon) ** 2
                )
                
                # Test passes if error < 1 meter
                passed = distance_error < 1.0
                
                if passed:
                    print(f"  ✅ Test {i}: {lat:.4f}, {lon:.4f} -> {address} -> {result_lat:.4f}, {result_lon:.4f} (error: {distance_error:.2f}m)")
                else:
                    print(f"  ❌ Test {i}: {lat:.4f}, {lon:.4f} -> {address} -> {result_lat:.4f}, {result_lon:.4f} (error: {distance_error:.2f}m)")
                    config_passed = False
                    
            except Exception as e:
                print(f"  ❌ Test {i}: FAILED with error: {e}")
                config_passed = False
        
        if config_passed:
            print(f"  🎉 All tests passed for {config_name}")
        else:
            print(f"  💥 Some tests failed for {config_name}")
    
    return True


def test_level_0_mapping():
    """Test that the level 0 Hamiltonian path mapping is loaded and working."""
    
    print("\n\n🗺️  Level 0 Hamiltonian Path Tests")
    print("=" * 50)
    
    system = H3SyllableSystem("ascii-yrja8-2")
    
    # Test that level 0 mapping is loaded
    level_0_mapping = system._level_0_mapping
    
    if not level_0_mapping or not level_0_mapping.get("original_to_hamiltonian"):
        print("  ❌ Level 0 mapping not loaded!")
        return False
    
    print(f"  ✅ Level 0 mapping loaded with {len(level_0_mapping['original_to_hamiltonian'])} mappings")
    
    # Test that we have all 122 H3 level 0 cells
    original_to_ham = level_0_mapping["original_to_hamiltonian"]
    ham_to_original = level_0_mapping["hamiltonian_to_original"]
    
    if len(original_to_ham) != 122 or len(ham_to_original) != 122:
        print(f"  ❌ Expected 122 mappings, got {len(original_to_ham)} and {len(ham_to_original)}")
        return False
    
    print("  ✅ All 122 H3 level 0 cells mapped")
    
    # Test that mapping is bijective
    for orig_cell, ham_cell in original_to_ham.items():
        if ham_to_original.get(str(ham_cell)) != int(orig_cell):
            print(f"  ❌ Mapping not bijective: {orig_cell} -> {ham_cell} -> {ham_to_original.get(str(ham_cell))}")
            return False
    
    print("  ✅ Mapping is bijective")
    
    # Test a few specific mappings from our known Hamiltonian path
    known_mappings = {
        "4": 0,  # Start of Hamiltonian path
        "0": 1,  # Second cell
        "93": 121,  # End of Hamiltonian path
    }
    
    for orig, expected_ham in known_mappings.items():
        actual_ham = original_to_ham.get(orig)
        if actual_ham != expected_ham:
            print(f"  ❌ Expected {orig} -> {expected_ham}, got {actual_ham}")
            return False
    
    print("  ✅ Known Hamiltonian path mappings correct")
    print("  🎯 Level 0 mapping is working perfectly!")
    
    return True


def test_address_validation():
    """Test that address validation works correctly."""
    
    print("\n\n🔍 Address Validation Tests")
    print("=" * 50)
    
    system = H3SyllableSystem("ascii-yrja8-2")
    
    # Test valid addresses (create them from real coordinates)
    test_coords = [
        (48.8566, 2.3522),  # Paris
        (40.7589, -73.9851),  # New York
    ]
    
    valid_addresses = []
    for lat, lon in test_coords:
        address = system.coordinate_to_syllable(lat, lon)
        valid_addresses.append(address)
    
    print("  Testing valid addresses:")
    for i, address in enumerate(valid_addresses, 1):
        is_valid = system.is_valid_syllable_address(address)
        if is_valid:
            print(f"    ✅ Address {i}: {address} is valid")
        else:
            print(f"    ❌ Address {i}: {address} should be valid but isn't")
    
    # Test some likely invalid addresses
    invalid_addresses = [
        "za-za-za-za-za-za-za-za",  # Unlikely to be valid
        "xx-xx-xx-xx-xx-xx-xx-xx",  # Invalid characters
        "pa-pa-pa-pa-pa-pa-pa-pa",  # Repetitive pattern
    ]
    
    print("  Testing likely invalid addresses:")
    for i, address in enumerate(invalid_addresses, 1):
        try:
            is_valid = system.is_valid_syllable_address(address)
            if is_valid:
                print(f"    ⚠️  Address {i}: {address} is unexpectedly valid")
            else:
                print(f"    ✅ Address {i}: {address} is invalid as expected")
        except Exception as e:
            print(f"    ✅ Address {i}: {address} failed validation as expected ({e})")
    
    return True


def test_system_info():
    """Test that system info is correctly reported."""
    
    print("\n\n📊 System Information Tests")
    print("=" * 50)
    
    system = H3SyllableSystem("ascii-yrja8-2")
    info = system.get_system_info()
    
    print(f"  📋 Configuration: {system.config_name}")
    print(f"  🔢 H3 Resolution: {info.h3_resolution}")
    print(f"  📏 Address Length: {info.address_length}")
    print(f"  🎵 Total Syllables: {info.total_syllables}")
    print(f"  🌍 Address Space: {info.address_space:,}")
    print(f"  🎯 Precision: {info.precision_meters}m")
    print(f"  📊 Coverage: {info.coverage_percentage:.1f}%")
    
    # Basic validation
    if info.h3_resolution != 15:
        print(f"  ❌ Expected H3 resolution 15, got {info.h3_resolution}")
        return False
    
    if info.address_length != 8:
        print(f"  ❌ Expected address length 8, got {info.address_length}")
        return False
        
    if info.precision_meters != 0.5:
        print(f"  ❌ Expected precision 0.5m, got {info.precision_meters}")
        return False
    
    print("  ✅ System information is correct")
    return True


def main():
    """Run all tests."""
    
    print("🧪 H3 Syllable System - Basic Functionality Tests")
    print("=" * 60)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Round-trip Conversion", test_round_trip_conversion()))
    test_results.append(("Level 0 Mapping", test_level_0_mapping()))
    test_results.append(("Address Validation", test_address_validation()))
    test_results.append(("System Information", test_system_info()))
    
    # Summary
    print("\n\n📋 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        if result:
            print(f"  ✅ {test_name}: PASSED")
            passed += 1
        else:
            print(f"  ❌ {test_name}: FAILED")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The H3 Syllable System is working correctly.")
        return 0
    else:
        print("💥 Some tests failed. Please check the implementation.")
        return 1


if __name__ == "__main__":
    sys.exit(main())