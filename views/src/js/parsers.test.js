import { objectToArrayBuffer, parseRangeHeader } from './parsers'

const { assert } = chai

describe(__filename, () => {
  describe('Method: objectToArrayBuffer', () => {
    it("should return '123,125'", () => {
      const view = new Uint8Array(objectToArrayBuffer({}))
      assert.deepEqual(view.toString(), '123,125')
    })
    it("should return '123,34,107,101,121,34,58,34,118,97,108,117,101,34,125'", () => {
      const view = new Uint8Array(objectToArrayBuffer({ key: 'value' }))
      assert.deepEqual(
        view.toString(),
        '123,34,107,101,121,34,58,34,118,97,108,117,101,34,125'
      )
    })
    it("should return '91,123,34,107,101,121,34,58,34,118,97,108,117,101,34,125,93'", () => {
      const view = new Uint8Array(objectToArrayBuffer([{ key: 'value' }]))
      assert.deepEqual(
        view.toString(),
        '91,123,34,107,101,121,34,58,34,118,97,108,117,101,34,125,93'
      )
    })
  })
  describe('Method: parseRangeHeader', () => {
    it("should return '127,128'", () => {
      const [rangeStart, rangeEnd] = parseRangeHeader(`bytes=127-128`)
      assert.deepEqual(rangeStart, 127)
      assert.deepEqual(rangeEnd, 128)
    })
    it("should return '127,NaN'", () => {
      const [rangeStart, rangeEnd] = parseRangeHeader(`bytes=127-`)
      assert.deepEqual(rangeStart, 127)
      assert.deepEqual(rangeEnd, NaN)
    })
  })
})
