import { Brick } from "./world/brick.js"
import { Thing } from "./Thing.js"

function BrickLayer() {
  this.width = randomInt(width / 4)
  this.color = Color.PURPLE
  this.initPosition()
  this.direction = Direction.randomRectDirection()
  this.steps = 0
}

BrickLayer.prototype.tick = function () {
  this.prevCell = this.cell
  this.direction = Direction.randomRectDirection()
  this.couldMove = this.tryToMove(this.direction)
}

BrickLayer.prototype.postTick = function () {
  if (this.couldMove) {
    new Brick(this.prevCell)
  }
}

mixin(BrickLayer, [Thing])

export { BrickLayer }
