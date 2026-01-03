"""
Utilities module for Gemini Yacht MCP server.

This module contains helper functions and the Gemini API client.
"""

from .gemini_client import GeminiClient, get_gemini_client
from .prompts import ANALYSIS_PROMPT, STYLE_GENERATION_PROMPTS, STYLE_DESCRIPTIONS

__all__ = [
    "GeminiClient",
    "get_gemini_client",
    "ANALYSIS_PROMPT",
    "STYLE_GENERATION_PROMPTS",
    "STYLE_DESCRIPTIONS",
]
