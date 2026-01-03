"""
Gemini API client for yacht interior operations.

Provides async interface to Google Gemini API with timeout handling,
error recovery, and image processing utilities.
"""

import os
import base64
import asyncio
import logging
from typing import Optional, Dict, Any
from io import BytesIO

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from PIL import Image

# Configure stderr logging (critical for MCP stdio servers)
logger = logging.getLogger(__name__)


class GeminiClientError(Exception):
    """Base exception for Gemini client errors."""

    pass


class GeminiClient:
    """
    Singleton client for Google Gemini API interactions.

    Handles configuration, image processing, and API calls with
    timeout and error handling.
    """

    _instance: Optional["GeminiClient"] = None

    def __new__(cls):
        """Singleton pattern implementation."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize Gemini client (only once due to singleton)."""
        if self._initialized:
            return

        # Load configuration from environment
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise GeminiClientError(
                "GEMINI_API_KEY environment variable is required"
            )

        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.timeout = int(os.getenv("GEMINI_TIMEOUT", "60"))

        # Configure the API
        genai.configure(api_key=self.api_key)

        # Initialize model
        try:
            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"Initialized Gemini model: {self.model_name}")
        except Exception as e:
            raise GeminiClientError(f"Failed to initialize Gemini model: {str(e)}")

        self._initialized = True

    @staticmethod
    def decode_base64_image(image_data: str) -> Image.Image:
        """
        Decode base64 image string to PIL Image.

        Args:
            image_data: Base64-encoded image (with or without data URL prefix)

        Returns:
            PIL Image object

        Raises:
            GeminiClientError: If decoding fails
        """
        try:
            # Remove data URL prefix if present
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]

            # Decode base64
            image_bytes = base64.b64decode(image_data)

            # Load as PIL Image
            image = Image.open(BytesIO(image_bytes))

            # Convert to RGB if necessary (handle RGBA, grayscale, etc.)
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            logger.info(
                f"Decoded image: {image.size[0]}x{image.size[1]}, mode={image.mode}"
            )
            return image

        except Exception as e:
            raise GeminiClientError(f"Failed to decode base64 image: {str(e)}")

    @staticmethod
    def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
        """
        Encode PIL Image to base64 string.

        Args:
            image: PIL Image object
            format: Image format (PNG, JPEG, etc.)

        Returns:
            Base64-encoded image string

        Raises:
            GeminiClientError: If encoding fails
        """
        try:
            buffer = BytesIO()
            image.save(buffer, format=format)
            image_bytes = buffer.getvalue()
            encoded = base64.b64encode(image_bytes).decode("utf-8")
            return encoded

        except Exception as e:
            raise GeminiClientError(f"Failed to encode image to base64: {str(e)}")

    async def analyze_image(
        self,
        image: Image.Image,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Analyze an image using Gemini with text prompt.

        Args:
            image: PIL Image to analyze
            prompt: Analysis prompt/instructions
            options: Optional generation parameters

        Returns:
            Generated text response

        Raises:
            GeminiClientError: If API call fails or times out
        """
        try:
            # Prepare generation config
            generation_config = GenerationConfig(
                temperature=options.get("temperature", 0.4) if options else 0.4,
                top_p=options.get("top_p", 0.95) if options else 0.95,
                top_k=options.get("top_k", 40) if options else 40,
                max_output_tokens=options.get("max_tokens", 8192) if options else 8192,
            )

            # Create content list
            content = [prompt, image]

            # Execute with timeout
            logger.info(f"Calling Gemini API for analysis (timeout: {self.timeout}s)")

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    content,
                    generation_config=generation_config,
                ),
                timeout=self.timeout,
            )

            # Extract text from response
            if not response or not response.text:
                raise GeminiClientError("Empty response from Gemini API")

            logger.info(f"Received analysis response ({len(response.text)} chars)")
            return response.text

        except asyncio.TimeoutError:
            raise GeminiClientError(
                f"Gemini API call timed out after {self.timeout} seconds"
            )
        except Exception as e:
            raise GeminiClientError(f"Gemini API call failed: {str(e)}")

    async def generate_image_edit(
        self,
        image: Image.Image,
        prompt: str,
        options: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate edited/transformed image using Gemini's imagen capabilities.

        NOTE: As of now, Gemini 2.5 Flash primarily does image ANALYSIS.
        For actual image GENERATION, you would need Imagen 3 or similar.
        This is a placeholder that returns a text description.

        For a production version, integrate with:
        - Vertex AI Imagen 3
        - Stable Diffusion via API
        - DALL-E via OpenAI API

        Args:
            image: Source PIL Image
            prompt: Generation/transformation prompt
            options: Optional generation parameters

        Returns:
            Base64-encoded generated image (currently returns description)

        Raises:
            GeminiClientError: If generation fails
        """
        # IMPORTANT: Gemini 2.5 Flash is multimodal for UNDERSTANDING, not generation
        # For actual image generation, you need to use:
        # 1. Vertex AI Imagen 3 (Google's image generation model)
        # 2. Or integrate with other services

        logger.warning(
            "Image generation requested but Gemini 2.5 Flash only analyzes images. "
            "Returning detailed description instead. "
            "For actual generation, integrate Vertex AI Imagen 3."
        )

        # For now, generate a detailed description
        # In production, replace this with actual image generation API
        description_prompt = f"{prompt}\n\nProvide an extremely detailed description of what this transformed image should look like."

        description = await self.analyze_image(image, description_prompt, options)

        # Return the description wrapped as a "pseudo-image"
        # In production, this would be actual base64 image data
        return f"[IMAGE_DESCRIPTION]\n{description}"


# Singleton accessor
def get_gemini_client() -> GeminiClient:
    """
    Get the singleton Gemini client instance.

    Returns:
        Initialized GeminiClient

    Raises:
        GeminiClientError: If client initialization fails
    """
    return GeminiClient()
