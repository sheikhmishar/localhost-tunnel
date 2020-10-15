import loadScripts from '../lib/asyncScriptsLoader'

const scriptUrls = ['/io/socket.io.js', '/axios.min.js']
const callback = () => import('./js').then()

loadScripts(scriptUrls, callback)
