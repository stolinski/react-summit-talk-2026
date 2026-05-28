# Fonts

Self-hosted so the deck renders correctly offline (conference wifi is not to be
trusted).

## Newake (headings)

Drop the font file here as **`Newake.woff2`** (preferred) or **`Newake.otf`**.
The `@font-face` in `src/index.css` already points at `/fonts/Newake.woff2`
with an `.otf` fallback, so no code change is needed once the file is present.

- woff2 is ~half the size of otf and loads faster — convert with
  [fontsquirrel webfont generator](https://www.fontsquirrel.com/tools/webfont-generator)
  or `npx ttf2woff2 Newake.otf > Newake.woff2` if you only have the desktop file.
- Until the file is here, headings fall back to the system sans (font-display: swap).
