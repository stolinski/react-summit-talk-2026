/**
 * Scale of the whole scene lives here.
 *
 * The solar system is TINY and absolute (sun at the origin, planets within ~130
 * units). The galaxy is staggeringly larger and farther — radius 26,000, core
 * ~16,000 units away — and the system sits inside one of its arms. So from the
 * system the galaxy is just a faint band of stars across the sky (you cannot
 * tell it's a giant spiral). Its true scale is hidden until the camera flies up
 * out of the disk and looks back: that's the wow.
 */
export const SUN_POSITION = [0, 0, 0]

export const GALAXY = {
  // Offset well off to one side so the galactic core doesn't sit next to the
  // sun in the in-system shots. The galaxy reveal slide targets this point.
  center: [8000, -900, -15000],
  radius: 26000,
}
