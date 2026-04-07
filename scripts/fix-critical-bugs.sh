#!/bin/bash

# Analisi Tracker - Critical Bug Fixes
# This script fixes the critical issues found during testing

set -e  # Exit on error

echo "🔧 Analisi Tracker - Critical Bug Fixes"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${2}$1${NC}"
}

cd /Users/causius/Documents/GitHub/analisi-tracker

#==========================================
# FIX 1: Authentication System (CRITICAL)
#==========================================

print_status "\n📋 FIX 1: Remove user table references from auth system..." "$YELLOW"

AUTH_FILE="server/middleware/auth.js"

if [ -f "$AUTH_FILE" ]; then
  # Backup original file
  cp "$AUTH_FILE" "${AUTH_FILE}.backup"

  # Create single-user version of auth.js
  cat > "$AUTH_FILE" << 'EOF'
/**
 * Authentication Middleware
 * JWT-based authentication and authorization
 * SINGLE-USER VERSION (no database user table)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// For single-user mode, use a fixed user ID
const SINGLE_USER_ID = process.env.SINGLE_USER_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Generate access token
 */
export function generateAccessToken(userId = SINGLE_USER_ID) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '15m' } // Access tokens expire in 15 minutes
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId = SINGLE_USER_ID) {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Refresh tokens expire in 7 days
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware for Express routes
 * Validates JWT token and attaches user to request
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Your access token is invalid or expired'
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token verification failed',
      message: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.userId = decoded.userId;
      }
    } catch (error) {
      // Ignore errors in optional auth
    }
  }

  next();
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(userId = SINGLE_USER_ID) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return null;
    }

    return generateAccessToken(decoded.userId);
  } catch (error) {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateToken,
  optionalAuth,
  generateTokenPair,
  refreshAccessToken,
};
EOF

  print_status "✅ Fixed: $AUTH_FILE" "$GREEN"
else
  print_status "❌ File not found: $AUTH_FILE" "$RED"
fi

#==========================================
# FIX 2: Add missing html2canvas import
#==========================================

print_status "\n📋 FIX 2: Adding missing html2canvas imports..." "$YELLOW"

find client/src/components/charts -name "*.tsx" -type f | while read file; do
  if grep -q "html2canvas" "$file" && ! grep -q "import html2canvas" "$file"; then
    # Add import after the last import statement
    awk '
      /^import/ { imports = imports "\n" $0; next }
      !/^import/ && imports {
        printf "%s\nimport html2canvas '\''html2canvas'\'';\n", imports
        imports = ""
      }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"

    print_status "✅ Fixed: $file" "$GREEN"
  fi
done

#==========================================
# FIX 3: Create .env file
#==========================================

print_status "\n📋 FIX 3: Creating .env file..." "$YELLOW"

if [ ! -f .env ]; then
  cp .env.example .env
  # Set default values for development
  cat >> .env << 'EOF'

# Single-User Mode Configuration
SINGLE_USER_ID=00000000-0000-0000-0000-000000000001
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Database (SQLite for development, no PostgreSQL required)
DATABASE_URL=sqlite:./local.db

# Disable features that require external services
ENABLE_AI_CHAT=false
ENABLE_AI_PDF_EXTRACTION=false
REDIS_HOST=
REDIS_PORT=
EOF

  print_status "✅ Created: .env" "$GREEN"
else
  print_status "ℹ️  .env already exists" "$YELLOW"
fi

#==========================================
# FIX 4: Create simple server startup script
#==========================================

print_status "\n📋 FIX 4: Creating simple server startup..." "$YELLOW"

# Create a simple server file that bypasses auth for testing
cat > server/simple-server.js << 'EOF'
/**
 * Simple Development Server
 * Bypasses authentication for testing purposes
 */

import express from 'express';
import cors from 'cors';
import { dataValidator } from './utils/data-validator.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load sample data
const sampleData = JSON.parse(
  readFileSync(join(__dirname, '../data/sample-data.json'), 'utf-8')
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Get sample data
app.get('/api/data', (req, res) => {
  res.json(sampleData);
});

// Get specific lab test
app.get('/api/labs/:testName', (req, res) => {
  const test = sampleData.labTests[req.params.testName];
  if (test) {
    res.json(test);
  } else {
    res.status(404).json({ error: 'Lab test not found' });
  }
});

// Serve static files from client
app.use(express.static(join(__dirname, '../client/.next')));

app.listen(PORT, () => {
  console.log(`\n🚀 Simple Dev Server running on http://localhost:${PORT}`);
  console.log(`📊 Sample data available at http://localhost:${PORT}/api/data`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /api/data`);
  console.log(`   GET /api/labs/:testName`);
  console.log(`\n`);
});

export default app;
EOF

  print_status "✅ Created: server/simple-server.js" "$GREEN"

#==========================================
# SUMMARY
#==========================================

print_status "\n========================================" "$GREEN"
print_status "✅ Critical Bug Fixes Applied!" "$GREEN"
print_status "========================================\n" "$GREEN"

print_status "What was fixed:" "$YELLOW"
print_status "  1. ✅ Authentication system (single-user mode)" "$GREEN"
print_status "  2. ✅ Missing html2canvas imports" "$GREEN"
print_status "  3. ✅ .env file created" "$GREEN"
print_status "  4. ✅ Simple test server created" "$GREEN"

print_status "\nNext steps:" "$YELLOW"
print_status "  1. Test the fixes: npm run dev" "$NC"
print_status "  2. Or run simple server: node server/simple-server.js" "$NC"
print_status "  3. Run automated tests: npm test" "$NC"
print_status "  4. Check for remaining issues" "$NC"

print_status "\n📝 Backup files created:" "$YELLOW"
print_status "  - server/middleware/auth.js.backup" "$NC"

print_status "\n⚠️  Note: These fixes are for development/testing." "$RED"
print_status "    For production, implement proper authentication." "$RED"

print_status "\n" "$NC"
