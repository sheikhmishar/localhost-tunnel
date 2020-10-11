import setOnLoad from '../lib/onloadPolyfill'

// Load external JS/CSS from CDN
/**
 * @param {string[]} urls
 * @param {() => any} callback
 */
const loadScripts = (urls, callback) => {
  const bodyTag = document.getElementsByTagName('body')[0]

  let index = 0,
    totalScriptsLoaded = 0

  /** @param {string} url */
  const loadScript = url => {
    if (index >= urls.length && totalScriptsLoaded === urls.length)
      return callback()

    const script = document.createElement('script')
    script.defer = true
    script.type = 'text/javascript'
    script.src = url

    setOnLoad(script, () => {
      totalScriptsLoaded++
      loadScript(urls[index++])
    })

    bodyTag.append(script)
  }

  loadScript(urls[index++])
}

export default loadScripts
