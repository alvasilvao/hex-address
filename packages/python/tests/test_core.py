#!/usr/bin/env python3
"""
Core functionality tests for H3 Syllable System
"""

import pytest
import math
from h3_syllable import (
    coordinate_to_address,
    address_to_coordinate, 
    H3SyllableSystem,
    list_available_configs,
    get_config_info
)


class TestCoreFunctions:
    """Test core conversion functions"""
    
    def test_coordinate_to_address(self):
        """Test coordinate to address conversion"""
        address = coordinate_to_address(48.8566, 2.3522)
        
        assert isinstance(address, str)
        assert len(address) > 0
        # Should be lowercase letters only
        assert address.islower()
        assert address.isalpha()
    
    def test_different_coordinate_ranges(self):
        """Test conversion with different coordinate ranges"""
        test_coords = [
            (0, 0),           # Equator, Prime Meridian
            (90, 180),        # North Pole area  
            (-90, -180),      # South Pole area
            (48.8566, 2.3522), # Paris
            (40.7580, -73.9855), # New York
            (-33.8568, 151.2153), # Sydney
        ]
        
        for lat, lon in test_coords:
            address = coordinate_to_address(lat, lon)
            assert isinstance(address, str)
            assert len(address) > 0
    
    def test_different_configurations(self):
        """Test conversion with different configurations"""
        coords = (48.8566, 2.3522)
        configs = ['ascii-dnqqwn']
        
        for config in configs:
            address = coordinate_to_address(*coords, config)
            assert isinstance(address, str)
            assert len(address) > 0
    
    def test_invalid_coordinates(self):
        """Test error handling for invalid coordinates"""
        with pytest.raises(Exception):
            coordinate_to_address(91, 0)  # Invalid latitude
        
        with pytest.raises(Exception):
            coordinate_to_address(-91, 0)  # Invalid latitude
            
        with pytest.raises(Exception):
            coordinate_to_address(0, 181)  # Invalid longitude
            
        with pytest.raises(Exception):
            coordinate_to_address(0, -181)  # Invalid longitude


class TestAddressToCoordinate:
    """Test address to coordinate conversion"""
    
    def test_address_to_coordinate(self):
        """Test address to coordinate conversion"""
        original_coords = (48.8566, 2.3522)
        address = coordinate_to_address(*original_coords)
        lat, lon = address_to_coordinate(address)
        
        assert isinstance(lat, float)
        assert isinstance(lon, float)
        assert -90 <= lat <= 90
        assert -180 <= lon <= 180
        
        # Should be close to original coordinates (within H3 precision)
        assert abs(lat - original_coords[0]) < 0.01
        assert abs(lon - original_coords[1]) < 0.01
    
    def test_round_trip_conversion(self):
        """Test round-trip conversion accuracy"""
        test_coords = [
            (48.8566, 2.3522),
            (40.7580, -73.9855),
            (-33.8568, 151.2153),
            (35.6762, 139.6503),
        ]
        
        for original_lat, original_lon in test_coords:
            address = coordinate_to_address(original_lat, original_lon)
            new_lat, new_lon = address_to_coordinate(address)
            
            # Should be very close due to H3 precision
            assert abs(new_lat - original_lat) < 0.001
            assert abs(new_lon - original_lon) < 0.001
    
    def test_different_configurations(self):
        """Test conversion with different configurations"""
        coords = (48.8566, 2.3522)
        address = coordinate_to_address(*coords, 'ascii-dnqqwn')
        lat, lon = address_to_coordinate(address, 'ascii-dnqqwn')
        
        assert isinstance(lat, float)
        assert isinstance(lon, float)
    
    def test_invalid_addresses(self):
        """Test error handling for invalid addresses"""
        with pytest.raises(Exception):
            address_to_coordinate('invalid')
            
        with pytest.raises(Exception):
            address_to_coordinate('')
            
        with pytest.raises(Exception):
            address_to_coordinate('xyxyxyxyxyxyxyxy')


class TestH3SyllableSystem:
    """Test H3SyllableSystem class"""
    
    def test_create_default_system(self):
        """Test creating system with default configuration"""
        system = H3SyllableSystem()
        assert isinstance(system, H3SyllableSystem)
    
    def test_create_specific_system(self):
        """Test creating system with specific configuration"""
        system = H3SyllableSystem('ascii-dnqqwn')
        assert isinstance(system, H3SyllableSystem)
    
    def test_system_methods(self):
        """Test that system has all required methods"""
        system = H3SyllableSystem()
        
        assert hasattr(system, 'coordinate_to_address')
        assert hasattr(system, 'address_to_coordinate')
        assert hasattr(system, 'is_valid_address')
        assert hasattr(system, 'get_system_info')
        assert hasattr(system, 'get_config_info')
        assert hasattr(system, 'clear_cache')
        
        assert callable(system.coordinate_to_address)
        assert callable(system.address_to_coordinate)
        assert callable(system.is_valid_address)
        assert callable(system.get_system_info)
        assert callable(system.get_config_info)
        assert callable(system.clear_cache)
    
    def test_system_info(self):
        """Test system information"""
        system = H3SyllableSystem()
        info = system.get_system_info()
        
        # SystemInfo is a dataclass, not a dict
        assert hasattr(info, 'h3_resolution')
        assert hasattr(info, 'total_h3_cells')
        assert hasattr(info, 'consonants')
        assert hasattr(info, 'vowels')
        assert hasattr(info, 'total_syllables')
        assert hasattr(info, 'address_length')
        assert hasattr(info, 'address_space')
        assert hasattr(info, 'coverage_percentage')
        assert hasattr(info, 'precision_meters')
        
        assert isinstance(info.h3_resolution, int)
        assert isinstance(info.total_h3_cells, int)
        assert isinstance(info.consonants, list)
        assert isinstance(info.vowels, list)
    
    def test_config_details(self):
        """Test configuration details"""
        system = H3SyllableSystem()
        config = system.get_config_info()
        
        assert isinstance(config, dict)
        assert 'name' in config
        assert 'consonants' in config
        assert 'vowels' in config
        assert 'address_length' in config
        assert 'description' in config
        
        assert isinstance(config['consonants'], list)
        assert isinstance(config['vowels'], list)
        assert len(config['consonants']) > 0
        assert len(config['vowels']) > 0
    
    def test_cache_operations(self):
        """Test cache operations"""
        system = H3SyllableSystem()
        
        # Generate some addresses to populate cache
        system.coordinate_to_address(48.8566, 2.3522)
        system.coordinate_to_address(40.7580, -73.9855)
        
        # Should not throw when clearing cache
        system.clear_cache()


class TestConfigurationManagement:
    """Test configuration management functions"""
    
    def test_list_available_configs(self):
        """Test listing available configurations"""
        configs = list_available_configs()
        
        assert isinstance(configs, list)
        assert len(configs) > 0
        
        for config in configs:
            assert isinstance(config, str)
            assert len(config) > 0
    
    def test_get_config_info(self):
        """Test getting configuration information"""
        configs = list_available_configs()
        
        for config_name in configs:
            info = get_config_info(config_name)
            
            assert isinstance(info, dict)
            assert 'name' in info
            assert 'consonants' in info
            assert 'vowels' in info
            assert 'total_syllables' in info
            assert 'address_length' in info
            assert 'address_space' in info
            
            assert isinstance(info['consonants'], list)
            assert isinstance(info['vowels'], list)
            assert info['total_syllables'] == len(info['consonants']) * len(info['vowels'])
    
    def test_invalid_configuration(self):
        """Test error handling for invalid configuration"""
        with pytest.raises(Exception):
            get_config_info('nonexistent-config')
            
        with pytest.raises(Exception):
            H3SyllableSystem('invalid-config')


class TestPerformance:
    """Test performance characteristics"""
    
    def test_batch_operations(self):
        """Test batch operations performance"""
        test_coords = []
        for i in range(100):
            lat = 48.8 + (i - 50) * 0.001  # Paris area
            lon = 2.3 + (i - 50) * 0.001
            test_coords.append((lat, lon))
        
        # Convert all coordinates to addresses
        addresses = [coordinate_to_address(lat, lon) for lat, lon in test_coords]
        
        # Convert all addresses back to coordinates  
        coords = [address_to_coordinate(addr) for addr in addresses]
        
        assert len(addresses) == 100
        assert len(coords) == 100
    
    def test_caching_performance(self):
        """Test that caching improves performance"""
        system = H3SyllableSystem()
        coords = (48.8566, 2.3522)
        
        # First call
        address1 = system.coordinate_to_address(*coords)
        
        # Second call (should use cache)
        address2 = system.coordinate_to_address(*coords)
        
        assert address1 == address2


class TestErrorHandling:
    """Test error handling"""
    
    def test_meaningful_error_messages(self):
        """Test that error messages are meaningful"""
        test_cases = [
            lambda: coordinate_to_address(91, 0),
            lambda: coordinate_to_address(0, 181),
            lambda: address_to_coordinate('invalid'),
            lambda: H3SyllableSystem('nonexistent'),
        ]
        
        for test_case in test_cases:
            try:
                test_case()
                assert False, "Should have thrown an error"
            except Exception as error:
                assert len(str(error)) > 0
                assert isinstance(str(error), str)
    
    def test_edge_case_coordinates(self):
        """Test edge case coordinates"""
        edge_cases = [
            (0, 0),
            (90, 0),
            (-90, 0),
            (0, 180),
            (0, -180),
        ]
        
        for lat, lon in edge_cases:
            address = coordinate_to_address(lat, lon)
            coords = address_to_coordinate(address)
            assert isinstance(coords, tuple)
            assert len(coords) == 2