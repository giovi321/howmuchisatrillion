# Build prompt — "How Much Is a Billion?"

Paste everything below this line into a fresh Claude Code session in this folder.

---

Build a single-page scroll-driven website that makes people *feel* the difference between a million, a billion, and a trillion. Most people intuitively place "a billion" halfway between a million and a trillion on a number line; in reality it sits 0.1% of the way along. The site exists to break that illusion through motion and scale, not through text.

## Tech stack (do not deviate)

- Plain static site: `index.html`, `why.html`, `css/style.css`, `js/main.js`. No framework, no build step, no npm.
- GSAP 3 + ScrollTrigger via CDN for scroll animations.
- `<canvas>` for any scene with more than ~500 elements (the dot field). Never render thousands of DOM nodes.
- One Google Font max (a heavy display font for the giant numbers, e.g. "Archivo Black" or "Space Grotesk"); system font stack for body text.
- No raster images. Everything is CSS, SVG, or canvas.
- Total JS (excluding GSAP CDN) under 100 KB. Target Lighthouse mobile score ≥ 95.

## Design direction

- Dark near-black background (#0a0a0f or similar), one hot accent (money green #00e676 or gold #ffd54f), white type.
- Typography IS the design: enormous numbers (clamp() from ~4rem mobile to ~12rem desktop), tight tracking.
- Numbers count up/down with easing when they enter the viewport — never appear statically.
- Long scroll, full-bleed scenes, each `min-height: 100svh`. Pinned (sticky) scenes where the content animates while scroll progresses.
- Mobile-first. Design at 360px width first, then scale up. Touch scrolling must stay native — NO scroll-jacking, no custom scroll containers, no horizontal-only sections.
- `prefers-reduced-motion: reduce` → all scenes render in their final static state, no pinning.

## Verified facts (use these exact numbers — do not invent your own math)

- Number line: (1B − 1M) / (1T − 1M) ≈ 0.001 → a billion sits **0.1%** of the way from a million to a trillion.
- A billion is 1,000 millions. A trillion is 1,000 billions = 1,000,000 millions.
- Seconds: 1 million s ≈ **11.6 days**. 1 billion s ≈ **31.7 years** (a billion seconds before 2026 ≈ 1994). 1 trillion s ≈ **31,700 years** (last Ice Age).
- Penny stacks (US penny = 1.52 mm thick): 1 million pennies ≈ **0.95 miles** high (above the Empire State Building, into the clouds). 1 billion ≈ **944 miles** (roughly New York → Cape Canaveral). 1 trillion ≈ **944,000 miles** ≈ the distance to the Moon and back, **twice** (Moon avg distance 238,855 mi).
- Spending $1,000 every day: $1M lasts **2.7 years**; $1B lasts **~2,740 years**; $1T lasts **~2.7 million years**.
- $100 bills weigh ~1 g: $1M = **10 kg** (a backpack); $1B = **10 tonnes** (a delivery truck); $1T = **10,000 tonnes** (roughly the iron in the Eiffel Tower).
- Earning the median US salary (~$60k/yr): $1M ≈ 17 years of work; $1B ≈ 16,700 years; $1T ≈ 16.7 million years.

## Scroll narrative (in order)

1. **Hero.** Giant headline: "How much is a billion?" Subline: "Your brain is lying to you. Scroll." Animated scroll cue. No nav bar.
2. **The line test (interactive).** A horizontal line labeled $1M (left) and $1T (right). Prompt: "Tap where a billion goes." User taps; their guess marker drops; then the true position animates in, crammed against the left edge, with the label "0.1% of the way." Show "Most people guess near the middle." Works with a tap on mobile and a click on desktop; if the user scrolls past without tapping, auto-play the reveal.
3. **Dots.** 1 glowing dot = $1 million. Scene 1: one dot. Scene 2: zoom out, 1,000 dots = $1 billion. Scene 3: zoom way out, 1,000,000 dots = $1 trillion (canvas; render as a dense field — at this zoom the billion cluster should look like a single faint speck, and label it). This is the money shot of the site; spend the most effort here.
4. **Seconds.** Pinned scene, a date ticker scrubs backwards as you scroll: 1M seconds → "11 days ago"; 1B seconds → "1994"; 1T seconds → "29,700 BC — the Ice Age." Years blur past with increasing speed.
5. **Penny stack.** Pinned vertical scene: a penny column grows beside scale markers that fly past — Empire State (0.3 mi), cloud base, cruising altitude (6 mi), Kármán line / edge of space (62 mi), ISS (254 mi), "New York → Cape Canaveral" (944 mi = $1B), then the scene tilts cosmic: Moon distance ×4 for the trillion. End card: "A trillion pennies: to the Moon and back. Twice."
6. **Spend it.** A live dollar counter burning $1,000/day. "$1 million: gone before your next phone upgrade (2.7 years). $1 billion: you'd still be spending if you'd started before the Parthenon was built. $1 trillion: 2.7 million years."
7. **Finale.** The number line from scene 2 returns, with the billion crushed against the million. Headline: "A billion is a rounding error on a trillion." CTA button → `why.html` ("Why your brain can't do this — the full explanation").
8. **Footer.** Tiny: "Inspired by WSJ's 'The Trillions Game' and Landy et al. (2013)." Link to why.html and source links.

## why.html

Use the copy in `content/explainer-copy.md` verbatim. Same dark theme, but a calm readable article layout: max-width ~65ch, generous line height, the big stat callouts styled as pull-quotes. Subtle fade-in on scroll only.

## Quality bar

- Semantic HTML, real headings, OG/Twitter meta tags, inline SVG favicon, descriptive `<title>`.
- 60fps scroll on a mid-range phone: animate only `transform` and `opacity`, use `will-change` sparingly, throttle canvas redraws.
- Test the layout at 360×800 and 1440×900 before calling it done.
