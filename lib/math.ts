enum Priority {
  Low = 1,
  High = 2
}
let DefaultValue = 0

type Operators = typeof operators
let operators = {
  '+': Priority.Low,
  '-': Priority.Low,
  '*': Priority.High,
  '/': Priority.High
}

let operations = {
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => b - a,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => b / a
}

export function parseValue(n: number | string): number {
  if (typeof n === 'number') return n
  let parsedValue = parseFloat(n)
  return isNaN(parsedValue) ? DefaultValue : parsedValue
}

function toPostfix(str: string): string[] {
  let stack: string[] = []
  let result: string[] = []

  for (let i = 0; i < str.length; i++) {
    let current = str.charAt(i)

    if (current in operators) {
      if (stack.length === 0) {
        stack.push(current)
        continue
      }

      let topElement = stack[stack.length - 1] as keyof Operators
      let currentPicked = current as keyof Operators

      while (operators[topElement] <= operators[currentPicked]) {
        result.push(stack.pop()!)
      }
      stack.push(current)
    } else {
      let isContinuedNumber = /^[\d.]+$/.test(str.charAt(i - 1))

      if (i > 0 && isContinuedNumber) {
        let last = result.length - 1
        result[last] = result[last].concat(current)
      } else {
        result.push(current)
      }
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop()!)
  }

  return result
}

export function computeExpression(str: string): number {
  if (!/[*+-/]/.test(str)) return parseValue(str)

  let postfixOfExpression = toPostfix(str)
  let stack: number[] = []

  for (let ch of postfixOfExpression) {
    if (ch in operations) {
      let callback = operations[ch as keyof Operators]
      stack.push(callback(stack.pop()!, stack.pop()!))
    } else {
      stack.push(parseValue(ch))
    }
  }

  let result = stack.pop() ?? DefaultValue

  return result
}
