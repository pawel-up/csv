import { test } from '@japa/runner'
import { type DateFormats, detectDataType } from '../../src/lib/DataType.js'

const dateFormats: DateFormats = {
  date: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY'],
  time: ['HH:mm:ss', 'HH:mm', 'HH:mm:ss.SSS'],
  datetime: ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSZ'],
}

test.group('DataType.detectDataType()', () => {
  test('should detect null', ({ assert }) => {
    assert.deepEqual(detectDataType(null, dateFormats), { type: 'null', value: null })
  })

  test('should detect empty string as string', ({ assert }) => {
    assert.deepEqual(detectDataType('', dateFormats), { type: 'string', value: '' })
  })

  test('should detect boolean true', ({ assert }) => {
    assert.deepEqual(detectDataType('true', dateFormats), { type: 'boolean', value: true })
    assert.deepEqual(detectDataType('TRUE', dateFormats), { type: 'boolean', value: true })
  })

  test('should detect boolean false', ({ assert }) => {
    assert.deepEqual(detectDataType('false', dateFormats), { type: 'boolean', value: false })
    assert.deepEqual(detectDataType('FALSE', dateFormats), { type: 'boolean', value: false })
  })

  test('should detect integer', ({ assert }) => {
    assert.deepEqual(detectDataType('123', dateFormats), { type: 'number', format: 'integer', value: 123 })
    assert.deepEqual(detectDataType('0', dateFormats), { type: 'number', format: 'integer', value: 0 })
    assert.deepEqual(detectDataType('-10', dateFormats), { type: 'number', format: 'integer', value: -10 })
  })

  test('should detect decimal', ({ assert }) => {
    assert.deepEqual(detectDataType('123.45', dateFormats), { type: 'number', format: 'decimal', value: 123.45 })
    assert.deepEqual(detectDataType('0.0', dateFormats), { type: 'number', format: 'decimal', value: 0 })
    assert.deepEqual(detectDataType('-10.5', dateFormats), { type: 'number', format: 'decimal', value: -10.5 })
    assert.deepEqual(detectDataType('.5', dateFormats), { type: 'number', format: 'decimal', value: 0.5 })
  })

  test('should detect date YYYY-MM-DD', ({ assert }) => {
    assert.deepEqual(detectDataType('2023-10-27', dateFormats), { type: 'date', value: '2023-10-27' })
    assert.deepEqual(detectDataType('1999-01-01', dateFormats), { type: 'date', value: '1999-01-01' })
  })

  test('should detect date MM/DD/YYYY', ({ assert }) => {
    assert.deepEqual(detectDataType('10/27/2023', dateFormats), { type: 'date', value: '10/27/2023' })
    assert.deepEqual(detectDataType('01/01/1999', dateFormats), { type: 'date', value: '01/01/1999' })
  })

  test('should detect date DD.MM.YYYY', ({ assert }) => {
    assert.deepEqual(detectDataType('27.10.2023', dateFormats), { type: 'date', value: '27.10.2023' })
    assert.deepEqual(detectDataType('01.01.1999', dateFormats), { type: 'date', value: '01.01.1999' })
  })

  test('should detect time HH:mm:ss', ({ assert }) => {
    assert.deepEqual(detectDataType('10:30:00', dateFormats), { type: 'time', value: '10:30:00' })
    assert.deepEqual(detectDataType('00:00:00', dateFormats), { type: 'time', value: '00:00:00' })
    assert.deepEqual(detectDataType('23:59:59', dateFormats), { type: 'time', value: '23:59:59' })
  })

  test('should detect time HH:mm', ({ assert }) => {
    assert.deepEqual(detectDataType('10:30', dateFormats), { type: 'time', value: '10:30' })
    assert.deepEqual(detectDataType('00:00', dateFormats), { type: 'time', value: '00:00' })
    assert.deepEqual(detectDataType('23:59', dateFormats), { type: 'time', value: '23:59' })
  })

  test('should detect time HH:mm:ss.SSS', ({ assert }) => {
    assert.deepEqual(detectDataType('10:30:00.123', dateFormats), { type: 'time', value: '10:30:00.123' })
    assert.deepEqual(detectDataType('00:00:00.000', dateFormats), { type: 'time', value: '00:00:00.000' })
    assert.deepEqual(detectDataType('23:59:59.999', dateFormats), { type: 'time', value: '23:59:59.999' })
  })

  test('should detect datetime YYYY-MM-DD HH:mm:ss', ({ assert }) => {
    assert.deepEqual(detectDataType('2023-10-27 10:30:00', dateFormats), {
      type: 'datetime',
      value: '2023-10-27 10:30:00',
    })
    assert.deepEqual(detectDataType('1999-01-01 00:00:00', dateFormats), {
      type: 'datetime',
      value: '1999-01-01 00:00:00',
    })
  })

  test('should detect datetime YYYY-MM-DDTHH:mm:ssZ', ({ assert }) => {
    assert.deepEqual(detectDataType('2023-10-27T10:30:00Z', dateFormats), {
      type: 'datetime',
      value: '2023-10-27T10:30:00Z',
    })
    assert.deepEqual(detectDataType('1999-01-01T00:00:00Z', dateFormats), {
      type: 'datetime',
      value: '1999-01-01T00:00:00Z',
    })
  })

  test('should detect datetime YYYY-MM-DDTHH:mm:ss.SSSZ', ({ assert }) => {
    assert.deepEqual(detectDataType('2023-10-27T10:30:00.123Z', dateFormats), {
      type: 'datetime',
      value: '2023-10-27T10:30:00.123Z',
    })
    assert.deepEqual(detectDataType('1999-01-01T00:00:00.000Z', dateFormats), {
      type: 'datetime',
      value: '1999-01-01T00:00:00.000Z',
    })
  })

  test('should detect string', ({ assert }) => {
    assert.deepEqual(detectDataType('hello', dateFormats), { type: 'string', value: 'hello' })
    assert.deepEqual(detectDataType('123abc', dateFormats), { type: 'string', value: '123abc' })
    assert.deepEqual(detectDataType('abc123', dateFormats), { type: 'string', value: 'abc123' })
    assert.deepEqual(detectDataType(' ', dateFormats), { type: 'string', value: '' })
  })

  test('should detect string when no date formats are provided', ({ assert }) => {
    assert.deepEqual(detectDataType('2023-10-27'), { type: 'string', value: '2023-10-27' })
    assert.deepEqual(detectDataType('10:30:00'), { type: 'string', value: '10:30:00' })
    assert.deepEqual(detectDataType('2023-10-27 10:30:00'), { type: 'string', value: '2023-10-27 10:30:00' })
  })
})
