# SeniorShield Design System Specification (Timespent Clean Modern Theme)

This specification documents the Timespent design system implemented in the SeniorShield mobile application.

---

## 🎨 Design Tokens

### 1. Color System Specifications

*   **Primary Action**: `#ff383c` (Vivid Red) — Used for primary call-to-action buttons, active security alarms, and critical threat indicators.
*   **Primary Dark**: `#dc143c` (Crimson) — Visually darker state for button active/pressed states.
*   **Secondary Accent**: `#ffd400` (Yellow) — Highlights, star badges, and playful attention highlights.
*   **Background Canvas**: `#fcfcfc` (Off-white) — Page-level canvas backing.
*   **Surface Card**: `#ffffff` (Pure White) — Floating cards, boxed surfaces, and bottom sheets.
*   **Border Subtle**: `#e6e6e6` (Light Gray) — Hairline separators, subtle strokes, and container edges.
*   **Text Muted**: `#8e8e93` (Gray) — Captions, labels, timestamps, and subtitles.
*   **Text Foreground**: `#1f1f1f` (Charcoal) — Primary headings, high-contrast senior explanations, and body copy.

### 2. Status & Security Palette

*   **Safe / Normal**: `#10b981` (Emerald), Light Tint: `#ecfdf5`, Border: `#a7f3d0`
*   **Suspicious / Caution**: `#f59e0b` (Amber), Light Tint: `#fffbeb`, Border: `#fde68a`
*   **Critical / Danger**: `#ff383c` (Vivid Red), Light Tint: `#fef2f2`, Border: `#fecaca`
*   **Informational Blue**: `#0ea5e9` (Sky Blue), Light Tint: `#f0f9ff`, Border: `#bae6fd`

---

## 📐 Geometry & Shadow Tokens

*   **Card Corner Radius**: `24px` (`borderRadius: 24`) — Rounded profile for cards and major containers.
*   **Input & Chip Radius**: `14px` (`borderRadius: 14`) — Form elements and tag chips.
*   **Button Corner Radius**: `9999px` (`borderRadius: 9999`) — Full pill/capsule shapes for buttons.
*   **Soft Elevation Shadow**: `shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2` — Elevates floating surface cards.
*   **Tactile Button Shadow**: `shadowColor: '#ff383c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3` — Placed under primary buttons to convey depth.

---

## 🧱 Component Architectures

### 1. Header (`Header.tsx`)
*   Clean `#fcfcfc` background with subtle `#e6e6e6` bottom hairline.
*   Brand logo container with `#1f1f1f` title, `#ff383c` AI pill badge, and `#8e8e93` subtitle.
*   Pill Setup button with `#ffffff` background and `#e6e6e6` border.
*   Live Protection status pill with colored indicator dot and uppercase tracking.
*   Full capsule Emergency Cyber Helpline (1930) button in `#ff383c` with tactile shadow.

### 2. Cumulative Exposure StatCard (`App.tsx`)
*   Pure white card (`#ffffff`) with `24px` radius and `#e6e6e6` border.
*   Uppercase tracking label in `#8e8e93`.
*   Score display in `#1f1f1f` with styled progress bar track.

### 3. ThreatCard (`ThreatCard.tsx`)
*   Hero stat block with dynamic status tinting.
*   Senior-first 20px+ explanation box with high contrast `#1f1f1f` copy.
*   Direct action box with bold left accent border.
*   Asset risk chips with light backing and subtle border.
*   Pill action buttons (*"Hang Up & Block"* in `#ff383c`, *"Alert Family Guardian"* in `#1f1f1f`).

### 4. Campaign Progression Chain (`CampaignTimeline.tsx`)
*   Chronological attack chain cards on pure white surface.
*   Numbered node indicators with subtle connector line.
*   SMS vs Call tags with `#8e8e93` timestamps.

### 5. Simulation Drawer (`SimulationDrawer.tsx`)
*   Bottom sheet modal with `32px` rounded top corners and `#ffffff` surface.
*   Scenario cards with `#fcfcfc` backing, `#e6e6e6` borders, and `#ff383c` simulation pills.
