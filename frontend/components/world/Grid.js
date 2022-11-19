/*jslint plusplus: true */
import { randomInt } from "../utils/utils.js"
import { Cell } from "./Cell.js"

function Grid(width, height) {
  var x, y, column, cell

  this.width = width
  this.height = height
  this.cells = [] // 2D array of cells
  this.flatCells = [] // Flat array of cells

  for (x = 0; x < width; x++) {
    column = []
    this.cells[x] = column
  }
  for (x = 0; x < this.width; x++) {
    for (y = 0; y < this.height; y++) {
      cell = new Cell(this, x, y)
      this.cells[x][y] = cell
      this.flatCells.push(cell)
    }
  }
  for (x = 0; x < this.flatCells.length; x++) {
    this.flatCells[x].initNeighbours()
  }
  this.numCells = this.flatCells.length
}

Grid.prototype.randomCell = function () {
  var x = randomInt(this.width),
    y = randomInt(this.height)
  return this.cells[x][y]
}

Grid.prototype.cell = function (x, y) {
  return this.cells[x][y]
}

Grid.move = function (obj, fromCell, toCell) {
  var removed = fromCell.remove(obj)
  // if (!removed) {
  //   throw "Object not found in 'from' cell"
  // }
  toCell.add(obj)
}

export { Grid }
