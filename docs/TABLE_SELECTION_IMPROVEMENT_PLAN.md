# 📋 Table Selection Step - Improvement Plan

## 🔍 Current Issues Identified

### 1. **Scrolling Not Working**

- The Source Tables and Target Tables panels have `overflow-y-auto` but scrolling doesn't work properly
- This is because the parent container doesn't have a fixed height constraint
- The `flex-1` class needs proper height calculation from parent

### 2. **"Current Mappings" Section Problems**

- Currently embedded in the header, taking up valuable space
- Limited to `max-h-24` which is too small for real-world scenarios
- No clear way to view, edit, or manage existing mappings
- Doesn't follow SurveyAI's pattern of detail views

---

## 📚 Lessons from SurveyAI Architecture

### **Key Patterns Observed:**

#### 1. **Fixed Height Layouts with Scrollable Sections**

```tsx
// From survey-builder-layout.tsx
const SCROLL_HEIGHT = "h-[calc(100vh-64px-215px-2.5rem-64px-1rem)]";
const SCROLLBAR_STYLES = "[&::-webkit-scrollbar]:w-1.5 ...";

<div className={`overflow-y-auto ${SCROLL_HEIGHT} ${SCROLLBAR_STYLES}`}>
  {/* Scrollable content */}
</div>;
```

**Lesson:** Use calculated heights (`calc()`) to ensure scrollable areas have fixed dimensions.

#### 2. **Profile Wizard Pattern**

```tsx
// From profile-wizard.tsx
<Card className="h-full flex flex-col">
  <CardHeader className="flex-shrink-0">{/* Fixed header */}</CardHeader>
  <CardContent className="p-4 flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </CardContent>
</Card>
```

**Lesson:** Use `flex flex-col` with `flex-shrink-0` for fixed sections and `flex-1 overflow-y-auto` for scrollable sections.

#### 3. **Detailed Responses Pattern**

```tsx
// From detailed-responses-client.tsx
<Card>
  <CardHeader>
    <CardTitle>User Responses</CardTitle>
  </CardHeader>
  <CardContent className='p-0'>
    <ExpandableDataTable ... />
  </CardContent>
</Card>
```

**Lesson:** Use separate pages/views for detailed data with proper table components.

#### 4. **Custom Scrollbar Styling**

```css
/* From globals.css */
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-thumb {
  background-color: hsl(var(--primary) / 0.7);
  border-radius: 4px;
}
```

**Lesson:** Apply consistent, branded scrollbar styling globally.

---

## 🎯 Proposed Solution

### **Architecture: Three-Panel Layout with Separate Mappings View**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Select Tables to Migrate" + Stats                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Source       │  │ Target       │  │ Current      │        │
│  │ Tables       │  │ Tables       │  │ Mappings     │        │
│  │              │  │              │  │              │        │
│  │ [Filter]     │  │ [Filter]     │  │ [Summary]    │        │
│  │              │  │              │  │              │        │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │        │
│  │ │ Table 1  │ │  │ │ Table A  │ │  │ │ Mapping 1│ │        │
│  │ │ Table 2  │ │  │ │ Table B  │ │  │ │ Mapping 2│ │        │
│  │ │ Table 3  │ │  │ │ Table C  │ │  │ │ Mapping 3│ │        │
│  │ │ ...      │ │  │ │ ...      │ │  │ │ ...      │ │        │
│  │ │ (scroll) │ │  │ │ (scroll) │ │  │ │ (scroll) │ │        │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Footer: [Cancel] [Auto-Map] [Map Selected] [Continue]         │
└─────────────────────────────────────────────────────────────────┘
```

### **Alternative: Drawer/Modal for Detailed Mapping View**

When a mapping is clicked in "Current Mappings":

- Open a **Sheet (Drawer)** component (like SurveyAI connection details)
- Show full mapping details with column-level preview
- Allow editing/removing the mapping
- Show confidence scores and transformation previews

---

## 🛠️ Implementation Plan

### **Phase 1: Fix Scrolling (Immediate)**

#### 1.1 Update Wizard Layout

```tsx
// wizard-layout.tsx
<main className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
  {children}
</main>
```

**Key:** Add `min-h-0` to allow flex children to shrink below content size.

#### 1.2 Update Table Selection Structure

```tsx
// step1-table-selection.tsx
export const TableSelection = ({ ... }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        {/* Header content */}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Source Tables Panel */}
          <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
            <div className="flex-shrink-0 p-3 border-b bg-gray-50">
              <h3>Source Tables</h3>
              <Input ... />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {/* Table list */}
            </div>
          </div>

          {/* Target Tables Panel */}
          <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
            <div className="flex-shrink-0 p-3 border-b bg-gray-50">
              <h3>Target Tables</h3>
              <Input ... />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {/* Table list */}
            </div>
          </div>

          {/* Current Mappings Panel */}
          <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
            <div className="flex-shrink-0 p-3 border-b bg-gray-50">
              <h3>Current Mappings</h3>
              <Badge>{mappings.length} mapped</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {/* Mapping cards */}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t bg-white px-6 py-3">
        {/* Action buttons */}
      </div>
    </div>
  );
};
```

#### 1.3 Add Custom Scrollbar Styles

```css
/* globals.css */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: hsl(var(--primary) / 0.7);
  border-radius: 3px;
  border: 1px solid hsl(var(--primary) / 0.3);
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: hsl(var(--secondary) / 0.1);
  border-radius: 3px;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--primary) / 0.7) hsl(var(--secondary) / 0.1);
}
```

---

### **Phase 2: Improve Current Mappings Section**

#### 2.1 Create Mapping Card Component

```tsx
// components/mapping/mapping-card.tsx
type MappingCardProps = {
  sourceTable: string;
  targetTables: string[];
  confidence?: number;
  onView: () => void;
  onRemove: () => void;
};

export const MappingCard = ({
  sourceTable,
  targetTables,
  confidence,
  onView,
  onRemove,
}: MappingCardProps) => {
  return (
    <div
      className="bg-white rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm font-semibold text-gray-900">
            {sourceTable}
          </span>
        </div>
        {confidence && (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
          >
            {Math.round(confidence * 100)}% match
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <ArrowRight className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-600">
          {targetTables.length} target table(s)
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="text-xs h-7"
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="w-3 h-3 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
};
```

#### 2.2 Create Mapping Details Drawer

```tsx
// components/mapping/mapping-details-drawer.tsx
type MappingDetailsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  mapping: TableMappingData;
  sourceSchema: TableSchema;
  targetSchemas: TableSchema[];
};

export const MappingDetailsDrawer = ({
  isOpen,
  onClose,
  mapping,
  sourceSchema,
  targetSchemas,
}: MappingDetailsDrawerProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90%] sm:max-w-[800px] p-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              Mapping Details
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Source Table Info */}
          <Card>
            <CardHeader variant="gray">
              <CardTitle variant="small">Source Table</CardTitle>
              <CardDescription>{mapping.sourceTable}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Columns:</span>
                  <span className="font-medium">
                    {sourceSchema.columns.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mapped Columns:</span>
                  <span className="font-medium">
                    {mapping.columnMappings.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Tables */}
          {targetSchemas.map((targetSchema) => (
            <Card key={targetSchema.name}>
              <CardHeader variant="gray">
                <CardTitle variant="small">Target Table</CardTitle>
                <CardDescription>{targetSchema.name}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Column mappings preview */}
                <div className="space-y-2">
                  {mapping.columnMappings.map((cm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded"
                    >
                      <span className="font-mono text-gray-700">
                        {cm.sourceColumn}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-gray-700">
                        {cm.targetColumn}
                      </span>
                      {cm.transformation && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          {cm.transformation.type}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove Mapping
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              Edit Mapping
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

---

### **Phase 3: Enhanced Features (Future)**

#### 3.1 Mapping Statistics

- Show total columns mapped vs unmapped
- Show transformation count
- Show confidence scores

#### 3.2 Quick Actions

- "View All Mappings" button → Opens full-page view
- "Export Mappings" → Download as JSON/CSV
- "Import Mappings" → Upload previous mapping configuration

#### 3.3 Visual Indicators

- Color-coded confidence levels (green = high, yellow = medium, red = low)
- Icons for transformation types
- Warning badges for unmapped required columns

---

## ✅ Success Criteria

### **Immediate (Phase 1)**

- [ ] Source Tables panel scrolls smoothly
- [ ] Target Tables panel scrolls smoothly
- [ ] Current Mappings panel scrolls smoothly
- [ ] Scrollbars are visible and styled consistently
- [ ] Layout doesn't break on different screen sizes

### **Short-term (Phase 2)**

- [ ] Current Mappings shows clear, actionable cards
- [ ] Clicking a mapping opens detailed view in drawer
- [ ] Can remove mappings from the drawer
- [ ] Can edit mappings from the drawer

### **Long-term (Phase 3)**

- [ ] Full-page mapping management view
- [ ] Import/Export functionality
- [ ] Advanced filtering and search
- [ ] Bulk operations (remove multiple, edit multiple)

---

## 🎨 Design Principles

1. **Consistency with SurveyAI**: Follow the same patterns for scrollable areas, drawers, and detail views
2. **Progressive Disclosure**: Show summary in main view, details in drawer/modal
3. **Visual Hierarchy**: Use spacing, borders, and shadows to create clear sections
4. **Accessibility**: Ensure keyboard navigation and screen reader support
5. **Performance**: Virtualize long lists if needed (React Virtual)

---

## 📝 Technical Notes

### **Critical CSS Properties for Scrolling**

```css
/* Parent container */
.parent {
  display: flex;
  flex-direction: column;
  height: 100%; /* or fixed height */
  min-height: 0; /* CRITICAL: allows flex children to shrink */
}

/* Scrollable child */
.scrollable-child {
  flex: 1; /* takes remaining space */
  min-height: 0; /* CRITICAL: allows overflow to work */
  overflow-y: auto; /* enables scrolling */
}
```

### **Flexbox Gotchas**

- Without `min-height: 0`, flex children won't shrink below their content size
- `overflow: auto` only works when the element has a constrained height
- Use `flex-shrink-0` for fixed-size sections (headers, footers)
- Use `flex-1` for sections that should grow/shrink

---

## ✅ Implementation Status

### **Phase 1: Fix Scrolling - COMPLETED** ✅

- ✅ Custom scrollbar styles added to `globals.css`
- ✅ Wizard layout fixed with `min-h-0` constraint
- ✅ Three-panel layout implemented
- ✅ All panels scroll smoothly with branded scrollbars

### **Phase 2: Improve Current Mappings - COMPLETED** ✅

- ✅ MappingCard component created
- ✅ MappingDetailsDrawer component created (following SurveyAI Sheet pattern)
- ✅ MappingContext created for state management
- ✅ Drawer integrated into table selection step
- ✅ Click mapping to view full details in drawer
- ✅ Remove mappings from drawer
- ✅ Export functionality added

### **Phase 3: Enhanced Features - COMPLETED** ✅

- ✅ Mapping statistics displayed (source columns, target tables, confidence)
- ✅ Visual indicators (badges, icons, color-coded)
- ✅ Quick actions (Export button in header)
- ✅ Column preview in drawer
- ✅ Next steps guidance card

### **Phase 4: UI Polish & Layout Fixes - COMPLETED** ✅

#### Header Separation & Layout Structure

- ✅ Separated top header from notification area (matching SurveyAI)
- ✅ Fixed header to use `h-16` with proper shadow and z-index
- ✅ Updated main content area to use `h-[calc(100vh-64px)]` for proper height
- ✅ Changed background from `bg-gray-100` to `bg-gray-50` to match SurveyAI
- ✅ Updated header title styling to `text-xl font-semibold` (matching SurveyAI)
- ✅ Added "Step X of Y" below title (matching SurveyAI pattern)
- ✅ Improved progress indicator layout with larger circle (64x64)

#### Scrollbar Visibility Fixes

- ✅ **Removed main page scrollbar** by:
  - Adding `overflow: hidden` to html and body elements
  - Changing dashboard layout main from `overflow-y-auto` to `overflow-hidden`
- ✅ **Added scrollbars to table panels**:
  - Source Tables panel has its own scrollbar
  - Target Tables panel has its own scrollbar
  - Current Mappings panel has its own scrollbar
- ✅ Scrollbar styling:
  - Width: `10px` for better visibility
  - Color: Integrove primary (cyan) at 50% opacity
  - Track: Light gray background (`hsl(0 0% 95%)`)
  - Hover effect: Darker cyan (70% opacity)
  - Rounded corners with `border-radius: 5px`

#### Column Number Cutoff Fixes

- ✅ Added `flex-1 min-w-0` to table name containers for proper text truncation
- ✅ Added `truncate` class to table names and schema labels
- ✅ Added `flex-shrink-0 ml-2` to column count badges to prevent cutoff
- ✅ Applied fixes to both Source Tables and Target Tables panels

#### Layout Consistency

- ✅ Matched SurveyAI's protected layout structure
- ✅ Proper header/content separation with shadow
- ✅ Consistent spacing and padding throughout

## 🚀 Next Steps (Future Enhancements)

1. **Import Mappings** - Allow users to upload previous mapping configurations
2. **Bulk Operations** - Select multiple mappings for batch operations
3. **Advanced Filtering** - Filter mappings by confidence, status, etc.
4. **Mapping Templates** - Save and reuse common mapping patterns
5. **Validation Rules** - Add pre-migration validation checks

---

## 📚 References

- **SurveyAI Profile Wizard**: `apps/web/src/app/(admin)/settings/profile/wizard/components/profile-wizard.tsx`
- **SurveyAI Survey Builder**: `apps/web/src/components/ui/scroll-area.tsx`
- **SurveyAI Detailed Responses**: `apps/web/src/app/(protected)/survey-results/campaigns/[id]/detailed-responses/detailed-responses-client.tsx`
- **Flexbox Guide**: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- **Radix UI Scroll Area**: https://www.radix-ui.com/docs/primitives/components/scroll-area
