import { fileURLToPath } from 'url'
import { rm, mkdir } from 'fs/promises'
import { isatty } from 'tty'
import { spawn } from 'child_process'
import { join } from 'path'

import { L_MAX, C_MAX, H_MAX } from '../config.js'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const BUILD = join(ROOT, 'public', 'spaces')
const WORKER = join(ROOT, 'scripts', 'spaces-worker.js')

const IS_TTY =
  isatty(1) && process.env.TERM !== 'dumb' && !('CI' in process.env)

let total = L_MAX + C_MAX + H_MAX
let processed = 0
let finished = 0

let prevProgress = false

function showProgress(value) {
  if (prevProgress && IS_TTY) {
    process.stdout.write('\x1b[1G\x1b[2K\x1b[1G')
  }

  let percent = Math.floor(100 * value)
  if (percent >= 100) {
    process.stdout.write('100% ')
  } else {
    process.stdout.write(String(percent).padStart(3))
    process.stdout.write('% ')
  }

  let max = process.stdout.columns - 2 - 5
  let line = Math.ceil(max * value)
  for (let i = 0; i <= line; i++) {
    process.stdout.write('#')
  }
  prevProgress = true
}

let started = 0

function startWorker(axis, from, to) {
  started += 1
  let worker = spawn('node', [WORKER, axis, from, to, BUILD])
  worker.stdout.on('data', () => {
    processed += 1
    showProgress(processed / total)
  })
  worker.stderr.on('data', data => {
    process.stderr.write(data)
  })
  worker.on('close', code => {
    if (code !== 0) {
      process.exit(code)
    } else {
      finished += 1
      if (finished === started) {
        process.stdout.write('\n')
      }
    }
  })
}

function part(all, parts, number) {
  if (number === 1) {
    return [0, (number * all) / parts]
  } else {
    return [((number - 1) * all) / parts + 1, (number * all) / parts]
  }
}

async function build() {
  showProgress(0)
  await rm(BUILD, { recursive: true, force: true })
  await mkdir(BUILD, { recursive: true })
  startWorker('l', ...part(L_MAX, 2, 1))
  startWorker('l', ...part(L_MAX, 2, 2))
  startWorker('c', ...part(C_MAX, 2, 1))
  startWorker('c', ...part(C_MAX, 2, 2))
  startWorker('h', ...part(H_MAX, 4, 1))
  startWorker('h', ...part(H_MAX, 4, 2))
  startWorker('h', ...part(H_MAX, 4, 3))
  startWorker('h', ...part(H_MAX, 4, 4))
}

build().catch(e => {
  throw e
})
