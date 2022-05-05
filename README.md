# OKLCH & LCH Color Picker

Color picker and converter for OKLab and Lab color space.

* [`oklch.evilmartians.io`](https://oklch.evilmartians.io/)
* [`lch.evilmartians.io`](https://lch.evilmartians.io/)

OKLab is a new way to encode colors:

* It is natively supported by [CSS Colors 4].
* Has support for P3 colors and any future monitors with new colors.
* Allow to predictably change the colors. This is very useful
  for native color transformations by `color(from …)` from [CSS Colors 5].
  * In contrast with HSL it has predictable contrast for all colors with
    the same `L`.
  * In contrast with Lab it has no hue shift in blue on chrome changes.

Additional links about OKLab:

* [The article by OKLab creator](https://bottosson.github.io/posts/oklab/)
* [Slides about OKCH in CSS](https://slides.com/ai/oklch-css)

[CSS Colors 4]: https://www.w3.org/TR/css-color-4/#resolving-oklab-oklch-values
[CSS Colors 5]: https://www.w3.org/TR/css-color-5/#relative-colors


## Development

To run a local copy for development:

1. Install [`asdf`](https://github.com/asdf-vm/asdf).
2. Install Node.js and pnpm by `asdf` or manually:

   ```sh
   asdf install
   ```

3. Install dependencies:

   ```sh
   pnpm install
   ```

4. Run local server:

   ```sh
   pnpm start
   ```
