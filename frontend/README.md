# Balcony Solar Legal State Checker - Frontend

React + Vite frontend for the Balcony Solar Legal State Checker application.

## Setup

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and update the API URL:

```bash
cp .env.example .env
```

For development, the default API URL is `http://localhost:8787`.
For production, update `.env.production` with your production API endpoint.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build

Build for production:

```bash
npm run build
```

Output will be in the `dist` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Deployment to Cloudflare Pages

### Prerequisites
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

### Deploy

1. Build the project:
```bash
npm run build
```

2. Deploy to Cloudflare Pages:
```bash
wrangler pages deploy dist
```

Or connect your Git repository to Cloudflare Pages for automatic deployments on push.

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Main app component
│   ├── App.css           # App styles
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── vitest.config.js      # Vitest configuration
├── wrangler.toml         # Cloudflare Pages config
├── .env.example          # Environment variables template
├── .env.production       # Production environment variables
└── package.json          # Dependencies and scripts
```

## API Integration

The frontend communicates with the backend API at the URL specified in environment variables:

- Development: `http://localhost:8787`
- Production: `https://api.solarcurrents.com` (or your production URL)

### API Endpoints Used

- `GET /api/states` - Fetch all states
- `GET /api/states/:code` - Fetch specific state details

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Vite provides fast development and optimized production builds
- CSS is minified and optimized
- JavaScript is minified with Terser
- API responses are cached for 24 hours on the backend
