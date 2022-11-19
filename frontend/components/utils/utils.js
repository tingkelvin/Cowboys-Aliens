"use strict"

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function copyMap(obj) {
  var nobj = {}
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) nobj[k] = obj[k]
  }
  return nobj
}

function randomInt(upToButExcluding) {
  return Math.floor(Math.random() * upToButExcluding)
}

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

export { copyMap, randomIntFromInterval, randomInt, mixin }
