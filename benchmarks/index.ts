/* eslint-disable no-console */
import { Suite, CliReporter, FileReporter, compareSuites } from '@pawel-up/benchmark'
import { createChunkedStream, getLatestBenchmark, historyPath } from './helper.js'
import { CSVParser } from '../src/index.js'
import { generateCSV } from '../tests/Utils.js'

const cli = new CliReporter({ format: 'short' })
const file = new FileReporter({ outputDir: historyPath })
const suite = new Suite('CVS', { minSamples: 8, maxExecutionTime: 15000, maxIterations: 500, timeThreshold: 5 })

// Data sizes for testing
const smallData = generateCSV(100, 5)
const mediumData = generateCSV(1000, 10)
const largeData = generateCSV(10000, 15)
const smallDataNoHeader = generateCSV(100, 5, { withHeader: false })
const mediumDataNoHeader = generateCSV(1000, 10, { withHeader: false })
const largeDataNoHeader = generateCSV(10000, 15, { withHeader: false })

const smallDataMaxRows = generateCSV(100, 5)
const mediumDataMaxRows = generateCSV(1000, 10)
const largeDataMaxRows = generateCSV(10000, 15)

const smallDataCustomDelimiter = generateCSV(100, 5)
const mediumDataCustomDelimiter = generateCSV(1000, 10)
const largeDataCustomDelimiter = generateCSV(10000, 15)

const smallDataCustomQuote = generateCSV(100, 5)
const mediumDataCustomQuote = generateCSV(1000, 10)
const largeDataCustomQuote = generateCSV(10000, 15)

const smallDataCustomComment = generateCSV(100, 5)
const mediumDataCustomComment = generateCSV(1000, 10)
const largeDataCustomComment = generateCSV(10000, 15)

const smallDataCustomDateFormats = generateCSV(100, 5)
const mediumDataCustomDateFormats = generateCSV(1000, 10)
const largeDataCustomDateFormats = generateCSV(10000, 15)

const latest = await getLatestBenchmark()

const result = await suite
  // parse tests
  .add('parse/small', async () => {
    const parser = new CSVParser()
    await parser.parse(smallData)
  })
  .add('parse/medium', async () => {
    const parser = new CSVParser()
    await parser.parse(mediumData)
  })
  .add('parse/large', async () => {
    const parser = new CSVParser()
    await parser.parse(largeData)
  })
  .add('parse/small/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.parse(smallDataNoHeader)
  })
  .add('parse/medium/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.parse(mediumDataNoHeader)
  })
  .add('parse/large/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.parse(largeDataNoHeader)
  })
  .add('parse/S/max rows', async () => {
    const parser = new CSVParser({ maxRows: 50 })
    await parser.parse(smallDataMaxRows)
  })
  .add('parse/M/max rows', async () => {
    const parser = new CSVParser({ maxRows: 500 })
    await parser.parse(mediumDataMaxRows)
  })
  .add('parse/L/max rows', async () => {
    const parser = new CSVParser({ maxRows: 5000 })
    await parser.parse(largeDataMaxRows)
  })
  .add('parse/S/delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.parse(smallDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('parse/M/delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.parse(mediumDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('parse/L/delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.parse(largeDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('parse/S/quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.parse(smallDataCustomQuote.replace(/"/g, "'"))
  })
  .add('parse/M/quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.parse(mediumDataCustomQuote.replace(/"/g, "'"))
  })
  .add('parse/L/quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.parse(largeDataCustomQuote.replace(/"/g, "'"))
  })
  .add('parse/S/comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.parse(`// comment\n${smallDataCustomComment}`)
  })
  .add('parse/M/comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.parse(`// comment\n${mediumDataCustomComment}`)
  })
  .add('parse/L/comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.parse(`// comment\n${largeDataCustomComment}`)
  })
  .add('parse/S/date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.parse(smallDataCustomDateFormats.replace(/-/g, '/'))
  })
  .add('parse/M/date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.parse(mediumDataCustomDateFormats.replace(/-/g, '/'))
  })
  .add('parse/L/date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.parse(largeDataCustomDateFormats.replace(/-/g, '/'))
  })
  // stream tests
  .add('stream/small', async () => {
    const parser = new CSVParser()
    const stream = createChunkedStream(smallData, 1024)
    await parser.stream(stream)
  })
  .add('stream/medium', async () => {
    const parser = new CSVParser()
    const stream = createChunkedStream(mediumData, 1024)
    await parser.stream(stream)
  })
  .add('stream/large', async () => {
    const parser = new CSVParser()
    const stream = createChunkedStream(largeData, 1024)
    await parser.stream(stream)
  })
  .addReporter(cli, 'after-each')
  .addReporter(file, 'after-all')
  .run()

if (latest) {
  console.log('Comparing with the latest benchmark...')
  compareSuites(result, latest)
} else {
  console.log('No previous benchmark found to compare with.')
}
