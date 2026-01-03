"""
Pydantic schemas for Gemini Yacht MCP server.

Defines input/output models for all tools with strict validation.
"""

from enum import Enum
from typing import Optional, Dict
from pydantic import BaseModel, Field, field_validator
import base64


class YachtStyle(str, Enum):
    """Available yacht interior design styles."""

    FUTURISTIC = "futuristic"
    ARTDECO = "artdeco"
    BIOPHILIC = "biophilic"
    MEDITERRANEAN = "mediterranean"
    CYBERPUNK = "cyberpunk"


class AnalyzeYachtInput(BaseModel):
    """Input schema for yacht structure analysis."""

    image: str = Field(
        ...,
        description="Base64-encoded image of yacht interior"
    )
    options: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional analysis parameters (e.g., focus_areas, detail_level)"
    )

    @field_validator("image")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        """Validate that image is valid base64."""
        try:
            # Remove data URL prefix if present
            if "," in v:
                v = v.split(",", 1)[1]
            base64.b64decode(v)
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {str(e)}")


class AnalyzeYachtOutput(BaseModel):
    """Output schema for yacht structure analysis."""

    description: str = Field(
        ...,
        description="Detailed architectural description of the yacht interior"
    )
    key_features: list[str] = Field(
        ...,
        description="List of identified key architectural features"
    )
    geometry_notes: str = Field(
        ...,
        description="Notes about spatial geometry and layout"
    )
    lighting_analysis: str = Field(
        ...,
        description="Analysis of lighting conditions and sources"
    )


class GenerateStyleInput(BaseModel):
    """Input schema for style generation."""

    image: str = Field(
        ...,
        description="Base64-encoded image of yacht interior"
    )
    structure_description: str = Field(
        ...,
        description="Structural description from analysis phase"
    )
    style: YachtStyle = Field(
        ...,
        description="Target design style"
    )

    @field_validator("image")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        """Validate that image is valid base64."""
        try:
            if "," in v:
                v = v.split(",", 1)[1]
            base64.b64decode(v)
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {str(e)}")


class GenerateStyleOutput(BaseModel):
    """Output schema for style generation."""

    generated_image: str = Field(
        ...,
        description="Base64-encoded generated image"
    )
    style: YachtStyle = Field(
        ...,
        description="Applied design style"
    )
    description: str = Field(
        ...,
        description="Description of the generated design"
    )


class GenerateAllStylesInput(BaseModel):
    """Input schema for generating all styles at once."""

    image: str = Field(
        ...,
        description="Base64-encoded image of yacht interior"
    )

    @field_validator("image")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        """Validate that image is valid base64."""
        try:
            if "," in v:
                v = v.split(",", 1)[1]
            base64.b64decode(v)
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 image data: {str(e)}")


class GenerateAllStylesOutput(BaseModel):
    """Output schema for all styles generation."""

    structure_analysis: str = Field(
        ...,
        description="Initial structural analysis"
    )
    styles: Dict[str, GenerateStyleOutput] = Field(
        ...,
        description="Generated images for each style (keyed by style name)"
    )


class StyleInfo(BaseModel):
    """Information about a yacht design style."""

    name: YachtStyle = Field(
        ...,
        description="Style identifier"
    )
    display_name: str = Field(
        ...,
        description="Human-readable style name"
    )
    description: str = Field(
        ...,
        description="Detailed description of the style"
    )
    characteristics: list[str] = Field(
        ...,
        description="Key visual characteristics of the style"
    )
