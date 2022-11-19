import { Direction } from "./Direction.js"

function Cell(grid, x, y) {
  this.grid = grid
  this.contents = []
  this.x = x
  this.y = y
  this.fireRange = []
}

Cell.prototype.initNeighbours = function () {
  this.neighbours = []
  var i, direction, nx, ny, neighbour
  for (i = 0; i < Direction.ALL.length; i++) {
    direction = Direction.ALL[i]
    nx = this.x + direction.x
    ny = this.y + direction.y
    if (nx === this.grid.width) {
      nx = 0
    } else if (nx === -1) {
      nx = this.grid.width - 1
    }
    if (ny === this.grid.height) {
      ny = 0
    } else if (ny === -1) {
      ny = this.grid.height - 1
    }
    neighbour = this.grid.cells[nx][ny]
    this.neighbours[i] = neighbour
  }
  console.log(this.neighbours)
}

Cell.prototype.initFireRange = function () {
  var nx, ny
  //loop through every direction from cowboy and
  // multiply by its magnitude by 2 to get us the yellow coordinates
  // Direction.ALL.map((direction) => {
  //   nx = this.x + direction.x * 2
  //   ny = this.y + direction.y * 2
  //   this.fireRange.push(this.grid.cells[nx][ny])

  //   // another loop through every direction from yellow coordinates
  //   // to get us the red coordinates
  //   Direction.ALL.map((direction2) => {
  //     nx = this.x + direction.x * 2 + direction2.x
  //     ny = this.y + direction.y * 2 + direction2.y
  //     this.fireRange.push(this.grid.cells[nx][ny])
  //   })
  // })
  nx = this.x - 1 * 5
  ny = this.y - 1 * 5
  for (var i = 0; i < 12; i++) {
    for (var j = 0; j < 12; j++) {
      this.fireRange.push(this.grid.cells[nx + i][ny + j])
    }
  }
}

Cell.prototype.initNeighbours = function () {
  this.neighbours = []
  var i, direction, nx, ny, neighbour
  for (i = 0; i < Direction.ALL.length; i++) {
    direction = Direction.ALL[i]
    nx = this.x + direction.x
    ny = this.y + direction.y
    if (nx === this.grid.width) {
      nx = 0
    } else if (nx === -1) {
      nx = this.grid.width - 1
    }
    if (ny === this.grid.height) {
      ny = 0
    } else if (ny === -1) {
      ny = this.grid.height - 1
    }
    neighbour = this.grid.cells[nx][ny]
    this.neighbours[i] = neighbour
  }
}

Cell.prototype.toString = function () {
  return "(" + this.x + "," + this.y + ")"
}

Cell.prototype.randomNeighbour = function () {
  return this.neighbours[randomInt(8)]
}

Cell.prototype.neighbour = function (direction) {
  return this.neighbours[direction.index]
}

Cell.prototype.add = function (o) {
  this.contents.push(o)
}

Cell.prototype.remove = function (o) {
  var index = this.contents.indexOf(o)
  if (index !== -1) {
    this.contents.splice(index, 1)
    return true
  }
  return false
}

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

export { Cell }
