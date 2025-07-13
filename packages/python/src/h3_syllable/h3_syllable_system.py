#!/usr/bin/env python3
"""
H3 Syllable Address System - Core Module

This is the main production module for converting between GPS Coordinates
and human-friendly Syllable Addresses using H3 Level 15 cells.

Standard Process:
1. GPS Coordinates → H3 Cell ID (H3 hexagonal identifier)
2. H3 Cell ID → Hierarchical Array (path through H3 tree structure)
3. Hierarchical Array → Integer Index (unique mathematical index)
4. Integer Index → Syllable Address (human-readable syllables)

Features:
- Sub-meter precision (~0.5m)
- Pure ASCII alphabet for global compatibility
- Dynamic address formatting with pipe separators
- Perfect reversible mapping
- Minimal syllable count for optimal efficiency
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Tuple

import h3

from .config_loader import get_config


class H3SyllableError(Exception):
    """Base exception for H3 syllable system errors."""

    pass


class ConversionError(H3SyllableError):
    """Raised when coordinate/syllable conversion fails."""

    pass


@dataclass
class SystemInfo:
    """System information and statistics."""

    h3_resolution: int
    total_h3_cells: int
    consonants: List[str]
    vowels: List[str]
    total_syllables: int
    address_length: int
    address_space: int
    coverage_percentage: float
    precision_meters: float


@dataclass
class GeographicBounds:
    """Geographic bounds."""
    
    north: float
    south: float
    east: float
    west: float


@dataclass
class PartialLocationEstimate:
    """Result from partial address location estimation."""
    
    center_coordinate: Tuple[float, float]
    bounds: GeographicBounds
    confidence: float
    estimated_area_km2: float
    completeness_level: int
    suggested_refinements: List[str] = None


class H3SyllableSystem:
    """
    H3 Level 15 Syllable Address System

    Main interface for converting between geographic coordinates and
    human-friendly syllable addresses.

    System Specifications:
    - H3 Resolution: Level 15 (~0.5 meter precision)
    - Character Set: Pure ASCII letters (a-z)
    - Constraint: max_consecutive = 1 (no adjacent identical syllables)
    - Address Format: Dynamic pipe-separated groups (e.g., "je-ma-su-cu|du-ve-gu-ba")
    - Target Coverage: 122 × 7^15 = 579,202,504,213,046 H3 positions
    - Algorithm: Exact mathematical calculation for minimum syllables
    """

    def __init__(self, config_name: str = None):
        """
        Initialize the H3 Syllable System with specified configuration.

        Args:
            config_name: Configuration to use (e.g., "ascii-etmhjj", "ascii-cjbnb")
                        If None, uses default "ascii-etmhjj" (international)

        Example:
            >>> system = H3SyllableSystem()  # Uses default
            >>> system = H3SyllableSystem('ascii-cjbnb')  # Minimal balanced
        """

        # Use default config if none specified
        if config_name is None:
            config_name = "ascii-etmhjj"

        # Load configuration
        self.config = get_config(config_name)
        self.config_name = config_name

        # System configuration from config
        self.h3_resolution = self.config.h3_resolution
        self.consonants = self.config.consonants
        self.vowels = self.config.vowels
        self.total_syllables = len(self.consonants) * len(self.vowels)
        self.address_length = self.config.address_length
        self.max_consecutive = self.config.max_consecutive
        self.address_space = self.total_syllables**self.address_length

        # H3 Level 15 exact cell count: 122 base cells × 7^15 hierarchical positions
        self.h3_total_cells = 122 * (7**15)

        # Pre-compute syllable lookup tables
        self._initialize_syllable_tables()

        # Cache for performance (with size limit)
        self._cache = {}
        self._cache_max_size = 1000

        # Load level 0 mapping for Hamiltonian path ordering
        self._level_0_mapping = self._load_level_0_mapping()

    def _initialize_syllable_tables(self):
        """Initialize syllable lookup tables for fast conversion."""
        self.syllable_to_index = {}
        self.index_to_syllable = {}

        index = 0
        for consonant in self.consonants:
            for vowel in self.vowels:
                syllable = consonant + vowel
                self.syllable_to_index[syllable] = index
                self.index_to_syllable[index] = syllable
                index += 1

    def _load_level_0_mapping(self) -> List[int]:
        """Load level 0 Hamiltonian path mapping (optimized array-based approach)."""
        # Pre-computed Hamiltonian path for perfect spatial adjacency (100%)
        # Array where index = original_base_cell, value = hamiltonian_position
        # This replaces two dictionaries with a single array for better performance
        return [
            1,
            2,
            3,
            8,
            0,
            4,
            12,
            9,
            5,
            10,
            14,
            13,
            7,
            22,
            11,
            6,
            17,
            39,
            16,
            42,
            41,
            23,
            18,
            37,
            15,
            38,
            21,
            40,
            20,
            25,
            34,
            19,
            35,
            33,
            43,
            47,
            44,
            36,
            24,
            69,
            45,
            31,
            27,
            26,
            29,
            48,
            46,
            57,
            65,
            32,
            66,
            56,
            67,
            30,
            55,
            54,
            50,
            68,
            28,
            70,
            52,
            63,
            59,
            49,
            58,
            61,
            64,
            75,
            51,
            93,
            74,
            92,
            53,
            91,
            72,
            62,
            60,
            87,
            71,
            86,
            89,
            77,
            107,
            73,
            94,
            76,
            109,
            82,
            90,
            96,
            88,
            97,
            84,
            121,
            78,
            85,
            108,
            95,
            106,
            100,
            83,
            80,
            81,
            98,
            110,
            99,
            101,
            79,
            119,
            120,
            111,
            105,
            113,
            103,
            114,
            112,
            104,
            102,
            118,
            116,
            115,
            117,
        ]

    def coordinate_to_syllable(self, latitude: float, longitude: float) -> str:
        """
        Convert geographic coordinates to syllable address.

        Args:
            latitude: Latitude in decimal degrees (-90 to 90)
            longitude: Longitude in decimal degrees (-180 to 180)

        Returns:
            Syllable address string (e.g., "je-ma-su-cu|du-ve-gu-ba")

        Raises:
            ConversionError: If conversion fails

        Example:
            >>> system = H3SyllableSystem()
            >>> address = system.coordinate_to_syllable(48.8566, 2.3522)
            >>> print(address)  # "je-ma-su-cu|du-ve-gu-ba"
        """
        try:
            # Validate coordinates
            self._validate_coordinates(latitude, longitude)

            # Check cache
            coord_key = (round(latitude, 8), round(longitude, 8))
            if coord_key in self._cache:
                return self._cache[coord_key]

            # Step 1: Convert GPS Coordinates to H3 Cell ID
            h3_index = h3.latlng_to_cell(latitude, longitude, self.h3_resolution)

            # Step 2: Convert H3 Cell ID to Hierarchical Array
            hierarchical_array = self._h3_cell_id_to_hierarchical_array(h3_index)

            # Step 3: Convert Hierarchical Array to Integer Index
            integer_index = self._hierarchical_array_to_integer_index(
                hierarchical_array
            )

            # Step 4: Convert Integer Index to Syllable Address
            syllable_address = self._integer_index_to_syllable_address(integer_index)

            # Cache result (with size limit)
            if len(self._cache) >= self._cache_max_size:
                # Remove oldest entry (simple FIFO)
                self._cache.pop(next(iter(self._cache)))
            self._cache[coord_key] = syllable_address

            return syllable_address

        except ValueError:
            raise ConversionError(f"Invalid coordinate values: {latitude}, {longitude}")
        except Exception:
            raise ConversionError("Coordinate conversion failed")

    def syllable_to_coordinate(self, syllable_address: str) -> Tuple[float, float]:
        """
        Convert syllable address to geographic coordinates.

        Args:
            syllable_address: Syllable address string

        Returns:
            Tuple of (latitude, longitude) in decimal degrees

        Raises:
            ConversionError: If conversion fails

        Example:
            >>> system = H3SyllableSystem()
            >>> lat, lon = system.syllable_to_coordinate("je-ma-su-cu|du-ve-gu-ba")
            >>> print(f"{lat:.6f}, {lon:.6f}")
        """
        try:
            # Check cache
            if syllable_address in self._cache:
                return self._cache[syllable_address]

            # Step 1: Convert Syllable Address to Integer Index
            integer_index = self._syllable_address_to_integer_index(syllable_address)

            # Step 2: Convert Integer Index to Hierarchical Array
            hierarchical_array = self._integer_index_to_hierarchical_array(
                integer_index
            )

            # Step 3: Convert Hierarchical Array to H3 Cell ID
            h3_index = self._hierarchical_array_to_h3_cell_id(hierarchical_array)

            # Step 4: Convert H3 Cell ID to GPS Coordinates
            latitude, longitude = h3.cell_to_latlng(h3_index)

            # Cache result (with size limit)
            if len(self._cache) >= self._cache_max_size:
                # Remove oldest entry (simple FIFO)
                self._cache.pop(next(iter(self._cache)))
            self._cache[syllable_address] = (latitude, longitude)

            return latitude, longitude

        except ValueError:
            raise ConversionError("Invalid syllable address format")
        except Exception:
            raise ConversionError("Syllable conversion failed")

    def _validate_coordinates(self, latitude: float, longitude: float):
        """Validate coordinate ranges."""
        # Check for invalid numbers
        if not (math.isfinite(latitude) and math.isfinite(longitude)):
            raise ValueError(
                f"Invalid coordinate values: latitude={latitude}, longitude={longitude}"
            )

        if not (-90 <= latitude <= 90):
            raise ValueError(f"Latitude must be between -90 and 90, got {latitude}")
        if not (-180 <= longitude <= 180):
            raise ValueError(f"Longitude must be between -180 and 180, got {longitude}")

    def _h3_cell_id_to_hierarchical_array(self, h3_cell_id: str) -> List[int]:
        """Convert H3 Cell ID to Hierarchical Array [base_cell, child_0, ..., child_14]."""

        # Get the complete parent chain from target resolution to base
        current = h3_cell_id
        parent_chain = [current]

        # Walk up the hierarchy to get all ancestors
        for res in range(self.h3_resolution - 1, -1, -1):
            parent = h3.cell_to_parent(current, res)
            parent_chain.append(parent)
            current = parent

        # Parent chain is now [target_res, target_res-1, ..., res_1, res_0]
        # Reverse to get [res_0, res_1, ..., target_res-1, target_res]
        parent_chain.reverse()

        # Initialize array with -1 (unused positions)
        hierarchical_array = [-1] * 16  # [base_cell] + [child_0 to child_14]

        # Extract base cell number from resolution 0 cell
        base_cell_h3 = parent_chain[0]
        base_cell_number = h3.get_base_cell_number(base_cell_h3)
        hierarchical_array[0] = base_cell_number

        # For each resolution level, find the child position
        for res in range(1, len(parent_chain)):
            parent_h3 = parent_chain[res - 1]
            child_h3 = parent_chain[res]

            # Get all children of parent at this resolution
            children = list(h3.cell_to_children(parent_h3, res))

            # Find child position
            child_position = children.index(child_h3)
            hierarchical_array[res] = child_position

        return hierarchical_array

    def _hierarchical_array_to_h3_cell_id(self, hierarchical_array: List[int]) -> str:
        """Convert Hierarchical Array to H3 Cell ID."""

        base_cell_number = hierarchical_array[0]

        # Get base cell H3 index
        all_base_cells = h3.get_res0_cells()
        current_h3 = None
        for base_h3 in all_base_cells:
            if h3.get_base_cell_number(base_h3) == base_cell_number:
                current_h3 = base_h3
                break

        if current_h3 is None:
            raise ValueError(f"Could not find base cell with number {base_cell_number}")

        # Navigate down the hierarchy following child positions
        for res in range(1, self.h3_resolution + 1):
            child_position = hierarchical_array[res]

            if child_position == -1:
                break

            # Get children at this resolution
            children = list(h3.cell_to_children(current_h3, res))
            current_h3 = children[child_position]

        return current_h3

    def _hierarchical_array_to_integer_index(
        self, hierarchical_array: List[int]
    ) -> int:
        """Convert Hierarchical Array to Integer Index using mixed radix with Hamiltonian path ordering."""

        result = 0
        multiplier = 1

        # Process from right to left (least significant first)
        for pos in range(self.h3_resolution, 0, -1):
            child_pos = hierarchical_array[pos]
            if child_pos != -1:
                result += child_pos * multiplier
                multiplier *= 7  # 7 possible child positions
            else:
                multiplier *= 7

        # Apply Hamiltonian path ordering to base cell (most significant)
        original_base_cell = hierarchical_array[0]
        hamiltonian_base_cell = self._level_0_mapping[original_base_cell]
        result += hamiltonian_base_cell * multiplier

        return result

    def _integer_index_to_hierarchical_array(self, integer_index: int) -> List[int]:
        """Convert Integer Index back to Hierarchical Array with Hamiltonian path ordering."""

        # Initialize array
        hierarchical_array = [-1] * 16

        remaining = integer_index

        # Calculate base multiplier
        base_multiplier = 7**self.h3_resolution

        # Extract Hamiltonian base cell and convert back to original
        hamiltonian_base_cell = remaining // base_multiplier
        # Find original base cell by searching the Hamiltonian path array
        original_base_cell = self._level_0_mapping.index(hamiltonian_base_cell)
        hierarchical_array[0] = original_base_cell
        remaining = remaining % base_multiplier

        # Extract child positions from right to left
        for pos in range(self.h3_resolution, 0, -1):
            child_pos = remaining % 7
            hierarchical_array[pos] = child_pos
            remaining = remaining // 7

        return hierarchical_array

    def _integer_index_to_syllable_address(self, integer_index: int) -> str:
        """Convert Integer Index to Syllable Address using base-N conversion.
        Orders syllables from coarse to fine geography (most significant first).
        """

        if not 0 <= integer_index < self.address_space:
            raise ValueError(
                f"Integer Index {integer_index} out of range [0, {self.address_space})"
            )

        syllables = []
        remaining = integer_index

        # Base conversion with geographic ordering (most significant first)
        for pos in range(self.address_length):
            syllable_idx = remaining % self.total_syllables
            # Insert at front so coarse geography appears first
            syllables.insert(0, self.index_to_syllable[syllable_idx])
            remaining //= self.total_syllables

        return self._format_syllable_address(syllables)

    def _format_syllable_address(self, syllables: List[str]) -> str:
        """Format syllable address as concatenated string."""
        return "".join(syllables)

    def _syllable_address_to_integer_index(self, syllable_address: str) -> int:
        """Convert Syllable Address to Integer Index using base-N conversion.
        Processes syllables from coarse to fine geography (most significant first).
        """

        # Parse 2-character syllables from concatenated string
        clean_address = syllable_address.lower()
        syllables = [clean_address[i:i+2] for i in range(0, len(clean_address), 2)]

        if len(syllables) != self.address_length:
            raise ValueError(f"Address must have {self.address_length} syllables")

        # Convert to integer using same logic as forward conversion
        integer_value = 0

        # Process syllables from right to left (fine to coarse) to match the reversed ordering
        for pos in range(len(syllables)):
            syllable = syllables[len(syllables) - 1 - pos]  # Process from right to left
            if syllable not in self.syllable_to_index:
                raise ValueError(f"Unknown syllable: {syllable}")

            syllable_idx = self.syllable_to_index[syllable]
            # Use the same base conversion logic as forward direction
            integer_value += syllable_idx * (self.total_syllables**pos)

        return integer_value

    def get_system_info(self) -> SystemInfo:
        """Get comprehensive system information."""
        return SystemInfo(
            h3_resolution=self.h3_resolution,
            total_h3_cells=self.h3_total_cells,
            consonants=self.consonants,
            vowels=self.vowels,
            total_syllables=self.total_syllables,
            address_length=self.address_length,
            address_space=self.address_space,
            coverage_percentage=(self.address_space / self.h3_total_cells) * 100,
            precision_meters=0.5,
        )

    def test_round_trip(self, latitude: float, longitude: float) -> Dict:
        """
        Test round-trip conversion accuracy.

        Returns:
            Dictionary with test results including precision in meters
        """
        try:
            # Forward conversion
            syllable_address = self.coordinate_to_syllable(latitude, longitude)

            # Reverse conversion
            result_lat, result_lon = self.syllable_to_coordinate(syllable_address)

            # Calculate precision
            lat_diff = abs(result_lat - latitude)
            lon_diff = abs(result_lon - longitude)

            lat_rad = math.radians(latitude)
            meters_per_degree_lat = 111320
            meters_per_degree_lon = 111320 * math.cos(lat_rad)

            distance_error_m = math.sqrt(
                (lat_diff * meters_per_degree_lat) ** 2
                + (lon_diff * meters_per_degree_lon) ** 2
            )

            return {
                "success": True,
                "original_coordinates": (latitude, longitude),
                "syllable_address": syllable_address,
                "result_coordinates": (result_lat, result_lon),
                "distance_error_meters": distance_error_m,
                "precise": distance_error_m < 1.0,
            }

        except Exception as e:
            return {
                "success": False,
                "original_coordinates": (latitude, longitude),
                "error": str(e),
            }

    def is_valid_syllable_address(self, syllable_address: str) -> bool:
        """
        Check if a syllable address maps to a real H3 location.

        Just like real addresses, some syllable combinations may not correspond
        to actual locations on Earth. This function validates whether a given
        syllable address can be successfully converted to GPS coordinates.

        Args:
            syllable_address: Syllable address string to validate

        Returns:
            bool: True if address is valid, False if it doesn't exist

        Example:
            >>> system = H3SyllableSystem("ascii-etmhjj")
            >>> system.is_valid_syllable_address("je-ma-su-cu|du-ve-gu-ba")
            True
            >>> system.is_valid_syllable_address("ca-ce-va-po|ce-mi-to-cu")
            False
        """
        try:
            # Attempt conversion - if it succeeds, address is valid
            self.syllable_to_coordinate(syllable_address)
            return True
        except Exception:
            # Any conversion error means the address doesn't exist
            return False

    def estimate_location_from_partial(self, partial_address: str) -> PartialLocationEstimate:
        """
        Estimate location and bounds from a partial syllable address.

        This function calculates the geographic area that could be represented by
        a partial syllable address by determining the minimum and maximum complete
        addresses that start with the given partial address.

        Args:
            partial_address: Partial syllable address (e.g., "bi-me" or "bi-me-mu")

        Returns:
            PartialLocationEstimate with center coordinates, bounds, confidence, and area

        Raises:
            ConversionError: If partial address is invalid or conversion fails

        Example:
            >>> system = H3SyllableSystem()
            >>> estimate = system.estimate_location_from_partial("bi-me")
            >>> print(f"Center: {estimate.center_coordinate}")
            >>> print(f"Area: {estimate.estimated_area_km2:.1f} km²")
        """
        try:
            # Parse partial address and validate format
            partial_syllables = self._parse_partial_address(partial_address)
            
            # Calculate address range (min and max complete addresses)
            address_range = self._calculate_address_range(partial_syllables)
            
            # Find valid addresses within the range, with smart fallback if initial addresses are invalid
            valid_range = self._find_valid_address_range(address_range["min_address"], address_range["max_address"], partial_syllables)
            
            # Convert both addresses to coordinates
            min_coords = self.syllable_to_coordinate(valid_range["min_address"])
            max_coords = self.syllable_to_coordinate(valid_range["max_address"])
            
            # Calculate geographic bounds and metrics
            bounds = self._calculate_geographic_bounds(min_coords, max_coords)
            center = self._calculate_center(min_coords, max_coords)
            area_km2 = self._calculate_area_km2(bounds)
            confidence = self._calculate_confidence(len(partial_syllables))
            
            # Get suggested refinements (next possible syllables)
            suggested_refinements = self._get_suggested_refinements(partial_syllables)
            
            return PartialLocationEstimate(
                center_coordinate=center,
                bounds=bounds,
                confidence=confidence,
                estimated_area_km2=area_km2,
                completeness_level=len(partial_syllables),
                suggested_refinements=suggested_refinements
            )
        except Exception as e:
            if isinstance(e, ConversionError):
                raise e
            raise ConversionError(f"Partial address estimation failed: {str(e)}")

    def clear_cache(self):
        """Clear internal cache."""
        self._cache.clear()

    def get_config_info(self) -> Dict:
        """Get detailed information about the current configuration."""
        return {
            "name": self.config.name,
            "identifier": self.config.identifier,
            "description": self.config.description,
            "consonants": self.config.consonants,
            "vowels": self.config.vowels,
            "total_syllables": self.config.total_syllables,
            "address_length": self.config.address_length,
            "max_consecutive": self.config.max_consecutive,
            "address_space": self.config.address_space,
            "h3_resolution": self.config.h3_resolution,
            "is_auto_generated": self.config.is_auto_generated,
            "coverage_percentage": self.config.coverage_percentage,
        }

    @classmethod
    def from_letters(
        cls, letters: List[str], max_consecutive: int = 2
    ) -> "H3SyllableSystem":
        """
        Create H3 system from a list of letters.

        Args:
            letters: List of letters to use (both consonants and vowels)
            max_consecutive: Maximum consecutive identical sounds

        Returns:
            H3SyllableSystem instance
        """
        return cls(letters=letters, max_consecutive=max_consecutive)

    @classmethod
    def suggest_for_language(
        cls, language: str = "international", precision_meters: float = 0.5
    ) -> "H3SyllableSystem":
        """
        Create H3 system with language-optimized configuration.

        Args:
            language: Target language ('international', 'english', 'spanish', 'japanese')
            precision_meters: Desired precision in meters

        Returns:
            H3SyllableSystem instance
        """
        # Select configuration based on language preference
        # Note: All are ASCII character sets, optimized for different use cases
        if language == "english":
            config_name = "ascii-jaxqt"  # Common typing letters
        elif language == "spanish":
            config_name = "ascii-fqsmnn"  # No Q
        elif language == "japanese":
            config_name = "ascii-fqwclj"  # No L (avoid L/R confusion)
        else:
            # Default to full ASCII set
            config_name = "ascii-etmhjj"
        return cls(config_name=config_name)

    def _parse_partial_address(self, partial_address: str) -> List[str]:
        """Parse partial address into syllables array."""
        if not partial_address or partial_address.strip() == "":
            raise ConversionError("Partial address cannot be empty")

        # Parse 2-character syllables from concatenated string
        clean_address = partial_address.lower().strip()
        syllables = [clean_address[i:i+2] for i in range(0, len(clean_address), 2)]
        
        if len(syllables) == 0:
            raise ConversionError("No valid syllables found in partial address")

        if len(syllables) >= self.address_length:
            raise ConversionError(f"Partial address cannot have {len(syllables)} or more syllables (max: {self.address_length - 1})")

        # Validate each syllable
        for syllable in syllables:
            if syllable not in self.syllable_to_index:
                raise ConversionError(f"Invalid syllable: {syllable}")

        return syllables

    def _calculate_address_range(self, partial_syllables: List[str]) -> Dict[str, str]:
        """Calculate the range of complete addresses for a partial address."""
        remaining_syllables = self.address_length - len(partial_syllables)
        
        if remaining_syllables <= 0:
            raise ConversionError("Partial address is already complete or too long")

        # Get min and max syllables for padding
        min_max = self._get_min_max_syllables()
        min_syllable = min_max["min_syllable"]
        max_syllable = min_max["max_syllable"]
        
        # Create min address: pad with minimum syllables
        min_syllables = partial_syllables.copy()
        for i in range(remaining_syllables):
            min_syllables.append(min_syllable)
        
        # Create max address: pad with maximum syllables
        max_syllables = partial_syllables.copy()
        for i in range(remaining_syllables):
            max_syllables.append(max_syllable)
        
        return {
            "min_address": self._format_syllable_address(min_syllables),
            "max_address": self._format_syllable_address(max_syllables)
        }

    def _get_min_max_syllables(self) -> Dict[str, str]:
        """Get the minimum and maximum syllables for the current config."""
        syllables = sorted(self.syllable_to_index.keys())
        return {
            "min_syllable": syllables[0],
            "max_syllable": syllables[-1]
        }

    def _calculate_geographic_bounds(self, min_coords: Tuple[float, float], max_coords: Tuple[float, float]) -> GeographicBounds:
        """Calculate geographic bounds from min and max coordinates."""
        min_lat, min_lon = min_coords
        max_lat, max_lon = max_coords
        
        return GeographicBounds(
            north=max(min_lat, max_lat),
            south=min(min_lat, max_lat),
            east=max(min_lon, max_lon),
            west=min(min_lon, max_lon)
        )

    def _calculate_center(self, min_coords: Tuple[float, float], max_coords: Tuple[float, float]) -> Tuple[float, float]:
        """Calculate center point from min and max coordinates."""
        min_lat, min_lon = min_coords
        max_lat, max_lon = max_coords
        
        return (
            (min_lat + max_lat) / 2,
            (min_lon + max_lon) / 2
        )

    def _calculate_area_km2(self, bounds: GeographicBounds) -> float:
        """Calculate area in square kilometers from geographic bounds."""
        lat_diff = bounds.north - bounds.south
        lon_diff = bounds.east - bounds.west
        
        # Convert to approximate distance in kilometers
        avg_lat = (bounds.north + bounds.south) / 2
        lat_km = lat_diff * 111.32  # ~111.32 km per degree latitude
        lon_km = lon_diff * 111.32 * math.cos(math.radians(avg_lat))  # Adjust for longitude at this latitude
        
        return lat_km * lon_km

    def _calculate_confidence(self, completeness_level: int) -> float:
        """Calculate confidence score based on completeness level."""
        # Higher completeness = higher confidence
        # Scale from 0.1 (1 syllable) to 0.95 (7 syllables for 8-syllable addresses)
        max_level = self.address_length - 1
        confidence = 0.1 + (completeness_level / max_level) * 0.85
        return min(0.95, max(0.1, confidence))

    def _get_suggested_refinements(self, partial_syllables: List[str]) -> List[str]:
        """Get suggested refinements (next possible syllables)."""
        if len(partial_syllables) >= self.address_length - 1:
            return []  # Already almost complete, no meaningful refinements
        
        # Return all available syllables as potential next options
        return sorted(self.syllable_to_index.keys())

    def _find_valid_address_range(self, min_address: str, max_address: str, partial_syllables: List[str]) -> Dict[str, str]:
        """Find valid address range with smart fallback when min/max addresses are invalid."""
        # First, try the exact range
        min_valid = self.is_valid_syllable_address(min_address)
        max_valid = self.is_valid_syllable_address(max_address)
        
        if min_valid and max_valid:
            # Perfect! Both addresses are valid
            return {"min_address": min_address, "max_address": max_address}
        
        # If either is invalid, try limited search (10 attempts max to avoid infinite loops)
        max_attempts = 10
        valid_min_address = min_address
        valid_max_address = max_address
        
        if not min_valid:
            attempts = 0
            while not self.is_valid_syllable_address(valid_min_address) and attempts < max_attempts:
                valid_min_address = self._increment_address(valid_min_address, partial_syllables)
                attempts += 1
        
        if not max_valid:
            attempts = 0
            while not self.is_valid_syllable_address(valid_max_address) and attempts < max_attempts:
                valid_max_address = self._decrement_address(valid_max_address, partial_syllables)
                attempts += 1
        
        # Check if we found valid addresses
        if self.is_valid_syllable_address(valid_min_address) and self.is_valid_syllable_address(valid_max_address):
            return {"min_address": valid_min_address, "max_address": valid_max_address}
        
        # If still no luck, try fallback to shorter prefix
        if len(partial_syllables) > 1:
            print(f"Warning: Address range for '{''.join(partial_syllables)}' is unmappable, falling back to shorter prefix")
            shorter_partial = partial_syllables[:-1]
            fallback_range = self._calculate_address_range(shorter_partial)
            return self._find_valid_address_range(fallback_range["min_address"], fallback_range["max_address"], shorter_partial)
        
        # Last resort: throw error with helpful message
        raise ConversionError(
            f"The partial address '{''.join(partial_syllables)}' maps to an unmappable region of the H3 address space. "
            f"This occurs when syllable combinations don't correspond to valid geographic locations. "
            f"Try a different partial address or use a shorter prefix."
        )

    def _increment_address(self, address: str, partial_syllables: List[str]) -> str:
        """Increment address intelligently from left to right with carry-over."""
        # Parse 2-character syllables from concatenated string
        clean_address = address.lower()
        syllables = [clean_address[i:i+2] for i in range(0, len(clean_address), 2)]
        all_syllables = sorted(self.syllable_to_index.keys())
        partial_length = len(partial_syllables)
        
        # Start incrementing from the first syllable after the partial prefix
        for i in range(partial_length, len(syllables)):
            current_syllable = syllables[i]
            current_index = all_syllables.index(current_syllable)
            
            if current_index < len(all_syllables) - 1:
                # Can increment this syllable
                syllables[i] = all_syllables[current_index + 1]
                # Reset all syllables after this one to min values
                for j in range(i + 1, len(syllables)):
                    syllables[j] = all_syllables[0]
                break
            else:
                # This syllable is at max, continue to next position
                syllables[i] = all_syllables[0]
        
        return self._format_syllable_address(syllables)

    def _decrement_address(self, address: str, partial_syllables: List[str]) -> str:
        """Decrement address intelligently from left to right with borrow."""
        # Parse 2-character syllables from concatenated string
        clean_address = address.lower()
        syllables = [clean_address[i:i+2] for i in range(0, len(clean_address), 2)]
        all_syllables = sorted(self.syllable_to_index.keys())
        partial_length = len(partial_syllables)
        
        # Start decrementing from the first syllable after the partial prefix
        for i in range(partial_length, len(syllables)):
            current_syllable = syllables[i]
            current_index = all_syllables.index(current_syllable)
            
            if current_index > 0:
                # Can decrement this syllable
                syllables[i] = all_syllables[current_index - 1]
                # Reset all syllables after this one to max values
                for j in range(i + 1, len(syllables)):
                    syllables[j] = all_syllables[-1]
                break
            else:
                # This syllable is at min, continue to next position
                syllables[i] = all_syllables[-1]
        
        return self._format_syllable_address(syllables)


# Convenience functions for quick usage
def coordinate_to_syllable(
    latitude: float,
    longitude: float,
    config_name: str = None,
    letters: List[str] = None,
) -> str:
    """Convert coordinates to syllable address using specified configuration."""
    system = H3SyllableSystem(config_name=config_name)
    return system.coordinate_to_syllable(latitude, longitude)


def syllable_to_coordinate(
    syllable_address: str, config_name: str = None, letters: List[str] = None
) -> Tuple[float, float]:
    """Convert syllable address to coordinates using specified configuration."""
    system = H3SyllableSystem(config_name=config_name)
    return system.syllable_to_coordinate(syllable_address)


def is_valid_syllable_address(syllable_address: str, config_name: str = None) -> bool:
    """
    Check if syllable address corresponds to a real location.

    Some syllable combinations don't map to actual H3 locations, just like
    how "999999 Main Street" might not exist in the real world.

    Args:
        syllable_address: Syllable address to validate
        config_name: Configuration to use for validation

    Returns:
        bool: True if address exists, False otherwise

    Example:
        >>> is_valid_syllable_address("je-ma-su-cu|du-ve-gu-ba")
        True
        >>> is_valid_syllable_address("ca-ce-va-po|ce-mi-to-cu")
        False
    """
    system = H3SyllableSystem(config_name)
    return system.is_valid_syllable_address(syllable_address)


def estimate_location_from_partial(partial_address: str, config_name: str = None) -> PartialLocationEstimate:
    """
    Estimate location and bounds from a partial syllable address.
    
    This function calculates the geographic area that could be represented by
    a partial syllable address by determining the minimum and maximum complete
    addresses that start with the given partial address.

    Args:
        partial_address: Partial syllable address (e.g., "bi-me" or "bi-me-mu")
        config_name: Configuration to use for estimation

    Returns:
        PartialLocationEstimate with center coordinates, bounds, confidence, and area

    Example:
        >>> estimate = estimate_location_from_partial("bi-me")
        >>> print(f"Center: {estimate.center_coordinate}")
        >>> print(f"Area: {estimate.estimated_area_km2:.1f} km²")
    """
    system = H3SyllableSystem(config_name)
    return system.estimate_location_from_partial(partial_address)


def list_available_configs() -> List[str]:
    """List all available configuration names."""
    from .config_loader import list_configs

    return list_configs()


def get_config_info(config_name: str) -> Dict:
    """Get detailed information about a configuration."""
    config = get_config(config_name)
    return {
        "name": config.name,
        "description": config.description,
        "consonants": config.consonants,
        "vowels": config.vowels,
        "total_syllables": len(config.consonants) * len(config.vowels),
        "address_length": config.address_length,
        "max_consecutive": config.max_consecutive,
        "address_space": (len(config.consonants) * len(config.vowels))
        ** config.address_length,
    }


def create_system_from_letters(
    letters: List[str], max_consecutive: int = 2
) -> "H3SyllableSystem":
    """
    Create H3 system from a list of letters.

    Args:
        letters: List of letters to use (both consonants and vowels)
        max_consecutive: Maximum consecutive identical sounds

    Returns:
        H3SyllableSystem instance
    """
    return H3SyllableSystem.from_letters(letters, max_consecutive)


def suggest_system_for_language(
    language: str = "international", precision_meters: float = 0.5
) -> "H3SyllableSystem":
    """
    Create H3 system with language-optimized configuration.

    Args:
        language: Target language ('international', 'english', 'spanish', 'japanese')
        precision_meters: Desired precision in meters

    Returns:
        H3SyllableSystem instance
    """
    return H3SyllableSystem.suggest_for_language(language, precision_meters)


def list_auto_generated_configs() -> List[str]:
    """List all auto-generated configuration names."""
    from .config_loader import list_auto_generated_configs

    return list_auto_generated_configs()


def find_configs_by_letters(letters: List[str]) -> List[str]:
    """Find configurations that use exactly these letters."""
    from .config_loader import find_configs_by_letters

    return find_configs_by_letters(letters)
