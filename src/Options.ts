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
   * When set to `true`, the `outputAsObject` option will not have any effect.
   
   * @default true
   */
  header?: boolean
  /**
   * The file encoding.
   * @default 'utf-8'
   */
  encoding?: string
  /**
   * Whether to output as an object (key-value) or array.
   * Note that this has no effect if the header option is set to false.
   * @default false
   */
  outputAsObject?: boolean
  /**
   * Possible date formats to detect.
   * @default ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']
   */
  dateFormats?: string[]
}

export class CSVParserOptions {
  #delimiter: string
  #quote: string
  #comment: string
  #header: boolean
  #encoding: string
  #outputAsObject: boolean
  #dateFormats: string[]
  constructor(init: Partial<CSVOptions> = {}) {
    this.#delimiter = init.delimiter ?? ','
    this.#quote = init.quote ?? '"'
    this.#comment = init.comment ?? '#'
    this.#header = init.header ?? true
    this.#encoding = init.encoding ?? 'utf-8'
    this.#outputAsObject = init.outputAsObject ?? false
    this.#dateFormats = init.dateFormats ?? ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']
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
   * Whether to output as an object (key-value) or array.
   * @default false
   */
  get outputAsObject(): boolean {
    return this.#outputAsObject
  }
  /**
   * Possible date formats to detect.
   * @default ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY']
   */
  get dateFormats(): string[] {
    return this.#dateFormats
  }
}
