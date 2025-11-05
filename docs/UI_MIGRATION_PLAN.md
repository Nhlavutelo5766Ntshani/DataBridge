# DataBridge UI Migration Plan

## ✅ Implementation Status: PHASE 2 COMPLETED

All core UI components have been successfully migrated to match SurveyAI's look and feel while maintaining Integrove's brand colors (cyan/teal).

### Phase 1 - Core Components (✅ Completed):

- ✅ Step Navigator component with SurveyAI styling
- ✅ Wizard Layout with sidebar navigation
- ✅ Card component with gray header variants
- ✅ Updated all dashboard pages (Dashboard, Projects, Connections, Migrations, Reports)
- ✅ Added gray and emerald color scales to Tailwind config
- ✅ Created example wizard flow for new projects
- ✅ Updated typography and spacing to match SurveyAI patterns

### Phase 2 - Drawer Pattern & Context (✅ Completed):

- ✅ ConnectionProvider context for state management
- ✅ ConnectionDrawer component with Sheet
- ✅ ConnectionCreateForm (drawer-based form)
- ✅ ConnectionDetailsView (drawer-based details)
- ✅ Updated Connections page to use drawer pattern
- ✅ Clickable list items that open drawers
- ✅ Removed gradient buttons, using solid primary color
- ✅ Fixed all typography to match SurveyAI (text-xl font-semibold)

---

## Matching SurveyAI Look & Feel

**Date**: November 5, 2025  
**Goal**: Transform DataBridge UI to match SurveyAI's design patterns, particularly the business profile wizard flow

---

## 🎯 **Objectives**

1. Match wizard flow and navigation patterns from SurveyAI
2. Replicate drawer/sheet patterns for side panels
3. Adopt consistent card styling and layouts
4. Implement step navigator with icons and status indicators
5. Match color scheme, typography, and spacing
6. Ensure consistent component patterns across the app

---

## 📊 **Analysis: SurveyAI vs DataBridge**

### **SurveyAI Patterns (Business Profile Wizard)**

#### ✅ Layout Structure:

- **Sidebar Navigation** (left, ~320px width)
  - Fixed position with scroll
  - Step indicators with icons
  - Progress tracking
  - Colored backgrounds for active/completed states
- **Main Content Area** (right, flexible width)
  - Card-based content
  - Header with gray background (`bg-gray-50/50`)
  - Content padding (`p-6`)
  - Footer with navigation buttons

#### ✅ Step Navigator:

```tsx
- Active step: bg-primary/10 border border-primary/20 shadow-sm
- Completed step: bg-emerald-50 border border-emerald-200/50
- Pending step: bg-gray-50/60 border border-gray-200/50
- Clickable in edit mode
- Icons with colored backgrounds
- Step number indicators
```

#### ✅ Card Styling:

```tsx
CardHeader: bg-gray-50/80 px-4 py-3 border-b border-gray-200
CardTitle: text-base font-semibold text-gray-900
CardDescription: text-gray-600
```

#### ✅ Colors:

- Primary: Blue/Purple tones
- Success: Emerald (`emerald-50`, `emerald-200`)
- Gray scale: `gray-50`, `gray-200`, `gray-600`, `gray-900`
- Borders: `border-gray-200`

#### ✅ Typography:

- Headers: `text-xl font-semibold text-gray-900`
- Descriptions: `text-gray-600`
- Labels: `text-sm font-medium`

### **DataBridge Current State**

#### ❌ Issues:

- No sidebar navigation pattern
- Steps displayed horizontally at top
- Different card styling (no gray backgrounds)
- Cyan/Teal colors (Integrove theme) - **KEEP THIS**
- Missing Sheet/Drawer components
- Different spacing and padding
- No step status indicators with colors

---

## 🛠️ **Implementation Plan**

### **Phase 1: Core Components** ✅

1. ✅ **Add Sheet Component**

   - File: `components/ui/sheet.tsx`
   - Copied from SurveyAI
   - Supports: right, left, top, bottom sides

2. **Update Card Styling**

   - Add gray background variants
   - Update header styles
   - Match padding and borders

3. **Create Step Navigator Component**
   - File: `components/wizard/step-navigator.tsx`
   - Features:
     - Vertical layout
     - Icon support
     - Status indicators (active, completed, pending)
     - Clickable navigation
     - Progress indicators

### **Phase 2: Wizard Layout Refactor**

4. **Update Wizard Layout**

   - File: `components/mapping/wizard/wizard-layout.tsx`
   - Changes:
     - Add sidebar navigation (left, 320px)
     - Move steps to sidebar
     - Update main content area
     - Add gray backgrounds to headers
     - Match spacing and padding

5. **Update Individual Wizard Steps**
   - Files: `step1-table-selection.tsx` through `step7-execution-monitor.tsx`
   - Changes:
     - Update card headers with gray backgrounds
     - Match typography
     - Adjust spacing
     - Update button styles

### **Phase 3: Projects Page Refactor**

6. **Update Projects List Page**

   - File: `app/(dashboard)/projects/page.tsx`
   - Changes:
     - Match card grid layout
     - Update card styling
     - Add hover effects
     - Match status badges

7. **Update Project Detail Page**

   - File: `app/(dashboard)/projects/[id]/page.tsx`
   - Changes:
     - Update layout structure
     - Match card styling
     - Update action buttons

8. **Update Mapping Page**
   - File: `app/(dashboard)/projects/[id]/mapping/page.tsx`
   - Changes:
     - Integrate new wizard layout
     - Match overall design

### **Phase 4: Global Styling Updates**

9. **Update Global Styles**

   - File: `app/globals.css`
   - Changes:
     - Add gray scale variables
     - Update card styles
     - Add border styles

10. **Update Tailwind Config**
    - File: `tailwind.config.ts`
    - Changes:
      - Add gray scale colors
      - Update border radius
      - Add shadow variants

### **Phase 5: Navigation & Dialogs**

11. **Update Navigation Patterns**

    - Add breadcrumbs (if not present)
    - Update page headers
    - Match button styles

12. **Update Dialog/Modal Patterns**
    - Match dialog styling
    - Update overlay opacity
    - Match animation timing

---

## 🎨 **Design Specifications**

### **Colors to Keep (Integrove Theme)**

```css
Primary: Cyan (#06b6d4)
Secondary: Teal (#14b8a6)
```

### **Colors to Add (SurveyAI Pattern)**

```css
Gray Scale:
  - gray-50: #f9fafb
  - gray-100: #f3f4f6
  - gray-200: #e5e7eb
  - gray-600: #4b5563
  - gray-900: #111827

Success/Completed:
  - emerald-50: #ecfdf5
  - emerald-200: #a7f3d0
  - emerald-600: #059669

Borders:
  - border-gray-200
  - border-primary/20 (for active states)
```

### **Typography**

```css
Page Headers: text-xl font-semibold text-gray-900
Card Titles: text-base font-semibold text-gray-900
Descriptions: text-sm text-gray-600
Labels: text-sm font-medium
Body: text-sm
```

### **Spacing**

```css
Card Padding: p-6
Card Header: px-4 py-3 (sidebar), px-6 py-5 (main)
Gap between elements: gap-4, gap-6
Border radius: rounded-lg
```

### **Shadows**

```css
Card: shadow-sm
Active step: shadow-sm
Hover: hover:shadow-md
```

---

## 📝 **Component Mapping**

| SurveyAI Component       | DataBridge Equivalent | Status       |
| ------------------------ | --------------------- | ------------ |
| ProfileWizard            | WizardLayout          | ✅ Completed |
| WizardStepNavigator      | StepNavigator         | ✅ Completed |
| WizardStepContent        | Step Components       | ✅ Completed |
| Sheet                    | Sheet                 | ✅ Added     |
| Card (with gray headers) | Card                  | ✅ Completed |

---

## 🚀 **Implementation Steps**

### **Step 1: Create Step Navigator Component**

```tsx
// components/wizard/step-navigator.tsx
- Vertical layout
- Icon support
- Status colors (active, completed, pending)
- Clickable navigation
- Progress indicators
```

### **Step 2: Update Wizard Layout**

```tsx
// components/mapping/wizard/wizard-layout.tsx
- Add sidebar (w-80, lg:w-80)
- Move step navigator to sidebar
- Update main content area
- Add gray backgrounds
```

### **Step 3: Update Card Component**

```tsx
// components/ui/card.tsx
- Add variant prop for header styles
- Add gray background option
- Update default styles
```

### **Step 4: Update All Wizard Steps**

- Apply new card styling
- Update typography
- Match spacing
- Update button styles

### **Step 5: Update Projects Pages**

- Apply new patterns
- Match card styling
- Update layouts

---

## ✅ **Success Criteria**

1. ✅ Wizard has sidebar navigation like SurveyAI
2. ✅ Step navigator shows status with colors
3. ✅ Card headers have gray backgrounds
4. ✅ Typography matches SurveyAI
5. ✅ Spacing and padding consistent
6. ✅ Integrove colors (cyan/teal) preserved
7. ✅ Smooth animations and transitions
8. ✅ Responsive design maintained

---

## 🎯 **Next Actions**

1. **Create Step Navigator Component** - High Priority
2. **Update Wizard Layout** - High Priority
3. **Update Card Styling** - Medium Priority
4. **Update Individual Steps** - Medium Priority
5. **Update Projects Pages** - Low Priority

---

## 📚 **Reference Files**

### **SurveyAI (Reference)**

- `apps/web/src/app/(admin)/settings/profile/wizard/components/profile-wizard.tsx`
- `apps/web/src/app/(admin)/settings/profile/wizard/components/wizard-step-navigator.tsx`
- `apps/web/src/components/ui/sheet.tsx`
- `apps/web/src/components/ui/card.tsx`

### **DataBridge (To Update)**

- `apps/web/src/components/mapping/wizard/mapping-wizard.tsx`
- `apps/web/src/components/mapping/wizard/wizard-layout.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/app/(dashboard)/projects/page.tsx`

---

## 📋 **Phase 3: Table Selection Improvements - COMPLETED ✅**

### **Implementation Date:** November 5, 2025

### **Changes Made:**

#### 1. **Custom Scrollbar Styles** ✅

- Added branded scrollbar styling to `apps/web/src/app/globals.css`
- Implemented both default and thin scrollbar variants
- Applied Integrove cyan/teal color scheme
- Added Firefox support with `scrollbar-width` and `scrollbar-color`

#### 2. **Wizard Layout Fixes** ✅

- Added `min-h-0` to main content area in `wizard-layout.tsx`
- Enables proper flex shrinking for scrollable children
- Fixed overflow constraints for nested flex layouts

#### 3. **Three-Panel Table Selection Layout** ✅

- Refactored `step1-table-selection.tsx` from 2-panel to 3-panel layout
- **Source Tables Panel** (left): Scrollable list with filter
- **Target Tables Panel** (middle): Scrollable list with multi-select
- **Current Mappings Panel** (right): Scrollable mapping cards with grouped display

#### 4. **Proper Scrolling Implementation** ✅

- Applied `flex flex-col` structure with proper constraints
- Used `flex-shrink-0` for fixed headers
- Used `flex-1 min-h-0 overflow-y-auto` for scrollable content
- Added `scrollbar-thin` class for styled scrollbars

#### 5. **Enhanced Mapping Display** ✅

- Moved "Current Mappings" from cramped header to dedicated panel
- Grouped mappings by source table
- Added visual hierarchy with icons and badges
- Improved empty state with centered message
- Added remove buttons for individual mappings

### **Key Technical Improvements:**

```tsx
// Before (2-panel, no scrolling)
<div className="grid grid-cols-2 gap-4 h-full">
  <div className="overflow-y-auto"> {/* Didn't work */}
    {/* Source tables */}
  </div>
</div>

// After (3-panel, proper scrolling)
<div className="grid grid-cols-3 gap-4 h-full">
  <div className="flex flex-col h-full">
    <div className="flex-shrink-0">{/* Header */}</div>
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
      {/* Scrollable content */}
    </div>
  </div>
</div>
```

### **Visual Improvements:**

- ✅ Consistent spacing and padding across all panels
- ✅ Branded scrollbars matching Integrove colors
- ✅ Clear visual hierarchy with icons and badges
- ✅ Hover states for interactive elements
- ✅ Empty states with helpful messaging
- ✅ Responsive grid layout

### **Files Modified:**

1. `apps/web/src/app/globals.css` - Added custom scrollbar styles
2. `apps/web/src/components/mapping/wizard/wizard-layout.tsx` - Added `min-h-0` constraint
3. `apps/web/src/components/mapping/wizard/step1-table-selection.tsx` - Complete refactor with 3-panel layout

---

**Ready to proceed with implementation!** 🚀
