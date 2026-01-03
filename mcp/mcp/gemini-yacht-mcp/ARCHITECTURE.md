# Architecture Documentation - Gemini Yacht MCP

Technical architecture and design decisions for the Gemini Yacht MCP server.

## Overview

The Gemini Yacht MCP server is a Python-based Model Context Protocol server that exposes Google Gemini 2.5 Flash capabilities for yacht interior design analysis and transformation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code Client                        │
│  - User interface                                                │
│  - MCP client implementation                                     │
│  - Tool invocation logic                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ JSON-RPC 2.0 over stdio
                         │ (Standard Input/Output)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    FastMCP Server (main.py)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Server Initialization                                    │   │
│  │ - Environment validation                                 │   │
│  │ - Logging configuration (stderr only)                    │   │
│  │ - Tool registration                                      │   │
│  │ - Error handling middleware                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │ Tool Decorators (@mcp.tool())                            │   │
│  │ - analyze_structure                                      │   │
│  │ - generate_style                                         │   │
│  │ - generate_all                                           │   │
│  │ - list_styles                                            │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                   Handler Layer (handlers/tools.py)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tool Implementation Functions                            │   │
│  │ - analyze_yacht_structure()                              │   │
│  │ - generate_yacht_style()                                 │   │
│  │ - generate_all_styles()                                  │   │
│  │ - list_available_styles()                                │   │
│  │                                                          │   │
│  │ Helper Functions                                         │   │
│  │ - _parse_analysis_response()                             │   │
│  │ - _extract_list_items()                                  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                                 │
┌────────▼─────────────┐      ┌───────────▼──────────┐
│  Validation Layer    │      │  Utility Layer       │
│  (models/schemas.py) │      │  (utils/)            │
│                      │      │                      │
│  Pydantic Models:    │      │  gemini_client.py:   │
│  - YachtStyle        │      │  - GeminiClient      │
│  - AnalyzeYachtInput │      │  - Image processing  │
│  - GenerateStyleInput│      │  - API calls         │
│  - Output schemas    │      │                      │
│                      │      │  prompts.py:         │
│  Field Validators:   │      │  - ANALYSIS_PROMPT   │
│  - Base64 validation │      │  - Style prompts     │
│  - Enum validation   │      │  - Descriptions      │
└──────────────────────┘      └───────────┬──────────┘
                                          │
                          ┌───────────────▼───────────────┐
                          │  Google Gemini API            │
                          │  (gemini-2.5-flash)           │
                          │  - Image analysis             │
                          │  - Text generation            │
                          │  - Timeout: configurable      │
                          └───────────────────────────────┘
```

## Component Details

### 1. FastMCP Server (`main.py`)

**Responsibilities:**
- Initialize MCP server with stdio transport
- Register tools with decorators
- Configure environment and logging
- Handle top-level errors
- Provide tool documentation (from docstrings)

**Key Design Decisions:**
- **Stderr logging only**: Critical for stdio-based MCP servers (stdout corrupts JSON-RPC)
- **Environment-first**: Load `.env` before any other imports
- **Graceful degradation**: Tools return error objects rather than crashing
- **Async/await**: All tools are async for non-blocking I/O

**Error Handling:**
```python
try:
    return await tool_function(*args)
except GeminiClientError as e:
    return {"error": str(e), "status": "failed"}
except Exception as e:
    return {"error": f"Internal error: {str(e)}", "status": "failed"}
```

### 2. Handler Layer (`handlers/tools.py`)

**Responsibilities:**
- Implement business logic for each tool
- Coordinate between validation, client, and prompt layers
- Parse and structure Gemini responses
- Handle API errors with retry logic

**Tool Patterns:**

```python
async def tool_handler(validated_input) -> structured_output:
    # 1. Validate input (Pydantic)
    input_data = InputSchema(**kwargs)

    # 2. Get Gemini client
    client = get_gemini_client()

    # 3. Process image
    pil_image = client.decode_base64_image(input_data.image)

    # 4. Get prompt template
    prompt = get_prompt(input_data.params)

    # 5. Call Gemini API
    response = await client.analyze_image(pil_image, prompt)

    # 6. Structure response
    output = OutputSchema(**parsed_response)

    # 7. Return as dict
    return output.model_dump()
```

**Batch Processing (`generate_all_styles`):**
- Uses `asyncio.gather()` for parallel execution
- Continues processing even if individual styles fail
- Returns partial results with error annotations

### 3. Validation Layer (`models/schemas.py`)

**Responsibilities:**
- Define data structures with Pydantic v2
- Validate all inputs before processing
- Provide type safety and IDE autocomplete
- Convert between dict/JSON and Python objects

**Schema Hierarchy:**

```
BaseModel (Pydantic)
├── YachtStyle (Enum) - 5 styles
├── Input Schemas:
│   ├── AnalyzeYachtInput
│   ├── GenerateStyleInput
│   └── GenerateAllStylesInput
├── Output Schemas:
│   ├── AnalyzeYachtOutput
│   ├── GenerateStyleOutput
│   └── GenerateAllStylesOutput
└── StyleInfo (for list_styles)
```

**Custom Validators:**
```python
@field_validator("image")
@classmethod
def validate_base64(cls, v: str) -> str:
    # Remove data URL prefix if present
    if "," in v:
        v = v.split(",", 1)[1]

    # Validate decoding
    base64.b64decode(v)
    return v
```

### 4. Gemini Client (`utils/gemini_client.py`)

**Responsibilities:**
- Singleton Gemini API client
- Image encoding/decoding
- Async API calls with timeout
- Error handling and logging

**Singleton Pattern:**
```python
class GeminiClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
```

**API Call Pattern:**
```python
async def analyze_image(self, image, prompt, options):
    response = await asyncio.wait_for(
        asyncio.to_thread(
            self.model.generate_content,
            [prompt, image],
            generation_config=config
        ),
        timeout=self.timeout
    )
    return response.text
```

**Image Processing:**
- Decode base64 → PIL Image
- Convert to RGB if needed (handle RGBA, grayscale, etc.)
- Encode PIL Image → base64

### 5. Prompt Layer (`utils/prompts.py`)

**Responsibilities:**
- Store all prompt templates
- Format prompts with variables
- Maintain style descriptions
- Provide prompt utilities

**Template Structure:**

```python
STYLE_GENERATION_PROMPTS = {
    YachtStyle.FUTURISTIC: """
        Transform this yacht interior into a FUTURISTIC design while
        preserving its exact architectural structure.

        **CRITICAL CONSTRAINTS**:
        - Maintain ALL architectural elements: {structure_description}
        - Preserve room dimensions, wall angles, ceiling height...

        **FUTURISTIC STYLE GUIDELINES**:
        - Materials: ...
        - Furniture: ...
        - Lighting: ...
        ...
    """
}
```

**Variable Injection:**
```python
def get_style_prompt(style: YachtStyle, structure: str) -> str:
    template = STYLE_GENERATION_PROMPTS[style]
    return template.format(structure_description=structure)
```

## Data Flow

### Flow 1: Analyze Structure

```
User Request
    │
    ▼
Claude Code
    │ JSON-RPC Call: analyze_structure(image="...")
    ▼
FastMCP Server
    │ Route to @mcp.tool() analyze_structure
    ▼
Handler: analyze_yacht_structure()
    │
    ├─→ Validate Input (AnalyzeYachtInput)
    ├─→ Decode Image (GeminiClient.decode_base64_image)
    ├─→ Get Prompt (ANALYSIS_PROMPT)
    ├─→ Call Gemini API (GeminiClient.analyze_image)
    ├─→ Parse Response (_parse_analysis_response)
    └─→ Structure Output (AnalyzeYachtOutput)
    │
    ▼
Return to Claude Code
    │
    ▼
Display to User
```

### Flow 2: Generate All Styles

```
User Request
    │
    ▼
Claude Code
    │ JSON-RPC Call: generate_all(image="...")
    ▼
Handler: generate_all_styles()
    │
    ├─→ Step 1: Call analyze_yacht_structure()
    │   └─→ Get structure description
    │
    └─→ Step 2: Parallel generation
        │
        ├─→ generate_yacht_style(style="futuristic")
        ├─→ generate_yacht_style(style="artdeco")
        ├─→ generate_yacht_style(style="biophilic")
        ├─→ generate_yacht_style(style="mediterranean")
        └─→ generate_yacht_style(style="cyberpunk")
        │
        │ (All run concurrently via asyncio.gather)
        │
        ▼
    Aggregate Results
    │
    ▼
Return to Claude Code
```

## Configuration Management

### Environment Variables

**Loading Order:**
1. `.env` file (via `python-dotenv`)
2. System environment variables (override `.env`)
3. `.mcp.json` env section (override all)

**Variable Expansion:**
Claude Code supports `${VAR}` expansion in `.mcp.json`:

```json
{
  "env": {
    "GEMINI_API_KEY": "${GEMINI_API_KEY}",
    "GEMINI_TIMEOUT": "${TIMEOUT:-60}"
  }
}
```

### Logging Configuration

**Levels:**
- `DEBUG`: Detailed API calls, image sizes, timing
- `INFO`: Tool invocations, major operations (default)
- `WARNING`: Fallbacks, deprecations
- `ERROR`: API failures, validation errors

**Format:**
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

**Output:** Always `sys.stderr` (never stdout)

## Error Handling Strategy

### Error Types

1. **Validation Errors** (`ValueError`)
   - Invalid base64 data
   - Unknown style enum
   - Missing required fields
   - **Action:** Return error to user with details

2. **API Errors** (`GeminiClientError`)
   - Timeout (configurable)
   - Authentication (invalid API key)
   - Rate limiting
   - **Action:** Retry once, then fail gracefully

3. **System Errors** (`Exception`)
   - Import failures
   - File I/O errors
   - Unexpected crashes
   - **Action:** Log full traceback, return generic error

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "status": "failed",
  "details": "Technical details (optional)"
}
```

### Retry Logic

Currently: No automatic retries (fail fast)

**Future Enhancement:**
```python
@retry(max_attempts=3, backoff=exponential)
async def analyze_image(...):
    # API call
```

## Performance Considerations

### Optimization Strategies

1. **Singleton Client**: One Gemini client instance for all requests
2. **Parallel Processing**: `generate_all` uses `asyncio.gather()`
3. **Timeouts**: Prevent hanging requests (configurable)
4. **Image Preprocessing**: Resize large images before API call (future)

### Bottlenecks

1. **Gemini API Latency**: ~5-15 seconds per request
2. **Image Size**: Large images increase processing time
3. **Sequential Analysis**: `generate_all` analyzes once, then parallelizes

### Scaling Recommendations

**For High Volume:**
- Implement caching layer (Redis) for repeated analyses
- Queue system (Celery) for batch processing
- Load balancer for multiple MCP instances
- Rate limiting to respect API quotas

## Security Considerations

### API Key Management

**Best Practices:**
✅ Store in `.env` file (gitignored)
✅ Use environment variable expansion in `.mcp.json`
✅ Never commit API keys to version control
✅ Rotate keys periodically

**Bad Practices:**
❌ Hardcoding in source code
❌ Committing in `.mcp.json`
❌ Sharing in documentation

### Input Validation

- **Base64 validation**: Prevent malformed data
- **Enum validation**: Only allow known styles
- **Size limits**: Prevent DoS with huge images (future)

### Output Sanitization

- No user input echoed without validation
- Structured outputs via Pydantic (prevents injection)

## Testing Strategy

### Test Coverage

1. **Unit Tests** (`test_server.py`)
   - Environment validation
   - Client initialization
   - Each tool independently
   - Error handling

2. **Integration Tests** (future)
   - Full workflow (analyze → generate)
   - Claude Code integration
   - API quota handling

3. **Manual Testing**
   - Real yacht images
   - All 5 styles
   - Edge cases (very dark, very bright, etc.)

### Test Data

**Mock Images:**
- Simple test image (100x100 white)
- Realistic yacht interior photos
- Edge cases (panorama, low light, etc.)

## Future Enhancements

### Phase 1: Core Improvements

- [ ] Actual image generation (Imagen 3 integration)
- [ ] Caching for repeated analyses
- [ ] Image size optimization (auto-resize)
- [ ] Retry logic with exponential backoff

### Phase 2: Advanced Features

- [ ] Custom style creation (user-defined styles)
- [ ] Style mixing (e.g., 50% futuristic + 50% biophilic)
- [ ] Before/after comparison tool
- [ ] Multiple room analysis (floor plan view)

### Phase 3: Enterprise Features

- [ ] Batch processing API
- [ ] Style recommendation engine (ML-based)
- [ ] Cost tracking and optimization
- [ ] Multi-language support (prompts)

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `mcp` | ≥1.2.0 | MCP SDK (FastMCP) |
| `google-generativeai` | ≥0.8.0 | Gemini API client |
| `pydantic` | ≥2.0.0 | Data validation |
| `python-dotenv` | ≥1.0.0 | Environment management |
| `Pillow` | ≥10.0.0 | Image processing |
| `aiohttp` | ≥3.9.0 | Async HTTP (future) |

### Development Dependencies

- `pytest` - Unit testing
- `pytest-asyncio` - Async test support
- `black` - Code formatting
- `mypy` - Type checking
- `ruff` - Linting

## Deployment Checklist

- [ ] Python 3.9+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with valid `GEMINI_API_KEY`
- [ ] Server tested (`python test_server.py`)
- [ ] Added to Claude Code (`.mcp.json` or CLI)
- [ ] Claude Code restarted
- [ ] Verified with `/mcp list`
- [ ] Tested with sample yacht image

---

**Version:** 1.0.0
**Last Updated:** 2025-11-28
**Author:** YachtGenius Team
**License:** MIT
