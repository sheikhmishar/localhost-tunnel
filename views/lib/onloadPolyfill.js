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
