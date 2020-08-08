const express = require('express')
const router = express.Router()
const urlencoded = express.urlencoded({ extended: true })
const { json } = express
const multer = require('multer')().any()
const helpers = require('../helpers')
const {
  handleTunneling,
  testTunnel,
  validateUsername
} = require('../controllers/tunnel')

const { is } = require('type-is')
const { log, validTextTypes } = helpers
const textParser = (req, res, next) => {
  if (
    Object.keys(req.body).length ||
    !is(req.get('Content-Type'), validTextTypes)
  )
    return next()

  let chunks = ''
  req.setEncoding('utf8')
  req.on('data', chunk => (chunks += chunk)) // TODO: big text via stream
  req.on('end', () => {
    req.body = chunks // TODO: attach nothing to body, instead stream
    next()
  })
  req.on('error', error => next(error))
}

const Busboy = require('busboy')
const concatStream = require('concat-stream')
const formDataParser = (req, res, next) => {
  if (!is(req.get('Content-Type'), ['multipart'])) return next()

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
router.all('/:username/*', textParser, formDataParser, handleTunneling)

// test loopback route
router.all('/testtunnel', json(), urlencoded, multer, textParser, testTunnel)

router.post('/validateusername', json(), validateUsername)

module.exports = router
