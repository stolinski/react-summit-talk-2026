import { DialogDemo } from "./demos/DialogDemo.jsx";
import { DrawerDemo } from "./demos/DrawerDemo.jsx";
import { ScrollScrubDemo } from "./demos/ScrollScrubDemo.jsx";
import { CounterDemo } from "./demos/CounterDemo.jsx";
import { SiblingIndexDemo } from "./demos/SiblingIndexDemo.jsx";
import { CarouselDemo } from "./demos/CarouselDemo.jsx";
import { StickyDemo } from "./demos/StickyDemo.jsx";
// import { BottomSheetDemo } from "./demos/BottomSheetDemo.jsx"; // bottom-sheet slide cut for now
import { ReelDemo } from "./demos/ReelDemo.jsx";
import { SwipeActionsDemo } from "./demos/SwipeActionsDemo.jsx";
import { AnchorFlipDemo } from "./demos/AnchorFlipDemo.jsx";
import { DependencyContrastDemo } from "./demos/DependencyContrastDemo.jsx";
import { StreamDemo } from "./demos/StreamDemo.jsx";
import { SelectDemo } from "./demos/SelectDemo.jsx";
import { EmojiPickerDemo } from "./demos/EmojiPickerDemo.jsx";
import { HtmlInCanvasDemo } from "./demos/HtmlInCanvasDemo.jsx";
import { SiteFrameDemo } from "./demos/SiteFrameDemo.jsx";

/**
 * ───────────────────────── PLANETS (CLUSTERS) ─────────────────────────────
 *  Each demo planet is defined ONCE here: its theme `label`, its `planet`
 *  body, and the `camera` waypoint demos park at. A demo slide just tags
 *  `cluster: "<id>"` (in the array below) and the builder injects the planet
 *  (onto the cluster's FIRST demo), the parked camera, the section kicker, and
 *  the accent — no per-slide planet/waypoint copying.
 *
 *  Order here is the OUTWARD spatial tour, escalating toward bleeding-edge.
 *  • Move a demo to another planet → change its one `cluster` tag.
 *  • Reorder demos within a planet → just reorder them in the array.
 *  • Retheme / recolor / reposition a planet → edit it here once.
 *  Positions stay within the small solar-system scale (~tens of units from the
 *  origin sun); the galaxy lives far away (see scene/layout.js).
 * ──────────────────────────────────────────────────────────────────────────
 */
const CLUSTERS = {
    "native-html": {
        label: "Native HTML",
        planet: {
            position: [-58, 3, 36],
            radius: 3.0,
            color: "#f5a524",
            colorDeep: "#5a2e05",
            atmosphere: "#ffd27a",
            freq: 3.0,
            variant: "terran",
            tilt: 0.18,
        },
        // Target below the planet → it rides high as decoration above the demos.
        camera: { pos: [-44, 9, 52], target: [-58, -2, 36] },
    },
    "scroll-snap": {
        label: "Scroll-snap UI",
        planet: {
            position: [-86, -6, -28],
            radius: 3.2,
            color: "#34d399",
            colorDeep: "#064e3b",
            atmosphere: "#a7f3d0",
            freq: 2.4,
            variant: "ocean",
            tilt: 0.35,
        },
        camera: { pos: [-68, 4, -22], target: [-86, -11, -28] },
    },
    "scroll-driven": {
        label: "Scroll-driven CSS",
        planet: {
            position: [-30, -4, -92],
            radius: 3.4,
            color: "#a855f7",
            colorDeep: "#2e0a52",
            atmosphere: "#d9a8ff",
            freq: 2.0,
            variant: "gas",
            tilt: 0.45,
            rings: { inner: 1.4, outer: 2.45 },
        },
        // Target aimed BELOW the planet so it rides high in frame (decoration above
        // the bottom-anchored demo, not fighting it in the middle). See statement
        // demo slides.
        camera: { pos: [-16, 6, -70], target: [-30, -10, -92] },
    },
    "css-lang": {
        label: "CSS as a language",
        planet: {
            position: [44, -8, -104],
            radius: 3.0,
            color: "#fb7185",
            colorDeep: "#4c0519",
            atmosphere: "#fecdd3",
            freq: 2.8,
            variant: "cratered",
            tilt: 0.2,
        },
        camera: { pos: [36, 2, -86], target: [44, -13, -104] },
    },
    overlays: {
        label: "Overlays & menus",
        planet: {
            position: [118, 5, -46],
            radius: 2.8,
            color: "#22d3ee",
            colorDeep: "#06363f",
            atmosphere: "#8ff2ff",
            freq: 2.6,
            variant: "ice",
            tilt: 0.55,
            moon: true,
        },
        camera: { pos: [101, 13, -26], target: [118, -1, -46] },
    },
    edge: {
        label: "Bleeding edge",
        planet: {
            position: [132, 14, 44],
            radius: 3.2,
            color: "#e879f9",
            colorDeep: "#4a044e",
            atmosphere: "#f5d0fe",
            freq: 2.2,
            variant: "molten",
            tilt: 0.3,
            moon: {
                color: "#ffcaa6",
                colorDeep: "#5a2a10",
                dist: 2.6,
                radius: 0.3,
            },
        },
        camera: { pos: [113, 20, 38], target: [132, 9, 44] },
    },
};

/**
 * Expand `cluster` tags into the flat slide shape the rest of the app expects
 * (Universe reads `planet`, CameraRig reads `camera`, Overlay reads `kicker` /
 * `accent`). The planet body lands on the FIRST slide of each cluster; every
 * slide in the cluster shares the parked camera + accent. Anything set
 * explicitly on a slide wins. Non-clustered slides pass straight through.
 */
function withClusters(list) {
    const planted = new Set();
    return list.map((slide) => {
        if (!slide.cluster) return slide;
        const c = CLUSTERS[slide.cluster];
        if (!c)
            throw new Error(
                `Unknown cluster "${slide.cluster}" on slide "${slide.id}"`,
            );
        const out = {
            ...slide,
            kicker: slide.kicker ?? c.label,
            camera: slide.camera ?? c.camera,
            accent: slide.accent ?? c.accent ?? c.planet?.atmosphere,
        };
        // First demo of the cluster carries the planet so it renders + the
        // camera flies to it; the rest park alongside as card swaps.
        if (!planted.has(slide.cluster)) {
            planted.add(slide.cluster);
            out.planet = slide.planet ?? c.planet;
        }
        return out;
    });
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE TALK.  Each object is one slide. This is the only file you edit to
 *  build it out — add planets (see CLUSTERS above), copy, code, and demos.
 *
 *  Order: title hook → who I am (Syntax / Sentry constellations) → into the
 *  solar system to tour the demo planets → AI close → galaxy pull-back.
 *
 *  Fields (all optional except id + camera/cluster):
 *    cluster "<id>"  join a demo planet (see CLUSTERS) — injects planet/camera/
 *                    kicker/accent. To re-home a demo, change this one tag.
 *    camera  { pos, target, smoothTime? }   where/how the camera flies
 *                    (from the cluster for demos; set here to override)
 *    planet  { position, radius, color, colorDeep, atmosphere, freq }
 *    eyebrow / title / body / code / demo / socials / kicker   panel content
 *    center  true → centered stage without code (wide centerpiece demo)
 *    accent  '#rrggbb' → override the per-scene accent (else planet/kicker)
 *    support per-engine { chrome, safari, firefox } → 3D logo coins. Each value:
 *            true · false/omit · 'partial' · { since:'125' } · { since, flag:true }.
 *            Hover a coin for version/flag. Omit `support` to hide. See BrowserSupport.
 *
 *  Demos are ordered most-supported → least within each planet.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const slides = withClusters([
    {
        id: "start",
        // Black pre-roll: the screen stays black on load (see .blackout in
        // Overlay.jsx) so the opening fly-in only fires when you hit next. The
        // camera sits pulled back; advancing dollies in to the title.
        camera: { pos: [78, 16, 66], target: [34, 1, 22] },
    },
    {
        id: "title",
        kicker: "Departure",
        title: "This Component Could Have Been A Div",
        planet: {
            position: [34, 1, 22],
            radius: 2.4,
            color: "#5b9dff",
            colorDeep: "#0b2a6b",
            atmosphere: "#9cd0ff",
            freq: 2.6,
        },
        camera: { pos: [48, 6, 40], target: [34, 1, 22], smoothTime: 1.4 },
    },
    {
        id: "intro-syntax",
        kicker: "Hello",
        // `intro: true` → no frosted card; the content floats centered in space
        // below the logo constellation (see .card--intro). Here that's just the
        // socials, enlarged — the Syntax logo overhead already names the show.
        intro: true,
        socials: ["@stolinski", "@syntaxfm"],
        // Frames the Syntax constellation (at x -360) head-on, camera looking +z
        // (away from the galaxy band) so the backdrop is clean deep space. Sentry
        // sits far to the right, off-screen, until the next slide pans over to it.
        camera: { pos: [-360, 408, 190], target: [-360, 400, 520] },
    },
    {
        id: "intro-sentry",
        kicker: "Hello",
        // Same chromeless treatment: just the centered "Sentry.io" wordmark
        // floating below the Sentry logo constellation.
        intro: true,
        title: "Sentry.io",
        camera: { pos: [360, 408, 190], target: [360, 400, 520] },
    },
    {
        id: "intro-qr",
        kicker: "Hello",
        // QR code rendered as white stars — same chromeless intro treatment as
        // the Sentry wordmark. The pan keeps moving right: Syntax → Sentry → QR.
        intro: true,
        title: "Code & Demos",
        camera: { pos: [1080, 408, 190], target: [1080, 400, 520] },
    },
    {
        id: "system",
        // Frame the React-logo atom (ReactAtom, gated to this slide in Universe.jsx)
        // alone against deep space — one planet, no neighbors in sight. Looks +z so
        // the sun and the other planets stay behind the camera, out of frame.
        // `bare`: no card — just the atom against space (you narrate over it).
        bare: true,
        accent: "#61dafb",
        // Short smoothTime: this is a long descent from the far-out intro constellation
        // (intro-sentry is 408 units up) into a close-up of the atom, so the default
        // 1.0 leaves a long slow coast at the end. 0.65 keeps the swoop tight.
        camera: { pos: [-2, 13, 92], target: [-3, 10, 120], smoothTime: 0.65 },
    },

    /* ───── PLANET 1 · Native HTML — dialogs & drawers (all <dialog>) ───── */
    {
        // Arrival beat: just the planet + a centered chromeless wordmark
        // (Sentry-slide style) announcing the cluster before the demos fire.
        id: "dialogs-drawers",
        cluster: "native-html",
        intro: true,
        title: "Dialogs & Drawers",
    },
    {
        id: "native-html",
        cluster: "native-html",
        title: "A basic modal",
        statement: true,
        support: {
            chrome: { since: "37" },
            safari: { since: "15.4" },
            firefox: { since: "98" },
        },
        code: [
            "<dialog ref={ref}>…</dialog>",
            "",
            "ref.current.showModal()",
        ].join("\n"),
        demo: DialogDemo,
    },
    {
        id: "drawer",
        cluster: "native-html",
        title: "A drawer that slides in",
        statement: true,
        support: {
            chrome: { since: "117" },
            safari: { since: "17.5" },
            firefox: { since: "129" },
        },
        // Part 1 of the drawer — the ENTER. translate moves it; @starting-style is
        // the state to animate FROM, so the first open slides instead of popping.
        code: [
            '<dialog class="drawer">…</dialog>',
            "",
            ".drawer       { translate: 100% 0 }",
            ".drawer[open] { translate: 0 }",
            ".drawer { transition: translate 0.35s ease }",
            "",
            "/* the state to animate FROM, so the first",
            "   open SLIDES in instead of popping */",
            "@starting-style {",
            "  .drawer[open] { translate: 100% 0 }",
            "}",
        ].join("\n"),
        demo: DrawerDemo,
    },
    {
        id: "drawer-exit",
        cluster: "native-html",
        title: "And it slides back out",
        statement: true,
        support: {
            chrome: { since: "117" },
            safari: { since: "17.4" },
            firefox: { since: "129" },
        },
        // Part 2 — the EXIT, the kill shot. Closing a <dialog> normally yanks it out
        // instantly; allow-discrete on display/overlay keeps it rendered + in the top
        // layer long enough to play the slide-out. The part people install vaul for.
        code: [
            "/* closing a <dialog> normally removes it now —",
            "   display: none hits, the exit never plays */",
            "",
            ".drawer {",
            "  transition:",
            "    translate 0.35s ease,",
            "    display   0.35s allow-discrete,",
            "    overlay   0.35s allow-discrete;",
            "}",
            "",
            "/* allow-discrete keeps it rendered + on top",
            "   long enough to animate OUT — no library */",
        ].join("\n"),
        demo: DrawerDemo,
    },

    /* ───── PLANET 2 · Scroll-snap UI — sheets, swipes, carousels ───── */
    {
        // Arrival beat (see "dialogs-drawers").
        id: "scroll-snap",
        cluster: "scroll-snap",
        intro: true,
        title: "Scroll Snap",
    },
    {
        id: "reel",
        cluster: "scroll-snap",
        split: true,
        statement: true,
        title: "The classic TikTok Swiper",
        support: {
            chrome: { since: "69" },
            safari: { since: "11" },
            firefox: { since: "68" },
        },
        code: [
            ".feed {",
            "  overflow-y: auto;",
            "  scroll-snap-type: y mandatory;",
            "}",
            "",
            "/* each post is one snap target */",
            ".post {",
            "  height: 100%;",
            "  scroll-snap-align: start;",
            "}",
        ].join("\n"),
        demo: ReelDemo,
    },
    // Cut for now — re-enable by uncommenting (and the BottomSheetDemo import).
    // {
    //     id: "bottom-sheet",
    //     cluster: "scroll-snap",
    //     split: true,
    //     title: "A sheet that snaps to size",
    //     support: {
    //         chrome: { since: "69" },
    //         safari: { since: "11" },
    //         firefox: { since: "68" },
    //     },
    //     code: [
    //         ".sheet {",
    //         "  overflow-y: auto;",
    //         "  scroll-snap-type: y mandatory;",
    //         "  overscroll-behavior: contain;",
    //         "}",
    //         "",
    //         "/* one rung per resting position */",
    //         ".detent { scroll-snap-align: start }",
    //     ].join("\n"),
    //     demo: BottomSheetDemo,
    // },
    {
        id: "swipe-actions",
        cluster: "scroll-snap",
        split: true,
        statement: true,
        title: "A row swiper",
        support: {
            chrome: { since: "105" },
            safari: { since: "16" },
            firefox: { since: "110" },
        },
        code: [
            ".swipe {",
            "  display: grid;",
            "  grid-template-columns: auto 1fr auto;",
            "  container-type: inline-size;",
            "  overflow-x: auto;",
            "  scroll-snap-type: x mandatory;",
            "}",
            "",
            "/* middle cell fills the row → actions wait */",
            "/* offscreen; center is the ONLY snap point, */",
            "/* so every released swipe springs back */",
            ".row {",
            "  inline-size: 100cqw;",
            "  scroll-snap-align: center;",
            "}",
        ].join("\n"),
        demo: SwipeActionsDemo,
    },
    {
        id: "carousel",
        cluster: "scroll-snap",
        split: true,
        statement: true,
        title: "The carousel builds its own controls",
        support: {
            chrome: { since: "135" },
            safari: false,
            firefox: false,
        },
        code: [
            ".carousel {",
            "  display: flex;",
            "  overflow-x: auto;",
            "  scroll-snap-type: x mandatory;",
            "  scroll-marker-group: after;   /* dot row */",
            "}",
            ".slide { scroll-snap-align: center }",
            "",
            "/* dots + arrows — GENERATED, zero markup */",
            '.slide::scroll-marker { content: "" }',
            ".slide::scroll-marker:target-current {",
            "  background: #fff",
            "}",
            '.carousel::scroll-button(right) { content: "›" }',
        ].join("\n"),
        demo: CarouselDemo,
    },

    /* ───── PLANET 3 · Scroll-driven CSS — scroll position drives style ───── */
    {
        // Arrival beat (see "dialogs-drawers").
        id: "scroll-driven",
        cluster: "scroll-driven",
        intro: true,
        title: "Scroll Driven",
    },
    {
        id: "scroll-scrub",
        cluster: "scroll-driven",
        title: "Scroll-driven animation",
        statement: true,
        split: true,
        support: {
            chrome: { since: "115" },
            safari: { since: "26" },
            firefox: { flag: true },
        },
        code: [
            ".card {",
            "  animation: scrub linear both;",
            "  animation-timeline: view(inline);",
            "}",
            "",
            "@keyframes scrub {",
            "  0%   { scale: .6; rotate: y -42deg }",
            "  50%  { scale: 1;  rotate: y 0 }",
            "  100% { scale: .6; rotate: y 42deg }",
            "}",
        ].join("\n"),
        demo: ScrollScrubDemo,
    },
    {
        id: "sticky-state",
        cluster: "scroll-driven",
        split: true,
        statement: true,
        title: "A header that knows it’s stuck",
        support: {
            chrome: { since: "133" },
            safari: false,
            firefox: false,
        },
        code: [
            ".header {",
            "  position: sticky; top: 0;",
            "  container-type: scroll-state;",
            "}",
            "",
            "@container scroll-state(stuck: top) {",
            "  .title { box-shadow: 0 12px 30px #000 }",
            "}",
        ].join("\n"),
        demo: StickyDemo,
    },

    /* ───── PLANET 4 · CSS as a language — it computes + knows things ───── */
    {
        // Arrival beat (see "dialogs-drawers").
        id: "values",
        cluster: "css-lang",
        intro: true,
        title: "Values",
    },
    {
        id: "counter",
        cluster: "css-lang",
        title: "Numbers that count themselves",
        statement: true,
        support: {
            chrome: { since: "85" },
            safari: { since: "16.4" },
            firefox: { since: "128" },
        },
        code: [
            "@property --n {",
            '  syntax: "<integer>";',
            "  initial-value: 0;",
            "}",
            "",
            ".stat {",
            "  counter-reset: n var(--n);",
            "  animation: count 3s both;",
            "}",
            ".stat::after { content: counter(n) }",
            "",
            "@keyframes count { to { --n: 1000000 } }",
        ].join("\n"),
        demo: CounterDemo,
    },
    {
        id: "sibling-index",
        cluster: "css-lang",
        title: "Every element knows its index",
        statement: true,
        split: true,
        support: {
            chrome: { since: "138" },
            safari: { since: "26.2" },
            firefox: false,
        },
        code: [
            ".bar {",
            "  height: calc(sibling-index() * 28px);",
            "  background: hsl(calc(sibling-index() * 26) 85% 62%);",
            "  animation-delay: calc(sibling-index() * 70ms);",
            "}",
            "",
            '/* no style="--i" anywhere */',
        ].join("\n"),
        demo: SiblingIndexDemo,
    },

    /* ───── PLANET 5 · Overlays & menus — anchor positioning (zero-JS menu) ───── */
    {
        // Arrival beat (see "dialogs-drawers").
        id: "overlays-menus",
        cluster: "overlays",
        intro: true,
        title: "Overlays & Menus",
    },
    {
        id: "anchor-flip",
        cluster: "overlays",
        // Side-by-side: the code sits beside the live (draggable) demo so there's
        // room to show the menu flipping as you drag. Card-less: the two panels
        // float in space with the title as a bottom caption (see .card--statement).
        split: true,
        statement: true,
        title: "A menu that flips to stay on screen",
        support: {
            chrome: { since: "125" },
            safari: { since: "18.4" },
            firefox: { since: "147" },
        },
        code: [
            ".btn  { anchor-name: --btn }",
            "",
            ".menu {",
            "  position-anchor: --btn;",
            "  position-area: block-end;",
            "  position-try-fallbacks:",
            "    flip-block, flip-inline;",
            "}",
            "",
            "/* the menu flips to stay on screen — no JS */",
        ].join("\n"),
        demo: AnchorFlipDemo,
    },
    {
        id: "image-placeholder",
        cluster: "overlays",
        // Full-bleed image, no card or title — it fills the stage over the universe
        // (see the `bare` branch in Overlay.jsx, which renders a bare `image`).
        bare: true,
        image: {
            src: "/anchor.png",
            alt: "Anchor positioning",
        },
    },
    {
        id: "select-base",
        cluster: "overlays",
        split: true,
        statement: true,
        // Part 1 — the OPT-IN. A real native <select> (keyboard, typeahead, form
        // submission, a11y all free) becomes fully styleable with one line:
        // `appearance: base-select` on the control AND its ::picker popover. The
        // custom trigger is a <button> whose <selectedcontent> mirrors the chosen
        // option. Don't name the library on the slide — say it out loud.
        title: "Select lists no longer suck",
        support: {
            chrome: { since: "135" },
            safari: { flag: true, label: "Technology Preview" },
            firefox: false,
        },
        code: [
            "<select>",
            "  /* <selectedcontent /> mirrors the selected option */",
            "  <button><selectedcontent /></button>",
            "",
            '  <option value="maya">',
            '    <img src="avatar.png">',
            "    <b>Maya R.</b> <small>Frontend</small>",
            "  </option>",
            "</select>",
            "",
            "/* opt the control + its popover into styling */",
            "select,",
            "select::picker(select) {",
            "  appearance: base-select;",
            "}",
        ].join("\n"),
        demo: SelectDemo,
    },
    {
        id: "select-style",
        cluster: "overlays",
        split: true,
        statement: true,
        // Same layout/title as select-base (it's the continuation — only the code
        // changes); narrate the difference. Keeps the two beats visually identical.
        title: "Select lists no longer suck",
        // Part 2 — the PAYOFF. Now the option list is just a box of flex rows you
        // style like anything else (the exact part that used to force a JS
        // combobox), with native state in pure CSS — and because the picker is a
        // real popover, it animates open via @starting-style.
        support: {
            chrome: { since: "135" },
            safari: { flag: true, label: "Technology Preview" },
            firefox: false,
        },
        code: [
            "/* the option list is just flex rows now */",
            "option { display: flex; gap: 12px }",
            "",
            "option:hover      { background: #1c2540 }",
            "option:checked    { background: var(--accent) }",
            "option::checkmark { display: none } /* no tick */",
            "",
            "/* it's a popover, so it can animate open */",
            "@starting-style {",
            "  select:open::picker(select) { opacity: 0 }",
            "}",
        ].join("\n"),
        demo: SelectDemo,
    },
    {
        id: "select-emoji",
        cluster: "overlays",
        // Side-by-side: code beside the live reaction picker, to show more.
        split: true,
        statement: true,
        // Una Kravets' emoji reaction picker, used verbatim (see EmojiPickerDemo).
        // The shock: this Facebook-style reaction bar is the SAME native <select>
        // — the only trick is laying its picker out as a horizontal row of round
        // emoji. The code panel shows that unique bit (not the base-select opt-in
        // from the prior slides, nor her @supports fallback). Credit Una on the
        // demo; don't name a library on the slide.
        eyebrow: "Still one native <select>",
        title: "An emoji reaction picker",
        support: {
            chrome: { since: "135" },
            safari: { flag: true, label: "Technology Preview" },
            firefox: false,
        },
        // Her verbatim property lines — the row-picker is what makes this demo
        // unique. The demo itself renders the full pen. codepen.io/una/pen/RNaWYNK
        code: [
            "/* the picker is a horizontal row of round */",
            "/* emoji — a reaction bar, not a dropdown */",
            "::picker(select) {",
            "  flex-direction: row;",
            "}",
            "",
            "option {",
            "  font-size: 1.8rem;",
            "  border-radius: 50%;",
            "  padding: 0.7rem;",
            "  &::checkmark { display: none }",
            "}",
        ].join("\n"),
        demo: EmojiPickerDemo,
    },

    /* ───── PLANET 6 · Bleeding edge — newest of the new ───── */
    {
        // Arrival beat (see "dialogs-drawers").
        id: "bleeding-edge",
        cluster: "edge",
        intro: true,
        title: "Bleeding Edge",
    },
    {
        id: "stream",
        cluster: "edge",
        // COPY IS PLACEHOLDER — Scott rewrites. The eyebrow names the old way (the
        // hand-rolled JS DOM injection: fetch → find the node → clone a <template> →
        // innerHTML it in → wire up the loading state). Title stays direct, about the
        // feature. https://developer.chrome.com/blog/declarative-partial-updates
        eyebrow: "No fetch, no innerHTML, no hydration",
        title: "HTML that streams in, out of order",
        // Wide centerpiece demo (like ai-supply-chain): the live mock + the real
        // declarative source sit side-by-side inside the demo itself. No `support`
        // coins — the wide card would collide with the right-margin column, so the
        // compat fact (Chrome 148, flag) lives inside the demo instead.
        statement: true,
        demo: StreamDemo,
    },
    {
        id: "html-canvas",
        cluster: "edge",
        // The finale's SETUP. For years, getting DOM into a canvas/WebGL meant a
        // screenshot (html2canvas) or a separate CSS3D layer that can't composite
        // with the scene. drawElementImage() rasterizes a LIVE, interactive element
        // straight into a 2D context — real fonts, inputs, CSS. The demo lets you
        // type on the left and watch the canvas (right) update. COPY IS PLACEHOLDER.
        title: "Draw live HTML into a canvas",
        // Wide side-by-side demo (like `stream`): the live component, its <canvas>
        // mirror, and the genuine drawElementImage source all sit inside the demo.
        // No `support` coins — the wide card would collide with the right-margin
        // column, so the compat fact (Chrome 148, flag) lives inside the demo.
        statement: true,
        demo: HtmlInCanvasDemo,
    },
    {
        id: "html-canvas-reveal",
        cluster: "edge",
        // THE STAR — the talk's own card, live DOM rasterized to a texture on a
        // plain 3D panel floating beside the planet (scene HtmlPanel, gated by
        // this id in Universe). Deliberately NO effects: the shock is just "that's
        // real DOM in the universe" — the star-scatter trick already happened on
        // the html-canvas slide. NO overlay card — `bare` renders just the
        // universe; Scott narrates. Uses the real drawElementImage on stage (flag
        // on), a hand-drawn fallback otherwise.
        bare: true,
        camera: { pos: [112, 16, 51], target: [131, 13, 45], smoothTime: 1.4 },
    },
    {
        id: "graffiti",
        // The credibility payoff capping the demo tour: Graffiti — Scott's
        // platform-only (HTML/CSS) component library — embedded LIVE and full
        // screen. `bare` drops the card so the faux-browser frame fills the stage;
        // its desktop width forces the site's desktop layout (no mobile view).
        // Parked at the bleeding-edge planet (same vista as html-canvas-reveal, no
        // camera move) — ai-intro then does the pull-back to the system overview.
        bare: true,
        demo: SiteFrameDemo,
        accent: "#34d399",
        camera: { pos: [112, 16, 51], target: [131, 13, 45], smoothTime: 1.2 },
    },

    /* ───────────────────────── CLOSING MOVEMENT: AGENTS ─────────────────────────
     *  The "so what" — placed BEFORE the galaxy so the pull-back stays the final
     *  payoff and isn't spoiled (from this "whole system" vista the galaxy is still
     *  just a faint band; see scene/layout.js scale separation). AI is the meaning
     *  of the tour, not a tangent: agents default to the average (div soup + a
     *  dependency), so your platform knowledge is the ceiling on what they ship —
     *  and a vote on the next corpus. Supply chain is the load-bearing middle.
     *
     *  COPY IS PLACEHOLDER — Scott rewrites. Parked at the system overview (a
     *  deliberate rhyme with the early `system` slide); `ai-intro` flies back here
     *  from the bleeding-edge planet, then `galaxy` does the big pull-back from here.
     * ────────────────────────────────────────────────────────────────────────── */
    {
        id: "ai-intro",
        kicker: "Agents",
        title: "Your agents can write this too.",
        body: "Less code, less bespoke APIs to use, less version thrash.",
        statement: true,
        // Pull back out of the bleeding-edge planet to the whole-system vista.
        camera: { pos: [70, 95, 250], target: [0, 0, 0], smoothTime: 1.8 },
    },
    {
        id: "ai-supply-chain",
        kicker: "Agents",
        eyebrow: "Every import is a trust decision",
        title: "The same menu, two supply chains",
        statement: true,
        demo: DependencyContrastDemo,
        camera: { pos: [70, 95, 250], target: [0, 0, 0] },
    },
    {
        id: "ai-excuse",
        kicker: "Agents",
        eyebrow: "The trade-off collapsed",
        title: "The reason you installed it is gone",
        worm: true,
        body: "You pulled in the library because writing it yourself was the expensive part. It isn’t anymore. The dependency stopped being a trade and became risk you kept for nothing.",
        statement: true,
        // View from the SUN side (sun behind the camera, out of frame) so we see the
        // lit face of the planet and the worm breaching it — no distracting sun. Aimed
        // BELOW the planet (low target Y) + pulled back a touch so the planet + worm
        // ride high in the frame, leaving the lower third clear for the statement text.
        camera: { pos: [21, 6, 16], target: [33, -2, 21], smoothTime: 1.6 },
    },
    {
        id: "ai-defaults",
        kicker: "Agents",
        title: "You have control",
        body: "You don't have to accept whatever it gives you",
        statement: true,
        code: [
            "# CLAUDE.md / .cursorrules",
            "",
            "Prefer the platform over packages:",
            "  <dialog>        over a modal library",
            "  :has()          over state",
            "  anchor + try    over Floating UI",
            "  scroll timeline over scroll listeners",
            "",
            "No new dependency without asking first.",
        ].join("\n"),
        // Ease back out to the system vista after the close worm beat.
        camera: { pos: [70, 95, 250], target: [0, 0, 0], smoothTime: 1.8 },
    },
    {
        // The star-field QR again as the closing beat: fly back up out of the
        // system to the same constellation from the intro, right before the
        // galaxy pull-back. Chromeless, just the QR + wordmark.
        id: "ai-close",
        intro: true,
        title: "Code & Demos",
        camera: { pos: [1080, 408, 190], target: [1080, 400, 520] },
    },
    {
        // Duplicate of the intro Syntax beat as a closing sign-off: pan back left
        // from the QR to the Syntax constellation, socials enlarged below it.
        // (Whitelisted in Universe.jsx so the constellation renders here too.)
        id: "outro-syntax",
        kicker: "Hello",
        intro: true,
        socials: ["@stolinski", "@syntaxfm"],
        camera: { pos: [-360, 408, 190], target: [-360, 400, 520] },
    },

    /* ── THE PAYOFF ── The final pull-back. Stays last; nothing parked on top of
     *  it. The huge zoom from the system vista to GALAXY.center is the reveal, and
     *  the sign-off (socials) lands on it. */
    {
        id: "galaxy",
        title: "Thank you",
        socials: ["@stolinski", "@syntaxfm"],
        // Card-less finale: a huge "Thank you" at top-center over the galaxy
        // pull-back, socials signed off beneath it.
        statement: "top",
        className: "card--thanks",
        camera: {
            pos: [8000, 52000, 15000],
            target: [8000, -900, -15000], // === GALAXY.center
            smoothTime: 2.2, // long, majestic pull-back (still slower than the hops)
        },
    },
]);
