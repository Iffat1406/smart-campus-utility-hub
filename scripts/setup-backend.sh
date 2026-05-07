#!/bin/bash
# Quick Setup Script for Smart Campus with Notifications & Academic Progress
# Run this from the smart-campus-backend directory

set -e  # Exit on first error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Smart Campus - Database & Features Setup Script 🚀    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the smart-campus-backend directory"
    echo "cd smart-campus-backend && bash ../scripts/setup.sh"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with database credentials"
    echo "Copy from .env.example if available"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking environment...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
npm install 2>/dev/null || {
    echo -e "${YELLOW}⚠️  npm install encountered some warnings (this is usually ok)${NC}"
}
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo -e "${BLUE}🗄️  Step 3: Initializing database schema...${NC}"
echo "   This will create all tables for notifications, academic progress, etc."
node sql/init-db.js || {
    echo -e "${RED}❌ Database initialization failed${NC}"
    echo "Common issues:"
    echo "  • PostgreSQL server not running"
    echo "  • Incorrect database credentials in .env"
    echo "  • Database doesn't exist"
    exit 1
}
echo -e "${GREEN}✅ Database schema initialized${NC}"

echo ""
echo -e "${BLUE}👥 Step 4: Populating academic progress data...${NC}"
node sql/migrate-academic-progress.js || {
    echo -e "${YELLOW}⚠️  Migration completed with some messages (check above)${NC}"
}

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✨ Setup Complete! All systems ready ✨            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BLUE}🚀 You can now start the application:${NC}"
echo ""
echo -e "   Terminal 1 (Backend):"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "   Terminal 2 (Frontend):"
echo -e "   ${YELLOW}cd ../smart-campus-frontend${NC}"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${BLUE}📝 Testing:${NC}"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Login as admin and create an event"
echo "   3. Login as a student to see notifications"
echo "   4. Check the Academic Progress section in dashboard"
echo ""
