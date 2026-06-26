# OKLCH & LCH Color Picker

Color picker and converter for OKLCH and LCH color space.

- [`oklch.com`](https://oklch.com)
- [`lch.oklch.com`](https://lch.oklch.com)

OKLCH is a new way to encode colors (like hex, RGBA, or HSL):

- OKLCH has native browser support.
- It can encode more colors for modern screens (P3, Rec. 2020, and beyond).
- [Unlike HSL], OKLCH always has predictable contrast
  after color transformation.
- In contrast [with LCH and Lab], no [hue shift] on chroma changes.
- Provides great accessibility on palette generation.

Additional links about Oklab and OKLCH:

- [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [The article by Oklab creator](https://bottosson.github.io/posts/oklab/)

[Unlike HSL]: https://wildbit.com/blog/accessible-palette-stop-using-hsl-for-color-systems
[with LCH and Lab]: https://bottosson.github.io/posts/oklab/#blending-colors
[hue shift]: https://lch.oklch.com/#35,55,297,100

## Development

To run a local copy for development:

1. Use Dev Container which is coming with right Node.js and `pnpm` (or install them manually).
2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Run local server:

   ```sh
   pnpm start
   ```
