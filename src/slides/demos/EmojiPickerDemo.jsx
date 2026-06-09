import { useEffect, useRef } from 'react'

/**
 * "Emoji Picker with fallback" — by Una Kravets.
 * https://codepen.io/una/pen/RNaWYNK
 *
 * Used VERBATIM (her exact HTML + CSS below). The whole thing is one native
 * <select> opted into `appearance: base-select`, restyled into a round emoji
 * reaction button whose picker is a horizontal row — and wrapped in
 * `@supports (appearance: base-select)` so browsers without it just get a
 * normal, working <select>. A reaction picker that could have been a div.
 *
 * Because her CSS targets bare `select` / `option` / `::picker(select)` / `body`
 * (it's a standalone pen), we render it into a SHADOW ROOT so those global
 * selectors stay fully encapsulated and can't leak into the rest of the deck —
 * her source is reproduced unchanged, the `body { height: 90vh }` rule simply
 * has no effect inside the shadow tree. Shadow DOM is itself the platform.
 *
 * One intentional deviation from the pen: the picker is positioned ABOVE the
 * button and centered on it (`position-area: top` + `justify-self:
 * anchor-center`) instead of below, to suit this slide's layout.
 */

// ── Una's exact source, copied verbatim from the pen ────────────────────────
const HTML = `<select>
  <button>
    <selectedcontent></selectedcontent>
  </button>
  <option>
    <span>👍</span> <span class="sr-only">Like</span>
  </option>
  <option>
    <span>❤️</span> <span class="sr-only">Love</span>
  </option>
  <option>
    <span>😂</span> <span class="sr-only">Haha</span>
  </option>
  <option>
    <span>😮</span> <span class="sr-only">Wow</span>
  </option>
  <option>
    <span>😢</span> <span class="sr-only">Sad</span>
  </option>
  <option>
    <span>😡</span> <span class="sr-only">Angry</span>
  </option>
</select>`

const CSS = `select, ::picker(select) {
  appearance: base-select;
}

select {
  border: none;
  width: max-content;
  background: none;

  &::picker-icon {
    display: none;
  }

  &:open::picker(select) {
    display: flex;
  }

  @supports (appearance: base-select) {
    aspect-ratio: 1;
    border-radius: 50%;
    padding: 0.5rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f0f0f0;
    }
  }
}

selectedcontent {
  font-size: 1.5rem;
  padding: 0.2rem;

  span {
    width: 100%;
    padding: 0.1rem;
  }
}


::picker(select) {
  position-area: top;
  justify-self: anchor-center;
  background-color: white;
  border-radius: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.1);
  flex-direction: row;
  padding: 0.5rem 0.8rem;
  margin-bottom: 0.8rem;
}

option {
  font-size: 1.8rem;
  cursor: pointer;
  border-radius: 50%;
  line-height: 1;
  transition: background-color 0.2s ease;
  padding: 0.7rem;
  line-height: 1;

  &::checkmark {
    display: none;
  }

  &:hover {
    background-color: #f0f0f0;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

body {
  display: grid;
  place-content: center;
  height: 90vh;
}`

export function EmojiPickerDemo() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || host.shadowRoot) return
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>${CSS}</style>${HTML}`
  }, [])

  return (
    <figure className="emoji-react">
      <div className="emoji-react-host" ref={hostRef} />
      <figcaption className="emoji-react-credit">
        Emoji picker by <strong>Una Kravets</strong> ·{' '}
        codepen.io/una/pen/RNaWYNK
      </figcaption>
    </figure>
  )
}
