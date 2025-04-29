export function readFile(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsText(file, encoding)
  })
}
