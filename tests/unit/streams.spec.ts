import { test } from '@japa/runner'
import { CSVParser } from '../../src/parser.js'
import { ParseResult } from '../../src/types.js'
import { generateCSV } from '../Utils.js'

test.group('Streaming', () => {
  test('should stream a CSV string and emit chunks', async ({ assert }) => {
    const parser = new CSVParser()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('name,age\nJohn,30\nJ')
        controller.enqueue('ane,25\nPeter,40')
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }

    // because the last line has no new line, the parser will always emit the last chunk
    // when the stream is closed.
    assert.lengthOf(chunks, 3)
    assert.deepEqual(chunks[0], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [['John', 30]],
    } as ParseResult)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
    assert.deepEqual(chunks[2], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
        ['Peter', 40],
      ],
    } as ParseResult)
  })

  test('should stream a CSV string with no header and emit chunks', async ({ assert }) => {
    const parser = new CSVParser({ header: false })
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('John,30\nJane,25\n')
        controller.enqueue('Peter,40')
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }

    assert.lengthOf(chunks, 2)
    assert.deepEqual(chunks[0], {
      format: [
        { name: 'column_1', type: 'string', index: 0 },
        { name: 'column_2', type: 'number', format: 'integer', index: 1 },
      ],
      header: [],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'column_1', type: 'string', index: 0 },
        { name: 'column_2', type: 'number', format: 'integer', index: 1 },
      ],
      header: [],
      values: [
        ['John', 30],
        ['Jane', 25],
        ['Peter', 40],
      ],
    } as ParseResult)
  })

  test('should handle an empty stream', async ({ assert }) => {
    const parser = new CSVParser()
    const stream = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const { done } = await reader.read()
    assert.isTrue(done)
  })

  test('should handle chunk with newline in the middle', async ({ assert }) => {
    const parser = new CSVParser()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('name,age\nJohn,3')
        controller.enqueue('0\nJane,25')
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }

    assert.lengthOf(chunks, 3)
    assert.deepEqual(chunks[0], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'string', index: 1 },
      ],
      header: ['name', 'age'],
      values: [],
    } as ParseResult)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', index: 1, format: 'integer' },
      ],
      header: ['name', 'age'],
      values: [['John', 30]],
    } as ParseResult)
    assert.deepEqual(chunks[2], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', index: 1, format: 'integer' },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
  })

  test('should handle chunk with newline at the end of the last chunk', async ({ assert }) => {
    const parser = new CSVParser()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('name,age\nJohn,30\n')
        controller.enqueue('Jane,25\n')
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }

    assert.lengthOf(chunks, 2)
    assert.deepEqual(chunks[0], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [['John', 30]],
    } as ParseResult)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
  })

  test('should handle perfect chunk alignment with newlines', async ({ assert }) => {
    const parser = new CSVParser()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('name,age\nJohn,30\n')
        controller.enqueue('Jane,25\n')
        controller.enqueue('Peter,40\n')
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }

    assert.lengthOf(chunks, 3)
    assert.deepEqual(chunks[0], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [['John', 30]],
    } as ParseResult)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
  })

  test('terminates the stream when the maxRows is reached', async ({ assert }) => {
    const parser = new CSVParser({ maxRows: 2 })
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('name,age\nJohn,') // ok
        controller.enqueue('30\nJane,25\nPeter,') // ok, partially
        controller.enqueue('40\n') // terminates
        controller.enqueue('Pawel,20\n') // terminates
        controller.close()
      },
    })
    const parsedStream = parser.stream(stream)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }
    assert.lengthOf(chunks, 2)
    assert.deepEqual(chunks[1], {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
      ],
      header: ['name', 'age'],
      values: [
        ['John', 30],
        ['Jane', 25],
      ],
    } as ParseResult)
  })

  test('should stream a CSV file and emit chunks', async ({ assert }) => {
    const smallData = generateCSV(100, 5, { endWithNewline: true })
    const mockFile = new File([smallData], 'data.csv', { type: 'text/csv' })
    const parser = new CSVParser()
    const parsedStream = parser.streamFile(mockFile)
    const reader = parsedStream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }
    // The file is already in memory, so it won't be chunked.
    // Also, we instructed the generator to add a new line at the end of the file.
    // So we will have 1 chunk with 100 rows.
    assert.lengthOf(chunks, 1)
    assert.lengthOf(chunks[0].values, 100)
    assert.lengthOf(chunks[0].header, 5)
  })

  test('fetch API integration', async ({ assert }) => {
    const fileURL = new URL('../fixtures/products-100.csv', import.meta.url)
    const response = await fetch(fileURL)
    const textStream = response.body!.pipeThrough(new TextDecoderStream())
    const parser = new CSVParser()
    const stream = parser.stream(textStream)
    const reader = stream.getReader()
    const chunks: ParseResult[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(structuredClone(value))
    }
    assert.isAbove(chunks.length, 1)
  }).skip(true, 'the fetch API does not allow fetching files (yet)')
})
