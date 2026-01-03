"""
Test script for Gemini Yacht MCP Server

Run this to verify your installation is working correctly.

Usage:
    python test_server.py

This will test:
1. Environment configuration
2. Gemini client initialization
3. All tool handlers
4. Error handling
"""

import asyncio
import base64
import logging
import sys
from io import BytesIO

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)


def create_test_image() -> str:
    """Create a simple test image in base64."""
    try:
        from PIL import Image

        # Create a simple 100x100 test image
        img = Image.new("RGB", (100, 100), color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_bytes = buffer.getvalue()
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        return b64
    except Exception as e:
        logger.error(f"Failed to create test image: {e}")
        raise


async def test_environment():
    """Test 1: Environment configuration"""
    logger.info("=" * 60)
    logger.info("TEST 1: Environment Configuration")
    logger.info("=" * 60)

    import os
    from dotenv import load_dotenv

    load_dotenv()

    required_vars = ["GEMINI_API_KEY"]
    optional_vars = ["GEMINI_MODEL", "GEMINI_TIMEOUT", "LOG_LEVEL"]

    all_ok = True

    for var in required_vars:
        if os.getenv(var):
            logger.info(f"✓ {var} is set")
        else:
            logger.error(f"✗ {var} is NOT set (required)")
            all_ok = False

    for var in optional_vars:
        value = os.getenv(var)
        if value:
            logger.info(f"✓ {var} = {value}")
        else:
            logger.info(f"  {var} not set (using default)")

    return all_ok


async def test_gemini_client():
    """Test 2: Gemini client initialization"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 2: Gemini Client Initialization")
    logger.info("=" * 60)

    try:
        from utils.gemini_client import get_gemini_client

        client = get_gemini_client()
        logger.info(f"✓ Gemini client initialized")
        logger.info(f"  Model: {client.model_name}")
        logger.info(f"  Timeout: {client.timeout}s")
        return True

    except Exception as e:
        logger.error(f"✗ Failed to initialize Gemini client: {e}")
        return False


async def test_list_styles():
    """Test 3: list_available_styles tool"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 3: list_available_styles")
    logger.info("=" * 60)

    try:
        from handlers.tools import list_available_styles

        styles = await list_available_styles()

        if len(styles) == 5:
            logger.info(f"✓ Retrieved {len(styles)} styles")
            for style in styles:
                logger.info(f"  - {style['display_name']}: {style['name']}")
            return True
        else:
            logger.error(f"✗ Expected 5 styles, got {len(styles)}")
            return False

    except Exception as e:
        logger.error(f"✗ list_available_styles failed: {e}")
        return False


async def test_analyze_structure():
    """Test 4: analyze_yacht_structure tool"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 4: analyze_yacht_structure")
    logger.info("=" * 60)

    try:
        from handlers.tools import analyze_yacht_structure

        # Create test image
        test_image = create_test_image()
        logger.info("  Created test image (100x100 white PNG)")

        # Call analysis
        logger.info("  Calling Gemini API... (this may take 10-30 seconds)")
        result = await analyze_yacht_structure(
            image=test_image,
            options={"detail_level": "medium"},
        )

        # Validate result
        required_fields = [
            "description",
            "key_features",
            "geometry_notes",
            "lighting_analysis",
        ]
        all_present = all(field in result for field in required_fields)

        if all_present:
            logger.info(f"✓ Analysis completed successfully")
            logger.info(f"  Description length: {len(result['description'])} chars")
            logger.info(f"  Key features found: {len(result['key_features'])}")
            return True
        else:
            missing = [f for f in required_fields if f not in result]
            logger.error(f"✗ Missing fields: {missing}")
            return False

    except Exception as e:
        logger.error(f"✗ analyze_yacht_structure failed: {e}")
        logger.exception(e)
        return False


async def test_generate_style():
    """Test 5: generate_yacht_style tool"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 5: generate_yacht_style")
    logger.info("=" * 60)

    try:
        from handlers.tools import generate_yacht_style

        # Create test image
        test_image = create_test_image()

        # Call generation
        logger.info("  Calling Gemini API... (this may take 10-30 seconds)")
        result = await generate_yacht_style(
            image=test_image,
            structure_description="Test yacht interior with white walls",
            style="futuristic",
        )

        # Validate result
        required_fields = ["generated_image", "style", "description"]
        all_present = all(field in result for field in required_fields)

        if all_present and result["style"] == "futuristic":
            logger.info(f"✓ Style generation completed successfully")
            logger.info(f"  Style: {result['style']}")
            logger.info(f"  Description length: {len(result['description'])} chars")
            return True
        else:
            logger.error(f"✗ Invalid result structure")
            return False

    except Exception as e:
        logger.error(f"✗ generate_yacht_style failed: {e}")
        logger.exception(e)
        return False


async def test_error_handling():
    """Test 6: Error handling"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 6: Error Handling")
    logger.info("=" * 60)

    try:
        from handlers.tools import generate_yacht_style

        # Test with invalid base64
        try:
            await generate_yacht_style(
                image="invalid_base64_data",
                structure_description="Test",
                style="futuristic",
            )
            logger.error("✗ Should have raised ValueError for invalid base64")
            return False
        except ValueError as e:
            logger.info(f"✓ Correctly raised ValueError: {str(e)[:50]}...")

        # Test with invalid style
        try:
            test_image = create_test_image()
            await generate_yacht_style(
                image=test_image,
                structure_description="Test",
                style="invalid_style",
            )
            logger.error("✗ Should have raised ValueError for invalid style")
            return False
        except ValueError as e:
            logger.info(f"✓ Correctly raised ValueError: {str(e)[:50]}...")

        return True

    except Exception as e:
        logger.error(f"✗ Error handling test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests and report results."""
    logger.info("\n")
    logger.info("╔" + "=" * 58 + "╗")
    logger.info("║" + " " * 10 + "GEMINI YACHT MCP SERVER - TEST SUITE" + " " * 11 + "║")
    logger.info("╚" + "=" * 58 + "╝")
    logger.info("\n")

    tests = [
        ("Environment Configuration", test_environment),
        ("Gemini Client Initialization", test_gemini_client),
        ("List Styles Tool", test_list_styles),
        ("Analyze Structure Tool", test_analyze_structure),
        ("Generate Style Tool", test_generate_style),
        ("Error Handling", test_error_handling),
    ]

    results = {}

    for name, test_func in tests:
        try:
            result = await test_func()
            results[name] = result
        except Exception as e:
            logger.error(f"\n✗ {name} crashed: {e}")
            results[name] = False

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)

    passed = sum(1 for r in results.values() if r)
    total = len(results)

    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        logger.info(f"{status} - {test_name}")

    logger.info("=" * 60)
    logger.info(f"TOTAL: {passed}/{total} tests passed")
    logger.info("=" * 60)

    if passed == total:
        logger.info("\n🎉 ALL TESTS PASSED! Server is ready to use.")
        logger.info("\nNext steps:")
        logger.info("1. Add server to Claude Code: claude mcp add ...")
        logger.info("2. Restart Claude Code")
        logger.info("3. Test with: /mcp list")
        return 0
    else:
        logger.error(
            f"\n⚠️  {total - passed} test(s) failed. Please fix issues before deployment."
        )
        return 1


def main():
    """Main entry point."""
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n\nFatal error: {e}")
        logger.exception(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
