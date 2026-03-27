# Design System Strategy: Clinical Ether

## 1. Overview & Creative North Star: "The Clinical Sanctuary"

This design system moves away from the cold, sterile, and rigid structures of traditional medical software. Our Creative North Star is **"The Clinical Sanctuary."** We aim to evoke the precision of a high-end dental practice while maintaining the breathing room of a premium wellness spa. 

To break the "SaaS Template" look, we utilize **Intentional Asymmetry** and **Editorial Spacing**. By leveraging high-contrast typography scales (the authoritative Manrope) against soft, layered surfaces, we create a UI that feels curated, not just programmed. We replace "boxes" with "zones of focus," using whitespace as a functional element rather than a void.

---

## 2. Color Philosophy & Surface Architecture

The palette centers on a "Softened Clinical Blue" (`primary: #2e5ea9`), moving away from harsh, saturated medical tones. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. 
Boundaries must be defined solely through background color shifts. For example, a dashboard sidebar should use `surface-container-low` while the main content area sits on `surface`. This creates a seamless, high-end feel that reduces visual noise.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper. 
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Containers:** `surface-container-low` (#f0f4f7) for subtle grouping.
- **Actionable/Floating Layers:** `surface-container-lowest` (#ffffff) to pull the user’s eye to active cards or inputs.

### Glass & Gradient Rule
To achieve "Clinical Ether," floating elements (like modals or navigation bars) should utilize **Glassmorphism**. Use semi-transparent `surface` colors with a `backdrop-blur` of 12px–20px. 
*Signature Polish:* Use a subtle linear gradient on main CTAs, transitioning from `primary` (#2e5ea9) to `primary-container` (#80abfc) at a 135-degree angle to provide "soul" to the interface.

---

## 3. Typography: The Editorial Voice

We pair the geometric precision of **Manrope** with the high-legibility functionalism of **Inter**.

*   **Display & Headlines (Manrope):** These are our "Editorial" moments. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for marketing or high-level dashboard summaries. It conveys clinical authority and modern sophistication.
*   **Body & Labels (Inter):** Used for all data-heavy dental records. `body-md` (0.875rem) is our workhorse. Inter’s tall x-height ensures clarity in complex scheduling tables.
*   **Hierarchy Tip:** Never settle for a flat list. Use `title-lg` (Inter) for section headers and `label-sm` (Inter, uppercase) for metadata to create a distinct rhythmic contrast.

---

## 4. Elevation & Depth: Tonal Layering

We convey importance through **Tonal Layering** rather than structural lines or heavy shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container` section. The change in tone provides enough contrast for the eye to perceive depth without the "clutter" of a border.
*   **Ambient Shadows:** For "floating" items (Popovers, Modals), use a "Sanctuary Shadow":
    *   `blur: 40px`, `y-offset: 12px`, `opacity: 6%`.
    *   **Shadow Color:** Use a tinted version of `on-surface` (#2c3437) rather than pure black to keep the light feeling natural and ambient.
*   **The Ghost Border Fallback:** If accessibility requires a border, use a "Ghost Border": `outline-variant` (#acb3b7) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components: Precision Primitives

All components follow the `ROUND_EIGHT` rule (`DEFAULT: 0.5rem`) to maintain a soft yet professional edge.

*   **Buttons:** 
    *   *Primary:* Gradient fill (`primary` to `primary-container`), no shadow, white text.
    *   *Secondary:* `surface-container-highest` background with `on-surface` text. No border.
*   **Input Fields:** 
    *   Use `surface-container-lowest` for the field fill. 
    *   Active state: A 2px "Ghost Border" using `primary_fixed` (#80abfc) at 40% opacity.
*   **Cards & Lists:** **Strictly forbid divider lines.** 
    *   Use vertical whitespace (Spacing Scale `6` or `8`) to separate patient records. 
    *   Alternate background tones (`surface` vs `surface-container-low`) for striped list effects.
*   **The "Ether" Chip:** 
    *   For status indicators (e.g., "Confirmed Appointment"), use a low-saturation background (e.g., `secondary_container`) with high-contrast text (`on_secondary_container`).
*   **Specialty Component - The Patient Timeline:** 
    *   An asymmetric vertical line using `outline-variant` at 20% opacity, with "floating" glassmorphic cards indicating historical dental procedures.

---

## 6. The 5 Identity Themes

1.  **Luminoso (Light):** High whitespace, uses `surface` as the primary driver. Feels like an open, sunlit clinic.
2.  **Soleado (Sunny):** Swaps `primary` for warm ambers. Use `tertiary_container` (#e3ceff) for highlights to keep it friendly and approachable.
3.  **Oscuro (Dark):** Professional and focused. Uses `primary_dim` and `on_surface_variant` to ensure low eye strain during late-night charting.
4.  **Rosa (Rose):** Calming and modern. Uses the `tertiary` (#685781) and `on_tertiary_container` tokens to create a boutique, high-end aesthetic.
5.  **High Contrast:** Forces `outline` to 100% and uses `inverse_surface` for backgrounds to ensure WCAG AAA compliance without sacrificing the `ROUND_EIGHT` radius.

---

## 7. Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** use `Spacing 10` (3.5rem) between major sections to let the UI breathe. | **Don't** use 1px dividers to separate content. |
| **Do** use `surface-tint` for subtle brand moments in icons or active states. | **Don't** use pure black (#000000) for text; always use `on-surface` (#2c3437). |
| **Do** apply `backdrop-blur` to any element that "floats" above the main layout. | **Don't** use sharp corners. Every container must follow the `ROUND_EIGHT` (0.5rem) logic. |
| **Do** use Manrope for "Moments of Impact" (Headlines). | **Don't** use Manrope for body text or data tables (stay with Inter). |