/**
 * The styled dropdown everyone reaches for react-select / Radix Select /
 * Headless UI Listbox to build: a trigger that shows the picked option with an
 * avatar, opening a popover of RICH options (avatar + name + role).
 *
 * This is a REAL native <select> — keyboard, typeahead, form submission and
 * screen-reader semantics all free — opted into full styling with
 * `appearance: base-select`. The custom trigger is a <button> holding a
 * <selectedcontent>, which the browser fills with a live clone of the chosen
 * <option>'s markup. The option list is the ::picker(select) popover; the open
 * state and the active row are plain CSS (:open, option:checked). Zero JS,
 * zero dependency.
 *
 * Avatars are CSS-drawn (initials in a colored disc) so nothing is fetched —
 * offline-safe on conference wifi, like the swipe demo's avatars.
 *
 * NOTE: React's dev-only `validateDOMNesting` logs two warnings here — a
 * <button> inside <select>, and elements inside <option>. Both are now VALID
 * HTML under the customizable-select spec (that's the whole point); React's
 * check just predates it. The warnings are stripped from production builds and
 * nothing is broken — the control renders and behaves natively.
 */
const PEOPLE = [
  { id: 'maya', name: 'Maya R.', role: 'Frontend', initials: 'MR', hue: 200 },
  { id: 'owen', name: 'Owen B.', role: 'Platform', initials: 'OB', hue: 265 },
  { id: 'priya', name: 'Priya N.', role: 'Infrastructure', initials: 'PN', hue: 150 },
  { id: 'sana', name: 'Sana K.', role: 'Design', initials: 'SK', hue: 330 },
]

export function SelectDemo() {
  return (
    <div className="pick">
      <label htmlFor="reviewer">Assign reviewer</label>

      <select id="reviewer" className="pick-select" defaultValue="maya">
        {/* the custom trigger — <selectedcontent> mirrors the chosen option */}
        <button>
          <selectedcontent></selectedcontent>
          <span className="pick-caret" />
        </button>

        {PEOPLE.map((p) => (
          <option key={p.id} value={p.id}>
            <span className="pick-avatar" style={{ '--h': p.hue }}>
              {p.initials}
            </span>
            <span className="pick-meta">
              <span className="pick-name">{p.name}</span>
              <span className="pick-role">{p.role}</span>
            </span>
          </option>
        ))}
      </select>
    </div>
  )
}
