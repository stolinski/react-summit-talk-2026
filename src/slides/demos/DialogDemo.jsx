import { useRef } from 'react'

/**
 * A real, live, native <dialog>. Click the button on stage and the actual
 * platform modal opens — focus trap, ESC-to-close, ::backdrop, all free.
 *
 * This is the template for every "this could have been a div" demo:
 * a tiny self-contained component using only the platform, dropped into a slide.
 */
export function DialogDemo() {
  const ref = useRef(null)

  return (
    <>
      <button className="btn" onClick={() => ref.current?.showModal()}>
        Open modal
      </button>

      <dialog ref={ref} className="native-dialog">
        <h3>I&rsquo;m a native &lt;dialog&gt;</h3>
        <p>Focus trap, ESC to close, a real backdrop — zero dependencies.</p>
        <form method="dialog">
          <button className="btn">Close</button>
        </form>
      </dialog>
    </>
  )
}
