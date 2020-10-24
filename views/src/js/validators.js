/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

import { portInput, usernameInput } from './uiHelpers'
import { validatorURL } from './constants'

/** @param {string} username */
export const validateUsername = async username => {
  try {
    const res = await axios.post(validatorURL, { username })
    return res.data.isValidUsername
  } catch (e) {
    return false
  }
}

export const inputHasErrors = async () => {
  const port = portInput.value,
    username = usernameInput.value
  if (port.length < 2)
    return 'Port must contain 2 digits minimum and number only'
  else if (port[0] === '0') return 'Port cannot start with 0'
  else if (username.length <= 0) return 'Username length must be at least 1'
  else if (username.includes('/')) return 'Username cannot have /'
  else if (username.includes('.')) return 'Username cannot have .'
  else if (username.includes('"')) return 'Username cannot have "'
  else if (username.includes("'")) return "Username cannot have '"
  else if (!(await validateUsername(username)))
    return 'Username exists or connection error'
  return false
}

/** @param {IncomingHttpHeaders} headers */
export const containsFormdata = headers =>
  (headers['content-type'] &&
    headers['content-type'].includes('multipart/form-data')) ||
  (headers['Content-Type'] &&
    headers['Content-Type'].includes('multipart/form-data'))
