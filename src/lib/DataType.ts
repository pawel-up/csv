import type { DateFormats } from '../types.js'

const regStore = new Map<string, RegExp>()

export interface DataType {
  /**
   * The type of the data.
   */
  type: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime'
  /**
   * The format of the number, if applicable.
   */
  format?: 'integer' | 'decimal'
  /**
   * Dates are returned as strings.
   */
  value: string | number | boolean
}

export function detectDataType(value: string | null | undefined, dateFormats?: DateFormats): DataType {
  if (value === null || value === undefined) {
    return { type: 'string', value: '' }
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
    const format = Number.isInteger(num) && !trimmedValue.includes('.') ? 'integer' : 'decimal'
    return { type: 'number', format, value: num }
  }
  if (!dateFormats) {
    return { type: 'string', value: trimmedValue }
  }
  // The time won't be recognized by the `Date` constructor, so we need to check for time formats first.
  for (const format of dateFormats.time) {
    const regex = createDateTimeRegex(format)
    if (regex.test(trimmedValue)) {
      return { type: 'time', value: trimmedValue }
    }
  }
  // The `DD.MM.YYYY` format is not recognized by the `Date` constructor, so we need to check for date formats first.
  for (const format of dateFormats.date) {
    const regex = createDateTimeRegex(format)
    if (regex.test(trimmedValue)) {
      return { type: 'date', value: trimmedValue }
    }
  }

  // Basically only datetime or string left
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
