export interface CSVOptions {
  delimiter: string
  quoteChar: string
  escapeChar: string
  header: boolean
  skipEmptyLines: boolean
  trimHeaders: boolean
  trimValues: boolean
  skipInitialSpace: boolean
  skipComments: boolean
  comment: string
}
