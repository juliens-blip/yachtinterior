"""
Tool handlers for Gemini Yacht MCP server.

Implements the four main tools:
1. analyze_yacht_structure - Analyze yacht interior architecture
2. generate_yacht_style - Generate single style transformation
3. generate_all_styles - Generate all 5 style variations
4. list_available_styles - List available design styles
"""

import logging
from typing import Dict, Any

from models.schemas import (
    YachtStyle,
    AnalyzeYachtInput,
    AnalyzeYachtOutput,
    GenerateStyleInput,
    GenerateStyleOutput,
    GenerateAllStylesInput,
    GenerateAllStylesOutput,
    StyleInfo,
)
from utils.gemini_client import get_gemini_client, GeminiClientError
from utils.prompts import (
    ANALYSIS_PROMPT,
    get_style_prompt,
    STYLE_DESCRIPTIONS,
)

logger = logging.getLogger(__name__)


async def analyze_yacht_structure(
    image: str,
    options: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    """
    Analyze yacht interior structure and architecture.

    Uses Gemini 2.5 Flash to perform detailed architectural analysis,
    identifying key features, geometry, lighting, and spatial characteristics.

    Args:
        image: Base64-encoded yacht interior image
        options: Optional analysis parameters (e.g., {"detail_level": "high"})

    Returns:
        Dictionary with structure analysis:
        - description: Full architectural description
        - key_features: List of identified features
        - geometry_notes: Spatial geometry analysis
        - lighting_analysis: Lighting condition analysis

    Raises:
        ValueError: If input validation fails
        GeminiClientError: If API call fails
    """
    try:
        # Validate input
        input_data = AnalyzeYachtInput(image=image, options=options)

        # Get Gemini client
        client = get_gemini_client()

        # Decode image
        pil_image = client.decode_base64_image(input_data.image)

        # Customize prompt if options provided
        analysis_prompt = ANALYSIS_PROMPT
        if options:
            if "focus_areas" in options:
                analysis_prompt += f"\n\nPay special attention to: {options['focus_areas']}"
            if "detail_level" in options:
                analysis_prompt += f"\n\nDetail level: {options['detail_level']}"

        # Call Gemini API
        logger.info("Starting yacht structure analysis")
        raw_analysis = await client.analyze_image(
            pil_image,
            analysis_prompt,
            options={"temperature": 0.3, "max_tokens": 4096},
        )

        # Parse the response into structured output
        # For simplicity, we'll extract sections from the text response
        output = _parse_analysis_response(raw_analysis)

        logger.info("Yacht structure analysis completed successfully")
        return output.model_dump()

    except ValueError as e:
        logger.error(f"Input validation error: {str(e)}")
        raise
    except GeminiClientError as e:
        logger.error(f"Gemini API error during analysis: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}")
        raise GeminiClientError(f"Analysis failed: {str(e)}")


async def generate_yacht_style(
    image: str,
    structure_description: str,
    style: str,
) -> Dict[str, Any]:
    """
    Generate yacht interior in specified style.

    Transforms the yacht interior to match the target design style while
    preserving architectural constraints identified in the structure analysis.

    Args:
        image: Base64-encoded yacht interior image
        structure_description: Architectural description from analysis
        style: Target style (futuristic, artdeco, biophilic, mediterranean, cyberpunk)

    Returns:
        Dictionary with generation result:
        - generated_image: Base64-encoded transformed image
        - style: Applied style name
        - description: Description of the transformation

    Raises:
        ValueError: If input validation fails
        GeminiClientError: If API call fails
    """
    try:
        # Validate input
        input_data = GenerateStyleInput(
            image=image,
            structure_description=structure_description,
            style=YachtStyle(style),
        )

        # Get Gemini client
        client = get_gemini_client()

        # Decode image
        pil_image = client.decode_base64_image(input_data.image)

        # Get style-specific prompt
        generation_prompt = get_style_prompt(
            input_data.style,
            input_data.structure_description,
        )

        # Call Gemini API for generation
        logger.info(f"Generating yacht design in {input_data.style.value} style")

        # NOTE: Current implementation uses Gemini for description
        # In production, replace with actual image generation API (Imagen 3, etc.)
        generated_description = await client.analyze_image(
            pil_image,
            generation_prompt,
            options={"temperature": 0.7, "max_tokens": 2048},
        )

        # For now, return description instead of actual image
        # In production: Call image generation API here
        output = GenerateStyleOutput(
            generated_image=f"[DESCRIPTION]\n{generated_description}",
            style=input_data.style,
            description=generated_description,
        )

        logger.info(f"Style generation for {input_data.style.value} completed")
        return output.model_dump()

    except ValueError as e:
        logger.error(f"Input validation error: {str(e)}")
        raise
    except GeminiClientError as e:
        logger.error(f"Gemini API error during generation: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during generation: {str(e)}")
        raise GeminiClientError(f"Generation failed: {str(e)}")


async def generate_all_styles(image: str) -> Dict[str, Any]:
    """
    Generate yacht interior in ALL available styles.

    Performs complete workflow:
    1. Analyzes yacht structure
    2. Generates transformations for all 5 styles

    Args:
        image: Base64-encoded yacht interior image

    Returns:
        Dictionary with:
        - structure_analysis: Initial architectural analysis
        - styles: Dict mapping style names to generated outputs

    Raises:
        ValueError: If input validation fails
        GeminiClientError: If any API call fails
    """
    try:
        # Validate input
        input_data = GenerateAllStylesInput(image=image)

        logger.info("Starting complete workflow: analyze + generate all styles")

        # Step 1: Analyze structure
        analysis_result = await analyze_yacht_structure(input_data.image)
        structure_description = analysis_result["description"]

        logger.info("Structure analysis complete, generating all styles")

        # Step 2: Generate all styles in parallel
        import asyncio

        generation_tasks = []
        for yacht_style in YachtStyle:
            task = generate_yacht_style(
                image=input_data.image,
                structure_description=structure_description,
                style=yacht_style.value,
            )
            generation_tasks.append((yacht_style.value, task))

        # Wait for all generations to complete
        styles_dict = {}
        for style_name, task in generation_tasks:
            try:
                result = await task
                styles_dict[style_name] = result
                logger.info(f"✓ Generated {style_name} style")
            except Exception as e:
                logger.error(f"✗ Failed to generate {style_name}: {str(e)}")
                # Continue with other styles even if one fails
                styles_dict[style_name] = {
                    "error": str(e),
                    "style": style_name,
                    "description": f"Generation failed: {str(e)}",
                }

        # Build output
        output = GenerateAllStylesOutput(
            structure_analysis=structure_description,
            styles=styles_dict,
        )

        logger.info(f"All styles generated ({len(styles_dict)}/{len(YachtStyle)})")
        return output.model_dump()

    except ValueError as e:
        logger.error(f"Input validation error: {str(e)}")
        raise
    except GeminiClientError as e:
        logger.error(f"Gemini API error during batch generation: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during batch generation: {str(e)}")
        raise GeminiClientError(f"Batch generation failed: {str(e)}")


async def list_available_styles() -> list[Dict[str, Any]]:
    """
    List all available yacht design styles.

    Returns:
        List of style information dictionaries, each containing:
        - name: Style enum value
        - display_name: Human-readable name
        - description: Style description
        - characteristics: List of key visual characteristics

    Raises:
        Never raises - returns static data
    """
    logger.info("Listing available yacht styles")

    styles = []
    for yacht_style in YachtStyle:
        style_info = STYLE_DESCRIPTIONS[yacht_style]
        styles.append(
            StyleInfo(
                name=yacht_style,
                display_name=style_info["display_name"],
                description=style_info["description"],
                characteristics=style_info["characteristics"],
            ).model_dump()
        )

    logger.info(f"Returning {len(styles)} available styles")
    return styles


# Helper functions


def _parse_analysis_response(raw_text: str) -> AnalyzeYachtOutput:
    """
    Parse Gemini's analysis response into structured output.

    This is a simple parser - in production, you might want to use
    more sophisticated NLP or prompt Gemini to return JSON directly.

    Args:
        raw_text: Raw text response from Gemini

    Returns:
        Structured AnalyzeYachtOutput
    """
    # Simple section extraction based on headers
    sections = {
        "description": "",
        "key_features": [],
        "geometry_notes": "",
        "lighting_analysis": "",
    }

    # Split by common section headers
    lines = raw_text.split("\n")
    current_section = "description"
    current_text = []

    for line in lines:
        line_lower = line.lower().strip()

        # Detect section headers
        if "key features" in line_lower or "notable" in line_lower:
            sections[current_section] = "\n".join(current_text).strip()
            current_section = "key_features"
            current_text = []
        elif "geometry" in line_lower or "layout" in line_lower:
            if current_section == "key_features":
                # Extract features as list
                sections["key_features"] = _extract_list_items(current_text)
            else:
                sections[current_section] = "\n".join(current_text).strip()
            current_section = "geometry_notes"
            current_text = []
        elif "lighting" in line_lower:
            sections[current_section] = "\n".join(current_text).strip()
            current_section = "lighting_analysis"
            current_text = []
        else:
            current_text.append(line)

    # Save final section
    if current_section == "key_features":
        sections["key_features"] = _extract_list_items(current_text)
    else:
        sections[current_section] = "\n".join(current_text).strip()

    # Fill in defaults if sections not found
    if not sections["description"]:
        sections["description"] = raw_text
    if not sections["key_features"]:
        sections["key_features"] = ["Analysis completed - see description"]
    if not sections["geometry_notes"]:
        sections["geometry_notes"] = "See full description for geometry details"
    if not sections["lighting_analysis"]:
        sections["lighting_analysis"] = "See full description for lighting details"

    return AnalyzeYachtOutput(**sections)


def _extract_list_items(lines: list[str]) -> list[str]:
    """Extract list items from text lines."""
    items = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Remove bullet points and numbering
        if line.startswith(("-", "*", "•", "◦")):
            line = line[1:].strip()
        elif len(line) > 2 and line[0].isdigit() and line[1] in ".):":
            line = line[2:].strip()

        if line:
            items.append(line)

    return items if items else ["No specific features extracted"]
