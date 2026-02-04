# ================================================
# ASU DORMS - PLAN B: Railway + Vercel Deployment
# ================================================
# This guide deploys:
#   - Backend (.NET API) → Railway (FREE)
#   - PostgreSQL Database → Railway (FREE) 
#   - Frontend (React) → Vercel (FREE)
# ================================================

## COST SUMMARY
# -------------
# Railway: $5/month credit (lasts 25+ months for your usage)
# Vercel: FREE forever
# PostgreSQL: FREE on Railway (1GB storage)
# TOTAL: $0/month for 2+ years!

## STEP 1: Create Railway Account
# --------------------------------
# 1. Go to https://railway.app
# 2. Sign up with GitHub (recommended)
# 3. You get $5/month free credit

## STEP 2: Deploy Backend to Railway
# -----------------------------------
# Option A: Deploy via GitHub (Recommended)

# 1. Push your code to GitHub:
git add .
git commit -m "Plan B: Railway + PostgreSQL deployment"
git push origin plan-B

# 2. In Railway Dashboard:
#    - Click "New Project"
#    - Select "Deploy from GitHub repo"
#    - Choose your backend repo
#    - Select the "plan-B" branch
#    - Railway auto-detects Dockerfile

# 3. Add PostgreSQL:
#    - Click "New" → "Database" → "PostgreSQL"
#    - Railway creates $DATABASE_URL automatically

# 4. Set Environment Variables in Railway:
#    DATABASE_URL = (auto-set by Railway)
#    JWT_SECRET = YourSuperSecretKeyThatIsAtLeast32CharactersLong!ChangeThis
#    ASPNETCORE_ENVIRONMENT = Production

# 5. Get your Railway URL (e.g., https://asu-dorms-api-production.up.railway.app)

## STEP 3: Deploy Frontend to Vercel
# -----------------------------------
# 1. Go to https://vercel.com
# 2. Sign up with GitHub
# 3. Import your frontend repo (plan-B branch)
# 4. Set Environment Variable:
#    VITE_API_URL = https://your-railway-app.railway.app (from Step 2)
# 5. Deploy!

## STEP 4: Configure CORS in Backend
# -----------------------------------
# Add your Vercel URL to allowed origins in ServiceExtensions.cs
# Example: https://asu-dorms-frontend.vercel.app

## STEP 5: Test Everything
# -------------------------
# 1. Open your Vercel URL
# 2. Try logging in
# 3. Check Railway logs if issues

## TROUBLESHOOTING
# -----------------
# - CORS errors: Add Vercel URL to backend CORS config
# - Database errors: Check Railway PostgreSQL connection string
# - Build errors: Check Railway build logs

## YOUR FINAL URLs
# -----------------
# Frontend: https://your-app.vercel.app (share this with users!)
# Backend API: https://your-app.railway.app (internal use)
# Swagger: https://your-app.railway.app/swagger

Write-Host "Guide loaded! Follow the steps above."
