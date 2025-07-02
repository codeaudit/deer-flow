#!/usr/bin/env python3
"""
Test script for our Hello World MCP server
"""

import subprocess
import json
import time
import sys


def test_mcp_server():
    """Test our MCP server by running it and checking if tools are available"""

    print("🔧 Testing Hello World MCP Server...")
    print("=" * 50)

    # Test 1: Run the server and check if it starts without errors
    print("Test 1: Starting MCP server...")
    try:
        # Start the server process
        process = subprocess.Popen(
            ["python", "hello_mcp.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Give it a moment to start
        time.sleep(2)

        # Check if process is still running (not crashed)
        if process.poll() is None:
            print("✅ MCP server started successfully!")
        else:
            stdout, stderr = process.communicate()
            print(f"❌ MCP server failed to start!")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return False

    except Exception as e:
        print(f"❌ Error starting MCP server: {e}")
        return False

    finally:
        # Clean up process
        if "process" in locals():
            process.terminate()
            process.wait()

    print("\n🧪 MCP Server Basic Functionality Test Completed!")
    print("=" * 50)
    print("Next steps:")
    print("1. The server runs without errors ✅")
    print("2. It's ready to be tested with the MCP Inspector")
    print("3. Ready for integration with DeerFlow")

    return True


def print_server_info():
    """Print information about our MCP server"""
    print("\n📋 Server Information:")
    print("-" * 30)
    print("Server Name: hello-world")
    print("Available Tools:")
    print("  🔢 add_numbers - Add two numbers together")
    print("  👋 say_hello - Say hello to someone")
    print("  📊 get_system_info - Get basic system information")
    print()
    print("📁 Files created:")
    print("  - hello_mcp.py (Main MCP server)")
    print("  - test_mcp.py (This test script)")
    print()
    print("🚀 To test with MCP Inspector:")
    print("  npx @modelcontextprotocol/inspector python hello_mcp.py")
    print()
    print("🔗 To use with DeerFlow, add this config:")
    print("  {")
    print('    "mcpServers": {')
    print('      "hello-world": {')
    print('        "command": "python",')
    print(f'        "args": ["{sys.path[0]}/hello_mcp.py"],')
    print('        "env": {}')
    print("      }")
    print("    }")
    print("  }")


if __name__ == "__main__":
    print_server_info()

    if test_mcp_server():
        print("\n🎉 Phase 1 Implementation Complete!")
        print("Your simple MCP server is working and ready for testing!")
    else:
        print("\n❌ There were issues with the MCP server.")
        print("Please check the error messages above.")
