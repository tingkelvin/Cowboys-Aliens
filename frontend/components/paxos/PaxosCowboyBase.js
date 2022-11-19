/*
 * raft.js: Raft consensus algorithm in JavaScript
 * Copyright (C) 2016 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for description and usage instructions.
 */

import { world } from "../stimulation.js"
import { randomIntFromInterval } from "../utils/utils.js"
;("use strict")

if (typeof module === "undefined") {
  var base = {},
    exports = base
}

function copyMap(obj) {
  var nobj = {}
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) nobj[k] = obj[k]
  }
  return nobj
}

function PaxosCowboyBase(id, opts) {
  if (!(this instanceof PaxosCowboyBase)) {
    // Handle instantiation without "new"
    return new PaxosCowboyBase(id, opts)
  }

  this.id = id
  //
  // Raft Algorithm State (explicit in Figure 3.1)
  //

  // Persistent/durable state on all servers (Figure 3.1)
  this.currentTerm = 0
  this.votedFor = null
  this.log = [{ term: 0, command: null }] // [{term:TERM, comand:COMMAND}...]

  // Volatile/ephemeral state on all servers (Figure 3.1)
  this.commitIndex = 0 // highest index known to be committed
  this.lastApplied = 0 // highext index known to be applied

  // Volatile/ephemeral state on leaders only (Figure 3.1)
  this.nextIndex = {} // index of next log entry to send to follower
  this.matchIndex = {} // latest index known replicated to follower

  //
  // Sanity check options and set defaults
  //
  this._opts = opts || {}

  if (typeof id === "undefined") {
    throw new Error("id required")
  }

  //
  // Default Options
  //
  this.setDefault("electionTimeout", 300)
  this.setDefault("heartbeatTime", this._opts.electionTimeout / 4)
  this.setDefault("stateMachineStart", {})
  this.setDefault("firstServer", false)
  this.setDefault("verbose", 1)

  // all servers, ephemeral
  this.state = "follower" // follower, candidate, leader
  this.stateMachine = this._opts.stateMachineStart
  this._serverMap = {} // servers that are part of the cluster

  // candidate servers only, ephemeral
  this._votesResponded = {} // servers that sent requestVote in this term
  this._votesGranted = {} // servers that gave us a vote in this term

  // Other server state, ephemeral
  this._election_timer = null
  this._heartbeat_timer = null
  this._leaderId = null
  this._clientCallbacks = {} // client callbacks keyed by log index
  this._pendingPersist = false
  this._pendingConfigChange = false
  this._terminate = this.terminate
  this._request = this.clientRequest

  this._x = randomIntFromInterval(
    this._opts.offset,
    this._opts.gridWidth - this._opts.offset
  )
  // console.log(opts.stateMachineStart)
  this._y = randomIntFromInterval(
    this._opts.offset,
    this._opts.gridHeight - this._opts.offset
  )

  // this._x = opts.pos_cowboy[id][0]
  // this._y = opts.pos_cowboy[id][1]
  world.spawnCowboy(this._x, this._y, this.id)

  // Initialization: load any durable state from storage, become
  // a follower and start the election timeout timer. Schedule it to
  // happen immediately after the constructor returns.
  this.schedule(
    function () {
      this.info("Initializing")
      this.loadBefore(
        function () {
          this.info("Initialized")
        }.bind(this)
      )
    }.bind(this),
    0,
    { type: "Initialize" }
  )
}

//
// Utility functions
//
PaxosCowboyBase.prototype.setDefault = function (k, v) {
  var o = this._opts
  if (typeof o[k] === "undefined") {
    o[k] = v
  }
}
PaxosCowboyBase.prototype.msg = function (args, logger) {
  var now = new Date().getTime(),
    prefix = now + ": ID " + this.id + " [" + this.currentTerm + "]:"
  logger.apply(null, [prefix].concat(args))
}
PaxosCowboyBase.prototype.dbg = function () {
  if (this._opts.verbose > 1) {
    this.msg(Array.prototype.slice.call(arguments), this.logFn.bind(this))
  }
}
PaxosCowboyBase.prototype.info = function () {
  if (this._opts.verbose > 0) {
    this.msg(Array.prototype.slice.call(arguments), this.logFn.bind(this))
  }
}
PaxosCowboyBase.prototype.warn = function () {
  this.msg(Array.prototype.slice.call(arguments), this.warnFn.bind(this))
}
PaxosCowboyBase.prototype.error = function () {
  this.msg(Array.prototype.slice.call(arguments), this.errorFn.bind(this))
}

//
// Private methods
//

// Returns a list of all server IDs.
PaxosCowboyBase.prototype.servers = function () {
  return Object.keys(this._serverMap)
}

// Clear/cancel any existing election timer
PaxosCowboyBase.prototype.clear_election_timer = function () {
  if (this._election_timer) {
    this._election_timer = this.unschedule(this._election_timer)
  }
}

// Reset the election timer to a random between value between
// electionTimeout -> electionTimeout*2
PaxosCowboyBase.prototype.reset_election_timer = function () {
  var randTimeout =
    this._opts.electionTimeout +
    parseInt(Math.random() * this._opts.electionTimeout)
  this.clear_election_timer()

  this._election_timer = this.schedule(
    this.start_election.bind(this),
    randTimeout,
    { type: "start election" }
  )
}

// Set our term to new_term (defaults to currentTerm+1)
PaxosCowboyBase.prototype.update_term = function (new_term) {
  if (typeof new_term === "undefined") {
    new_term = this.currentTerm + 1
  }
  this.dbg("set term to: " + new_term)
  this.currentTerm = new_term
  this.votedFor = null
  this._pendingPersist = true
  this._votesResponded = {}
  this._votesGranted = {}
}

// Become a follower and start the election timeout timer
PaxosCowboyBase.prototype.step_down = function () {
  if (this.state === "follower") {
    return
  }
  this.info("new state 'follower'")
  this.state = "follower"
  if (this._heartbeat_timer) {
    this._heartbeat_timer = this.unschedule(this._heartbeat_timer)
  }
  if (!this._election_timer) {
    this.reset_election_timer()
  }
  world.stepDown(this.id)
}

// Send an RPC to each of the other servers
PaxosCowboyBase.prototype.sendRPCs = function (rpc, args) {
  var sids = this.servers()
  for (var i = 0; i < sids.length; i++) {
    var sid = sids[i]
    if (sid === this.id) {
      continue
    }
    this.sendRPC(sid, rpc, args)
  }
}

// If _pendingPersist is set then this means some aspect of our
// durable state has changed so call saveFn to save it to
// durable storage. Finally call callback.
PaxosCowboyBase.prototype.saveBefore = function (callback) {
  if (this._pendingPersist) {
    var data = {
      currentTerm: this.currentTerm,
      votedFor: this.votedFor,
      log: this.log,
    }
    this._pendingPersist = false
    this.saveFn(data, function (success) {
      if (!success) {
        error("Failed to persist state")
      }
      callback()
    })
  } else {
    callback()
  }
}

// Call loadFn to load our durable state from durable
// storage. If loadFn fails then initialize to starting state.
// Also initialize voting related state, then call callback.
PaxosCowboyBase.prototype.loadBefore = function (callback) {
  this.loadFn(
    function (success, data) {
      if (success && this._opts.firstServer) {
        this._opts.firstServer = false
        this.error("firstServer ignored because loadFn return true")
      }
      if (success) {
        // update state from the loaded data
        this.dbg("load stored data:", JSON.stringify(data))
        this.currentTerm = data.currentTerm
        this.votedFor = data.votedFor
        this.addEntries(data.log, true)

        this.info("Loaded durable state, starting election timer")
        // start as follower by default
        this.step_down()
        this.reset_election_timer()
      } else if (this._opts.firstServer) {
        // if no loaded data but we are the first server then
        // start with ourselves as the only member.
        this.dbg("started as first server")
        this.currentTerm = 0
        this.votedFor = null
        // Start with ourselves
        this.addEntries([{ newServer: this.id, oldServers: [] }], true)

        this.info("First server, assuming leadership")
        this.become_leader()
      } else {
        // if no loaded data and we are not the first server,
        // then we will have an empty log
        this.currentTerm = -1
        this.votedFor = null

        this.info("Not first server, waiting for initial RPC")
        this.clear_election_timer()
      }
      this._votesResponded = {}
      this._votesGranted = {}
      callback()
    }.bind(this)
  )
}

// Add an array of entries to the log.
PaxosCowboyBase.prototype.addEntries = function (entries, startup) {
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    if (typeof entry.term === "undefined") {
      entry.term = this.currentTerm
    }
    if (typeof entry.command === "undefined") {
      entry.command = null
    }

    if ("newServer" in entry) {
      this.dbg("adding newServer entry:", entry)
      this._serverMap[entry.newServer] = true
    } else if (entry.oldServer) {
      this.dbg("removing oldServer entry:", entry.oldServer)
      delete this._serverMap[entry.oldServer]
    }
    // console.log(entry)
    this.log[this.log.length] = entry
  }
}

// Apply log entries from this.lastApplied up to this.commitIndex
// by calling applyCmd on the current state of
// this.stateMachine.
// Figure 3.1, Rules for Servers, All Servers
PaxosCowboyBase.prototype.applyEntries = function () {
  while (this.commitIndex > this.lastApplied) {
    this.lastApplied += 1
    var entry = this.log[this.lastApplied],
      cmd = entry.command,
      callbacks = {},
      status = null,
      result = null
    if (cmd) {
      this.dbg("applying:", cmd)
      try {
        result = this.applyCmd(this.stateMachine, cmd)
        status = "success"
      } catch (exc) {
        result = exc.message
        status = "error"
      }
    }
    // call client callback for the committed cmds
    var clientCallback = this._clientCallbacks[this.lastApplied]

    if (clientCallback) {
      callbacks[this.lastApplied] = [clientCallback, status, result]
      delete this._clientCallbacks[this.lastApplied]
    }
    this.saveBefore(function () {
      for (var idx in callbacks) {
        var callback = callbacks[idx][0],
          status = callbacks[idx][1]
        result = callbacks[idx][2]
        callback({ status: status, result: result })
      }
    })
  }
}

// Return the log index that is stored on a majority of the
// servers in serverIds
PaxosCowboyBase.prototype.getMajorityIndex = function (serverIds) {
  // gather a list of current agreed on log indexes
  var agreeIndexes = [this.log.length - 1]
  for (var i = 0; i < serverIds.length; i++) {
    var sidi = serverIds[i]
    if (sidi === this.id) {
      continue
    }
    agreeIndexes.push(this.matchIndex[sidi])
  }
  // Sort the agree indexes and and find the index
  // at (or if even, just above) the half-way mark.
  // This index is the one that is stored on
  // a majority of the given serverIds.
  agreeIndexes.sort()
  var agreePos = Math.floor(serverIds.length / 2),
    majorityIndex = agreeIndexes[agreePos]
  return majorityIndex
}

PaxosCowboyBase.prototype.checkCommits = function () {
  var sids = this.servers(),
    majorityIndex = this.getMajorityIndex(sids)
  // Is our term stored on a majority of the servers
  if (majorityIndex > this.commitIndex) {
    var termStored = false
    for (var idx = majorityIndex; idx < this.log.length; idx++) {
      if (this.log[idx].term === this.currentTerm) {
        termStored = true
        break
      }
    }
    if (termStored) {
      this.commitIndex = Math.min(majorityIndex, this.log.length - 1)
      this.applyEntries()
    }
  }
}

// The core of the leader/log replication algorithm, called
// periodically (_opts.heartbeatTime) while a leader.
PaxosCowboyBase.prototype.leader_heartbeat = function () {
  if (this.state !== "leader") {
    return
  }

  var sids = this.servers()
  for (var i = 0; i < sids.length; i++) {
    var sid = sids[i]
    if (sid === this.id) {
      continue
    }
    if (typeof this.stateMachine["cowboys"][i] !== "undefined") {
      if (this.stateMachine["cowboys"][i]["isBusy"]) continue
    }

    //this.info("*** sid,nextIndex-1,commitIndex:", sid, nextIndex[sid]-1, this.commitIndex)
    var nindex = this.nextIndex[sid] - 1,
      nterm = this.log[nindex].term,
      nentries = this.log.slice(nindex + 1)
    if (nentries.length > 0) {
      this.dbg(
        "new entries to sid:",
        sid,
        "nentries:",
        JSON.stringify(nentries)
      )
    }

    this.sendRPC(sid, "appendEntries", {
      term: this.currentTerm,
      leaderId: this.id,
      prevLogIndex: nindex,
      prevLogTerm: nterm,
      entries: nentries,
      leaderCommit: this.commitIndex,
      // NOTE: These are additions to the basic Raft algorithm
      curAgreeIndex: this.log.length - 1,
    })

    // world.sendMessage(this.id, i, { type: "appendEntries" })
  }
  // we may be called directly so cancel any outstanding timer
  this.unschedule(this._heartbeat_timer)
  // queue us up to be called again
  this._heartbeat_timer = this.schedule(
    this.leader_heartbeat.bind(this),
    this._opts.heartbeatTime,
    { type: "leader heartbeat" }
  )

  // If we are the only member of the cluster then we need to
  // periodically check if entries are committed and whether
  // they need to be applied
  // console.log("hello1", this._clientCallbacks)
  this.checkCommits()
  // console.log("hello2", this._clientCallbacks)
}

// Checks a vote map against a server map. Return true if more
// than half of the servers in server map have votes in the vote
// map. Only if we have a majority is an election successful.
PaxosCowboyBase.prototype.check_vote = function (serverMap, voteMap) {
  var scnt = this.servers().length,
    need = Math.round((scnt + 1) / 2), // more than half
    votes = {}
  for (var k in serverMap) {
    if (k in voteMap) {
      votes[k] = true
    }
  }
  if (Object.keys(votes).length >= need) {
    return true
  } else {
    return false
  }
}

// Initialize nextIndex and matchIndex for each server. The
// optional argument indicates that the indexes should be
// initialized from scratch (rather than just updated for new
// members) which is done when we are a newly elected leader.
PaxosCowboyBase.prototype.update_indexes = function (from_scratch) {
  if (from_scratch) {
    this.nextIndex = {}
    this.matchIndex = {}
  }
  var sids = this.servers()
  for (var i = 0; i < sids.length; i++) {
    // start nextIndex set to the next entry in the log
    if (typeof this.nextIndex[sids[i]] === "undefined") {
      this.nextIndex[sids[i]] = this.log.length
    }
    // Start matchIndex set to commitIndex
    if (typeof this.matchIndex[sids[i]] === "undefined") {
      this.matchIndex[sids[i]] = this.commitIndex
    }
  }
}

// We won the election so initialize the leader state, record our
// win in the log (addition to Raft algorithm), and call the
// leader_heartbeat function.
PaxosCowboyBase.prototype.become_leader = function () {
  if (this.state === "leader") {
    return
  }
  this.info("new state 'leader'")
  this.state = "leader"
  this._leaderId = this.id
  this._votesResponded = {}
  this._votesGranted = {}
  this.votedFor = null
  this._pendingPersist = true

  // NOTE: this is an addition to the basic Raft algorithm:
  // add leader entry to log to force all previous entries to
  // become committed; at least one entry from leader's current
  // term must be added to the log before prior entries are
  // considered committed. Otherwise, read-only commands after
  // an election would return stale data until somebody does
  // an update command.
  this.addEntries([{ newLeaderId: this.id }])

  this.update_indexes(true)

  this.clear_election_timer()
  // start sending heartbeats (appendEntries) until we step down
  this.saveBefore(this.leader_heartbeat.bind(this))
  world.becomeLeader(this.id)
}

// Section 3.4 Leader Election
PaxosCowboyBase.prototype.start_election = function () {
  if (this.state === "leader") {
    return
  }
  if (typeof this.stateMachine["cowboys"][this.id] !== "undefined") {
    if (this.stateMachine["cowboys"][this.id]["isBusy"]) return
  }

  for (
    var i = this.currentTerm + 1;
    i < this.currentTerm + this._opts.numsCowboy + 1;
    i++
  ) {
    if (i % this._opts.numsCowboy == this.id) {
      this.update_term(i)
      break
    }
  }

  this.info("new state 'candidate'")
  this.state = "candidate"

  // vote for this
  this.votedFor = this.id
  this._votesGranted[this.id] = true
  this._pendingPersist = true
  // reset election timeout
  this.reset_election_timer()

  // TODO: reissue 'requestVote' quickly to non-responders while candidate
  this.sendRPCs("requestVote", {
    term: this.currentTerm,
    candidateId: this.id,
    leaderCommit: this.commitIndex,
  })
  world.becomeCandidate(this.id)
  // world.sendMessage(this.id, null, { type: "start election" })
}

// We are terminating either as a result of being removed by
// a membership change or by direct invocation (for
// testing/debug).
PaxosCowboyBase.prototype.terminate = function () {
  this.state = "corpose"
  this.info("terminating")
  // Disable any timers
  this._heartbeat_timer = this.unschedule(this._heartbeat_timer)
  this.clear_election_timer()
  // Ignore or reject RPC/API calls
  this.requestVote = function (args) {
    this.dbg("Ignoring requestVote(", args, ")")
  }
  this.appendEntries = function (args) {
    this.dbg("Ignoring appendEntries(", args, ")")
  }
}

//
// Overridable/"abstract" methods
//

PaxosCowboyBase.prototype.logFn = function () {
  console.log.apply(console, arguments)
}
PaxosCowboyBase.prototype.warnFn = function () {
  console.warn.apply(console, arguments)
}
PaxosCowboyBase.prototype.errorFn = function () {
  console.error.apply(console, arguments)
}
PaxosCowboyBase.prototype.schedule = function (fn, ms, data) {
  return setTimeout(fn, ms)
}
PaxosCowboyBase.prototype.unschedule = function (tid) {
  return clearTimeout(tid)
}
PaxosCowboyBase.prototype.sendRPC = function (data, callback) {
  throw new Error("sendRPC not overridden")
}
PaxosCowboyBase.prototype.applyCmd = function (data, callback) {
  throw new Error("applyCmd not overridden")
}
PaxosCowboyBase.prototype.saveFn = function (data, callback) {
  this.warn("saveFn not overridden, server recovery will not work")
  // no-op
  if (callback) {
    callback()
  }
}
PaxosCowboyBase.prototype.loadFn = function (data, callback) {
  this.warn("loadFn not overridden, server recovery will not work")
  // no-op
  if (callback) {
    callback()
  }
}

//
// Public API/methods/RPCs (Figure 2)
//

// requestVote RPC
//   args keys: term, candidateId, lastLogIndex, lastLogTerm
PaxosCowboyBase.prototype.requestVote = function (args) {
  this.dbg("requestVote:", JSON.stringify(args))

  // if term > currentTerm, set currentTerm to term (rules for
  // all servers)
  if (args.term > this.currentTerm) {
    this.update_term(args.term)
    this.step_down() // step down from candidate or leader
    this.votedFor = args.candidateId
    this._pendingPersist = true
    this.reset_election_timer()
    this.saveBefore(
      function () {
        this.sendRPC(args.candidateId, "requestVoteResponse", {
          term: this.currentTerm,
          voteGranted: true,
          // addition
          sourceId: this.id,
        })
        // world.sendMessage(this.id, this.votedFor, {
        //   type: "requestVoteResponse",
        //   voteGranted: true,
        // })
      }.bind(this)
    )

    return
  }
  // 1. reply false if term < currentTerm (3.3)
  if (args.term < this.currentTerm) {
    this.saveBefore(
      function () {
        this.sendRPC(args.candidateId, "requestVoteResponse", {
          term: this.currentTerm,
          voteGranted: false,
          // addition
          sourceId: this.id,
        })
      }.bind(this)
    )
    return
  }
  // 2. if votedFor is null or candidateId, and candidate's log
  //    is at least as up-to-date as receiver's log, grant vote
  //    (3.4, 3.6)
  //    - Also reset election timeout (TODO, is reset still
  //      correct?)
  // if (
  //   (this.votedFor === null || this.votedFor === args.candidateId) &&
  //   (args.lastLogTerm >= this.log[this.log.length - 1].term ||
  //     (args.lastLogTerm === this.log[this.log.length - 1].term &&
  //       args.lastLogIndex >= this.log.length - 1))
  // ) {
  //   // we have not voted for somebody else and the candidate
  //   // log at least as current as ours
  //   this.votedFor = args.candidateId
  //   this._pendingPersist = true
  //   this.reset_election_timer()
  //   this.saveBefore(
  //     function () {
  //       this.sendRPC(args.candidateId, "requestVoteResponse", {
  //         term: this.currentTerm,
  //         voteGranted: true,
  //         // addition
  //         sourceId: this.id,
  //       })
  //     }.bind(this)
  //   )
  //   return
  // }

  this.saveBefore(
    function () {
      this.sendRPC(args.candidateId, "requestVoteResponse", {
        term: this.currentTerm,
        voteGranted: false,
        // addition
        sourceId: this.id,
      })
    }.bind(this)
  )
  return
}

PaxosCowboyBase.prototype.requestVoteResponse = function (args) {
  this.dbg("requestVoteResponse:", JSON.stringify(args))

  // if term > currentTerm, set currentTerm to term (rules for
  // all servers)
  if (args.term > this.currentTerm) {
    // Does this happen? How?
    this.update_term(args.term)
    this.step_down() // step down from candidate or leader
    return
  }

  var other_id = args.sourceId
  if (this.state !== "candidate" || args.term < this.currentTerm) {
    // ignore
    return
  }
  if (args.voteGranted) {
    this.dbg("got vote from:", other_id)
    this._votesGranted[other_id] = true
  }
  this.dbg("current votes:", Object.keys(this._votesGranted))
  // Check if we won the election
  if (this.check_vote(this._serverMap, this._votesGranted)) {
    this.become_leader()
  }
}

// appendEntries RPC (Figure 3.2)
//   args keys: term, leaderId, prevLogIndex, prevLogTerm,
//              entries, leaderCommit
PaxosCowboyBase.prototype.appendEntries = function (args) {
  this.dbg("appendEntries:", JSON.stringify(args))

  // if term > currentTerm, set currentTerm to term (rules for
  // all servers)
  if (args.term > this.currentTerm) {
    this.update_term(args.term)
    this.step_down() // step down from candidate or leader
  }
  // 1. reply false if term < currentTerm
  if (args.term < this.currentTerm) {
    world.fire(this.id)
    // continue in same state

    this.saveBefore(
      function () {
        this.sendRPC(args.leaderId, "appendEntriesResponse", {
          term: this.currentTerm,
          success: false,
          // NOTE: These are additions to the basic Raft algorithm
          sourceId: this.id,
          isBusy: false,
          c: "really not busy",
          curAgreeIndex: args.curAgreeIndex,
          coordinate: [this._x, this._y],
        })
      }.bind(this)
    )
    // world.sendMessage(this.id, args.leaderId, {
    //   type: "appendEntriesResponse",
    //   success: false,
    // })
    return
  }
  // if candidate or leader, step down
  this.step_down() // step down from candidate or leader
  if (this._leaderId !== args.leaderId) {
    this._leaderId = args.leaderId
    this.info("new leader: " + this._leaderId)
  }

  // reset election timeout
  this.reset_election_timer()

  // TODO: if pending clientCallbacks this means we were
  // a leader and lost it, reject the clientCallbacks with
  // not_leader

  // 2. reply false if log doesn't contain an entry at
  //    prevLogIndex whose term matches prevLogTerm
  if (
    this.log.length - 1 < args.prevLogIndex ||
    this.log[args.prevLogIndex].term !== args.prevLogTerm
  ) {
    this.saveBefore(
      function () {
        this.sendRPC(args.leaderId, "appendEntriesResponse", {
          term: this.currentTerm,
          success: false,
          // NOTE: These are additions to the basic Raft algorithm.
          sourceId: this.id,
          isBusy: false,
          curAgreeIndex: args.curAgreeIndex,
          coordinate: [this._x, this._y],
        })
        // world.sendMessage(this.id, args.leaderId, {
        //   type: "appendEntriesResponse",
        //   success: false,
        // })
      }.bind(this)
    )
    return
  }
  // 3. If existing entry conflicts with new entry (same index
  //    but different terms), delete the existing entry
  //    and all that follow. TODO: make this match the
  //    description.
  if (args.prevLogIndex + 1 < this.log.length) {
    this.log.splice(args.prevLogIndex + 1, this.log.length)
  }
  // 4. append any new entries not already in the log
  if (args.entries.length > 0) {
    this.addEntries(args.entries)
    this._pendingPersist = true
  }

  // 5. if leaderCommit > commitIndex, set
  //    commitIndex = min(leaderCommit, index of last new entry)
  if (args.leaderCommit > this.commitIndex) {
    this.commitIndex = Math.min(args.leaderCommit, this.log.length - 1)
    this.applyEntries()
  }

  // world.sendMessage(this.id, args.leaderId, {
  //   type: "appendEntriesResponse",
  //   success: true,
  // })

  this.saveBefore(
    function () {
      this.sendRPC(args.leaderId, "appendEntriesResponse", {
        term: this.currentTerm,
        success: true,
        // NOTE: These are additions to the basic Raft algorithm
        sourceId: this.id,
        isBusy: false,
        coordinate: [this._x, this._y],
        curAgreeIndex: args.curAgreeIndex,
      })
    }.bind(this)
  )
}

PaxosCowboyBase.prototype.appendEntriesResponse = function (args) {
  this.dbg("appendEntriesResponse:", JSON.stringify(args))
  // if term > currentTerm, set currentTerm to term (rules for
  // all servers)
  if (args.term > this.currentTerm) {
    // Does this happen? How?
    update_term(args.term)
    step_down() // step down from candidate or leader
    return
  }

  var sid = args.sourceId
  if (args.success) {
    // A log entry is considered committed if
    // it is stored on a majority of the servers
    // also, at least one entry from the leader's
    // current term must also be stored on a majority
    // of the servers.

    this.matchIndex[sid] = args.curAgreeIndex
    this.nextIndex[sid] = args.curAgreeIndex + 1
    this.checkCommits()
    // console.log(this.id, this.stateMachine)
  } else {
    this.nextIndex[sid] -= 1
    if (this.nextIndex[sid] === 0) {
      // First log entry is always the same, so start with
      // the second (setting nextIndex[sid] to 0 results in
      // occasional errors from -1 indexing into the log)
      this.dbg("Forcing nextIndex[" + sid + "] to 1")
      this.nextIndex[sid] = 1
    }
    // TODO: resend immediately
    // console.log(this.log)
  }
  var id = args.sourceId
  var isBusy = args.isBusy
  var coordinate = args.coordinate
  // console.log(
  //   this.applyCmd(this.stateMachine, { op: "get", key: "cowboys", id: id })
  // )
  var value = this.applyCmd(this.stateMachine, {
    op: "get",
    key: "cowboys",
    id: id,
  })
  // console.log("value", value, coordinate)
  if (
    !value ||
    value.coordinate[0] !== coordinate[0] ||
    value.coordinate[1] !== coordinate[1]
  ) {
    this.addEntries([
      {
        op: "set",
        key: "cowboys",
        id: id,
        value: { coordinate: coordinate, isBusy: isBusy },
      },
    ])
    this.applyCmd(this.stateMachine, {
      op: "set",
      key: "cowboys",
      id: id,
      value: { coordinate: coordinate, isBusy: isBusy },
    })
    // this.update_indexes()
  }
}

// addServer (Figure 4.1)
//   args keys: newServer (id)
//   response: status, leaderHint
PaxosCowboyBase.prototype.addServer = function (args, callback) {
  this.dbg("addServer:", JSON.stringify(args))
  // 1. Reply NOT_LEADER if not leader (6.2)
  if (this.state !== "leader") {
    callback({ status: "NOT_LEADER", leaderHint: this._leaderId })
    return
  }

  // NOTE: this is an addition to the Raft algorithm:
  // Instead of doing steps 2 and 3, just reject config
  // changes while an existing one is pending.

  // 2. Catch up new server for a fixed number of rounds. Reply
  //    TIMEOUT if new server does not make progress for an
  //    election timeout or if the last round takes longer than
  //    the election timeout (4.2.1)
  // 3. Wait until previous configuration in the log is
  //    committed (4.1)
  if (this._pendingConfigChange) {
    callback({ status: "PENDING_CONFIG_CHANGE", leaderHint: this._leaderId })
    return
  }

  // NOTE: addition to Raft algorithm. If server is already
  // a member, reject it.
  if (args.newServer in this._serverMap) {
    callback({ status: "ALREADY_A_MEMBER", leaderHint: this._leaderId })
    return
  }

  // 4. Append new configuration entry to the log (old
  //    configuration plus newServer), commit it using majority
  //    of new configuration (4.1)
  this._pendingConfigChange = true
  this.addEntries([{ oldServers: this.servers(), newServer: args.newServer }])
  this._clientCallbacks[this.log.length - 1] = function () {
    this._pendingConfigChange = false
    // 5. Reply OK
    callback({ status: "OK", leaderHint: this._leaderId })
  }.bind(this)
  this.update_indexes()
  this._pendingPersist = true
  // trigger immediate async leader heartbeat
  this.schedule(this.leader_heartbeat.bind(this), 0)
}

PaxosCowboyBase.prototype.addServerResponse = function (args) {
  this.warn("addServerResponse not overridden, ignoring:", args)
}

// removeServer (Figure 4.1)
//   args keys: oldServer (id)
//   response: status, leaderHint
PaxosCowboyBase.prototype.removeServer = function (args, callback) {
  this.dbg("removeServer:", JSON.stringify(args))
  // 1. Reply NOT_LEADER if not leader (6.2)
  if (this.state !== "leader") {
    callback({ status: "NOT_LEADER", leaderHint: this._leaderId })
    return
  }

  // NOTE: this is an addition to the Raft algorithm:
  // Instead of doing step 2, just reject config changes while
  // an existing one is pending.

  // 2. Wait until previous configuration in the log is
  //    committed (4.1)
  if (this._pendingConfigChange) {
    callback({ status: "PENDING_CONFIG_CHANGE", leaderHint: this._leaderId })
    return
  }

  // NOTE: addition to Raft algorithm. If server is not in the
  // map, reject it.
  if (!args.oldServer in this._serverMap) {
    callback({ status: "NOT_A_MEMBER", leaderHint: this._leaderId })
    return
  }

  // 3. Append new configuration entry to the log (old
  //    configuration without oldServer), commit it using
  //    majority of new configuration (4.1)
  this._pendingConfigChange = true
  this.addEntries([{ oldServers: servers(), oldServer: args.oldServer }])
  this._clientCallbacks[this.log.length - 1] = function () {
    this._pendingConfigChange = false
    // 4. Reply OK, and if this server was removed, step down
    //    (4.2.2)
    // TODO: step down and terminate
    callback({ status: "OK", leaderHint: this._leaderId })
  }
  update_indexes()
  this._pendingPersist = true
  // trigger immediate async leader heartbeat
  // this.schedule(this.leader_heartbeat.bind(this), 0)
}

PaxosCowboyBase.prototype.removeServerResponse = function (args) {
  this.warn("removeServerResponse not overridden, ignoring:", args)
}

// clientRequest
//   - cmd is map that is opaque for the most part but may contain
//     a "ro" key (read-only) that when truthy implies the cmd is
//     a read operation that will not change the stateMachine and
//     is called with the stateMachine immediately.
//   - callback is called after the cmd is committed (or
//     immediately for a read-only cmd) and applied to the
//     stateMachine
PaxosCowboyBase.prototype.clientRequest = function (cmd) {
  // console.log(cmd.op, cmd)
  if (cmd.op === "report alien") {
    var sentCowboy = this.applyCmd(this.stateMachine, {
      op: "reinforce",
      cowboyId: cmd.cowboyId,
      alienId: cmd.alienId,
      alienCoordinate: cmd.alienCoordinate,
      leaderId: this.id,
    })

    var callback = function (args) {
      if (sentCowboy) {
        this.sendRPC(sentCowboy, "clientRequestResponse", cmd)
      }
    }.bind(this)

    if (this.state !== "leader") {
      // tell the client to use a different server
      callback({ status: "NOT_LEADER", leaderHint: this._leaderId })
      return
    }
    // NOTE: this is an addition to the basic Raft algorithm:
    // Read-only operations are applied immediately against the
    // current state of the stateMachine (i.e. committed state)
    // and are not added to the log. Otherwise, the cmd is added
    // to the log and the client callback will be called when the
    // cmd is is committed. See 8
    var tcmd = copyMap(cmd)
    delete tcmd.id
    if (tcmd.ro) {
      var status = null
      try {
        result = this.applyCmd(this.stateMachine, cmd)
        status = "success"
      } catch (exc) {
        result = exc
        status = "error"
      }
      callback({ status: status, result: result })
    } else {
      this._clientCallbacks[this.log.length] = callback
      this.addEntries([{ command: tcmd }])
      this._pendingPersist = true

      // trigger immediate async leader heartbeat
      this.schedule(this.leader_heartbeat.bind(this), 0)
    }
  } else {
    this.addEntries({ command: cmd })
    console.log("cccmmmmddd", cmd)
    this.applyCmd(this.stateMachine, cmd)
    this.schedule(this.leader_heartbeat.bind(this), 0)
  }
}

PaxosCowboyBase.prototype.clientRequestResponse = function (args) {
  if (args.op === "report alien") {
    console.log(world.aliens[args.alienId])
    world.cowboys[this.id].target = world.aliens[args.alienId]
  }
}

exports.copyMap = copyMap
exports.PaxosCowboyBase = PaxosCowboyBase

export { PaxosCowboyBase }
