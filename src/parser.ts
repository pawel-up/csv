import { readFile } from './lib/File.js'
import { CSVOptions, CSVParserOptions } from './options.js'

export interface CSVDataType {
  type: string
  format: string | null
  value?: unknown
}

export class CSVParser {
  options: CSVParserOptions
  constructor(options?: CSVOptions) {
    this.options = new CSVParserOptions(options)
  }

  async parse(input: File | string): Promise<unknown> {
    let content: string
    if (typeof input === 'string') {
      content = input
    } else {
      content = await readFile(input, this.options.encoding)
    }
    return this.parseText(content)
  }

  protected parseText(input: string): unknown {
    const lines = this.splitLines(input)
    const parsedLines: string[][] = []
    let dataTypes: CSVDataType[] = []
    let headers: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith(this.options.comment)) {
        // Skip empty lines and comments
        continue
      }
      const row = this.parseRow(line)
      if (this.options.header && !headers.length) {
        headers = row
        // Initialize data types as strings
        dataTypes = row.map(() => ({ type: 'unknown', format: null }))
      } else {
        parsedLines.push(row)
      }
    }
    const typedData = this.detectDataTypes(parsedLines, dataTypes)
    const formattedData = this.formatData(typedData, headers)

    return { data: formattedData, report: { dataTypes } }
  }

  /**
   * Splits the text into lines, handling different line endings.
   * @param text - The text to split.
   * @returns An array of lines.
   */
  protected splitLines(text: string): string[] {
    return text.split(/\r\n|\r|\n/)
  }

  /**
   * Parses a single CSV line.
   * @param line - The line to parse.
   * @returns An array of values.
   * @private
   */
  protected parseRow(line: string): string[] {
    const values = []
    let inQuote = false
    let currentValue = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === this.options.quote) {
        if (inQuote && line[i + 1] === this.options.quote) {
          currentValue += this.options.quote
          i++ // Skip the next quote (escaped quote)
        } else {
          inQuote = !inQuote
        }
      } else if (char === this.options.delimiter && !inQuote) {
        values.push(currentValue)
        currentValue = ''
      } else {
        currentValue += char
      }
    }

    values.push(currentValue)
    return values
  }

  /**
   * Detects the data types of the parsed data.
   * @param data - The parsed data.
   * @param dataTypes - The data types array to update.
   * @returns The data with detected types.
   * @private
   */
  protected detectDataTypes(data: string[][], dataTypes: CSVDataType[]): unknown[][] {
    const typedData: unknown[][] = []
    for (const row of data) {
      const typedRow: unknown[] = []
      for (let i = 0; i < row.length; i++) {
        const value = row[i].trim()
        const detectedType = this.detectDataType(value)
        typedRow.push(detectedType.value)

        if (dataTypes[i].type === 'unknown' || (dataTypes[i].type === 'number' && detectedType.type !== 'number')) {
          dataTypes[i].type = detectedType.type
          dataTypes[i].format = detectedType.format
        } else if (dataTypes[i].type === 'number' && detectedType.type === 'number') {
          if (dataTypes[i].format === 'integer' && detectedType.format === 'decimal') {
            dataTypes[i].format = 'decimal'
          }
        } else if (dataTypes[i].type === 'date' && detectedType.type === 'date') {
          if (dataTypes[i].format !== detectedType.format) {
            dataTypes[i].format = 'mixed'
          }
        }
      }
      typedData.push(typedRow)
    }
    return typedData
  }

  /**
   * Detects the data type of a single value.
   * @param value - The value to check.
   * @returns The detected type and the parsed value.
   */
  protected detectDataType(value: string | null | undefined): CSVDataType {
    if (value === null || value === undefined || value.trim() === '') {
      return { type: 'null', format: null, value: null }
    }

    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return { type: 'boolean', format: null, value: value.toLowerCase() === 'true' }
    }

    const num = Number(value)
    if (!isNaN(num)) {
      return { type: 'number', format: Number.isInteger(num) ? 'integer' : 'decimal', value: num }
    }

    for (const format of this.options.dateFormats) {
      if (this.isValidDate(value, format)) {
        return { type: 'date', format: format, value: new Date(value) }
      }
    }

    return { type: 'string', format: null, value: value }
  }

  /**
   * Checks if a value is a valid date in a specific format.
   * @param value - The value to check.
   * @param format - The date format.
   * @returns True if the value is a valid date, false otherwise.
   * @remarks This method performs basic date validation and does not account for all edge cases,
   * such as invalid leap years.
   */
  protected isValidDate(value: string, format: string): boolean {
    // Enhanced date validation
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return false
    }

    if (format === 'YYYY-MM-DD') {
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime())
    } else if (format === 'MM/DD/YYYY') {
      return /^\d{2}\/\d{2}\/\d{4}$/.test(value) && !isNaN(new Date(value).getTime())
    } else if (format === 'DD.MM.YYYY') {
      return /^\d{2}\.\d{2}\.\d{4}$/.test(value) && !isNaN(new Date(value).getTime())
    }
    return false
  }

  /**
   * Formats the data as an array of objects or arrays.
   * @param data - The data to format.
   * @param headers - The headers.
   * @returns The formatted data.
   */
  protected formatData(data: unknown[][], headers: string[]): unknown[] {
    if (!this.options.outputAsObject || !this.options.header) {
      return data
    }

    return data.map((row) => {
      const obj: Record<string, unknown> = {}
      for (let i = 0; i < row.length; i++) {
        obj[headers[i] || `column_${i + 1}`] = row[i]
      }
      return obj
    })
  }
}
