/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const express = require('express')
const path = require('path')
const multer = require('multer')().any()
const formDataParser = require('../middlewares/formdata-parser')
const textParser = require('../middlewares/text-parser')
const { handleTunneling, testTunnel, validateUsername } = require('../tunnel')

const router = express.Router(),
  urlencoded = express.urlencoded({ extended: true }),
  json = express.json()

if (process.env.NODE_ENV !== 'production') {
  const testDir = path.join(__dirname, '../../views/build/test')
  const mochaDir = path.join(__dirname, '../../node_modules/mocha')
  router.get('/test', (_, res) =>
    res.sendFile(path.join(testDir, 'index.test.html'))
  )
  router.use('/test', express.static(testDir))
  router.use('/mocha', express.static(mochaDir))
}

router.get('/ping', (_, res) =>
  res.status(200).json({ message: 'Server alive' })
)

router.all('/:username/*', textParser, formDataParser, handleTunneling)

// test loopback route
router.all('/testtunnel', json, urlencoded, multer, textParser, testTunnel)
// router.all('/testtunnel', formDataParser, testTunnel)

router.post('/validateusername', json, validateUsername)

module.exports = router
