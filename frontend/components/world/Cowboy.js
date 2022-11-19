import { randomIntFromInterval, mixin } from "../utils/utils.js"
import { Carrier } from "./Carrier.js"
import { Thing } from "./Thing.js"
import { Grid } from "./Grid.js"

function Cowboy(x, y, id, grid) {
  this.id = id
  this.leader = false
  this.initPosition(grid.cell(x, y))
  this.target = null
  this.color = Color.GREEN
  this.alive = true
  this.aim = null
  this.aimX = null
  this.aimY = null
  this.distance2 = {}
  this.direction = null
  this.cell.initFireRange()
  this.requestSent = false
}

Cowboy.prototype.move = function () {
  if (this.target) {
    this.direction = this.findEasyDirection(this.target)

    if (this.direction && this.aim == null) {
      var nextCell = this.cell.neighbour(this.direction)
      Grid.move(this, this.cell, nextCell)
      this.cell = nextCell
    }
  }
}

mixin(Cowboy, [Thing, Carrier])

export { Cowboy }
