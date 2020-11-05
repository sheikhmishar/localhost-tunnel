/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

import loadScripts from '../lib/asyncScriptsLoader'

const scriptUrls = ['/socket.io.js', '/axios.min.js']
const callback = () => import('./js').then()

loadScripts(scriptUrls, callback)
