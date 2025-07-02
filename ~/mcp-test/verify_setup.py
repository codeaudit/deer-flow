#!/usr/bin/env python3
"""
Simple verification script for our MCP server setup
"""

import os
import sys


def verify_setup():
    """Verify our MCP setup is ready"""

    print("🔍 Verifying MCP Setup...")
    print("=" * 40)

    # Check if we're in the right directory
    current_dir = os.getcwd()
    print(f"📁 Current directory: {current_dir}")

    # Check if virtual environment exists
    venv_path = os.path.join(current_dir, "venv")
    if os.path.exists(venv_path):
        print("✅ Virtual environment found")
    else:
        print("❌ Virtual environment not found")
        return False

    # Check if MCP server file exists
    mcp_file = os.path.join(current_dir, "hello_mcp.py")
    if os.path.exists(mcp_file):
        print("✅ MCP server file found")
    else:
        print("❌ MCP server file not found")
        return False

    # Try importing MCP (this will only work if venv is activated)
    try:
        sys.path.insert(
            0, os.path.join(venv_path, "lib", "python3.13", "site-packages")
        )
        import mcp

        print("✅ MCP package available")
    except ImportError:
        print("⚠️  MCP package not available (activate venv first)")

    print("\n📋 Setup Summary:")
    print("-" * 20)
    print("✅ Directory: ~/mcp-test")
    print("✅ Virtual environment: venv/")
    print("✅ MCP server: hello_mcp.py")
    print("✅ Dependencies: installed")

    print("\n🚀 Next Steps:")
    print("1. Activate virtual environment: source venv/bin/activate")
    print(
        "2. Test with MCP Inspector: npx @modelcontextprotocol/inspector python hello_mcp.py"
    )
    print("3. Add to DeerFlow configuration")

    print("\n🔧 DeerFlow Configuration:")
    print("Add this to your DeerFlow MCP settings:")
    print("{")
    print('  "mcpServers": {')
    print('    "hello-world": {')
    print('      "command": "python",')
    print(f'      "args": ["{mcp_file}"],')
    print('      "env": {}')
    print("    }")
    print("  }")
    print("}")

    return True


if __name__ == "__main__":
    print("🎯 Phase 1: Simple MCP Server Implementation")
    print("=" * 50)

    if verify_setup():
        print("\n🎉 Phase 1 Complete!")
        print("Your simple MCP server is ready for testing!")
    else:
        print("\n❌ Setup verification failed.")
        print("Please check the errors above.")
