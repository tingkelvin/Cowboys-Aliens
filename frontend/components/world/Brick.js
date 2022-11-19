import { Carryable } from "./Carryable.js"
import { Thing } from "./Thing.js"
import { mixin } from "../utils/utils.js"

function Brick(cell) {
  this.cell = cell
  this.color = Color.ORANGE
  // console.log(this.initPosition(cell))
  // this.initPosition(cell)
  cell.add(this)
}

mixin(Brick, [Thing, Carryable])
export { Brick }
