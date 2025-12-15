# Frontend Deployment Checklist - Balcony Solar Checker

## Pre-Deployment Verification

- [x] Production build completes successfully
  - Command: `npm run build`
  - Output: `dist/` folder with `index.html`, `assets/`, and `_redirects`
  - Build time: ~350ms
  - All tests pass: 249 tests passing

- [x] All tests pass
  - Unit tests: ✓ passing
  - Property-based tests: ✓ passing
  - E2E tests: ✓ passing
  - Test count: 249 tests across 16 test files

- [x] Build artifacts verified
  - `dist/index.html`: 480 bytes (gzipped: 320 bytes)
  - `dist/assets/index-*.js`: 148.99 KB (gzipped: 47.96 KB)
  - `dist/assets/index-*.css`: 2.98 KB (gzipped: 1.09 KB)
  - `dist/_redirects`: SPA routing configured

- [x] Environment configuration ready
  - Production API URL: `https://api.solarcurrents.com`
  - Development API URL: `http://localhost:8787`
  - Environment variables configured in `.env.production`

## Deployment Steps

### Option 1: Git Integration (Recommended)

1. **Ensure code is committed**
   ```bash
   git status
   git add .
   git commit -m "Deploy frontend to Cloudflare Pages"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize GitHub and select repository
   - Configure build settings:
     - **Framework preset**: None (custom)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Root directory**: `frontend`

3. **Set Environment Variables in Cloudflare Pages**
   - Project Settings → Environment variables
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

3. **Deploy to Cloudflare Pages**
   ```bash
   cd frontend
   npm run build
   wrangler pages deploy dist
   ```

### Option 3: Direct Upload

1. **Build the project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload dist folder**
   - Go to Cloudflare Pages
   - Create new project
   - Upload the `dist` folder directly

## Post-Deployment Verification

### Immediate Checks (within 5 minutes)

- [ ] Deployment completes without errors
  - Check Cloudflare Pages dashboard for build status
  - Verify no build errors in logs

- [ ] Frontend loads successfully
  - Visit deployment URL
  - Verify page renders without errors
  - Check browser console for errors

- [ ] State selector works
  - Select a state from dropdown/buttons
  - Verify results load from API

- [ ] API connectivity verified
  - Check network tab in browser DevTools
  - Verify API calls to `https://api.solarcurrents.com`
  - Confirm responses contain state data

### Functional Tests (within 15 minutes)

- [ ] State selection and display
  - Select multiple states
  - Verify legal status displays correctly
  - Verify wattage limits display
  - Verify key laws display

- [ ] URL parameter handling
  - Test shareable URL: `?state=ca`
  - Verify state auto-loads from URL
  - Test copy-to-clipboard functionality

- [ ] Responsive design
  - Test on mobile (320px width)
  - Test on tablet (768px width)
  - Test on desktop (1024px+ width)
  - Verify no horizontal scrolling

- [ ] Print functionality
  - Test print preview
  - Verify print-friendly styling applied
  - Verify unnecessary UI elements hidden

- [ ] Iframe embedding
  - Test embedding in external page
  - Verify functionality within iframe
  - Verify no console errors

### Performance Checks (within 30 minutes)

- [ ] Page load time
  - Target: < 2 seconds
  - Use Cloudflare Analytics or browser DevTools

- [ ] API response time
  - Target: < 500ms
  - Check network tab in DevTools

- [ ] Cache effectiveness
  - Verify 24-hour cache headers
  - Check Cloudflare cache hit rate

### Custom Domain Setup

- [ ] Add custom domain in Cloudflare Pages
  - Project Settings → Custom domains
  - Add domain: `checker.solarcurrents.com` or `/checker` path

- [ ] DNS configuration
  - If using Cloudflare DNS: automatic
  - If using external DNS: add CNAME record

- [ ] SSL/TLS verification
  - Verify HTTPS works
  - Check certificate is valid

## Rollback Plan

If deployment has issues:

1. **Via Git**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Cloudflare will automatically rebuild
   ```

2. **Via Wrangler**
   ```bash
   git checkout <previous-commit>
   npm run build
   wrangler pages deploy dist
   ```

3. **Via Cloudflare Dashboard**
   - Go to Deployments
   - Click on previous successful deployment
   - Click "Rollback to this deployment"

## Troubleshooting

### Build Fails
- Check build logs in Cloudflare Pages dashboard
- Verify `npm run build` works locally
- Check Node.js version (should be 18+)
- Verify all dependencies installed: `npm install`

### Blank Page
- Check browser console for errors
- Verify `dist/index.html` exists
- Check `_redirects` file is deployed
- Clear browser cache and reload

### API Calls Fail
- Verify `VITE_API_URL` environment variable is set
- Check API endpoint is accessible
- Verify CORS headers on backend API
- Check network tab in DevTools for error details

### Slow Performance
- Check Cloudflare cache settings
- Verify API response times
- Check for large uncompressed assets
- Review Cloudflare Analytics

## Monitoring

### Uptime Monitoring
- Set up Cloudflare Page Rules for monitoring
- Configure alerts for downtime

### Performance Monitoring
- Use Cloudflare Analytics for:
  - Page views
  - Request rates
  - Error rates
  - Performance metrics

### Error Tracking
- Monitor browser console errors
- Set up error logging service (optional)
- Review Cloudflare error logs

## Success Criteria

✓ All 249 tests passing
✓ Production build completes successfully
✓ Frontend loads without errors
✓ State selection works correctly
✓ API connectivity verified
✓ Responsive design verified
✓ Print functionality works
✓ Iframe embedding works
✓ Custom domain configured
✓ HTTPS/SSL verified
✓ Performance meets targets (< 2s page load, < 500ms API)

## Deployment Status

**Current Status**: Ready for deployment
**Build Status**: ✓ Passing
**Test Status**: ✓ All 249 tests passing
**Last Build**: 2024-12-13 02:16 UTC
**Build Time**: 336ms
**Bundle Size**: 148.99 KB (gzipped: 47.96 KB)

