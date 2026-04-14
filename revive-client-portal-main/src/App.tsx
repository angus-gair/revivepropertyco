import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  User, 
  ChevronRight, 
  Download, 
  MessageSquare,
  Filter,
  ArrowUpRight,
  Search,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  History,
  RotateCcw,
  Upload,
  Check,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Document, Stat, LineItem, DocumentVersion } from './types';

// --- Mock Data ---
const SOW_MARKDOWN = `
# STATEMENT OF WORK
## Bathroom Tile Rescue & Restoration

---

**Prepared by:** Revive Property Co.
**Contractor:** Angus Gair
**Prepared for:** Sarah Kylie
**Date:** 12 April 2026
**Reference No.:** SOW-2026-001
**Site Address:** Edmondson Park NSW 2174

---

## 1. Executive Summary

This Statement of Work outlines the full scope of remediation required to restore a bathroom tiled in large-format marble-look porcelain tiles following a failed re-grouting installation. The previous contractor applied epoxy grout without adequately cleaning the tile surfaces during or after application, resulting in widespread hardened epoxy haze and residue across the tile faces. In addition, an unidentified grey sealant material (assessed on-site as silicone or grey polymer caulk) has been applied around the perimeter edges, toilet base, and fixture cutouts in an inconsistent and aesthetically unacceptable manner.

The bathroom has also been partially dismantled — the shower screen has been removed, tap sets and supply pipes have been pulled out, and the space is currently unoccupied. This provides beneficial access for the remediation work but will require careful management of exposed fittings and open penetrations.

The objective of this engagement is to fully restore the tile surfaces to a clean, professional, and sealed finish with correct grout joints and appropriate silicone detailing, leaving the bathroom ready for reassembly of fixtures.

---

## 2. Site Observations

Based on photographic evidence provided prior to site attendance, the following defects have been identified:

### 2.1 Epoxy Grout Haze / Residue (Critical)
The primary defect is a widespread epoxy grout haze covering the majority of the large-format marble-look porcelain floor tiles and the raised toilet plinth area. Thermal imaging and annotated photographs confirm the contamination extends across virtually the entire tile surface — not isolated to grout joints. This occurred because the installer failed to clean tiles during and immediately after epoxy application, allowing the resin component to film and cure directly on the tile face.

Hardened epoxy residue is significantly more difficult to remove than cement-based grout haze. The degree of cure will be assessed on-site; however, given the timeframe since installation, the epoxy is likely fully cured, requiring a multi-stage chemical and mechanical removal strategy.

### 2.2 Grey Sealant Material (Silicone / Caulk) — Unknown Product
A grey-coloured material has been applied around:
- The toilet base and cistern collar
- Perimeter wall-to-floor junctions
- Step/threshold edges

The product is likely a grey silicone or polymer caulk, possibly applied in an attempt to conceal poor grouting at these junctions. It has been applied unevenly and over contaminated surfaces. It must be identified, safely removed, and replaced with correct-colour, sanitary-grade neutral-cure silicone in the appropriate locations only.

**On-site identification method:** A utility knife test will be used to determine whether the material is silicone (stretchy, rubbery cut) or a cementitious/polymer caulk (crumbly, brittle cut). This will determine the chemical removal strategy.

### 2.3 Potentially Incorrect Grout Joint Placement
Annotated photos suggest some grout lines may have been applied in incorrect positions relative to the tile layout. This will be confirmed on-site after the epoxy haze is removed, revealing the true tile edges.

### 2.4 Tile Surface Condition — Marble-Look Porcelain
The tiles appear to be large-format polished or semi-polished marble-look porcelain (approximately 600×600mm or 800×800mm). This surface type:
- Is **not** acid-sensitive (unlike genuine marble), allowing a broader range of chemical treatments
- May carry a factory micro-gloss finish that can be dulled by abrasive over-scrubbing
- Will require sealing after restoration to prevent future staining

### 2.5 Bathroom Dismantled State
The following fixtures are absent and will not be reinstated under this scope unless separately agreed:
- Shower screen / frameless glass panel
- Tap sets and shower mixer
- Supply pipes and water connections

Pipe penetrations and wall outlets will be masked during chemical application to prevent chemical ingress into the wall cavity.

---

## 3. Scope of Works

### Phase 1 — Mobilisation & Assessment (Day 1 — Morning)

- Attend site, photograph existing conditions in detail
- Perform identification test on grey sealant material
- Conduct test patches in inconspicuous areas using selected chemical products to assess response of tile surface and grout to treatments
- Confirm removal strategy and product selection based on test results
- Mask all open pipe penetrations, wall outlets, and the toilet base flange
- Protect bath, vanity (if present), and all adjacent surfaces with drop sheets

### Phase 2 — Epoxy Grout Haze & Residue Removal (Day 1 — Afternoon through Day 2)

This is the most labour-intensive phase of the remediation. The following multi-stage approach will be used:

**Step 2A — Heavy Epoxy Residue Removal (Coating Stripper)**
- Apply **Aqua Mix Sealer & Coating Remover** (full strength) to manageable 0.5–1m² sections
- Allow dwell time of 10–20 minutes (longer for heavily cured areas)
- Agitate with white nylon scrub pads and a hand scrub machine
- Remove suspended epoxy using a heavy-duty grout sponge and wet vacuum
- Rinse thoroughly with clean water
- Repeat as necessary — heavily cured epoxy may require 3–5 applications per section

**Step 2B — Residual Haze Removal (Abrasive Cream Cleaner)**
- Follow-up with **Aqua Mix NanoScrub** applied to pre-wet tile sections
- Agitate with white nylon pads to lift remaining micro-haze from within the tile surface
- Wet vacuum, rinse, and assess after each pass
- NanoScrub is safe for polished and semi-polished porcelain and will not etch the surface

**Step 2C — Stubborn Spots (Targeted Heat Treatment)**
- For any cured epoxy blobs or ridges not responding to chemical treatment, a heat gun will be used to soften the epoxy (target 100°C surface temperature)
- Softened material will be lifted with a plastic razor blade at a low angle
- Area then retreated chemically and rinsed

**Note:** All chemical work will be carried out with windows and door open for ventilation. PPE (nitrile gloves, safety glasses, P2 mask) will be worn throughout.

### Phase 3 — Grey Sealant Removal (Day 2 — Afternoon)

- **If silicone:** Apply **Selleys Silicone Remover** or equivalent silicone digester along all affected edges. Allow dwell per manufacturer instructions, then lift using a plastic scraper. Residue removed with acetone on a cloth. Area cleaned and dried before reapplication.
- **If caulk/polymer:** Cut along both edges with a sharp utility knife, peel away, and clean residue with **Sealers Plus Strip-It** and a scrub pad. Rinse and dry.
- All surfaces to be free of residue before new silicone is applied.

### Phase 4 — Grout Joint Assessment & Touch-Up Grouting (Day 3 — Morning)

- After tile surfaces are clean and dry, inspect all grout joints for:
  - Missing or hollow grout
  - Incorrectly placed grout lines
  - Cracked or contaminated joints
- Rake out any unsound grout using an oscillating multi-tool with carbide grout blade
- Regrout affected joints using **Mapei Kerapoxy Design** or **Ardex WA Epoxy Grout** in the matching colour
- Epoxy grout selected to match existing installation (colour to be confirmed on-site)
- Joints cleaned during application — no haze will be left on tile faces

### Phase 5 — Silicone Bead Reinstatement (Day 3 — Late Morning)

- Apply fresh beads of **Parfix Neutral Cure Silicone** (or **Selleys Wet Area Silicone**) to all wall-to-floor perimeter junctions, the toilet base collar, and any movement joints
- Colour to be matched to grout colour (typically white or light grey for marble-look tile)
- Tool to a neat concave profile and allow to cure per manufacturer instructions (minimum 24 hours before exposure to water)

### Phase 6 — Tile Sealing (Day 3 — Afternoon)

- Allow tiles to dry completely (minimum 24–48 hours after final rinse)
- Apply **Aqua Mix Sealer's Choice Gold** penetrating sealer to all tile and grout surfaces
- Two coats, with the second coat applied before the first has fully dried (wet-on-wet)
- Buff excess sealer with a clean microfibre cloth
- Sealer protects against oil and water-based staining for up to 15 years (manufacturer's claim)

### Phase 7 — Final Inspection & Handover (Day 3 — Late Afternoon)

- Complete final visual inspection across all tile surfaces
- Confirm no haze, residue, or silicone contamination remains
- Photograph completed work
- Provide client with maintenance instructions for sealed porcelain tiles and epoxy grout
- Site left clean and tidy

---

## 4. Exclusions (Not in Scope)

The following items are **excluded** from this Statement of Work:

- Reinstallation of shower screen or glass panels
- Reinstallation of tap sets, mixers, or shower heads
- Plumbing works (pipe reconnection, pressure testing)
- Replacement of any cracked or damaged tiles
- Waterproofing membrane inspection or repair
- Wall tile cleaning or grouting (floor tiles only, unless otherwise noted)
- Any rectification of underlying substrate issues discovered after tile removal or deep probing
- Rubbish removal beyond site tidy (chemical containers disposed of per manufacturer requirements)

Any variations identified during works will be communicated to the client immediately with a written variation quote before proceeding.

---

## 5. Assumptions

- The tile surface is porcelain (not genuine marble). If genuine marble is identified on-site, the chemical treatment protocol will be revised and costs may change.
- The bathroom is accessible during all working days without obstruction.
- Water supply to the site is available for rinsing.
- The client will confirm grout and silicone colour preference prior to Phase 4 commencing.
- Adequate ventilation can be achieved by opening windows and/or the bathroom door.

---

## 6. Products & Materials

All products referenced are commercially available in Australia from authorised distributors.

| Product | Supplier | Use |
|---|---|---|
| Aqua Mix Sealer & Coating Remover | Aquamix Australia / TradieCart | Epoxy haze — primary removal |
| Aqua Mix NanoScrub (3.8L) | Aquamix Australia / TradieCart | Epoxy haze — residual/finishing |
| Sealers Plus Strip-It | Sealers Plus (sealersplus.com.au) | Heavy epoxy residue & caulk removal |
| Selleys Silicone Remover | Bunnings / Total Tools | Silicone sealant removal |
| Mapei Kerapoxy Design Epoxy Grout | Mapei Australia / tile suppliers | Grout touch-up joints |
| Parfix Neutral Cure Silicone | Bunnings / Total Tools | Perimeter & junction sealing |
| Aqua Mix Sealer's Choice Gold (3.8L) | Aquamix Australia / TradieCart | Final penetrating tile & grout sealer |

**Note on acid cleaners:** Acid-based cleaners (e.g., sulphamic acid, hydrochloric acid) are NOT recommended for marble-look porcelain due to the risk of etching the polished surface coating. Only pH-neutral and specialist epoxy removal products will be used.

---

## 7. Timeline

| Day | Phases | Activity |
|---|---|---|
| Day 1 | 1, 2A & 2B | Mobilisation, site assessment, test patches, surface masking. Full epoxy stripper application (Sealer & Coating Remover) across all tile sections. NanoScrub follow-up on residual haze. |
| Day 2 | 2C, 3, 4 & 5 | Stubborn spot heat treatment. Grey sealant identification and removal. Grout joint assessment, raking, and touch-up regrouting. Silicone bead reinstatement at all perimeter junctions and toilet collar. |
| Day 3 | 6 & 7 | Two-coat penetrating sealer application, buff and cure. Final inspection, photography, site clean, and client handover. |

*Timeline assumes unobstructed access and no unexpected complications. If genuine marble or extensive additional joint raking is discovered, a 1-day extension may be required — a variation notice will be issued before any extension proceeds.*

---

## 8. Warranty

The contractor warrants all remediation works against defects in workmanship for a period of **12 months** from the date of completion, subject to the client following the maintenance guidelines provided at handover. This warranty does not cover damage caused by:
- Inappropriate cleaning products (e.g., bleach, acid cleaners, abrasive scourers)
- Physical impact or tile cracking
- Movement in the substrate or building structure
- Failure of the original tile installation substrate

---

## 9. Client Responsibilities

- Provide clear access to the bathroom on all scheduled work days
- Confirm grout colour and silicone colour selection at least 48 hours before Day 4
- Do not allow the bathroom to be used or the tiles to be walked on between Day 4 and Day 5 (grout and silicone curing period)
- Do not wet the tile surfaces for a minimum of 24 hours after sealer application

---

## 10. Acceptance

By signing below, the client confirms they have read and agreed to the scope, exclusions, and terms set out in this Statement of Work.

| | |
|---|---|
| **Client Name:** | _________________________________ |
| **Signature:** | _________________________________ |
| **Date:** | _________________________________ |

| | |
|---|---|
| **Contractor Name:** | _________________________________ |
| **Signature:** | _________________________________ |
| **Date:** | _________________________________ |

---

*All works carried out in accordance with AS 3958.1 (Ceramic Tiles — Guide to the Installation of Ceramic Tiles) and relevant Australian Standards. Contractor holds current public liability insurance.*
`;

const DOCUMENTS: Document[] = [
  {
    id: 'RV_SW_2026_001',
    projectName: 'BATHROOM TILE RESCUE',
    type: 'SOW',
    name: 'STATEMENT OF WORK',
    issueDate: 'Apr 12, 2026',
    status: 'IN REVIEW',
    currentVersion: 1,
    history: [
      { version: 1, timestamp: '2026-04-12 09:00', status: 'IN REVIEW', note: 'Initial SOW release' }
    ]
  },
  {
    id: 'RV_QT_2026_001',
    projectName: 'BATHROOM TILE RESCUE',
    type: 'QUOTE',
    name: 'QUOTE',
    issueDate: 'Apr 12, 2026',
    status: 'IN REVIEW',
    amount: '$1,228.48',
    currentVersion: 2,
    history: [
      { version: 1, timestamp: '2026-04-10 14:30', status: 'IN REVIEW', amount: '$1,396.00', note: 'Draft quote' },
      { version: 2, timestamp: '2026-04-12 10:15', status: 'IN REVIEW', amount: '$1,228.48', note: 'Applied 20% discount' }
    ]
  }
];

const QUOTE_ITEMS: LineItem[] = [
  { 
    description: 'Phase 1 — Mobilisation & Assessment', 
    subDescription: 'Site assessment, test patches, surface masking', 
    unit: 2.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 90.00 
  },
  { 
    description: 'Phase 2A — Epoxy Grout Haze Removal', 
    subDescription: 'Sealer & Coating Remover (multiple applications)', 
    unit: 6.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 270.00 
  },
  { 
    description: 'Phase 2B — Residual Haze Removal', 
    subDescription: 'NanoScrub abrasive cream, section by section', 
    unit: 2.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 90.00 
  },
  { 
    description: 'Phase 2C — Stubborn Spot Treatment', 
    subDescription: 'Heat gun softening & plastic razor lift', 
    unit: 2.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 90.00 
  },
  { 
    description: 'Phase 3 — Grey Sealant Removal', 
    subDescription: 'Perimeter edges, toilet base collar, step edges', 
    unit: 2.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 90.00 
  },
  { 
    description: 'Phase 4 — Grout Joint Assessment', 
    subDescription: 'Raking, assessment and touch-up regrouting', 
    unit: 2.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 90.00 
  },
  { 
    description: 'Phase 5 — Silicone Bead Reinstatement', 
    subDescription: 'Perimeter junctions, toilet collar, movement joints', 
    unit: 1.5, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 67.50 
  },
  { 
    description: 'Phase 6 — Tile Sealing', 
    subDescription: 'Two-coat penetrating tile sealer application', 
    unit: 1.5, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 67.50 
  },
  { 
    description: 'Phase 7 — Final Inspection & Handover', 
    subDescription: 'Photography, site clean, client handover', 
    unit: 1.0, 
    rate: 45.00, 
    gst: '10.0%', 
    total: 45.00 
  },
  { 
    description: 'Aqua Mix Sealer & Coating Remover 3.8L', 
    subDescription: 'Primary epoxy haze stripper', 
    unit: 1.0, 
    rate: 82.00, 
    gst: '10.0%', 
    total: 82.00 
  },
  { 
    description: 'Aqua Mix NanoScrub 3.8L', 
    subDescription: 'Residual epoxy micro-haze removal', 
    unit: 1.0, 
    rate: 78.00, 
    gst: '10.0%', 
    total: 78.00 
  },
  { 
    description: 'Selleys Silicone Remover 100g', 
    subDescription: 'Chemical digester for silicone removal', 
    unit: 1.0, 
    rate: 18.00, 
    gst: '10.0%', 
    total: 18.00 
  },
  { 
    description: 'Mapei Kerapoxy Design Epoxy Grout 5kg', 
    subDescription: 'Touch-up grouting to damaged joints', 
    unit: 1.0, 
    rate: 95.00, 
    gst: '10.0%', 
    total: 95.00 
  },
  { 
    description: 'Parfix Neutral Cure Silicone 300ml', 
    subDescription: 'Wet-area silicone for perimeter beads', 
    unit: 3.0, 
    rate: 14.00, 
    gst: '10.0%', 
    total: 42.00 
  },
  { 
    description: 'Aqua Mix Sealer\'s Choice Gold 3.8L', 
    subDescription: 'Premium penetrating sealer', 
    unit: 1.0, 
    rate: 125.00, 
    gst: '10.0%', 
    total: 125.00 
  },
  { 
    description: 'White Nylon Scrub Pads (10 pack)', 
    subDescription: 'Agitation pads for chemical application', 
    unit: 1.0, 
    rate: 22.00, 
    gst: '10.0%', 
    total: 22.00 
  },
  { 
    description: 'Heavy-Duty Grout Sponges (5 pack)', 
    subDescription: 'Solution removal and rinsing', 
    unit: 1.0, 
    rate: 18.00, 
    gst: '10.0%', 
    total: 18.00 
  },
  { 
    description: 'Plastic Razor Blades / Scrapers (25 pack)', 
    subDescription: 'Lifting softened epoxy blobs', 
    unit: 1.0, 
    rate: 16.00, 
    gst: '10.0%', 
    total: 16.00 
  }
];

// --- Components ---

const FloatingBackButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="fixed bottom-12 left-6 md:left-12 z-50 flex items-center gap-4 bg-white border border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 group"
  >
    <div className="relative w-8 h-8 border border-neutral-200 flex items-center justify-center group-hover:border-black transition-colors">
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-neutral-400 group-hover:border-black" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-neutral-400 group-hover:border-black" />
      <ChevronRight className="rotate-180" size={16} />
    </div>
    <span className="font-display text-[0.6rem] font-bold tracking-[0.4em] uppercase pr-2 text-neutral-400 group-hover:text-black transition-colors hidden sm:block">
      BACK_TO_DASHBOARD
    </span>
  </motion.button>
);

const StatusBadge = ({ status, className = "" }: { status: string, className?: string }) => {
  const config: Record<string, { color: string, icon: React.ReactNode }> = {
    'APPROVED': {
      color: 'text-green-700 bg-green-100 border-green-300',
      icon: <CheckCircle2 size={12} />
    },
    'ACTION REQUIRED': {
      color: 'text-red-700 bg-red-100 border-red-300',
      icon: <AlertCircle size={12} />
    },
    'IN REVIEW': {
      color: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      icon: <Clock size={12} />
    },
    'READY TO HIRE': {
      color: 'text-blue-700 bg-blue-100 border-blue-300',
      icon: <ShieldCheck size={12} />
    }
  };

  const current = config[status] || {
    color: 'text-neutral-700 bg-neutral-100 border-neutral-300',
    icon: <MoreHorizontal size={12} />
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-2 ${current.color} font-mono text-[0.6rem] font-bold tracking-wider uppercase shadow-sm ${className}`}>
      {current.icon}
      {status}
    </div>
  );
};

const VersionHistory = ({ 
  history, 
  currentVersion, 
  onRevert 
}: { 
  history: DocumentVersion[], 
  currentVersion: number,
  onRevert: (version: DocumentVersion) => void
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="mt-8 border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History size={16} className="text-neutral-400" />
          <span className="font-display text-[0.65rem] font-bold tracking-[0.2em] uppercase">Version History</span>
          <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded text-[0.6rem] font-mono">v{currentVersion}</span>
        </div>
        <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-neutral-100"
          >
            <div className="p-6 space-y-4">
              {[...history].reverse().map((v) => (
                <div key={v.version} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-neutral-100 rounded bg-neutral-50/30">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[0.6rem] font-bold text-neutral-400">v{v.version}</span>
                      <StatusBadge status={v.status} />
                      {v.version === currentVersion && (
                        <span className="text-[0.55rem] font-display font-bold tracking-widest text-neutral-300 uppercase">Current</span>
                      )}
                    </div>
                    <p className="text-[0.7rem] font-medium text-neutral-600">{v.note}</p>
                    <div className="text-[0.6rem] text-neutral-400 font-mono">{v.timestamp}</div>
                  </div>
                  {v.version !== currentVersion && (
                    <button
                      onClick={() => onRevert(v)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 border border-black font-display text-[0.55rem] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all"
                    >
                      <RotateCcw size={12} />
                      Revert
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Header = ({ onNavigate }: { onNavigate: (view: 'dashboard' | 'quote' | 'sow' | 'image') => void }) => (
  <header className="sticky top-0 z-50 bg-white border-b border-outline-variant px-4 md:px-12 h-16 md:h-20 flex items-center justify-between">
    <div className="flex items-center gap-4 md:gap-12">
      <a 
        href="https://revivepropertyco.au/"
        className="font-display font-bold text-sm md:text-xl tracking-tighter cursor-pointer hover:text-neutral-600 transition-colors whitespace-nowrap"
      >
        REVIVE_BLUEPRINT
      </a>
      <div className="hidden lg:block font-display text-[0.65rem] tracking-[0.3em] text-neutral-400">
        PORTAL_ACCESS_AUTHORIZED // REF_SYS_V1.0
      </div>
    </div>
    <div className="flex items-center gap-2 md:gap-6">
      <button className="p-1.5 md:p-2 hover:bg-surface-low transition-colors">
        <User size={16} className="md:w-5 md:h-5" />
      </button>
      <button className="p-1.5 md:p-2 hover:bg-surface-low transition-colors">
        <Settings size={16} className="md:w-5 md:h-5" />
      </button>
      <a 
        href="https://revivepropertyco.au/"
        className="bg-black text-white px-3 md:px-6 py-1.5 md:py-2 font-display text-[0.55rem] md:text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center"
      >
        <span className="hidden sm:inline">LOGOUT</span>
        <LogOut size={12} className="sm:hidden" />
      </a>
    </div>
  </header>
);

interface ActiveUpload {
  id: string;
  name: string;
  progress: number;
}

interface UploadMetadata {
  type: 'QUOTE' | 'SOW' | 'MANIFEST' | 'IMAGE';
  projectName: string;
  comment: string;
}

const UploadModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  projects,
  filesCount 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (metadata: UploadMetadata) => void,
  projects: string[],
  filesCount: number
}) => {
  const [type, setType] = React.useState<'QUOTE' | 'SOW' | 'MANIFEST' | 'IMAGE'>('SOW');
  const [projectName, setProjectName] = React.useState('');
  const [isNewProject, setIsNewProject] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [comment, setComment] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      type,
      projectName: isNewProject ? newProjectName : projectName,
      comment
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white border border-black shadow-2xl p-8 md:p-12 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 blueprint-grid opacity-5 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tighter uppercase leading-none mb-2">UPLOAD_METADATA</h2>
            <div className="font-display text-[0.6rem] tracking-[0.3em] text-neutral-400 uppercase">
              PREPARING_{filesCount}_ASSETS_FOR_INGESTION
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 uppercase">DOCUMENT_TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              {(['QUOTE', 'SOW', 'MANIFEST', 'IMAGE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-3 font-display text-[0.6rem] font-bold tracking-widest border transition-all ${type === t ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200 hover:border-black hover:text-black'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 uppercase">PROJECT_REFERENCE</label>
            {!isNewProject ? (
              <div className="space-y-4">
                <select 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-surface-low border border-neutral-200 px-4 py-4 font-display text-xs tracking-widest uppercase focus:outline-none focus:border-black"
                  required
                >
                  <option value="">SELECT_EXISTING_PROJECT</option>
                  {projects.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => setIsNewProject(true)}
                  className="text-[0.6rem] font-display font-bold tracking-widest text-black underline underline-offset-4 hover:text-neutral-500 transition-colors uppercase"
                >
                  + CREATE_NEW_PROJECT
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input 
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="ENTER_NEW_PROJECT_NAME"
                  className="w-full bg-surface-low border border-neutral-200 px-4 py-4 font-display text-xs tracking-widest uppercase focus:outline-none focus:border-black"
                  required
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setIsNewProject(false)}
                  className="text-[0.6rem] font-display font-bold tracking-widest text-black underline underline-offset-4 hover:text-neutral-500 transition-colors uppercase"
                >
                  ← SELECT_EXISTING
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block font-display text-[0.6rem] font-bold tracking-widest text-neutral-400 uppercase">COMMENTS_ADVISORY</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ADD_TECHNICAL_NOTES_OR_INSTRUCTIONS"
              className="w-full bg-surface-low border border-neutral-200 px-4 py-4 font-display text-xs tracking-widest uppercase focus:outline-none focus:border-black min-h-[100px] resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-white py-5 font-display text-[0.7rem] font-bold tracking-[0.4em] hover:bg-neutral-800 transition-all uppercase shadow-xl"
          >
            CONFIRM_INGESTION_PROTOCOL
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const FileUpload = ({ onUpload, projects, children, className }: { onUpload: (files: File[], metadata: UploadMetadata) => void, projects: string[], children?: React.ReactNode, className?: string }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setPendingFiles(files);
    }
  };

  const handleConfirm = (metadata: UploadMetadata) => {
    if (pendingFiles) {
      onUpload(pendingFiles, metadata);
      setPendingFiles(null);
    }
  };

  React.useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onUpload]);

  return (
    <>
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8"
          >
            <div className="border-2 border-dashed border-white/30 w-full h-full flex flex-col items-center justify-center text-white">
              <Upload size={48} className="mb-6" />
              <h2 className="text-2xl md:text-3xl font-display font-bold tracking-widest uppercase">DROP_TECHNICAL_ASSETS_HERE</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingFiles && (
          <UploadModal 
            isOpen={!!pendingFiles}
            onClose={() => setPendingFiles(null)}
            onConfirm={handleConfirm}
            projects={projects}
            filesCount={pendingFiles.length}
          />
        )}
      </AnimatePresence>

      <div className={`relative inline-block ${className || ''}`}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files ? Array.from(e.target.files) : [])}
          className="hidden" 
          multiple
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full text-left"
        >
          {children || (
            <div className="flex items-center gap-2 text-[0.55rem] md:text-[0.6rem] font-display font-bold tracking-[0.2em] text-neutral-400 hover:text-black transition-colors uppercase">
              <Upload size={12} />
              UPLOAD_ASSETS
            </div>
          )}
        </button>
      </div>
    </>
  );
};

const Dashboard = ({ 
  documents, 
  handleUpload, 
  activeUploads,
  projects,
  onViewQuote, 
  onViewSOW,
  onViewImage,
  sortBy, 
  sortOrder, 
  onSort,
  onDownload,
  filter,
  onFilter
}: { 
  documents: Document[], 
  handleUpload: (files: File[], metadata: UploadMetadata) => void, 
  activeUploads: ActiveUpload[],
  projects: string[],
  onViewQuote: (id: string) => void, 
  onViewSOW: (id: string) => void,
  onViewImage: (id: string) => void,
  sortBy: string, 
  sortOrder: 'asc' | 'desc', 
  onSort: (field: 'issueDate' | 'status') => void,
  onDownload: (doc: Document) => void,
  filter: 'ALL_DOCS' | 'QUOTES' | 'STATEMENTS_OF_WORK',
  onFilter: (filter: 'ALL_DOCS' | 'QUOTES' | 'STATEMENTS_OF_WORK') => void,
  key?: string 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="min-h-screen bg-surface"
  >
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
      {/* Hero Section */}
      <div className="mb-12 md:mb-24 p-6 md:p-20 bg-white border border-outline-variant relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 blueprint-grid opacity-[0.03] pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 md:gap-12 relative z-10">
          <div className="w-full">
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tighter leading-[0.9] md:leading-[0.85] mb-6 md:mb-8 uppercase break-words">
              WELCOME,<br />SARAH KYLIE.
            </h1>
            <div className="max-w-xl">
              <p className="text-sm md:text-lg text-neutral-500 leading-relaxed font-medium">
                Access your maintenance blueprints below. Thank you for your continued partnership with Revive Property Co.
                <FileUpload onUpload={handleUpload} projects={projects} className="ml-2">
                  <span className="text-black underline underline-offset-4 hover:text-neutral-600 transition-colors cursor-pointer">Upload new assets</span>
                </FileUpload>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6 font-display text-[0.5rem] md:text-[0.65rem] tracking-widest text-neutral-400 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 animate-pulse" />
            SECURE CONNECTION_ESTABLISHED
          </div>
          <div className="hidden sm:block">LAT: 51.5074 / LONG: 0.1278</div>
          <div className="ml-auto opacity-50">REF_SYS_V1.04</div>
        </div>
      </div>

      {/* Active Uploads / Transfer Log */}
      <AnimatePresence>
        {activeUploads.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-12 md:mb-24 bg-black text-white p-6 md:p-12 border border-outline-variant shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 blueprint-grid opacity-10 pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-2 bg-blue-500 animate-pulse" />
              <h3 className="font-display text-xs font-bold tracking-[0.3em] uppercase">ACTIVE_DATA_TRANSFERS</h3>
            </div>
            
            <div className="space-y-6">
              {activeUploads.map(upload => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex justify-between items-end font-display text-[0.6rem] tracking-widest uppercase">
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{upload.id}</span>
                      <span className="font-bold">{upload.name}</span>
                    </div>
                    <div className="text-neutral-400">
                      {upload.progress === 100 ? 'VERIFIED' : `SYNCING_${Math.round(upload.progress)}%`}
                    </div>
                  </div>
                  <div className="w-full h-[1px] bg-neutral-800 relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${upload.progress}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Section */}
      <div className="mb-24 md:mb-32 bg-white border border-outline-variant shadow-sm overflow-hidden relative">
      <div className="p-6 md:p-16 border-b border-outline-variant bg-surface-low/30">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 md:gap-8">
          <div className="flex-1 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">YOUR DOCUMENTS</h2>
            <div className="font-display text-[0.5rem] md:text-[0.65rem] tracking-[0.2em] md:tracking-[0.3em] text-neutral-400 mt-4">MASTER MANIFEST REGISTRY // SITE_COORDINATES_VERIFIED</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full xl:w-auto">
            <div className="flex bg-white p-1 border border-outline-variant flex-1 sm:flex-none overflow-x-auto no-scrollbar">
              {(['ALL_DOCS', 'QUOTES', 'STATEMENTS_OF_WORK'] as const).map((f) => (
                <button 
                  key={f}
                  onClick={() => onFilter(f)}
                  className={`flex-1 sm:flex-none px-3 md:px-6 py-2 md:py-3 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest transition-all duration-300 whitespace-nowrap ${filter === f ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black hover:bg-neutral-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex bg-white p-1 border border-outline-variant flex-1 sm:flex-none">
              <button 
                onClick={() => onSort('issueDate')}
                className={`flex-1 sm:flex-none px-3 md:px-6 py-2 md:py-3 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${sortBy === 'issueDate' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black hover:bg-neutral-50'}`}
              >
                DATE {sortBy === 'issueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                onClick={() => onSort('status')}
                className={`flex-1 sm:flex-none px-3 md:px-6 py-2 md:py-3 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${sortBy === 'status' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black hover:bg-neutral-50'}`}
              >
                STATUS {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-black">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="group relative bg-white border-b border-outline-variant p-6 md:p-10 flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 items-start md:items-center transition-all duration-500 hover:bg-neutral-50/50"
          >
            <div className="md:col-span-3 lg:col-span-2 w-full flex items-center gap-4">
              {doc.type === 'IMAGE' && doc.url ? (
                <div className="w-10 h-10 md:w-12 md:h-12 border border-neutral-200 overflow-hidden bg-neutral-100 flex-shrink-0">
                  <img src={doc.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 border border-neutral-200 flex items-center justify-center bg-neutral-50 flex-shrink-0">
                  <FileText size={16} className="text-neutral-300 md:w-[18px] md:h-[18px]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-0.5 md:mb-1 tracking-[0.2em] uppercase">PROJECT_REF</div>
                <div className="font-display font-bold text-xs md:text-sm tracking-tight uppercase group-hover:text-black transition-colors truncate">{doc.projectName}</div>
              </div>
            </div>
            <div className="md:col-span-2 w-full">
              <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">ISSUE_TIMESTAMP</div>
              <div className="font-display font-medium text-xs md:text-sm italic text-neutral-600">{doc.issueDate}</div>
            </div>
            <div className="md:col-span-3 lg:col-span-2 w-full">
              <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">DOCUMENT_NAME</div>
              <div className="font-display font-bold text-xs md:text-sm tracking-tight uppercase text-neutral-900 truncate">{doc.name}</div>
            </div>
            <div className="md:col-span-2 w-full">
              <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">LIFECYCLE_STATUS</div>
              <StatusBadge status={doc.status} />
            </div>
            <div className="md:col-span-4 lg:col-span-4 w-full flex flex-row md:flex-col lg:flex-row justify-end gap-2 md:gap-3">
              <button 
                onClick={() => onDownload(doc)}
                className="flex-1 md:w-auto border border-neutral-200 px-3 md:px-4 py-3 md:py-4 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.1em] md:tracking-[0.2em] hover:bg-neutral-50 transition-all duration-300 uppercase flex items-center justify-center gap-2"
              >
                <Download size={12} className="md:w-3.5 md:h-3.5" />
                <span className="hidden xs:inline">DOWNLOAD</span>
              </button>
              <button 
                onClick={() => {
                  if (doc.type === 'QUOTE') onViewQuote(doc.id);
                  if (doc.type === 'SOW') onViewSOW(doc.id);
                  if (doc.type === 'IMAGE') onViewImage(doc.id);
                }}
                className="flex-1 md:w-auto border border-black px-4 md:px-6 py-3 md:py-4 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.1em] md:tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 uppercase group-hover:shadow-xl"
              >
                <span className="hidden xs:inline">VIEW_MANIFEST</span>
                <span className="xs:hidden">VIEW</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Maintenance Advisory Section */}
    <div className="bg-white border border-black p-8 md:p-20 flex flex-col lg:flex-row justify-between gap-12 md:gap-16 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 blueprint-grid opacity-5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black opacity-5" />
      <div className="max-w-2xl relative z-10">
        <div className="font-display text-[0.55rem] md:text-[0.65rem] tracking-[0.4em] text-neutral-400 mb-6 md:mb-10 flex items-center gap-4">
          <span className="w-8 md:w-12 h-[1px] bg-black" />
          ADVISORY_PROTOCOL_X99
        </div>
        <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-8 leading-none">
          SPEAK WITH THE TEAM AT REVIVEPROPERTYCO
        </h3>
        <p className="text-base md:text-lg text-neutral-500 leading-relaxed mb-8 md:mb-12 font-medium">
          If any document requires clarification or manual amendment by our drafting team, please initiate a technical review request below. Standard response time: 24h.
        </p>
        <div className="flex flex-wrap gap-6">
          <a 
            href="https://revivepropertyco.au/contact"
            className="w-full sm:w-auto bg-black text-white px-8 md:px-12 py-4 md:py-5 font-display text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 uppercase shadow-xl flex items-center justify-center"
          >
            OPEN_COMM_CHANNEL
          </a>
        </div>
      </div>
      <div className="flex flex-col justify-end gap-10 relative z-10">
        <div className="border-l-4 border-black pl-8 py-3">
          <div className="font-display text-[0.6rem] text-neutral-400 uppercase tracking-widest mb-2">PROJECT_DIRECTOR</div>
          <div className="font-display font-bold text-xl tracking-tighter uppercase">ANGUS GAIR</div>
        </div>
        <div className="font-display text-[0.5rem] text-neutral-300 tracking-[0.5em] uppercase mt-4">
          VERIFICATION_ID: 0x9928_REVIVE
        </div>
      </div>
    </div>
  </div>
</motion.div>
);

const SOWView = ({ onBack, document, onStatusChange, onRevert, onDownload }: { onBack: () => void, document: Document, onStatusChange: (status: any) => void, onRevert: (v: DocumentVersion) => void, onDownload: (doc: Document) => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12"
  >
    <div className="flex justify-between items-center mb-8 md:mb-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 font-display text-[0.6rem] md:text-[0.65rem] font-bold tracking-widest text-neutral-400 hover:text-black transition-colors"
      >
        <ChevronRight className="rotate-180" size={14} />
        BACK_TO_MANIFEST
      </button>
      <button 
        onClick={() => onDownload(document)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black text-white font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest hover:bg-neutral-800 transition-colors"
      >
        <Download size={12} className="md:w-3.5 md:h-3.5" />
        <span className="hidden xs:inline">DOWNLOAD_PDF</span>
        <span className="xs:hidden">PDF</span>
      </button>
    </div>

    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-6 md:pb-8 mb-8 md:mb-12 gap-4 md:gap-6">
      <div className="flex items-end gap-3 md:gap-6">
        <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">SOW</h1>
        <StatusBadge status={document.status} className="mb-0.5 md:mb-1" />
      </div>
      <div className="text-left md:text-right w-full md:w-auto">
        <div className="font-display text-lg md:text-3xl font-bold tracking-tighter">REF: {document.id}</div>
      </div>
    </div>

    <div className="bg-white border border-neutral-200 shadow-sm p-6 sm:p-12 md:p-20 mb-8">
      <div className="markdown-body prose prose-neutral max-w-none text-sm md:text-base">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {SOW_MARKDOWN}
        </ReactMarkdown>
      </div>

      {/* Status Management */}
      <div className="mt-12 md:mt-20 pt-8 md:pt-12 border-t border-neutral-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          <div>
            <h3 className="font-display text-[0.6rem] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-neutral-400 mb-1 md:mb-2">LIFECYCLE_STATUS_MANAGEMENT</h3>
            <p className="text-xs md:text-sm text-neutral-500">Update the current progress of this Statement of Work.</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {[
              { label: 'REVIEW', value: 'IN REVIEW', icon: <Clock size={12} className="md:w-3.5 md:h-3.5" /> },
              { label: 'APPROVE', value: 'APPROVED', icon: <CheckCircle2 size={12} className="md:w-3.5 md:h-3.5" /> },
              { label: 'ACTION', value: 'ACTION REQUIRED', icon: <AlertCircle size={12} className="md:w-3.5 md:h-3.5" /> },
              { label: 'HIRE', value: 'READY TO HIRE', icon: <ShieldCheck size={12} className="md:w-3.5 md:h-3.5" /> }
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => onStatusChange(s.value)}
                className={`px-3 md:px-6 py-2 md:py-3 font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest transition-all duration-300 flex items-center gap-2 md:gap-3 border ${document.status === s.value ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-neutral-400 border-neutral-200 hover:border-black hover:text-black'}`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    <VersionHistory 
      history={document.history} 
      currentVersion={document.currentVersion} 
      onRevert={onRevert} 
    />
  </motion.div>
);

const ImageView = ({ onBack, document }: { onBack: () => void, document: Document }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12"
  >
    <button 
      onClick={onBack}
      className="flex items-center gap-2 font-display text-[0.6rem] md:text-[0.65rem] font-bold tracking-widest text-neutral-400 hover:text-black transition-colors mb-8 md:mb-12"
    >
      <ChevronRight className="rotate-180" size={14} />
      BACK_TO_MANIFEST
    </button>

    <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-10 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tighter uppercase leading-tight mb-2 truncate">{document.name}</h1>
          <div className="font-display text-[0.55rem] md:text-[0.65rem] text-neutral-400 tracking-[0.2em] md:tracking-[0.3em] uppercase">ASSET_VERIFICATION // {document.id}</div>
        </div>
        <StatusBadge status={document.status} />
      </div>
      
      <div className="p-4 md:p-12 bg-neutral-50 flex items-center justify-center min-h-[40vh] md:min-h-[60vh] relative">
        <div className="absolute inset-0 blueprint-grid opacity-5 pointer-events-none" />
        <img 
          src={document.url} 
          alt={document.name} 
          className="max-w-full max-h-[70vh] md:max-h-[80vh] shadow-2xl border border-neutral-200 relative z-10 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="p-6 md:p-12 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
        <div>
          <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">METADATA_REF</div>
          <div className="font-mono text-[0.65rem] md:text-xs text-neutral-600 break-all">{document.id}</div>
        </div>
        <div>
          <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">UPLOAD_TIMESTAMP</div>
          <div className="font-display font-medium text-xs md:text-sm italic text-neutral-600">{document.issueDate}</div>
        </div>
        <div>
          <div className="font-display text-[0.5rem] md:text-[0.55rem] text-neutral-400 mb-1 md:mb-2 tracking-[0.2em] uppercase">FILE_TYPE</div>
          <div className="font-display font-bold text-xs md:text-sm tracking-tight uppercase text-neutral-900">TECHNICAL_ASSET / IMAGE</div>
        </div>
      </div>
    </div>
  </motion.div>
);

const QuoteView = ({ onBack, document, onStatusChange, onRevert, onDownload }: { onBack: () => void, document: Document, onStatusChange: (status: any) => void, onRevert: (v: DocumentVersion) => void, onDownload: (doc: Document) => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12"
  >
    <div className="flex justify-between items-center mb-8 md:mb-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 font-display text-[0.6rem] md:text-[0.65rem] font-bold tracking-widest text-neutral-400 hover:text-black transition-colors"
      >
        <ChevronRight className="rotate-180" size={14} />
        BACK_TO_MANIFEST
      </button>
      <button 
        onClick={() => onDownload(document)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black text-white font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest hover:bg-neutral-800 transition-colors"
      >
        <Download size={12} className="md:w-3.5 md:h-3.5" />
        <span className="hidden xs:inline">DOWNLOAD_PDF</span>
        <span className="xs:hidden">PDF</span>
      </button>
    </div>

    {/* Header Section from Image */}
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-12 md:mb-16">
      <div className="flex items-start gap-4 md:gap-6">
        <div className="relative w-16 h-16 md:w-24 md:h-24 border border-black flex items-center justify-center bg-white flex-shrink-0">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-black" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-black" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-black" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black" />
          <span className="text-4xl md:text-6xl font-display font-bold">R</span>
        </div>
        <div className="flex flex-col">
          <div className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-tighter leading-none mb-1">REVIVE</div>
          <div className="text-xs sm:text-base md:text-xl font-display font-bold tracking-[0.2em] md:tracking-[0.25em] text-neutral-800">PROPERTY CO.</div>
        </div>
      </div>
      <div className="text-left md:text-right space-y-1 w-full md:w-auto">
        <p className="font-display text-[0.55rem] md:text-[0.75rem] leading-tight uppercase max-w-[280px] md:ml-auto font-medium">
          Unit 802, 2 Marcus Clarke STREET, CANBERRA, ACT 2601, AUSTRALIA
        </p>
        <p className="font-display text-[0.55rem] md:text-[0.75rem] uppercase font-medium">Phone: 0468333745</p>
        <p className="font-display text-[0.55rem] md:text-[0.75rem] uppercase font-medium">Email: angus@ajinsights.com.au</p>
      </div>
    </div>

    <div className="mb-8 md:mb-12">
      <div className="font-display font-bold text-[0.55rem] md:text-[0.65rem] uppercase tracking-[0.3em] md:tracking-[0.4em] text-neutral-400 mb-2">CONTRACTOR:</div>
      <div className="font-display font-bold text-xl md:text-2xl uppercase tracking-tight mb-1">GAIR FAMILY PTY LTD</div>
      <div className="font-display text-[0.55rem] md:text-[0.65rem] text-neutral-500 tracking-[0.2em] uppercase">ABN: 19634897340</div>
    </div>

    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-black pb-6 md:pb-8 mb-8 md:mb-12 gap-4 md:gap-6">
      <div className="flex items-end gap-3 md:gap-6">
        <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tighter uppercase leading-none">Quote</h1>
        <StatusBadge status={document.status} className="mb-0.5 md:mb-1" />
      </div>
      <div className="text-left md:text-right w-full md:w-auto">
        <div className="font-display text-lg md:text-3xl font-bold tracking-tighter">Nbr: {document.id}</div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
      <div className="lg:col-span-6">
        <div className="font-display text-[0.55rem] md:text-[0.65rem] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-neutral-400 mb-4 flex items-center gap-4">
          <span className="w-6 h-[1px] bg-neutral-300" />
          FOR:
        </div>
        <p className="font-display text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight">
          Sarah Kylie,<br />
          Edmondson Park NSW 2174
        </p>
      </div>
      <div className="lg:col-span-6 flex flex-col items-start lg:items-end justify-end space-y-2">
        <div className="flex justify-between w-full max-w-[300px]">
          <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase text-neutral-400 tracking-widest">Issue date:</span>
          <span className="font-display font-bold text-xs md:text-sm">{document.issueDate}</span>
        </div>
        <div className="flex justify-between w-full max-w-[300px]">
          <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase text-neutral-400 tracking-widest">Valid to:</span>
          <span className="font-display font-bold text-xs md:text-sm">12/05/2026</span>
        </div>
        <div className="flex justify-between w-full max-w-[300px]">
          <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase text-neutral-400 tracking-widest">Amount Payable:</span>
          <span className="font-display font-bold text-xs md:text-sm">{document.amount}</span>
        </div>
      </div>
    </div>

    <div className="mb-12 md:mb-16 bg-surface-low p-6 md:p-10 border-l-4 border-black relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 blueprint-grid opacity-5 pointer-events-none" />
      <div className="font-display text-[0.55rem] md:text-[0.65rem] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-neutral-400 mb-4 flex items-center gap-4">
        <span className="w-6 h-[1px] bg-neutral-300" />
        DESCRIPTION:
      </div>
      <p className="text-sm md:text-base text-neutral-600 leading-relaxed font-medium">
        Bathroom Tile Rescue & Restoration — Full remediation of epoxy grout haze, sealant removal, regrouting, and sealing for Sarah Kylie.
      </p>
    </div>

    <div className="border-t-2 border-black">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-neutral-100/50">
              <th className="text-left p-4 md:p-6 font-display text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.2em] md:tracking-[0.3em] border border-neutral-200 text-neutral-500">Description</th>
              <th className="text-right p-4 md:p-6 font-display text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.2em] md:tracking-[0.3em] border border-neutral-200 text-neutral-500">Qty</th>
              <th className="text-right p-4 md:p-6 font-display text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.2em] md:tracking-[0.3em] border border-neutral-200 text-neutral-500">Unit Price</th>
              <th className="text-right p-4 md:p-6 font-display text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.2em] md:tracking-[0.3em] border border-neutral-200 text-neutral-500">GST</th>
              <th className="text-right p-4 md:p-6 font-display text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.2em] md:tracking-[0.3em] border border-neutral-200 text-neutral-500">Total</th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm">
            {QUOTE_ITEMS.map((item, i) => (
              <tr key={i} className="hover:bg-neutral-50 transition-colors">
                <td className="p-4 md:p-6 border border-neutral-200">
                  <div className="font-bold uppercase tracking-tight mb-1">{item.description}</div>
                  {item.subDescription && (
                    <div className="font-display text-[0.6rem] md:text-[0.65rem] text-neutral-400 uppercase tracking-tight">{item.subDescription}</div>
                  )}
                </td>
                <td className="p-4 md:p-6 border border-neutral-200 text-right font-medium">{item.unit.toFixed(1)}</td>
                <td className="p-4 md:p-6 border border-neutral-200 text-right font-medium">${item.rate.toFixed(2)}</td>
                <td className="p-4 md:p-6 border border-neutral-200 text-right font-medium">{item.gst}</td>
                <td className="p-4 md:p-6 border border-neutral-200 text-right font-bold">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 md:mt-12 flex justify-end">
        <div className="w-full md:w-1/2 lg:w-1/3 space-y-3 md:space-y-4">
          <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-surface-low border-b border-neutral-200">
            <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase font-bold tracking-[0.2em] md:tracking-[0.3em] text-neutral-400">Subtotal:</span>
            <span className="font-display font-bold text-base md:text-xl">$1,396.00</span>
          </div>
          <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-surface-low border-b border-neutral-200">
            <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase font-bold tracking-[0.2em] md:tracking-[0.3em] text-red-500">Discount (20%):</span>
            <span className="font-display font-bold text-base md:text-xl text-red-500">-$279.20</span>
          </div>
          <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-surface-low">
            <span className="font-display text-[0.55rem] md:text-[0.65rem] uppercase font-bold tracking-[0.2em] md:tracking-[0.3em] text-neutral-400">GST (10%):</span>
            <span className="font-display font-bold text-base md:text-xl">$111.68</span>
          </div>
          <div className="flex justify-between items-center p-5 md:p-8 bg-black text-white border-t-2 border-black shadow-xl">
            <span className="font-display text-[0.55rem] md:text-xs uppercase font-bold tracking-[0.3em] md:tracking-[0.4em]">Total:</span>
            <span className="font-display text-2xl md:text-4xl font-bold tracking-tighter">{document.amount}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Status Management */}
    <div className="mt-20 p-8 bg-surface-low border border-neutral-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">LIFECYCLE_STATUS_MANAGEMENT</h3>
          <p className="text-sm text-neutral-500">Update the current progress of this Quote.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'REVIEW', value: 'IN REVIEW', icon: <Clock size={14} /> },
            { label: 'APPROVE', value: 'APPROVED', icon: <CheckCircle2 size={14} /> },
            { label: 'ACTION', value: 'ACTION REQUIRED', icon: <AlertCircle size={14} /> }
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(s.value)}
              className={`px-6 py-3 font-display text-[0.6rem] font-bold tracking-widest transition-all duration-300 flex items-center gap-3 border ${document.status === s.value ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-neutral-400 border-neutral-200 hover:border-black hover:text-black'}`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <VersionHistory 
      history={document.history} 
      currentVersion={document.currentVersion} 
      onRevert={onRevert} 
    />

    {/* Signatures */}
    <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-24">
      <div className="border-b-2 border-black pb-10">
        <label className="block font-display text-[0.6rem] uppercase text-neutral-400 mb-16 tracking-[0.3em]">AUTHORIZED_SYSTEM_SIGNATORY</label>
        <div className="font-display italic text-4xl opacity-80 tracking-tighter font-medium">Angus Gair // Director</div>
      </div>
      <div className="border-b-2 border-black pb-10 relative">
        <label className="block font-display text-[0.6rem] uppercase text-neutral-400 mb-16 tracking-[0.3em]">CLIENT_ACCEPTANCE_TIMESTAMP</label>
        <div className="h-16 bg-surface-low w-full flex items-center px-6">
          <span className="font-display text-[0.5rem] text-neutral-300 tracking-[0.5em]">PENDING_DIGITAL_VERIFICATION</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const Footer = () => (
  <footer className="bg-white border-t border-outline-variant py-12 md:py-20 px-4 md:px-12">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-12">
      <div className="space-y-4 md:space-y-6 max-w-sm">
        <div className="font-display font-bold text-lg md:text-xl tracking-tighter">REVIVE_BLUEPRINT</div>
        <p className="text-[0.65rem] md:text-xs text-neutral-400 font-display tracking-widest leading-relaxed uppercase">
          Architectural maintenance and lifecycle management systems. Designed for precision, built for longevity.
        </p>
      </div>
      <div className="flex flex-wrap gap-8 md:gap-16">
        <div className="space-y-3 md:space-y-4">
          <div className="font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.3em] text-neutral-400 uppercase">SYSTEM_LINKS</div>
          <div className="flex flex-col gap-2">
            <a href="#" className="text-[0.65rem] md:text-xs font-bold tracking-widest hover:text-neutral-400 transition-colors uppercase">DASHBOARD</a>
            <a href="#" className="text-[0.65rem] md:text-xs font-bold tracking-widest hover:text-neutral-400 transition-colors uppercase">ARCHIVE</a>
            <a href="#" className="text-[0.65rem] md:text-xs font-bold tracking-widest hover:text-neutral-400 transition-colors uppercase">SUPPORT</a>
          </div>
        </div>
        <div className="space-y-3 md:space-y-4">
          <div className="font-display text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.3em] text-neutral-400 uppercase">LEGAL_COMPLIANCE</div>
          <div className="flex flex-col gap-2">
            <a href="#" className="text-[0.65rem] md:text-xs font-bold tracking-widest hover:text-neutral-400 transition-colors uppercase">PRIVACY_POLICY</a>
            <a href="#" className="text-[0.65rem] md:text-xs font-bold tracking-widest hover:text-neutral-400 transition-colors uppercase">TERMS_OF_SERVICE</a>
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-12 md:mt-20 pt-8 md:pt-12 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="font-display text-[0.55rem] md:text-[0.6rem] tracking-widest text-neutral-400 uppercase">© 2024 REVIVE PROPERTY CO. ALL RIGHTS RESERVED.</div>
      <div className="font-display text-[0.55rem] md:text-[0.6rem] tracking-widest text-neutral-400 uppercase">ENCRYPTED_SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
    </div>
  </footer>
);

export default function App() {
  const [view, setView] = React.useState<'dashboard' | 'quote' | 'sow' | 'image'>('dashboard');
  const [activeDocId, setActiveDocId] = React.useState<string | null>(null);
  const [activeUploads, setActiveUploads] = React.useState<ActiveUpload[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>(DOCUMENTS);

  const projects = React.useMemo(() => {
    return Array.from(new Set(documents.map(d => d.projectName))).sort();
  }, [documents]);
  const [sortBy, setSortBy] = React.useState<'issueDate' | 'status'>('issueDate');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = React.useState<'ALL_DOCS' | 'QUOTES' | 'STATEMENTS_OF_WORK'>('ALL_DOCS');

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleDownload = (doc: Document) => {
    const pdf = new jsPDF();
    const hash = `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    const timestamp = new Date().toLocaleString();

    // Set fonts and colors
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);

    // Header - Logo Box
    pdf.setLineWidth(0.5);
    pdf.rect(20, 20, 20, 20);
    pdf.text('R', 26, 34);

    // Header - Branding
    pdf.setFontSize(20);
    pdf.text('REVIVE', 45, 30);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('PROPERTY CO.', 45, 36);

    // Document ID
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('DIGITAL_MANIFEST_V1.0', 140, 25);
    pdf.text(doc.id, 140, 31);

    // Divider
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.line(20, 50, 190, 50);

    // Metadata Grid
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('PROJECT REFERENCE', 20, 65);
    pdf.text('DOCUMENT NAME', 110, 65);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(doc.projectName, 20, 72);
    pdf.text(doc.name, 110, 72);

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('ISSUE TIMESTAMP', 20, 85);
    pdf.text('LIFECYCLE STATUS', 110, 85);

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(doc.issueDate, 20, 92);
    
    // Status Badge
    const statusWidth = pdf.getTextWidth(doc.status) + 10;
    pdf.setFillColor(0, 0, 0);
    pdf.rect(110, 88, statusWidth, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(doc.status, 115, 92);

    if (doc.type === 'QUOTE') {
      // Quote Specific Content
      autoTable(pdf, {
        startY: 105,
        head: [['Description', 'Qty', 'Unit Price', 'GST', 'Total']],
        body: QUOTE_ITEMS.map(item => [
          item.description,
          item.unit.toFixed(1),
          `$${item.rate.toFixed(2)}`,
          item.gst,
          `$${item.total.toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8, font: 'helvetica' },
        bodyStyles: { fontSize: 8, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' }
        }
      });

      const finalY = (pdf as any).lastAutoTable.finalY || 150;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`TOTAL AMOUNT: ${doc.amount}`, 140, finalY + 15);
    } else if (doc.type === 'SOW') {
      // SOW Specific Content
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      const splitText = pdf.splitTextToSize(SOW_MARKDOWN.replace(/#/g, '').replace(/\*/g, ''), 170);
      pdf.text(splitText, 20, 110);
    }

    // Verification Block (at the bottom)
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(20, pageHeight - 60, 170, 30, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.line(20, pageHeight - 60, 20, pageHeight - 30);

    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('SYSTEM VERIFICATION', 25, pageHeight - 52);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    pdf.text(`HASH: ${hash}`, 25, pageHeight - 44);
    pdf.text(`DOWNLOADED: ${timestamp}`, 25, pageHeight - 38);

    // Watermark
    pdf.setTextColor(240, 240, 240);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(60);
    pdf.text('REVIVE_PROPERTY_CO', 20, 200, { angle: 45 });

    // Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.line(20, pageHeight - 15, 190, pageHeight - 15);
    pdf.text('REVIVE BLUEPRINT PORTAL // SECURE ACCESS', 20, pageHeight - 10);
    pdf.text(`REF: ${doc.id} // AUTH: VERIFIED`, 140, pageHeight - 10);

    pdf.save(`${doc.id}_MANIFEST.pdf`);
  };

  const handleUpload = (files: File[], metadata: UploadMetadata) => {
    const uploadTasks = files.map(file => {
      const id = `RV_UP_${Math.floor(Math.random() * 10000)}`;
      return {
        id,
        name: file.name.toUpperCase(),
        progress: 0,
        file,
        metadata
      };
    });

    setActiveUploads(prev => [...prev, ...uploadTasks.map(({ id, name, progress }) => ({ id, name, progress }))]);

    uploadTasks.forEach(task => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          // Add to documents
          const isImage = task.file.type.startsWith('image/');
          const newDoc: Document = {
            id: task.id,
            projectName: task.metadata.projectName,
            type: task.metadata.type,
            name: task.name,
            url: isImage ? URL.createObjectURL(task.file) : undefined,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'IN REVIEW',
            currentVersion: 1,
            history: [
              { 
                version: 1, 
                timestamp: new Date().toLocaleString(), 
                status: 'IN REVIEW', 
                note: task.metadata.comment || 'Document uploaded via portal' 
              }
            ]
          };
          setDocuments(prev => [newDoc, ...prev]);

          // Remove from active uploads after a delay
          setTimeout(() => {
            setActiveUploads(prev => prev.filter(u => u.id !== task.id));
          }, 2000);
        }

        setActiveUploads(prev => prev.map(u => u.id === task.id ? { ...u, progress: currentProgress } : u));
      }, 200);
    });
  };

  const handleSort = (field: 'issueDate' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleStatusChange = (docId: string, newStatus: any) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        const nextVersion = d.currentVersion + 1;
        const newVersion: DocumentVersion = {
          version: nextVersion,
          timestamp: new Date().toLocaleString(),
          status: newStatus,
          amount: d.amount,
          note: `Status updated to ${newStatus}`
        };
        return { 
          ...d, 
          status: newStatus, 
          currentVersion: nextVersion,
          history: [...d.history, newVersion]
        };
      }
      return d;
    }));
  };

  const handleRevert = (docId: string, version: DocumentVersion) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        const nextVersion = d.currentVersion + 1;
        const newVersion: DocumentVersion = {
          version: nextVersion,
          timestamp: new Date().toLocaleString(),
          status: version.status,
          amount: version.amount,
          note: `Reverted to version ${version.version}`
        };
        return { 
          ...d, 
          status: version.status, 
          amount: version.amount || d.amount,
          currentVersion: nextVersion,
          history: [...d.history, newVersion]
        };
      }
      return d;
    }));
  };

  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = [...documents];
    if (filter === 'QUOTES') {
      filtered = filtered.filter(d => d.type === 'QUOTE');
    } else if (filter === 'STATEMENTS_OF_WORK') {
      filtered = filtered.filter(d => d.type === 'SOW');
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'issueDate') {
        comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [documents, sortBy, sortOrder, filter]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-black selection:text-white">
      <Header onNavigate={setView} />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <Dashboard 
              key="dashboard" 
              documents={filteredAndSortedDocuments}
              handleUpload={handleUpload}
              activeUploads={activeUploads}
              projects={projects}
              onViewQuote={(id) => {
                setActiveDocId(id);
                setView('quote');
              }} 
              onViewSOW={(id) => {
                setActiveDocId(id);
                setView('sow');
              }}
              onViewImage={(id) => {
                setActiveDocId(id);
                setView('image');
              }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onDownload={handleDownload}
              filter={filter}
              onFilter={setFilter}
            />
          ) : view === 'quote' ? (
            <QuoteView 
              key="quote" 
              document={documents.find(d => d.id === activeDocId)!}
              onStatusChange={(s) => activeDocId && handleStatusChange(activeDocId, s)}
              onRevert={(v) => activeDocId && handleRevert(activeDocId, v)}
              onBack={() => setView('dashboard')} 
              onDownload={handleDownload}
            />
          ) : view === 'sow' ? (
            <SOWView 
              key="sow"
              document={documents.find(d => d.id === activeDocId)!}
              onStatusChange={(s) => activeDocId && handleStatusChange(activeDocId, s)}
              onRevert={(v) => activeDocId && handleRevert(activeDocId, v)}
              onBack={() => setView('dashboard')}
              onDownload={handleDownload}
            />
          ) : (
            <ImageView 
              key="image"
              document={documents.find(d => d.id === activeDocId)!}
              onBack={() => setView('dashboard')}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {view !== 'dashboard' && (
          <FloatingBackButton onClick={() => setView('dashboard')} />
        )}
      </AnimatePresence>

      <Footer />

      {/* Global Coordinate Overlay */}
      <div className="fixed bottom-12 right-12 hidden xl:block transform rotate-90 origin-bottom-right">
        <span className="font-display text-[0.5rem] text-neutral-300 tracking-[1em] uppercase">
          SYSTEM_VERIFICATION_ACTIVE // HASH_0x8892_X
        </span>
      </div>
    </div>
  );
}
