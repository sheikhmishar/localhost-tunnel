/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:middlewares:formdata')
const concatStream = require('concat-stream')
const { is } = require('type-is')
const Busboy = require('busboy')

/** @type {Express.RequestHandler} */
const formDataParser = (req, _, next) => {
  if (!is(req.get('Content-Type'), ['multipart'])) return next()

  req.body = req.body || {}

  req.files = []
  const busboy = new Busboy({ headers: req.headers })

  /** @param {Error} error */
  const drainAll = error => {
    req.unpipe(busboy)
    busboy.removeAllListeners()

    req.files = error ? [] : req.files

    req.on('data', chunk => debug('drain', chunk))
    req.on('end', () => debug('drain end'))
    req.on('readable', req.read.bind(req))

    next(error)
  }

  const onFile = (fieldname, fstream, filename, encoding, mimetype) => {
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
      req.files.push(file)
    })
    fstream.pipe(buffer)

    fstream.on('data', data => debug('fstream', filename, data.length, 'B'))
    fstream.on('end', () => debug('fstream', filename, 'DONE'))
    fstream.on('error', drainAll)
  }

  const onField = (fieldname, value) => (req.body[fieldname] = value)

  busboy.on('error', drainAll)
  busboy.on('field', onField)
  busboy.on('file', onFile)
  busboy.on('finish', drainAll)
  req.pipe(busboy)
}

module.exports = formDataParser
