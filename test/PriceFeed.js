/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { expect } = require('chai')

const PriceFeed = require('../src/PriceFeed')

describe('PriceFeed', () => {
  const timeBucketSize = 500

  it('first update', (done) => {
    const price = 32000
    const mts = new Date(2022, 7, 8, 10, 0, 0, 0)

    const feed = new PriceFeed({ timeBucketSize })

    feed.once('update', (updatedPrice) => {
      expect(updatedPrice.toNumber()).to.eq(price)
      feed.close()
      done()
    })

    feed.update(price, mts.getTime())
    expect(feed.price.toNumber()).to.eq(price)
  })

  it('average the price of the current time bucket', (done) => {
    const price = 32000
    const mts = new Date(2022, 7, 8, 10, 0, 0, 0).getTime()

    const feed = new PriceFeed({ timeBucketSize })

    feed.once('update', (updatedPrice) => {
      expect(updatedPrice.toNumber()).to.eq(31952.5)
      feed.close()
      done()
    })

    feed.update(price, mts + 50)
    feed.update(price + 390, mts + 80)
    feed.update(price - 760, mts + 120)
    feed.update(price + 180, mts + 190)
  })

  it('received a most up-to-date price', (done) => {
    const price = 32000
    const mts = new Date(2022, 7, 8, 10, 0, 0, 0).getTime()

    const feed = new PriceFeed({ timeBucketSize })

    feed.once('update', (updatedPrice) => {
      expect(updatedPrice.toNumber()).to.eq(33000)
      feed.close()
      done()
    })

    feed.update(price, mts)
    feed.update(price + 1000, mts + (2 * timeBucketSize))
  })

  it('outdated mts update', (done) => {
    const price = 32000
    const mts = new Date(2022, 7, 8, 10, 0, 0, 0).getTime()

    const feed = new PriceFeed({ timeBucketSize })

    feed.once('update', (updatedPrice) => {
      expect(updatedPrice.toNumber()).to.eq(price)
      feed.close()
      done()
    })

    feed.update(price, mts)
    feed.update(price + 390, mts - (3 * timeBucketSize))
  })
})
