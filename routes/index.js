const express = require('express'),
  router = express.Router(),
  urlencoded = express.urlencoded({ extended: true }),
  { json } = express,
  multer = require('multer')().any(),
  formDataParser = require('../middlewares/formdata-parser'),
  textParser = require('../middlewares/text-parser'),
  {
    handleTunneling,
    testTunnel,
    validateUsername
  } = require('../controllers/tunnel')

router.all('/:username/*', textParser, formDataParser, handleTunneling)

// test loopback route
router.all('/testtunnel', json(), urlencoded, multer, textParser, testTunnel)
// router.all('/testtunnel', formDataParser, testTunnel)

router.post('/validateusername', json(), validateUsername)

module.exports = router
