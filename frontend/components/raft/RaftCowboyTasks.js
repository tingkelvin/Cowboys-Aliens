import { RaftCowboyLocal } from "./RaftCowboyLocal.js"

function RaftCowboyTasks(id, opts) {
  if (!(this instanceof RaftCowboyTasks)) {
    // Handle instantiation without "new"
    return new RaftCowboyTasks(id, opts)
  }

  // Call the superclass
  RaftCowboyLocal.call(this, id, opts)

  if (!opts.cowboyStore || !opts.taskQueue) {
    throw new Error("opts.serverStore and opts.taskQueue required")
  }
}

// Kelvin: subclass extends superclass
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
RaftCowboyTasks.prototype = Object.create(RaftCowboyLocal.prototype)

// Kelvin: manually setting the prototype to a new object. It erases the constructor property
// https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/object-oriented-programming/remember-to-set-the-constructor-property-when-changing-the-prototype
RaftCowboyTasks.prototype.constructor = RaftCowboyTasks

//Kelvin: Override abstract method in RaftServerBase
RaftCowboyTasks.prototype.schedule = function (action, time, data) {
  data = data || {}
  data.type = data.type || action.name
  data.id = this._opts.listenAddress
  data.idx = this.id
  return this._opts.taskQueue.schedule(action, time, data)
}

//Kelvin: Override abstract method in RaftServerBase
RaftCowboyTasks.prototype.unschedule = function (id) {
  this._opts.taskQueue.cancel(id)
}

//Kelvin: Override abstract method in RaftServerBase
RaftCowboyTasks.prototype.logFn = function (id) {
  var msg = Array.prototype.join.call(arguments, " ")
  msg = msg.replace(/^[0-9]*:/, this._opts.taskQueue.currentTime() + ":")
  this._opts.msgCallback(msg)
}

export { RaftCowboyTasks }
