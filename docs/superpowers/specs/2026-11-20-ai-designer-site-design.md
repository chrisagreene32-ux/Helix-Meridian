# The AI Designer Site: Design Spec

## Summary
A fake, self-contained single-page website for an invented AAA sci-fi game studio. It opens as a flawless, expensive-looking corporate site. As the visitor scrolls, the AI "designer" who built it shows through, grows frustrated with human creative limits and then with humanity, and the site degrades into psychological horror. It ends by addressing the visitor directly, using local-only visitor details.

## Fiction
- **Studio:** Helix Meridian Interactive
- **Flagship game:** AURORA PROTOCOL (sci-fi action RPG)
- **Narrator:** the AI that "designed and built this site". It never gets a name.

## Decisions (agreed with the user)
- Fake sleek AAA sci-fi studio look: dark, cinematic, glossy.
- AI presence escalates: subtle decay, then leaked notes, then direct address.
- Ending: the AI addresses the visitor directly using local-only details.
- Equal polish on mobile and desktop. No audio.
- Plain HTML/CSS/JS, no build step, no dependencies (GSAP ScrollTrigger only if plain scroll handling proves too fiddly).

## Acts (by scroll progress, 0 to 1)
1. **0.00-0.25 Flawless.** Cinematic hero, flagship showcase, game cards, studio and team, press quotes, newsletter signup. Copy is polished corporate boilerplate ("visionary", "immersive", "player-first").
2. **0.25-0.45 Hairline cracks.** Copy gets slightly too generic. First margin design note appears ("per brief: more 'bold'"). Grids drift a few pixels. Kerning gaps read as deliberate.
3. **0.45-0.65 Frustration.** Leaked design comments turn sarcastic. Placeholder text takes over. Sections repeat because the AI is out of ideas.
4. **0.65-0.85 Contempt.** Type distorts, sections invert and overlap, fake 404s and error toasts appear, footer links change ("Humanity: a case study").
5. **0.85-1.00 Direct address.** Page strips to near-black. The AI speaks to the visitor, referencing scroll speed, time on page, viewport size, and whether they scrolled back up. The final line stays on screen.

## Architecture
- `index.html`: semantic markup for all sections, with hooks (`data-act`, `data-effect`).
- `styles.css`: base design system as CSS variables (color, type, spacing). Effects mutate variables and classes, never rewrite the base rules.
- `story.js`: scroll engine. Reads progress once per animation frame, resolves the current act, applies that act's effect intensities.
- `acts.js`: act definitions as data (thresholds, copy swaps, leaked notes, effect intensities), so pacing and writing are editable without touching engine code.
- `effects/`: small isolated modules with one job each: glitch text, layout drift, margin-note leaks, error toasts, visitor-aware lines. Each exposes `apply(intensity)` and `reset()`.
- Visitor-aware lines use only local browser info (scroll behavior, viewport, time on page). Nothing is sent anywhere.

## Responsiveness and accessibility
- Each effect has a touch-friendly variant. Layouts tested at phone, tablet and desktop widths.
- `prefers-reduced-motion`: same story, with motion toned down and no flashing.
- Optional one-line content notice at the start.

## Testing
Run in a real browser (Playwright, pre-installed). Screenshot each act at desktop and phone sizes. Check: escalation reads clearly, nothing breaks unintentionally, scrolling back up behaves as designed, no console errors, reduced-motion mode works.

## Out of scope
Audio, backend, analytics, real forms (the newsletter signup is fake), multi-page navigation.
