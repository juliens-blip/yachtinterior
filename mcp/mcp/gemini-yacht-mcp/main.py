"""
Gemini Yacht MCP Server - Main Entry Point

A Model Context Protocol server providing Gemini-powered yacht interior
design tools for the YachtGenius application.

Exposes 4 tools:
- analyze_yacht_structure: Architectural analysis
- generate_yacht_style: Single style transformation
- generate_all_styles: All 5 style variations
- list_available_styles: Available styles information

Usage:
    python main.py

Environment Variables:
    GEMINI_API_KEY: Google Gemini API key (required)
    GEMINI_MODEL: Model name (default: gemini-2.5-flash)
    GEMINI_TIMEOUT: API timeout in seconds (default: 60)
    LOG_LEVEL: Logging level (default: INFO)
"""

import os
import sys
import logging
from typing import Any

# Load environment variables FIRST
from dotenv import load_dotenv

load_dotenv()

# Configure logging to stderr (CRITICAL for stdio MCP servers)
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr,  # NEVER use stdout in MCP servers
)
logger = logging.getLogger(__name__)

# Import FastMCP
try:
    from mcp.server.fastmcp import FastMCP
except ImportError as e:
    logger.error(
        "Failed to import MCP SDK. Install with: pip install mcp>=1.2.0"
    )
    sys.exit(1)

# Import tool handlers
from handlers.tools import (
    analyze_yacht_structure,
    generate_yacht_style,
    generate_all_styles,
    list_available_styles,
)
from utils.gemini_client import GeminiClientError

# Initialize FastMCP server
mcp = FastMCP("gemini-yacht-mcp")

logger.info("Initializing Gemini Yacht MCP Server")


# Tool 1: Analyze Yacht Structure
@mcp.tool()
async def analyze_structure(
    image: str,
    options: dict[str, str] | None = None,
) -> dict[str, Any]:
    """
    Analyze yacht interior structure and architecture using Gemini 2.5 Flash.

    Performs detailed architectural analysis identifying key features, geometry,
    lighting, and spatial characteristics. This analysis should be used to guide
    subsequent style generation while preserving structural integrity.

    Args:
        image: Base64-encoded yacht interior image (with or without data URL prefix)
        options: Optional analysis parameters:
            - focus_areas: Specific areas to emphasize (e.g., "lighting, materials")
            - detail_level: Analysis depth ("high", "medium", "low")

    Returns:
        Dictionary containing:
        - description: Full architectural description
        - key_features: List of identified features
        - geometry_notes: Spatial geometry and layout analysis
        - lighting_analysis: Lighting conditions and sources

    Example:
        result = await analyze_structure(
            image="data:image/jpeg;base64,/9j/4AAQ...",
            options={"detail_level": "high", "focus_areas": "lighting"}
        )
    """
    try:
        return await analyze_yacht_structure(image, options)
    except GeminiClientError as e:
        logger.error(f"Tool error - analyze_structure: {str(e)}")
        return {"error": str(e), "status": "failed"}
    except Exception as e:
        logger.error(f"Unexpected error - analyze_structure: {str(e)}")
        return {"error": f"Internal error: {str(e)}", "status": "failed"}


# Tool 2: Generate Yacht Style
@mcp.tool()
async def generate_style(
    image: str,
    structure_description: str,
    style: str,
) -> dict[str, Any]:
    """
    Generate yacht interior transformation in a specific design style.

    Transforms the yacht interior to match the target style while preserving
    architectural constraints. Requires prior structural analysis for best results.

    Args:
        image: Base64-encoded yacht interior image
        structure_description: Architectural description from analyze_structure
        style: Target style - one of:
            - "futuristic": Sleek sci-fi with tech integration
            - "artdeco": 1920s glamour with geometric patterns
            - "biophilic": Nature-inspired with plants and organic materials
            - "mediterranean": Coastal elegance with white/blue palette
            - "cyberpunk": High-tech dystopian with neon accents

    Returns:
        Dictionary containing:
        - generated_image: Base64-encoded transformed image (or description)
        - style: Applied style name
        - description: Detailed description of the transformation

    Example:
        result = await generate_style(
            image="data:image/jpeg;base64,/9j/4AAQ...",
            structure_description="Modern luxury yacht interior with...",
            style="futuristic"
        )
    """
    try:
        return await generate_yacht_style(image, structure_description, style)
    except GeminiClientError as e:
        logger.error(f"Tool error - generate_style: {str(e)}")
        return {"error": str(e), "status": "failed"}
    except Exception as e:
        logger.error(f"Unexpected error - generate_style: {str(e)}")
        return {"error": f"Internal error: {str(e)}", "status": "failed"}


# Tool 3: Generate All Styles
@mcp.tool()
async def generate_all(image: str) -> dict[str, Any]:
    """
    Generate yacht interior transformations in ALL available styles.

    Complete workflow that:
    1. Analyzes yacht structure automatically
    2. Generates transformations for all 5 design styles
    3. Returns comprehensive results with structure analysis

    This is a convenience tool that combines analyze_structure and generate_style
    for all available styles in one call.

    Args:
        image: Base64-encoded yacht interior image

    Returns:
        Dictionary containing:
        - structure_analysis: Initial architectural analysis text
        - styles: Dictionary mapping style names to generation results:
            - futuristic: {...}
            - artdeco: {...}
            - biophilic: {...}
            - mediterranean: {...}
            - cyberpunk: {...}

    Example:
        result = await generate_all(
            image="data:image/jpeg;base64,/9j/4AAQ..."
        )
        print(result["styles"]["futuristic"]["description"])
    """
    try:
        return await generate_all_styles(image)
    except GeminiClientError as e:
        logger.error(f"Tool error - generate_all: {str(e)}")
        return {"error": str(e), "status": "failed"}
    except Exception as e:
        logger.error(f"Unexpected error - generate_all: {str(e)}")
        return {"error": f"Internal error: {str(e)}", "status": "failed"}


# Tool 4: List Available Styles
@mcp.tool()
async def list_styles() -> list[dict[str, Any]]:
    """
    List all available yacht interior design styles with descriptions.

    Returns information about each style including its characteristics,
    typical materials, colors, and design elements.

    Args:
        None

    Returns:
        List of style information dictionaries, each containing:
        - name: Style identifier (e.g., "futuristic")
        - display_name: Human-readable name (e.g., "Futuristic")
        - description: Detailed style description
        - characteristics: List of key visual characteristics

    Example:
        styles = await list_styles()
        for style in styles:
            print(f"{style['display_name']}: {style['description']}")
    """
    try:
        return await list_available_styles()
    except Exception as e:
        logger.error(f"Unexpected error - list_styles: {str(e)}")
        return [{"error": f"Failed to list styles: {str(e)}"}]


# Server initialization and error handling
def validate_environment():
    """
    Validate required environment variables before starting server.

    Raises:
        SystemExit: If required variables are missing
    """
    required = ["GEMINI_API_KEY"]
    missing = [var for var in required if not os.getenv(var)]

    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please set them in .env file or environment")
        sys.exit(1)

    logger.info("Environment validation passed")
    logger.info(f"Using model: {os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')}")
    logger.info(f"API timeout: {os.getenv('GEMINI_TIMEOUT', '60')}s")


def main():
    """
    Main entry point for the MCP server.

    Validates environment, initializes Gemini client, and starts the server.
    """
    try:
        logger.info("=" * 60)
        logger.info("Gemini Yacht MCP Server Starting")
        logger.info("=" * 60)

        # Validate environment
        validate_environment()

        # Initialize Gemini client (will raise if API key invalid)
        from utils.gemini_client import get_gemini_client

        client = get_gemini_client()
        logger.info("Gemini client initialized successfully")

        # Log registered tools
        logger.info("Registered tools:")
        logger.info("  - analyze_structure: Analyze yacht interior architecture")
        logger.info("  - generate_style: Generate single style transformation")
        logger.info("  - generate_all: Generate all 5 style variations")
        logger.info("  - list_styles: List available design styles")

        # Start MCP server (stdio transport)
        logger.info("Starting MCP server on stdio transport")
        logger.info("=" * 60)

        mcp.run(transport="stdio")

    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error during server startup: {str(e)}")
        logger.exception(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
