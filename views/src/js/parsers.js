/** @param {Object<string, object>} object */
export const objectToArrayBuffer = object => {
  const json = JSON.stringify(object)
  let buffer = new ArrayBuffer(json.length)
  let bufferView = new Uint8Array(buffer)
  for (let i = 0; i < json.length; i++) bufferView[i] = json.charCodeAt(i)

  return buffer
}
