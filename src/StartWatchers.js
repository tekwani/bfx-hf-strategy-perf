const DrawdownWatcher = require('./DrawdownWatcher')
const AbsoluteStopLossWatcher = require('./AbsoluteStopLossWatcher')
const PercentageStopLossWatcher = require('./PercentageStopLossWatcher')
const ExitModes = require('./ExitModes')
const BigNumber = require('bignumber.js')

const createWatchers = (performanceManager, {
  maxDrawdown,
  absStopLoss,
  percStopLoss
}) => {
  const watchers = []

  if (maxDrawdown) {
    watchers.push(
      new DrawdownWatcher(performanceManager, new BigNumber(maxDrawdown))
    )
  }

  if (absStopLoss) {
    watchers.push(
      new AbsoluteStopLossWatcher(performanceManager, new BigNumber(absStopLoss))
    )
  }

  if (percStopLoss) {
    watchers.push(
      new PercentageStopLossWatcher(performanceManager, new BigNumber(percStopLoss))
    )
  }

  return watchers
}

module.exports = (performanceManager, abortStrategy, opts) => {
  const { exitPositionMode = ExitModes.CLOSE_AT_MARKET } = opts
  const watchers = createWatchers(performanceManager, opts)

  watchers.forEach((watcher) => {
    watcher.start()
    watcher.on('abort', () => abortStrategy(exitPositionMode))
  })

  return watchers
}
