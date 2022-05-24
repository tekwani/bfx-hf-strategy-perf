const AbstractWatcher = require('./AbstractWatcher')

class DrawdownWatcher extends AbstractWatcher {
  constructor (performanceManager, maxDrawdown) {
    super(performanceManager)
    this.maxDrawdown = maxDrawdown
  }

  onUpdate () {
    const drawdown = this.performanceManager.drawdown()

    if (drawdown.isGreaterThanOrEqualTo(this.maxDrawdown)) {
      this.abortStrategy()
    }
  }
}

module.exports = DrawdownWatcher
