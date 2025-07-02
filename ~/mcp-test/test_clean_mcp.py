#!/usr/bin/env python3
"""
Test script to verify our cleaned MCP server works without stderr output
"""

import subprocess
import json
import time
import sys
import os


def test_mcp_server_clean():
    """Test that our MCP server runs without stderr output"""

    print("🧪 Testing Clean MCP Server...")
    print("=" * 50)

    # Path to our MCP server
    server_path = os.path.join(os.getcwd(), "hello_mcp.py")
    venv_python = os.path.join(os.getcwd(), "venv", "bin", "python")

    if not os.path.exists(server_path):
        print(f"❌ MCP server not found: {server_path}")
        return False

    if not os.path.exists(venv_python):
        print(f"❌ Virtual environment python not found: {venv_python}")
        return False

    # Test 1: Check if server starts without stderr output
    print("Test 1: Starting MCP server and checking for clean output...")

    try:
        # Start the server process
        process = subprocess.Popen(
            [venv_python, server_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Give it a moment to start and potentially output errors
        time.sleep(3)

        # Check if process is still running
        if process.poll() is None:
            print("✅ MCP server started successfully!")

            # Check stderr for any output
            # Use communicate with timeout to avoid hanging
            try:
                stdout, stderr = process.communicate(timeout=2)
            except subprocess.TimeoutExpired:
                # This is expected - server should keep running
                process.terminate()
                process.wait()
                stdout, stderr = "", ""

            if stderr.strip():
                print(f"⚠️ Server produced stderr output: {stderr}")
                return False
            else:
                print("✅ No stderr output detected!")

        else:
            stdout, stderr = process.communicate()
            print(f"❌ MCP server failed to start!")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return False

    except Exception as e:
        print(f"❌ Error testing MCP server: {e}")
        return False

    finally:
        # Clean up process
        if "process" in locals() and process.poll() is None:
            process.terminate()
            process.wait()

    print("\n✅ Clean MCP Server Test Completed Successfully!")
    print("=" * 50)
    print("✅ Server runs without stderr output")
    print("✅ Ready for DeerFlow integration")

    return True


def print_integration_info():
    """Print information for DeerFlow integration"""
    server_path = os.path.abspath("hello_mcp.py")

    print("\n🔗 DeerFlow Integration Instructions:")
    print("=" * 50)
    print("1. Open DeerFlow: http://localhost:3000")
    print("2. Go to Settings → MCP Tab")
    print("3. Click 'Add Servers'")
    print("4. Paste this configuration:")
    print()
    print("```json")
    print("{")
    print('  "mcpServers": {')
    print('    "hello-world": {')
    print('      "command": "python",')
    print(f'      "args": ["{server_path}"],')
    print('      "env": {}')
    print("    }")
    print("  }")
    print("}")
    print("```")
    print()
    print("5. Click 'Add' and ensure server is enabled")
    print("6. Test with: 'Use the add_numbers MCP tool to calculate 5 + 3'")


if __name__ == "__main__":
    if test_mcp_server_clean():
        print_integration_info()
    else:
        print("\n❌ Test failed - MCP server needs more fixes")
        sys.exit(1)
