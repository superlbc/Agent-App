# Tailwind CSS Installation Guide (React + Vite + TypeScript)

This guide shows you how to install Tailwind CSS properly in a React + Vite + TypeScript project (no CDN).

## Framework Requirements

- **React**: 18.x or higher
- **Vite**: 5.x or higher
- **TypeScript**: 5.x or higher
- **Node.js**: 18.x or higher

## Step 1: Install Dependencies

Install Tailwind CSS v4 and its dependencies:

```bash
npm install -D @tailwindcss/postcss@latest @tailwindcss/vite@latest postcss@latest autoprefixer@latest
```

**What this installs:**
- `@tailwindcss/postcss` - Tailwind CSS v4 PostCSS plugin
- `@tailwindcss/vite` - Tailwind CSS v4 Vite plugin (optional)
- `postcss` - CSS transformation tool
- `autoprefixer` - Adds vendor prefixes automatically

## Step 2: Create PostCSS Configuration

Create `postcss.config.js` in your project root:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

## Step 3: Create CSS Entry File

Create `src/index.css` with Tailwind v4 directives:

```css
@import "tailwindcss";

/* Add your custom theme configuration */
@theme {
  /* Custom font family */
  --font-family-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* Custom colors */
  --color-primary-50: hsl(210 90% 95%);
  --color-primary-100: hsl(210 90% 90%);
  --color-primary-200: hsl(210 90% 80%);
  --color-primary-300: hsl(210 90% 70%);
  --color-primary-400: hsl(210 90% 60%);
  --color-primary-500: hsl(210 90% 50%);
  --color-primary-600: hsl(210 90% 45%);
  --color-primary-700: hsl(210 90% 40%);
  --color-primary-800: hsl(210 90% 30%);
  --color-primary-900: hsl(210 90% 20%);
  --color-primary-950: hsl(210 90% 10%);
  --color-primary-DEFAULT: hsl(210 90% 50%);

  /* Custom animations */
  --animate-fade-in: fade-in 0.2s ease-out forwards;
  --animate-slide-in: slide-in 0.3s ease-out forwards;
}

/* Define your keyframe animations */
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in {
  0% { transform: translateX(100%); }
  100% { transform: translateX(0); }
}

/* Add any custom CSS classes or utilities */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}
```

**Tailwind v4 Changes:**
- No more JavaScript config file (`tailwind.config.js`)
- Configuration is now CSS-based using `@theme` directive
- Use CSS variables for theme customization
- `@import "tailwindcss"` replaces the old `@tailwind` directives

## Step 4: Import CSS in Your Entry File

Update `index.tsx` or `main.tsx` to import the CSS:

```typescript
import './src/index.css'; // Add this at the very top
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// ... rest of your imports
```

**Important:** The CSS import must be the **first import** in your file.

## Step 5: Update package.json

Add `"type": "module"` to `package.json` to eliminate PostCSS warnings:

```json
{
  "name": "your-app-name",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Step 6: Remove CDN Script from HTML

If you were using Tailwind CDN, remove it from `index.html`:

**Remove these lines:**
```html
<!-- DELETE THIS -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    // ... config
  }
</script>
```

**Keep only:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

## Step 7: Test Your Setup

Run the development server:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

**Expected output:**
```
✓ 371 modules transformed.
rendering chunks...
dist/index.html                    3.44 kB
dist/assets/index-XXXXX.css       79.02 kB │ gzip:  13.22 kB
dist/assets/index-XXXXX.js     1,168.70 kB │ gzip: 299.49 kB
✓ built in 4.74s
```

## Tailwind v4 CSS Configuration Reference

### Colors

```css
@theme {
  /* Define custom colors using CSS variables */
  --color-brand-50: #f0f9ff;
  --color-brand-500: #3b82f6;
  --color-brand-900: #1e3a8a;
  --color-brand-DEFAULT: #3b82f6; /* Used for bg-brand, text-brand */
}
```

**Usage in components:**
```tsx
<div className="bg-brand text-white">...</div>
<div className="bg-brand-500 hover:bg-brand-600">...</div>
```

### Fonts

```css
@theme {
  --font-family-sans: Inter, system-ui, sans-serif;
  --font-family-mono: "Fira Code", monospace;
}
```

**Usage:**
```tsx
<p className="font-sans">...</p>
<code className="font-mono">...</code>
```

### Spacing

```css
@theme {
  --spacing-xs: 0.5rem;  /* Use as: p-xs, m-xs */
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
}
```

### Animations

```css
@theme {
  --animate-bounce: bounce 1s infinite;
  --animate-spin: spin 1s linear infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25%); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Usage:**
```tsx
<div className="animate-bounce">...</div>
<div className="animate-spin">...</div>
```

### Dark Mode

Dark mode is enabled by default in Tailwind v4. Use the `dark:` variant:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content adapts to dark mode
</div>
```

**Enable dark mode in your app:**
```typescript
// Add 'dark' class to <html> element
document.documentElement.classList.add('dark');

// Or use system preference
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}
```

## Troubleshooting

### Error: "It looks like you're trying to use tailwindcss directly as a PostCSS plugin"

**Fix:** You installed the old `tailwindcss` package. Uninstall it and use the new packages:

```bash
npm uninstall tailwindcss
npm install -D @tailwindcss/postcss@latest @tailwindcss/vite@latest
```

### Warning: "Module type of postcss.config.js is not specified"

**Fix:** Add `"type": "module"` to `package.json`:

```json
{
  "type": "module"
}
```

### Styles not applying in development

**Fix:** Make sure you:
1. Imported `src/index.css` in `index.tsx` (as the first import)
2. Used `@import "tailwindcss"` in `src/index.css`
3. Restarted the dev server (`npm run dev`)

### Build fails with CSS syntax error

**Fix:** Check that your `@theme` block uses valid CSS variable syntax:

```css
/* ✅ CORRECT */
@theme {
  --color-primary-500: #3b82f6;
}

/* ❌ WRONG */
@theme {
  colors: {
    primary: { 500: '#3b82f6' }
  }
}
```

## Migration from Tailwind v3

If you're migrating from Tailwind v3:

1. **Uninstall old package:**
   ```bash
   npm uninstall tailwindcss
   ```

2. **Install v4 packages:**
   ```bash
   npm install -D @tailwindcss/postcss@latest @tailwindcss/vite@latest
   ```

3. **Convert `tailwind.config.js` to CSS:**

   **Old (tailwind.config.js):**
   ```javascript
   export default {
     theme: {
       extend: {
         colors: {
           primary: '#3b82f6'
         }
       }
     }
   }
   ```

   **New (src/index.css):**
   ```css
   @theme {
     --color-primary-DEFAULT: #3b82f6;
   }
   ```

4. **Delete `tailwind.config.js`** - no longer needed in v4

5. **Update `postcss.config.js`:**
   ```javascript
   // Change 'tailwindcss' to '@tailwindcss/postcss'
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```

## Benefits of npm Installation vs CDN

✅ **Production-ready** - No console warnings
✅ **Smaller bundles** - Only includes classes you use (~79KB vs 3MB+ CDN)
✅ **Better performance** - Optimized CSS with tree-shaking and purging
✅ **Vendor prefixes** - Autoprefixer adds browser compatibility automatically
✅ **Custom themes** - Full control over design tokens and theme configuration
✅ **Type safety** - TypeScript autocomplete for custom theme values
✅ **Build-time optimizations** - Minification, compression, and PostCSS processing

## Example Project Structure

```
your-app/
├── src/
│   ├── index.css          # Tailwind imports + custom styles
│   ├── App.tsx            # Main app component
│   └── components/        # React components
├── index.tsx              # Entry file (imports src/index.css)
├── index.html             # HTML template
├── postcss.config.js      # PostCSS configuration
├── package.json           # Dependencies (type: module)
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite config
```

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vite Documentation](https://vitejs.dev/)
- [PostCSS Documentation](https://postcss.org/)

---

**Last Updated:** 2025-11-22
**Tested With:** React 18.2, Vite 5.4, TypeScript 5.4, Tailwind CSS v4
