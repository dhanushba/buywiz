# BuyWiz Production Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy BuyWiz to production on Render.com with a public HTTPS URL.

## Prerequisites
- A GitHub account with the BuyWiz repository pushed
- A Render.com account (https://render.com)
- A MongoDB Atlas account (https://www.mongodb.com/cloud/atlas) with a deployed cluster
- A Gmail account with an app password configured for OAuth
- API keys for third-party services (SerpAPI, Abstract API, BrightData - if applicable)

## Step 1: Prepare Your Repository

### 1.1 Update .gitignore to Exclude Secrets
Ensure `.env` is in `.gitignore` (already done in the project):
```bash
# Verify .env is not in git history
git status .env
```

### 1.2 Ensure All Code is Committed
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

## Step 2: Configure MongoDB Atlas

### 2.1 Create/Access MongoDB Atlas Cluster
1. Log in to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Navigate to your cluster
3. Go to **Database Access** and create a database user:
   - Username: `buywiz_prod`
   - Password: Generate a strong password
   - Permissions: Read and write to any database

### 2.2 Get Connection String
1. In MongoDB Atlas, click **Connect** on your cluster
2. Select **Drivers** > **Node.js**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Connection string format:
   ```
   mongodb+srv://buywiz_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/buywiz?retryWrites=true&w=majority
   ```

### 2.3 Allow Render IP Addresses
1. In MongoDB Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Click **ALLOW ACCESS FROM ANYWHERE** (or add `0.0.0.0/0`)
   - This is necessary because Render's IPs are dynamic
4. Click **Confirm**

## Step 3: Configure Gmail for Email Notifications

### 3.1 Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled

### 3.2 Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows Computer** (or your device)
3. Click **Generate**
4. Copy the generated app password (16 characters)
5. You'll use this as `GMAIL_APP_PASSWORD` in Render environment variables

## Step 4: Deploy to Render

### 4.1 Create a New Web Service
1. Go to https://render.com/dashboard
2. Click **New +** > **Web Service**
3. Connect your GitHub repository with the BuyWiz code
4. Select the repository and click **Connect**

### 4.2 Configure Web Service
Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `buywiz` |
| **Environment** | `Docker` |
| **Region** | Choose closest to your users (e.g., `Oregon`) |
| **Branch** | `main` |
| **Dockerfile Path** | `Dockerfile` |
| **Plan** | Free (or Starter) |

### 4.3 Set Environment Variables
Click **Environment** and add the following variables:

```
MONGODB_URI=mongodb+srv://buywiz_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/buywiz?retryWrites=true&w=majority
NODE_ENV=production
GMAIL_USER_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
ABSTRACT_KEY=your-abstract-api-key
SERPAPI_KEY=your-serpapi-key
BRIGHT_DATA_USERNAME=your-bright-data-username (optional)
BRIGHT_DATA_PASSWORD=your-bright-data-password (optional)
CHROMIUM_PATH=/usr/bin/chromium
PORT=3000
```

### 4.4 Configure Health Check
1. In the Render service settings, find **Health Check**
2. Set:
   - **Path**: `/api/health`
   - **Check interval**: `30s`
   - **Timeout**: `10s`

### 4.5 Deploy
1. Click **Create Web Service**
2. Render will automatically build and deploy your application
3. Wait for the build and deployment to complete (5-10 minutes)
4. Once deployed, you'll see a URL like: `https://buywiz-xxxxx.onrender.com`

## Step 5: Verify Deployment

### 5.1 Test the Application
1. Open your Render URL: `https://buywiz-xxxxx.onrender.com`
2. Test the following:
   - Homepage loads correctly
   - Navigation works
   - Search functionality works
   - Product tracking functionality works

### 5.2 Check Health Endpoint
```bash
curl https://buywiz-xxxxx.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-31T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### 5.3 Monitor Logs
In Render dashboard:
1. Go to your BuyWiz service
2. Click **Logs**
3. Monitor for any errors

Common issues:
- Missing environment variables → Add them in Environment settings
- MongoDB connection failed → Verify connection string and IP allowlist
- Email sending failed → Verify Gmail credentials

## Step 6: Keep Your Service Running

### 6.1 Prevent Render Shutdown
By default, Render puts free services to sleep after 15 minutes of inactivity.

**Option A: Upgrade to Starter Plan**
- Click **Settings** > **Plan** > **Starter** ($7/month)

**Option B: Keep Service Active**
- Use an uptime monitor like UptimeRobot (https://uptimerobot.com)
- Configure it to ping `https://buywiz-xxxxx.onrender.com/api/health` every 5 minutes

### 6.2 Auto-Deploy on Git Push
1. In Render service settings, find **Auto-Deploy**
2. Enable **Auto-Deploy** for your repository
3. Now every git push to `main` will automatically redeploy

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain
1. In Render service settings, find **Custom Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `buywiz.com`)
4. Follow DNS configuration instructions for your domain registrar

## Troubleshooting

### Application Won't Start
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Check for TypeScript compilation errors
4. Ensure Dockerfile is correct

### MongoDB Connection Issues
```
ERROR: MONGODB_URI is not defined
```
Solution: Add MONGODB_URI to Render environment variables

### Email Sending Fails
```
❌ Email sending failed: Invalid login
```
Solution: Verify GMAIL_USER_EMAIL and GMAIL_APP_PASSWORD are correct

### Scraper Issues
```
❌ Chromium not found
```
Solution: Already handled in Docker - verify Dockerfile has `apk add chromium`

### Port Binding Error
```
ERROR: Port 3000 already in use
```
Solution: Not an issue on Render; restart the service in Render dashboard

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `GMAIL_USER_EMAIL` | ✅ Yes | Gmail sender email | `buywiz@gmail.com` |
| `GMAIL_APP_PASSWORD` | ✅ Yes | Gmail app-specific password | `xxxx xxxx xxxx xxxx` |
| `ABSTRACT_KEY` | ❌ Optional | Email validation API key | `abc123def456` |
| `SERPAPI_KEY` | ❌ Optional | Google Shopping API key | `abc123def456` |
| `BRIGHT_DATA_USERNAME` | ❌ Optional | BrightData proxy username | `user123` |
| `BRIGHT_DATA_PASSWORD` | ❌ Optional | BrightData proxy password | `pass123` |
| `CHROMIUM_PATH` | ❌ Optional | Path to Chromium binary | `/usr/bin/chromium` |
| `PORT` | ❌ Optional | Server port | `3000` |

## Docker Build Details

The Dockerfile uses a multi-stage build process:
1. **Builder Stage**: Installs dependencies and builds the Next.js application
2. **Production Stage**: Copies only necessary files for production
3. **Security**: Runs as non-root user (nodejs)
4. **Health Checks**: Configured for Render orchestration

## Performance Notes

### Initial Deployment
- First deployment may take 5-10 minutes due to:
  - Docker image build
  - npm dependency installation
  - Next.js compilation
  - Chromium binary availability

### Cold Starts
- If using free plan, service may sleep after 15 minutes
- First request after sleep will have ~30s delay
- Upgrade to Starter plan for consistent performance

### Database Connection
- MongoDB Atlas connection pool: 100 connections max
- BuyWiz uses persistent connection pooling
- Sufficient for small to medium traffic

## Security Considerations

1. **Never commit .env to Git** ✅
2. **Use strong MongoDB passwords** ✅
3. **Enable 2FA on Gmail account** ✅
4. **Use app-specific passwords (not account password)** ✅
5. **Restrict MongoDB IP access** (Allow Render range)
6. **Use HTTPS only** ✅ (Render provides free SSL)
7. **Rotate API keys periodically** 

## Monitoring & Maintenance

### Weekly Tasks
- Check Render logs for errors
- Monitor application performance
- Verify email notifications are working

### Monthly Tasks
- Review MongoDB usage
- Check for dependency updates
- Verify all features are working

## Getting Help

- **Render Support**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Atlas Help**: https://docs.mongodb.com/atlas
- **GitHub Issues**: Create issue in your repository

## Deployment Checklist

- [ ] .env file is in .gitignore
- [ ] All credentials removed from code
- [ ] .env.example created with placeholder values
- [ ] Dockerfile configured for production
- [ ] Health check endpoint implemented (/api/health)
- [ ] MongoDB Atlas cluster running
- [ ] MongoDB user created with strong password
- [ ] IP allowlist configured in MongoDB
- [ ] Gmail app password generated
- [ ] Render account created
- [ ] Environment variables configured in Render
- [ ] Web service deployed successfully
- [ ] Health check passes
- [ ] Application accessible at public URL
- [ ] Email functionality tested
- [ ] Scraping functionality tested (if applicable)
- [ ] Auto-deploy enabled
- [ ] Uptime monitoring configured (for free plan)

## Final Steps

Once deployed, share your public URL:
```
https://buywiz-xxxxx.onrender.com
```

BuyWiz is now live and accessible to anyone on the internet! 🎉
