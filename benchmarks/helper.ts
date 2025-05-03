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

export function createChunkedStream(data: string, chunkSize: number): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      let offset = 0
      function push() {
        if (offset >= data.length) {
          controller.close()
          return
        }
        const chunk = data.substring(offset, offset + chunkSize)
        offset += chunkSize
        controller.enqueue(chunk)
        push()
      }
      push()
    },
  })
}
