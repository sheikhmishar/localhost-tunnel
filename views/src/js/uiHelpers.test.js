import { generateHyperlink, logWrapper, appendLog } from './uiHelpers'

const { assert } = chai

describe(__filename, () => {
  describe('Method: generateHyperlink', () => {
    it('should return \'<a href="http://localhost" target="_blank" class="badge badge-info">http://localhost</a>\'', () => {
      assert.deepEqual(
        generateHyperlink('http://localhost'),
        '<a href="http://localhost" target="_blank" class="badge badge-info">http://localhost</a>'
      )
    })
    it('should return \'<a href="https://tunnel.me/something" target="_blank" class="badge badge-info">https://tunnel.me/something</a>\'', () => {
      assert.deepEqual(
        generateHyperlink('https://tunnel.me/something'),
        '<a href="https://tunnel.me/something" target="_blank" class="badge badge-info">https://tunnel.me/something</a>'
      )
    })
  })
  describe('Method: appendLog', () => {
    it('should append log', () => {
      assert.deepEqual(appendLog('hi'), logWrapper.firstChild)
    })
  })
})
