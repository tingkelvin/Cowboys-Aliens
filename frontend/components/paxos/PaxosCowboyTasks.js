import { PaxosCowboyLocal } from "./PaxosCowboyLocal.js"

function PaxosCowboyTasks(id, opts) {
  if (!(this instanceof PaxosCowboyTasks)) {
    // Handle instantiation without "new"
    return new PaxosCowboyTasks(id, opts)
  }

  // Call the superclass
  PaxosCowboyLocal.call(this, id, opts)

  if (!opts.cowboyStore || !opts.taskQueue) {
    throw new Error("opts.serverStore and opts.taskQueue required")
  }
}

// Kelvin: subclass extends superclass
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
PaxosCowboyTasks.prototype = Object.create(PaxosCowboyLocal.prototype)

// Kelvin: manually setting the prototype to a new object. It erases the constructor property
// https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/object-oriented-programming/remember-to-set-the-constructor-property-when-changing-the-prototype
PaxosCowboyTasks.prototype.constructor = PaxosCowboyTasks

//Kelvin: Override abstract method in PaxosServerBase
PaxosCowboyTasks.prototype.schedule = function (action, time, data) {
  data = data || {}
  data.type = data.type || action.name
  data.id = this._opts.listenAddress
  data.idx = this.id
  return this._opts.taskQueue.schedule(action, time, data)
}

//Kelvin: Override abstract method in PaxosServerBase
PaxosCowboyTasks.prototype.unschedule = function (id) {
  this._opts.taskQueue.cancel(id)
}

//Kelvin: Override abstract method in PaxosServerBase
PaxosCowboyTasks.prototype.logFn = function (id) {
  var msg = Array.prototype.join.call(arguments, " ")
  msg = msg.replace(/^[0-9]*:/, this._opts.taskQueue.currentTime() + ":")
  this._opts.msgCallback(msg)
}

export { PaxosCowboyTasks }
