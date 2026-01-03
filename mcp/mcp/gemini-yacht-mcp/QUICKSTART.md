# Quick Start Guide - Gemini Yacht MCP

Get up and running with Gemini Yacht MCP in 5 minutes.

## Prerequisites Check

- [ ] Python 3.9+ installed (`python --version`)
- [ ] Claude Code installed
- [ ] Gemini API key ([Get here](https://aistudio.google.com/app/apikey))

## Installation (5 Steps)

### 1. Navigate to Directory

```bash
cd "C:\Users\beatr\Documents\projets\yacht interior\mcp\gemini-yacht-mcp"
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure API Key

```bash
# Copy template
copy .env.example .env

# Edit .env and add your key
notepad .env
```

**Add this line:**
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Test Server

```bash
python main.py
```

You should see:
```
============================================================
Gemini Yacht MCP Server Starting
============================================================
INFO - Gemini client initialized successfully
INFO - Registered tools:
  - analyze_structure
  - generate_style
  - generate_all
  - list_styles
```

Press `Ctrl+C` to stop.

### 5. Add to Claude Code

```bash
claude mcp add --transport stdio gemini-yacht -- python "C:\Users\beatr\Documents\projets\yacht interior\mcp\gemini-yacht-mcp\main.py"
```

**Or manually edit `.mcp.json`:**

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": [
        "C:\\Users\\beatr\\Documents\\projets\\yacht interior\\mcp\\gemini-yacht-mcp\\main.py"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Verify Installation

1. Restart Claude Code
2. Run: `/mcp list`
3. You should see `gemini-yacht` listed

## First Test

Try this in Claude Code:

```
What yacht design styles are available?
```

Claude will call `list_styles()` and show you the 5 available styles.

## Common Commands

| Task | Command |
|------|---------|
| List available styles | `What styles are available?` |
| Analyze yacht interior | `Analyze this image [attach]` |
| Generate single style | `Transform to Futuristic style` |
| Generate all styles | `Show in all styles` |

## Quick Troubleshooting

**Problem:** "GEMINI_API_KEY environment variable is required"

**Fix:** Ensure `.env` file exists with valid API key

---

**Problem:** Server not in `/mcp list`

**Fix:** Verify `.mcp.json` syntax, restart Claude Code

---

**Problem:** "ModuleNotFoundError: No module named 'mcp'"

**Fix:**
```bash
pip install -r requirements.txt
```

---

**Problem:** Timeout errors

**Fix:** Increase timeout in `.env`:
```
GEMINI_TIMEOUT=120
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [EXAMPLES.md](EXAMPLES.md) for detailed usage examples
- Review [INSTALL.md](INSTALL.md) for advanced configuration

## Uninstall

```bash
# Remove from Claude Code
claude mcp remove gemini-yacht

# Delete files
cd ..
rmdir /s gemini-yacht-mcp
```

---

Built for YachtGenius. Happy designing!
