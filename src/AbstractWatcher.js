const EventEmitter = require('events')

class AbstractWatcher extends EventEmitter {
  constructor (performanceManager) {
    super()
    this.performanceManager = performanceManager
    this.onUpdate = this.onUpdate.bind(this)
  }

  start () {
    this.performanceManager.on('update', this.onUpdate)
  }

  /**
   * @protected
   */
  abortStrategy () {
    this.emit('abort')
  }

  close () {
    this.performanceManager.on('update', this.onUpdate)
    this.removeAllListeners()
  }
}

module.exports = AbstractWatcher
