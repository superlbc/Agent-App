# Design Principles

This document defines the design standards for all web applications. These principles ensure consistency, usability, and professional quality across projects.

## Core Philosophy

### User-Centric Design
- Prioritize user needs and workflows in every design decision
- Minimize friction and unnecessary steps
- Provide clear feedback for all user actions
- Design for efficiency - users should accomplish tasks quickly

### Clarity & Simplicity
- Clean, uncluttered interfaces
- Clear labels and instructions
- Progressive disclosure - show complexity only when needed
- Obvious navigation and information hierarchy

### Professional Quality
- Meticulous attention to detail
- Consistent design language across the application
- Fast, responsive interactions
- Polished, production-ready aesthetics

### Accessibility First
- WCAG AA compliance minimum
- Keyboard navigation support
- Sufficient color contrast (4.5:1 for text)
- Screen reader compatible
- Clear focus states

## Design System Foundation

### Color Palette

**Light Theme:**
```
Primary: Define based on brand (blue recommended: #3B82F6)
Neutrals:
  - Gray-50:  #F9FAFB (backgrounds)
  - Gray-100: #F3F4F6 (subtle backgrounds)
  - Gray-200: #E5E7EB (borders)
  - Gray-300: #D1D5DB (disabled states)
  - Gray-400: #9CA3AF (placeholders)
  - Gray-500: #6B7280 (secondary text)
  - Gray-700: #374151 (secondary headings)
  - Gray-900: #111827 (primary text)

Semantic:
  - Success: #10B981 (green)
  - Error:   #EF4444 (red)
  - Warning: #F59E0B (amber)
  - Info:    #3B82F6 (blue)
```

**Dark Theme:**
```
Primary: Lighter variant for dark backgrounds (#60A5FA)
Neutrals:
  - Gray-900: #111827 (backgrounds)
  - Gray-800: #1F2937 (elevated surfaces)
  - Gray-700: #374151 (borders)
  - Gray-600: #4B5563 (disabled states)
  - Gray-400: #9CA3AF (placeholders)
  - Gray-300: #D1D5DB (secondary text)
  - Gray-100: #F3F4F6 (primary text)
  - Gray-50:  #F9FAFB (emphasized text)

Semantic:
  - Success: #34D399 (lighter green)
  - Error:   #F87171 (lighter red)
  - Warning: #FBBF24 (lighter amber)
  - Info:    #60A5FA (lighter blue)
```

**Contrast Requirements:**
- All text must meet WCAG AA standards (4.5:1 minimum)
- Large text (18px+) can use 3:1 ratio
- Interactive elements must have 3:1 contrast with background
- Focus indicators must be clearly visible

### Typography

**Font Family:**
- Primary: `Inter, system-ui, -apple-system, sans-serif`
- Monospace: `'Fira Code', 'Courier New', monospace` (for code)

**Type Scale:**
```
H1: 2rem (32px)   - Font weight: 700 - Line height: 1.2
H2: 1.5rem (24px) - Font weight: 600 - Line height: 1.3
H3: 1.25rem (20px)- Font weight: 600 - Line height: 1.4
H4: 1.125rem (18px)- Font weight: 600 - Line height: 1.4
Body Large: 1rem (16px) - Font weight: 400 - Line height: 1.6
Body: 0.875rem (14px) - Font weight: 400 - Line height: 1.6
Small: 0.75rem (12px) - Font weight: 400 - Line height: 1.5
```

**Font Weights:**
- Regular: 400 (body text)
- Medium: 500 (emphasis)
- Semibold: 600 (headings, buttons)
- Bold: 700 (major headings)

### Spacing & Layout

**Spacing Scale (8px base unit):**
```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

**Layout Principles:**
- Use consistent spacing throughout
- Generous white space improves readability
- Group related elements with proximity
- Separate distinct sections with space

**Grid System:**
- Responsive 12-column grid
- Gutters: 16px (mobile), 24px (tablet), 32px (desktop)
- Max width: 1280px for content containers

### Border Radius

```
sm: 4px   - Small elements (badges, tags)
md: 6px   - Inputs, buttons
lg: 8px   - Cards, panels
xl: 12px  - Modals, large cards
full: 9999px - Pills, avatars
```

### Shadows & Elevation

**Light Theme:**
```
sm:  0 1px 2px rgba(0, 0, 0, 0.05)         - Subtle elevation
md:  0 4px 6px rgba(0, 0, 0, 0.07)         - Cards
lg:  0 10px 15px rgba(0, 0, 0, 0.1)        - Dropdowns
xl:  0 20px 25px rgba(0, 0, 0, 0.15)       - Modals
```

**Dark Theme:**
```
sm:  0 1px 2px rgba(0, 0, 0, 0.3)
md:  0 4px 6px rgba(0, 0, 0, 0.4)
lg:  0 10px 15px rgba(0, 0, 0, 0.5)
xl:  0 20px 25px rgba(0, 0, 0, 0.6)
```

## Component Standards

### Buttons

**Primary Button:**
- Background: Primary color
- Text: White
- Padding: 12px 24px (md), 8px 16px (sm)
- Border radius: 6px
- Font weight: 600
- Hover: Slightly darker background
- Active: Even darker + scale(0.98)
- Disabled: 50% opacity, no pointer events

**Secondary Button:**
- Background: Transparent
- Border: 1px solid gray-300 (light) / gray-600 (dark)
- Text: Gray-700 (light) / gray-200 (dark)
- Same padding and radius as primary
- Hover: Light background tint

**Ghost/Tertiary Button:**
- Background: Transparent
- No border
- Text: Primary color or gray-600
- Hover: Light background tint

**Icon Buttons:**
- Square (40x40px standard)
- Centered icon
- Hover: Background tint
- Clear focus ring

### Form Inputs

**Text Inputs:**
- Height: 40px (standard), 32px (small)
- Padding: 0 12px
- Border: 1px solid gray-300 (light) / gray-600 (dark)
- Border radius: 6px
- Font size: 14px
- Focus: Primary color border + ring

**Labels:**
- Font size: 14px
- Font weight: 500
- Margin bottom: 8px
- Color: Gray-700 (light) / gray-200 (dark)

**Helper Text:**
- Font size: 12px
- Color: Gray-500 (light) / gray-400 (dark)
- Margin top: 4px

**Error States:**
- Border: Error color
- Helper text: Error color
- Icon: Error icon in error color

**Placeholder Text:**
- Color: Gray-400 (light) / gray-500 (dark)
- Never use placeholders as labels

### Cards

**Standard Card:**
- Background: White (light) / gray-800 (dark)
- Border: 1px solid gray-200 (light) / gray-700 (dark)
- Border radius: 8px
- Padding: 24px
- Shadow: sm elevation

**Interactive Cards:**
- Hover: Shadow md + slight lift (translateY(-2px))
- Cursor: pointer
- Transition: all 200ms ease

### Tables

**Structure:**
- Clear column headers (font-weight: 600)
- Zebra striping optional (use for dense data)
- Row height: 48px minimum
- Cell padding: 12px 16px

**Alignment:**
- Left-align text
- Right-align numbers
- Center-align icons/actions

**Responsive:**
- Horizontal scroll on mobile if needed
- Consider stacked cards for mobile alternative
- Sticky headers for long tables

### Modals & Dialogs

**Structure:**
- Max width: 600px (standard), 900px (large)
- Padding: 24px
- Border radius: 12px
- Backdrop: Black with 50% opacity

**Header:**
- Title (H2 or H3)
- Close button (top right)
- Optional subtitle/description

**Footer:**
- Action buttons (right-aligned)
- Primary action on the right
- Cancel/secondary on the left

**Behavior:**
- Focus trap within modal
- ESC key closes
- Click backdrop to close (optional)
- Lock body scroll when open

### Navigation

**Top Navigation Bar:**
- Height: 64px
- Background: White (light) / gray-900 (dark)
- Border bottom: 1px solid gray-200 (light) / gray-800 (dark)
- Sticky positioning
- Z-index: 50

**Sidebar Navigation:**
- Width: 240px (expanded), 64px (collapsed)
- Background: Gray-50 (light) / gray-900 (dark)
- Icons + text labels
- Active state clearly indicated
- Collapsible on mobile

**Breadcrumbs:**
- Font size: 14px
- Separator: `/` or `>` icon
- Last item is current page (not clickable)
- Color: Gray-500 with hover states

### Loading States

**Spinners:**
- Use for loading data/actions
- Size: 16px (inline), 24px (standard), 48px (page load)
- Color: Primary or gray-400

**Skeleton Screens:**
- Use for initial page loads
- Match layout of actual content
- Subtle animation (pulse or shimmer)
- Gray-200 (light) / gray-700 (dark)

**Progress Bars:**
- Height: 4px (slim), 8px (standard)
- Background: Gray-200 (light) / gray-700 (dark)
- Progress: Primary color
- Smooth animations

### Icons

**Icon Library:**
- Use a consistent set (Heroicons, Lucide, or Feather recommended)
- Stroke width: 2px
- Sizes: 16px, 20px, 24px

**Usage:**
- Pair with text labels when possible
- Use aria-labels for icon-only buttons
- Consistent meaning across application

### Badges & Tags

**Badge:**
- Small (20px height)
- Border radius: 9999px (pill shape)
- Padding: 2px 8px
- Font size: 12px
- Font weight: 500

**Tag:**
- Border radius: 4px
- Padding: 4px 8px
- Removable with X button
- Semantic colors for categories

## Responsive Design

### Breakpoints

```
Mobile:  < 640px   (sm)
Tablet:  640px - 1024px (md to lg)
Desktop: > 1024px  (lg+)
Wide:    > 1280px  (xl+)
```

### Mobile-First Approach

**Design Strategy:**
1. Design for mobile first
2. Enhance for tablet
3. Optimize for desktop
4. Never hide critical content on mobile

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)

**Mobile Navigation:**
- Hamburger menu for primary navigation
- Bottom navigation for key actions (optional)
- Swipe gestures where appropriate

**Typography on Mobile:**
- Slightly smaller font sizes acceptable
- Maintain readability (14px minimum for body)
- Increase line height for easier reading

### Responsive Patterns

**Layout:**
- Single column on mobile
- 2-column on tablet
- 3-4 column on desktop
- Fluid grid system

**Images:**
- Responsive images (srcset, sizes)
- Lazy loading for below-fold images
- Proper aspect ratios maintained

**Forms:**
- Full-width inputs on mobile
- Stacked labels above inputs
- Large touch targets for selects/checkboxes

## Dark Mode Implementation

### Theme Detection

```javascript
// Detect user preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Allow manual toggle
// Store preference in localStorage
```

### Theme Switching

**Requirements:**
- Respect user's system preference by default
- Allow manual override
- Persist user's choice
- Smooth transition between themes (200ms)
- No flash of unstyled content

**Implementation with Tailwind:**
```jsx
<html className="dark">
  <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    // Use dark: variant for all color utilities
  </body>
</html>
```

### Color Adjustments for Dark Mode

- Reduce pure blacks (use gray-900 instead)
- Reduce pure whites (use gray-50 instead)
- Adjust shadows to be more prominent
- Slightly desaturate bright colors
- Test contrast ratios for dark mode specifically

## Animation & Micro-interactions

### Principles

**Purposeful Motion:**
- Animations should have a purpose
- Guide user attention
- Provide feedback
- Indicate state changes

**Performance:**
- Use CSS transforms (translate, scale, rotate)
- Avoid animating layout properties (width, height)
- Use will-change sparingly
- 60fps target

### Timing & Easing

**Duration:**
- Instant: 0ms (state changes)
- Fast: 100-150ms (simple fades, highlights)
- Normal: 200-300ms (most transitions)
- Slow: 400-500ms (complex animations, page transitions)

**Easing:**
- Ease-out: Elements entering (start fast, end slow)
- Ease-in: Elements exiting (start slow, end fast)
- Ease-in-out: Elements moving position
- Linear: Loading spinners, progress bars

### Common Micro-interactions

**Hover States:**
- Brightness/opacity change
- Scale up slightly (1.02 - 1.05)
- Shadow elevation increase
- Color transition

**Click/Active States:**
- Scale down slightly (0.98)
- Darker color
- Brief highlight

**Focus States:**
- Visible ring (2-3px)
- Primary color or contrast color
- Never remove outline without replacement

**Loading:**
- Spinner or skeleton screen
- Disable interaction during loading
- Smooth transition to loaded state

## Accessibility Requirements

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Visible focus indicators
- Logical tab order
- Skip to main content link
- Keyboard shortcuts for common actions (optional)

### Screen Readers

- Semantic HTML (nav, main, article, section)
- ARIA labels where needed
- Alt text for all images
- Form labels properly associated
- Error messages announced
- Loading states announced

### Color & Contrast

- Don't rely on color alone to convey information
- Provide text labels or icons
- Test with colorblind simulators
- Maintain contrast ratios (WCAG AA minimum)

### Motion & Animation

- Respect prefers-reduced-motion
- Provide option to disable animations
- Don't use flashing content (seizure risk)

## Performance Standards

### Loading Performance

- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.8s
- Largest Contentful Paint: < 2.5s

### Optimization Strategies

**Images:**
- Use modern formats (WebP, AVIF)
- Proper sizing (no oversized images)
- Lazy loading below fold
- Responsive images

**Code:**
- Code splitting
- Tree shaking
- Minimize bundle size
- Cache static assets

**Rendering:**
- Minimize layout shifts (CLS < 0.1)
- Optimize React re-renders
- Use React.memo, useMemo, useCallback appropriately

## Design Review Checklist

### Visual Hierarchy
- [ ] Clear primary action on each page
- [ ] Consistent heading hierarchy (H1 → H2 → H3)
- [ ] Important content emphasized appropriately
- [ ] Scannable layout with clear sections

### Spacing & Alignment
- [ ] Consistent spacing throughout
- [ ] Elements properly aligned
- [ ] Adequate white space
- [ ] No cramped or cluttered sections

### Typography
- [ ] Font sizes from approved scale
- [ ] Line heights appropriate for readability
- [ ] Text contrast meets WCAG AA
- [ ] Consistent font weights

### Colors
- [ ] Using approved color palette
- [ ] Semantic colors used correctly
- [ ] Dark mode colors properly implemented
- [ ] Sufficient contrast everywhere

### Responsive Design
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1440px)
- [ ] No horizontal scroll
- [ ] Touch targets adequate size (44px minimum)

### Interactions
- [ ] Hover states on interactive elements
- [ ] Focus states clearly visible
- [ ] Loading states for async actions
- [ ] Error states with helpful messages
- [ ] Success feedback for actions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus order logical
- [ ] ARIA labels where needed
- [ ] Alt text on images
- [ ] Form labels properly associated

### Performance
- [ ] No console errors
- [ ] Images optimized
- [ ] No layout shift
- [ ] Smooth animations (60fps)
- [ ] Fast load times

---

**Remember:** These principles are guidelines to maintain quality and consistency. When in doubt, prioritize user experience and accessibility. Test designs with real users when possible.
