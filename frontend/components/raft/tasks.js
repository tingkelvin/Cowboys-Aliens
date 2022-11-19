/*
 * raft.js: Raft consensus algorithm in JavaScript
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for description and usage instructions.
 */

"use strict"
import { world } from "../stimulation.js"
// An Task/Event Queue system. The primary methods are scheduling
// a task (schedule, scheduleRand), cancelling a task (cancel), and
// executing the next task.
// The opts map take the following keys:
//   - verbose: enable/disable verbose loggin
//   - scheduleCallback: called when a task is scheduled. Passed the
//     new task.
//   - cancelCallback: called when a task is cancelled. Passed the
//     cancelled task.
//   - startCallback: called right before a task is executed. Passed
//     the task that is about to run.
//   - finishCallback: called right after a task is executed. Passed
//     the task that just ran.
// Tasks are stored as an array of:
//   {id:     TASK_ID,
//    action: ACTION_FUNCTION,
//    time:   MS_TIME,
//    data:   MAP_OF_DATA_ATTRIBUTES}
function Tasks(opts) {
  var nextId = 1,
    curTime = 0,
    tasks = [],
    api = {}
  opts = opts || {}

  // Find the chronological position in the tasks queue for this
  // new task and insert it there. Returns the unique ID of this
  // task (for use with cancel).
  api.schedule = function (action, timeOffset, data) {
    // console.log(data)
    var idx = tasks.length,
      tid = nextId++,
      time = curTime + timeOffset,
      task = {
        id: tid,
        action: action,
        time: time,
        data: data,
      }
    // console.log(task)
    // TODO: this should be binary search
    for (; idx > 0; idx--) {
      if (tasks[idx - 1].time <= time) {
        break
      }
    }
    tasks.splice(idx, 0, task)
    if (opts.scheduleCallback) {
      opts.scheduleCallback(task)
    }
    return tid
  }

  // Like schedule but picks a random timeOffset between min and max
  api.scheduleRand = function (action, min, max, data) {
    var timeOffset = Math.floor(Math.random() * (max - min) + min)
    return api.schedule(action, timeOffset, data)
  }

  // Remove the task with ID id from the tasks queue
  api.cancel = function (id) {
    var task = null
    if (opts.verbose) {
      console.log("Cancelling task ID " + id)
    }
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        task = tasks[i]
        tasks.splice(i, 1)
        break
      }
    }
    if (opts.cancelCallback && task) {
      opts.cancelCallback(task)
    }
  }

  // Return the task at the front of the tasks queue without
  // removing it
  api.current = function () {
    return tasks[0]
  }

  // Return the task queue
  api.dump = function () {
    return tasks
  }

  // Return the task queue
  api.show = function () {
    console.log("Current time: " + curTime + "ms")
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i],
        type = t.data.type || t.action.name,
        msg = t.time + "ms: " + t.id + " " + " [" + type + "]"
      if (t.data.desc) {
        msg += " " + t.data.desc
      }
      console.log(msg)
    }
  }

  // Return the current time
  api.currentTime = function () {
    return curTime
  }

  //api.start(factor) {}
  //api.stop() {}

  // Advanced the time to the next task in the queue, remove it,
  // and execute it's action. Returns the new "current" time.
  api.step = function () {
    if (tasks.length === 0) {
      console.warn("Step called on empty tasks queue")
      return null
    }

    var task = tasks.shift()
    var type = task.data.type
    var src = Number(task.data.src)
    var dst = Number(task.data.dst)
    var msg = "Executing task ID " + task.id
    // console.log(task)
    // if (task.data.src === "Aliens" && task.data.type === "Move"){
    //   api.schedule(task.action, 50, task.data)
    // }
    // console.log(task)

    switch (type) {
      case "Move":
        if (src === "Aliens") api.schedule(task.action, 50, task.data)
        break
      // case "start election":
      //   world.sendMessage("start election", Number(task.data.idx), null)
      //   break
      // case "RPC":
      //   switch (task.data.rpc) {
      //     case "requestVote":
      //       world.sendMessage("requestVote", src, dst)
      //       break

      //     case "requestVote":
      //       world.sendMessage("requestVote", src, dst)
      //       break
      //     case "fire":
      //       world.sendMessage("fire", src, dst)
      //   }
    }
    // console.log(task)
    // if (task.data.type === "start election"){
    //   world.sendMessage("start election", Number(task.data.idx), null)
    // }

    if (opts.startCallback) {
      opts.startCallback(task)
    }
    if (task.data.type) {
      msg += " [" + task.data.type + "]"
    }
    if (task.data.desc) {
      msg += " " + task.data.desc
    }
    if (opts.verbose) {
      console.log(msg)
    }
    // prevTime = tasks[0].time
    // console.log(task.data, curTime, "=>", task.time)
    curTime = task.time
    if (task.data.src === "Aliens" && task.data.type === "Move") {
      // console.log(task.data.speed)
      api.schedule(task.action, task.data.speed, task.data)
    }
    task.action()

    // console.log(taskTime, curTime)
    if (opts.finishCallback) {
      opts.finishCallback(task)
    }
    return curTime
  }

  return api
}

export { Tasks }
