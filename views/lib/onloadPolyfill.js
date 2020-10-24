/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

/** @param {HTMLScriptElement | Window} elem
 *  @param {() => any} callback */
const setOnLoad = (elem, callback) => {
  if (elem.readyState) {
    const isScriptReady =
      elem.readyState === 'loaded' || elem.readyState === 'complete'
    elem.onreadystatechange = () => {
      if (isScriptReady) {
        elem.onreadystatechange = null
        callback()
      }
    }
  } else elem.onload = callback
}

export default setOnLoad
