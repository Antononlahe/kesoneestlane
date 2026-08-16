# Kes on eestlane?

Standalone satirical 3D cube. No backend, no add-form.

## Run

```
npx --yes serve -l 4173
```

Open `http://localhost:4173/`. Hard-refresh after data edits.

## Stack

Vanilla HTML/CSS/JS. Three.js r170 via import map (`cdn.jsdelivr`). OrbitControls, CSS2DRenderer, Line2 fat axes.

## Axes

Cube is 0–1, size 8, centered at origin. `toWorld(t) = (t - 0.5) * SIZE`.

| Space | Field in `people.js` | Visible name |
|---|---|---|
| X | `valimus` | SPF 50 |
| Y | `temperament` | ei ütle tere tänaval |
| Z | `kultuur` | käib saunas |

`juured` is scored in data only. Do not show it in the HUD, panel, or cube.

High score = named pole. Pairwise ranks (2026-08-16) mapped `score = round((1 - rank/(n-1))*100)/100`.

## Files

- `index.html` — HUD, pair-view buttons, panel
- `styles.css` — Baltic night tokens
- `src/main.js` — scene, orbit, bucket swap, pair cameras (`FACE = 17.5`)
- `src/cube.js` — wireframe, fat axes, labels
- `src/people.js` — everyone
- `src/buckets.js` — dropdown hulks
- `src/sprites.js` — portraits / stick figures
- `src/panel.js` — click sheet
- `src/pick.js` — raycast; ignore `#panel` `#reset` `#bucket` `#views`
- `portraits/` — local jpgs (Wikimedia / Commons / generated archetypes)

## People

Keep `id` stable. Portrait path is optional; missing file falls back to a stick figure.

Pair views: bottom-right buttons, `←` `→` cycle. Home camera `(7.4, 4.6, 9.2)`.

## Do not

- Add a backend or “add person” form
- Show juured
- Invent new people unless asked
- Use LineBasicMaterial for main axes (linewidth is ignored on Windows)
