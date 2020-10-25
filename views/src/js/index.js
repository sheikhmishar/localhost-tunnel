/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

import setOnLoad from '../../lib/onloadPolyfill'
import {
  isLocalhostRoot,
  noSubdomain,
  maxStreamSize,
  serverProtocol,
  serverURL,
  socketTunnelURL,
  socketWatchURL,
  streamChunkSize
} from './constants'
import { objectToArrayBuffer, parseRangeHeader } from './parsers'
import { responseSizeCache } from './state'
import {
  appendLog,
  disableInputs,
  enableInputs,
  generateHyperlink,
  portInput,
  printAxiosProgress,
  refreshTunnelStatus,
  tunnelToggleButton,
  usernameInput // TODO: random username
} from './uiHelpers'
import { containsFormdata, inputHasErrors } from './validators'

// State variables
let isTunnelling = false
/** @type {SocketIOClient.Socket} */
let socket

// Helper functions
const intitiateSocket = () => {
  socket = io.connect(socketTunnelURL, { path: '/sock' })
  socket.on('connect', () => socket.emit('username', usernameInput.value))
  socket.on('request', tunnelLocalhostToServer)
}

// FIXME: breaks while using reverse proxy
/** @param {LocalhostTunnel.ClientRequest} serverRequest */
const preProcessContentRange = serverRequest => {
  const {
    path,
    headers: { range }
  } = serverRequest

  if (range) {
    const [rangeStart, rangeEnd] = parseRangeHeader(range)

    const maxRange = rangeStart + streamChunkSize
    const safeRange = Math.min(
      maxRange,
      responseSizeCache[path] - 1 || maxRange
    )

    if (rangeEnd) {
      if (rangeEnd > safeRange) {
        const newRange = `bytes=${rangeStart}-${safeRange}`
        serverRequest.headers.range = newRange
      }
    } else serverRequest.headers.range += safeRange
  }
  return serverRequest
}

/** @param {LocalhostTunnel.ClientRequest} serverRequest
 * @returns {Promise<LocalhostTunnel.ClientRequest>} */
const preprocessRequest = serverRequest =>
  new Promise(resolve => {
    serverRequest = preProcessContentRange(serverRequest)
    const { headers, requestId: formadataId } = serverRequest
    if (!containsFormdata(headers)) return resolve(serverRequest)

    /** @type {Express.Multer.File[]} */
    const receivedFiles = []
    // , i = 0

    /** @param {Express.Multer.File} file */
    const socketOnFileReceived = file => {
      if (file.data && file.data === 'DONE') {
        socket.removeAllListeners(formadataId)
        serverRequest.files = receivedFiles
        // i++

        return resolve(serverRequest)
      }

      receivedFiles.push(file)

      // TODO: chunk push and add acknowledgement delay
      // if (file.buffer) appendBuffer(receivedFiles[i].buffer, file.buffer)
      // else {
      //   receivedFiles[i] = file
      //   receivedFiles[i].buffer = new ArrayBuffer(file.size)
      // }
    }

    // TODO: add timer and garbage collect
    socket.on(formadataId, socketOnFileReceived)
  })

/** @param {LocalhostTunnel.ClientRequest} req */
const makeRequestToLocalhost = req => {
  const { path, body, headers, method } = req
  const url = `${serverProtocol}//localhost:${portInput.value}${path}`

  /** @type {Axios.data} */
  const data = containsFormdata(headers) ? getFormdata(req) : body

  /** @type {Axios.RequestConfig} */
  const requestParameters = {
    headers,
    method,
    url,
    data,
    withCredentials: true,
    validateStatus: _ => true,
    responseType: 'arraybuffer'
  }

  if (isLocalhostRoot)
    requestParameters.onUploadProgress = requestParameters.onDownloadProgress = e =>
      printAxiosProgress(e, url)

  return axios(requestParameters)
}

/** @param {LocalhostTunnel.ClientRequest} clientRequest */
async function tunnelLocalhostToServer(clientRequest) {
  clientRequest = await preprocessRequest(clientRequest)

  const { path, requestId: responseId } = clientRequest

  try {
    const localhostResponse = await makeRequestToLocalhost(clientRequest)

    const { status, config } = localhostResponse
    const method = config.method.toUpperCase()
    const url = generateHyperlink(config.url)
    const tunnelUrl = generateHyperlink(
      noSubdomain
        ? `${serverProtocol}//${serverURL}/${usernameInput.value}${path}`
        : `${serverProtocol}//${usernameInput.value}.${serverURL}${path}`
    )
    appendLog(`${method} ${status} ${url} -> ${tunnelUrl}`)
    sendResponseToServer(localhostResponse, responseId)
  } catch (e) {
    if (isLocalhostRoot)
      console.error('AXIOS RES ERROR', e, JSON.parse(JSON.stringify(e)))

    const { message = '505 Client Error', config = {} } = e
    sendResponseToServer(
      {
        status: 505,
        statusText: message,
        config: config,
        headers: clientRequest.headers,
        data: objectToArrayBuffer({ message })
      },
      responseId
    )
  }
}

/**
 * @param {Axios.Response} localhostResponse
 * @param {string} responseId
 */
function sendResponseToServer(localhostResponse, responseId) {
  const {
    status,
    headers,
    data,
    config: {
      url,
      headers: { range }
    }
  } = localhostResponse

  const dataByteLength = data.byteLength,
    path = url.replace(`${serverProtocol}//localhost:${portInput.value}`, '')

  if (status === 200) {
    responseSizeCache[path] = dataByteLength
  }
  // PARTIAL CONTENT
  else if (status === 206) {
    const [startByte, endByte] = parseRangeHeader(range)
    const originalSize = responseSizeCache[path] || maxStreamSize
    headers['accept-ranges'] = 'bytes'
    headers['content-range'] = `bytes ${startByte}-${endByte}/${originalSize}`

    // FIXME: Download accelerators cannot open more than one connections
  }
  // TODO: REDIRECT ON FETCH API
  else if ([301, 302, 303, 307, 308].includes(status)) {
  }

  socket.emit(responseId, { status, headers, dataByteLength })

  const totalChunks = Math.ceil(dataByteLength / streamChunkSize)
  let startByte = 0,
    endByte = 0,
    chunk = new ArrayBuffer(0),
    i = 0

  /** @param {boolean} continues */
  const sendChunkedResponse = continues => {
    if (!continues || i === totalChunks) {
      // TODO: verify garbage collection
      for (let key in localhostResponse) {
        localhostResponse[key] = null
        delete localhostResponse[key]
      }
      localhostResponse = null

      if (isLocalhostRoot) {
        if (continues) console.debug('STOPPED BEFORE SERVER', url)
        else console.debug('STOP UPLOAD FROM SERVER SIGNAL', url)
      }

      socket.emit(responseId, { data: 'DONE' })
      return socket.removeAllListeners(responseId)
    }

    if (isLocalhostRoot) console.debug('UPLOAD TO SERVER', url, i)

    startByte = i * streamChunkSize
    endByte = startByte + streamChunkSize
    chunk = data.slice(startByte, endByte)

    socket.emit(responseId, { data: chunk })

    i++
  }
  socket.on(responseId, sendChunkedResponse)
}

/** @param {LocalhostTunnel.ClientRequest} req */
function getFormdata(req) {
  const fieldNames = Object.keys(req.body)
  let fieldName, file, mime, fileName

  const data = new FormData()
  for (let i = 0; i < fieldNames.length; i++) {
    fieldName = fieldNames[i]
    data.append(fieldName, req.body[fieldName])
  }

  for (let i = 0; i < req.files.length; i++) {
    file = req.files[i]
    fieldName = file.fieldname
    mime = file.mimetype
    fileName = file.originalname
    data.append(fieldName, new Blob([file.buffer], { type: mime }), fileName)
  }

  return data
}

// UI helper functions

function toggleTunnel() {
  if (isTunnelling) socket.disconnect()
  else intitiateSocket()

  isTunnelling = !isTunnelling
  refreshTunnelStatus(isTunnelling)
}

/** @param {Event} e */
async function onButtonClick(e) {
  e.preventDefault()

  if (isTunnelling) {
    toggleTunnel()
    enableInputs()
  } else {
    const error = await inputHasErrors()
    if (error) appendLog(error)
    else {
      toggleTunnel()
      disableInputs()
    }
  }
}

// main
setOnLoad(window, () => {
  refreshTunnelStatus(false)
  tunnelToggleButton.addEventListener('click', onButtonClick) // TODO: polyfill

  // if currently in localhost root, refresh page on file change
  if (isLocalhostRoot)
    io.connect(socketWatchURL, { path: '/sock' }).on('refresh', () =>
      location.reload()
    )
})

export default {}
