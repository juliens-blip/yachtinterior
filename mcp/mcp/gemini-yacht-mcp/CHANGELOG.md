# Changelog

All notable changes to the Gemini Yacht MCP server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-28

### Added

#### Core Features
- **FastMCP Server**: Complete MCP server implementation with stdio transport
- **4 Tools**: analyze_structure, generate_style, generate_all, list_styles
- **5 Design Styles**: Futuristic, Art Deco, Biophilic, Mediterranean, Cyberpunk
- **Gemini Integration**: Google Gemini 2.5 Flash for image analysis

#### Architecture
- Pydantic v2 validation for all inputs/outputs
- Singleton Gemini client with connection pooling
- Async/await for non-blocking I/O
- Comprehensive error handling with graceful degradation
- Stderr-only logging (MCP stdio compliance)

#### Documentation
- Complete README.md with usage examples
- Detailed INSTALL.md with step-by-step instructions
- QUICKSTART.md for 5-minute setup
- EXAMPLES.md with realistic scenarios
- ARCHITECTURE.md with technical details
- Claude Code configuration (claude_config.json)

#### Testing
- test_server.py with 6 comprehensive tests
- Environment validation
- All tool handlers tested
- Error handling verification

#### Configuration
- .env.example with all environment variables
- Configurable timeout, model, and logging
- Claude Code .mcp.json template
- .gitignore for security

### Technical Details

#### Dependencies
- mcp>=1.2.0 (FastMCP framework)
- google-generativeai>=0.8.0 (Gemini API)
- pydantic>=2.0.0 (validation)
- python-dotenv>=1.0.0 (environment)
- Pillow>=10.0.0 (image processing)
- aiohttp>=3.9.0 (async HTTP)

#### Supported Platforms
- Windows (tested on Windows 11)
- macOS (compatible)
- Linux (compatible)

#### Python Versions
- Python 3.9+
- Python 3.10 (recommended)
- Python 3.11 (tested)
- Python 3.12 (compatible)

### Known Limitations

- **Image Generation**: Currently returns text descriptions instead of actual images
  - Gemini 2.5 Flash is for analysis, not generation
  - Future: Integration with Vertex AI Imagen 3 planned
- **Timeout**: Large images may timeout (default 60s, configurable)
- **Rate Limits**: Subject to Google Gemini API quotas
- **Concurrent Requests**: No request queuing (processes serially)

### Security

- API keys stored in .env (gitignored)
- Environment variable expansion in .mcp.json
- Input validation with Pydantic
- No hardcoded credentials

## [Unreleased]

### Planned Features

#### v1.1.0 (Next Minor Release)
- [ ] Actual image generation via Vertex AI Imagen 3
- [ ] Image size optimization (auto-resize)
- [ ] Caching layer for repeated analyses
- [ ] Retry logic with exponential backoff

#### v1.2.0
- [ ] Custom style creation (user-defined)
- [ ] Style mixing (hybrid styles)
- [ ] Before/after comparison tool
- [ ] Multiple room batch processing

#### v2.0.0 (Major)
- [ ] Breaking: New API with streaming support
- [ ] WebSocket transport option
- [ ] Real-time progress updates
- [ ] Style recommendation engine (ML-based)

### Bug Fixes Pending

- None reported yet

### Performance Improvements Planned

- Request queuing and prioritization
- Connection pooling for Gemini API
- Image preprocessing pipeline
- Response caching (Redis)

---

## Version History

- **1.0.0** (2025-11-28): Initial release
  - Complete MCP server with 4 tools
  - 5 yacht design styles
  - Gemini 2.5 Flash integration
  - Full documentation suite

---

For detailed upgrade instructions, see [UPGRADE.md](UPGRADE.md) (when available).

For contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md) (when available).
