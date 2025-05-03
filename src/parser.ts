import { detectDataType, type DataType } from './lib/DataType.js'
import { readFile } from './lib/File.js'
import { CSVOptions, CSVParserOptions } from './options.js'
import type { ParseResult, FormatInfo } from './types.js'

/**
 * The `CSVParser` class provides methods for parsing CSV (Comma-Separated Values)
 * data from either a file or a string.
 *
 * It offers both one-time parsing via the `parse` method and streaming parsing
 * for large files using the `stream` method. The parser automatically detects
 * data types (string, number, boolean, date, time, datetime) and can return
 * the parsed data as an array of arrays.  A utility method `toObject` is provided
 * to transform the array of arrays into an array of objects, using header row
 * values as keys.
 *
 * **Key Features:**
 *
 * - **Flexible Input:** Parses CSV data from `File` objects (e.g., from file inputs) or strings.
 * - **Streaming Support:**  Handles large files efficiently with the `stream` method,
 *   processing data in chunks.
 * - **Automatic Data Type Detection:** Automatically infers the data type of each cell.
 * - **Header Row Support:**  Parses files with or without a header row.  When a header
 *   is present, it's used for column names in the object representation.
 * - **Customizable Options:**  Allows customization of the parsing process through options
 *   such as delimiter, quote character, comment character, encoding, date formats, and
 *   maximum rows to parse.
 * - **Comment Handling:** Skips lines starting with a designated comment character.
 * - **Row Limiting:**  Limits the number of rows parsed using the `maxRows` option.
 * - **Object Conversion:** Provides a static `toObject` method to convert the parsed
 *   array data into a more convenient array of objects, using header values as keys.
 *
 * **Basic Usage:**
 *
 * ```typescript
 * import { CSVParser } from '@pawel-up/csv';
 *
 * // 1. Parsing from a string:
 * const csvString = `Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles`;
 * const parser = new CSVParser();
 * const result = await parser.parse(csvString);
 * console.log(result.values);
 * // Output:  [['John Doe', 30, 'New York'], ['Jane Smith', 25, 'Los Angeles']]
 * console.log(CSVParser.toObject(result));
 * // Output:  [{ Name: 'John Doe', Age: 30, City: 'New York' }, { Name: 'Jane Smith', Age: 25, City: 'Los Angeles' }]
 *
 * // 2. Parsing from a file (in a browser environment):
 * const fileInput = document.getElementById('fileInput') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const fileParser = new CSVParser({ delimiter: ';', header: false });
 * const fileResult = await fileParser.parse(file);
 * console.log(fileResult);
 * // Output (example):
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
 *
 * // 3. Streaming from a ReadableStream:
 * const response = await fetch('large_data.csv');
 * const stream = response.body;
 * if (stream) {
 *   const streamParser = new CSVParser();
 *   const parsedStream = await streamParser.stream(stream.pipeThrough(new TextDecoderStream()));
 *   const reader = parsedStream.getReader();
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     console.log('Chunk:', value.values);
 *   }
 * }
 * ```
 *
 * **Note:**  When using `stream`, the `toObject` method is not directly applicable
 * to the streamed chunks. You would typically process each chunk's `values` as
 * they arrive or accumulate them for a final `toObject` conversion after the stream
 * completes.
 */
export class CSVParser {
  options: CSVParserOptions

  protected result: ParseResult
  private controller: TransformStreamDefaultController | undefined
  private buffer = ''
  private formatInitialized = false

  /**
   * Creates a new CSVParser instance.
   * @param options - Optional configuration options for the parser.
   *                  If not provided, default options will be used.
   */
  constructor(options?: CSVOptions) {
    this.options = new CSVParserOptions(options)
    this.result = {
      format: [],
      values: [],
      header: [],
    }
  }

  protected reset(): void {
    this.result = {
      format: [],
      values: [],
      header: [],
    }
    this.buffer = ''
    this.formatInitialized = false
    this.controller = undefined
  }

  /**
   * Initiates streaming parsing of CSV data from a ReadableStream.
   *
   * This method takes a ReadableStream of strings as input and returns a
   * ReadableStream of `ParseResult` objects.  The input stream should
   * represent the CSV data, typically encoded as UTF-8.  The output stream
   * emits `ParseResult` objects, each containing a chunk of parsed data,
   * incrementally as the input stream is processed.
   *
   * @param input - A ReadableStream<string> representing the CSV data.
   * @returns A Promise that resolves to a ReadableStream<ParseResult>,
   *          emitting chunks of parsed data.
   */
  stream(input: ReadableStream<string>): ReadableStream<ParseResult> {
    this.reset()

    const transformStream = new TransformStream<string, ParseResult>({
      transform: (chunk, controller) => this.handleChunk(chunk, controller),
      flush: (controller) => this.handleFlush(controller),
    })

    return input.pipeThrough(transformStream)
  }

  /**
   * Initiates streaming parsing of CSV data from a File object.
   *
   * This method takes a File object as input, reads its content as a
   * ReadableStream of strings (assuming UTF-8 encoding), and then
   * performs streaming parsing as with the `stream` method.
   *
   * @param file - A File object representing the CSV file.
   * @returns A Promise that resolves to a ReadableStream<ParseResult>,
   *          emitting chunks of parsed data.
   */
  streamFile(file: File): ReadableStream<ParseResult> {
    const stream = file.stream()
    const decodedStream = stream.pipeThrough(new TextDecoderStream(this.options.encoding))
    return this.stream(decodedStream)
  }

  /**
   * Handles a chunk of data from the input stream.
   *
   * This internal method is called by the TransformStream for each chunk of
   * string data received from the input stream. It appends the chunk to an
   * internal buffer and then triggers the `processBuffer` method to parse
   * the buffered data.
   *
   * @param chunk - A string representing a chunk of CSV data.
   * @param controller - The TransformStreamDefaultController for managing
   *                     the output stream.
   * @returns A Promise that resolves when the chunk has been processed.
   */
  protected async handleChunk(chunk: string, controller: TransformStreamDefaultController<ParseResult>): Promise<void> {
    this.controller = controller
    this.buffer += chunk
    await this.processBuffer()
  }

  /**
   * Handles the end of the input stream.
   *
   * This internal method is called by the TransformStream when the input
   * stream has been fully consumed. It ensures that any remaining data in
   * the buffer is processed by calling `processBuffer` with the `flush` flag
   * set to true.  After processing, if any parsed data is available, it is
   * enqueued to the output stream.
   *
   * @param controller - The TransformStreamDefaultController for managing
   *                     the output stream.
   * @returns A Promise that resolves when the flush operation is complete.
   */
  protected async handleFlush(controller: TransformStreamDefaultController<ParseResult>): Promise<void> {
    this.controller = controller
    if (this.buffer.length > 0) {
      await this.processBuffer(true)
    }
  }

  /**
   * Reads the input string until the last newline character.
   * @param input - The input string to read from.
   * @returns A tuple containing the processed string and the remaining string.
   *          The processed string is everything before the last newline,
   *          and the remaining string is everything after the last newline.
   *          If no newline is found, the first element of the tuple is null.
   * @protected
   */
  protected readUntilLastNewline(input: string): [null | string, string] {
    for (let i = input.length - 1; i >= 0; i--) {
      // the first check for `\n` also handles the `\r\n` case.
      if (input[i] === '\n' || input[i] === '\r') {
        return [input.substring(0, i), input.substring(i + 1)]
      }
    }
    return [null, input]
  }

  /**
   * Processes the buffered CSV data.
   *
   * This internal method is the core of the streaming parser. It splits the
   * buffered data into lines, parses each line into rows of values, detects
   * data types, and updates the parsing result.
   *
   * The `flush` parameter indicates whether this is the final processing
   * call at the end of the stream.  If `flush` is false, the last line in the
   * buffer is retained, as it might be incomplete.
   *
   * @param flush - A boolean indicating whether this is the final
   *                processing call. Defaults to false.
   * @returns A Promise that resolves when the buffer has been processed.
   */
  protected async processBuffer(flush = false): Promise<void> {
    // The following makes sure the parser only emits full lines
    // and not partial lines. We read everything in the buffer until the last
    // new line and keep the rest in the buffer.
    let toProcess: string | null = null
    if (flush) {
      // we need to process everything in the buffer
      toProcess = this.buffer
      this.buffer = ''
    } else {
      const [processable, remaining] = this.readUntilLastNewline(this.buffer)
      if (!processable) {
        // no new line found, we can just return
        return
      }
      this.buffer = remaining // keep it for the next chunk
      toProcess = processable // this is our processable data
    }
    // at this point we can be sure we only have full lines in the `toProcess`
    const lines = this.splitLines(toProcess)

    const rows: DataType[][] = []
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith(this.options.comment)) {
        continue // Skip empty lines and comments
      }

      const row = this.parseRow(line)
      if (row.length === 0) continue
      rows.push(this.detectDataTypes([row])[0])
    }

    if (rows.length > 0) {
      if (!this.formatInitialized) {
        this.prepareHeaderData(rows)
        this.formatInitialized = true
      } else {
        this.updateFormat(rows)
      }

      this.result.values.push(...rows.map((row) => row.map((cell) => cell.value)))

      if (this.controller) {
        this.controller.enqueue({ ...this.result })
        if (this.options.maxRows && this.result.values.length >= this.options.maxRows) {
          this.controller.terminate()
          this.buffer = ''
          return
        }
      }
    }
  }

  /**
   * Updates the format information with new rows.
   *
   * This internal method is used during streaming parsing to dynamically
   * update the column format information as new data arrives. It handles
   * cases where new columns are encountered or where the data type of a
   * column changes from string to a more specific type (number, boolean, etc.)
   * based on the data in subsequent rows.
   *
   * @param result - The current parsing result object.
   * @param newRows - An array of `DataType[][]` representing the newly
   *                  processed rows.
   */
  protected updateFormat(newRows: DataType[][]): void {
    newRows.forEach((row) => {
      row.forEach((cell, index) => {
        if (index >= this.result.format.length) {
          const name = `column_${index + 1}`
          this.result.format.push({ name, type: cell.type, format: cell.format, index })
        } else if (this.result.format[index].type === 'string' && cell.type !== 'string') {
          this.result.format[index].type = cell.type
          this.result.format[index].format = cell.format
        }
      })
    })
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
   * @returns A promise that resolves to a `ParseResult` object,
   *          containing the parsed data, header information, and column formats.
   * @throws {Error} Throws an error if there is an issue reading the file or parsing the CSV data.
   */
  async parse(input: File | string): Promise<ParseResult> {
    this.reset()
    const value = await this.normalize(input)
    const format = this.parseInput(value)
    this.prepareHeaderData(format)
    for (const row of format) {
      const keys = new Set<string>()
      const values: (string | number | boolean)[] = []
      row.forEach((column, columnIndex) => {
        const name = this.result.header[columnIndex] || `column_${columnIndex + 1}`
        values.push(column.value)
        keys.add(name)
      })
      // now we double check the headers for any missing values
      // extra values can only occur at the end of the row
      for (const key of this.result.header) {
        if (!keys.has(key)) {
          values.push('')
        }
      }
      this.result.values.push(values)
    }
    return this.result
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
  protected prepareHeaderData(values: DataType[][]): void {
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
        this.result.header.push(name)
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
      this.result.format.push(tmp)
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
  protected async normalize(input: File | string): Promise<string> {
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
  protected parseInput(input: string): DataType[][] {
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

  /**
   * Converts the parsed data to an array of objects.
   * Each object represents a row, with keys corresponding to the column names
   * from the header row (if present) or default column names (e.g., "column_1", "column_2", ...).
   * The values are the parsed data, with types determined during parsing.
   *
   * @param input - The parsed data as a `ParseResult`, typically obtained from the `parse` method.
   * @return An array of objects, where each object represents a row with named columns.
   *
   * @example
   * ```typescript
   * const parser = new CSVParser();
   * const result = await parser.parse("Name,Age\nAlice,30\nBob,25");
   * const objects = CSVParser.toObject(result);
   * console.log(objects);
   * // Output:  [{ Name: 'Alice', Age: 30 }, { Name: 'Bob', Age: 25 }]
   * ```
   */
  static toObject(input: ParseResult): Record<string, string | number | boolean>[] {
    const result: Record<string, string | number | boolean>[] = []
    for (const row of input.values) {
      const keys = new Set<string>()
      const obj: Record<string, string | number | boolean> = {}
      row.forEach((column, columnIndex) => {
        const name = input.header[columnIndex] || `column_${columnIndex + 1}`
        obj[name] = column
        keys.add(name)
      })
      // now we double check the headers for any missing values
      for (const key of input.header) {
        if (!keys.has(key)) {
          obj[key] = ''
        }
      }
      result.push(obj)
    }
    return result
  }
}
