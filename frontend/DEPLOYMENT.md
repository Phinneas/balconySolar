# Deployment Guide - Balcony Solar Checker Frontend

## Cloudflare Pages Deployment

### Option 1: Git Integration (Recommended)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize GitHub and select your repository
   - Configure build settings:
     - **Framework preset**: None (custom)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Root directory**: `frontend`

3. **Set Environment Variables**
   - In Cloudflare Pages project settings, go to "Environment variables"
   - Add for Production:
     - `VITE_API_URL`: `https://api.solarcurrents.com`
   - Add for Preview:
     - `VITE_API_URL`: `http://localhost:8787`

4. **Deploy**
   - Cloudflare will automatically build and deploy on every push to main

### Option 2: Manual Deployment with Wrangler

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**
   ```bash
   wrangler login
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy to Cloudflare Pages**
   ```bash
   wrangler pages deploy dist
   ```

### Option 3: Direct Upload

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload dist folder**
   - Go to Cloudflare Pages
   - Create new project
   - Upload the `dist` folder directly

## Environment Configuration

### Development
- API URL: `http://localhost:8787`
- Set in `.env` file

### Production
- API URL: `https://api.solarcurrents.com`
- Set in `.env.production` or Cloudflare Pages environment variables

## Custom Domain Setup

1. **Add custom domain in Cloudflare Pages**
   - Project Settings → Custom domains
   - Add your domain (e.g., `checker.solarcurrents.com`)

2. **DNS Configuration**
   - If using Cloudflare DNS, it's automatic
   - If using external DNS, add CNAME record pointing to your Pages deployment

## Monitoring

### Check Deployment Status
- Cloudflare Pages Dashboard shows build and deployment status
- View logs for any build errors

### Performance Monitoring
- Use Cloudflare Analytics to monitor:
  - Page views
  - Request rates
  - Error rates
  - Performance metrics

## Rollback

If deployment has issues:

1. **Via Git**
   - Revert commit and push
   - Cloudflare will automatically rebuild

2. **Via Wrangler**
   - Deploy previous build:
   ```bash
   git checkout <previous-commit>
   npm run build
   wrangler pages deploy dist
   ```

## Troubleshooting

### Build Fails
- Check build logs in Cloudflare Pages dashboard
- Verify `npm run build` works locally
- Check Node.js version compatibility

### API Calls Fail
- Verify `VITE_API_URL` environment variable is set correctly
- Check CORS headers on backend API
- Verify API endpoint is accessible from Cloudflare

### Blank Page
- Check browser console for errors
- Verify `dist/index.html` exists
- Check `_redirects` file is deployed

## Performance Optimization

### Caching
- Cloudflare automatically caches static assets
- Set cache TTL in Cloudflare Page Rules if needed

### Compression
- Vite automatically generates gzipped assets
- Cloudflare serves compressed versions to compatible browsers

### CDN
- Cloudflare Pages uses global CDN
- Content is automatically cached at edge locations worldwide

## Security

### HTTPS
- All Cloudflare Pages deployments use HTTPS by default
- Automatic SSL certificate provisioning

### Headers
- Cloudflare automatically sets security headers
- Additional headers can be configured in `wrangler.toml`

### CORS
- Configure CORS on backend API to allow requests from your domain
- Example: `https://checker.solarcurrents.com`
