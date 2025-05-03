export interface FormatInfo {
  /**
   * Describes the data type and format of a single column in a CSV file.
   * This information is used to interpret the raw string values in the CSV data.
   */
  type: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime'
  /**
   * Specifies the format of a numeric column.
   * - `integer`: Represents a whole number (e.g., 1, 10, -5).
   * - `decimal`: Represents a number with a fractional part (e.g., 3.14, -2.5).
   * This property is only applicable when `type` is 'number'.
   */
  format?: 'integer' | 'decimal'
  /**
   * The name of the column in the CSV file.
   * This typically corresponds to the header row value for this column.
   * Column without a name is constructed as `column_1`, `column_2`, etc (1-based index).
   */
  name: string
  /**
   * The zero-based index of the column in the CSV file.
   * The first column has an index of 0, the second has an index of 1, and so on.
   */
  index: number
}

export interface ParseResult {
  /**
   * The detected format of the CSV data.
   * This array describes the data type and format of each column in the CSV file,
   * in the order they appear in the file.
   * Each element in the array is a `FormatInfo` object.
   */
  format: FormatInfo[]
  /**
   * The header row of the CSV file.
   * This array contains the column names, in the order they appear in the file.
   * Each element in the array is a string representing a column name.
   * Column without a name is constructed as `column_1`, `column_2`, etc (1-based index).
   */
  header: string[]
  /**
   * The parsed data from the CSV file, represented as an array of arrays.
   * Each inner array represents a row in the CSV file.
   * Each element within an inner array represents the value of a cell in that row.
   * The order of the elements in the inner array corresponds to the order of the
   * `FormatInfo` objects in the `format` array.
   * The data types of the values are determined by the `type` property in the
   * corresponding `FormatInfo` object.
   */
  values: (string | number | boolean)[][]
}

export interface DateFormats {
  /**
   * Defines the supported date formats for parsing CSV data.
   * These formats are used to automatically detect and parse date strings
   * in the CSV file.
   *
   * @default ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']
   */
  date: string[]
  /**
   * Defines the supported time formats for parsing CSV data.
   * These formats are used to automatically detect and parse time strings
   * in the CSV file.
   *
   * @default ['HH:mm:ss', 'HH:mm', 'HH:mm:ss.SSS']
   */
  time: string[]
  /**
   * Defines the supported date and time (datetime) formats for parsing CSV data.
   * These formats are used to automatically detect and parse datetime strings
   * in the CSV file.
   *
   * @default ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSZ']
   */
  datetime: string[]
}
