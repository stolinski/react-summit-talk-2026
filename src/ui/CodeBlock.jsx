/**
 * Zero-dependency syntax highlighting — on brand for a talk about not installing
 * things. It only colors what's unambiguous across HTML/CSS/JS (comments,
 * strings, tags & at-rules, numbers); everything else stays the base color, so
 * it never mis-highlights and looks broken. Synchronous, so no flash on slide
 * change. Swap in Shiki here later if you ever want full tokenization.
 */
const TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<\/?[A-Za-z][\w-]*|@[\w-]+|>)|(\b\d+(?:\.\d+)?(?:px|rem|em|%|fr|vw|vh|dvh|deg|ms|s)?\b)/g

const CLASS = ['tok-comment', 'tok-string', 'tok-tag', 'tok-num']

export function CodeBlock({ children }) {
  const text = String(children)
  const parts = []
  let last = 0
  let key = 0
  let m

  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const group = m.slice(1).findIndex((g) => g !== undefined)
    parts.push(
      <span key={key++} className={CLASS[group]}>
        {m[0]}
      </span>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return (
    <pre className="code">
      <code>{parts}</code>
    </pre>
  )
}
