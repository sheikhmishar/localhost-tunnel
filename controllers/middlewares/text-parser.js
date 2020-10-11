const { is } = require('type-is')
const { validTextTypes } = require('../../helpers')
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

module.exports = textParser
