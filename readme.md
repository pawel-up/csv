# 🚀 CSV Parser: Effortless CSV Handling in TypeScript

[![npm version](https://badge.fury.io/js/%40pawel-up%2Fcsv.svg)](https://badge.fury.io/js/%40pawel-up%2Fcsv)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/pawel-up/csv/actions/workflows/deployment.yml/badge.svg)](https://github.com/pawel-up/csv/actions/workflows/deployment.yml)

**Stop wrestling with CSVs!**  This lightweight, powerful TypeScript library makes parsing CSV data a breeze. Whether you're dealing with files or strings, complex data types, or custom formats, `csv` has you covered.

## ✨ Why Choose `csv`?

* **Effortless Parsing:**  Parse CSV data from files or strings with just a few lines of code.
* **Automatic Data Type Detection:**  Intelligently detects strings, numbers (integers and decimals), booleans, dates, times, and datetimes. No more manual type casting!
* **Flexible Output:** Get your data as an array of arrays (rows and cells) or an array of objects (rows with named columns).
* **Header Row Support:**  Easily handle CSVs with or without header rows.
* **Customizable:** Fine-tune the parsing process with options for delimiters, quote characters, comment characters, encoding, and date/time formats.
* **Robust Error Handling:**  Gracefully handles malformed CSV data and provides informative error messages.
* **TypeScript-First:**  Built from the ground up with TypeScript, providing excellent type safety and autocompletion.
* **Lightweight:** No dependencies and a small footprint, making it ideal for any project.
* **Handles comments:** Skips lines that start with a comment character.
* **Handles max rows:** Can limit the number of rows to parse.
* **Well tested:** The library is well tested and has a high code coverage.

## 📦 Installation

```bash
npm install @pawel-up/csv
```

or

```bash
yarn add @pawel-up/csv
```

## 🚀 Quick Start

### Parsing a CSV String into an Array of Objects

```typescript
import { CSVParser } from '@pawel-up/csv';

const csvString = "name,age,city\nJohn Doe,30,New York\nJane Smith,25,Los Angeles";
const parser = new CSVParser();

async function parseCSV() {
  const result = await parser.asObject(csvString);
  console.log(result);
  // Output:
  // {
  //   format: [
  //     { name: 'name', type: 'string', index: 0 },
  //     { name: 'age', type: 'number', format: 'integer', index: 1 },
  //     { name: 'city', type: 'string', index: 2 }
  //   ],
  //   header: ['name', 'age', 'city'],
  //   values: [
  //     { name: 'John Doe', age: 30, city: 'New York' },
  //     { name: 'Jane Smith', age: 25, city: 'Los Angeles' }
  //   ]
  // }
}

parseCSV();
```

### Parsing a CSV File into an Array of Arrays

```typescript
import { CSVParser } from '@pawel-up/csv';

// Assuming you have a file input element:
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files[0];

const parser = new CSVParser({ delimiter: ';', header: false });

async function parseCSV() {
  const result = await parser.asArray(file);
  console.log(result);
  // Output:
  // {
  //   format: [
  //     { name: 'column_1', type: 'string', index: 0 },
  //     { name: 'column_2', type: 'number', format: 'integer', index: 1 },
  //     { name: 'column_3', type: 'string', index: 2 }
  //   ],
  //   header: [],
  //   values: [
  //     ['John Doe', 30, 'New York'],
  //     ['Jane Smith', 25, 'Los Angeles']
  //   ]
  // }
}

parseCSV();
```

## ⚙️ Configuration Options

The `CSVParser` constructor accepts an optional `CSVOptions` object to customize the parsing behavior:

```typescript
interface CSVOptions {
  delimiter?: string; // Default: ','
  quote?: string; // Default: '"'
  comment?: string; // Default: ''
  header?: boolean; // Default: true
  encoding?: string; // Default: 'utf8'
  maxRows?: number; // Default: Infinity
}
```
