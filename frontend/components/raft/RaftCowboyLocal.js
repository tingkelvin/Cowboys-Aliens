/*
 * raft.js: Raft consensus algorithm in JavaScript
 * Copyright (C) 2016 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for description and usage instructions.
 */

"use strict"
import { RaftCowboyBase } from "./RaftCowboyBase.js"
// RaftServer that uses in-process communication for RPC
// Most useful for testing
function RaftCowboyLocal(id, opts) {
  if (!(this instanceof RaftCowboyLocal)) {
    // Handle instantiation without "new"
    return new RaftCowboyLocal(id, opts)
  }

  // Call the superclass
  RaftCowboyBase.call(this, id, opts)

  if (!opts.cowboyPool) {
    throw new Error("opts.serverPool required")
  }

  if (id in opts.cowboyPool) {
    throw new Error("Server id '" + id + "' already exists")
  }

  opts.cowboyPool[id] = this

  //TODO
  //    if (!opts.serverData) {
  //        throw new Error("opts.serverData required")
  //    }

  // Default options
  this.setDefault("durable", true)
  this.setDefault("savePath", "raft.store." + id)
}

// Kelvin: subclass extends superclass
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
RaftCowboyLocal.prototype = Object.create(RaftCowboyBase.prototype)

// Kelvin: manually setting the prototype to a new object. It erases the constructor property
// https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/object-oriented-programming/remember-to-set-the-constructor-property-when-changing-the-prototype
RaftCowboyLocal.prototype.constructor = RaftCowboyLocal

//Kelvin: Override abstract method in RaftCowboyBase
RaftCowboyLocal.prototype.sendRPC = function (targetId, rpcName, args) {
  this.dbg("RPC to " + targetId + ": " + rpcName)
  //   console.log("Local", "RPC to " + targetId + ": " + rpcName)
  if (!targetId in this._opts.cowboyPool) {
    console.log("Server id '" + targetId + "' does not exist")
    // No target, just drop RPC (no callback)
    return
  }
  console.log(rpcName)
  this._opts.cowboyPool[targetId][rpcName](args)
}

//Kelvin: Override abstract method in RaftCowboyBase
RaftCowboyLocal.prototype.applyCmd = function (stateMachine, cmd) {
  // TODO: sanity check args

  switch (cmd.op) {
    case "get":
      stateMachine[cmd.key]
      break
    case "set":
      stateMachine[cmd.key][cmd.id] = cmd.value
      break
    default:
      throw new Error("invalid command: '" + cmd.op + "'")
  }
  return stateMachine[cmd.key]
}

//Kelvin: Override abstract method in RaftCowboyBase
RaftCowboyLocal.prototype.saveFn = function (data, callback) {
  if (this._opts.durable && fs) {
    var dstr = JSON.stringify(data)
    //var dstr = JSON.stringify(data,null,2)
    fs.writeFile(this._opts.savePath, dstr, function (err) {
      if (callback) {
        callback(!err)
      }
    })
  } else {
    this._opts.cowboyStore[this.id] = data
    if (callback) {
      callback(true)
    }
  }
}

//Kelvin: Override abstract method in RaftCowboyBase
RaftCowboyLocal.prototype.loadFn = function (callback) {
  if (this._opts.durable && fs) {
    fs.readFile(this._opts.savePath, function (err, dstr) {
      if (!err) {
        try {
          var data = JSON.parse(dstr)
          callback(true, data)
        } catch (e) {
          callback(false)
        }
      } else {
        callback(false)
      }
    })
  } else {
    var data = this._opts.cowboyStore[this.id]
    if (data) {
      callback(true, data)
    } else {
      callback(false)
    }
  }
}

export { RaftCowboyLocal }
