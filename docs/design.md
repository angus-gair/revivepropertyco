# Design System: Revive Property Co.

## 1. Overview & Creative North Star

**Creative North Star: "The Technical Authority"**

This design system transcends the typical "landscaping website" to establish a bespoke, industrial-grade digital experience that feels less like a service brochure and more like a precision engineering platform. We transition from "contractor utility" to "technical excellence" by using a systematic, grid-driven layout—a signature architectural approach that guides users through a calibrated sequence of professional choices.

To break the "template" aesthetic, we reject the cozy, centered garden-grid in favor of **intentional asymmetry** and technical precision. We utilize compressed vertical spacing, bold typographic hierarchy, and a "Blueprint Protocol" visual metaphor (inspired by technical specifications and architectural drawings) to symbolize the meticulous, engineering-first approach Revive Property Co. brings to property maintenance. This is a system built on tonal restraint, where premium quality is communicated through precision and structure rather than decorative flourish.

**Brand Personality:** Industrial precision meets family-owned warmth. Technical authority without pretension. Canberra's technical standard for property restoration.

---

## 2. Colors

The palette is a disciplined interplay of deep charcoals, forest greens, and warm off-whites—rejecting the typical "garden center" brights in favor of sophisticated, architectural tones.

### The "Technical Surface" Rule
**Explicit Instruction:** Designers are prohibited from using vibrant greens, oranges, or typical "landscaping" colors. The palette must remain within the charcoal-forest-cream spectrum to maintain industrial authority.
- **Base Layer:** `surface-off-white` (#FDFCFB) for primary backgrounds
- **Secondary Surfaces:** `surface-warm` (#F8F7F4) for section differentiation and card backgrounds
- **Primary Action:** `forest-deep` (#36453B) for CTAs, accents, and interactive states
- **Critical Contrast:** `charcoal` (#121212) for primary text, buttons, and footer
- **Structural Definition:** `slate-100` to `slate-200` for subtle borders and separators

### Surface Hierarchy & Nesting
Treat the UI as a stack of technical drawings and premium materials.
- **Base Canvas:** `surface-off-white` (#FDFCFB) - the foundation
- **Section Containers:** `surface-warm` (#F8F7F4) for major content areas
- **Interactive Elements:** Pure white (#FFFFFF) for cards and inputs requiring focus
- **Footer/Foundation:** `charcoal` (#121212) for grounding and technical authority

### Signature Gradients & Overlays
- **Image Overlays:** Use `bg-[#36453B]/5` with `mix-blend-overlay` for subtle image tinting
- **Image Gradients:** `bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent` for text readability on images
- **CTA Depth:** Primary buttons use solid `charcoal` with `hover:bg-[#36453B]` for technical precision

### The "Shadow Stack" Protocol
Shadows are technical tools, not decorative elements.
- **Surface Lift:** `shadow-sm` for standard cards
- **Floating Elements:** `shadow-xl` to `shadow-2xl` for elevated interactive components
- **Colored Shadows:** `shadow-[#36453B]/10` for subtle, brand-aligned depth
- **No Soft Blur:** Avoid excessive blur radii—shadows should be crisp and deliberate

---

## 3. Typography

The typography strategy is built on **Inter**—a precision-engineered typeface designed for clarity on screens. We use dramatic weight contrast and aggressive letter-spacing to create technical authority.

*   **Display & Hero (Inter Black):** `font-black` with `tracking-tighter` (negative spacing) for maximum impact. Use `text-6xl` to `text-8xl` for section headers that establish the technical framework.
*   **Section Titles (Inter Bold):** `font-black` uppercase with `tracking-tighter` for major section headers. Sizes: `text-4xl` to `text-5xl`.
*   **Technical Labels (Inter Bold):** `font-black` uppercase with aggressive letter-spacing (`tracking-[0.4em]` to `tracking-[0.6em]`) and small sizes (`text-[9px]` to `text-[11px]`) for technical specifications and metadata.
*   **Body Copy (Inter Medium):** `font-medium` with standard tracking for readability. Text color: `text-slate-500` or `text-slate-700`.
*   **Visual Hierarchy:** We use "High-Low" contrast—massive display headlines paired with microscopic technical labels. This creates an architectural blueprint aesthetic where information is organized by visual weight, not just size.

### Typographic Color System
- **Primary Text:** `charcoal` (#121212) for maximum contrast
- **Secondary Text:** `slate-500` for body copy and descriptions
- **Technical Labels:** `slate-400` for metadata and specifications
- **Accent Text:** `forest-deep` (#36453B) for brand-aligned emphasis
- **Inverted Text:** White on dark backgrounds for footer and CTAs

---

## 4. Elevation & Depth

We eschew traditional drop shadows in favor of **Technical Layering**—a system of surface definition through background color shifts and precise borders.

*   **The Layering Principle:** Depth is achieved through surface tiering. Place a `bg-white` card on a `bg-[#F8F7F4]` section on a `bg-[#FDFCFB]` base. Each tier creates natural lift without heavy shadows.
*   **Border Precision:** All borders use `border-slate-100` to `border-slate-200` for subtle definition. Critical interactive elements may use `border-[#36453B]` for active states.
*   **The "Gap" System:** Use `gap-px` with `bg-slate-200` backgrounds to create hairline separators between grid items—technical precision that creates visual rhythm.
*   **The "Technical Footprint":** Active states receive a subtle background shift (`bg-[#36453B]/5`) with a `ring-1 ring-[#36453B]` for definition. This creates a "selected component" feel without heavy borders.
*   **The "Vertical Thread":** Use 1px-2px lines in `forest-deep` (#36453B) with reduced opacity (`/20`) to connect sequential steps in the booking flow, representing the "blueprint thread" of the user's journey.

---

## 5. Components

### Buttons
*   **Primary:** `bg-[#121212]` text-white, `rounded-none`, `text-[10px] font-black uppercase tracking-[0.4em]`, `px-10 py-6` for impact. Hover: `bg-[#36453B]` with `transition-all duration-500`. Shadow: `shadow-lg`.
*   **Secondary/Outline:** `border border-[#121212]` text-charcoal, same typography. Hover: `bg-slate-50` or `hover:bg-white hover:text-[#121212]`.
*   **Ghost:** No border, transparent background, `text-slate-400 hover:text-[#121212]` for subtle interactions.

### Cards & Service Selection
*   **Module-Based Matrix:** Replaced dropdowns with high-fidelity service modules. `bg-white p-5 lg:p-6 border border-slate-100`.
*   **Active Calibration:** `border-[#36453B] bg-[#36453B]/5 ring-1 ring-[#36453B] shadow-2xl`. 
*   **Module Serialization:** Includes a technical ID tag (e.g., `[SYS-PW-24]`) and a real-time `animate-pulse` status indicator.
*   **Interactive Load Bar:** Absolute positioned `h-[2px]` progress bar that fills on selection using `cubic-bezier(0.4, 0, 0.2, 1)`.

### Intake Protocols
*   **Vertical Protocol Stack:** Compact LHS vertical buttons for "Remote TeleQuote" vs "Site Execution".
*   **Investment Framework:** RHS panel displaying dynamic price guides (`text-3xl font-black tabular-nums`). Features a blueprint grid overlay (`15px` granularity) and technical watermark.

### Input Fields
*   **Blueprint UI:** Ultra-thin bottom-bordered fields (`border-slate-200 focus:border-[#36453B]`).
*   **Micro-Labels:** Top-aligned technical labels (`text-[7px] font-black uppercase tracking-widest`) that trigger dynamically on `focus` or `fieldErrors`.
*   **Error States:** High-contrast `red-500` error labels with pulsating `[REQUIRED]` markers in the manifest.

### Calendar Picker
*   **Architectural Void Design:** Single, ultra-thin `slate-100` border with CAD-style corner markings.
*   **Selection Hex:** Minimalist square selection indicator that rotates and scales into place.
*   **Time Modules:** UTC-prefixed slots with `Module Load` indicators (Optimum vs Standby). Fixed `72px` module height to prevent vertical stretching.
*   **Segmented Slider:** Premium temporal filter tray (`ALL`, `MORNING`, etc.) with a sliding white selection block.

### Navigation
*   **High-Density Header:** Compacted `h-14` navigation bar. Typography reduced to `text-[10px]` for an industrial, professional intake feel.
*   **Logo:** Refined to a 28px square mark with a single 'R' glyph.

### Technical Manifest
*   **Serial Stamp Look:** Project Coordinate encased in a solid `charcoal` (#121212) block.
*   **Watermarking:** Submerged `RVP` industrial watermark behind manifest data.
*   **Validation Hints:** Real-time red `[REQUIRED]` markers synchronized with Step 2 parameters.

### The "Technical Label" System
*   **Section Headers:** Use pattern: `text-[11px] font-black text-[#36453B] uppercase tracking-[0.5em]` with optional line decoration (`w-6 h-px bg-[#36453B]/20`).
*   **Metadata Labels:** `text-[8px] font-black text-slate-300 uppercase tracking-widest` for technical IDs and specifications.
*   **Numbered Steps:** `01.`, `02.` etc. with the label system for sequential processes.

### Image Containers
*   **Default:** `bg-slate-100 overflow-hidden relative border border-[#121212]/10 shadow-sm group`.
*   **Hover Effect:** `group-hover:scale-105 transition-transform duration-1000` on images.
*   **Text Overlay:** Gradient `bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent` with absolute positioning at `bottom-6 left-6`.
*   **Label Badge:** `text-[8px] font-black text-[#36453B] bg-white px-2 py-1 inline-block uppercase tracking-[0.4em] shadow-sm`.

---

## 6. Layout & Spacing

### The Grid System
- **Container:** `max-w-7xl mx-auto px-4 lg:px-8` for all major sections.
- **Hero Grid:** `grid-cols-1 lg:grid-cols-12` with asymmetric splits (8:4 for text:image).
- **Service Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` with `gap-px` for hairline separators.
- **Booking Grid:** `grid-cols-1 lg:grid-cols-12` with 8:4 split for form:summary.
- **Scheduling Grid:** `md:grid-cols-[1.1fr_1fr]` proportionality to ensure calendar priority.

### The Spacing Scale
- **Section Padding:** `py-8 lg:py-12` for compact high-density intake. Hero: `py-12 lg:py-20`.
- **Component Spacing:** `space-y-10` to `space-y-12` for vertical rhythm.
- **Tight Rhythm:** `gap-2` to `gap-4` for module grouping.
- **Zero-Scroll Success:** Page height locked to `min-h-[calc(100vh-3.5rem)]` for immediate confirmation visibility.

### The "Technical Footer"
- **Base:** `bg-[#121212] text-white pt-24 pb-12` with `border-t-[12px] border-[#36453B]`.
- **Grid:** `grid-cols-1 md:grid-cols-4` with `gap-20 mb-24`.
- **Brand Section:** Large logo with italic quote `text-slate-500 max-w-sm font-medium italic`.
- **Link Columns:** `text-[10px] font-black uppercase tracking-[0.6em] text-[#36453B]` headers with `text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400` links.
- **Bottom Bar:** `pt-12 border-t border-white/5` with `text-[9px] font-bold text-slate-600 uppercase tracking-[0.5em]` copyright.

---

## 7. Motion & Interaction

### Transition Philosophy
All transitions should feel "mechanical" rather than "floaty." Use `duration-500` for standard interactions, `duration-700` for major state changes.

*   **Button Hovers:** `transition-all duration-500` with color shifts and potential icon movement (`group-hover:translate-x-2`).
*   **Card Hovers:** `duration-300` for background shifts, `duration-1000` for image scales.
*   **Page Transitions:** Use `animate-in fade-in slide-in-from-bottom-4 duration-700` for step changes.
*   **Loading States:** `animate-spin` for loaders, `animate-pulse` for active indicators.

### Micro-Interactions
*   **Icon Transforms:** `group-hover:rotate-12 scale-110` for active states
*   **Text Transforms:** `group-hover:translate-x-3` for arrow icons on hover
*   **Background Shifts:** `group-hover:opacity-100` with `duration-500` for decorative elements

---

## 8. Do's and Don'ts

### Do
*   **Do** use asymmetric layouts. The 8:4 grid split creates visual interest and technical authority.
*   **Do** prioritize "Breathing Room." Use generous padding (`p-10` to `p-16`) and vertical spacing (`space-y-16`).
*   **Do** use `forest-deep` (#36453B) accents sparingly. It's a technical accent, not a primary color.
*   **Do** maintain the "technical label" system with consistent sizing and letter-spacing.
*   **Do** use `gap-px` with `bg-slate-200` for precise grid separators instead of border-heavy designs.
*   **Do** implement the "blueprint" metaphor with numbered steps (01., 02., etc.) and technical IDs.

### Don't
*   **Don't** use vibrant greens, oranges, or typical landscaping colors. Stay within the charcoal-forest-cream spectrum.
*   **Don't** use rounded corners. Keep `rounded-none` for technical precision.
*   **Don't** use heavy drop shadows. Use surface layering and subtle shadows instead.
*   **Don't** use pure white for text. Always use appropriate slate colors or `charcoal` (#121212) for contrast.
*   **Don't** use centered layouts for major content. Use grid-based asymmetric layouts.
*   **Don't** use standard "Select" dropdowns without custom styling. Apply the technical label system.
*   **Don't** use decorative fonts. Inter is the only typeface—use weight and spacing for variety.
*   **Don't** use bright or saturated colors for interactive states. Use the forest-green system for all hover/active states.

---

## 9. Responsive Behavior

### Breakpoints
- **Mobile First:** All layouts start with single column (`grid-cols-1`)
- **Small:** `sm:` breakpoint (640px) - enable 2-column grids
- **Large:** `lg:` breakpoint (1024px) - enable full asymmetric layouts (8:4, 12-column grids)

### Mobile Adaptations
- **Typography:** Scale down display sizes (`text-5xl` instead of `text-8xl`) on mobile
- **Padding:** Reduce to `py-12` on mobile, `py-20` on desktop
- **Navigation:** Collapse to hamburger menu below `md:` breakpoint
- **Grid:** Collapse to single column, stack vertically with appropriate spacing

### Touch Targets
- **Minimum Button Size:** `py-6 px-10` for primary actions
- **Tap Spacing:** Ensure adequate spacing between interactive elements
- **Mobile Menu:** Full-width overlay with `p-10` padding and `space-y-8` between links

---

## 10. Accessibility Notes

- **Color Contrast:** All text combinations meet WCAG AA standards
- **Focus States:** All interactive elements have visible `focus:` states with `outline:` or border changes
- **Semantic HTML:** Use proper heading hierarchy (h1 → h2 → h3)
- **Form Labels:** All inputs have associated labels or descriptive placeholders
- **Keyboard Navigation:** All interactive elements are keyboard accessible with visible focus indicators
- **Touch Targets:** Minimum 44x44px for mobile touch targets

---

## 11. Brand Voice & Copy

### Tone
Technical precision without pretension. Authoritative but approachable. Industrial terminology mixed with family-owned warmth.

### Key Phrases & Terminology
- "Technical Authority" - for establishing expertise
- "Operational Disciplines" - for service categories
- "Calibration", "Protocol", "Matrix" - technical process language
- "Canberra and the ACT corridor" - geographic precision
- "Architectural-grade", "Precision execution" - quality descriptors
- "Intake Protocol", "Manifest Construction" - booking flow terminology

### Naming Conventions
- Services: "Pressure Restoration" (not just washing), "Epoxy Systems" (not just regrouting)
- Processes: "TeleQuote Remote", "Site Commencement" (not just quote/job)
- Locations: "Canberra Base Matrix", "Primary Service Areas"

---

**Design System Version:** 1.0  
**Last Updated:** 2026-04-08  
**Maintained By:** Revive Property Co. Digital Team
