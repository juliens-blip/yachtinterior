# Gemini Yacht MCP Server

A Model Context Protocol (MCP) server that exposes Google Gemini 2.5 Flash capabilities for yacht interior design transformation. Built for the **YachtGenius** project.

## Overview

This MCP server provides AI-powered yacht interior design tools through Claude Code, enabling:

- **Architectural Analysis**: Detailed structural analysis of yacht interiors
- **Style Generation**: Transform interiors into 5 distinct design styles
- **Batch Processing**: Generate all styles at once
- **Style Catalog**: Browse available design styles

## Features

### 4 MCP Tools

1. **`analyze_structure`**
   - Analyzes yacht interior architecture using Gemini 2.5 Flash
   - Identifies key features, geometry, lighting, and spatial characteristics
   - Returns structured analysis for use in generation

2. **`generate_style`**
   - Transforms yacht interior to a specific design style
   - Preserves architectural constraints from analysis
   - Supports 5 styles: Futuristic, Art Deco, Biophilic, Mediterranean, Cyberpunk

3. **`generate_all`**
   - Complete workflow: analyze + generate all 5 styles
   - Convenience tool for comprehensive redesigns
   - Returns structure analysis + all style variations

4. **`list_styles`**
   - Lists all available design styles
   - Provides descriptions and visual characteristics
   - Helps users understand style options

### Design Styles

| Style | Description | Key Features |
|-------|-------------|--------------|
| **Futuristic** | Sleek sci-fi design with tech integration | Glossy whites, metallic surfaces, LED lighting, minimalist forms |
| **Art Deco** | 1920s glamour with geometric patterns | Exotic woods, brass accents, jewel tones, symmetrical designs |
| **Biophilic** | Nature-inspired with organic materials | Living plants, natural wood/stone, earth tones, organic shapes |
| **Mediterranean** | Coastal elegance with relaxed atmosphere | White/blue palette, terracotta, nautical elements, rustic wood |
| **Cyberpunk** | High-tech dystopian with neon accents | Dark base, neon lights, exposed tech, industrial aesthetic |

## Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

**Quick Start:**

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Add to Claude Code
claude mcp add --transport stdio gemini-yacht -- python /path/to/main.py

# 4. Verify
claude mcp list
```

## Usage

### From Claude Code

Once installed, use the tools directly in Claude Code conversations:

#### Example 1: Analyze Yacht Structure

```
Analyze this yacht interior image: [attach image or provide base64]

Use the analyze_structure tool to get detailed architectural analysis.
```

Claude Code will call:
```python
analyze_structure(
    image="data:image/jpeg;base64,...",
    options={"detail_level": "high"}
)
```

**Response:**
```json
{
  "description": "Modern luxury yacht master suite with curved walls...",
  "key_features": [
    "Curved panoramic windows spanning 180 degrees",
    "Built-in king-size bed platform with storage",
    "Recessed LED ceiling lighting",
    ...
  ],
  "geometry_notes": "Asymmetrical layout with 12-foot ceiling height...",
  "lighting_analysis": "Primary natural light from starboard windows..."
}
```

#### Example 2: Generate Single Style

```
Transform this yacht interior to Futuristic style, preserving the structure
analyzed above.
```

Claude Code will call:
```python
generate_style(
    image="data:image/jpeg;base64,...",
    structure_description="Modern luxury yacht master suite...",
    style="futuristic"
)
```

**Response:**
```json
{
  "generated_image": "[DESCRIPTION]\nThe transformed interior features...",
  "style": "futuristic",
  "description": "Sleek white surfaces with integrated LED strips..."
}
```

#### Example 3: Generate All Styles

```
Show me this yacht interior in all available styles.
```

Claude Code will call:
```python
generate_all(image="data:image/jpeg;base64,...")
```

**Response:**
```json
{
  "structure_analysis": "Modern luxury yacht master suite...",
  "styles": {
    "futuristic": {
      "generated_image": "...",
      "style": "futuristic",
      "description": "..."
    },
    "artdeco": { ... },
    "biophilic": { ... },
    "mediterranean": { ... },
    "cyberpunk": { ... }
  }
}
```

#### Example 4: List Styles

```
What design styles are available?
```

Claude Code will call:
```python
list_styles()
```

**Response:**
```json
[
  {
    "name": "futuristic",
    "display_name": "Futuristic",
    "description": "Sleek, high-tech design inspired by sci-fi...",
    "characteristics": [
      "Glossy white and metallic surfaces",
      "Integrated LED lighting systems",
      ...
    ]
  },
  ...
]
```

### Programmatic Usage (Python)

You can also import and use the handlers directly:

```python
import asyncio
from handlers.tools import analyze_yacht_structure, generate_yacht_style

async def main():
    # Analyze structure
    analysis = await analyze_yacht_structure(
        image=base64_image,
        options={"detail_level": "high"}
    )

    # Generate style
    result = await generate_yacht_style(
        image=base64_image,
        structure_description=analysis["description"],
        style="futuristic"
    )

    print(result["description"])

asyncio.run(main())
```

## Architecture

```
gemini-yacht-mcp/
├── main.py                    # FastMCP server + tool registration
├── handlers/
│   ├── __init__.py
│   └── tools.py               # Tool implementations
├── models/
│   ├── __init__.py
│   └── schemas.py             # Pydantic models
├── utils/
│   ├── __init__.py
│   ├── gemini_client.py       # Gemini API client
│   └── prompts.py             # Prompt templates
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
├── README.md                 # This file
└── INSTALL.md               # Installation guide
```

### Tech Stack

- **MCP SDK**: FastMCP 1.2.0+ (stdio transport)
- **AI Model**: Google Gemini 2.5 Flash
- **Validation**: Pydantic v2
- **Image Processing**: Pillow
- **Async**: asyncio + aiohttp

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (required) | - |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT` | API timeout in seconds | `60` |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO` |

### Claude Code Configuration

**Local Scope** (`.mcp.json` in project root):

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": ["C:\\path\\to\\main.py"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}",
        "GEMINI_MODEL": "gemini-2.5-flash",
        "GEMINI_TIMEOUT": "60"
      }
    }
  }
}
```

**User Scope** (global configuration):

Use `claude mcp add --scope user` to add the server for all projects.

## Important Notes

### Image Generation Limitation

Currently, **Gemini 2.5 Flash performs image ANALYSIS, not generation**. The `generate_style` and `generate_all` tools return detailed text descriptions of how the transformed interior should look.

**For actual image generation**, integrate one of these services:

1. **Vertex AI Imagen 3** (Google's image generation model)
2. **Stable Diffusion** via Stability AI API
3. **DALL-E 3** via OpenAI API
4. **Midjourney** via unofficial API

The architecture is designed to easily swap in an image generation backend. See `utils/gemini_client.py` line 150+ for the integration point.

### Logging Best Practices

This MCP server uses **stderr logging only** (never stdout). This is critical for stdio-based MCP servers to avoid corrupting JSON-RPC messages.

All logging uses Python's `logging` module configured to `sys.stderr`.

## Troubleshooting

### Common Issues

**1. "GEMINI_API_KEY environment variable is required"**

Solution: Ensure `.env` file exists with valid API key, or set in system environment variables.

**2. "Failed to initialize Gemini model"**

Solution: Verify API key is active at [Google AI Studio](https://aistudio.google.com/app/apikey).

**3. "Gemini API call timed out"**

Solution: Increase `GEMINI_TIMEOUT` in `.env` or reduce image resolution.

**4. Server not appearing in Claude Code**

Solution:
- Verify `.mcp.json` syntax is valid
- Restart Claude Code after configuration changes
- Check server logs in Claude Code developer tools

**5. "ModuleNotFoundError: No module named 'mcp'"**

Solution: Activate virtual environment and reinstall dependencies:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=DEBUG
```

View logs in Claude Code:
- Open Claude Code Developer Tools
- Check MCP server output tab
- Look for stderr messages from gemini-yacht

## Development

### Running Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Adding New Styles

1. Add style to `YachtStyle` enum in `models/schemas.py`
2. Add prompt template to `STYLE_GENERATION_PROMPTS` in `utils/prompts.py`
3. Add description to `STYLE_DESCRIPTIONS` in `utils/prompts.py`

### Extending Tools

Add new tools by decorating async functions with `@mcp.tool()` in `main.py`:

```python
@mcp.tool()
async def my_new_tool(param: str) -> dict:
    """Tool description for Claude."""
    # Implementation
    return {"result": "success"}
```

## Contributing

This MCP server was created for the YachtGenius project. Contributions welcome!

**Guidelines:**
- Follow existing code structure
- Add type hints to all functions
- Use Pydantic for validation
- Log to stderr only (never stdout)
- Write tests for new features

## License

MIT License - See LICENSE file for details

## Credits

- **MCP Protocol**: [Anthropic](https://modelcontextprotocol.io/)
- **Gemini API**: [Google AI](https://ai.google.dev/)
- **Project**: YachtGenius - AI-powered yacht interior redesign

## Support

- **Documentation**: See `INSTALL.md` and this README
- **Issues**: Report bugs in the project repository
- **MCP Docs**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Gemini Docs**: [ai.google.dev/docs](https://ai.google.dev/docs)

---

Built with FastMCP for the YachtGenius project.
