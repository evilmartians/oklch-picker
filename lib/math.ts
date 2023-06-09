enum Priority {
  High = 2,
  Low = 1
}

const OPERATORS = {
  '-': Priority.Low,
  '*': Priority.High,
  '/': Priority.High,
  '+': Priority.Low
}

type Operator = keyof typeof OPERATORS

const OPERATIONS = {
  '-': (a: number, b: number) => b - a,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => b / a,
  '+': (a: number, b: number) => a + b
}

const OPERATORS_PATTERN = /[*+-/]/

export function parseValue(n: number | string): number {
  if (typeof n === 'number') return n
  let parsedValue = parseFloat(n)
  return isNaN(parsedValue) ? 0 : parsedValue
}

function checkPriority(a: Operator, b: Operator): boolean {
  return OPERATORS[a] <= OPERATORS[b]
}

function toPostfix(str: string): string[] {
  let stack: string[] = []
  let result: string[] = []

  for (let i = 0; i < str.length; i++) {
    let current = str.charAt(i)

    if (current in OPERATORS) {
      if (stack.length === 0) {
        stack.push(current)
        continue
      }

      let topElement = stack[stack.length - 1] as Operator
      let currentPicked = current as Operator

      while (stack.length > 0 && checkPriority(topElement, currentPicked)) {
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
  let firstCh = str.charAt(0)

  if (!OPERATORS_PATTERN.test(str) || OPERATORS_PATTERN.test(firstCh)) {
    return parseValue(str)
  }

  let postfixOfExpression = toPostfix(str)
  let stack: number[] = []

  for (let ch of postfixOfExpression) {
    if (ch in OPERATIONS) {
      let callback = OPERATIONS[ch as Operator]
      stack.push(callback(stack.pop()!, stack.pop()!))
    } else {
      stack.push(parseValue(ch))
    }
  }

  let result = stack.pop() ?? 0

  return result
}

export function cycleByWheel(value: number, max: number): number {
  if (value > 0 && value <= max) {
    return value
  }

  let remainder = value % max

  if (remainder > 0) {
    return remainder
  }

  return max - Math.abs(remainder)
}
