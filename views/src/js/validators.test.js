import {
  containsFormdata,
  inputHasErrors,
  validateUsername
} from './validators'
import { portInput, usernameInput } from './uiHelpers'

const { assert } = chai

describe(__filename, () => {
  describe('Method: containsFormdata', () => {
    it("should return true on 'content-type': 'multipart/form-data'", () => {
      const res = containsFormdata({ 'content-type': 'multipart/form-data' })
      assert.ok(res)
    })
    it("should return true on 'content-type': 'x-urlencoded-multipart/form-data'", () => {
      const res = containsFormdata({
        'content-type': 'x-urlencoded-multipart/form-data'
      })
      assert.ok(res)
    })
    it("should return false on 'content-type': 'multipart'", () => {
      const res = containsFormdata({ 'content-type': 'multipart' })
      assert.ok(!res)
    })
  })
  describe('Method: inputHasErrors', () => {
    it("should return string on empty username and port", async () => {
      portInput.value = ''
      usernameInput.value = ''
      const errors = await inputHasErrors()
      assert.ok(errors)
    })
  })
})
