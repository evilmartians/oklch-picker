/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Space } from "./detectColorSpace.js"
import { GeneratorConfig } from "./generator-cfg.js"

export function makeColorShapeFileName(func: GeneratorConfig['COLOR_FN'], space: Space) {
  return `${func}-${space}.json` as const
}
