# Customer Portal UI/UX Template Guide

**Template Location:** `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/`

**Purpose:** This document provides guidance for agents implementing Tasks 1.6-1.9 of the Customer Portal. The template demonstrates the desired visual aesthetic, interaction patterns, and component structure for the customer portal interface.

---

## Overview

The template at `revive-client-portal-main/` is a React + TypeScript + Vite application that showcases a sophisticated document management dashboard. It represents the target UI/UX for the Revive Property Co. customer portal.

**Key Characteristics:**
- Modern, clean interface with motion animations (framer-motion)
- Blueprint-style aesthetic with monochrome color scheme
- Card-based layouts with clear visual hierarchy
- Responsive design with mobile-first approach
- Smooth transitions between views
- Professional, technical feel

---

## Template Structure

### File Organization
```
revive-client-portal-main/
├── src/
│   ├── App.tsx           # Main application with all components (~2000 lines)
│   ├── main.tsx          # Application entry point
│   ├── index.css         # Global styles
│   └── types.ts          # TypeScript interfaces
├── package.json          # Dependencies
└── vite.config.ts        # Vite configuration
```

**Note:** The template is a single-file application with all components defined in App.tsx. For the customer portal, agents should split these into separate components following the project's existing structure.

---

## Key Components and Patterns

### 1. Dashboard Component

**Location:** Lines ~1746-1777 in App.tsx

**Features:**
- Document list view with cards
- Filter controls (All, Quotes, Statements)
- Sort controls (by date, status, order)
- Upload button with drag-and-drop
- Action buttons (view, download, delete)
- Empty state handling

**Key Implementation Details:**
```typescript
const [view, setView] = React.useState<'dashboard' | 'quote' | 'sow' | 'image'>('dashboard');
const [filter, setFilter] = React.useState<'ALL_DOCS' | 'QUOTES' | 'STATEMENTS_OF_WORK'>('ALL_DOCS');
const [sortBy, setSortBy] = React.useState<'issueDate' | 'status'>('issueDate');
```

**Visual Style:**
- Cards with subtle shadows and hover effects
- Status badges with monochrome backgrounds
- Clean typography with clear hierarchy
- Generous whitespace and padding

---

### 2. Header Component

**Location:** Referenced in main render (line ~1748)

**Features:**
- Logo and branding
- Navigation links
- Mobile menu toggle
- User menu with logout

**Design Patterns:**
- Fixed positioning at top
- Responsive hamburger menu on mobile
- Active state highlighting for current page

---

### 3. QuoteView / SOWView Components

**Location:** Lines ~1779-1795 in App.tsx

**Features:**
- Full document details display
- Line item table with pricing
- Status change actions (approve/reject)
- Version history with revert option
- Download as PDF functionality
- Back to dashboard button

**PDF Generation Pattern** (lines ~1482-1616):
```typescript
const handleDownload = (doc: Document) => {
  const pdf = new jsPDF();
  // Header with logo and branding
  // Document metadata grid
  // Line items table (if quote)
  // Terms and conditions (if SOW)
  // Verification block at bottom
  // Watermark
  // Footer
  pdf.save(`${doc.id}_MANIFEST.pdf`);
};
```

---

### 4. Document Upload Component

**Location:** Lines ~1618-1664 in App.tsx

**Features:**
- Drag-and-drop upload area
- File picker button
- Progress tracking per file
- File type validation
- File size validation
- Active uploads list with progress bars

**Key Implementation:**
```typescript
const handleUpload = (files: File[], metadata: UploadMetadata) => {
  const uploadTasks = files.map(file => ({
    id: `RV_UP_${Math.floor(Math.random() * 10000)}`,
    name: file.name.toUpperCase(),
    progress: 0,
    file,
    metadata
  }));

  // Simulate progress with interval
  // On complete: add to documents, remove from active uploads
};
```

---

### 5. Motion and Animations

**Library:** framer-motion (imported as "motion")

**Pattern:**
```typescript
import { motion, AnimatePresence } from 'motion/react';

<AnimatePresence mode="wait">
  {view === 'dashboard' ? (
    <Dashboard key="dashboard" />
  ) : view === 'quote' ? (
    <QuoteView key="quote" />
  ) : null}
</AnimatePresence>
```

**Animation Types:**
- View transitions (fade, slide)
- Card hover effects
- Button press feedback
- Progress animations

---

## Design System

### Color Palette
- **Primary:** Black (#000000)
- **Secondary:** Dark Gray (#333333)
- **Accent:** Neutral grays (#666666, #999999)
- **Background:** White (#FFFFFF)
- **Status Colors:**
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)
  - Info: Blue (#3B82F6)

### Typography
- **Headings:** Sans-serif, bold, tight tracking
- **Body:** Sans-serif, regular
- **Technical/Monospace:** Courier, for codes and IDs

### Spacing
- **Card Padding:** 1.5rem - 2rem
- **Section Gap:** 2rem - 3rem
- **Element Gap:** 0.75rem - 1rem
- **Border Radius:** 0.5rem - 0.75rem

### Shadows
- **Card Shadow:** `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- **Hover Shadow:** `0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)`

---

## Implementation Guidelines for Agents

### Task 1.6 - Dashboard and Navigation
1. Study the Dashboard component structure (lines ~1746-1777)
2. Analyze the Header component for navigation pattern
3. Examine motion/animation approach with AnimatePresence
4. Note the card-based layout and status badge styling
5. Document the visual hierarchy and spacing patterns
6. Create separate components following project structure:
   - `pages/customer/DashboardPage.tsx`
   - `components/CustomerLayout.tsx`
   - `components/CustomerNav.tsx`

### Task 1.7 - Profile Management
1. Review template's form inputs and button styling patterns
2. Adapt card layout for profile sections
3. Use template's input styling (rounded corners, focus states)
4. Apply template's button hover effects
5. Implement smooth transitions between edit/view modes
6. Use template's notification/banner pattern for success/error messages

### Task 1.8 - Document Management
1. Deep-dive into the template's document list implementation
2. Study the filteredAndSortedDocuments logic (lines ~1727-1744)
3. Review handleUpload function for drag-and-drop (lines ~1618-1664)
4. Examine document card layout and metadata display
5. Implement matching filter/sort controls
6. Recreate the upload progress UI with active uploads list
7. Match template's empty state messaging

### Task 1.9 - Quote Management
1. Study QuoteView component structure (lines ~1779-1786)
2. Analyze QUOTE_ITEMS data structure (lines ~300-349)
3. Review handleDownload PDF generation (lines ~1545-1573)
4. Examine status change and version history logic (lines ~1704-1725)
5. Implement line item table with matching styling
6. Recreate approve/reject workflow with confirmations
7. Optional: Implement PDF export using jsPDF and autoTable

---

## Libraries Used in Template

### Required Dependencies (already in project)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "lucide-react": "^0.456.0"
}
```

### Additional Dependencies Needed
```json
{
  "motion": "^11.0.0",           // For framer-motion
  "react-markdown": "^9.0.0",    // For markdown rendering
  "remark-gfm": "^4.0.0",        // For GitHub Flavored Markdown
  "jspdf": "^2.5.0",             // For PDF generation
  "jspdf-autotable": "^3.8.0"    // For PDF tables
}
```

**Note:** These dependencies should be added to package.json if PDF export functionality is required.

---

## Key Code Patterns to Replicate

### 1. State Management with View Switching
```typescript
const [view, setView] = React.useState<'dashboard' | 'quote' | 'sow' | 'image'>('dashboard');

const handleViewQuote = (id: string) => {
  setActiveDocId(id);
  setView('quote');
};
```

### 2. Filter and Sort Logic
```typescript
const filteredAndSortedDocuments = React.useMemo(() => {
  let filtered = [...documents];
  if (filter === 'QUOTES') {
    filtered = filtered.filter(d => d.type === 'QUOTE');
  }
  return filtered.sort((a, b) => {
    const comparison = sortBy === 'issueDate'
      ? new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
      : a.status.localeCompare(b.status);
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}, [documents, sortBy, sortOrder, filter]);
```

### 3. File Upload with Progress
```typescript
const handleUpload = (files: File[], metadata: UploadMetadata) => {
  const uploadTasks = files.map(file => ({
    id: `RV_UP_${Math.floor(Math.random() * 10000)}`,
    name: file.name.toUpperCase(),
    progress: 0,
    file,
    metadata
  }));

  setActiveUploads(prev => [...prev, ...uploadTasks]);

  uploadTasks.forEach(task => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        // Add to documents, remove from active uploads
      }
      setActiveUploads(prev => prev.map(u =>
        u.id === task.id ? { ...u, progress: currentProgress } : u
      ));
    }, 200);
  });
};
```

### 4. PDF Generation (Optional)
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const handleDownload = (doc: Document) => {
  const pdf = new jsPDF();

  // Header
  pdf.setFontSize(20);
  pdf.text('REVIVE PROPERTY CO.', 45, 30);

  // Table
  autoTable(pdf, {
    startY: 105,
    head: [['Description', 'Qty', 'Unit Price', 'GST', 'Total']],
    body: items.map(item => [
      item.description,
      item.unit.toFixed(1),
      `$${item.rate.toFixed(2)}`,
      item.gst,
      `$${item.total.toFixed(2)}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] }
  });

  pdf.save(`${doc.id}_MANIFEST.pdf`);
};
```

---

## Testing Checklist for Agents

Before marking a task complete, verify:

### Visual Design
- [ ] Cards match template's shadow and spacing
- [ ] Status badges use monochrome rectangle style
- [ ] Typography hierarchy matches template
- [ ] Colors match template's palette
- [ ] Hover effects feel similar to template

### Interactions
- [ ] Transitions between views are smooth
- [ ] Buttons have appropriate hover/active states
- [ ] Forms show validation errors clearly
- [ ] Loading states use similar spinners/progress
- [ ] Empty states have clear messaging

### Functionality
- [ ] Filter/sort controls work correctly
- [ ] Upload shows progress and completes
- [ ] Download buttons work (if applicable)
- [ ] Navigation works across all pages
- [ ] Mobile menu is functional

### Responsive Design
- [ ] Layout adapts to mobile (< 768px)
- [ ] Layout adapts to tablet (768px - 1024px)
- [ ] Layout works on desktop (> 1024px)
- [ ] Touch targets are large enough on mobile

---

## Common Pitfalls to Avoid

1. **Don't copy the entire file:** The template is a single-file app. Split components appropriately for the project structure.

2. **Don't hardcode data:** The template uses mock data. Replace with API calls to backend services.

3. **Don't skip animations:** The motion effects are key to the UX feel. Implement similar transitions.

4. **Don't ignore responsive design:** Test on mobile, tablet, and desktop viewport sizes.

5. **Don't forget accessibility:** Ensure proper ARIA labels, keyboard navigation, and focus states.

6. **Don't use complex state management:** The template uses React.useState. Keep it simple unless Redux/zustand is needed.

7. **Don't break the design system:** Follow the established color palette, typography, and spacing consistently.

---

## Next Steps for Agents

1. **Read the template code carefully:** Spend time understanding the structure before implementing.
2. **Identify reusable patterns:** Note which components can be extracted and shared.
3. **Plan component structure:** Decide how to split the template into separate files.
4. **Implement incrementally:** Start with basic layout, then add features one at a time.
5. **Test frequently:** Verify each feature works before moving to the next.
6. **Compare with template:** Regularly check your work against the template to ensure consistency.

---

## Questions or Clarifications?

If anything in this guide is unclear, or if you need clarification on any aspect of the template, please ask before beginning implementation. It's better to clarify upfront than to implement incorrectly.

**Template Path:** `/opt/homelab/apps/revivepropertyco/revive-client-portal-main/`

---

*Document version 1.0 - Created 2026-04-13*
