import { Tasks } from "./paxos/PaxosTasks.js"
import { copyMap } from "./utils/utils.js"
import { World } from "./world/World.js"
import { createCowboys } from "./paxos/PaxosUtils.js"
import { PaxosCowboyTasks } from "./paxos/PaxosCowboyTasks.js"
import { RaftCowboyTasks } from "./raft/RaftCowboyTasks.js"

var cowboyPool = {}
var cowboyStore = {}
var tqueueOpts = {}
var tqueue = Tasks(tqueueOpts)
var world

// console.log(world)

function startStimulation(opts, numsCowboy, msgCallback) {
  var cowboyIdx = 0
  var width = opts.gridWidth
  var height = opts.gridHeight
  var offset = opts.offset
  var pos_cowboy = opts.pos_cowboy
  var numsAlien = opts.numsAlien
  var messageSpeed = opts.messageSpeed
  var massagePass = 0
  var alienMovementSpeed = opts.alienMovementSpeed
  var algoType = opts.algoType

  opts.stateMachineStart = { cowboys: {}, aliens: {} }
  cowboyPool = {}
  cowboyStore = {}
  tqueueOpts = {}
  tqueue = Tasks(tqueueOpts)
  world = new World(width, height, numsAlien, alienMovementSpeed)

  var n = pos_cowboy.length || numsCowboy
  // console.log(n)
  msgCallback =
    msgCallback ||
    function (msg) {
      console.log.call(console, msg)
    }
  var cowboyOpts = {}

  // Kelvin: pointer for cowboyOpts which will pass to PaxosCowboyTasks on line 92
  // cowboyOpts store all the information, methods, states, task quene ..etc
  for (var i = 0; i < n; i++) {
    // Kelvin: deep copy of objects from opts
    cowboyOpts[i] = copyMap(opts)

    //
    cowboyOpts[i].cowboyPool = cowboyPool
    cowboyOpts[i].cowboyStore = cowboyStore
    cowboyOpts[i].listenAddress = "Cowboy " + cowboyIdx++
    cowboyOpts[i].taskQueue = tqueue
    cowboyOpts[i].msgCallback = msgCallback
    cowboyOpts[i].durable = false
    cowboyOpts[i].world = world
  }

  // console.log(cowboyOpts);

  // Start the cowboys with a full cluster config by pre-configuring
  // the full configuration in the log so that each node will be
  // aware of it on start. Normally the cluster would start with
  // a single member and add one cowboy at a time.
  var startLog = [{ term: 0, command: null }]
  var oldServers = []
  for (var i = 0; i < n; i++) {
    startLog.push({ term: 0, oldServers: oldServers.slice(0), newServer: i })
    oldServers.push(i)
  }
  for (var i = 0; i < n; i++) {
    cowboyStore[i] = { currentTerm: 0, votedFor: null, log: startLog }
  }

  // Kelvin: This is creation of the servers
  // create indvidual cowboy by using PaxosCowboyTasks template with serverOpts
  var ret;
  if (algoType === "PAXOS"){
    ret = createCowboys(PaxosCowboyTasks, cowboyOpts)
  }else if(algoType === "RAFT"){
    ret = createCowboys(PaxosCowboyTasks,cowboyOpts)
  }else{ 

  }
  
  
  // world.spawnCowboys(pos_cowboy, n, offset)

  // Kelvin: First tick of the world
  requestAnimationFrame(() => world.doTick())

  // Kelvin: Schdule alien movement
  var t = function () {
    world.alienMove()
  }
  tqueue.schedule(t, alienMovementSpeed, {
    id: "Aliens",
    src: "Aliens",
    type: "Move",
    speed: alienMovementSpeed,
  })
  // console.log(cowboyPool)
  for (var i = 0; i < n; i++) {
    ;(function () {
      //   console.log(serverPool[i])
      var sidx = i,
        cowboy = cowboyPool[i],
        // Kelvin: copy of original RPC & saveFn
        origSendRPC = cowboy.sendRPC.bind(cowboy),
        origSaveFn = cowboy.saveFn.bind(cowboy)

      // Kelvin: override sendRPC such that
      // It will call the original sendRPC method and
      // Schedule the RPC action
      cowboy.sendRPC = function (sid, rpc, args) {
        var nsid = sid,
          nrpc = rpc,
          nargs = args

        // console.log("args", nsid, nrpc, nargs)
        var newSendRPC = (function () {
          return function () {
            origSendRPC(nsid, nrpc, nargs)
            // Kelvin: This will update the world when it is called in the scheduler in tasks.js
            // sid is the id of the cowboy, nrpc will be the event
            // console.log(sid, sidx, nrpc)

            // if (nrpc === "requestVoteResponse") {
            //   // console.log("===========================")
            //   world.fire(sidx)
            // }
            // if (nrpc === "appendEntries") {
            //   world.sendMessage("requestVote", sid, Number(sidx))
            // }
            massagePass+=1
            document.getElementById("totalMsgPass").innerHTML = 
              "Total Message Passed : " + massagePass
            
            world.sendMessage(sidx, nsid, nrpc, nargs)
          }
        })()
        var data = {
          type: "RPC",
          args: args,
          rpc: rpc,
          src: sidx,
          dst: nsid,
          desc: "to " + sid,
        }

        // Kelvin: newSendRPC is the event that is called once the time arrived
        // world.cowboys[sidx].distance2[nsid] is the
        // distnace between the source cowboy and
        // console.log(sidx, nsid, rpc, args)
        cowboy.schedule(
          newSendRPC,
          Math.round(world.distance(sidx, nsid, "cowboy") * messageSpeed),
          data
        )
      }

      cowboy.saveFn = function (data, callback) {
        var newSaveFn = (function () {
          var ndata = data,
            ncallback = callback
          return function () {
            origSaveFn(ndata, ncallback)
          }
        })()
        cowboy.schedule(newSaveFn, 0, { type: "saveFn" })
      }
      //   console.log("now", cowboy)
    })()
  }
}

export { tqueueOpts, cowboyPool, tqueue, startStimulation, world }
