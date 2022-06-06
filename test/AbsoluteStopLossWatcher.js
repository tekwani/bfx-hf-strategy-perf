/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { stub, assert } = require('sinon')

const PerformanceManager = require('../src/PerformanceManager')
const AbsoluteStopLossWatcher = require('../src/AbsoluteStopLossWatcher')
const PriceFeed = require('../src/PriceFeed')

describe('AbsoluteStopLossWatcher', () => {
  it('should emit stop event', (done) => {
    const priceFeed = new PriceFeed(1000)
    const pos = new PerformanceManager(priceFeed, {
      maxPositionSize: 10,
      allocation: 1000
    })
    const watcher = new AbsoluteStopLossWatcher(pos, 100)
    watcher.start()
    watcher.abortStrategy = stub()

    pos.addOrder(1, 1000)

    priceFeed.update(800)

    setImmediate(() => {
      assert.called(watcher.abortStrategy)
      watcher.close()
      done()
    })
  })
})
