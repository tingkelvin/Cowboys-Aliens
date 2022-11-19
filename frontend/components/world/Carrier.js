function Carrier() {}
Carrier.prototype.carrying = []

function mixin(type, others) {
  // console.log(others)
  if (!type.prototype.types) {
    type.prototype.types = []
  }
  others.forEach(function (other) {
    // console.log(other.prototype)
    type.prototype.types.push(other)
    for (var field in other.prototype) {
      // console.log(field)
      if (other.prototype.hasOwnProperty(field)) {
        type.prototype[field] = other.prototype[field]
      }
    }
  })
}

export { Carrier }
