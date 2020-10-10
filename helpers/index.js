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

const log = process.env.NODE_ENV !== 'production' ? console.log : () => true

const forbiddenHeaders = [
    // TODO: recheck
    'accept-charset',
    'accept-encoding',
    'access-control-request-headers',
    'access-control-request-method',
    'connection',
    'content-length',
    'cookie',
    'cookie2',
    'date',
    'dnt',
    'expect',
    'feature-policy',
    'host',
    'keep-alive',
    'origin',
    'referer',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'user-agent',
    'via'
  ],
  forbiddenHeadersSubstrings = ['proxy-', 'sec-']

/** @param {IncomingHttpHeaders} headers */
const sanitizeHeaders = headers => {
  if (typeof headers != 'object') return {}

  var headersToRemove = []
  var headerKeys = Object.keys(headers)
  for (var i = 0; i < headerKeys.length; i++) {
    var currentKey = headerKeys[i],
      currentKeyLowerCase = headerKeys[i].toLowerCase()

    for (var j = 0; j < forbiddenHeaders.length; j++)
      if (currentKeyLowerCase === forbiddenHeaders[j])
        headersToRemove.push(currentKey)

    for (var j = 0; j < forbiddenHeadersSubstrings.length; j++)
      if (currentKeyLowerCase.includes(forbiddenHeadersSubstrings[j]))
        headersToRemove.push(currentKey)
  }

  for (var i = 0; i < headersToRemove.length; i++)
    delete headers[headersToRemove[i]]

  return headers
}

module.exports = { byteToString, validTextTypes, log, sanitizeHeaders }
