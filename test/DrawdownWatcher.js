/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { stub, assert } = require('sinon')

const PerformanceManager = require('../src/PerformanceManager')
const DrawdownWatcher = require('../src/DrawdownWatcher')
const PriceFeed = require('../src/PriceFeed')

describe('DrawdownWatcher', () => {
  it('should emit stop event', (done) => {
    const priceFeed = new PriceFeed(1000)
    const pos = new PerformanceManager(priceFeed, {
      maxPositionSize: 10,
      allocation: 1000
    })
    const watcher = new DrawdownWatcher(pos, 0.2)
    watcher.start()
    watcher.abortStrategy = stub()

    pos.addOrder(1, 1000)

    priceFeed.update(1500)
    priceFeed.update(800)

    setImmediate(() => {
      assert.called(watcher.abortStrategy)
      watcher.close()
      done()
    })
  })
})
