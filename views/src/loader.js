import loadScripts from '../lib/asyncScriptsLoader'

const scriptUrls = ['./sock/socket.io.js', './axios.min.js']
const callback = () => import('./js').then()

loadScripts(scriptUrls, callback)
