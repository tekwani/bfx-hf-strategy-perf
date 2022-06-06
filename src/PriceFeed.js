const EventEmitter = require('events')
const BigNumber = require('bignumber.js')

class PriceFeed extends EventEmitter {
  constructor (price = null) {
    super()
    this.price = price && new BigNumber(price)
  }

  update (price) {
    price = new BigNumber(price)
    this.price = price
    this.emit('update', price)
  }

  close () {
    this.removeAllListeners()
  }
}

module.exports = PriceFeed
