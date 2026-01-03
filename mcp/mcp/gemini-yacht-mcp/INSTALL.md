# Installation Guide - Gemini Yacht MCP Server

## Prerequisites

- **Python 3.9+** (verify with `python --version`)
- **pip** package manager
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))
- **Claude Code** installed and configured

## Installation Steps

### 1. Navigate to MCP Directory

```bash
cd "C:\Users\beatr\Documents\projets\yacht interior\mcp\gemini-yacht-mcp"
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `mcp>=1.2.0` - MCP SDK
- `google-generativeai>=0.8.0` - Gemini API client
- `pydantic>=2.0.0` - Data validation
- `python-dotenv>=1.0.0` - Environment management
- `Pillow>=10.0.0` - Image processing
- `aiohttp>=3.9.0` - Async HTTP

### 4. Configure Environment Variables

Create a `.env` file from the template:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=60
LOG_LEVEL=INFO
```

### 5. Test the Server

Test that the server initializes correctly:

```bash
python main.py
```

You should see logs like:
```
============================================================
Gemini Yacht MCP Server Starting
============================================================
INFO - Environment validation passed
INFO - Using model: gemini-2.5-flash
INFO - Gemini client initialized successfully
INFO - Registered tools:
INFO -   - analyze_structure: Analyze yacht interior architecture
...
```

Press `Ctrl+C` to stop.

### 6. Configure Claude Code

#### Option A: Using Claude CLI (Recommended)

```bash
# Add the MCP server to Claude Code
claude mcp add --transport stdio gemini-yacht -- python "C:\Users\beatr\Documents\projets\yacht interior\mcp\gemini-yacht-mcp\main.py"

# Set environment variables
# Note: On Windows, set GEMINI_API_KEY in system environment variables
# or use the .mcp.json method below
```

#### Option B: Manual .mcp.json Configuration

1. Locate your `.mcp.json` file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json` or project `.mcp.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the server configuration:

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": [
        "C:\\Users\\beatr\\Documents\\projets\\yacht interior\\mcp\\gemini-yacht-mcp\\main.py"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here",
        "GEMINI_MODEL": "gemini-2.5-flash",
        "GEMINI_TIMEOUT": "60",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

**Security Note**: For production, use environment variable expansion:

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": ["C:\\path\\to\\main.py"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}",
        "GEMINI_MODEL": "gemini-2.5-flash"
      }
    }
  }
}
```

Then set `GEMINI_API_KEY` in your system environment variables.

### 7. Verify Installation in Claude Code

1. Restart Claude Code
2. Run the command:
   ```
   /mcp list
   ```
3. You should see `gemini-yacht` in the list
4. Test a tool:
   ```
   /mcp call gemini-yacht list_styles
   ```

## Troubleshooting

### Import Errors

**Error**: `ModuleNotFoundError: No module named 'mcp'`

**Solution**: Ensure you're using the virtual environment and dependencies are installed:
```bash
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### API Key Issues

**Error**: `GEMINI_API_KEY environment variable is required`

**Solution**: Verify your `.env` file exists and contains the API key, or set it in system environment variables.

### Path Issues on Windows

**Error**: Server fails to start with path errors

**Solution**: Use absolute paths with escaped backslashes (`\\`) or forward slashes (`/`) in JSON configuration.

### Gemini API Errors

**Error**: `Gemini API call failed: 401 Unauthorized`

**Solution**: Verify your API key is valid and active at [Google AI Studio](https://aistudio.google.com/app/apikey).

### Timeout Issues

**Error**: `Gemini API call timed out after 60 seconds`

**Solution**: Increase timeout in `.env`:
```env
GEMINI_TIMEOUT=120
```

## Next Steps

- Read [README.md](README.md) for usage examples
- Check [EXAMPLES.md](EXAMPLES.md) for detailed tool demonstrations
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

## Uninstallation

To remove the MCP server from Claude Code:

```bash
# Using CLI
claude mcp remove gemini-yacht

# Manual: Remove the "gemini-yacht" entry from .mcp.json
```

To delete the server files:

```bash
cd "C:\Users\beatr\Documents\projets\yacht interior\mcp"
rm -rf gemini-yacht-mcp  # Or delete folder manually
```
