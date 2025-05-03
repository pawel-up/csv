export interface GenerateOptions {
  withHeader?: boolean
  endWithNewline?: boolean
}

export function generateCSV(rows: number, columns: number, options: GenerateOptions = {}): string {
  const { withHeader = true, endWithNewline = false } = options
  const header = withHeader ? generateHeader(columns) : ''
  const data = generateData(rows, columns)
  let result = withHeader ? `${header}\n${data}` : data
  if (endWithNewline) {
    result += '\n'
  }
  return result
}

function generateHeader(columns: number): string {
  const headerRow = Array.from({ length: columns }, (_, i) => `g_column_${i + 1}`).join(',')
  return headerRow
}

function generateData(rows: number, columns: number): string {
  const dataRows = Array.from({ length: rows }, () => {
    const row = Array.from({ length: columns }, () => generateRandomValue()).join(',')
    return row
  })
  return dataRows.join('\n')
}

function generateRandomValue(): string {
  const random = Math.random()
  if (random < 0.33) {
    return Math.floor(Math.random() * 1000).toString() // Integer
  } else if (random < 0.66) {
    return (Math.random() * 100).toFixed(2) // Decimal
  } else {
    return Math.random().toString(36).substring(2, 10) // Random string
  }
}
