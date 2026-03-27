# Design System Specification: Clinical Precision & Human Warmth

This document defines the visual language and structural logic for the next generation of Dental Practice Management. As designers, your goal is to transcend the "utility software" aesthetic. We are not just building a tool; we are crafting a high-end, editorial experience that mirrors the precision of modern dentistry and the comfort of a luxury clinic.

---

## 1. Creative North Star: "The Clinical Curator"

The "Clinical Curator" philosophy rejects the cluttered, line-heavy interfaces of legacy medical software. Instead, it embraces **intentional void**, **tonal layering**, and **asymmetric balance**. 

We move away from "boxed-in" UI. By utilizing a sophisticated scale of surface depths and editorial typography, we create a sense of calm for practitioners dealing with complex data. The interface should feel like a series of pristine, organized trays—each element exactly where it needs to be, bathed in soft, natural light.

---

## 2. Color & Tonal Architecture

Our palette is rooted in medical authority but executed with a high-fashion sensibility. 

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1x solid borders to define sections or containers. 
In this system, boundaries are created through **Background Color Shifts**. To separate a sidebar from a main content area, move from `surface` to `surface-container-low`. To separate a patient record card, place a `surface-container-lowest` card on a `surface-container` background.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-opaque materials. 
*   **Base:** `surface` (#f9f9fd)
*   **Structural Sections:** `surface-container-low` (#f3f3f7)
*   **Primary Content Containers:** `surface-container-lowest` (#ffffff)
*   **Active/Elevated Overlays:** `surface-bright` (#f9f9fd)

### Glass & Gradient Rule
To provide "visual soul," use the **Signature Dental Gradient** for Primary CTAs and Hero states: 
*   *Linear Gradient (135°):* `primary` (#0058bc) to `primary_container` (#0070eb).
*   **Glassmorphism:** For floating modals or dropdowns, use `surface_container_lowest` at 85% opacity with a `20px` backdrop-blur. This ensures the UI feels integrated and high-end.

---

## 3. Typography: The Editorial Scale

We use a dual-typeface system to balance clinical efficiency with professional authority.

*   **Display & Headlines (Manrope):** Our "Voice." Manrope provides a modern, geometric friendliness. Use `display-md` for dashboard welcomes and `headline-sm` for patient names.
*   **Interface & Data (Inter):** Our "Tool." Inter is used for everything tactical. Use `label-md` for table headers and `body-md` for patient notes.

**The Hierarchy Rule:** Always over-emphasize the contrast between a `headline-lg` and `body-sm`. Large, airy headings provide the "Editorial" feel, while tight, high-readability Inter ensures data density in the charts.

---

## 4. Elevation & Depth: Tonal Layering

Shadows are a last resort, not a default. We convey depth through **Tonal Layering**.

*   **The Layering Principle:** Stack `surface_container_lowest` (#ffffff) on top of `surface_container` (#edeef1) to create a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** For floating elements like Tooltips or Modals, use: `box-shadow: 0 12px 32px -4px rgba(25, 28, 30, 0.04)`. The shadow must be a tinted version of `on_surface` at extreme low opacity to mimic natural, clinical lighting.
*   **The Ghost Border Fallback:** If a border is required for accessibility (e.g., Input Fields), use `outline_variant` (#c1c6d7) at **20% opacity**. Never use 100% opaque borders.

---

## 5. Components & Primitive Logic

### Buttons: The Tactile Interaction
*   **Primary:** Uses the Signature Gradient. Roundedness: `md` (0.75rem). 
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. No border.
*   **Tertiary:** Text-only using `primary` color. High-contrast, no background.

### Cards & Lists: The "No-Divider" Mandate
*   **Forbidden:** 1px horizontal dividers between list items.
*   **Alternative:** Use `spacing-4` (1.4rem) of vertical white space or alternating backgrounds using `surface_container_low` and `surface_container_lowest`.

### Form Elements: Clinical Clarity
*   **Input Fields:** `surface_container_lowest` background with a `Ghost Border`. When focused, transition the border to `primary` and add a 2px outer glow of `primary_fixed` at 30% opacity.
*   **Checkboxes/Radios:** Use `primary` for selected states. The "unselected" state should be a subtle `outline_variant` ring.

### Dental-Specific Extensions
*   **Odontogram (Tooth Map):** Use `tertiary_fixed` (#8ff6d0) for healthy status and `error` (#ba1a1a) for urgent pathology.
*   **The Timeline Scrubber:** For patient history, use a vertical line in `outline_variant` at 10% opacity, with "events" represented by `primary` dots.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use the `24` (8.5rem) spacing token for "breathing room" between major dashboard widgets.
*   **Do** use `xl` (1.5rem) roundedness for large image containers or patient profile photos.
*   **Do** nest containers to create hierarchy. A `surface_container_high` sidebar creates an instant functional split.

### Don't:
*   **Don't** use pure black (#000000). Always use `on_surface` (#191c1e) for text.
*   **Don't** use standard "drop shadows." If it looks like a shadow from 2010, it's too heavy.
*   **Don't** use 1px dividers. If the content feels messy, increase your **Spacing Scale** values instead of adding lines.

---

## 7. Tokens Reference Summary

| Token Type | Value | Usage |
| :--- | :--- | :--- |
| **Primary Action** | `#0058bc` | Primary buttons, active states |
| **Success/Health** | `#006950` | Healthy tooth status, payment complete |
| **Error/Urgent** | `#ba1a1a` | Overdue balances, emergency appointments |
| **Radius-Default**| `0.5rem` | Standard cards and inputs |
| **Spacing-Base** | `1rem` | Standard gutter/padding |
| **Text-Primary** | `inter` | All data-heavy labels and body |
| **Text-Display** | `manrope` | All high-level headings |