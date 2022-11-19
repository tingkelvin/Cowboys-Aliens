/*
 * raft.js: Raft consensus algorithm in JavaScript
 * Copyright (C) 2016 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for description and usage instructions.
 */

"use strict"
import { PaxosCowboyBase } from "./PaxosCowboyBase.js"
// RaftServer that uses in-process communication for RPC
// Most useful for testing
function PaxosCowboyLocal(id, opts) {
  if (!(this instanceof PaxosCowboyLocal)) {
    // Handle instantiation without "new"
    return new PaxosCowboyLocal(id, opts)
  }

  // Call the superclass
  PaxosCowboyBase.call(this, id, opts)

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
PaxosCowboyLocal.prototype = Object.create(PaxosCowboyBase.prototype)

// Kelvin: manually setting the prototype to a new object. It erases the constructor property
// https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/object-oriented-programming/remember-to-set-the-constructor-property-when-changing-the-prototype
PaxosCowboyLocal.prototype.constructor = PaxosCowboyLocal

//Kelvin: Override abstract method in PaxosCowboyBase
PaxosCowboyLocal.prototype.sendRPC = function (targetId, rpcName, args) {
  this.dbg("RPC to " + targetId + ": " + rpcName)
  //   console.log("Local", "RPC to " + targetId + ": " + rpcName)
  if (!targetId in this._opts.cowboyPool) {
    console.log("Server id '" + targetId + "' does not exist")
    // No target, just drop RPC (no callback)
    return
  }
  //   console.log(this._opts.serverPool[targetId][rpcName])
  this._opts.cowboyPool[targetId][rpcName](args)
}

//Kelvin: Override abstract method in PaxosCowboyBase
PaxosCowboyLocal.prototype.applyCmd = function (stateMachine, cmd) {
  // console.log("applyCMD", cmd, cmd.op)
  // TODO: sanity check args
  // console.log(cmd)
  // console.log(stateMachine)
  switch (cmd.op) {
    case "get":
      return stateMachine[cmd.key][cmd.id]
    case "report alien":
      stateMachine[cmd.key][cmd.alienId] = cmd.alienCoordinate
      break
    case "set":
      stateMachine[cmd.key][cmd.id] = cmd.value
      break
    case "set busy":
      stateMachine["cowboys"][cmd.id[1]]["isBusy"] = false
      stateMachine["cowboys"][cmd.id[0]]["isBusy"] = false
      console.log("---", this.stateMachine)
      break
    case "reinforce":
      var distance = Number.POSITIVE_INFINITY
      // var alienCoordinate = stateMachine.aliens[cmd.alienId]
      var sent
      for (var i in stateMachine.cowboys) {
        var cowboy = stateMachine.cowboys[i]

        if (!cowboy.isBusy && i !== cmd.cowboyId) {
          var x = Math.sqrt(
            (cowboy.coordinate[0] - cmd.alienCoordinate[0]) ** 2
          )
          var y = Math.sqrt(
            (cowboy.coordinate[1] - cmd.alienCoordinate[1]) ** 2
          )
          var d = Math.max(x, y)
          if (d < distance) {
            sent = i
            distance = d
          }
        }
      }
      stateMachine["cowboys"][i].isBusy = true
      return sent
    default:
      throw new Error("invalid command: not working '" + cmd.op + "'")
  }
  // console.log(cmd, stateMachine)
}

//Kelvin: Override abstract method in PaxosCowboyBase
PaxosCowboyLocal.prototype.saveFn = function (data, callback) {
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

//Kelvin: Override abstract method in PaxosCowboyBase
PaxosCowboyLocal.prototype.loadFn = function (callback) {
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

export { PaxosCowboyLocal }
