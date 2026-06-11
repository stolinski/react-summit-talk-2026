import { useEffect } from "react";
import { useStore } from "../state/useStore.js";
import { slides } from "../slides/index.js";
import { CodeBlock } from "./CodeBlock.jsx";
import { FLAT } from "../flat.js";

// Per-scene accent so the UI feels art-directed to each world. A planet slide
// uses its own atmosphere; parked demo slides fall back to their cluster's
// color (by kicker) so they match the planet they're orbiting. A slide can set
// `accent` to override. The value eases between scenes (see @property --accent).
const SCENE_ACCENT = {
    "Native HTML": "#ffd27a",
    CSS: "#d9a8ff",
    "Web APIs": "#8ff2ff",
    Agents: "#9cd0ff",
};
const accentFor = (slide) =>
    slide.accent ||
    slide.planet?.atmosphere ||
    SCENE_ACCENT[slide.kicker] ||
    "#38bdf8";

/**
 * The readable layer. Everything legible — titles, code, live demos — is real
 * DOM floating over the WebGL canvas (crisp on any projector, accessible,
 * and itself a quiet proof of the talk's thesis: it's all just the platform).
 *
 * A slide renders whatever fields it declares. Add a demo by adding `demo: X`
 * to a slide in src/slides/index.js — no wiring required.
 */
export function Overlay() {
    const index = useStore((s) => s.index);
    const count = useStore((s) => s.count);
    const slide = slides[index];
    const Demo = slide.demo;
    // `statement: true` (or 'top' / 'bottom') is a punchline beat: title (+ body)
    // enlarged, horizontally centered, and anchored to the top or bottom edge with
    // NO frosted card — the universe carries the frame, and an edge anchor keeps the
    // text clear of any centered 3D subject (a planet, the worm). Defaults to bottom.
    // A `code` or `demo` on a statement slide floats in space as the hero, with the
    // title as a bottom caption (see .card--statement:has() in index.css).
    const statement = slide.statement
        ? slide.statement === "top"
            ? "top"
            : "bottom"
        : null;
    // A slide with code is a "code-hero" slide: the code centers on screen and the
    // planet behind the frosted card becomes a backdrop glow, not the subject. A
    // statement slide opts OUT of this — its code floats card-less instead.
    const codeHero = Boolean(slide.code) && !statement;
    // A slide can also opt into the centered stage without code (e.g. a wide
    // centerpiece demo) via `center: true`.
    const centered = codeHero || Boolean(slide.center);
    // `split: true` lays the code BESIDE the live demo (two columns) instead of
    // stacking demo-under-code — for slides where the demo wants more room.
    const split = Boolean(slide.split && slide.code && Demo);
    // `bare: true` renders NO frosted card — drop it on any slide to strip the
    // chrome. If the slide has a `demo`, it plays full-bleed on the stage (e.g. a
    // big embedded site); with no demo it's just the universe (you narrate over it).
    const bare = Boolean(slide.bare);
    const isStart = slide.id === "start";

    // Fit the fixed 1920×1080 DOM stage to any viewport so the deck looks
    // identical at every projector resolution. The canvas stays full-bleed behind.
    useEffect(() => {
        const fit = () =>
            document.documentElement.style.setProperty(
                "--stage-scale",
                String(
                    Math.min(
                        window.innerWidth / 1920,
                        window.innerHeight / 1080,
                    ),
                ),
            );
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, []);

    // In flat (no-WebGL) mode the .flat-bg backdrop sits below the scaled overlay
    // stage, so it can't read the per-slide --accent that lives on .overlay. Mirror
    // it onto the document root so the backdrop picks up (and cross-fades) the
    // cluster color just like the rest of the UI. No-op cost in 3D mode.
    useEffect(() => {
        if (FLAT)
            document.documentElement.style.setProperty(
                "--accent",
                accentFor(slide),
            );
    }, [slide]);

    return (
        <>
            {/* The pre-roll cover holds black until the opening fly-in; in flat mode
          there's no fly-in, so skip it and show the start slide right away. */}
            <div className="blackout" data-show={isStart && !FLAT} />
            <div
                className={`overlay ${centered ? "overlay--center" : ""} ${
                    slide.intro ? "overlay--intro" : ""
                } ${statement ? `overlay--statement overlay--statement--${statement}` : ""}`}
                style={{ "--accent": accentFor(slide) }}
            >
                {bare ? (
                    // No card: a full-bleed `demo` or `image` fills the stage;
                    // with neither, just the universe shows through.
                    (Demo || slide.image?.src) && (
                        <div className="bare-stage" key={slide.id}>
                            {Demo ? (
                                <Demo />
                            ) : (
                                <img
                                    className="bare-image"
                                    src={slide.image.src}
                                    alt={slide.image.alt || ""}
                                />
                            )}
                        </div>
                    )
                ) : (
                <div
                    key={slide.id}
                    className={`card ${slide.id === "title" ? "card--title" : ""} ${
                        codeHero ? "card--code" : ""
                    } ${slide.center && !codeHero ? "card--wide" : ""} ${
                        split ? "card--split" : ""
                    } ${slide.intro ? "card--intro" : ""} ${
                        statement ? "card--statement" : ""
                    } ${slide.className || ""}`.trim()}
                >
                    {/* {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}*/}
                    <h1>{slide.title}</h1>
                    {slide.body && <p className="body">{slide.body}</p>}
                    {slide.socials && (
                        <div className="socials">
                            {slide.socials.map((s) => (
                                <span key={s} className="social">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                    {slide.image && (
                        <figure className="figure">
                            {slide.image.src ? (
                                <img
                                    src={slide.image.src}
                                    alt={slide.image.alt || ""}
                                />
                            ) : (
                                <div
                                    className="figure-placeholder"
                                    aria-label={
                                        slide.image.alt || "Image placeholder"
                                    }
                                >
                                    <span>Image placeholder</span>
                                </div>
                            )}
                            {slide.image.caption && (
                                <figcaption>{slide.image.caption}</figcaption>
                            )}
                        </figure>
                    )}
                    {split ? (
                        <div className="split">
                            <CodeBlock>{slide.code}</CodeBlock>
                            <div className="demo">
                                <Demo />
                            </div>
                        </div>
                    ) : (
                        <>
                            {slide.code && (
                                <CodeBlock>{slide.code}</CodeBlock>
                            )}
                            {Demo && (
                                <div className="demo">
                                    <Demo />
                                </div>
                            )}
                        </>
                    )}
                </div>
                )}

                <footer className="hud" data-bare={bare || undefined}>
                    <span>
                        {index + 1} / {count}
                    </span>
                </footer>
            </div>
        </>
    );
}
