/*global Grid,Color,Direction,GridDisplay,Loop,requestAnimationFrame*/
/*jslint sloppy: true */

import { Alien } from "./Alien.js"
import { Cowboy } from "./Cowboy.js"
import { Grid } from "./Grid.js"
import { Brick } from "./Brick.js"
import { Message } from "./Message.js"
import { cowboyPool } from "../stimulation.js"
import { randomIntFromInterval } from "../utils/utils.js"
import { Bullet } from "./Bullet.js"
import { Cell } from "./Cell.js"
/*jslint plusplus: true */

function World(width, height, numsAlien, alienMovementSpeed) {
  this.cellsize = 10
  this.display = new GridDisplay(this.cellsize, width, height)
  this.grid = new Grid(width, height)
  this.gridWidth = width
  this.gridHeight = height
  this.numsAlien = numsAlien
  this.alienDefeat = 0
  this.fireNumber = 0
  this.aliens = []
  this.cowboys = {}
  this.messages = []
  this.lines = {}
  this.fireLines = {}
  this.onFire = {}
  this.fireZones = {}
  this.alienMovementSpeed = alienMovementSpeed
  this.leader = null
  this.electionSuccessed = 0
  this.subject
}

World.prototype.spawnCowboys = function (pos_cowboy, n, offset) {
  for (var i = 0; i < n; i++) {
    if (pos_cowboy.length == 0) {
      this.cowboys.push(new Cowboy(offset, this.grid, true, null, i))
    } else {
      this.cowboys.push(new Cowboy(offset, this.grid, false, pos_cowboy[i], i))
    }
  }
  this.cowboys.map((cowboy, i) => {
    cowboy.initDistance(this.cowboys)
    var fireZone = []
    cowboy.cell.fireRange.map((cell, i) => {
      fireZone.push(new Brick(cell))
    })
    this.fireZones[i] = fireZone
    this.onFire[i] = false
  })
  console.log(this.cowboys)
}

World.prototype.distance = function (src, dest, type) {
  if (type === "cowboy") {
    return Math.round(this.cowboys[src].distanceToCell(this.cowboys[dest]))
  }
}

World.prototype.spawnCowboy = function (x, y, id) {
  this.cowboys[id] = new Cowboy(x, y, id, this.grid)
}

World.prototype.becomeCandidate = function (id) {
  this.cowboys[id].color = Color.LIGHTRED
  if (this.cowboys[id].aim) {
    this.cowboys[id].aim = null
    aim.beingAim = null
    this.lines[i].color = "#000000"
  }
}

World.prototype.becomeLeader = function (id) {
  this.cowboys[id].leader = true
  this.cowboys[id].color = Color.BLUE

  this.electionSuccessed++
  document.getElementById("electionSuccessed").innerHTML =
    "Elections Successed  : " + this.electionSuccessed
  document.getElementById("currentLeader").innerHTML =
    "Current Leader       : Cowboy " + id

  if (this.cowboys[id].aim) {
    this.cowboys[id].aim = null
    aim.beingAim = null
    this.lines[i].color = "#000000"
  }
}

World.prototype.stepDown = function (id) {
  this.cowboys[id].leader = false
  this.cowboys[id].color = Color.GREEN
}

World.prototype.sendMessage = function (source, dest, rpc, args) {
  // console.log("send rpc", rpc)
  if (rpc !== "start election" || rpc !== "clientRequestResponse")
    this.messages.push(
      new Message(this.cowboys[source], this.cowboys[dest], rpc, args)
    )
}
World.prototype.checkCowboy = function () {
  var alive = 0
  for (var k in this.cowboys) {
    if (this.cowboys[k].alive) {
      alive++
    }
  }
  return alive
}

World.prototype.removeCowboy = function (cowboy) {
  var index = this.cowboys.indexOf(cowboy)
  if (index !== -1) {
    this.cowboys.splice(index, 1)
    return true
  }
  return false
}

World.prototype.removeAlien = function (alien) {
  var index = this.aliens.indexOf(alien)
  if (index !== -1) {
    this.aliens.splice(index, 1)
    this.alienDefeat++
    document.getElementById("alienDefeat").innerHTML =
      "Alien Defeat         : " + this.alienDefeat
    
    this.fireNumber++
    document.getElementById("totalFires").innerHTML =
      "Total Fires Times    : " + this.fireNumber
    return true
  }
  return false
}

World.prototype.removeLine = function (cowboy) {
  var index = this.cowboys.indexOf(cowboy)
  if (index !== -1) {
    this.lines.splice(index, 1)
    return true
  }
  return false
}

World.prototype.removeMessage = function (message) {
  // console.log("remove message")
  var index = this.messages.indexOf(message)
  if (index !== -1) {
    this.messages.splice(index, 1)
    return true
  }
  return false
}

World.prototype.removeBullet = function (bullet) {
  var index = this.bullets.indexOf(bullet)
  if (index !== -1) {
    this.bullets.splice(index, 1)
    return true
  }
  return false
}

// World.prototype.fire = function (cowboy) {
//   var cowboy = this.cowboys[cowboy]
//   if (cowboy.alive == true && cowboy.aim) {
//     cowboy.kill(cowboy.aim)
//     cowboy.aim = null
//     this.lines[cowboy.id].color = "#FFA500"
//   }
// }

World.prototype.alienMove = function () {
  // console.log("alien Moved!")
  var i
  for (i = 0; i < this.aliens.length; i++) {
    var alien = this.aliens[i]
    if (!alien.beingAimed) alien.move()
  }
  for (var i in this.cowboys) {
    this.cowboys[i].move()
  }
  // console.log(this.cowboys)
}
World.prototype.spawnAlien = function () {
  this.aliens.push(
    new Alien(this.gridWidth, this.gridHeight, this.grid, this.cowboys)
  )
}

World.prototype.sendRequest = function (alien, i, type, args) {
  if (type === "report alien") {
    cowboyPool[i].sendRPC(cowboyPool[i]._leaderId, "clientRequest", {
      op: "report alien",
      key: "aliens",
      cowboyId: i,
      alienCoordinate: [alien.cell.x, alien.cell.y],
      alienId: this.aliens.indexOf(alien),
    })
  } else if (type === "set busy") {
    cowboyPool[i].stateMachine["cowboys"][i]["isBusy"] = false
    // console.log(cowboyPool[i].stateMachine["cowboys"][i])
    cowboyPool[i].sendRPC(cowboyPool[i]._leaderId, "clientRequest", {
      op: "set busy",
      c: "why is this false????",
      id: args.cowboys,
    })
  }
}

// Kelvin: This is an update to the world
World.prototype.doTick = function () {
  this.display.clear()
  // Kelvin: Spawn alien if there is
  if (this.aliens.length !== this.numsAlien) {
    this.spawnAlien()
  }
  for (var i in this.cowboys) {
    for (var j in this.aliens) {
      var cowboy = this.cowboys[i]
      var alien = this.aliens[j]
      if (cowboy.alive && !cowboy.leader && cowboy.distanceToCell(alien) <= 5) {
        if (!cowboy.aim) {
          if (alien.beingAimed != null) {
            cowboy.aimX = alien.cell.x
            cowboy.aimY = alien.cell.y

            this.lines[i] = {
              line: cowboy.lineTo(cowboy.aimX, cowboy.aimY),
              color: "#FFA500",
            }
            cowboy.target = null
            this.cowboys[alien.beingAimed].sendRequest = false
            this.cowboys[alien.beingAimed].aim = null
            this.lines[alien.beingAimed].color = "#FFA500"
            this.sendRequest(alien, i, "set busy", {
              cowboys: [i, alien.beingAimed],
            })
            // this.sendRequest(alien, alien.beingAimed, "set")
            console.log(cowboyPool)
            cowboy.kill(alien)
          } else {
            alien.beingAimed = i
            cowboy.aim = alien
            cowboy.aimX = alien.cell.x
            cowboy.aimY = alien.cell.y

            this.lines[i] = {
              line: cowboy.lineTo(cowboy.aimX, cowboy.aimY),
              color: "#00FFFF",
            }
          }
        }
        if (
          cowboy.aim === alien &&
          !cowboy.sendRequest &&
          cowboyPool[i]._leaderId
        ) {
          this.sendRequest(alien, i, "report alien", null)
          cowboy.sendRequest = true
        }
      }
    }
  }

  for (i = 0; i < this.messages.length; i++) {
    var message = this.messages[i]
    var prev_x = message.cell.x
    var prev_y = message.cell.y
    message.move()
    if (message.cell.x !== prev_x || message.cell.y !== prev_y)
      this.display.square(message.cell.x, message.cell.y, message.color)
  }

  for (var line in this.lines) {
    if (this.lines[line]) {
      var l = this.lines[line].line
      var color = this.lines[line].color
      if (this.cowboys[line].alive) {
        l.map((cell) => {
          this.display.square(cell[0], cell[1], color)
        })
        // if the orange
        if (color == "#FFA500") {
          this.lines[line].color = "#000000"
        }
      }
    }
  }
  // console.log(this.lines)
  for (var i in this.cowboys) {
    var cowboy = this.cowboys[i]
    if (cowboy.alive) {
      var color = cowboy.color
      this.display.square(cowboy.cell.x, cowboy.cell.y, color)
    } else {
      this.display.square(cowboy.cell.x, cowboy.cell.y, "#808080")
    }
  }

  for (i = 0; i < this.aliens.length; i++) {
    var alien = this.aliens[i]

    this.display.square(alien.cell.x, alien.cell.y, alien.color)
  }

  if (this.subject) {
    var ctx = display.context
    ctx.strokeStyle = "#FFFF00"
    ctx.lineWidth = 1
    ctx.strokeRect(
      subject.cell.x * cellsize,
      subject.cell.y * cellsize,
      cellsize,
      cellsize
    )
  }
}

export { World }
