const regStore = new Map<string, RegExp>()

export interface DataType {
  /**
   * The type of the data.
   */
  type: 'null' | 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime'
  /**
   * The format of the number, if applicable.
   */
  format?: 'integer' | 'decimal'
  /**
   * Dates are returned as strings.
   */
  value: string | number | boolean | null
}

export interface DateFormats {
  /**
   * Date formats representing the `date` type.
   * @default ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']
   */
  date: string[]
  /**
   * Date formats representing the `time` data type.
   * @default ['HH:mm:ss', 'HH:mm', 'HH:mm:ss.SSS']
   */
  time: string[]
  /**
   * Date formats representing the `datetime` data type.
   * @default ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSZ']
   */
  datetime: string[]
}

export function detectDataType(value: string | null | undefined, dateFormats?: DateFormats): DataType {
  if (value === null || value === undefined) {
    return { type: 'null', value: null }
  }
  const trimmedValue = value.trim()
  if (trimmedValue === '') {
    // let's not engage in further type detection and exit early.
    return { type: 'string', value: '' }
  }
  const lowerValue = trimmedValue.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'false') {
    return { type: 'boolean', value: lowerValue === 'true' }
  }

  const num = Number(trimmedValue)
  if (!isNaN(num)) {
    return { type: 'number', format: Number.isInteger(num) ? 'integer' : 'decimal', value: num }
  }
  if (!dateFormats) {
    return { type: 'string', value: trimmedValue }
  }
  const date = new Date(trimmedValue)
  if (isNaN(date.getTime())) {
    return { type: 'string', value: trimmedValue }
  }

  for (const format of dateFormats.datetime) {
    const regex = createDateTimeRegex(format)
    if (regex.test(trimmedValue)) {
      return { type: 'datetime', value: trimmedValue }
    }
  }

  for (const format of dateFormats.date) {
    const regex = createDateTimeRegex(format)
    if (regex.test(trimmedValue)) {
      return { type: 'date', value: trimmedValue }
    }
  }

  for (const format of dateFormats.time) {
    const regex = createDateTimeRegex(format)
    if (regex.test(trimmedValue)) {
      return { type: 'time', value: trimmedValue }
    }
  }
  return { type: 'string', value: trimmedValue }
}

/**
 * Creates a regular expression for a given date/time/datetime format.
 * @param format - The date/time/datetime format string.
 * @returns A regular expression that matches the given format.
 */
export function createDateTimeRegex(format: string): RegExp {
  const existing = regStore.get(format)
  if (existing) {
    return existing
  }
  // Escape special regex characters
  const escapedFormat = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Replace format placeholders with regex patterns
  const regexString = escapedFormat
    .replace(/YYYY/g, '\\d{4}') // Year
    .replace(/MM/g, '\\d{2}') // Month
    .replace(/DD/g, '\\d{2}') // Day
    .replace(/HH/g, '\\d{2}') // Hour
    .replace(/mm/g, '\\d{2}') // Minute
    .replace(/ss/g, '\\d{2}') // Second
    .replace(/SSS/g, '\\d{3}') // Millisecond
    .replace(/Z/g, 'Z') // Timezone Z
    .replace(/T/g, 'T') // Timezone T
    .replace(/\s/g, '\\s') // Whitespace

  // Create and return the regex
  const regex = new RegExp(`^${regexString}$`)
  regStore.set(format, regex)
  return regex
}
