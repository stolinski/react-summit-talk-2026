/**
 * Scale of the whole scene lives here.
 *
 * The trick that makes it feel real: the SOLAR SYSTEM is tiny and local (sun at
 * the origin, planets within ~130 units), while the GALAXY is enormous and far
 * away (radius 6000, centered ~3600 units off). From inside the system the
 * galaxy is a luminous band across the sky (like the Milky Way from Earth);
 * pull the camera way out and the entire system shrinks to an invisible speck
 * in one of the galaxy's arms.
 */
export const SUN_POSITION = [0, 0, 0]

export const GALAXY = {
  center: [0, -140, -3600],
  radius: 6000,
}
