import { Direction } from "./Direction.js"
import { world, cowboyPool } from "../stimulation.js"

function Thing() {}

Thing.prototype.initPosition = function (cell) {
  if (!cell) {
    cell = grid.randomCell()
    console.log("cell", grid.cell(1, 1))
  }
  this.cell = cell
  cell.add(this)
}

Thing.prototype.tryToMove = function (direction) {
  var target = this.cell.neighbour(direction)
  if (target.contents.length == 0) {
    Grid.move(this, this.cell, target)
    this.cell = target
    return true
  }
  return false
}

//Kelvin : Find the right direction of the target
Thing.prototype.findDirection = function (target) {
  if (target) {
    var cur_x = this.cell.x
    var cur_y = this.cell.y
    var target_x
    var target_y
    if (Array.isArray(target)) {
      target_x = target[0]
      target_y = target[1]
    } else {
      target_x = target.cell.x
      target_y = target.cell.y
    }

    // console.log(cur_x, target_x, cur_y, target_y, target)

    if (cur_x > target_x && cur_y > target_y) {
      return Direction.SOUTHWEST
    }

    if (cur_x < target_x && cur_y < target_y) {
      return Direction.NORTHEAST
    }

    if (cur_x < target_x && cur_y > target_y) {
      return Direction.SOUTHEAST
    }

    if (cur_x > target_x && cur_y < target_y) {
      return Direction.NORTHWEST
    }

    if (cur_x === target_x && cur_y > target_y) {
      return Direction.SOUTH
    }

    if (cur_x === target_x && cur_y < target_y) {
      return Direction.NORTH
    }

    if (cur_x > target_x && cur_y === target_y) {
      return Direction.WEST
    }

    if (cur_x < target_x && cur_y === target_y) {
      return Direction.EAST
    }
  }
}

Thing.prototype.findEasyDirection = function (target) {
  if (target) {
    var cur_x = this.cell.x
    var cur_y = this.cell.y
    var target_x = target.cell.x
    var target_y = target.cell.y
    // console.log(cur_x, cur_y, target_x, target_y)
    if (cur_x > target_x && cur_y > target_y) {
      return Direction.SOUTH
    } else if (cur_x < target_x && cur_y < target_y) {
      return Direction.NORTH
    } else if (cur_x < target_x && cur_y > target_y) {
      return Direction.SOUTH
    } else if (cur_x > target_x && cur_y < target_y) {
      return Direction.NORTH
    } else if (cur_x === target_x && cur_y > target_y) {
      return Direction.SOUTH
    } else if (cur_x === target_x && cur_y < target_y) {
      return Direction.NORTH
    } else if (cur_x > target_x && cur_y === target_y) {
      return Direction.WEST
    } else if (cur_x < target_x && cur_y === target_y) {
      return Direction.EAST
    } else {
      console.log(" cannot find direction", target)
    }
  }
}

Thing.prototype.distanceToCell = function (obj) {
  if (obj) {
    var x = Math.sqrt((this.cell.x - obj.cell.x) ** 2)
    var y = Math.sqrt((this.cell.y - obj.cell.y) ** 2)
    return Math.max(x, y)
  }
}

Thing.prototype.lineTo = function (target_x, target_y) {
  var cur_x = this.cell.x
  var cur_y = this.cell.y
  var line = []
  while (cur_x != target_x || cur_y != target_y) {
    if (cur_x > target_x && cur_y > target_y) {
      cur_x -= 1
      cur_y -= 1
    } else if (cur_x < target_x && cur_y < target_y) {
      cur_x += 1
      cur_y += 1
    } else if (cur_x < target_x && cur_y > target_y) {
      cur_x += 1
      cur_y -= 1
    } else if (cur_x > target_x && cur_y < target_y) {
      cur_x -= 1
      cur_y += 1
    } else if (cur_x === target_x && cur_y > target_y) {
      cur_y -= 1
    } else if (cur_x === target_x && cur_y < target_y) {
      cur_y += 1
    } else if (cur_x > target_x && cur_y === target_y) {
      cur_x -= 1
    } else if (cur_x < target_x && cur_y === target_y) {
      cur_x += 1
    }
    line.push([cur_x, cur_y])
  }
  return line
}

// Kelvin: We cant remove the cowboy in world since it contains the distance2
// which is the distance between each cowboys, and used for message passing
// Hence, we can mark it to black color
Thing.prototype.kill = function (target) {
  if (target.constructor.name === "Cowboy") {
    // console.log(target.id)
    console.log(target.aim)
    if (target.aim) {
      target.aim.beingAim = null
    }
    cowboyPool[target.id]._terminate()
    target.alive = false

    target.color = Color.BLACK
    // world.removeLine(target)
  } else if (target.constructor.name === "Message") {
    world.removeMessage(target)
  } else if (target.constructor.name === "Bullet") {
    world.removeMessage(target)
  } else {
    world.removeAlien(target)
  }
  // Kelvin: call the default method to remove from grid
  target.cell.remove(target)
}
export { Thing }
