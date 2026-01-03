# Deployment Guide - Gemini Yacht MCP Server

Complete guide for deploying the Gemini Yacht MCP server in different environments.

## Table of Contents

- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Claude Code Integration](#claude-code-integration)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Python 3.9+
- pip package manager
- Git (optional)
- Gemini API key

### Quick Start

```bash
# 1. Navigate to project
cd "C:\Users\beatr\Documents\projets\yacht interior\mcp\gemini-yacht-mcp"

# 2. Run automated installer (Windows)
install.bat

# OR run automated installer (Linux/macOS)
./install.sh

# OR manual installation
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add GEMINI_API_KEY
python test_server.py
```

### Development Workflow

```bash
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Run server in test mode
python main.py

# Run tests
python test_server.py

# Deactivate when done
deactivate
```

---

## Production Deployment

### Deployment Checklist

- [ ] Python 3.9+ installed on target system
- [ ] Valid Gemini API key obtained
- [ ] `.env` file configured (never commit!)
- [ ] All dependencies installed
- [ ] Tests passing (`python test_server.py`)
- [ ] Claude Code configured
- [ ] Firewall rules (if applicable)
- [ ] Monitoring configured (optional)

### Deployment Methods

#### Method 1: Direct Installation (Recommended)

**For single-user deployment on development machine.**

```bash
# 1. Clone/copy project files
cd /path/to/deployment/location

# 2. Install dependencies
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
nano .env  # Add GEMINI_API_KEY

# 4. Test installation
python test_server.py

# 5. Configure Claude Code
claude mcp add --transport stdio gemini-yacht -- python /absolute/path/to/main.py
```

#### Method 2: System-Wide Installation

**For multi-user systems (requires admin).**

```bash
# Install to system Python (not recommended, use venv instead)
sudo pip install -r requirements.txt

# Create system service (Linux example)
sudo nano /etc/systemd/system/gemini-yacht-mcp.service

# Add to Claude Code for all users
sudo nano /etc/claude/mcp-servers.json
```

**Service file example** (`gemini-yacht-mcp.service`):
```ini
[Unit]
Description=Gemini Yacht MCP Server
After=network.target

[Service]
Type=simple
User=claude-user
WorkingDirectory=/opt/gemini-yacht-mcp
Environment="GEMINI_API_KEY=your_key_here"
ExecStart=/usr/bin/python3 /opt/gemini-yacht-mcp/main.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

#### Method 3: Docker Container (Future)

**For isolated, reproducible deployments.**

```dockerfile
# Dockerfile (to be created)
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV GEMINI_API_KEY=""
ENV GEMINI_MODEL="gemini-2.5-flash"

CMD ["python", "main.py"]
```

```bash
# Build and run
docker build -t gemini-yacht-mcp .
docker run -e GEMINI_API_KEY=your_key gemini-yacht-mcp
```

---

## Claude Code Integration

### Local Scope (Project-Specific)

Best for: Single project needing the MCP server

**Create `.mcp.json` in project root:**

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": [
        "C:\\Users\\beatr\\Documents\\projets\\yacht interior\\mcp\\gemini-yacht-mcp\\main.py"
      ],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}",
        "GEMINI_MODEL": "gemini-2.5-flash",
        "GEMINI_TIMEOUT": "60",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

**Set environment variable:**

Windows:
```cmd
setx GEMINI_API_KEY "your_key_here"
```

Linux/macOS:
```bash
export GEMINI_API_KEY="your_key_here"
# Add to ~/.bashrc or ~/.zshrc for persistence
```

### User Scope (Global)

Best for: All your projects on your machine

**Using Claude CLI:**

```bash
# Add server globally
claude mcp add --scope user --transport stdio gemini-yacht -- python /path/to/main.py

# Set API key in user environment variables
# Windows: System Properties → Environment Variables
# Linux/macOS: Add to ~/.bashrc or ~/.zshrc
export GEMINI_API_KEY="your_key_here"
```

**Manual configuration:**

Edit `~/.config/Claude/claude_desktop_config.json` (Linux/macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": ["/absolute/path/to/main.py"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

### Project Scope (Team Collaboration)

Best for: Sharing configuration with team via Git

**Create `.mcp.json` in project root (commit this):**

```json
{
  "mcpServers": {
    "gemini-yacht": {
      "command": "python",
      "args": [
        "${PROJECT_ROOT}/mcp/gemini-yacht-mcp/main.py"
      ],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

**Each team member sets their own API key:**

```bash
# In their shell/environment
export GEMINI_API_KEY="their_individual_key"
```

**Benefits:**
- Configuration shared via Git
- API keys remain private (environment variables)
- Consistent setup across team

---

## Environment-Specific Configurations

### Development Environment

```env
# .env.development
GEMINI_API_KEY=your_dev_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=60
LOG_LEVEL=DEBUG
DEBUG=true
```

**Usage:**
```bash
cp .env.development .env
python main.py
```

### Staging Environment

```env
# .env.staging
GEMINI_API_KEY=your_staging_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=90
LOG_LEVEL=INFO
DEBUG=false
```

### Production Environment

```env
# .env.production
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT=120
LOG_LEVEL=WARNING
DEBUG=false
```

**Security Note:** Never commit `.env` files to Git!

---

## Monitoring & Maintenance

### Log Monitoring

**View logs in real-time:**

```bash
# If running as service (Linux)
sudo journalctl -u gemini-yacht-mcp -f

# If running directly
python main.py 2> logs/server.log
tail -f logs/server.log
```

**Log levels:**
- `DEBUG`: Detailed API calls, image processing steps
- `INFO`: Tool invocations, major operations (default)
- `WARNING`: Fallbacks, deprecations
- `ERROR`: API failures, validation errors

**Configure log level:**
```env
LOG_LEVEL=INFO
```

### Health Checks

**Test server availability:**

```bash
# Run test suite
python test_server.py

# Expected output: 6/6 tests passed
```

**Test specific tool:**

```python
# test_tool.py
import asyncio
from handlers.tools import list_available_styles

async def test():
    styles = await list_available_styles()
    print(f"Server OK: {len(styles)} styles available")

asyncio.run(test())
```

### Performance Monitoring

**Track API latency:**

Enable debug logging and monitor:
```
INFO - Calling Gemini API for analysis (timeout: 60s)
INFO - Received analysis response (1234 chars)
```

**Measure processing time:**

Add timing wrapper:
```python
import time

start = time.time()
result = await analyze_yacht_structure(image)
elapsed = time.time() - start
print(f"Analysis took {elapsed:.2f}s")
```

### Maintenance Tasks

**Weekly:**
- [ ] Check logs for errors
- [ ] Verify API key validity
- [ ] Test with sample images

**Monthly:**
- [ ] Update dependencies (`pip install --upgrade -r requirements.txt`)
- [ ] Review API quota usage
- [ ] Clear cache if implemented

**Quarterly:**
- [ ] Review security best practices
- [ ] Rotate API keys
- [ ] Performance audit

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Server Not Starting

**Error:**
```
ERROR: GEMINI_API_KEY environment variable is required
```

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check contents (without revealing key)
grep GEMINI_API_KEY .env | wc -l  # Should output 1

# If missing, create from template
cp .env.example .env
nano .env  # Add your API key
```

#### 2. Server Not in Claude Code

**Error:**
```
/mcp list
# gemini-yacht not shown
```

**Solution:**
```bash
# 1. Verify .mcp.json syntax
cat .mcp.json | python -m json.tool

# 2. Check absolute paths
# Ensure paths use forward slashes or escaped backslashes

# 3. Restart Claude Code
# File → Quit Claude Code
# Relaunch

# 4. Re-add server
claude mcp remove gemini-yacht
claude mcp add --transport stdio gemini-yacht -- python /path/to/main.py
```

#### 3. API Errors

**Error:**
```
ERROR: Gemini API call failed: 401 Unauthorized
```

**Solution:**
```bash
# 1. Verify API key is valid
# Visit: https://aistudio.google.com/app/apikey

# 2. Test API key directly
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY"

# 3. Update .env with valid key
nano .env
```

#### 4. Timeout Errors

**Error:**
```
ERROR: Gemini API call timed out after 60 seconds
```

**Solution:**
```env
# Increase timeout in .env
GEMINI_TIMEOUT=120
```

Or reduce image size before sending:
```python
from PIL import Image

img = Image.open("large_image.jpg")
img.thumbnail((1024, 1024))  # Reduce to max 1024x1024
```

#### 5. Module Import Errors

**Error:**
```
ModuleNotFoundError: No module named 'mcp'
```

**Solution:**
```bash
# 1. Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate

# 2. Reinstall dependencies
pip install -r requirements.txt

# 3. Verify installation
pip list | grep mcp
# Should show: mcp 1.2.0 (or higher)
```

#### 6. Permission Errors (Linux/macOS)

**Error:**
```
Permission denied: ./main.py
```

**Solution:**
```bash
# Make executable
chmod +x main.py

# Or run with python explicitly
python main.py
```

---

## Verification Checklist

After deployment, verify:

- [ ] **Environment**: `python --version` shows 3.9+
- [ ] **Dependencies**: `pip list | grep mcp` shows mcp>=1.2.0
- [ ] **Configuration**: `.env` file exists with valid `GEMINI_API_KEY`
- [ ] **Tests**: `python test_server.py` passes 6/6 tests
- [ ] **Claude Integration**: `/mcp list` shows `gemini-yacht`
- [ ] **Tool Availability**: `/mcp call gemini-yacht list_styles` works
- [ ] **Logging**: Server logs appear in stderr (not stdout)
- [ ] **Security**: `.env` in `.gitignore`, no keys in code

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop server
# If running as service:
sudo systemctl stop gemini-yacht-mcp

# 2. Remove from Claude Code
claude mcp remove gemini-yacht

# 3. Restore previous version (if applicable)
git checkout previous-version
pip install -r requirements.txt

# 4. Re-add to Claude Code
claude mcp add --transport stdio gemini-yacht -- python /path/to/main.py

# 5. Verify
python test_server.py
```

---

## Support & Resources

### Documentation
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup
- [README.md](README.md) - Complete documentation
- [INSTALL.md](INSTALL.md) - Detailed installation
- [EXAMPLES.md](EXAMPLES.md) - Usage examples

### External Resources
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Claude Code Docs](https://code.claude.com/docs)

### Getting Help
1. Check troubleshooting section above
2. Run `python test_server.py` for diagnostics
3. Review logs in Claude Code developer tools
4. Consult [ARCHITECTURE.md](ARCHITECTURE.md) for technical details

---

**Deployment Version:** 1.0.0
**Last Updated:** 2025-11-28
**Status:** Production Ready ✅
