/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

/** @param {Object<string, object>} object */
export const objectToArrayBuffer = object => {
  const json = JSON.stringify(object)
  let buffer = new ArrayBuffer(json.length)
  let bufferView = new Uint8Array(buffer)
  for (let i = 0; i < json.length; i++) bufferView[i] = json.charCodeAt(i)

  return buffer
}

/** @param {string} range */
export const parseRangeHeader = range =>
  range
    .split('=')[1]
    .split('-')
    .map(range => parseInt(range))