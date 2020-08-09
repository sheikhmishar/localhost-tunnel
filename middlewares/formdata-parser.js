const concatStream = require('concat-stream')
const { log } = require('../helpers')
const { is } = require('type-is')
const Busboy = require('busboy')

const formDataParser = (req, res, next) => {
  if (!is(req.get('Content-Type'), ['multipart'])) return next()

  req.body = req.body || {}

  const files = []
  const busboy = new Busboy({ headers: req.headers })
  busboy.on('error', error => next(error))
  busboy.on('field', (fieldname, value) => (req.body[fieldname] = value))
  busboy.on('file', (fieldname, fstream, filename, encoding, mimetype) => {
    if (!filename) return fstream.resume()

    const file = {
      fieldname,
      originalname: filename, // TODO: filename
      encoding,
      mimetype
    }

    // TODO: remove and directly stream
    const buffer = concatStream({ encoding: 'buffer' }, concatedBuffer => {
      fstream.unpipe(buffer)
      file.buffer = concatedBuffer
      file.size = concatedBuffer.length
      files.push(file)
    })
    fstream.pipe(buffer)

    fstream.on('data', data => log('fstream', filename, data.length, 'B'))
    fstream.on('end', () => true)
    fstream.on('error', error => next(error))
  })
  busboy.on('finish', () => {
    req.unpipe(busboy)
    busboy.removeAllListeners()

    req.files = files

    req.on('data', chunk => log('drain', chunk))
    req.on('end', () => log('drain end'))
    // req.on('readable', req.read.bind(req)) // TODO: possibly drain

    next()
  })
  req.pipe(busboy)
}

module.exports = formDataParser
