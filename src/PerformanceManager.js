const EventEmitter = require('events')
const BigNumber = require('bignumber.js')

class PerformanceManager extends EventEmitter {
  /**
   * @param priceFeed
   * @param maxPositionSize
   * @param allocation
   */
  constructor (priceFeed, {
    maxPositionSize,
    allocation
  }) {
    super()
    if (!allocation) {
      throw new Error('Capital Allocation is mandatory')
    }

    this.maxPositionSize = maxPositionSize && new BigNumber(maxPositionSize)
    this.allocation = new BigNumber(allocation)
    this.availableFunds = new BigNumber(allocation)
    this.priceFeed = priceFeed

    this.peak = new BigNumber(allocation)
    this.trough = new BigNumber(allocation)
    this.openOrders = []

    priceFeed.on('update', this.selfUpdate.bind(this))
  }

  /**
   * @param amount
   * @param price
   * @param leverage
   * @returns {Error|null}
   */
  canOpenOrder (amount, price, leverage) {
    amount = new BigNumber(amount)
    price = new BigNumber(price)

    if (amount.isZero()) {
      throw new Error('amount can not be zero')
    }

    const positionSize = this.positionSize()
    const newPositionSize = positionSize.plus(amount)
    if (this.maxPositionSize && newPositionSize.isGreaterThan(this.maxPositionSize)) {
      return new Error(`order size exceeds maximum position size (order amount: ${amount}, current size: ${positionSize}, max size: ${this.maxPositionSize})`)
    }

    if (newPositionSize.isNegative()) {
      return new Error('short positions are not allowed in this version')
    }

    // apply leverage to order cost calculation
    const total = leverage ? amount.multipliedBy(price).dividedBy(leverage) : amount.multipliedBy(price)

    const currentAllocation = this.currentAllocation(leverage)
    const newAllocatedCapital = currentAllocation.plus(total)
    if (newAllocatedCapital.isGreaterThan(this.allocation)) {
      return new Error(`the order exceeds the allocation limit (order size: ${amount}, allocated: ${currentAllocation}, limit: ${this.allocation})`)
    }

    if (total.isGreaterThan(this.availableFunds)) {
      return new Error(`the order exceeds available funds (order size: ${total}, available funds: ${this.availableFunds})`)
    }

    return null
  }

  /**
   * @returns {BigNumber}
   */
  positionSize () {
    return this.openOrders.reduce((size, order) =>
      size.plus(order.amount),
    new BigNumber(0)
    )
  }

  /**
   * @returns {BigNumber}
   */
  currentAllocation (leverage) {
    return this.openOrders.reduce((alloc, order) => {
      const orderCost = leverage
        ? order.amount.multipliedBy(order.price).dividedBy(leverage)
        : order.amount.multipliedBy(order.price)
      return alloc.plus(orderCost)
    },
    new BigNumber(0)
    )
  }

  addOrder (amount, price, leverage) {
    amount = new BigNumber(amount)
    price = new BigNumber(price)

    // adjust order total if there's leverage set for the order
    const total = leverage ? amount.multipliedBy(price).dividedBy(leverage) : amount.multipliedBy(price)

    if (amount.isPositive()) {
      this.availableFunds = this.availableFunds.minus(total)
      this.openOrders.push({ amount, price })
      this.selfUpdate()
      return
    }

    if (this.positionSize().isLessThan(amount.abs())) {
      throw new Error('short positions are not supported in this version')
    }

    this.availableFunds = this.availableFunds.plus(total.abs())

    while (!amount.isZero() && this.openOrders.length > 0) {
      const order = this.openOrders.shift()

      if (order.amount.isLessThanOrEqualTo(amount.abs())) {
        amount = amount.plus(order.amount)
      } else {
        order.amount = order.amount.plus(amount)
        this.openOrders.unshift(order)
        break
      }
    }

    this.selfUpdate()
  }

  /**
   * @returns {BigNumber}
   */
  equityCurve () {
    if (!this.priceFeed.price) {
      return this.availableFunds
    }
    return this.priceFeed.price.multipliedBy(this.positionSize()).plus(this.availableFunds)
  }

  /**
   * @returns {BigNumber}
   */
  return () {
    return this.equityCurve().minus(this.allocation)
  }

  /**
   * @returns {BigNumber}
   */
  returnPerc () {
    return this.return().dividedBy(this.allocation)
  }

  /**
   * @returns {BigNumber}
   */
  drawdown () {
    const equityCurve = this.equityCurve()
    if (equityCurve.isGreaterThanOrEqualTo(this.peak) || this.peak.isZero()) {
      return new BigNumber(0)
    }
    return this.peak.minus(equityCurve).dividedBy(this.peak)
  }

  /**
   * @private
   */
  selfUpdate () {
    this.updatePeak()
    this.updateTrough()
    this.emit('update')
  }

  /**
   * @private
   */
  updatePeak () {
    const equityCurve = this.equityCurve()
    if (equityCurve.isGreaterThan(this.peak)) {
      this.peak = equityCurve
    }
  }

  /**
   * @private
   */
  updateTrough () {
    const equityCurve = this.equityCurve()
    if (equityCurve.isLessThan(this.trough) || this.trough.isZero()) {
      this.trough = equityCurve
    }
  }

  close () {
    this.removeAllListeners()
  }
}

module.exports = PerformanceManager
