# Balcony Solar Checker - Embedding Instructions

## Overview

The Balcony Solar Checker can be embedded on your website using an iframe. This allows your customers to check balcony solar legality in their state directly from your site, providing value and capturing leads.

**Embedding Method**: iframe
**No Additional Dependencies**: React, CSS, and all dependencies are bundled
**Responsive**: Works on desktop, tablet, and mobile
**Customizable**: Supports URL parameters for pre-selected states

---

## Quick Start

### Basic Embedding

Add this single line of HTML to your website:

```html
<iframe 
  src="https://checker.solarcurrents.com" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  title="Balcony Solar Checker">
</iframe>
```

That's it! The checker will load and work independently on your page.

### Recommended Embedding

For better styling and responsiveness:

```html
<div style="max-width: 800px; margin: 20px auto;">
  <h2>Check Balcony Solar Legality in Your State</h2>
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker"
    style="border: 1px solid #e0e0e0; border-radius: 8px;">
  </iframe>
</div>
```

---

## URL Parameters

Pre-select a state by adding a query parameter to the iframe URL:

```html
<iframe 
  src="https://checker.solarcurrents.com?state=ca" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  title="Balcony Solar Checker">
</iframe>
```

**Supported Parameters**:
- `state`: Two-letter state code (e.g., `ca`, `ny`, `ut`)

**Examples**:
```html
<!-- California -->
<iframe src="https://checker.solarcurrents.com?state=ca" ...></iframe>

<!-- New York -->
<iframe src="https://checker.solarcurrents.com?state=ny" ...></iframe>

<!-- Texas -->
<iframe src="https://checker.solarcurrents.com?state=tx" ...></iframe>
```

---

## Iframe Attributes

### Required Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `src` | URL | Checker URL (with optional state parameter) |
| `width` | `100%` or pixels | Width of iframe (100% recommended for responsiveness) |
| `height` | pixels | Height of iframe (600px recommended) |
| `frameborder` | `0` | Remove border around iframe |
| `title` | text | Accessibility label for screen readers |

### Recommended Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `allow` | `clipboard-write` | Allow copy-to-clipboard functionality |
| `style` | CSS | Add border, border-radius, margin, etc. |
| `sandbox` | `allow-same-origin allow-scripts allow-popups allow-forms` | Security sandbox (optional) |

### Full Example

```html
<iframe 
  src="https://checker.solarcurrents.com?state=ca"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Checker"
  style="border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms">
</iframe>
```

---

## Responsive Sizing

### Mobile-First Approach

```html
<div style="width: 100%; max-width: 800px; margin: 0 auto;">
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker">
  </iframe>
</div>
```

### Dynamic Height (JavaScript)

For better UX, adjust iframe height based on content:

```html
<iframe 
  id="solar-checker"
  src="https://checker.solarcurrents.com" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  title="Balcony Solar Checker">
</iframe>

<script>
  // Adjust iframe height when content changes
  const iframe = document.getElementById('solar-checker');
  
  iframe.addEventListener('load', function() {
    try {
      const height = iframe.contentDocument.body.scrollHeight;
      iframe.style.height = (height + 20) + 'px';
    } catch (e) {
      // Cross-origin, use default height
      console.log('Cannot access iframe content (cross-origin)');
    }
  });
</script>
```

---

## Styling and Customization

### Container Styling

```html
<div style="
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
">
  <h2 style="margin-top: 0; color: #333;">
    Check Balcony Solar Legality
  </h2>
  <p style="color: #666; margin-bottom: 20px;">
    Find out if balcony solar is legal in your state and what regulations apply.
  </p>
  
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker"
    style="border: none; border-radius: 8px;">
  </iframe>
</div>
```

### Dark Mode Support

The checker automatically adapts to your site's color scheme:

```html
<!-- Light mode (default) -->
<iframe src="https://checker.solarcurrents.com" ...></iframe>

<!-- Dark mode (if your site uses prefers-color-scheme) -->
<style>
  @media (prefers-color-scheme: dark) {
    iframe {
      filter: invert(1) hue-rotate(180deg);
    }
  }
</style>
```

---

## Integration Examples

### WordPress

Add to page/post using HTML block:

```html
<div style="max-width: 800px; margin: 20px auto;">
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker">
  </iframe>
</div>
```

### Shopify

Add to product page or custom page:

```liquid
<div style="max-width: 800px; margin: 20px auto;">
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker">
  </iframe>
</div>
```

### React Component

```jsx
export function SolarCheckerEmbed({ state = null }) {
  const url = state 
    ? `https://checker.solarcurrents.com?state=${state}`
    : 'https://checker.solarcurrents.com';

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <h2>Check Balcony Solar Legality</h2>
      <iframe 
        src={url}
        width="100%"
        height="600"
        frameBorder="0"
        allow="clipboard-write"
        title="Balcony Solar Checker"
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}
      />
    </div>
  );
}
```

### Vue Component

```vue
<template>
  <div style="max-width: 800px; margin: 20px auto;">
    <h2>Check Balcony Solar Legality</h2>
    <iframe 
      :src="checkerUrl"
      width="100%"
      height="600"
      frameborder="0"
      allow="clipboard-write"
      title="Balcony Solar Checker"
      style="border: 1px solid #e0e0e0; border-radius: 8px;">
    </iframe>
  </div>
</template>

<script>
export default {
  props: {
    state: String
  },
  computed: {
    checkerUrl() {
      const baseUrl = 'https://checker.solarcurrents.com';
      return this.state ? `${baseUrl}?state=${this.state}` : baseUrl;
    }
  }
}
</script>
```

---

## Use Cases

### 1. Lead Generation

Embed on your homepage to capture leads:

```html
<section style="background: #f0f8ff; padding: 40px 20px;">
  <div style="max-width: 800px; margin: 0 auto;">
    <h2>Is Balcony Solar Legal in Your State?</h2>
    <p>Find out instantly with our free checker.</p>
    
    <iframe 
      src="https://checker.solarcurrents.com" 
      width="100%" 
      height="600" 
      frameborder="0" 
      allow="clipboard-write"
      title="Balcony Solar Checker">
    </iframe>
    
    <p style="text-align: center; margin-top: 20px;">
      <strong>Interested in installing balcony solar?</strong><br>
      <a href="/contact">Contact us for a free consultation</a>
    </p>
  </div>
</section>
```

### 2. Product Page

Embed on product pages to help customers verify legality:

```html
<div style="margin: 40px 0;">
  <h3>Check Your State's Regulations</h3>
  <p>Before purchasing, verify that balcony solar is legal in your state:</p>
  
  <iframe 
    src="https://checker.solarcurrents.com" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="clipboard-write"
    title="Balcony Solar Checker">
  </iframe>
</div>
```

### 3. Blog Post

Embed in blog content about balcony solar:

```html
<article>
  <h1>Balcony Solar: Everything You Need to Know</h1>
  
  <p>Before installing a balcony solar system, you need to check your state's regulations...</p>
  
  <h2>Check Your State's Legality</h2>
  <p>Use our interactive checker to find out if balcony solar is legal in your state:</p>
  
  <div style="max-width: 800px; margin: 20px auto;">
    <iframe 
      src="https://checker.solarcurrents.com" 
      width="100%" 
      height="600" 
      frameborder="0" 
      allow="clipboard-write"
      title="Balcony Solar Checker">
    </iframe>
  </div>
  
  <p>Once you've confirmed legality, here are the next steps...</p>
</article>
```

### 4. Comparison Page

Embed to help customers compare states:

```html
<section>
  <h2>Compare Balcony Solar Regulations by State</h2>
  
  <p>Use our checker to compare regulations across different states:</p>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <div>
      <h3>California</h3>
      <iframe 
        src="https://checker.solarcurrents.com?state=ca" 
        width="100%" 
        height="500" 
        frameborder="0" 
        allow="clipboard-write"
        title="Balcony Solar Checker - California">
      </iframe>
    </div>
    
    <div>
      <h3>New York</h3>
      <iframe 
        src="https://checker.solarcurrents.com?state=ny" 
        width="100%" 
        height="500" 
        frameborder="0" 
        allow="clipboard-write"
        title="Balcony Solar Checker - New York">
      </iframe>
    </div>
  </div>
</section>
```

---

## Performance Optimization

### Lazy Loading

Load iframe only when visible:

```html
<iframe 
  src="https://checker.solarcurrents.com" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  title="Balcony Solar Checker"
  loading="lazy">
</iframe>
```

### Preload

Preload checker for faster loading:

```html
<link rel="preconnect" href="https://checker.solarcurrents.com">
<link rel="dns-prefetch" href="https://api.checker.solarcurrents.com">

<iframe 
  src="https://checker.solarcurrents.com" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  title="Balcony Solar Checker">
</iframe>
```

---

## Troubleshooting

### Issue: Iframe not loading

**Solution**:
1. Verify URL is correct: `https://checker.solarcurrents.com`
2. Check browser console for errors
3. Verify your site allows iframes (no X-Frame-Options header)
4. Clear browser cache and reload

### Issue: Copy-to-clipboard not working

**Solution**:
1. Add `allow="clipboard-write"` attribute to iframe
2. Ensure site is served over HTTPS
3. Check browser permissions for clipboard access

### Issue: Iframe too small/large

**Solution**:
1. Adjust `height` attribute (recommended: 600px)
2. Use responsive sizing with max-width container
3. Test on different devices

### Issue: State parameter not working

**Solution**:
1. Verify state code is lowercase (e.g., `ca` not `CA`)
2. Check URL encoding: `?state=ca`
3. Verify state code is valid (2 letters)

### Issue: Styling doesn't match my site

**Solution**:
1. The checker has its own styling and cannot be customized
2. Wrap in container with your site's styling
3. Use CSS filters for dark mode support

---

## Security Considerations

### Sandbox Attribute

For additional security, use the sandbox attribute:

```html
<iframe 
  src="https://checker.solarcurrents.com" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allow="clipboard-write"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
  title="Balcony Solar Checker">
</iframe>
```

### HTTPS Required

Always use HTTPS URLs:
- ✅ `https://checker.solarcurrents.com`
- ❌ `http://checker.solarcurrents.com`

### Content Security Policy

If your site uses CSP, allow the checker domain:

```html
<meta http-equiv="Content-Security-Policy" 
  content="frame-src https://checker.solarcurrents.com;">
```

---

## Analytics and Tracking

### Track Checker Usage

Add event tracking when users interact with the checker:

```html
<script>
  // Track when checker loads
  document.addEventListener('load', function(e) {
    if (e.target.src && e.target.src.includes('checker.solarcurrents.com')) {
      gtag('event', 'solar_checker_loaded');
    }
  }, true);
</script>
```

### Google Analytics

Track checker interactions:

```html
<script>
  function trackSolarChecker(action) {
    gtag('event', 'solar_checker_interaction', {
      'event_category': 'engagement',
      'event_label': action
    });
  }
</script>
```

---

## Support and Feedback

### Report Issues

If you encounter issues with the embedded checker:
1. Document the issue with screenshots
2. Include your website URL
3. Contact: support@solarcurrents.com

### Feature Requests

Have ideas for improvements?
- Email: feedback@solarcurrents.com
- Include your use case and suggestions

### Get Help

For embedding questions:
- Documentation: https://docs.solarcurrents.com
- Email: support@solarcurrents.com
- Phone: 1-800-SOLAR-HELP

---

## Terms of Use

By embedding the Balcony Solar Checker on your website, you agree to:

1. **Attribution**: Display "Powered by SolarCurrents" near the checker
2. **No Modification**: Do not modify or alter the checker appearance
3. **Accuracy**: Verify data accuracy before relying on it
4. **Liability**: SolarCurrents is not liable for legal consequences of checker results
5. **Availability**: SolarCurrents may modify or discontinue the checker at any time

---

## Examples Repository

View more embedding examples:
- GitHub: https://github.com/solarcurrents/checker-examples
- CodePen: https://codepen.io/solarcurrents/

</content>
</invoke>