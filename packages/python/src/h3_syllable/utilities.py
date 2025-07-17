#!/usr/bin/env python3
"""
Utility functions for H3 Syllable System
"""

import math
from typing import List, Tuple, Dict, Any
from .h3_syllable_system import H3SyllableSystem


def calculate_distance(
    address1: str,
    address2: str,
    config_name: str = 'ascii-dnqqwn'
) -> float:
    """
    Calculate the distance between two hex addresses in kilometers.
    
    Args:
        address1: First hex address
        address2: Second hex address
        config_name: Configuration to use
        
    Returns:
        Distance in kilometers
        
    Example:
        >>> distance = calculate_distance(
        ...     "dinenunukiwufeme", 
        ...     "dinenunukiwufene", 
        ...     "ascii-dnqqwn"
        ... )
        >>> print(f"Distance: {distance:.2f} km")
    """
    system = H3SyllableSystem(config_name)
    lat1, lon1 = system.address_to_coordinate(address1)
    lat2, lon2 = system.address_to_coordinate(address2)
    
    return haversine_distance(lat1, lon1, lat2, lon2)


def find_nearby_addresses(
    center_address: str,
    radius_km: float,
    config_name: str = 'ascii-dnqqwn'
) -> List[Dict[str, Any]]:
    """
    Find hex addresses within a radius of a center address.
    
    Args:
        center_address: Center hex address
        radius_km: Radius in kilometers
        config_name: Configuration to use
        
    Returns:
        List of dictionaries with 'address', 'distance', and 'coordinates' keys
        
    Example:
        >>> nearby = find_nearby_addresses("dinenunukiwufeme", 1.0)
        >>> for item in nearby:
        ...     print(f"{item['address']}: {item['distance']:.3f}km")
    """
    system = H3SyllableSystem(config_name)
    center_lat, center_lon = system.address_to_coordinate(center_address)
    
    # Generate grid of nearby coordinates to find addresses within radius
    result = []
    grid_size = radius_km / 111  # Approximate degrees per km
    step_size = grid_size / 10  # Higher resolution for better coverage
    
    lat_start = center_lat - grid_size
    lat_end = center_lat + grid_size
    lon_start = center_lon - grid_size
    lon_end = center_lon + grid_size
    
    lat = lat_start
    while lat <= lat_end:
        lon = lon_start
        while lon <= lon_end:
            try:
                address = system.coordinate_to_address(lat, lon)
                distance = haversine_distance(center_lat, center_lon, lat, lon)
                
                if distance <= radius_km and address != center_address:
                    # Check if we already have this address
                    if not any(item['address'] == address for item in result):
                        result.append({
                            'address': address,
                            'distance': distance,
                            'coordinates': (lat, lon)
                        })
            except:
                # Skip invalid coordinates
                pass
            lon += step_size
        lat += step_size
    
    return sorted(result, key=lambda x: x['distance'])


def get_address_bounds(
    address: str,
    config_name: str = 'ascii-dnqqwn'
) -> Dict[str, float]:
    """
    Get geographic bounds (bounding box) for a hex address.
    
    Args:
        address: Hex address
        config_name: Configuration to use
        
    Returns:
        Dictionary with 'north', 'south', 'east', 'west' keys
        
    Example:
        >>> bounds = get_address_bounds("dinenunukiwufeme")
        >>> print(f"SW: {bounds['south']}, {bounds['west']}")
        >>> print(f"NE: {bounds['north']}, {bounds['east']}")
    """
    system = H3SyllableSystem(config_name)
    center_lat, center_lon = system.address_to_coordinate(address)
    
    # H3 level 15 has ~0.5m precision, so create approximate bounds
    # Each H3 cell is roughly hexagonal with ~0.5m radius
    cell_radius_km = 0.0005  # ~0.5m in km
    degree_offset = cell_radius_km / 111  # Convert km to approximate degrees
    
    return {
        'north': center_lat + degree_offset,
        'south': center_lat - degree_offset,
        'east': center_lon + degree_offset / math.cos(math.radians(center_lat)),
        'west': center_lon - degree_offset / math.cos(math.radians(center_lat))
    }


def cluster_addresses(
    addresses: List[str],
    max_distance_km: float,
    config_name: str = 'ascii-dnqqwn'
) -> List[Dict[str, Any]]:
    """
    Cluster nearby hex addresses into groups.
    
    Args:
        addresses: List of hex addresses to cluster
        max_distance_km: Maximum distance between addresses in same cluster
        config_name: Configuration to use
        
    Returns:
        List of clusters, each containing grouped addresses
        
    Example:
        >>> addresses = ["addr1", "addr2", "addr3", "addr4"]
        >>> clusters = cluster_addresses(addresses, 0.5)
        >>> print(f"Found {len(clusters)} clusters")
    """
    if not addresses:
        return []
    
    system = H3SyllableSystem(config_name)
    coords = []
    
    for addr in addresses:
        lat, lon = system.address_to_coordinate(addr)
        coords.append({'address': addr, 'lat': lat, 'lon': lon})
    
    clusters = []
    used = set()
    
    for i, coord1 in enumerate(coords):
        if i in used:
            continue
        
        cluster = {
            'addresses': [coord1['address']],
            'coords': [{'lat': coord1['lat'], 'lon': coord1['lon']}]
        }
        used.add(i)
        
        for j, coord2 in enumerate(coords[i+1:], start=i+1):
            if j in used:
                continue
            
            distance = haversine_distance(
                coord1['lat'], coord1['lon'],
                coord2['lat'], coord2['lon']
            )
            
            if distance <= max_distance_km:
                cluster['addresses'].append(coord2['address'])
                cluster['coords'].append({'lat': coord2['lat'], 'lon': coord2['lon']})
                used.add(j)
        
        clusters.append(cluster)
    
    # Calculate cluster centers and bounds
    result = []
    for cluster in clusters:
        lats = [c['lat'] for c in cluster['coords']]
        lons = [c['lon'] for c in cluster['coords']]
        center_lat = sum(lats) / len(lats)
        center_lon = sum(lons) / len(lons)
        
        result.append({
            'addresses': cluster['addresses'],
            'center': (center_lat, center_lon),
            'bounds': {
                'north': max(lats),
                'south': min(lats),
                'east': max(lons),
                'west': min(lons)
            }
        })
    
    return result


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the Haversine distance between two points in kilometers.
    
    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates
        
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(d_lat / 2) * math.sin(d_lat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) * math.sin(d_lon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c