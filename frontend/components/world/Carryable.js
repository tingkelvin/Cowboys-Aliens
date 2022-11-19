function Carryable() {}
Carryable.prototype.pickup = function (mob) {
  this.cell.remove(this)
  this.cell = null
  mob.carrying.push(this)
}

export { Carryable }
