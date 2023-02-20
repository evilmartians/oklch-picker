let config = {
  COLOR_FN: '"oklch"',

  L_MAX: 1,
  L_STEP: 1,

  C_MAX: 0.37,
  C_MAX_REC2020: 0.47,
  C_STEP: 0.01,
  C_RANDOM: 0.1,

  H_MAX: 360,
  H_STEP: 0.45,

  ALPHA_MAX: 100,
  ALPHA_STEP: 5,

  GAMUT_EPSILON: 1e-6
}

if (process.env.LCH) {
  config = {
    ...config,
    COLOR_FN: '"lch"',
    L_MAX: 100,
    C_MAX: 145,
    C_MAX_REC2020: 195,
    C_STEP: 1,
    C_RANDOM: 39
  }
}

export default config
