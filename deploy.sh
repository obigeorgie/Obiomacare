#!/bin/bash
# Obioma Care — Deployment Script
# Usage: ./deploy.sh [environment]

ENV=${1:-production}
echo "🚀 Deploying Obioma Care to $ENV..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check environment variables
echo "🔑 Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please fill in your API keys in .env${NC}"
fi

# Verify required env vars
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY not set${NC}"
fi

if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RESEND_API_KEY not set${NC}"
fi

# Build step (if needed)
echo "🔨 Building..."
# Add any build steps here

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    if [ "$ENV" == "production" ]; then
        vercel --prod
    else
        vercel
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Install with: npm i -g vercel${NC}"
    echo "Manual deployment:"
    echo "1. Push to GitHub"
    echo "2. Connect repo to Vercel"
    echo "3. Set environment variables in Vercel dashboard"
fi

# Setup Stripe webhook
echo "🔗 Stripe webhook setup:"
echo "   1. Go to Stripe Dashboard > Developers > Webhooks"
echo "   2. Add endpoint: https://obiomacare.com/api/webhook"
echo "   3. Select events: checkout.session.completed"
echo "   4. Copy signing secret to STRIPE_WEBHOOK_SECRET in .env"

# Setup Resend
echo "📧 Resend setup:"
echo "   1. Verify domain: obiomacare.com in Resend dashboard"
echo "   2. Update 'from' address in server.js if needed"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Set up Stripe products and prices"
echo "  2. Configure webhooks"
echo "  3. Test checkout flow"
echo "  4. Set up email nurture sequence"
echo "  5. Launch!"
