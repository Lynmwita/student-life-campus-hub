#!/usr/bin/env bash
# ==============================================================================
# Summit Metropolitan University - Student Life & Campus Hub
# Phase 10: Production Cryptographic Secret & Environment Generator
# ==============================================================================

set -euo pipefail

echo "========================================================================"
echo "SMU Campus Hub - Production Cryptographic Secrets Generator"
echo "========================================================================"
echo ""
echo "Generating high-entropy 256-bit production secrets..."

# 1. Generate 256-bit cryptographically secure random secrets
PROD_CRON_SECRET=$(openssl rand -hex 32)
PROD_UAMS_SECRET=$(openssl rand -hex 32)

echo ""
echo "Generated Secrets (CONFIDENTIAL - DO NOT COMMIT TO VERSION CONTROL):"
echo "------------------------------------------------------------------------"
echo "CRON_SECRET=${PROD_CRON_SECRET}"
echo "UAMS_SYNC_SECRET=${PROD_UAMS_SECRET}"
echo "------------------------------------------------------------------------"
echo ""
echo "Copy and paste the following block into Vercel Project Settings -> Environment Variables"
echo "or into GitHub Actions Secrets & Variables (for automated CI/CD and cron runner):"
echo ""
cat <<EOF
# --- Production Environment Variables (Template) ---
NODE_ENV="production"
NEXT_PUBLIC_ENABLE_DEMO_AUTH="false"
NEXT_PUBLIC_APP_NAME="Student Life & Campus Hub"
NEXT_PUBLIC_APP_URL="https://hub.summit.ac.ke"

# Supabase Production Project (replace with live production credentials)
NEXT_PUBLIC_SUPABASE_URL="https://<production-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<production-anon-jwt-token>"
SUPABASE_SERVICE_ROLE_KEY="<production-service-role-jwt-token>"
DATABASE_URL="postgresql://postgres.<production-ref>:<production-db-password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Production Automation Secrets (Cryptographically Generated)
CRON_SECRET="${PROD_CRON_SECRET}"
UAMS_SYNC_SECRET="${PROD_UAMS_SECRET}"
EOF

echo ""
echo "========================================================================"
echo "Action Checklist for Platform Admins:"
echo " 1. Inject CRON_SECRET into Vercel Environment Variables (Production)."
echo " 2. Inject CRON_SECRET into GitHub Repository Secrets (Actions)."
echo " 3. Verify NEXT_PUBLIC_ENABLE_DEMO_AUTH is set to 'false'."
echo "========================================================================"
