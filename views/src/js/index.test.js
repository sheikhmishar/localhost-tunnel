import './parsers.test'
import './uiHelpers.test'
import './validators.test'

const { assert } = chai

const rep = __filename.substring(0, __filename.indexOf('server')) + 'server'
const relFile = __filename.replace(rep, '')

describe(relFile, () => it('it', () => assert.deepEqual(12, 12)))

mocha.run()
