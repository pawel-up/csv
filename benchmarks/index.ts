/* eslint-disable no-console */
import { Suite, CliReporter, FileReporter, compareSuites } from '@pawel-up/benchmark'
import { generateCSV, getLatestBenchmark, historyPath } from './helper.js'
import { CSVParser } from '../src/index.js'

const cli = new CliReporter({ format: 'short' })
const file = new FileReporter({ outputDir: historyPath })
const suite = new Suite('CVS', { minSamples: 8, maxExecutionTime: 15000, maxIterations: 500, timeThreshold: 5 })

// Data sizes for testing
const smallData = generateCSV(100, 5)
const mediumData = generateCSV(1000, 10)
const largeData = generateCSV(10000, 15)
const smallDataNoHeader = generateCSV(100, 5, false)
const mediumDataNoHeader = generateCSV(1000, 10, false)
const largeDataNoHeader = generateCSV(10000, 15, false)

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
  // asObject tests
  .add('asObject/small', async () => {
    const parser = new CSVParser()
    await parser.asObject(smallData)
  })
  .add('asObject/medium', async () => {
    const parser = new CSVParser()
    await parser.asObject(mediumData)
  })
  .add('asObject/large', async () => {
    const parser = new CSVParser()
    await parser.asObject(largeData)
  })
  .add('asObject/small/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asObject(smallDataNoHeader)
  })
  .add('asObject/medium/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asObject(mediumDataNoHeader)
  })
  .add('asObject/large/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asObject(largeDataNoHeader)
  })
  .add('asObject/small data/max rows', async () => {
    const parser = new CSVParser({ maxRows: 50 })
    await parser.asObject(smallDataMaxRows)
  })
  .add('asObject/medium data/max rows', async () => {
    const parser = new CSVParser({ maxRows: 500 })
    await parser.asObject(mediumDataMaxRows)
  })
  .add('asObject/large data/max rows', async () => {
    const parser = new CSVParser({ maxRows: 5000 })
    await parser.asObject(largeDataMaxRows)
  })
  .add('asObject/small data/custom delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.asObject(smallDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('asObject/medium data/custom delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.asObject(mediumDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('asObject/large data/custom delimiter', async () => {
    const parser = new CSVParser({ delimiter: ';' })
    await parser.asObject(largeDataCustomDelimiter.replace(/,/g, ';'))
  })
  .add('asObject/small data/custom quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.asObject(smallDataCustomQuote.replace(/"/g, "'"))
  })
  .add('asObject/medium data/custom quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.asObject(mediumDataCustomQuote.replace(/"/g, "'"))
  })
  .add('asObject/large data/custom quote', async () => {
    const parser = new CSVParser({ quote: "'" })
    await parser.asObject(largeDataCustomQuote.replace(/"/g, "'"))
  })
  .add('asObject/small data/custom comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.asObject(`// comment\n${smallDataCustomComment}`)
  })
  .add('asObject/medium data/custom comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.asObject(`// comment\n${mediumDataCustomComment}`)
  })
  .add('asObject/large data/custom comment', async () => {
    const parser = new CSVParser({ comment: '//' })
    await parser.asObject(`// comment\n${largeDataCustomComment}`)
  })
  .add('asObject/small data/custom date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.asObject(smallDataCustomDateFormats.replace(/-/g, '/'))
  })
  .add('asObject/medium data/custom date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.asObject(mediumDataCustomDateFormats.replace(/-/g, '/'))
  })
  .add('asObject/large data/custom date formats', async () => {
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    await parser.asObject(largeDataCustomDateFormats.replace(/-/g, '/'))
  })
  // asArray tests
  .add('asArray/small data', async () => {
    const parser = new CSVParser()
    await parser.asArray(smallData)
  })
  .add('asArray/medium data', async () => {
    const parser = new CSVParser()
    await parser.asArray(mediumData)
  })
  .add('asArray/large data', async () => {
    const parser = new CSVParser()
    await parser.asArray(largeData)
  })
  .add('asArray/small data/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asArray(smallDataNoHeader)
  })
  .add('asArray/medium data/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asArray(mediumDataNoHeader)
  })
  .add('asArray/large data/no header', async () => {
    const parser = new CSVParser({ header: false })
    await parser.asArray(largeDataNoHeader)
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
