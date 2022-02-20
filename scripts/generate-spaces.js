import { fileURLToPath } from 'url'
import { rm, mkdir } from 'fs/promises'
import { isatty } from 'tty'
import { spawn } from 'child_process'
import { join } from 'path'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const BUILD = join(ROOT, 'public', 'spaces')
const WORKER = join(ROOT, 'scripts', 'spaces-worker.js')

const IS_TTY =
  isatty(1) && process.env.TERM !== 'dumb' && !('CI' in process.env)

let progress = { l: 0, c: 0, h: 0 }
let finished = 0

let prevProgress = false

function showProgress(value) {
  if (prevProgress && IS_TTY) {
    process.stdout.write('\x1b[1G\x1b[2K\x1b[1G')
  }
  let max = process.stdout.columns - 2
  let line = Math.ceil(max * value)
  for (let i = 0; i <= line; i++) {
    process.stdout.write('#')
  }
  prevProgress = true
}

function startWorker(axis) {
  let worker = spawn('node', [WORKER, axis, BUILD])
  worker.stdout.on('data', data => {
    progress[axis] = parseFloat(data)
    showProgress((progress.l + progress.c + progress.h) / 3)
  })
  worker.stderr.on('data', data => {
    process.stderr.write(data)
  })
  worker.on('close', code => {
    if (code !== 0) {
      process.exit(code)
    } else {
      finished += 1
      if (finished === 3) {
        process.stdout.write('\n')
      }
    }
  })
}

async function build() {
  await rm(BUILD, { recursive: true, force: true })
  await mkdir(BUILD, { recursive: true })
  startWorker('l')
  startWorker('c')
  startWorker('h')
}

build().catch(e => {
  throw e
})
