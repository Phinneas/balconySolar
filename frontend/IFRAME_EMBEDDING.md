# Iframe Embedding Guide

The Balcony Solar Legal State Checker can be embedded on external websites using an iframe. This guide explains how to integrate the checker into your site.

## Quick Start

To embed the checker on your website, add the following HTML code where you want the checker to appear:

```html
<iframe
  src="https://checker.solarcurrents.com"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Legal State Checker"
></iframe>
```

## Features

The embedded checker includes:

- **State Selection**: Users can select their state from a dropdown
- **Legal Status Display**: Clear indication of whether balcony solar is legal
- **Regulatory Details**: Information about interconnection, permits, outlets, and special notes
- **Resource Links**: Official links to state resources
- **Shareable URLs**: Users can copy and share state-specific URLs
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Print-Friendly**: Users can print state information

## Customization

### URL Parameters

You can pre-select a state by adding a query parameter to the iframe URL:

```html
<iframe
  src="https://checker.solarcurrents.com?state=ca"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Legal State Checker"
></iframe>
```

Valid state codes are two-letter abbreviations (e.g., `ca`, `tx`, `ny`, `fl`, etc.).

### Sizing

Adjust the `width` and `height` attributes to fit your layout:

```html
<!-- Full width, fixed height -->
<iframe
  src="https://checker.solarcurrents.com"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Legal State Checker"
></iframe>

<!-- Fixed width and height -->
<iframe
  src="https://checker.solarcurrents.com"
  width="600"
  height="800"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Legal State Checker"
></iframe>
```

## Permissions

The iframe includes the `allow="clipboard-write"` permission to enable the copy-to-clipboard functionality. This is required for users to copy shareable URLs.

## Styling

The embedded checker is self-contained and includes all necessary styling. No additional CSS is required from the parent page.

However, you can control the container styling:

```html
<div style="max-width: 800px; margin: 0 auto;">
  <iframe
    src="https://checker.solarcurrents.com"
    width="100%"
    height="800"
    frameborder="0"
    allow="clipboard-write"
    title="Balcony Solar Legal State Checker"
  ></iframe>
</div>
```

## Accessibility

The checker is fully accessible with:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility

The `title` attribute on the iframe provides context for assistive technologies.

## Browser Support

The checker works on all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Clipboard functionality not working

Ensure the `allow="clipboard-write"` permission is included in the iframe tag.

### State not loading

Verify the state code is valid (two-letter abbreviation) and the API endpoint is accessible.

### Styling issues

The checker uses CSS Grid and Flexbox. Ensure your parent page doesn't have conflicting CSS that affects the iframe.

### Performance

The checker caches data for 24 hours to minimize API calls. If you need fresh data, clear your browser cache.

## Support

For issues or questions about embedding the checker, contact support@solarcurrents.com.

## Examples

### Example 1: Embedded on a solar company website

```html
<section class="solar-checker">
  <h2>Check Balcony Solar Legality</h2>
  <p>Find out if balcony solar is legal in your state:</p>
  <iframe
    src="https://checker.solarcurrents.com"
    width="100%"
    height="800"
    frameborder="0"
    allow="clipboard-write"
    title="Balcony Solar Legal State Checker"
  ></iframe>
</section>
```

### Example 2: Pre-selected state for California

```html
<iframe
  src="https://checker.solarcurrents.com?state=ca"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
  title="Balcony Solar Legal State Checker - California"
></iframe>
```

### Example 3: Responsive container

```html
<div style="max-width: 900px; margin: 2rem auto;">
  <h2>Balcony Solar Checker</h2>
  <iframe
    src="https://checker.solarcurrents.com"
    width="100%"
    height="800"
    frameborder="0"
    allow="clipboard-write"
    title="Balcony Solar Legal State Checker"
    style="border: 1px solid #ddd; border-radius: 8px;"
  ></iframe>
</div>
```

## Data Privacy

The checker does not collect or store user data. All state selections and interactions are local to the user's browser. No personal information is transmitted to external servers beyond the API calls to fetch state data.

## License

The Balcony Solar Legal State Checker is provided by SolarCurrents. For licensing information, visit solarcurrents.com.
