function Direction(x, y, index, id) {
  this.x = x
  this.y = y
  this.index = index
  this.id = id
}

Direction.prototype.toString = function () {
  return this.id
}

Direction.NORTH = new Direction(0, 1, 0, "NORTH")
Direction.NORTHEAST = new Direction(1, 1, 1, "NORTHEAST")
Direction.EAST = new Direction(1, 0, 2, "EAST")
Direction.SOUTHEAST = new Direction(1, -1, 3, "SOUTHEAST")
Direction.SOUTH = new Direction(0, -1, 4, "SOUTH")
Direction.SOUTHWEST = new Direction(-1, -1, 5, "SOUTHWEST")
Direction.WEST = new Direction(-1, 0, 6, "WEST")
Direction.NORTHWEST = new Direction(-1, 1, 7, "NORTHWEST")

Direction.ALL = [
  Direction.NORTH,
  Direction.NORTHEAST,
  Direction.EAST,
  Direction.SOUTHEAST,
  Direction.SOUTH,
  Direction.SOUTHWEST,
  Direction.WEST,
  Direction.NORTHWEST,
]

Direction.randomDirection = function () {
  return Direction.ALL[randomInt(8)]
}

Direction.randomRectDirection = function () {
  return [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST][
    randomInt(4)
  ]
}

export { Direction }
