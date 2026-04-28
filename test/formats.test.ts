import './set-globals.ts'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { setCurrent } from '../stores/current.ts'
import { formats } from '../stores/formats.ts'

function formatsFor(input: string): Record<string, string> {
  setCurrent(input)
  return formats.get()
}

test('formats for opaque sRGB primaries', () => {
  deepStrictEqual(formatsFor('#ff0000'), {
    'figmaP3': 'Figma P3 #ea3323ff',
    'hex': '#ff0000',
    'hex/rgba': '#ff0000',
    'hsl': 'hsl(0 100% 50%)',
    'lab': 'lab(54.3 80.81 69.88)',
    'lch': 'lch(54.3 106.83 40.85)',
    'lrgb': 'Linear RGB vec(1.00021, 0, 0.00002, 1)',
    'numbers': '0.63, 0.26, 29.23',
    'oklab': 'oklab(0.63 0.22 0.13)',
    'p3': 'color(display-p3 0.9176 0.2003 0.1387)',
    'rgb': 'rgb(255, 0, 0)'
  })

  deepStrictEqual(formatsFor('#00ff00'), {
    'figmaP3': 'Figma P3 #75fb4cff',
    'hex': '#00ff00',
    'hex/rgba': '#00ff00',
    'hsl': 'hsl(120 100% 50%)',
    'lab': 'lab(87.82 -79.27 80.99)',
    'lch': 'lch(87.82 113.33 134.38)',
    'lrgb': 'Linear RGB vec(0, 1, 0, 1)',
    'numbers': '0.87, 0.29, 142.5',
    'oklab': 'oklab(0.87 -0.23 0.18)',
    'p3': 'color(display-p3 0.4584 0.9853 0.2983)',
    'rgb': 'rgb(0, 255, 0)'
  })

  deepStrictEqual(formatsFor('#0000ff'), {
    'figmaP3': 'Figma P3 #0000f5ff',
    'hex': '#0000ff',
    'hex/rgba': '#0000ff',
    'hsl': 'hsl(240 100% 50%)',
    'lab': 'lab(29.57 68.29 -112.03)',
    'lch': 'lch(29.57 131.2 301.36)',
    'lrgb': 'Linear RGB vec(0, 0, 1, 1)',
    'numbers': '0.45, 0.31, 264.05',
    'oklab': 'oklab(0.45 -0.03 -0.31)',
    'p3': 'color(display-p3 0 0 0.9596)',
    'rgb': 'rgb(0, 0, 255)'
  })
})

test('formats for white, black, gray', () => {
  deepStrictEqual(formatsFor('#ffffff'), {
    'figmaP3': 'Figma P3 #ffffffff',
    'hex': '#ffffff',
    'hex/rgba': '#ffffff',
    'hsl': 'hsl(0 0% 100%)',
    'lab': 'lab(100 0 0)',
    'lch': 'lch(100 0 none)',
    'lrgb': 'Linear RGB vec(1, 1, 1, 1)',
    'numbers': '1, 0, 0',
    'oklab': 'oklab(1 0 0)',
    'p3': 'color(display-p3 1 1 1)',
    'rgb': 'rgb(255, 255, 255)'
  })

  deepStrictEqual(formatsFor('#000000'), {
    'figmaP3': 'Figma P3 #000000ff',
    'hex': '#000000',
    'hex/rgba': '#000000',
    'hsl': 'hsl(0 0% 0%)',
    'lab': 'lab(0 0 0)',
    'lch': 'lch(0 0 none)',
    'lrgb': 'Linear RGB vec(0, 0, 0, 1)',
    'numbers': '0, 0, 0',
    'oklab': 'oklab(0 0 0)',
    'p3': 'color(display-p3 0 0 0)',
    'rgb': 'rgb(0, 0, 0)'
  })

  deepStrictEqual(formatsFor('#808080'), {
    'figmaP3': 'Figma P3 #808080ff',
    'hex': '#808080',
    'hex/rgba': '#808080',
    'hsl': 'hsl(0 0% 50.2%)',
    'lab': 'lab(53.59 0 0)',
    'lch': 'lch(53.59 0 none)',
    'lrgb': 'Linear RGB vec(0.21589, 0.21589, 0.21589, 1)',
    'numbers': '0.6, 0, 0',
    'oklab': 'oklab(0.6 0 0)',
    'p3': 'color(display-p3 0.502 0.502 0.502)',
    'rgb': 'rgb(128, 128, 128)'
  })
})

test('formats for sRGB colors with alpha', () => {
  deepStrictEqual(formatsFor('#ff000080'), {
    'figmaP3': 'Figma P3 #ea332380',
    'hex': '#ff000080',
    'hex/rgba': 'rgba(255, 0, 0, 0.502)',
    'hsl': 'hsl(0 100% 50% / 0.502)',
    'lab': 'lab(54.3 80.81 69.88 / 0.502)',
    'lch': 'lch(54.3 106.83 40.85 / 0.502)',
    'lrgb': 'Linear RGB vec(1.00021, 0, 0.00002, 0.502)',
    'numbers': '0.63, 0.26, 29.23, 0.5',
    'oklab': 'oklab(0.63 0.22 0.13 / 0.502)',
    'p3': 'color(display-p3 0.9176 0.2003 0.1387 / 0.502)',
    'rgb': 'rgba(255, 0, 0, 0.502)'
  })

  deepStrictEqual(formatsFor('#00000040'), {
    'figmaP3': 'Figma P3 #00000040',
    'hex': '#00000040',
    'hex/rgba': 'rgba(0, 0, 0, 0.251)',
    'hsl': 'hsl(0 0% 0% / 0.251)',
    'lab': 'lab(0 0 0 / 0.251)',
    'lch': 'lch(0 0 none / 0.251)',
    'lrgb': 'Linear RGB vec(0, 0, 0, 0.251)',
    'numbers': '0, 0, 0, 0.25',
    'oklab': 'oklab(0 0 0 / 0.251)',
    'p3': 'color(display-p3 0 0 0 / 0.251)',
    'rgb': 'rgba(0, 0, 0, 0.251)'
  })
})

test('formats for secondary primaries (cyan, magenta, yellow)', () => {
  deepStrictEqual(formatsFor('#00ffff'), {
    'figmaP3': 'Figma P3 #75fbfdff',
    'hex': '#00ffff',
    'hex/rgba': '#00ffff',
    'hsl': 'hsl(180 100% 50%)',
    'lab': 'lab(90.67 -50.66 -14.96)',
    'lch': 'lch(90.67 52.82 196.45)',
    'lrgb': 'Linear RGB vec(0, 1, 1, 1)',
    'numbers': '0.91, 0.15, 194.77',
    'oklab': 'oklab(0.91 -0.15 -0.04)',
    'p3': 'color(display-p3 0.4584 0.9853 0.9925)',
    'rgb': 'rgb(0, 255, 255)'
  })

  deepStrictEqual(formatsFor('#ff00ff'), {
    'figmaP3': 'Figma P3 #ea33f7ff',
    'hex': '#ff00ff',
    'hex/rgba': '#ff00ff',
    'hsl': 'hsl(300 100% 50%)',
    'lab': 'lab(60.17 93.54 -60.51)',
    'lch': 'lch(60.17 111.41 327.1)',
    'lrgb': 'Linear RGB vec(1.00005, 0.00001, 1.00019, 1)',
    'numbers': '0.7, 0.32, 328.36',
    'oklab': 'oklab(0.7 0.27 -0.17)',
    'p3': 'color(display-p3 0.9175 0.2003 0.9676)',
    'rgb': 'rgb(255, 0, 255)'
  })

  deepStrictEqual(formatsFor('#ffff00'), {
    'figmaP3': 'Figma P3 #ffff54ff',
    'hex': '#ffff00',
    'hex/rgba': '#ffff00',
    'hsl': 'hsl(60 100% 50%)',
    'lab': 'lab(97.61 -15.75 93.39)',
    'lch': 'lch(97.61 94.71 99.57)',
    'lrgb': 'Linear RGB vec(1.00003, 1.00006, 0.00003, 1)',
    'numbers': '0.97, 0.21, 109.77',
    'oklab': 'oklab(0.97 -0.07 0.2)',
    'p3': 'color(display-p3 1 1 0.331)',
    'rgb': 'rgb(255, 255, 0)'
  })
})

test('formats for near-edge sRGB (#010101, #fefefe)', () => {
  deepStrictEqual(formatsFor('#010101'), {
    'figmaP3': 'Figma P3 #010101ff',
    'hex': '#010101',
    'hex/rgba': '#010101',
    'hsl': 'hsl(0 0% 0.39%)',
    'lab': 'lab(0.27 0 0)',
    'lch': 'lch(0.27 0 none)',
    'lrgb': 'Linear RGB vec(0.0003, 0.0003, 0.0003, 1)',
    'numbers': '0.07, 0, 0',
    'oklab': 'oklab(0.07 0 0)',
    'p3': 'color(display-p3 0.0039 0.0039 0.0039)',
    'rgb': 'rgb(1, 1, 1)'
  })

  deepStrictEqual(formatsFor('#fefefe'), {
    'figmaP3': 'Figma P3 #fefefeff',
    'hex': '#fefefe',
    'hex/rgba': '#fefefe',
    'hsl': 'hsl(0 0% 99.6%)',
    'lab': 'lab(99.65 0 0)',
    'lch': 'lch(99.65 0 none)',
    'lrgb': 'Linear RGB vec(0.99103, 0.99103, 0.99103, 1)',
    'numbers': '1, 0, 0',
    'oklab': 'oklab(1 0 0)',
    'p3': 'color(display-p3 0.996 0.996 0.996)',
    'rgb': 'rgb(254, 254, 254)'
  })
})

test('formats for achromatic grays (dark, mid, light)', () => {
  deepStrictEqual(formatsFor('#404040'), {
    'figmaP3': 'Figma P3 #404040ff',
    'hex': '#404040',
    'hex/rgba': '#404040',
    'hsl': 'hsl(0 0% 25.1%)',
    'lab': 'lab(27.09 0 0)',
    'lch': 'lch(27.09 0 none)',
    'lrgb': 'Linear RGB vec(0.05127, 0.05127, 0.05127, 1)',
    'numbers': '0.37, 0, 0',
    'oklab': 'oklab(0.37 0 0)',
    'p3': 'color(display-p3 0.251 0.251 0.251)',
    'rgb': 'rgb(64, 64, 64)'
  })

  deepStrictEqual(formatsFor('#c0c0c0'), {
    'figmaP3': 'Figma P3 #c0c0c0ff',
    'hex': '#c0c0c0',
    'hex/rgba': '#c0c0c0',
    'hsl': 'hsl(0 0% 75.29%)',
    'lab': 'lab(77.7 0 0)',
    'lch': 'lch(77.7 0 none)',
    'lrgb': 'Linear RGB vec(0.52712, 0.52712, 0.52712, 1)',
    'numbers': '0.81, 0, 0',
    'oklab': 'oklab(0.81 0 0)',
    'p3': 'color(display-p3 0.7529 0.7529 0.7529)',
    'rgb': 'rgb(192, 192, 192)'
  })
})

test('formats for near-zero and near-full alpha', () => {
  deepStrictEqual(formatsFor('#ff000001'), {
    'figmaP3': 'Figma P3 #ea332301',
    'hex': '#ff000001',
    'hex/rgba': 'rgba(255, 0, 0, 0.004)',
    'hsl': 'hsl(0 100% 50% / 0.004)',
    'lab': 'lab(54.3 80.81 69.88 / 0.004)',
    'lch': 'lch(54.3 106.83 40.85 / 0.004)',
    'lrgb': 'Linear RGB vec(1.00021, 0, 0.00002, 0.004)',
    'numbers': '0.63, 0.26, 29.23, 0',
    'oklab': 'oklab(0.63 0.22 0.13 / 0.004)',
    'p3': 'color(display-p3 0.9176 0.2003 0.1387 / 0.004)',
    'rgb': 'rgba(255, 0, 0, 0.004)'
  })

  deepStrictEqual(formatsFor('#ff0000fe'), {
    'figmaP3': 'Figma P3 #ea3323fe',
    'hex': '#ff0000fe',
    'hex/rgba': 'rgba(255, 0, 0, 0.996)',
    'hsl': 'hsl(0 100% 50% / 0.996)',
    'lab': 'lab(54.3 80.81 69.88 / 0.996)',
    'lch': 'lch(54.3 106.83 40.85 / 0.996)',
    'lrgb': 'Linear RGB vec(1.00021, 0, 0.00002, 0.996)',
    'numbers': '0.63, 0.26, 29.23, 1',
    'oklab': 'oklab(0.63 0.22 0.13 / 0.996)',
    'p3': 'color(display-p3 0.9176 0.2003 0.1387 / 0.996)',
    'rgb': 'rgba(255, 0, 0, 0.996)'
  })
})

test('formats for OKLCH corner L=0 (pure black)', () => {
  deepStrictEqual(formatsFor('oklch(0 0 0)'), {
    'figmaP3': 'Figma P3 #000000ff',
    'hex': '#000000',
    'hex/rgba': '#000000',
    'hsl': 'hsl(0 0% 0%)',
    'lab': 'lab(0 0 0)',
    'lch': 'lch(0 0 none)',
    'lrgb': 'Linear RGB vec(0, 0, 0, 1)',
    'numbers': '0, 0, 0',
    'oklab': 'oklab(0 0 0)',
    'p3': 'color(display-p3 0 0 0)',
    'rgb': 'rgb(0, 0, 0)'
  })
})

test('formats for OKLCH corner L=1 with chroma (beyond-white)', () => {
  deepStrictEqual(formatsFor('oklch(1 0.1 180)'), {
    'figmaP3': 'Figma P3 #c7ffffff',
    'hex': '#ffffff',
    'hex/rgba': '#ffffff',
    'hsl': 'hsl(0 0% 100%)',
    'lab': 'lab(101.26 -34.49 -0.29)',
    'lch': 'lch(101.26 34.49 180.48)',
    'lrgb': 'Linear RGB vec(0.43462, 1.2192, 1.02422, 1)',
    'numbers': '1, 0.1, 180',
    'oklab': 'oklab(1 -0.1 0)',
    'p3': 'color(display-p3 0.7821 1.0806 1.0123)',
    'rgb': 'rgb(255, 255, 255)'
  })
})

test('formats for very low L with non-zero C (spike region)', () => {
  deepStrictEqual(formatsFor('oklch(0.02 0.05 0)'), {
    'figmaP3': 'Figma P3 #010000ff',
    'hex': '#000000',
    'hex/rgba': '#000000',
    'hsl': 'hsl(0 0% 0%)',
    'lab': 'lab(0 0.31 0.01)',
    'lch': 'lch(0 0.31 1.15)',
    'lrgb': 'Linear RGB vec(0.00025, -0.00007, 0, 1)',
    'numbers': '0.02, 0.05, 0',
    'oklab': 'oklab(0.02 0.05 0)',
    'p3': 'color(display-p3 0.0025 -0.0008 0)',
    'rgb': 'rgb(0, 0, 0)'
  })
})

test('formats for P3-only color', () => {
  deepStrictEqual(formatsFor('oklch(0.7 0.3 140)'), {
    'figmaP3': 'Figma P3 #45c200ff',
    'hex': '#14c000',
    'hex/rgba': '#14c000',
    'hsl': 'hsl(113.65 100% 37.7%)',
    'lab': 'lab(68.32 -76.09 119.41)',
    'lch': 'lch(68.32 141.6 122.51)',
    'lrgb': 'Linear RGB vec(-0.04709, 0.55678, -0.07598, 1)',
    'numbers': '0.7, 0.3, 140',
    'oklab': 'oklab(0.7 -0.23 0.19)',
    'p3': 'color(display-p3 0.272 0.7591 -0.1886)',
    'rgb': 'rgb(20, 192, 0)'
  })
})

test('formats for Rec2020-only color', () => {
  deepStrictEqual(formatsFor('oklch(0.7 0.4 140)'), {
    'figmaP3': 'Figma P3 #00ca00ff',
    'hex': '#14c000',
    'hex/rgba': '#14c000',
    'hsl': 'hsl(113.66 100% 37.7%)',
    'lab': 'lab(69.09 -101.31 218.07)',
    'lch': 'lch(69.09 240.46 114.92)',
    'lrgb': 'Linear RGB vec(-0.16037, 0.61325, -0.15366, 1)',
    'numbers': '0.7, 0.4, 140',
    'oklab': 'oklab(0.7 -0.31 0.26)',
    'p3': 'color(display-p3 -0.1642 0.7903 -0.3462)',
    'rgb': 'rgb(20, 192, 0)'
  })
})

test('formats for out-of-gamut color', () => {
  deepStrictEqual(formatsFor('oklch(0.5 0.5 30)'), {
    'figmaP3': 'Figma P3 #ff0000ff',
    'hex': '#c30000',
    'hex/rgba': '#c30000',
    'hsl': 'hsl(0 100% 38.3%)',
    'lab': 'lab(36.13 162.38 153.26)',
    'lch': 'lch(36.13 223.29 43.35)',
    'lrgb': 'Linear RGB vec(1.27928, -0.26564, -0.05632, 1)',
    'numbers': '0.5, 0.5, 30',
    'oklab': 'oklab(0.5 0.43 0.25)',
    'p3': 'color(display-p3 1.0022 -0.5003 -0.2444)',
    'rgb': 'rgb(195, 0, 0)'
  })
})
