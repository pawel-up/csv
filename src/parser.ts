import { detectDataType, type DataType } from './lib/DataType.js'
import { readFile } from './lib/File.js'
import { CSVOptions, CSVParserOptions } from './options.js'
import type { CVSArrayParseResult, CVSObjectParseResult, FormatInfo } from './types.js'

/**
 * The `CSVParser` class provides methods for parsing CSV (Comma-Separated Values)
 * data from either a file or a string.
 * It supports automatic data type detection (string, number, boolean, date, time, datetime) and can return
 * the parsed data as either an array of arrays or an array of objects.
 *
 * **Key Features:**
 *
 * - **Flexible Input:** Parses CSV data from `File` objects (e.g., from file inputs) or strings.
 * - **Automatic Data Type Detection:** Automatically detects the data type of each cell in the CSV.
 * - **Header Row Support:** Can handle CSV files with or without a header row.
 * - **Customizable Options:** Supports various options for customizing the parsing process,
 *   such as delimiter, quote character, encoding, and date formats.
 * - **Array or Object Output:** Can return the parsed data as an array of arrays (rows and cells)
 *   or an array of objects (rows with named columns).
 * - **Handles comments:** Skips lines that start with a comment character.
 * - **Handles max rows:** Can limit the number of rows to parse.
 *
 * **Example Usage:**
 *
 * ```typescript
 * // Parsing a CSV string into an array of objects:
 * const csvString = "name,age,city\nJohn Doe,30,New York\nJane Smith,25,Los Angeles";
 * const parser = new CSVParser();
 * const result = await parser.asObject(csvString);
 * console.log(result);
 * // Output:
 * // {
 * //   format: [
 * //     { name: 'name', type: 'string', index: 0 },
 * //     { name: 'age', type: 'number', format: 'integer', index: 1 },
 * //     { name: 'city', type: 'string', index: 2 }
 * //   ],
 * //   header: ['name', 'age', 'city'],
 * //   values: [
 * //     { name: 'John Doe', age: 30, city: 'New York' },
 * //     { name: 'Jane Smith', age: 25, city: 'Los Angeles' }
 * //   ]
 * // }
 *
 * // Parsing a CSV file into an array of arrays:
 * const fileInput = document.getElementById('fileInput') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const parser = new CSVParser({ delimiter: ';', header: false });
 * const result = await parser.asArray(file);
 * console.log(result);
 * // Output:
 * // {
 * //   format: [
 * //     { name: 'column_1', type: 'string', index: 0 },
 * //     { name: 'column_2', type: 'number', format: 'integer', index: 1 },
 * //     { name: 'column_3', type: 'string', index: 2 }
 * //   ],
 * //   header: [],
 * //   values: [
 * //     ['John Doe', 30, 'New York'],
 * //     ['Jane Smith', 25, 'Los Angeles']
 * //   ]
 * // }
 * ```
 */
export class CSVParser {
  options: CSVParserOptions
  /**
   * Creates a new CSVParser instance.
   * @param options - Optional configuration options for the parser.
   *                  If not provided, default options will be used.
   */
  constructor(options?: CSVOptions) {
    this.options = new CSVParserOptions(options)
  }

  /**
   * Parses a CSV file or string and returns the data as an array of arrays.
   *
   * Each inner array represents a row in the CSV, and each element within
   * the inner array represents a cell value. The data types of the values
   * (string, number, boolean) are automatically detected.
   *
   * @param input - Either a `File` object (from a file input) or a string
   *                containing CSV data.
   * @returns A promise that resolves to a `CVSArrayParseResult` object,
   *          containing the parsed data, header information, and column formats.
   * @throws {Error} Throws an error if there is an issue reading the file or parsing the CSV data.
   */
  async asArray(input: File | string): Promise<CVSArrayParseResult> {
    const value = await this.prepare(input)
    const format = this.parse(value)
    const result: CVSArrayParseResult = {
      format: [],
      values: [],
      header: [],
    }
    this.prepareHeaderData(result, format)
    for (const item of format) {
      result.values.push(item.map((column) => column.value))
    }
    return result
  }

  /**
   * Parses a CSV file or string and returns the data as an array of objects.
   *
   * Each object in the array represents a row in the CSV. The keys of each
   * object are the column names (from the header row, if present), and the
   * values are the corresponding cell values. The data types of the values
   * (string, number, boolean) are automatically detected.
   *
   * @param input - Either a `File` object (from a file input) or a string
   *                containing CSV data.
   * @returns A promise that resolves to a `CVSObjectParseResult` object,
   *          containing the parsed data, header information, and column formats.
   * @throws {Error} Throws an error if there is an issue reading the file or parsing the CSV data.
   */
  async asObject(input: File | string): Promise<CVSObjectParseResult> {
    const value = await this.prepare(input)
    const format = this.parse(value)
    const result: CVSObjectParseResult = {
      format: [],
      values: [],
      header: [],
    }
    this.prepareHeaderData(result, format)
    for (const row of format) {
      const obj: Record<string, string | number | boolean> = {}
      const keys = new Set<string>()
      row.forEach((column, columnIndex) => {
        const name = result.header[columnIndex] || `column_${columnIndex + 1}`
        obj[name] = column.value
        keys.add(name)
      })
      for (const key of result.header) {
        if (!keys.has(key)) {
          obj[key] = ''
        }
      }
      // now we double check the headers for any missing values
      result.values.push(obj)
    }
    return result
  }

  /**
   * Prepares the header data for the parsing result.
   *
   * If the `header` option is enabled, this method extracts the first row
   * as the header and populates the `header` and `format` properties of the
   * result object.
   *
   * @param result - The parsing result object (`CVSObjectParseResult` or `CVSArrayParseResult`).
   * @param values - The parsed data, represented as an array of arrays of `DataType`.
   * @protected
   */
  protected prepareHeaderData(result: CVSObjectParseResult | CVSArrayParseResult, values: DataType[][]): void {
    if (!values.length) {
      return
    }
    let header: DataType[] = []
    if (this.options.header) {
      header = values.shift() as DataType[]
    } else {
      // we still need to populate the format but we won't change the values array
      header = values[0]
    }
    header.forEach((column, index) => {
      const name = this.options.header && column.value ? String(column.value) : `column_${index + 1}`
      if (this.options.header) {
        result.header.push(name)
      }
      // We need to compute it on the fly because the value may be empty
      const firstWithValue = values.find((row) => !!row[index])
      const type = firstWithValue ? firstWithValue[index].type : 'string'
      const format = firstWithValue ? firstWithValue[index].format : undefined
      const tmp: FormatInfo = {
        name,
        type,
        index,
      }
      if (format) {
        tmp.format = format
      }
      result.format.push(tmp)
    })
  }

  /**
   * Prepares the input for parsing.
   *
   * If the input is a `File` object, it reads the file content.
   * If the input is a string, it uses the string directly.
   *
   * @param input - Either a `File` object or a string.
   * @returns A promise that resolves to the CSV data as a string.
   * @protected
   */
  protected async prepare(input: File | string): Promise<string> {
    let content: string
    if (typeof input === 'string') {
      content = input
    } else {
      content = await readFile(input, this.options.encoding)
    }
    return content
  }

  /**
   * Parses the CSV data string into an array of arrays of `DataType`.
   *
   * This method splits the input string into lines, parses each line into
   * an array of values, and then detects the data types of each value.
   *
   * @param input - The CSV data as a string.
   * @returns An array of arrays of `DataType`, where each inner array
   *          represents a row in the CSV, and each `DataType` object
   *          represents a cell value with its detected type.
   * @protected
   */
  protected parse(input: string): DataType[][] {
    const lines = this.splitLines(input)
    const processed: string[][] = []

    for (let i = 0, len = lines.length; i < len; i++) {
      if (this.options.maxRows && i >= this.options.maxRows + 1) {
        // Skip lines after the maxRows limit
        break
      }
      const line = lines[i]
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith(this.options.comment)) {
        // Skip empty lines and comments
        continue
      }
      processed.push(this.parseRow(line))
    }
    return this.detectDataTypes(processed)
  }

  /**
   * Splits the text into lines, handling different line endings.
   * @param text - The text to split.
   * @returns An array of lines.
   * @protected
   */
  protected splitLines(text: string): string[] {
    return text.split(/\r\n|\r|\n/)
  }

  /**
   * Parses a single CSV line.
   * @param line - The line to parse.
   * @returns An array of values.
   * @protected
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
   * @returns The data with detected types.
   * @protected
   */
  protected detectDataTypes(data: string[][]): DataType[][] {
    const typedData: DataType[][] = []
    for (const row of data) {
      const typedRow: DataType[] = []
      for (const column of row) {
        const df = detectDataType(column.trim(), this.options.dateFormats)
        typedRow.push(df)
      }
      typedData.push(typedRow)
    }
    return typedData
  }
}
