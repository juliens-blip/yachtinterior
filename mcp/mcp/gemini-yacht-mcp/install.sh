#!/bin/bash
################################################################################
# Gemini Yacht MCP Server - Automated Installation Script (Linux/macOS)
################################################################################
#
# This script automates the installation process:
# 1. Checks Python version
# 2. Creates virtual environment
# 3. Installs dependencies
# 4. Creates .env file
# 5. Tests installation
#
# Usage: ./install.sh
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

print_step() {
    echo -e "${GREEN}[$1] $2${NC}"
}

print_info() {
    echo -e "      $1"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Main installation
print_header "GEMINI YACHT MCP SERVER - AUTOMATED INSTALLATION"

# Check if Python is installed
print_step "1/6" "Checking Python installation..."

if ! command -v python3 &> /dev/null; then
    print_error "python3 is not installed"
    echo "Please install Python 3.9+ from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
print_info "Found Python $PYTHON_VERSION"

# Check Python version (basic check for 3.9+)
MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 9 ]); then
    print_error "Python 3.9+ required, found Python $PYTHON_VERSION"
    exit 1
fi

print_info "Python version OK"

# Create virtual environment
print_step "2/6" "Creating virtual environment..."

if [ -d "venv" ]; then
    print_info "Virtual environment already exists, skipping"
else
    python3 -m venv venv
    print_info "Virtual environment created"
fi

# Activate virtual environment
print_step "3/6" "Activating virtual environment..."
source venv/bin/activate
print_info "Virtual environment activated"

# Upgrade pip
print_step "4/6" "Upgrading pip..."
python -m pip install --upgrade pip --quiet
print_info "pip upgraded"

# Install dependencies
print_step "5/6" "Installing dependencies..."
print_info "This may take 1-2 minutes..."
pip install -r requirements.txt --quiet
print_info "Dependencies installed successfully"

# Create .env file
print_step "6/6" "Configuring environment..."

if [ -f ".env" ]; then
    print_info ".env file already exists, skipping"
else
    cp .env.example .env
    print_info ".env file created from template"

    print_header "IMPORTANT: Configure your Gemini API key"
    echo "1. Open .env file in a text editor"
    echo "2. Replace 'your_gemini_api_key_here' with your actual API key"
    echo "3. Get API key from: https://aistudio.google.com/app/apikey"
    echo ""

    # Try to open with default editor
    if command -v nano &> /dev/null; then
        read -p "Press Enter to open .env with nano, or Ctrl+C to skip... "
        nano .env
    elif command -v vim &> /dev/null; then
        read -p "Press Enter to open .env with vim, or Ctrl+C to skip... "
        vim .env
    else
        echo "Please edit .env manually with your preferred editor"
        echo "Example: nano .env"
    fi
fi

# Run tests
print_header "Installation Complete! Running tests..."
echo "NOTE: Tests will call Gemini API - ensure .env has valid API key"
echo ""
read -p "Press Enter to run tests, or Ctrl+C to skip... "

if python test_server.py; then
    print_header "SUCCESS! Installation and tests completed"

    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Add to Claude Code:"
    echo "   claude mcp add --transport stdio gemini-yacht -- python $(pwd)/main.py"
    echo ""
    echo "2. Or manually configure .mcp.json:"
    echo "   {"
    echo "     \"mcpServers\": {"
    echo "       \"gemini-yacht\": {"
    echo "         \"command\": \"python\","
    echo "         \"args\": [\"$(pwd)/main.py\"],"
    echo "         \"env\": {"
    echo "           \"GEMINI_API_KEY\": \"\${GEMINI_API_KEY}\""
    echo "         }"
    echo "       }"
    echo "     }"
    echo "   }"
    echo ""
    echo "3. Restart Claude Code"
    echo ""
    echo "4. Verify: /mcp list"
    echo ""
    echo "Documentation:"
    echo "- Quick Start: QUICKSTART.md"
    echo "- Full Guide: README.md"
    echo "- Examples: EXAMPLES.md"
    echo ""
    print_header ""

else
    print_header "TESTS FAILED"

    echo ""
    echo "Please check:"
    echo "1. GEMINI_API_KEY is set correctly in .env"
    echo "2. API key is valid and active"
    echo "3. Internet connection is working"
    echo ""
    echo "Run tests manually: python test_server.py"
    echo ""
    exit 1
fi
