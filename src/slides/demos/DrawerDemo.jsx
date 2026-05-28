import { useRef } from 'react'

/**
 * A drawer — slide-in panel, dimmed backdrop, focus trap, ESC-to-close,
 * click-outside dismiss — and it animates BOTH in and out.
 *
 * The exit is the kill shot. Sliding *in* was always easy; the reason people
 * reach for `vaul` is that animating *out* used to need JS (wait for the
 * animation to finish, THEN unmount). Now it's a native <dialog> + a CSS
 * `translate` transition: `@starting-style` handles the enter, and
 * `transition-behavior: allow-discrete` keeps it on screen long enough to
 * animate the exit. One line of JS to open it; zero dependencies.
 */
export function DrawerDemo() {
  const ref = useRef(null)

  return (
    <>
      <button className="btn" onClick={() => ref.current?.showModal()}>
        Open drawer
      </button>

      <dialog ref={ref} className="drawer">
        <h3>I slide in. I slide out.</h3>
        <p>
          Focus trapped, ESC closes me, the backdrop dims — and both the enter
          and the exit animate, in pure CSS. The part you used to install a
          library for.
        </p>
        <form method="dialog">
          <button className="btn">Close</button>
        </form>
      </dialog>
    </>
  )
}
