# Romeo's House — Landing Site

Single-file, dependency-free landing page for Romeo's House (members-led social house, Victoria Island, Lagos). Aesthetic direction drawn from paradiso.cat — fullscreen hero video, cinematic dark mood, curated "menu" cards, scroll reveals — rebuilt on Romeo's own oxblood + gold + cream brand.

## Structure
```
romeos-house/
├── index.html          ← the whole site (HTML + CSS + JS inline)
├── assets/
│   ├── logo.png        ← your gold wordmark (in place)
│   ├── hero.mp4        ← ADD THIS (fullscreen hero clip)
│   └── hero-poster.jpg ← ADD THIS (first-frame fallback image)
└── README.md
```

## Run locally
Open your **computer's terminal**, `cd` into the folder, and run:
```
python3 -m http.server 8080
```
Then visit `http://localhost:8080`. (Opening `index.html` directly works too, but a server is cleaner for video.)

## Assets — done
All in `assets/`, generated from the brand pack + `cocktail hero.mov`:
- `hero.mp4` — 1920×1080, 17.8s, silent, H.264 CRF 28, faststart. 3.5MB.
- `hero-poster.jpg` — true first frame, so there's no jump when the video starts.
- `seal.png` — real circular crest (`RomeosHouseIconCrest_Gold`), replaced the placeholder SVG.
- `logo.png` — gold wordmark, downscaled 3914px → 1400px.
- `favicon.png` — logomark, 180px. Wired up with OG/Twitter meta.

To regenerate the video from a new source clip:
```
ffmpeg -y -i SOURCE.mov -an -vf "scale=1920:-2,format=yuv420p" \
  -c:v libx264 -preset slow -crf 28 -maxrate 3500k -bufsize 7000k \
  -movflags +faststart assets/hero.mp4
ffmpeg -y -i assets/hero.mp4 -frames:v 1 -q:v 5 assets/hero-poster.jpg
```

## Assets still optional
1. **Interior photos** — the reference uses circular photo clusters; the brochure has good shots to drop into The House / Clubs sections if you want imagery there.
2. **Vector seal** — `seal.png` is a 600px raster. If the brand pack ever ships an SVG crest, swap it in for sharper scaling.

## Design tokens (all in `:root` at the top of index.html)
| Token | Hex | Use |
|---|---|---|
| `--oxblood` | `#3C030E` | primary background |
| `--oxblood-deep` | `#2B0507` | deepest / footer |
| `--oxblood-raised` | `#54101C` | raised panels |
| `--gold` | `#B08028` | brand gold (from logo) |
| `--gold-bright` | `#D4A94E` | highlight / links |
| `--champagne` | `#E9D3A0` | body text on dark |
| `--cream` | `#FEF1D8` | membership section bg |
| `--crimson` | `#92191C` | brochure section headers |
| `--ink` | `#2A0A0E` | text on cream |

**Type:** Cormorant Garamond (display serif, echoes the wordmark) · Jost (deco-geometric UI/body) · Caveat (handwritten "tape" notes — the recurring brand signature from your brochure).

## Sections
`Hero → The House (manifesto + seat counts) → Social Clubs (10-club list) → Membership (6 tiers, cream) → Contact/Footer`. All copy is real, pulled from the brochure. Prices/features verbatim from the membership tiers.

## Continue in Claude CLI — suggested next steps
- Drop in `hero.mp4` + `hero-poster.jpg` and the real seal SVG.
- Add a **membership enquiry form** (name / tier / email) wired to a mailto or a form service.
- Add interior photography to The House and Clubs sections.
- Split into a framework (Next/Astro) if you want a CMS for events — current build is intentionally static so it's trivial to port.
- Add OG/social meta + favicon (generate from `logo.png`).
- Wire "Become a Roomie" to a real signup flow when ready.

Accessibility floor already in place: responsive to mobile, keyboard-visible focus, `prefers-reduced-motion` respected, semantic landmarks.
