/**
 * html-in-canvas (WICG) helpers — https://github.com/WICG/html-in-canvas
 *
 * The new `CanvasRenderingContext2D.drawElementImage(element, …)` rasterizes a
 * LIVE DOM element (the element must be a child of a `<canvas layoutsubtree>`)
 * into the 2D context — real fonts, form controls, CSS, all of it. Pair that
 * canvas with a THREE.CanvasTexture and your actual component becomes a texture
 * in the WebGL scene: it blooms, and a planet can occlude it. A drei <Html>
 * overlay — what this whole deck floats over — can do neither.
 *
 * Ships in Chrome 148+ behind chrome://flags/#canvas-draw-element (origin trial
 * 148–150). It is OFF by default, so everything here is written to degrade: when
 * the API is missing we hand-draw a faithful copy of the card with plain Canvas
 * 2D (`drawTalkCardFallback`). That keeps the demo alive on a flag-off projector
 * and lets us author it locally — same move StreamDemo makes for declarative
 * streaming. On stage, flip the flag and the 3D panel renders the genuine DOM.
 */

export const HTML_IN_CANVAS_FLAG = "chrome://flags/#canvas-draw-element";

/** True only when the real drawElementImage API is present (flag enabled). */
export const HTML_IN_CANVAS_SUPPORTED =
    typeof CanvasRenderingContext2D !== "undefined" &&
    typeof CanvasRenderingContext2D.prototype.drawElementImage === "function";

/**
 * Rasterize a live element into a 2D context with the real API. `el` MUST be a
 * descendant of a `<canvas layoutsubtree>` (typically the very canvas we draw
 * into). Returns true on success; false if the API threw or is unavailable, so
 * callers can fall back without a black frame.
 */
export function paintElement(ctx, el, w, h) {
    if (!HTML_IN_CANVAS_SUPPORTED || !el) return false;
    try {
        ctx.reset?.();
        ctx.clearRect(0, 0, w, h);
        // drawElementImage(element, dx, dy, dWidth, dHeight) — scale to fit.
        ctx.drawElementImage(el, 0, 0, w, h);
        return true;
    } catch {
        return false;
    }
}

// ── Fallback: hand-draw the talk card with plain Canvas 2D ──────────────────
// A faithful stand-in for the html-in-canvas render so the texture/demo looks
// right with the flag off. Draws in the ctx's current units (the caller scales
// for DPR), fitting a card of size w×h.

function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxW && line) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/**
 * opts: { accent, eyebrow, title, text, theme, time }
 *   accent  — accent color (drives glow + slider fill)
 *   eyebrow — small uppercase label (accent)
 *   title   — display heading (Newake)
 *   text    — current value shown in the faux input (blinking caret)
 *   theme   — value shown in the faux select
 *   time    — seconds, drives the caret blink + a slow accent shimmer
 */
export function drawTalkCardFallback(ctx, w, h, opts = {}) {
    const {
        accent = "#f5d0fe",
        eyebrow = "BLEEDING EDGE",
        title = "This Component Could Have Been A Div",
        text = "Hello from the DOM",
        theme = "Aurora",
        time = 0,
        fill = null, // 0–1 slider position; when null the knob drifts on its own
    } = opts;

    const pad = Math.round(w * 0.07);
    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Panel: frosted dark glass with a lit top edge + an accent halo ring.
    roundRect(ctx, 0, 0, w, h, w * 0.045);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(20, 24, 40, 0.96)");
    bg.addColorStop(0.42, "rgba(8, 11, 20, 0.96)");
    bg.addColorStop(1, "rgba(6, 8, 16, 0.97)");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeStyle = withAlpha(accent, 0.5);
    ctx.stroke();
    // inner top highlight
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.stroke();

    // Eyebrow (accent, tracked uppercase)
    let y = pad;
    ctx.textBaseline = "top";
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.round(w * 0.026)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(spaced(eyebrow), pad, y);
    y += Math.round(w * 0.05);

    // Title (Newake display face)
    ctx.fillStyle = "#f8fafc";
    const titleSize = Math.round(w * 0.072);
    ctx.font = `800 ${titleSize}px Newake, ui-sans-serif, system-ui, sans-serif`;
    const lines = wrapLines(ctx, title, w - pad * 2);
    const lineH = titleSize * 1.04;
    for (const line of lines) {
        ctx.fillText(line, pad, y);
        y += lineH;
    }
    y += Math.round(w * 0.03);

    // Faux input with a blinking caret — proof it's "live".
    const fieldH = Math.round(w * 0.092);
    const fieldW = w - pad * 2;
    roundRect(ctx, pad, y, fieldW, fieldH, fieldH * 0.28);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.stroke();
    ctx.fillStyle = "#e8eefc";
    const valSize = Math.round(w * 0.04);
    ctx.font = `500 ${valSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    const tx = pad + fieldH * 0.34;
    const ty = y + fieldH / 2;
    ctx.fillText(text, tx, ty);
    if (Math.floor(time * 1.6) % 2 === 0) {
        const cx = tx + ctx.measureText(text).width + 3;
        ctx.fillStyle = accent;
        ctx.fillRect(cx, ty - valSize * 0.52, Math.max(2, w * 0.004), valSize * 1.04);
    }
    y += fieldH + Math.round(w * 0.04);

    // Accent slider: track + fill + knob (slow shimmer so it reads as alive).
    ctx.textBaseline = "top";
    const trackY = y + Math.round(w * 0.02);
    const trackW = w - pad * 2;
    const knobT = fill != null ? Math.max(0, Math.min(1, fill)) : 0.5 + 0.42 * Math.sin(time * 0.9);
    roundRect(ctx, pad, trackY, trackW, Math.max(4, w * 0.012), w * 0.012);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    roundRect(ctx, pad, trackY, trackW * knobT, Math.max(4, w * 0.012), w * 0.012);
    ctx.fillStyle = accent;
    ctx.fill();
    const knobR = w * 0.022;
    ctx.beginPath();
    ctx.arc(pad + trackW * knobT, trackY + (w * 0.012) / 2, knobR, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.shadowColor = withAlpha(accent, 0.9);
    ctx.shadowBlur = w * 0.03;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Theme chip (echoes the faux <select> value), bottom-left.
    const chip = `theme: ${theme}`;
    ctx.font = `600 ${Math.round(w * 0.028)}px ui-sans-serif, system-ui, sans-serif`;
    const chipW = ctx.measureText(chip).width + w * 0.06;
    const chipH = w * 0.07;
    const chipY = h - pad - chipH;
    roundRect(ctx, pad, chipY, chipW, chipH, chipH / 2);
    ctx.fillStyle = withAlpha(accent, 0.16);
    ctx.fill();
    ctx.fillStyle = "#e8eefc";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, pad + w * 0.03, chipY + chipH / 2);

    ctx.restore();
}

// space out letters for the tracked eyebrow look
function spaced(s) {
    return s.split("").join("  ");
}

// accept #rgb/#rrggbb and return an rgba() with the given alpha
function withAlpha(hex, a) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
