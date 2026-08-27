# SeniorShield Design System Specification (Semantic Color Hierarchy)

This specification defines the strict semantic color hierarchy and Timespent clean design system implemented in SeniorShield.

---

## 🚦 Strict Semantic Color Rules

*   🔴 **RED (`#ff383c` / `#dc143c`) — EMERGENCY / URGENT ONLY**:
    *   Emergency Cyber Helpline (1930) button.
    *   CRITICAL Threat warnings & active digital arrest/KYC alarms.
    *   Cumulative Risk scores > 70/100.
    *   "Hang Up & Block Sender" emergency mitigation action.
    *   *NEVER used for regular navigation, standard buttons, or neutral badges.*

*   🟢 **GREEN (`#10b981` / `#059669`) — SUCCESS / SAFE ONLY**:
    *   "Shield Active & Monitoring" safe status.
    *   SAFE Threat confirmation badges & verified bank tags.
    *   Low Cumulative Risk scores (0 to 30/100).
    *   *NEVER used for general unverified action buttons.*

*   🟡 **YELLOW / AMBER (`#f59e0b` / `#ffd400`) — WARNING / CAUTION ONLY**:
    *   SUSPICIOUS Threat badges & potential unknown vector warnings.
    *   Moderate Cumulative Risk scores (31 to 70/100).
    *   Golden Safety Rules warning tips.
    *   Urgency Escalation stage markers.

*   ⬛ **NEUTRAL / CHARCOAL (`#1f1f1f`) — PRIMARY UI ACTIONS & COPY**:
    *   "Scan Device & Protect" primary action capsule button.
    *   "Save & Return" settings confirmation buttons.
    *   Headlines, body copy, and high-contrast senior explanations.

*   ⚪ **SURFACE & CANVAS (`#fcfcfc` / `#ffffff`)**:
    *   Canvas background: `#fcfcfc` (Off-white).
    *   Cards & floating containers: `#ffffff` (Pure White) with `24px` corner radius and `#e6e6e6` subtle border.

---

## 📐 Geometry Tokens

*   **Card Corner Radius**: `24px`
*   **Button Profile**: Full Capsule (`borderRadius: 9999`)
*   **Hairline Separator**: `1px solid #e6e6e6`
*   **Shadow Elevation**: `shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2`
