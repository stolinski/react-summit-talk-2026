/**
 * A live site embedded full-bleed inside a faux browser window — the credibility
 * payoff: "this isn't toys, here's a whole real library." It's just an <iframe>,
 * but dressed as a desktop browser (traffic lights + URL pill) so it reads as a
 * real product, not a demo. Sized large and at a desktop width so the embedded
 * site renders its DESKTOP layout (no mobile breakpoint) and the room can read it.
 *
 * Used on a `bare: true` slide so it plays on the stage with no card around it.
 */
const SITE = 'https://graffiti-ui.com/'
const LABEL = 'graffiti-ui.com'

export function SiteFrameDemo() {
  return (
    <div className="siteframe">
      <div className="siteframe-bar">
        <span className="siteframe-dots" aria-hidden="true">
          <i style={{ background: '#ff5f57' }} />
          <i style={{ background: '#febc2e' }} />
          <i style={{ background: '#28c840' }} />
        </span>
        <span className="siteframe-url">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z"
            />
          </svg>
          {LABEL}
        </span>
      </div>
      <iframe
        className="siteframe-frame"
        src={SITE}
        title="Graffiti — a platform-only UI library"
        loading="eager"
      />
    </div>
  )
}
