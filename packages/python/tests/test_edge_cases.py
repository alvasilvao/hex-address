#!/usr/bin/env python3
"""
Edge case tests for H3 Syllable System
"""

import pytest
import math
from h3_syllable import (
    coordinate_to_address,
    address_to_coordinate,
    H3SyllableSystem,
    is_valid_address,
    list_available_configs
)


class TestGeographicEdgeCases:
    """Test geographic edge cases"""
    
    def test_international_date_line_crossing(self):
        """Test coordinates near International Date Line"""
        test_cases = [
            (0, 179.9),   # Just west of date line
            (0, -179.9),  # Just east of date line
            (0, 180),     # Exactly on date line (west)
            (0, -180),    # Exactly on date line (east)
        ]
        
        for lat, lon in test_cases:
            address = coordinate_to_address(lat, lon)
            result_lat, result_lon = address_to_coordinate(address)
            
            assert isinstance(address, str)
            assert isinstance(result_lat, float)
            assert isinstance(result_lon, float)
            
            # Handle longitude wrapping around date line
            lon_diff = abs(result_lon - lon)
            wrapped_diff = min(lon_diff, 360 - lon_diff)
            assert wrapped_diff < 0.01
            assert abs(result_lat - lat) < 0.01
    
    def test_polar_regions(self):
        """Test coordinates in polar regions"""
        polar_cases = [
            (89.9, 0),     # Near North Pole
            (-89.9, 0),    # Near South Pole
            (89.9, 90),    # Near North Pole, different longitude
            (-89.9, -90),  # Near South Pole, different longitude
        ]
        
        for lat, lon in polar_cases:
            address = coordinate_to_address(lat, lon)
            result_lat, result_lon = address_to_coordinate(address)
            
            assert isinstance(address, str)
            assert abs(result_lat - lat) < 0.01
            
            # At high latitudes, longitude precision may be lower
            if abs(lat) > 85:
                # More lenient check for extreme polar regions
                assert abs(result_lon - lon) < 1
            else:
                assert abs(result_lon - lon) < 0.01
    
    def test_equator_and_prime_meridian(self):
        """Test special coordinate cases"""
        special_cases = [
            (0, 0),        # Null Island
            (0, 90),       # Equator, 90°E
            (0, -90),      # Equator, 90°W
            (45, 0),       # Prime Meridian, 45°N
            (-45, 0),      # Prime Meridian, 45°S
        ]
        
        for lat, lon in special_cases:
            address = coordinate_to_address(lat, lon)
            result_lat, result_lon = address_to_coordinate(address)
            
            assert isinstance(address, str)
            assert abs(result_lat - lat) < 0.01
            assert abs(result_lon - lon) < 0.01
    
    def test_antipodal_points(self):
        """Test antipodal point pairs"""
        from h3_syllable.utilities import calculate_distance
        
        antipodes = [
            [(40.7580, -73.9855), (-40.7580, 106.0145)],  # NYC and its antipode
            [(48.8566, 2.3522), (-48.8566, -177.6478)],   # Paris and its antipode
        ]
        
        for (lat1, lon1), (lat2, lon2) in antipodes:
            addr1 = coordinate_to_address(lat1, lon1)
            addr2 = coordinate_to_address(lat2, lon2)
            
            assert isinstance(addr1, str)
            assert isinstance(addr2, str)
            assert addr1 != addr2
            
            # Distance between antipodes should be approximately 20,015 km
            distance = calculate_distance(addr1, addr2)
            assert 19500 < distance < 20500  # Allow for precision loss


class TestPrecisionBoundaries:
    """Test precision boundary cases"""
    
    def test_high_precision_coordinates(self):
        """Test coordinates with many decimal places"""
        precision_cases = [
            (48.85661234567890, 2.35223456789012),
            (40.75801111111111, -73.98552222222222),
            (-33.86883333333333, 151.20934444444444),
        ]
        
        for lat, lon in precision_cases:
            address = coordinate_to_address(lat, lon)
            result_lat, result_lon = address_to_coordinate(address)
            
            assert isinstance(address, str)
            
            # H3 precision should be within sub-meter accuracy
            assert abs(result_lat - lat) < 0.00001
            assert abs(result_lon - lon) < 0.00001
    
    def test_minimum_coordinate_differences(self):
        """Test minimum representable coordinate differences"""
        from h3_syllable.utilities import calculate_distance
        
        base = (48.8566, 2.3522)
        epsilon = 0.000001  # Very small coordinate difference
        
        nearby = (base[0] + epsilon, base[1] + epsilon)
        
        addr1 = coordinate_to_address(*base)
        addr2 = coordinate_to_address(*nearby)
        
        # Addresses might be same or different depending on H3 cell boundaries
        assert isinstance(addr1, str)
        assert isinstance(addr2, str)
        
        if addr1 != addr2:
            # If different, distance should be very small
            distance = calculate_distance(addr1, addr2)
            assert distance < 0.001  # Less than 1 meter


class TestAddressValidationEdgeCases:
    """Test address validation edge cases"""
    
    def test_boundary_syllable_combinations(self):
        """Test addresses at edge of valid syllable space"""
        system = H3SyllableSystem()
        config = system.get_config_info()
        
        # Create address with first and last valid syllables
        first_syllable = config['consonants'][0] + config['vowels'][0]
        last_syllable = (config['consonants'][-1] + config['vowels'][-1])
        
        # Test that these syllables are structurally valid
        assert len(first_syllable) == 2
        assert len(last_syllable) == 2
        assert first_syllable[0] in config['consonants']
        assert first_syllable[1] in config['vowels']
        assert last_syllable[0] in config['consonants'] 
        assert last_syllable[1] in config['vowels']
        
        # Test with actual coordinates to ensure system works with these syllables
        test_address = coordinate_to_address(48.8566, 2.3522)
        assert isinstance(test_address, str)
        assert len(test_address) == config['address_length'] * 2  # 2 chars per syllable
    
    def test_mixed_case_input(self):
        """Test mixed case input handling"""
        base_address = coordinate_to_address(48.8566, 2.3522)
        
        # Test various case combinations
        case_combinations = [
            base_address.upper(),
            base_address.lower(),
            base_address.capitalize(),
            ''.join(c.upper() if i % 2 == 0 else c for i, c in enumerate(base_address)),
        ]
        
        for test_address in case_combinations:
            # Should either be valid (if normalized) or invalid (if case-sensitive)
            is_valid = is_valid_address(test_address)
            assert isinstance(is_valid, bool)
            
            if is_valid:
                # If valid, conversion should work
                coords = address_to_coordinate(test_address)
                assert isinstance(coords, tuple)
                assert len(coords) == 2
    
    def test_addresses_with_whitespace(self):
        """Test addresses with unusual whitespace patterns"""
        valid_address = coordinate_to_address(48.8566, 2.3522)
        
        # Test patterns that might cause issues
        test_patterns = [
            valid_address + ' ',        # Trailing space
            ' ' + valid_address,        # Leading space
            valid_address + '\n',       # Trailing newline
            valid_address + '\t',       # Trailing tab
        ]
        
        for test_address in test_patterns:
            try:
                is_valid = is_valid_address(test_address)
                if is_valid:
                    coords = address_to_coordinate(test_address)
                    assert isinstance(coords, tuple)
            except Exception as error:
                # Should fail gracefully with meaningful error
                assert isinstance(str(error), str)
                assert len(str(error)) > 0


class TestMemoryAndPerformanceEdgeCases:
    """Test memory and performance edge cases"""
    
    def test_rapid_cache_operations(self):
        """Test rapid cache filling and clearing"""
        system = H3SyllableSystem()
        
        # Rapidly generate many different addresses
        for i in range(1000):
            lat = 48.8 + (i - 500) * 0.0001
            lon = 2.3 + (i - 500) * 0.0001
            system.coordinate_to_address(lat, lon)
            
            # Clear cache every 100 operations
            if i % 100 == 0:
                system.clear_cache()
        
        # System should still be responsive
        test_address = system.coordinate_to_address(48.8566, 2.3522)
        assert isinstance(test_address, str)
    
    def test_zero_distance_calculations(self):
        """Test zero-distance calculations"""
        from h3_syllable.utilities import calculate_distance
        
        address = coordinate_to_address(48.8566, 2.3522)
        
        # Distance from address to itself
        distance = calculate_distance(address, address)
        assert distance == 0
        
        # Multiple calls should be consistent
        for _ in range(10):
            assert calculate_distance(address, address) == 0
    
    def test_maximum_distance_calculations(self):
        """Test maximum distance calculations"""
        from h3_syllable.utilities import calculate_distance
        
        # Test addresses that are approximately antipodal
        addr1 = coordinate_to_address(0, 0)     # Null Island
        addr2 = coordinate_to_address(0, 180)   # Opposite side of Earth
        
        distance = calculate_distance(addr1, addr2)
        
        # Should be approximately half Earth's circumference
        assert 19000 < distance < 21000


class TestConfigurationEdgeCases:
    """Test configuration edge cases"""
    
    def test_all_available_configurations(self):
        """Test all available configurations"""
        configs = list_available_configs()
        
        assert len(configs) > 0
        
        for config_name in configs:
            system = H3SyllableSystem(config_name)
            test_coord = (48.8566, 2.3522)
            
            # Should work with all configurations
            address = system.coordinate_to_address(*test_coord)
            coords = system.address_to_coordinate(address)
            
            assert isinstance(address, str)
            assert isinstance(coords, tuple)
            assert len(coords) == 2
            
            # Round-trip should be accurate
            assert abs(coords[0] - test_coord[0]) < 0.01
            assert abs(coords[1] - test_coord[1]) < 0.01
    
    def test_config_specific_edge_cases(self):
        """Test configuration-specific edge cases"""
        configs = ['ascii-dnqqwn']  # Test main config
        
        for config_name in configs:
            system = H3SyllableSystem(config_name)
            config = system.get_config_info()
            
            # Test with coordinates that might stress the configuration
            stress_cases = [
                (0, 0),                    # Origin
                (90, 0),                   # North pole
                (-90, 0),                  # South pole
                (0, 179.999999),          # Near date line
                (45, 90),                  # Mid-latitude, significant longitude
            ]
            
            for lat, lon in stress_cases:
                address = system.coordinate_to_address(lat, lon)
                assert isinstance(address, str)
                assert len(address) == config['address_length'] * 2  # 2 chars per syllable
                
                # Should use only valid syllables
                for i in range(0, len(address), 2):
                    syllable = address[i:i+2]
                    consonant = syllable[0]
                    vowel = syllable[1]
                    
                    assert consonant in config['consonants']
                    assert vowel in config['vowels']


class TestErrorRecoveryAndRobustness:
    """Test error recovery and robustness"""
    
    def test_state_maintenance_after_errors(self):
        """Test that system maintains state after errors"""
        system = H3SyllableSystem()
        
        # Generate some valid state
        valid_address = system.coordinate_to_address(48.8566, 2.3522)
        
        # Cause some errors
        try: 
            system.coordinate_to_address(91, 0)
        except: 
            pass
        try: 
            system.address_to_coordinate('invalid')
        except: 
            pass
        try: 
            system.coordinate_to_address(None, None)
        except: 
            pass
        
        # System should still work correctly
        new_address = system.coordinate_to_address(48.8566, 2.3522)
        assert new_address == valid_address
        
        coords = system.address_to_coordinate(valid_address)
        assert isinstance(coords, tuple)
    
    def test_corrupted_input_handling(self):
        """Test handling of corrupted input"""
        corrupted_inputs = [
            None,
            float('nan'),
            float('inf'),
            float('-inf'),
            {},
            [],
            lambda: None,
        ]
        
        for input_val in corrupted_inputs:
            try:
                coordinate_to_address(input_val, input_val)
                # If it doesn't throw, result should still be reasonable
            except Exception as error:
                assert isinstance(str(error), str)
                assert len(str(error)) > 0
            
            try:
                address_to_coordinate(input_val)
            except Exception as error:
                assert isinstance(str(error), str)
                assert len(str(error)) > 0
    
    def test_boundary_numeric_values(self):
        """Test boundary numeric values"""
        boundary_cases = [
            (90.0, 180.0),     # Maximum valid coordinates
            (-90.0, -180.0),   # Minimum valid coordinates
            (0.0, 0.0),        # Zero coordinates
            (89.999999, 179.999999),  # Just within bounds
            (-89.999999, -179.999999), # Just within bounds
        ]
        
        for lat, lon in boundary_cases:
            try:
                address = coordinate_to_address(lat, lon)
                coords = address_to_coordinate(address)
                
                assert isinstance(address, str)
                assert isinstance(coords, tuple)
                assert len(coords) == 2
                
                # Should be reasonably close to input
                assert abs(coords[0] - lat) < 0.01
                assert abs(coords[1] - lon) < 0.01
                
            except Exception as error:
                # If error occurs at boundaries, should be meaningful
                assert isinstance(str(error), str)
                assert len(str(error)) > 0
    
    def test_repeated_operations_consistency(self):
        """Test that repeated operations are consistent"""
        test_coord = (48.8566, 2.3522)
        
        # Perform same operation multiple times
        addresses = []
        for _ in range(100):
            address = coordinate_to_address(*test_coord)
            addresses.append(address)
        
        # All results should be identical
        assert all(addr == addresses[0] for addr in addresses)
        
        # Reverse operations should also be consistent
        coords_list = []
        for _ in range(100):
            coords = address_to_coordinate(addresses[0])
            coords_list.append(coords)
        
        # All results should be identical
        assert all(coords == coords_list[0] for coords in coords_list)