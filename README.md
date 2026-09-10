# CommentRank — Official Facebook Post Comments Ranker & Giveaway Platform

CommentRank is an enterprise-ready full-stack application designed for Facebook Page and Community administrators to officially aggregate, rank, and pick giveaway winners from Facebook post comments using the official Meta Graph API.

---

## 1. Official Meta Developer Portal Setup Guide

To access comments legally and reliably through Facebook's official API, you must configure a Meta App:

### Step 1: Create Meta Developer Account & App
1. Go to [developers.facebook.com](https://developers.facebook.com/) and register as a Meta Developer.
2. Click **Create App** and select **Business** or **Other** as the use-case.
3. Name your app (e.g., `CommentRank Platform`) and link your Meta Business Manager account.

### Step 2: Add Facebook Login Product
1. Under your Meta App Dashboard, navigate to **Add Products** -> Select **Facebook Login** -> **Set Up**.
2. Select **Web** as the platform.
3. Under **Facebook Login -> Settings**, enter your production redirect URI into **Valid OAuth Redirect URIs**:
   ```text
   [https://yourdomain.com/api/auth/facebook/callback](https://yourdomain.com/api/auth/facebook/callback)
