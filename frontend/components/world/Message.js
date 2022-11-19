import { Carrier } from "./Carrier.js"
import { Thing } from "./Thing.js"
import { randomInt, mixin } from "../utils/utils.js"
import { Grid } from "./Grid.js"

function Message(source, dest, rpc, args) {
  // console.log("new message", rpc, args)
  // console.log("message init")
  // if (rpc === "requestVote" || rpc === "appendEntries")
  //   this.color = Color.ORANGE
  // else if (rpc === "requestVoteResponse" || rpc === "appendEntriesResponse") {
  //   if (args.voteGranted || args.success) this.color = Color.LIGHTGREEN
  // } else if (opts.type === "clientRequest") {
  //   this.color = Color.PURPLE
  // } else {
  //   this.color = Color.RED
  // }
  switch (rpc) {
    case "requestVote":
    case "appendEntries":
      this.color = Color.ORANGE
      break
    case "requestVoteResponse":
    case "appendEntriesResponse":
      if (args.voteGranted || args.success) this.color = Color.LIGHTGREEN
      else this.color = Color.RED
      break
    case "clientRequest":
      this.color = Color.PURPLE
      break
    case "clientRequestResponse":
      this.color = Color.PURPLE
      break
    default:
      console.log("Message type " + rpc + " not found.")
      break
  }

  this.initPosition(source.cell)
  //Kelvin: this is the target of the alien want to kill
  //findTarget() return the cloest alien
  this.target = [dest.cell.x, dest.cell.y]
}

Message.prototype.move = function () {
  // console.log(this.target)
  if (this.target) {
    this.direction = this.findDirection(this.target)
    // console.log("target", this.direction)
    if (this.direction) {
      var nextCell = this.cell.neighbour(this.direction)
      Grid.move(this, this.cell, nextCell)
      this.cell = nextCell
    } else {
    }
  }
  // console.log(this.cell.x, this.target[0], this.cell.y, this.target[0])
  if (this.cell.x === this.target[0] && this.cell.y === this.target[0]) {
    this.kill(this)
  }
}

mixin(Message, [Thing, Carrier])
export { Message }
