# Documentation Index - Gemini Yacht MCP Server

Quick navigation guide to all documentation files.

## Quick Links

| I want to... | Read this file |
|--------------|----------------|
| **Get started in 5 minutes** | [QUICKSTART.md](QUICKSTART.md) |
| **Install the server** | [INSTALL.md](INSTALL.md) |
| **Learn how to use it** | [USAGE_GUIDE.md](USAGE_GUIDE.md) |
| **See usage examples** | [EXAMPLES.md](EXAMPLES.md) |
| **Understand the architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Deploy to production** | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **View project overview** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| **Check version history** | [CHANGELOG.md](CHANGELOG.md) |
| **Browse file structure** | [TREE.txt](TREE.txt) |
| **Find help** | [README.md](README.md) |

---

## Documentation Structure

```
Documentation/
├── Getting Started
│   ├── QUICKSTART.md         # 5-minute setup guide
│   ├── INSTALL.md            # Detailed installation
│   └── README.md             # Main documentation
│
├── Usage
│   ├── USAGE_GUIDE.md        # How to use in Claude Code
│   ├── EXAMPLES.md           # Detailed examples
│   └── README.md (Usage)     # Basic usage section
│
├── Technical
│   ├── ARCHITECTURE.md       # System architecture
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── PROJECT_SUMMARY.md    # Technical overview
│
├── Reference
│   ├── CHANGELOG.md          # Version history
│   ├── TREE.txt              # File structure
│   └── LICENSE               # MIT License
│
└── Configuration
    ├── .env.example          # Environment template
    ├── claude_config.json    # Claude Code config
    └── requirements.txt      # Dependencies
```

---

## Documentation by Audience

### For End Users (Designers, Clients)

1. [QUICKSTART.md](QUICKSTART.md) - Get up and running
2. [USAGE_GUIDE.md](USAGE_GUIDE.md) - Learn the tools
3. [EXAMPLES.md](EXAMPLES.md) - See what's possible
4. [README.md](README.md) - Full reference

### For Developers

1. [ARCHITECTURE.md](ARCHITECTURE.md) - System design
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical overview
3. [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment strategies
4. Source code:
   - [main.py](main.py) - Server entry point
   - [handlers/tools.py](handlers/tools.py) - Tool implementations
   - [models/schemas.py](models/schemas.py) - Data models
   - [utils/gemini_client.py](utils/gemini_client.py) - API client

### For Administrators

1. [INSTALL.md](INSTALL.md) - Installation procedures
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
3. [CHANGELOG.md](CHANGELOG.md) - Version tracking
4. Configuration files:
   - [.env.example](.env.example) - Environment variables
   - [claude_config.json](claude_config.json) - MCP configuration
   - [requirements.txt](requirements.txt) - Dependencies

---

## Documentation by Topic

### Installation & Setup

- **Quick Setup:** [QUICKSTART.md](QUICKSTART.md)
- **Detailed Install:** [INSTALL.md](INSTALL.md)
- **Production Deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Configuration:** [README.md](README.md#configuration)

### Using the Tools

- **Basic Usage:** [USAGE_GUIDE.md](USAGE_GUIDE.md)
- **Detailed Examples:** [EXAMPLES.md](EXAMPLES.md)
- **Tool Reference:** [README.md](README.md#tools)
- **Design Styles:** [README.md](README.md#design-styles)

### Technical Details

- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Code Structure:** [TREE.txt](TREE.txt)
- **API Reference:** Source code docstrings
- **Dependencies:** [requirements.txt](requirements.txt)

### Troubleshooting

- **Quick Fixes:** [QUICKSTART.md](QUICKSTART.md#troubleshooting)
- **Common Issues:** [INSTALL.md](INSTALL.md#troubleshooting)
- **Deployment Issues:** [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)
- **Usage Problems:** [USAGE_GUIDE.md](USAGE_GUIDE.md#troubleshooting-in-claude-code)

### Project Information

- **Overview:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **License:** [LICENSE](LICENSE)
- **File Structure:** [TREE.txt](TREE.txt)

---

## File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| README.md | ~500 | Main documentation |
| INSTALL.md | ~250 | Installation guide |
| QUICKSTART.md | ~120 | 5-min setup |
| USAGE_GUIDE.md | ~450 | User guide |
| EXAMPLES.md | ~600 | Usage examples |
| ARCHITECTURE.md | ~600 | Technical architecture |
| DEPLOYMENT.md | ~500 | Deployment guide |
| PROJECT_SUMMARY.md | ~400 | Project overview |
| CHANGELOG.md | ~150 | Version history |

**Total Documentation:** ~3,500+ lines

---

## Reading Paths

### Path 1: Complete Beginner

```
1. README.md (overview)
   ↓
2. QUICKSTART.md (setup)
   ↓
3. USAGE_GUIDE.md (learn tools)
   ↓
4. EXAMPLES.md (see examples)
```

**Time:** ~30 minutes

---

### Path 2: Quick Start

```
1. QUICKSTART.md (install)
   ↓
2. USAGE_GUIDE.md (basics)
   ↓
3. Start using!
```

**Time:** ~10 minutes

---

### Path 3: Developer

```
1. README.md (overview)
   ↓
2. ARCHITECTURE.md (design)
   ↓
3. PROJECT_SUMMARY.md (technical)
   ↓
4. Source code exploration
```

**Time:** ~45 minutes

---

### Path 4: Administrator

```
1. README.md (overview)
   ↓
2. INSTALL.md (setup)
   ↓
3. DEPLOYMENT.md (production)
   ↓
4. CHANGELOG.md (tracking)
```

**Time:** ~40 minutes

---

## Search Index

### By Keyword

**Installation:**
- QUICKSTART.md
- INSTALL.md
- DEPLOYMENT.md

**Configuration:**
- INSTALL.md
- DEPLOYMENT.md
- .env.example
- claude_config.json

**Usage:**
- USAGE_GUIDE.md
- EXAMPLES.md
- README.md

**Troubleshooting:**
- Every file has a troubleshooting section
- Main: INSTALL.md#troubleshooting

**Architecture:**
- ARCHITECTURE.md
- PROJECT_SUMMARY.md
- Source code

**API:**
- EXAMPLES.md
- ARCHITECTURE.md
- Source docstrings

**Tools:**
- USAGE_GUIDE.md
- EXAMPLES.md
- README.md#tools

**Styles:**
- USAGE_GUIDE.md
- EXAMPLES.md
- utils/prompts.py

---

## Update History

| Date | File | Changes |
|------|------|---------|
| 2025-11-28 | All | Initial creation (v1.0.0) |

---

## Contributing to Documentation

When updating documentation:

1. Update relevant file(s)
2. Update CHANGELOG.md
3. Update this INDEX.md if structure changes
4. Keep consistent formatting
5. Test all code examples
6. Verify all links work

---

## Documentation Standards

All documentation follows:

- **Format:** Markdown
- **Style:** GitHub Flavored Markdown
- **Line Length:** 80 characters (soft limit)
- **Headers:** ATX style (#, ##, ###)
- **Code Blocks:** Fenced with language identifiers
- **Links:** Relative paths
- **Tables:** Aligned for readability

---

## External Resources

**MCP Protocol:**
- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)

**Google Gemini:**
- [Gemini API Docs](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com/app/apikey)

**Claude Code:**
- [Claude Code Docs](https://code.claude.com/docs)
- [MCP in Claude Code](https://code.claude.com/docs/mcp)

**Python:**
- [Python 3.11 Docs](https://docs.python.org/3.11/)
- [Pydantic v2](https://docs.pydantic.dev/latest/)
- [FastMCP](https://github.com/modelcontextprotocol/python-sdk)

---

**Navigation Tip:** Use Ctrl+F (Cmd+F on Mac) to search within this index or any documentation file.

**Last Updated:** 2025-11-28
**Version:** 1.0.0
