# Render Deployment - Quick Setup Guide

## 🚀 **Step 1: Go to Render**
https://render.com/dashboard

---

## 🔧 **Step 2: Create Web Service**

1. Click **New +**
2. Select **Web Service**
3. Click **Connect Repository**
4. Search and select: `dhanushba/buywiz`
5. Click **Connect**

---

## ⚙️ **Step 3: Configure Service**

Fill in these exact values:

| Setting | Value |
|---------|-------|
| Name | `buywiz` |
| Environment | `Docker` |
| Region | `Singapore` (or your choice) |
| Branch | `master` |
| Dockerfile Path | `Dockerfile` |
| Plan | `Free` |

---

## 🔐 **Step 4: Add Environment Variables**

Click **Environment** and add these variables:

```
MONGODB_URI
mongodb+srv://BuyWiz:BuyWiz11%40DDG@cluster0.i11x9.mongodb.net/buywiz?retryWrites=true&w=majority

NODE_ENV
production

GMAIL_USER_EMAIL
buywiz11@gmail.com

GMAIL_APP_PASSWORD
zarz fqpv iglh arux

SERPAPI_KEY
25356b3e08b0d6a4963ac924c743d794427b5881a4995f4d6c23f1dd93cb6fbb

ABSTRACT_KEY
d40337d8cf6b4d2aa3626feabfe003f6

CHROMIUM_PATH
/usr/bin/chromium

PORT
3000
```

---

## 🏥 **Step 5: Configure Health Check**

Scroll to **Health Check** section:

| Setting | Value |
|---------|-------|
| Path | `/api/health` |
| Check Interval | `30s` |
| Timeout | `10s` |
| Retries | `3` |

---

## ✅ **Step 6: Deploy**

Click **Create Web Service**

⏳ Wait 5-10 minutes...

---

## 🎉 **Step 7: Get Your URL**

You'll see something like:
```
https://buywiz-xxxxx.onrender.com
```

**Test it:**
- Open: `https://buywiz-xxxxx.onrender.com`
- Open: `https://buywiz-xxxxx.onrender.com/api/health`

Both should work! ✅

---

## 📝 **Notes**

- The deployment will take 5-10 minutes
- Check **Logs** tab to see build progress
- If it fails, share the error log with me

---

## 🎯 **Final Result**

Once deployed, you have:
- ✅ Public HTTPS URL: `https://buywiz-xxxxx.onrender.com`
- ✅ Auto-deploys on git push
- ✅ MongoDB connected
- ✅ Email notifications enabled
- ✅ Health monitoring

**Done!** 🚀
