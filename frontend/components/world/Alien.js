import { Carrier } from "./Carrier.js"
import { Thing } from "./Thing.js"
import { randomInt, mixin } from "../utils/utils.js"
import { Grid } from "./Grid.js"

function Alien(gridWidth, gridHeight, grid, cowboys) {
  this.color = Color.RED
  this.initPosition(this.randomBorder(gridWidth, gridHeight, grid))
  this.cowboys = cowboys
  this.beingAimed = null
  //Kelvin: this is the target of the alien want to kill
  //findTarget() return the cloest alien
  this.target = this.findTarget(this.cowboys)
}

Alien.prototype.move = function () {
  var neighbours = this.cell.neighbours
  // Kelvin: Loop though its neghbours
  for (var i = 0; i < neighbours.length; i++) {
    // Kelvin: If we found somethings, this could be other alien, could be nothing
    if (neighbours[i].contents.length !== 0) {
      // Kelvin: if we found something, loop though everything
      neighbours[i].contents.map((neighbour) => {
        // if found the target
        if (neighbour === this.target) {
          this.kill(neighbour)
          this.target = null
        }
      })
    }
  }

  // Kelvin: If there no target find a target
  if (!this.target || !this.target.alive) {
    this.target = this.findTarget(this.cowboys)
  }

  // Kelvin: if we found the target move to target direction
  if (this.target && this.target.alive) {
    this.direction = this.findDirection(this.target)
    if (this.direction) {
      var nextCell = this.cell.neighbour(this.direction)
      Grid.move(this, this.cell, nextCell)
      this.cell = nextCell
    }
  }
}

Alien.prototype.findTarget = function (cowboys) {
  var closestCowboy = null
  var min_d = Infinity

  //loop thought every cowboy and find the cloest distance
  // console.log(cowboys)

  for (var i in cowboys) {
    if (cowboys[i].alive) {
      var distance = this.distanceToCell(cowboys[i])
      if (distance < min_d) {
        closestCowboy = cowboys[i]
        min_d = distance
      }
    }
  }
  return closestCowboy
}

Alien.prototype.randomBorder = function (gridWidth, gridHeight, grid) {
  var y = randomInt(gridHeight)
  var x
  var side = randomInt(4)
  if (side === 0) {
    x = randomInt(gridWidth)
    y = 0
  } else if (side === 1) {
    x = gridWidth - 1
    y = randomInt(gridHeight)
  } else if (side === 2) {
    x = randomInt(gridWidth)
    y = gridHeight - 1
  } else {
    x = 0
    y = randomInt(gridHeight)
  }
  // console.log(x, y)
  return grid.cell(x, y)
}

mixin(Alien, [Thing, Carrier])
export { Alien }
