/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

const { expect } = require('chai')
const BigNumber = require('bignumber.js')
const assert = require('assert')

const PerformanceManager = require('../src/PerformanceManager')
const PriceFeed = require('../src/PriceFeed')

describe('PerformanceManager', () => {
  const priceFeed = new PriceFeed({ initialPrice: 35000 })
  const mts = Date.now()
  const constraints = {
    maxPositionSize: 1,
    allocation: 13000
  }

  describe('position management', () => {
    const pos = new PerformanceManager(priceFeed, constraints)

    it('clean', () => {
      expect(pos.positionSize().toNumber()).to.eq(0)
      expect(pos.currentAllocation().toNumber()).to.eq(0)
      expect(pos.peak.toNumber()).to.eq(13000)
      expect(pos.trough.toNumber()).to.eq(13000)
      expect(pos.availableFunds.toNumber()).to.eq(13000)
      expect(pos.equityCurve().toNumber()).to.eq(13000)
      expect(pos.return().toNumber()).to.eq(0)
      expect(pos.returnPerc().toNumber()).to.eq(0)
      expect(pos.drawdown().toNumber()).to.eq(0)
    })

    it('add orders', (done) => {
      pos.addOrder('0.1', '35000')

      pos.addOrder('0.1', '37089.17')
      priceFeed.update('37089.17', mts, true)

      pos.addOrder('0.1', '40229.09')
      priceFeed.update('40229.09', mts, true)

      pos.addOrder('0.04709128732', '37547.71')
      priceFeed.update('37547.71', mts, true)

      setImmediate(() => {
        expect(pos.positionSize().toFixed(2)).to.eq('0.35')
        expect(pos.currentAllocation().toFixed(2)).to.eq('13000.00')
        expect(pos.peak.toFixed(2)).to.eq('13963.17')
        expect(pos.trough.toFixed(2)).to.eq('12791.08')
        expect(pos.availableFunds.toFixed(2)).to.eq('0.00')
        expect(pos.equityCurve().toFixed(2)).to.eq('13032.49')
        expect(pos.return().toFixed(2)).to.eq('32.49')
        expect(pos.returnPerc().toFixed(4)).to.eq('0.0025')
        expect(pos.drawdown().toFixed(4)).to.eq('0.0581')
        done()
      })
    })

    it('update price', (done) => {
      priceFeed.update('34955.37', mts, true)

      setImmediate(() => {
        expect(pos.equityCurve().toFixed(2)).to.eq('12132.71')
        expect(pos.return().toFixed(2)).to.eq('-867.29')
        expect(pos.returnPerc().toFixed(4)).to.eq('-0.0667')
        expect(pos.drawdown().toFixed(4)).to.eq('0.1232')
        done()
      })
    })

    it('sell all', () => {
      pos.addOrder(pos.positionSize().negated(), '32177.86')

      expect(pos.positionSize().toFixed(2)).to.eq('0.00')
      expect(pos.currentAllocation().toFixed(2)).to.eq('0.00')
      expect(pos.availableFunds.toFixed(2)).to.eq('11168.66')
      expect(pos.equityCurve().toFixed(2)).to.eq('11168.66')
      expect(pos.return().toFixed(2)).to.eq('-1831.34')
      expect(pos.returnPerc().toFixed(4)).to.eq('-0.1409')
      expect(pos.drawdown().toFixed(4)).to.eq('0.1928')
    })

    it('try to over-sell', () => {
      try {
        pos.addOrder(-1, '32177.86')
        assert.fail()
      } catch (e) {
        expect(e.message).to.eq('short positions are not supported in this version')
      }
    })
  })

  describe('add orders', () => {
    it('partial sell', () => {
      const pos = new PerformanceManager(priceFeed, constraints)
      const price = 1000

      pos.addOrder(0.3, price)

      pos.addOrder(0.7, price)

      pos.addOrder(-0.5, price)

      expect(pos.positionSize().toNumber()).to.eq(0.5)
    })
  })

  describe('can open order', () => {
    const pos = new PerformanceManager(priceFeed, constraints)

    it('order is valid', () => {
      const amount = 0.5
      const price = 500
      const err = pos.canOpenOrder(amount, price)

      expect(err).to.be.null
    })

    it('max size exceeded', () => {
      const amount = 4
      const price = 500
      const err = pos.canOpenOrder(amount, price)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.eq('order size exceeds maximum position size (order amount: 4, current size: 0, max size: 1)')
    })

    it('max alloc exceeded', () => {
      const amount = 0.5
      const price = 50000
      const err = pos.canOpenOrder(amount, price)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.eq('the order exceeds the allocation limit (order size: 0.5, allocated: 0, limit: 13000)')
    })

    it('total is greater than the available funds', () => {
      const amount = 0.5
      const price = 3000

      const pos = new PerformanceManager(priceFeed, constraints)
      pos.availableFunds = new BigNumber(500)
      const err = pos.canOpenOrder(amount, price)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.eq('the order exceeds available funds (order size: 1500, available funds: 500)')
    })

    it('short not allowed', () => {
      const amount = -0.5
      const price = 50000
      const pos = new PerformanceManager(priceFeed, constraints)
      const err = pos.canOpenOrder(amount, price)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.eq('short positions are not allowed in this version')
    })
  })

  describe('equity curve', () => {
    const priceFeed = new PriceFeed()
    const pos = new PerformanceManager(priceFeed, constraints)

    it('it should return available funds if price is not loaded', () => {
      const equityCurve = pos.equityCurve()

      expect(equityCurve).to.be.eq(pos.availableFunds)
    })
  })
})
