import { Carrier } from "./Carrier.js"
import { Thing } from "./Thing.js"
import { randomInt, mixin } from "../utils/utils.js"
import { Grid } from "./Grid.js"

function Bullet(source, dest) {
  this.color = Color.SILVER

  this.initPosition(source.cell)
  //Kelvin: this is the target of the alien want to kill
  //findTarget() return the cloest alien
  this.target = dest
}

Bullet.prototype.move = function () {
  if (!this.target) {
    this.kill(this)
  }
  var neighbours = this.cell.neighbours
  // Kelvin: Loop though its neghbours
  for (var i = 0; i < neighbours.length; i++) {
    // Kelvin: If we found somethings, this could be other alien, could be nothing
    if (neighbours[i].contents.length !== 0) {
      // Kelvin: if we found something, loop though everything
      neighbours[i].contents.map((neighbour) => {
        // if found the target
        if (neighbour === this.target) {
          this.kill(this)
          this.target = null
        }
      })
    }
  }

  if (this.target) {
    this.direction = this.findDirection(this.target)
    var nextCell = this.cell.neighbour(this.direction)
    Grid.move(this, this.cell, nextCell)
    this.cell = nextCell
  }
}

mixin(Bullet, [Thing, Carrier])
export { Bullet }
