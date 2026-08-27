# SeniorShield Design System Specification (Timespent Theme & Semantic Color Hierarchy)

This specification documents the complete Timespent clean modern design system and the strict semantic color hierarchy implemented across the SeniorShield codebase.

---

## 🎨 1. Design Tokens & Color Palette

### Color System Specifications

*   **Emergency / Urgent Accent**: `#ff383c` (Vivid Red) — **STRICTLY RESERVED FOR EMERGENCY ONLY**:
    *   Emergency Cyber Crime Helpline (1930) capsule button.
    *   CRITICAL Threat warning badges & active digital arrest/trojan alarms.
    *   Cumulative Risk scores > 70/100.
    *   "Hang Up & Block Threat" emergency mitigation action.
    *   *NEVER used for neutral buttons, regular navigation, or standard icons.*

*   **Primary Dark / Emergency Hover**: `#dc143c` (Crimson) — Visually darker state for emergency button active/hover states.

*   **Safe / Success Accent**: `#10b981` / `#059669` (Emerald Green) — **STRICTLY RESERVED FOR SUCCESS / SAFE ONLY**:
    *   "Shield Active & Autonomous Sentinel" status pill.
    *   SAFE Threat confirmation badges & verified bank tags.
    *   Low Cumulative Risk scores (0 to 30/100).
    *   *NEVER used for unverified action buttons or neutral badges.*

*   **Warning / Caution Accent**: `#f59e0b` / `#ffd400` / `#b45309` (Amber / Golden Yellow) — **STRICTLY RESERVED FOR WARNING / CAUTION ONLY**:
    *   SUSPICIOUS Threat badges & potential unknown vector warnings.
    *   Moderate Cumulative Risk scores (31 to 70/100).
    *   Golden Safety Rules warning tips and stage progression alerts.

*   **Primary Neutral Action & Text Foreground**: `#1f1f1f` (Charcoal) — Primary neutral action buttons (Scan Device, Read SMS, Save Setup), titles, headings, and body copy.

*   **Canvas Background**: `#fcfcfc` (Off-white) — Page-level canvas backing.

*   **Surface Card**: `#ffffff` (Pure White) — Elevated boxed cards, containers, and modals.

*   **Border Subtle**: `#e6e6e6` (Light Gray) — Hairline separators (`borderWidth: 1`) and container edges.

*   **Text Muted**: `#8e8e93` (Cool Gray) — Captions, uppercase category labels, timestamps, and subtitles.

---

## 📐 2. Geometry, Elevation & Shadow Tokens

*   **Card Corner Radius**: `24px` — Smooth rounded profile for cards, gauges, and major containers.
*   **Button & Capsule Radius**: `9999px` — Full capsule/pill shapes for all primary and secondary buttons.
*   **Small Badge Radius**: `9999px` — High-contrast solid pill badges.
*   **Modal Sheet Radius**: `32px` — Top-left and top-right radii for bottom sheets.
*   **Hairline Borders**: `1px` solid `#e6e6e6` on all cards and secondary controls.
*   **Elevation & Shadows**:
    *   *Card Elevation*: `shadowColor: '#000'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.04`, `shadowRadius: 12`, `elevation: 2`.
    *   *Charcoal Button Shadow*: `shadowColor: '#000'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.15`, `shadowRadius: 8`, `elevation: 3`.
    *   *Emergency Red Shadow*: `shadowColor: '#FF383C'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.25`, `shadowRadius: 10`, `elevation: 3`.

---

## 🔤 3. Typography Stack & Hierarchy

*   **App Brand Title**: `fontSize: 22`, `fontWeight: '900'`, `color: '#1F1F1F'`, `letterSpacing: -0.5`.
*   **Card / Section Titles**: `fontSize: 16-18`, `fontWeight: '900'`, `color: '#1F1F1F'`, `letterSpacing: -0.3`.
*   **Uppercase Category Labels**: `fontSize: 10-11`, `fontWeight: '800'`, `color: '#8E8E93'`, `letterSpacing: 0.5`.
*   **Senior Plain English Explanations**: `fontSize: 15-16`, `fontWeight: '600'`, `color: '#1F1F1F'`, `lineHeight: 22`.
*   **Action Required Directives**: `fontSize: 14-15`, `fontWeight: '800'`, `color: '#1F1F1F'`, `lineHeight: 20`.
*   **Pill & Badge Text**: `fontSize: 10-12`, `fontWeight: '800' / '900'`, `letterSpacing: 0.5`.

---

## 🧩 4. Core Component Specifications

### 1. Header (`src/components/Header.tsx`)
*   Clean Timespent layout without redundant top shield icons.
*   **Title & Solid Badge**: SeniorShield with solid charcoal capsule badge (`AI 3.5`).
*   **Setup Button**: Solid white pill with hairline border `#e6e6e6` and charcoal icon.
*   **Emergency Helpline Button**: Full-width solid `#ff383c` capsule with phone icon.

### 2. Threat Card (`src/components/ThreatCard.tsx`)
*   **Surface**: Pure `#ffffff` card with `24px` radius and `#e6e6e6` border.
*   **High-Contrast Solid Badges**:
    *   🔴 `CRITICAL THREAT` (`#ff383c` background, `#ffffff` text)
    *   🟢 `SAFE THREAT` (`#10b981` background, `#ffffff` text)
    *   🟡 `SUSPICIOUS THREAT` (`#f59e0b` background, `#ffffff` text)
    *   ⬛ `100% Confidence` (`#1f1f1f` background, `#ffffff` text)
*   **Senior Plain Explanation Box**: Light background `#f8fafc` with simple, jargon-free explanations.
*   **What You Must Do Now Box**: Clear colored left accent border (`4px`) with immediate actionable instructions.

### 3. Campaign Timeline (`src/components/CampaignTimeline.tsx`)
*   **Attack Stage Capsule**: Solid `#1f1f1f` capsule marking current campaign progression.
*   **Event Nodes**: Numbered solid nodes connected by continuous vertical track.
*   **Channel Indicators**: Distinct icons and solid labels for SMS, Phone Calls, and Links.

### 4. Autonomous Sentinel & Risk StatCard (`App.tsx`)
*   **Autonomous Sentinel Banner**: Green `#f0fdf4` capsule indicating live background SMS monitoring.
*   **Cumulative Risk Exposure Bar**: Dynamic color track adjusting strictly by risk level (Green 0–30, Yellow 31–70, Red 71–100).
*   **Primary Action Bar**: Three capsule buttons (`Scan Device` [Charcoal], `Read SMS` [White], `Demo Hub` [White]).

### 5. SMS Analyzer Modal (`src/components/SmsAnalyzerModal.tsx`)
*   **Bottom Sheet**: `32px` top radius modal.
*   **Quick Test Scenarios**: 1-tap benchmark scenarios (Electricity Scam, CBI Digital Arrest, SBI KYC Trojan, Legitimate Bank).
*   **Live Analysis Trigger**: High-contrast charcoal button invoking Gemini 3.5 Flash Lite in `<1s`.

---

## 🛡️ 5. Implementation Rules Summary

1. **Pure React Native `StyleSheet`**: 100% native stylesheets with zero CSS runtime translation overhead for guaranteed 60 FPS performance across all Android devices.
2. **Solid Badges Only**: No low-contrast or washed-out transparent pills. Every badge uses solid high-contrast backgrounds.
3. **Zero Jargon for Seniors**: Explanations must use clear, accessible words ("Thief", "Fake Message", "Dangerous Link") rather than technical security terms ("Phishing payload", "Zero-day exploit").
