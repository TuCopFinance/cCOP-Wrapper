#!/bin/bash

# Farcaster Integration Verification Script
# This script checks that all required files and configurations are in place

echo "🔍 Verifying Farcaster Integration..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if we're in the dapp directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in dapp directory${NC}"
    echo "Please run this script from the dapp directory"
    exit 1
fi

echo "📦 Checking Dependencies..."
if grep -q "@farcaster/miniapp-sdk" package.json; then
    echo -e "${GREEN}✅ @farcaster/miniapp-sdk installed${NC}"
else
    echo -e "${RED}❌ @farcaster/miniapp-sdk not found${NC}"
    ((ERRORS++))
fi

if grep -q "@farcaster/miniapp-wagmi-connector" package.json; then
    echo -e "${GREEN}✅ @farcaster/miniapp-wagmi-connector installed${NC}"
else
    echo -e "${RED}❌ @farcaster/miniapp-wagmi-connector not found${NC}"
    ((ERRORS++))
fi

echo ""
echo "📄 Checking Files..."

# Check manifest
if [ -f "public/.well-known/farcaster.json" ]; then
    echo -e "${GREEN}✅ Manifest file exists${NC}"
    
    # Check if placeholders are still present
    if grep -q "PLACEHOLDER" public/.well-known/farcaster.json; then
        echo -e "${YELLOW}⚠️  Warning: Manifest contains PLACEHOLDER values${NC}"
        echo "   Update accountAssociation fields with real values"
        ((WARNINGS++))
    else
        echo -e "${GREEN}   ✓ No placeholders found${NC}"
    fi
else
    echo -e "${RED}❌ Manifest file not found${NC}"
    ((ERRORS++))
fi

# Check images
if [ -f "public/icon.png" ]; then
    echo -e "${GREEN}✅ icon.png exists${NC}"
else
    echo -e "${RED}❌ icon.png not found${NC}"
    ((ERRORS++))
fi

if [ -f "public/splash.png" ]; then
    echo -e "${GREEN}✅ splash.png exists${NC}"
else
    echo -e "${RED}❌ splash.png not found${NC}"
    ((ERRORS++))
fi

if [ -f "public/image.png" ]; then
    echo -e "${GREEN}✅ image.png exists${NC}"
else
    echo -e "${RED}❌ image.png not found${NC}"
    ((ERRORS++))
fi

# Check source files
if [ -f "src/utils/farcaster.ts" ]; then
    echo -e "${GREEN}✅ Farcaster utilities created${NC}"
else
    echo -e "${RED}❌ Farcaster utilities not found${NC}"
    ((ERRORS++))
fi

if [ -f "src/context/FarcasterContext.tsx" ]; then
    echo -e "${GREEN}✅ FarcasterContext created${NC}"
else
    echo -e "${RED}❌ FarcasterContext not found${NC}"
    ((ERRORS++))
fi

if [ -f "src/app/api/webhook/route.ts" ]; then
    echo -e "${GREEN}✅ Webhook endpoint created${NC}"
else
    echo -e "${RED}❌ Webhook endpoint not found${NC}"
    ((ERRORS++))
fi

echo ""
echo "🔧 Checking Configuration..."

# Check if FarcasterProvider is in layout
if grep -q "FarcasterProvider" src/app/layout.tsx; then
    echo -e "${GREEN}✅ FarcasterProvider integrated in layout${NC}"
else
    echo -e "${RED}❌ FarcasterProvider not found in layout${NC}"
    ((ERRORS++))
fi

# Check if farcasterConnector is exported
if grep -q "farcasterConnector" src/config/index.ts; then
    echo -e "${GREEN}✅ Farcaster connector configured${NC}"
else
    echo -e "${RED}❌ Farcaster connector not configured${NC}"
    ((ERRORS++))
fi

# Check if ConnectButton imports Farcaster
if grep -q "useFarcaster" src/components/ConnectButton.tsx; then
    echo -e "${GREEN}✅ ConnectButton enhanced with Farcaster${NC}"
else
    echo -e "${RED}❌ ConnectButton not enhanced${NC}"
    ((ERRORS++))
fi

# Check next.config.ts for headers
if grep -q ".well-known/farcaster.json" next.config.ts; then
    echo -e "${GREEN}✅ Next.js config updated${NC}"
else
    echo -e "${RED}❌ Next.js config not updated${NC}"
    ((ERRORS++))
fi

echo ""
echo "📚 Checking Documentation..."

if [ -f "FARCASTER_SETUP.md" ]; then
    echo -e "${GREEN}✅ Setup guide created${NC}"
else
    echo -e "${YELLOW}⚠️  Setup guide not found${NC}"
    ((WARNINGS++))
fi

if [ -f "FARCASTER_INTEGRATION_SUMMARY.md" ]; then
    echo -e "${GREEN}✅ Integration summary created${NC}"
else
    echo -e "${YELLOW}⚠️  Integration summary not found${NC}"
    ((WARNINGS++))
fi

echo ""
echo "🏗️  Testing Build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "   Run 'npm run build' to see errors"
    ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Generate account association signature"
    echo "2. Update public/.well-known/farcaster.json"
    echo "3. Deploy to production"
    echo "4. Test in Farcaster client"
    echo ""
    echo "See FARCASTER_SETUP.md for detailed instructions"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    echo "Review warnings above and address if needed"
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found${NC}"
    fi
    echo "Please fix errors before deploying"
    exit 1
fi

echo ""

