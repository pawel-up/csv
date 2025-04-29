import { DateFormats } from './types.js'

export const DefaultDateFormats: DateFormats = {
  date: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY'],
  time: ['HH:mm:ss', 'HH:mm', 'HH:mm:ss.SSS'],
  datetime: ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSZ'],
}

/**
 * Creates a new CSVParser instance.
 */
export interface CSVOptions {
  /**
   * The delimiter character.
   * @default ','
   */
  delimiter?: string
  /**
   * The quote character.
   * @default '"'
   */
  quote?: string
  /**
   * The comment character.
   * @default '#'
   */
  comment?: string
  /**
   * Whether the first row is a header.
   * When set to `true`, the `asObject()` method will throw an error.
   * @default true
   */
  header?: boolean
  /**
   * The file encoding.
   * @default 'utf-8'
   */
  encoding?: string
  /**
   * Possible date formats to detect.
   */
  dateFormats?: DateFormats
  /**
   * The maximum number of rows to parse.
   * When set, the parser will stop parsing after this number of rows.
   * This is useful for testing or when you want to limit the amount of data
   * processed.
   * Note that the header row is always included. This value represents the
   * maximum number of data rows read after the header, even when header is missing.
   * @default undefined
   */
  maxRows?: number
}

export class CSVParserOptions {
  #delimiter: string
  #quote: string
  #comment: string
  #header: boolean
  #encoding: string
  #dateFormats: DateFormats
  #maxRows: number | undefined
  constructor(init: Partial<CSVOptions> = {}) {
    this.#delimiter = init.delimiter ?? ','
    this.#quote = init.quote ?? '"'
    this.#comment = init.comment ?? '#'
    this.#header = init.header ?? true
    this.#encoding = init.encoding ?? 'utf-8'
    this.#dateFormats = init.dateFormats ?? DefaultDateFormats
    this.#maxRows = init.maxRows
  }

  /**
   * The delimiter character.
   * @default ','
   */
  get delimiter(): string {
    return this.#delimiter
  }

  /**
   * The quote character.
   * @default '"'
   */
  get quote(): string {
    return this.#quote
  }

  /**
   * The comment character.
   * @default '#'
   */
  get comment(): string {
    return this.#comment
  }

  /**
   * Whether the first row is a header.
   * @default true
   */
  get header(): boolean {
    return this.#header
  }

  /**
   * The file encoding.
   * @default 'utf-8'
   */
  get encoding(): string {
    return this.#encoding
  }

  /**
   * Possible date formats to detect.
   */
  get dateFormats(): DateFormats {
    return this.#dateFormats
  }

  /**
   * The maximum number of rows to parse.
   * @default undefined
   */
  get maxRows(): number | undefined {
    return this.#maxRows
  }
}
