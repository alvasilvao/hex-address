#!/usr/bin/env python3
"""
H3 Syllable System - Build Script

Builds both Python and JavaScript packages with shared configurations.
"""

import sys
import subprocess
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {cmd}")
        print(f"Error: {e.stderr}")
        return False

def build_python():
    """Build Python package."""
    print("🐍 Building Python package...")
    
    python_dir = Path(__file__).parent / "packages" / "python"
    
    # Run the Python build script
    if not run_command("python scripts/build.py", cwd=python_dir):
        return False
    
    print("✅ Python package built successfully!")
    return True

def build_javascript():
    """Build JavaScript package."""
    print("🟨 Building JavaScript package...")
    
    js_dir = Path(__file__).parent / "packages" / "javascript"
    
    # Install dependencies
    if not run_command("npm install", cwd=js_dir):
        return False
    
    # Build package (this will also export configs)
    if not run_command("npm run build", cwd=js_dir):
        return False
    
    print("✅ JavaScript package built successfully!")
    return True

def main():
    """Main build function."""
    print("🚀 Building H3 Syllable System packages...")
    
    # Build both packages
    python_success = build_python()
    js_success = build_javascript()
    
    if python_success and js_success:
        print("🎉 All packages built successfully!")
        print("\n📦 Package locations:")
        print("  Python: packages/python/dist/")
        print("  JavaScript: packages/javascript/dist/")
    else:
        print("❌ Some packages failed to build")
        sys.exit(1)

if __name__ == "__main__":
    main()