/**
 * Minimal code block for now. Swap the guts for Shiki later if you want
 * real syntax highlighting — the rest of the app doesn't care.
 */
export function CodeBlock({ children }) {
  return (
    <pre className="code">
      <code>{children}</code>
    </pre>
  )
}
