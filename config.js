let config = {
  ALPHA_MAX: 100,
  ALPHA_STEP: 1,

  C_MAX: 0.37,
  C_MAX_REC2020: 0.47,
  C_RANDOM: 0.1,
  C_STEP: 0.01,

  COLOR_FN: '"oklch"',

  GAMUT_EPSILON: 1e-6,

  H_MAX: 360,
  H_STEP: 1,

  L_MAX: 1,
  L_MAX_COLOR: 1,
  L_STEP: 0.01
}

if (process.env.LCH) {
  config = {
    ...config,

    C_MAX: 145,
    C_MAX_REC2020: 195,
    C_RANDOM: 39,
    C_STEP: 1,

    COLOR_FN: '"lch"',

    L_MAX_COLOR: 100
  }
}

config.LCH = config.COLOR_FN !== '"oklch"'

export default config
