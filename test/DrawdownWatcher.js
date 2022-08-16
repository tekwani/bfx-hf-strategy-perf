/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { stub, assert } = require('sinon')

const PerformanceManager = require('../src/PerformanceManager')
const DrawdownWatcher = require('../src/DrawdownWatcher')
const PriceFeed = require('../src/PriceFeed')

describe('DrawdownWatcher', () => {
  const priceFeed = new PriceFeed({ initialPrice: 1000 })
  const mts = Date.now()

  const pos = new PerformanceManager(priceFeed, {
    maxPositionSize: 10,
    allocation: 1000
  })

  it('should emit stop event', (done) => {
    const watcher = new DrawdownWatcher(pos, 0.2)
    watcher.start()
    watcher.abortStrategy = stub()

    pos.addOrder(1, 1000)

    priceFeed.update(1500, mts, true)
    priceFeed.update(800, mts, true)

    setImmediate(() => {
      assert.called(watcher.abortStrategy)
      watcher.close()
      done()
    })
  })
})
