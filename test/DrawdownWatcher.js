/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { stub, assert } = require('sinon')
const BigNumber = require('bignumber.js')

const PerformanceManager = require('../src/PerformanceManager')
const DrawdownWatcher = require('../src/DrawdownWatcher')
const PriceFeed = require('../src/PriceFeed')

describe('DrawdownWatcher', () => {
  it('should emit stop event', (done) => {
    const priceFeed = new PriceFeed(new BigNumber(1000))
    const pos = new PerformanceManager(priceFeed, {
      maxPositionSize: new BigNumber(10),
      allocation: new BigNumber(1000)
    })
    const watcher = new DrawdownWatcher(pos, new BigNumber(0.2))
    watcher.start()
    watcher.abortStrategy = stub()

    pos.addOrder({
      amount: new BigNumber(1),
      price: new BigNumber(1000)
    })

    priceFeed.update(new BigNumber(1500))
    priceFeed.update(new BigNumber(800))

    setImmediate(() => {
      assert.called(watcher.abortStrategy)
      watcher.close()
      done()
    })
  })
})
