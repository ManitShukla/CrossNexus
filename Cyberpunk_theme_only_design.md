# TACTICAL FUI DESIGN & VIBE SPECIFICATION

## 1. Core Design Philosophy & Vibe
*   **Experience Model:** The interface operates as a Fictional User Interface (FUI) representing a secure-facility tactical heads-up display (HUD)[cite: 2].
*   **Visual Metaphor:** The experience must resemble a tactical operations console, a secure UNIX/SCADA-style intranet, a CRT command-and-control system, and an engineering blueprint brought to life[cite: 2].
*   **Information Architecture:** The design functions as a dense monitoring surface where several signals are visible at once[cite: 2]. It prioritizes simultaneous data monitoring over guided narrative flow[cite: 2].
*   **Anti-Patterns:** The interface must strictly avoid resembling a SaaS landing page, a card-heavy dashboard with rounded corners, or a neon "cyberpunk" template that relies solely on glowing effects[cite: 2].

## 2. Structural Principles
*   **Data Density:** Competence is communicated through structured density[cite: 2]. Multiple modules may coexist in the same viewport[cite: 2]. White space is replaced by measured negative space, grid channels, separators, and telemetry[cite: 2]. Empty areas should look intentional by utilizing graph grids, tick marks, coordinates, metadata, or faint guide lines[cite: 2].
*   **Brutalist Precision:** The design mandates `border-radius: 0`[cite: 2]. There are absolutely no pill buttons, soft shadow cards, glassmorphism, gradient-filled CTAs, ornamental 3D blobs, or floating bubbles[cite: 2]. The UI relies on 1px strokes, clipped corners, line terminals, brackets, reticles, angular cutouts, register marks, crosshairs, warning bands, and thin separators[cite: 2].
*   **Systemic Motion:** Animation must feel like machine behavior, such as boot, initialize, scan, acquire, transmit, alert, resolve, lock, and release states[cite: 2]. Avoid slow lifestyle fades, springy app animation, elastic overshoot, and bouncy hover effects[cite: 2]. All motion must be fast, sharp, legible, and intentional[cite: 2].

## 3. Color Theory & Operational Hierarchy
*   **Color Ratios:** The visual distribution targets 72–82% black and deep charcoal, 8–14% neutral text and strokes, 4–8% terminal green, 2–4% muted teal, and less than 2% hazard red[cite: 2].
*   **Base Canvas:** The interface utilizes a true black (`#000000`) background[cite: 2]. Panel backgrounds use dark translucent fills, such as charcoal (`#070707`, `#0b0c0c`, `#0e1010`)[cite: 2].
*   **Primary/Active State (Terminal Green):** Phosphor green (`#cfff04`) is the dominant active accent, used for active systems, online statuses, and verified records[cite: 2].
*   **Secondary/Stable State (Muted Teal):** Muted teal (`#548474`) is used for secondary, stable, safe, or ready information[cite: 2].
*   **Critical/Failure State (Hazard Red):** Hazard red (`#ff3333`) is scarce and never used as a casual accent[cite: 2]. It is strictly reserved for genuine errors, failures, offline statuses, or restricted states[cite: 2].

## 4. Typography & Text Formatting
*   **Font Family:** The typography stack must be exclusively monospaced (e.g., JetBrains Mono, Roboto Mono, Space Mono)[cite: 2]. Never mix in a proportional sans-serif[cite: 2].
*   **Weights:** Use a narrow range of font weights: 400 for body and telemetry, 500 for labels, and 600 for active tabs or key metrics[cite: 2].
*   **Uppercase Usage:** Uppercase formatting is required for navigation, module headers, primary labels, alarms, status states, CTA verbs, project IDs, mode labels, marquee logs, and system messages[cite: 2].
*   **Title Case Usage:** Title case is reserved for secondary telemetry labels, descriptive metadata, and short human-readable explanatory content[cite: 2].
*   **Tracking (Letter Spacing):** Tracking is tightly controlled, utilizing `0.02em` for tight spacing, `0.08em` for UI elements, `0.12em` for labels, and `0.16em` for alerts[cite: 2].

## 5. Textural Overlays & Environment
*   **Global Grid:** A faint graph-paper system overlays the entire experience[cite: 2]. This grid must be visible only when the eye searches for it[cite: 2].
*   **CRT Characteristics:** The environment includes subtle horizontal scanlines, extremely low-opacity noise, edge vignettes, and occasional 1px luminance jitter during boot or error states[cite: 2]. Maximum scanline opacity targets `0.03–0.07` to ensure normal text legibility is not degraded[cite: 2].
*   **Hazard Dividers:** Diagonal red and black striping is used to frame critical system modules or section transitions[cite: 2]. This tape utilizes a continuous background translation loop lasting 6–10 seconds to imply a live monitored system[cite: 2].

## 6. Component Geometry & Decorators
*   **Panels:** Every module features a 1px outer stroke, a dark translucent fill, an internal title rail, and consistent 12–20px padding[cite: 2].
*   **Reticles & Brackets:** Corners utilize short 8–14px line segments rather than full decorative brackets[cite: 2].
*   **Crosshairs & Register Marks:** Small `+` glyphs (crosshairs) sit at grid intersections, limited to 1-3 per large panel[cite: 2]. Tiny alphanumeric labels (register marks) function as decorative metadata[cite: 2].
*   **Data Visualization:** Allowed visualizations include rectangular segmented bars, sparklines, sine waves, dot matrices, wireframe maps, and coordinates[cite: 2]. Never use continuous rounded progress meters, glossy pie charts, or rounded analytics widgets[cite: 2]. All visualizations utilize a 1px visual standard stroke[cite: 2].

## 7. Button Feel & Interactive Action Links
*   **Base Geometry:** Buttons require a transparent background, a 1px border, 0 border radius, 10–14px vertical padding, and 14–18px horizontal padding[cite: 2]. Text is uppercase, monospaced, with `0.08em` letter spacing[cite: 2]. Primary CTAs are text-based and enclosed in angle brackets (e.g., `<TRANSMIT MESSAGE>`)[cite: 2].
*   **Hover State (Target Acquisition):** Upon hover, the background receives a faint phosphor wash (`rgba(207,255,4,.08)`), the border shifts to terminal green, and tiny left/right brackets move by a maximum of 2px[cite: 2]. There is absolutely no scale-up bounce[cite: 2]. The transition duration is extremely fast (70–120ms)[cite: 2].
*   **Active/Press State:** The button switches to a high-contrast terminal green fill with black text[cite: 2]. This executes in 70ms with an immediate return[cite: 2].
*   **Focus State:** Keyboard focus must be visually stronger than hover, utilizing a 1px solid terminal green outline with a 3px offset[cite: 2]. The focus ring must never be removed[cite: 2].