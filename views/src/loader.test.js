import loadScripts from '../lib/asyncScriptsLoader'

const scriptUrls = [
  '/chai.js',
  '/mocha/mocha.js',
  /** @type {import('../lib/asyncScriptsLoader').scriptObject} */
  ({
    innerHTML: /*js*/ `
      mocha.cleanReferencesAfterRun(false)
      mocha.setup('bdd')
      mocha.checkLeaks()
    `
  }),
  '/sock/socket.io.js',
  '/axios.min.js'
]
const callback = () => import('./js/index.test').then()

loadScripts(scriptUrls, callback)
