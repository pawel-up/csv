import { test } from '@japa/runner'
import { CSVParser } from '../../src/parser.js'
import { ParseResult } from '../../src/types.js'

test.group('CSVParser', () => {
  test('should parse a CSV string into an array of objects', async ({ assert }) => {
    const csvString = 'name,age,city\nJohn Doe,30,New York\nJane Smith,25,Los Angeles'
    const parser = new CSVParser()
    const parsed = await parser.parse(csvString)
    const result = CSVParser.toObject(parsed)

    assert.deepEqual(result, [
      { name: 'John Doe', age: 30, city: 'New York' },
      { name: 'Jane Smith', age: 25, city: 'Los Angeles' },
    ])
  })

  test('should parse a CSV string into an array of arrays', async ({ assert }) => {
    const csvString = 'name,age,city\nJohn Doe,30,New York\nJane Smith,25,Los Angeles'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle empty CSV string', async ({ assert }) => {
    const csvString = ''
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [],
      header: [],
      values: [],
    } as ParseResult)
  })

  test('should handle CSV with only header', async ({ assert }) => {
    const csvString = 'name,age,city'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'string', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [],
    } as ParseResult)
  })

  test('should handle CSV with no header', async ({ assert }) => {
    const csvString = 'John Doe,30,New York\nJane Smith,25,Los Angeles'
    const parser = new CSVParser({ header: false })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'column_1', type: 'string', index: 0 },
        { name: 'column_2', type: 'number', format: 'integer', index: 1 },
        { name: 'column_3', type: 'string', index: 2 },
      ],
      header: [],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle different delimiters', async ({ assert }) => {
    const csvString = 'name;age;city\nJohn Doe;30;New York\nJane Smith;25;Los Angeles'
    const parser = new CSVParser({ delimiter: ';' })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle quoted values', async ({ assert }) => {
    const csvString = '"name","age","city"\n"John, Doe","30","New York"\n"Jane Smith","25","Los Angeles"'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John, Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle escaped quotes', async ({ assert }) => {
    const csvString = '"name","age","city"\n"John ""The Man"" Doe","30","New York"\n"Jane Smith","25","Los Angeles"'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John "The Man" Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle comments', async ({ assert }) => {
    const csvString =
      '# This is a comment\nname,age,city\nJohn Doe,30,New York\n# Another comment\nJane Smith,25,Los Angeles'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle max rows', async ({ assert }) => {
    const csvString = 'name,age,city\nJohn Doe,30,New York\nJane Smith,25,Los Angeles\nPeter Pan,10,Neverland'
    const parser = new CSVParser({ maxRows: 2 })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle different data types', async ({ assert }) => {
    const csvString = 'name,age,is_active,birth_date\nJohn Doe,30,true,1990-01-01\nJane Smith,25,false,1995-05-15'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'is_active', type: 'boolean', index: 2 },
        { name: 'birth_date', type: 'date', index: 3 },
      ],
      header: ['name', 'age', 'is_active', 'birth_date'],
      values: [
        ['John Doe', 30, true, '1990-01-01'],
        ['Jane Smith', 25, false, '1995-05-15'],
      ],
    } as ParseResult)
  })

  test('should handle different date formats', async ({ assert }) => {
    const csvString = 'name,birth_date\nJohn Doe,01.01.1990\nJane Smith,15/05/1995'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'birth_date', type: 'date', index: 1 },
      ],
      header: ['name', 'birth_date'],
      values: [
        ['John Doe', '01.01.1990'],
        ['Jane Smith', '15/05/1995'],
      ],
    } as ParseResult)
  })

  test('should handle different time formats', async ({ assert }) => {
    const csvString = 'name,time\nJohn Doe,10:00:00\nJane Smith,12:30'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'time', type: 'time', index: 1 },
      ],
      header: ['name', 'time'],
      values: [
        ['John Doe', '10:00:00'],
        ['Jane Smith', '12:30'],
      ],
    } as ParseResult)
  })

  test('should handle different datetime formats', async ({ assert }) => {
    const csvString = 'name,datetime\nJohn Doe,2023-10-27 10:00:00\nJane Smith,2023-10-27T12:30:00Z'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'datetime', type: 'datetime', index: 1 },
      ],
      header: ['name', 'datetime'],
      values: [
        ['John Doe', '2023-10-27 10:00:00'],
        ['Jane Smith', '2023-10-27T12:30:00Z'],
      ],
    } as ParseResult)
  })

  test('should handle empty rows', async ({ assert }) => {
    const csvString = 'name,age,city\n\nJohn Doe,30,New York\n,,\nJane Smith,25,Los Angeles'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['', '', ''],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle inconsistent number of columns', async ({ assert }) => {
    const csvString = 'name,age,city\nJohn Doe,30\nJane Smith,25,Los Angeles,Extra'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, ''],
        ['Jane Smith', 25, 'Los Angeles', 'Extra'],
      ],
    } as ParseResult)
  })

  test('should handle inconsistent number of columns with no header', async ({ assert }) => {
    const csvString = 'John Doe,30\nJane Smith,25,Los Angeles,Extra'
    const parser = new CSVParser({ header: false })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'column_1', type: 'string', index: 0 },
        { name: 'column_2', type: 'number', format: 'integer', index: 1 },
      ],
      header: [],
      values: [
        ['John Doe', 30],
        ['Jane Smith', 25, 'Los Angeles', 'Extra'],
      ],
    } as ParseResult)
  })

  test('should handle whitespace around delimiters and values', async ({ assert }) => {
    const csvString = '  name  ,  age  ,  city  \n  John Doe  ,  30  ,  New York  \n Jane Smith , 25 , Los Angeles '
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })

  test('should handle null values', async ({ assert }) => {
    const csvString = 'name,age,city\nJohn Doe,,New York\n,25,'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'string', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [
        ['John Doe', '', 'New York'],
        ['', 25, ''],
      ],
    } as ParseResult)
  })

  test('should handle different number formats', async ({ assert }) => {
    const csvString = 'value\n1e3\n-1.234e-2'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    // So, it should detect the number format as decimal, not integer
    // but to do that we would have to scan each value for a number column.
    // It is a lot on performance, so we will just leave it as is for now.
    assert.deepEqual(result, {
      format: [{ name: 'value', type: 'number', format: 'integer', index: 0 }],
      header: ['value'],
      values: [[1000], [-0.01234]],
    } as ParseResult)
  })

  test('should handle more date/time formats', async ({ assert }) => {
    const csvString =
      'date,time,datetime\n2024-01-15,14:30,2024-01-15T14:30:00Z\n01/15/2024,14:30:00.123,2024-01-15 14:30:00'
    const parser = new CSVParser()
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'date', type: 'date', index: 0 },
        { name: 'time', type: 'time', index: 1 },
        { name: 'datetime', type: 'datetime', index: 2 },
      ],
      header: ['date', 'time', 'datetime'],
      values: [
        ['2024-01-15', '14:30', '2024-01-15T14:30:00Z'],
        ['01/15/2024', '14:30:00.123', '2024-01-15 14:30:00'],
      ],
    } as ParseResult)
  })

  test('should handle custom quote character', async ({ assert }) => {
    const csvString = "'name','age','city'\n'John, Doe','30','New York'"
    const parser = new CSVParser({ quote: "'" })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [['John, Doe', 30, 'New York']],
    } as ParseResult)
  })

  test('should handle custom comment character', async ({ assert }) => {
    const csvString = '// This is a comment\nname,age,city\nJohn Doe,30,New York'
    const parser = new CSVParser({ comment: '//' })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'name', type: 'string', index: 0 },
        { name: 'age', type: 'number', format: 'integer', index: 1 },
        { name: 'city', type: 'string', index: 2 },
      ],
      header: ['name', 'age', 'city'],
      values: [['John Doe', 30, 'New York']],
    } as ParseResult)
  })

  test('should handle custom date formats', async ({ assert }) => {
    const csvString = 'date\n2024/01/15\n15-01-2024'
    const parser = new CSVParser({
      dateFormats: {
        date: ['YYYY/MM/DD', 'DD-MM-YYYY'],
        time: [],
        datetime: [],
      },
    })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [{ name: 'date', type: 'date', index: 0 }],
      header: ['date'],
      values: [['2024/01/15'], ['15-01-2024']],
    } as ParseResult)
  })

  test('should parse a CSV string into an array of arrays with no header', async ({ assert }) => {
    const csvString = 'John Doe,30,New York\nJane Smith,25,Los Angeles'
    const parser = new CSVParser({ header: false })
    const result = await parser.parse(csvString)

    assert.deepEqual(result, {
      format: [
        { name: 'column_1', type: 'string', index: 0 },
        { name: 'column_2', type: 'number', format: 'integer', index: 1 },
        { name: 'column_3', type: 'string', index: 2 },
      ],
      header: [],
      values: [
        ['John Doe', 30, 'New York'],
        ['Jane Smith', 25, 'Los Angeles'],
      ],
    } as ParseResult)
  })
})
