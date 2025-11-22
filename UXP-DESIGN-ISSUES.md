# UXP Platform - Prioritized Design Issues

**Date:** November 22, 2025  
**Source:** Design Review Report  
**Total Issues:** 23  

---

## Issue Classification

| Priority | Count | Must Fix Before Launch |
|----------|-------|------------------------|
| 🔴 **Critical** | 3 | ✅ YES |
| 🟠 **High** | 6 | ⚠️ Recommended |
| 🟡 **Medium** | 9 | 🔵 Nice to have |
| 🔵 **Low** | 5 | ℹ️ Optional |

---

## 🔴 CRITICAL PRIORITY (Fix Before Launch)

### CR-001: Missing ARIA Labels on Icon-Only Buttons
**Severity:** Critical  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Impact:** Screen reader users cannot identify button purpose  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Lines 208-228 (Edit/Delete buttons)
- `components/venue/VenueDatabase.tsx` - Action column buttons
- All table row action buttons across platform

**Current Code:**
```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onEditClick?.(campaign);
  }}
  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
>
  <Icon name="edit" className="w-4 h-4" />
</button>
```

**Fix:**
```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    onEditClick?.(campaign);
  }}
  aria-label={`Edit ${campaign.name}`}  // ADD THIS
  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
>
  <Icon name="edit" className="w-4 h-4" />
</button>
```

**Effort:** 1-2 hours  
**Files to Update:** ~15 component files  
**Search Pattern:** `<button.*<Icon`  

---

### CR-002: Missing scope="col" on Table Headers
**Severity:** Critical  
**WCAG:** 1.3.1 Info and Relationships (Level A)  
**Impact:** Screen readers cannot navigate tables properly  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Lines 502-522
- `components/campaign/CampaignDetailView.tsx` - Lines 279-297
- `components/venue/VenueDatabase.tsx` - Table headers
- All table components

**Current Code:**
```tsx
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
  Campaign
</th>
```

**Fix:**
```tsx
<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
  Campaign
</th>
```

**Effort:** 30 minutes  
**Files to Update:** ~8 table components  
**Search Pattern:** `<th className`  

---

### CR-003: Dark Mode Text Contrast Issues
**Severity:** Critical  
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)  
**Impact:** Text may be unreadable in dark mode  

**Affected Pattern:**
```tsx
text-gray-500 dark:text-gray-400  // ❌ May fail contrast (3.5:1)
text-gray-500 dark:text-gray-400  // ✅ Passes contrast (4.6:1)
```

**Locations:**
- `components/campaign/CampaignList.tsx` - Line 257 (footer timestamps)
- `components/campaign/CampaignDetailView.tsx` - Line 200, 208, etc. (labels)
- Multiple metadata text instances

**Current Code:**
```tsx
<span className="text-xs text-gray-500 dark:text-gray-500">
  Created {campaign.createdAt.toLocaleDateString()}
</span>
```

**Fix:**
```tsx
<span className="text-xs text-gray-500 dark:text-gray-400">
  Created {campaign.createdAt.toLocaleDateString()}
</span>
```

**Effort:** 1 hour  
**Files to Update:** ~20 component files  
**Search Pattern:** `text-gray-500(?! dark:)`  

---

## 🟠 HIGH PRIORITY (Should Fix)

### HP-001: Tablet Filter Layout Cramped
**Severity:** High  
**Impact:** Filters difficult to use on tablet (768px width)  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Line 369

**Current Code:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  {/* 5 filter selects */}
</div>
```

**Fix:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
  {/* 5 filter selects */}
</div>
```

**Effort:** 2-3 hours (test on real tablet)  
**Files to Update:** 3-5 filter sections  

---

### HP-002: Inline SVG Instead of Icon Component
**Severity:** High  
**Impact:** Inconsistent icon usage pattern  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Lines 432-443 (Grid/List toggle)

**Current Code:**
```tsx
<Button
  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
  onClick={() => setViewMode('grid')}
  className="px-3 py-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2..." />
  </svg>
</Button>
```

**Fix:**
```tsx
<Button
  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
  onClick={() => setViewMode('grid')}
  className="px-3 py-2"
  aria-label="Grid view"
  aria-pressed={viewMode === 'grid'}
>
  <Icon name="grid" className="w-5 h-5" />
</Button>
```

**Effort:** 30 minutes  
**Files to Update:** 1-2 components  
**Note:** Also adds aria-pressed for better accessibility  

---

### HP-003: Missing aria-pressed on Toggle Buttons
**Severity:** High  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Impact:** Screen readers don't announce toggle state  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - View mode toggles
- Any button with toggle behavior

**Fix:** Add `aria-pressed={isActive}` to all toggle buttons  

**Effort:** 1 hour  
**Files to Update:** 5-8 components  

---

### HP-004: Search Inputs Missing aria-label
**Severity:** High  
**WCAG:** 4.1.2 Name, Role, Value (Level A)  
**Impact:** Screen readers don't announce input purpose  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Line 359

**Current Code:**
```tsx
<Input
  type="text"
  placeholder="Search campaigns by name, code, or client..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full"
/>
```

**Fix:**
```tsx
<Input
  type="text"
  placeholder="Search campaigns by name, code, or client..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full"
  aria-label="Search campaigns"
/>
```

**Effort:** 30 minutes  
**Files to Update:** All search inputs (~5 components)  

---

### HP-005: Empty States Missing role="status"
**Severity:** High  
**WCAG:** 4.1.3 Status Messages (Level AA)  
**Impact:** Screen readers don't announce dynamic empty states  

**Affected Components:**
- `components/campaign/CampaignList.tsx` - Lines 473-491

**Fix:** Add `role="status"` to empty state containers  

**Effort:** 30 minutes  
**Files to Update:** ~10 components with empty states  

---

### HP-006: Mobile Table UX
**Severity:** High  
**Impact:** Tables require horizontal scroll on mobile (poor UX)  

**Recommendation:** Create mobile card view as alternative to table  

**Effort:** 4-6 hours  
**Files to Update:** 3-4 table components  

---

## 🟡 MEDIUM PRIORITY (Nice to Have)

### MP-001: Extract Color Utility Function
**Severity:** Medium  
**Impact:** Code reusability  

**Current:** `getCampaignColor` function in EventCalendar.tsx  
**Recommendation:** Move to `utils/colors.ts` and import where needed  

**Effort:** 1 hour  

---

### MP-002: Card Elevation Variants
**Severity:** Medium  
**Impact:** Visual hierarchy could be clearer  

**Current:** Card component has single style  
**Recommendation:** Add variants: `flat`, `default`, `elevated`  

**Example:**
```tsx
<Card variant="elevated">
  {/* Higher z-index content */}
</Card>
```

**Effort:** 2 hours  

---

### MP-003: Test Mobile Touch Targets
**Severity:** Medium  
**WCAG:** 2.5.5 Target Size (Level AAA)  
**Impact:** Buttons may be too small for touch on mobile  

**Recommendation:** Ensure all interactive elements ≥ 44px × 44px on mobile  

**Effort:** 2-3 hours (requires device testing)  

---

### MP-004: Filter Accordion on Mobile
**Severity:** Medium  
**Impact:** Filters take up too much screen space on mobile  

**Recommendation:** Collapse filters into accordion or modal on mobile  

**Effort:** 3-4 hours  

---

### MP-005: Dark Mode Calendar Refinement
**Severity:** Medium  
**Impact:** react-big-calendar dark mode may have styling inconsistencies  

**Recommendation:** Test thoroughly and add custom dark mode CSS if needed  

**Effort:** 2-3 hours  

---

### MP-006: Loading State Improvements
**Severity:** Medium  
**Impact:** Loading experience could be smoother  

**Current:** SkeletonLoader shows generic boxes  
**Recommendation:** Create component-specific skeleton shapes (e.g., card skeleton with title, metadata areas)  

**Effort:** 3-4 hours  

---

### MP-007: Pagination Accessibility
**Severity:** Medium  
**WCAG:** Best practice  
**Impact:** Pagination buttons need better ARIA support  

**Recommendation:**
- Add aria-label to page buttons
- Add aria-current="page" to active page
- Add aria-label to prev/next buttons

**Effort:** 1 hour  

---

### MP-008: Add Line Height Utilities
**Severity:** Medium  
**Impact:** Text readability could be improved  

**Recommendation:** Document and enforce line-height scale (1.5 for body, 1.2 for headings)  

**Effort:** 1 hour (documentation)  

---

### MP-009: Form Error States
**Severity:** Medium  
**Impact:** Form validation errors need better visual feedback  

**Recommendation:** Add error styling to Input/Select components, implement aria-invalid  

**Effort:** 2-3 hours  

---

## 🔵 LOW PRIORITY (Optional)

### LP-001: Design System Documentation
**Severity:** Low  
**Impact:** Developer onboarding and consistency  

**Recommendation:** Create Storybook or dedicated style guide site  

**Effort:** 8-16 hours  

---

### LP-002: Bundle Size Optimization
**Severity:** Low  
**Impact:** Performance (react-big-calendar adds ~100KB)  

**Recommendation:**
- Lazy load calendar component
- Tree-shake unused icons
- Code split routes

**Effort:** 4-6 hours  

---

### LP-003: Browser Compatibility Testing
**Severity:** Low  
**Impact:** Ensure works in Safari, Firefox  

**Recommendation:**
- Test dark mode in Safari
- Add autoprefixer to build
- Test in Firefox

**Effort:** 2-3 hours  

---

### LP-004: TypeScript Strict Mode
**Severity:** Low  
**Impact:** Type safety improvements  

**Recommendation:** Enable strict mode in tsconfig.json, fix type issues  

**Effort:** 6-8 hours  

---

### LP-005: Add Component Tests
**Severity:** Low  
**Impact:** Prevent regressions  

**Recommendation:** Jest + React Testing Library for critical components  

**Effort:** 16-24 hours (ongoing)  

---

## Implementation Roadmap

### Sprint 1 (Critical Fixes) - 4-6 hours
**Goal:** WCAG AA compliance  

- [ ] CR-001: Add ARIA labels to icon buttons (2h)
- [ ] CR-002: Add scope="col" to tables (0.5h)
- [ ] CR-003: Fix dark mode contrast (1h)
- [ ] HP-004: Add aria-label to search inputs (0.5h)
- [ ] HP-005: Add role="status" to empty states (0.5h)

**Acceptance Criteria:**
- Run Axe DevTools scan: 0 critical issues
- Manual screen reader test: All buttons/inputs labeled
- Dark mode contrast test: All text passes 4.5:1 ratio

---

### Sprint 2 (High Priority) - 8-10 hours
**Goal:** Improved responsive design and consistency  

- [ ] HP-001: Fix tablet filter layout (2h)
- [ ] HP-002: Replace inline SVG with Icon (0.5h)
- [ ] HP-003: Add aria-pressed to toggles (1h)
- [ ] HP-006: Add mobile card view for tables (6h)

**Acceptance Criteria:**
- Test on iPad (768px): Filters usable
- Test on iPhone (375px): Tables usable without excessive scroll
- All toggle buttons announce state via screen reader

---

### Sprint 3 (Polish & Optimization) - 12-16 hours
**Goal:** Enhanced UX and code quality  

- [ ] MP-001: Extract color utilities (1h)
- [ ] MP-002: Add Card elevation variants (2h)
- [ ] MP-003: Test mobile touch targets (2h)
- [ ] MP-004: Add filter accordion (4h)
- [ ] MP-005: Refine calendar dark mode (3h)
- [ ] MP-007: Improve pagination accessibility (1h)

**Acceptance Criteria:**
- Touch targets ≥ 44px on mobile
- Dark mode consistent across all components
- Code reusability improved (color utilities shared)

---

## Testing Checklist

### Accessibility Testing
- [ ] **Automated:** Run Axe DevTools on all pages
- [ ] **Automated:** Run Lighthouse accessibility audit
- [ ] **Manual:** Keyboard navigation test (Tab, Enter, Escape)
- [ ] **Manual:** Screen reader test (NVDA/JAWS/VoiceOver)
- [ ] **Manual:** Color contrast test with WebAIM tool
- [ ] **Manual:** Zoom to 200% (no horizontal scroll)

### Responsive Testing
- [ ] **Desktop:** 1920px, 1440px, 1280px
- [ ] **Tablet:** iPad (768px), iPad Pro (1024px)
- [ ] **Mobile:** iPhone SE (375px), iPhone 12 (390px), Pixel (412px)
- [ ] **Orientation:** Test landscape and portrait
- [ ] **Touch:** Verify 44px minimum touch targets

### Dark Mode Testing
- [ ] **Automated:** Visual regression test (Percy/Chromatic)
- [ ] **Manual:** Safari dark mode (macOS system preference)
- [ ] **Manual:** Chrome dark mode (DevTools emulation)
- [ ] **Manual:** Verify all text readable in dark mode

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

---

## Metrics & Success Criteria

### WCAG Compliance
- **Current:** ~70% (estimated)
- **Sprint 1 Target:** 95% (Level AA)
- **Sprint 2 Target:** 100% (Level AA)

### Lighthouse Scores
- **Accessibility:** Current unknown → Target 95+
- **Performance:** Current unknown → Target 90+
- **Best Practices:** Current unknown → Target 95+

### Screen Reader Support
- **Current:** Partial (missing labels)
- **Sprint 1 Target:** Full support (all controls labeled)

### Responsive Design
- **Current:** Desktop-first (mobile needs work)
- **Sprint 2 Target:** Mobile-optimized (card views, touch targets)

---

## Conclusion

Addressing the **3 critical issues** (4-6 hours) will achieve **WCAG AA baseline compliance**.  
Completing **Sprint 1 + Sprint 2** (12-16 hours total) will deliver a **production-ready, accessible UXP platform**.

**Priority:** Focus on **Sprint 1 (Critical)** before launch, then **Sprint 2 (High Priority)** for optimal UX.

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Next Review:** After Sprint 1 completion
