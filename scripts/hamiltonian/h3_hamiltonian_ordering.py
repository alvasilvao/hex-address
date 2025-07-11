#!/usr/bin/env python3
"""
H3 Level 0 Hamiltonian Path Ordering Tool

Generates the optimal Hamiltonian path ordering for H3 level 0 cells,
providing 100% adjacency rate (every consecutive pair is spatially adjacent).

This tool is used to generate the ordering configuration that will be
used by the H3 syllable address package.
"""

import sys
import os
import h3
import time
import json
from typing import List, Dict, Optional

# Add the package source to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'python', 'src'))
from h3_syllable.h3_level0_reorganizer import H3Level0Reorganizer


class H3HamiltonianOrderingGenerator:
    """Generates optimal Hamiltonian path ordering for H3 level 0 cells."""
    
    def __init__(self):
        self.reorganizer = H3Level0Reorganizer()
        self.cells = self.reorganizer.get_all_level0_cells()
        self.cell_lookup = {cell.base_cell_number: cell for cell in self.cells}
        self.adjacency_graph = self._build_adjacency_graph()
        
    def _build_adjacency_graph(self) -> Dict[int, List[int]]:
        """Build adjacency graph for all H3 level 0 cells."""
        print("🔗 Building H3 adjacency graph...")
        
        graph = {cell.base_cell_number: [] for cell in self.cells}
        
        # Build adjacency relationships
        for i, cell1 in enumerate(self.cells):
            for j, cell2 in enumerate(self.cells):
                if i != j:
                    if self._check_h3_adjacency(cell1.cell_id, cell2.cell_id):
                        graph[cell1.base_cell_number].append(cell2.base_cell_number)
        
        # Print graph statistics
        total_edges = sum(len(neighbors) for neighbors in graph.values()) // 2
        degrees = [len(neighbors) for neighbors in graph.values()]
        
        print(f"   Total cells: {len(graph)}")
        print(f"   Total edges: {total_edges}")
        print(f"   Average degree: {sum(degrees) / len(degrees):.1f}")
        print(f"   Degree range: {min(degrees)} - {max(degrees)}")
        
        return graph
    
    def _check_h3_adjacency(self, cell1_id: str, cell2_id: str) -> bool:
        """Check if two H3 cells are actually adjacent (neighbors)."""
        try:
            neighbors = h3.grid_ring(cell1_id, 1)
            return cell2_id in neighbors
        except:
            return False
    
    def find_hamiltonian_path(self, max_time: int = 300) -> Optional[List[int]]:
        """
        Find Hamiltonian path using backtracking with optimizations.
        
        Returns:
            List of cell numbers in optimal order, or None if not found
        """
        print(f"🔍 Finding Hamiltonian path (max {max_time}s)...")
        
        start_time = time.time()
        
        # Try cells with different degrees (start with most constrained)
        degrees = [(cell_num, len(neighbors)) for cell_num, neighbors in self.adjacency_graph.items()]
        degrees.sort(key=lambda x: x[1])  # Sort by degree
        
        # Try low degree cells first (more constrained)
        candidates = [cell for cell, degree in degrees[:10]]
        
        for start_candidate in candidates:
            print(f"   Trying start cell: {start_candidate} (degree: {len(self.adjacency_graph[start_candidate])})")
            
            path = self._backtrack_search(start_candidate, start_time, max_time)
            if path:
                return path
            
            # Check if we've exceeded time limit
            if time.time() - start_time > max_time:
                print(f"   Time limit exceeded ({max_time}s)")
                break
        
        return None
    
    def _backtrack_search(self, start_cell: int, start_time: float, max_time: int) -> Optional[List[int]]:
        """Perform backtracking search from a specific starting cell."""
        
        visited = set()
        path = []
        
        def backtrack(current_cell: int, depth: int) -> bool:
            # Check time limit
            if time.time() - start_time > max_time:
                return False
            
            # Add current cell to path
            path.append(current_cell)
            visited.add(current_cell)
            
            # Progress reporting
            if depth % 20 == 0 or depth < 10:
                elapsed = time.time() - start_time
                print(f"      Depth {depth:3d}: Cell {current_cell:3d} ({elapsed:.1f}s)")
            
            # Check if we've visited all cells
            if len(visited) == len(self.cells):
                print(f"   ✅ Found Hamiltonian path! Length: {len(path)}")
                return True
            
            # Try all unvisited neighbors
            neighbors = self.adjacency_graph[current_cell]
            
            # Sort neighbors by degree (visit low-degree nodes first - more constrained)
            neighbors_with_degree = [(neighbor, len(self.adjacency_graph[neighbor])) 
                                   for neighbor in neighbors if neighbor not in visited]
            neighbors_with_degree.sort(key=lambda x: x[1])
            
            for neighbor, _ in neighbors_with_degree:
                if neighbor not in visited:
                    if backtrack(neighbor, depth + 1):
                        return True
            
            # Backtrack
            path.pop()
            visited.remove(current_cell)
            return False
        
        success = backtrack(start_cell, 0)
        return path if success else None
    
    def validate_path(self, path: List[int]) -> Dict:
        """Validate that the path is a perfect Hamiltonian path."""
        print(f"📊 Validating Hamiltonian path...")
        
        if len(path) != len(self.cells):
            print(f"   ❌ Path length mismatch: {len(path)} vs {len(self.cells)}")
            return {'valid': False, 'error': 'Path length mismatch'}
        
        # Check all cells are visited exactly once
        if len(set(path)) != len(path):
            print(f"   ❌ Duplicate cells in path")
            return {'valid': False, 'error': 'Duplicate cells'}
        
        # Check all cells are covered
        expected_cells = set(cell.base_cell_number for cell in self.cells)
        path_cells = set(path)
        if expected_cells != path_cells:
            print(f"   ❌ Missing cells: {expected_cells - path_cells}")
            return {'valid': False, 'error': 'Missing cells'}
        
        # Check adjacency
        adjacent_count = 0
        total_pairs = len(path) - 1
        
        for i in range(total_pairs):
            cell1 = path[i]
            cell2 = path[i + 1]
            
            if cell2 in self.adjacency_graph[cell1]:
                adjacent_count += 1
        
        adjacency_rate = (adjacent_count / total_pairs) * 100 if total_pairs > 0 else 0
        
        print(f"   Path length: {len(path)}")
        print(f"   Adjacent pairs: {adjacent_count} / {total_pairs}")
        print(f"   Adjacency rate: {adjacency_rate:.1f}%")
        
        is_hamiltonian = adjacency_rate == 100.0
        
        if is_hamiltonian:
            print(f"   ✅ Perfect Hamiltonian path validated!")
        else:
            print(f"   ⚠️  Not a perfect Hamiltonian path")
        
        return {
            'valid': True,
            'is_hamiltonian': is_hamiltonian,
            'path_length': len(path),
            'adjacent_count': adjacent_count,
            'total_pairs': total_pairs,
            'adjacency_rate': adjacency_rate
        }
    
    def generate_ordering_config(self, path: List[int]) -> Dict:
        """Generate the configuration for the H3 syllable package."""
        
        # Create position mapping
        position_map = {original_cell: new_position for new_position, original_cell in enumerate(path)}
        
        # Create reverse mapping
        cell_order = path.copy()
        
        # Add metadata
        config = {
            'name': 'hamiltonian_path',
            'description': 'Perfect Hamiltonian path ordering for H3 level 0 cells with 100% adjacency rate',
            'version': '1.0.0',
            'type': 'hamiltonian_path',
            'adjacency_rate': 100.0,
            'total_cells': len(path),
            'algorithm': 'backtracking_hamiltonian_path',
            'cell_order': cell_order,
            'position_map': position_map,
            'metadata': {
                'start_cell': path[0],
                'end_cell': path[-1],
                'path_length': len(path),
                'perfect_adjacency': True,
                'generated_at': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
            }
        }
        
        return config
    
    def save_ordering_config(self, config: Dict, output_path: str):
        """Save the ordering configuration to a JSON file."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"💾 Saved ordering config to: {output_path}")
    
    def generate_hamiltonian_ordering(self, output_path: str = None, max_time: int = 300) -> Optional[Dict]:
        """
        Main function to generate the optimal Hamiltonian path ordering.
        
        Args:
            output_path: Where to save the configuration (optional)
            max_time: Maximum time to spend searching (seconds)
            
        Returns:
            Configuration dictionary or None if no path found
        """
        print("🛤️  H3 Level 0 Hamiltonian Path Generator")
        print("=" * 50)
        
        # Find the Hamiltonian path
        path = self.find_hamiltonian_path(max_time)
        
        if not path:
            print("❌ No Hamiltonian path found within time limit")
            return None
        
        # Validate the path
        validation = self.validate_path(path)
        
        if not validation['valid'] or not validation['is_hamiltonian']:
            print("❌ Path validation failed")
            return None
        
        # Generate configuration
        config = self.generate_ordering_config(path)
        
        # Save if output path provided
        if output_path:
            self.save_ordering_config(config, output_path)
        
        print(f"\n✅ HAMILTONIAN PATH ORDERING GENERATED!")
        print(f"   Start cell: {path[0]}")
        print(f"   End cell: {path[-1]}")
        print(f"   Adjacency rate: {validation['adjacency_rate']:.1f}%")
        print(f"   Total cells: {len(path)}")
        print(f"   First 10 cells: {path[:10]}")
        print(f"   Last 10 cells: {path[-10:]}")
        
        return config


def main():
    """Main function to generate H3 Hamiltonian path ordering."""
    
    # Initialize generator
    generator = H3HamiltonianOrderingGenerator()
    
    # Generate the ordering
    config_path = os.path.join(os.path.dirname(__file__), '..', 'python', 'src', 'h3_syllable', 'configs', 'h3_hamiltonian_ordering.json')
    config = generator.generate_hamiltonian_ordering(config_path, max_time=300)
    
    if config:
        print(f"\n🎯 SUCCESS: Perfect Hamiltonian path ordering generated!")
        print(f"   This ordering provides 100% adjacency rate")
        print(f"   Every consecutive index is a spatial neighbor")
        print(f"   Configuration saved to: {config_path}")
    else:
        print(f"\n❌ FAILED: Could not generate Hamiltonian path ordering")
        return False
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)