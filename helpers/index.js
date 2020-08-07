const KB = 1024,
  MB = KB * KB,
  GB = MB * KB
// human friendly byte string
const byteToString = bytes => {
  if (bytes > GB) return `${(bytes / GB).toFixed(2)} GB`
  else if (bytes > MB) return `${(bytes / MB).toFixed(2)} MB`
  else if (bytes > KB) return `${(bytes / KB).toFixed(2)} KB`
  return `${bytes} B`
}

const validTextTypes = [
  'text/*',
  'json',
  'xml',
  'application/*+json',
  'application/*+xml',
  'urlencoded'
]

module.exports = { byteToString, validTextTypes }
