/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

import setOnLoad from '../lib/onloadPolyfill'

/** @typedef {{innerHTML?: string, url?: string} | string} scriptObject */

const bodyTag = document.getElementsByTagName('body')[0]

/** @param {scriptObject} scriptObject  */
export const attachScriptElem = scriptObject => {
  const script = document.createElement('script')
  script.type = 'text/javascript'

  if (typeof scriptObject === 'string') {
    script.defer = true
    script.src = scriptObject
  } else script.innerHTML = scriptObject.innerHTML

  bodyTag.append(script)

  return script
}

// Load external JS/CSS
/**
 * @param {scriptObject[]} scripts
 * @param {() => any} callback
 */
const loadScripts = (scripts, callback) => {
  let index = 0, //
    totalScriptsLoaded = 0

  /** @param {scriptObject} scriptObject */
  const loadScript = scriptObject => {
    if (index >= scripts.length && totalScriptsLoaded === scripts.length)
      return callback()

    const script = attachScriptElem(scriptObject) // TODO: onload

    if (script.src)
      setOnLoad(script, () => {
        totalScriptsLoaded++
        loadScript(scripts[index++])
      })
    else {
      totalScriptsLoaded++
      loadScript(scripts[index++])
    }
  }

  loadScript(scripts[index++])
}

export default loadScripts
