# Helix Meridian Interactive (a story disguised as a website)

A fake game-studio site that starts polished and slowly falls apart as you scroll.
Open `index.html` in a browser, or host the folder on any static host. There is no build step and no network access.

## Edit the story

Everything the visitor reads or sees change lives in `js/acts.js`:

- `Story.acts`: act thresholds and which effects run in each act
- `Story.notes`: the margin notes (`at` is scroll progress, 0 to 1)
- `Story.toasts`: the fake error toasts
- `Story.copy`: text that gets rewritten as the site decays
- `Story.redlines`: red-pen marks drawn over elements (circle, cross, strike, underline)
- `Story.redactions`: words and names blacked out (the text stays in the page)
- `Story.eyes`: the watching eyes in the dark (position, size, when they open)
- The final lines are composed in `js/visitor.js` (`composeLines`)

## Tests

```sh
node --test tests/*.test.js     # logic: engine and visitor tracker
node tests/screens.mjs          # browser: needs Playwright (set NODE_PATH if it is not installed globally)
```

Screenshots from the browser run are written to `tests/out/`.
