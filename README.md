# OKLCH & LCH Color Picker

Color picker and converter for Oklab and Lab color space.

* [`oklch.evilmartians.io`](https://oklch.evilmartians.io/)
* [`lch.evilmartians.io`](https://lch.evilmartians.io/)

OKLCH is a new way to encode colors (like hex, RGBA, or HSL):

- OKLCH has native browser support.
- It can encode more colors for modern screens (P3, Rec. 2020, and beyond).
- [Unlike HSL], OKLCH always has predictable contrast
  after color transformation.
- In contrast [with LCH and Lab], no [hue shift] on chroma changes.
- Provides great a11y on palette generation.

Additional links about Oklab:

* [The article by Oklab creator](https://bottosson.github.io/posts/oklab/)
* [Slides about OKCH in CSS](https://slides.com/ai/oklch-css)

[Unlike HSL]: https://wildbit.com/blog/accessible-palette-stop-using-hsl-for-color-systems
[with LCH and Lab]: https://bottosson.github.io/posts/oklab/#blending-colors
[hue shift]: https://lch.evilmartians.io/#35,55,297,100


## Development

To run a local copy for development:

1. Install correct versions of `Node.js` and `pnpm`. There are two ways:
	1. With `asdf` version manager:
		1. Install [`asdf`](https://github.com/asdf-vm/asdf) and asdf plugins for `Node.js` and `pnpm`
		2. Run `asdf install`
	2. Manually (check needed versions in `.tool-versions`)

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Run local server:

   ```sh
   pnpm start
   ```

We recommend to install Prettier and EditorConfig plugins to your text editor.
