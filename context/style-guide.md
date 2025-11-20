# Tailwind CSS + React Style Guide

This guide provides practical implementation patterns for building components with Tailwind CSS and React following our design principles.

## Tailwind Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Define custom colors here
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Main primary color
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      spacing: {
        // Additional custom spacing if needed
      },
      borderRadius: {
        // Matches design system
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Better form styling
  ],
}
```

### Global CSS (index.css or globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Ensure smooth theme transitions */
  html {
    @apply transition-colors duration-200;
  }

  /* Base body styles */
  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100;
    @apply font-sans antialiased;
  }

  /* Focus ring defaults */
  *:focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900;
  }
}

@layer components {
  /* Reusable component classes */
  .btn-primary {
    @apply px-6 py-3 bg-primary-500 text-white font-semibold rounded-md;
    @apply hover:bg-primary-600 active:scale-98;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
    @apply transition-all duration-200;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-transparent border border-gray-300 dark:border-gray-600;
    @apply text-gray-700 dark:text-gray-200 font-semibold rounded-md;
    @apply hover:bg-gray-50 dark:hover:bg-gray-800;
    @apply transition-all duration-200;
  }

  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600;
    @apply rounded-md bg-white dark:bg-gray-800;
    @apply text-gray-900 dark:text-gray-100;
    @apply placeholder-gray-400 dark:placeholder-gray-500;
    @apply focus:border-primary-500 focus:ring-1 focus:ring-primary-500;
    @apply transition-colors duration-200;
  }

  .card {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
    @apply rounded-lg p-6 shadow-sm;
  }
}
```

## Dark Mode Implementation

### Theme Provider (ThemeContext.jsx)

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    // Then check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Theme Toggle Button Component

```jsx
import { useTheme } from './ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  );
}
```

## Component Patterns

### Button Components

```jsx
// components/Button.jsx
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-98',
    secondary: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-98',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="md" onClick={handleSubmit}>
  Submit
</Button>
```

### Input Components

```jsx
// components/Input.jsx
export function Input({
  label,
  error,
  helperText,
  id,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 border rounded-md
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          transition-colors duration-200
          ${error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
          }
          ${className}
        `}
        {...props}
      />

      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

// Usage
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
  error={errors.email}
/>
```

### Card Component

```jsx
// components/Card.jsx
export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg p-6 shadow-sm
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Usage
<Card hover onClick={() => navigate('/details')}>
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Card content here</p>
</Card>
```

### Modal Component

```jsx
// components/Modal.jsx
import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`
          ${maxWidth} w-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl
          transform transition-all
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Usage
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  <p>Modal content here</p>
  <div className="flex justify-end gap-3 mt-6">
    <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
  </div>
</Modal>
```

### Loading States

```jsx
// components/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-primary-500`} />
    </div>
  );
}

// Skeleton Component
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

// Usage - Skeleton Screen
<div className="space-y-4">
  <Skeleton className="h-8 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

### Table Component

```jsx
// components/Table.jsx
export function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors' : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Usage
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (value) => <Badge>{value}</Badge> },
  ]}
  data={users}
  onRowClick={(user) => navigate(`/users/${user.id}`)}
/>
```

### Badge Component

```jsx
// components/Badge.jsx
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
```

## Responsive Patterns

### Responsive Grid

```jsx
// Responsive card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>

// Responsive layout with sidebar
<div className="flex flex-col lg:flex-row gap-6">
  {/* Sidebar - full width on mobile, fixed width on desktop */}
  <aside className="w-full lg:w-64 flex-shrink-0">
    {/* Sidebar content */}
  </aside>

  {/* Main content */}
  <main className="flex-1">
    {/* Main content */}
  </main>
</div>
```

### Responsive Typography

```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

<p className="text-sm md:text-base lg:text-lg">
  Responsive body text
</p>
```

### Hide/Show on Different Screens

```jsx
{/* Hidden on mobile, visible on desktop */}
<div className="hidden lg:block">
  Desktop only content
</div>

{/* Visible on mobile, hidden on desktop */}
<div className="block lg:hidden">
  Mobile only content
</div>
```

## Accessibility Patterns

### Focus Management

```jsx
// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

### ARIA Labels

```jsx
// Icon-only button
<button
  aria-label="Close menu"
  className="p-2 rounded-md hover:bg-gray-100"
>
  <XMarkIcon className="w-6 h-6" />
</button>

// Loading state
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? 'Loading...' : 'Submit form'}
>
  {isLoading ? <LoadingSpinner size="sm" /> : 'Submit'}
</button>
```

### Form Accessibility

```jsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-2">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        required
        aria-required="true"
        aria-describedby={error ? 'email-error' : undefined}
        aria-invalid={error ? 'true' : 'false'}
        className="input-field"
      />
      {error && (
        <p id="email-error" className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  </div>
</form>
```

## Common Utility Patterns

### Container

```jsx
// Standard container with max width
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  {/* Content */}
</div>
```

### Section Spacing

```jsx
// Consistent section spacing
<section className="py-12 md:py-16 lg:py-24">
  {/* Section content */}
</section>
```

### Card Grid with Hover Effects

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div
      key={item.id}
      className="card hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
      onClick={() => handleClick(item)}
    >
      {/* Card content */}
    </div>
  ))}
</div>
```

## Performance Tips

### Conditional Classes

```jsx
// Use template literals for conditional classes
const buttonClasses = `
  px-6 py-3 rounded-md font-semibold
  ${isPrimary ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-900'}
  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
  transition-all duration-200
`;

// Or use a utility like clsx
import clsx from 'clsx';

<button className={clsx(
  'px-6 py-3 rounded-md font-semibold',
  isPrimary ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-900',
  isLoading && 'opacity-50 cursor-not-allowed',
  !isLoading && 'hover:opacity-90',
  'transition-all duration-200'
)}>
  Click me
</button>
```

### Avoid Inline Styles

```jsx
// ❌ Avoid
<div style={{ backgroundColor: '#3B82F6', padding: '16px' }}>

// ✅ Use Tailwind classes
<div className="bg-primary-500 p-4">
```

### Optimize Re-renders

```jsx
// Memoize expensive components
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
});
```

## Quick Reference

### Common Class Combinations

```jsx
// Centered content
<div className="flex items-center justify-center">

// Full screen overlay
<div className="fixed inset-0 bg-black bg-opacity-50">

// Flex space between
<div className="flex items-center justify-between">

// Truncate text
<p className="truncate">

// Two line clamp
<p className="line-clamp-2">

// Smooth transition
<div className="transition-all duration-200 ease-in-out">
```

---

**Remember:** This guide provides reusable patterns. Copy and adapt these components for your projects. Keep components simple, accessible, and consistent with the design principles.
