/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

import { serverURL, serverProtocol, maxLogLength, noSubdomain } from './constants'

// HTML elements
const dummy = document.createElement('div')

export const usernameInput = document.getElementById('username-input') || dummy,
  portInput = document.getElementById('port-input') || dummy,
  tunnelToggleButton = document.getElementById('tunnel-toggle-button') || dummy,
  logWrapper = document.getElementsByClassName('log-wrapper')[0] || dummy

/**
 * @param {Axios.ProgressEvent} e
 * @param {string} url
 */
export const printAxiosProgress = (e, url) => {
  const { loaded, total, lengthComputable } = e

  e.target.start = e.target.end ? e.target.end : 0
  e.target.end = loaded

  const { start, end, responseURL } = e.target,
    percent = lengthComputable ? Math.round((loaded * 100) / total) : 101,
    type = responseURL ? 'UPLOAD' : 'DOWNLOAD'

  console.log(type, url, start, end, percent, '%')
  /* TODO: get chunked response using fetch API.
			 Then if success, send 'DONE' to end stream via socket */
}

/** @param {string} url */
export const generateHyperlink = url =>
  `<a href="${url}" target="_blank" class="badge badge-info">${url}</a>`

export const disableInputs = () => {
  usernameInput.setAttribute('disabled', 'true')
  portInput.setAttribute('disabled', 'true')
}

export const enableInputs = () => {
  usernameInput.removeAttribute('disabled')
  portInput.removeAttribute('disabled')
}

/** @param {boolean} isTunnelling */
export const refreshTunnelStatus = isTunnelling => {
  // TODO: Permanently view current tunnel address
  if (isTunnelling) {
    const tunnelLink = generateHyperlink(
      noSubdomain
        ? `${serverProtocol}//${serverURL}/${usernameInput.value}/`
        : `${serverProtocol}//${usernameInput.value}.${serverURL}/`
    )
    appendLog(`Tunnel is running at port ${portInput.value}`)
    appendLog(`Your localhost is now available at ${tunnelLink}`)
    tunnelToggleButton.innerText = 'Stop tunneling'
  } else {
    appendLog('Tunnel is stopped')
    tunnelToggleButton.innerText = 'Start tunneling'
  }
}

/** @param {string} log */
export const appendLog = log => {
  const newDomElement = document.createElement('h6')
  newDomElement.setAttribute('class', 'text-primary')
  newDomElement.innerHTML = log
  logWrapper.prepend(newDomElement)

  if (logWrapper.childElementCount > maxLogLength) logWrapper.lastChild.remove()

  return newDomElement
}
