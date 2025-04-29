/* eslint-disable no-console */
import { type SuiteReport } from '@pawel-up/benchmark'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

export const historyPath = './benchmarks/history'

export async function listHistoryFiles(): Promise<string[]> {
  const files = await readdir(historyPath)
  const filteredFiles = files.filter((file) => file.endsWith(`_benchmark.json`))
  return filteredFiles.sort()
}

export async function getLatestBenchmark(): Promise<SuiteReport | undefined> {
  const files = await listHistoryFiles()
  const file = files.pop()
  if (!file) {
    return
  }
  try {
    const data = await readFile(path.join(historyPath, file), 'utf-8')
    const result = JSON.parse(data)
    return result
  } catch (error) {
    console.error('Error reading benchmark file:', error)
  }
}

export function generateCSV(rows: number, columns: number, withHeader = true): string {
  const header = withHeader ? generateHeader(columns) : ''
  const data = generateData(rows, columns)
  return withHeader ? `${header}\n${data}` : data
}

function generateHeader(columns: number): string {
  const headerRow = Array.from({ length: columns }, (_, i) => `column_${i + 1}`).join(',')
  return headerRow
}

function generateData(rows: number, columns: number): string {
  const dataRows = Array.from({ length: rows }, () => {
    const row = Array.from({ length: columns }, () => generateRandomValue()).join(',')
    return row
  })
  return dataRows.join('\n')
}

function generateRandomValue(): string {
  const random = Math.random()
  if (random < 0.33) {
    return Math.floor(Math.random() * 1000).toString() // Integer
  } else if (random < 0.66) {
    return (Math.random() * 100).toFixed(2) // Decimal
  } else {
    return Math.random().toString(36).substring(2, 10) // Random string
  }
}
