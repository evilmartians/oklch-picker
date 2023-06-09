interface StartWork<TaskData extends object, ResultData extends object> {
  (
    type: string,
    parallelTasks: number,
    prepare: (messages: undefined[]) => TaskData[],
    onResult: (result: ResultData) => void,
    onFinal: () => void
  ): void
}

const TOTAL_WORKERS = navigator.hardwareConcurrency

function anyValue<V>(map: Map<string, V>): undefined | V {
  return map.values().next().value
}

export function prepareWorkers<
  TaskData extends object,
  ResultData extends object
>(WorkerClass: ViteWorker): StartWork<TaskData, ResultData> {
  let available = new Array<ViteWorker>(TOTAL_WORKERS)
  for (let i = 0; i < available.length; i++) {
    available[i] = new WorkerClass()
  }

  let busy = new Set<string>()
  let lastPending = new Map<
    string,
    Parameters<StartWork<TaskData, ResultData>>
  >()

  function startPending(
    args: Parameters<StartWork<TaskData, ResultData>> | undefined
  ): void {
    if (!args) return
    let type = args[0]
    lastPending.delete(type)
    startWork(type, 1, args[2], args[3], args[4])
  }

  let startWork: StartWork<TaskData, ResultData> = (
    type,
    parallelTasks,
    prepare,
    onResult,
    onFinal
  ) => {
    if (busy.has(type)) {
      lastPending.set(type, [type, parallelTasks, prepare, onResult, onFinal])
      return
    }

    let started = Math.floor(TOTAL_WORKERS / parallelTasks)
    if (available.length / started > parallelTasks) started += 1
    if (started > available.length) started = available.length

    if (started === 0) {
      lastPending.set(type, [type, parallelTasks, prepare, onResult, onFinal])
      return
    }

    busy.add(type)
    let finished = 0
    let workers = available.splice(0, started)
    let messages = prepare(Array(workers.length).fill(undefined))

    for (let [i, worker] of workers.entries()) {
      worker.onmessage = e => {
        onResult(e.data)
        available.push(worker)

        finished += 1
        if (finished === started) {
          busy.delete(type)
          startPending(lastPending.get(type) ?? anyValue(lastPending))
          onFinal()
        }
      }
      worker.postMessage(messages[i])
    }
  }

  return startWork
}
