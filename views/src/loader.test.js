import loadScripts from '../lib/asyncScriptsLoader'

const scriptUrls = [
  '/chai.js',
  '/mocha/mocha.js',
  '/sock/socket.io.js',
  '/axios.min.js'
]
const callback = () => import('./js/index.test').then()

loadScripts(scriptUrls, callback) // TODO: add inline
