from mcp.server.fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("hello-world")


@mcp.tool()
def add_numbers(a: int, b: int) -> dict:
    """Add two numbers together.

    Args:
        a: First number to add
        b: Second number to add

    Returns:
        Dictionary with the result and a message
    """
    result = a + b
    return {"result": result, "message": f"{a} + {b} = {result}"}


@mcp.tool()
def say_hello(name: str = "World") -> str:
    """Say hello to someone.

    Args:
        name: Name of the person to greet (defaults to "World")

    Returns:
        A greeting message
    """
    return f"Hello, {name}! This is your MCP server working!"


@mcp.tool()
def get_system_info() -> dict:
    """Get basic system information.

    Returns:
        Dictionary with system information
    """
    import platform
    import os

    return {
        "platform": platform.system(),
        "platform_release": platform.release(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "hostname": platform.node(),
        "python_version": platform.python_version(),
        "current_directory": os.getcwd(),
    }


if __name__ == "__main__":
    print("Starting Hello World MCP Server...")
    print("Available tools:")
    print("  - add_numbers: Add two numbers together")
    print("  - say_hello: Say hello to someone")
    print("  - get_system_info: Get basic system information")
    print("\nServer running...")
    mcp.run()
