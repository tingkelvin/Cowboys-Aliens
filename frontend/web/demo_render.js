// String format function: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
// Kelvin : modify the string formating
import { tqueueOpts, cowboyPool, tqueue } from "../components/stimulation.js"
import { startStimulation, world } from "../components/stimulation.js"

function startDemo_render(
  pos_cowboy,
  numsAlien,
  alienMovementSpeed,
  messageSpeed,
  numsCowboy,
  alienAttackRange,
  cowboyAttackRange,
  algoType,
  dataRecord = {
    Step_Interval: [null],
    Cowboys_Alive: [null],
    Alien_Defeated: [null],
    Total_Election: [null],
    Total_Message_Pass: [null],
    Total_Fires: [null],
  }
) {
  // example: String.format('{0} is dead, but {1} is alive! {0} {2}', 'ASP', 'ASP.NET'); ==> ASP is dead, but ASP.NET is alive! ASP {2}
  if (!String.prototype.format) {
    String.prototype.format = function () {
      var args = arguments
      return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != "undefined" ? args[number] : match
      })
    }
  }

  function padNum(n, width, z) {
    z = z || "0"
    n = n + ""
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
  }

  var svg_s = document.getElementById("svg")
  var currentW = svg_s.clientWidth
  let lastW = currentW

  var width = currentW,
    height = currentW

  var nodes = [],
    links = []

  var stepButton = document.getElementById("stepButton"),
    jumpButton = document.getElementById("jumpButton"),
    startButton = document.getElementById("startButton"),
    speedButton = document.getElementById("speedOption"),
    stopButton = document.getElementById("stopButton"),
    taskList = document.getElementById("taskList"),
    messages = document.getElementById("messages")

  var node_template =
    '\
  <div class="name">{0}</div>\
  <div class="state">{1}</div>\
  <div class="term">{2}</div>\
  <div class="log">Log - {3} / {4}</div>'

  //
  // d3.js specific
  //
  // Size the svg area for displaying the links
  var svg = d3.select("#svg").attr("width", width).attr("height", height)

  // Size the div area for displaying the nodes
  var divs = d3.select("#divs").attr("style", function (d) {
    return "width: " + width + "px; height: " + height + "px;"
  })

  // Per-type markers, as they don't inherit styles.
  svg
    .append("svg:defs")
    .selectAll("marker")
    .data(["plain", "green", "dashed", "red"])
    .enter()
    .append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    //.attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")

  var force = d3.layout
    .force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(275)
    .charge(-300)
    .on("tick", tick)

  var path = svg.append("svg:g").selectAll("path"),
    label = svg.selectAll("text"),
    node = divs.selectAll(".node")

  function tick() {
    if (!node[0][0]) {
      return
    }

    var ox = node[0][0].offsetWidth / 2,
      oy = node[0][0].offsetHeight / 2

    node.attr("style", function (d) {
      return "left: " + (d.x - ox) + "px; top: " + (d.y - oy) + "px;"
    })

    path.attr("d", function (d) {
      var tx = d.target.x,
        ty = d.target.y,
        sx = d.source.x,
        sy = d.source.y
      if (d.type === "dashed") {
        return ["M", sx, sy, "L", tx, ty].join(" ")
      } else {
        return ["M", sx, sy, "L", (sx + tx) / 2, (sy + ty) / 2].join(" ")
      }
    })

    label
      .attr("x", function (d) {
        //return (d.source.x*2 + d.target.x)/3;
        return (d.source.x * 1.5 + d.target.x) / 2.5
      })
      .attr("y", function (d) {
        //return (d.source.y*2 + d.target.y)/3;
        return (d.source.y * 1.5 + d.target.y) / 2.5
      })
  }

  function updateD3() {
    // Links (connections and RPCs)
    path = path.data(force.links())
    // Add
    path.enter().append("svg:path")
    path
      .attr("class", function (d) {
        return "link " + d.type
      })
      .attr("marker-end", function (d) {
        if (d.type === "dashed") {
          return ""
        } else {
          return "url(#" + d.type + ")"
        }
      })
    // Remove
    path.exit().remove()

    // Links (connections and RPCs)
    label = label.data(force.links())
    // Add
    label.enter().append("text")
    label
      .attr("font-size", "0.75em")
      .attr("fill", "black")
      .text(function (d) {
        if (!d.task || !"rpc" in d.task.data) {
          return ""
        }
        var tdata = d.task.data,
          targs = tdata.args,
          txt = tdata.rpc
        switch (tdata.rpc + "_" + tdata.type) {
          case "requestVote_RPC":
            txt += " (" + targs.term
            txt += "," + targs.candidateId
            txt += "," + targs.lastLogIndex
            txt += "," + targs.lastLogTerm + ")"
            break
          case "appendEntries_RPC":
            txt += " (" + targs.term
            txt += "," + targs.leaderId
            txt += "," + targs.prevLogIndex
            txt += "," + targs.prevLogTerm
            txt += ",{" + targs.entries.length + "}"
            txt += "," + targs.commitIndex + ")"
            break
          case "requestVote_RPC_Response":
            txt += " Rsp (" + targs.term
            txt += "," + targs.voteGranted + ")"
            break
          case "appendEntries_RPC_Response":
            txt += " Rsp (" + targs.term
            txt += "," + targs.success + ")"
            break
        }
        return txt
      })
    // Remove
    label.exit().remove()

    // Nodes
    node = node.data(force.nodes())
    // Add
    node
      .enter()
      .append("div")
      .attr("id", function (d) {
        return "Cowboy" + d.id
      })
      .call(force.drag)
    // Update
    node
      .attr("class", function (d) {
        return "node " + d.state
      })
      .html(function (d) {
        var id = d.id
        return node_template.format(
          d._serverMap[id],
          d.state,
          "T" + d.currentTerm,
          d.commitIndex + 1,
          d.log.length
        )
      })
    // Remove
    node.exit().remove()

    force.start()
  }

  function updateTasks() {
    while (taskList.firstChild) {
      taskList.removeChild(taskList.firstChild)
    }
    var tasks = tqueue.dump()
    // console.log(tasks);
    for (var i = 0; i < tasks.length; i++) {
      var li = document.createElement("li")
      var t = tasks[i],
        d = t.data,
        time = padNum(t.time, 4, "0"),
        msg
      var ms = t.time % 1000
      var s = ((t.time - ms) / 1000) % 60
      msg = t.id + "@" + s + "s" + ms + "ms: " + " [" + d.id
      if (d.rpc) {
        msg += " " + d.rpc
      }
      msg += " " + d.type + "]"
      if (d.desc) {
        msg += " " + d.desc
      }
      li.innerHTML = msg
      taskList.appendChild(li)
    }
  }

  // Register callback functions to monitor changes to the task queue
  tqueueOpts.scheduleCallback = function (task) {
    if (task.data.rpc) {
      var src = cowboyPool[task.data.src],
        dst = cowboyPool[task.data.dst],
        type
      if (task.data.type === "RPC") {
        type = "green"
      } else {
        type = "red"
      }
      links.push({
        task_id: task.id,
        task: task,
        type: type,
        source: src,
        target: dst,
      })
      // console.log("schedule RPC:", task)
    }
  }

  //Kelvin: tqueneOpts is an object in test_tasks.js
  tqueueOpts.finishCallback = function (task) {
    if (task.data.rpc) {
      // console.log("finish RPC:", task)
      for (var i = links.length - 1; i >= 0; i--) {
        if (links[i].task_id === task.id) {
          links.splice(i, 1)
          break
        }
      }
    }
  }
  tqueueOpts.cancelCallback = tqueueOpts.finishCallback

  // Kelvin: calling the startcowboy function in test_tasks.js
  startStimulation(
    {
      debug: true,
      verbose: 2,
      gridHeight: 100,
      gridWidth: 100,

      alienMovementSpeed: alienMovementSpeed,
      alienAttackRange: alienAttackRange,
      cowBoyAttackRange: cowboyAttackRange,
      offset: 30,
      messageSpeed: 1,
      numsAlien: 2 || numsAlien,
      numsCowboy: pos_cowboy.length || numsCowboy,
      pos_cowboy: pos_cowboy,
      algoType: algoType,
    },
    10,
    function (msg) {
      messages.innerHTML += msg + "\n"
      messages.scrollTop = messages.scrollHeight
    }
  )

  // initialize the statistics board
  document.getElementById("cowboyAlive").innerHTML =
    "Cowboy Alive         : " + numsCowboy
  document.getElementById("alienDefeat").innerHTML = "Alien Defeat         : 0"
  document.getElementById("electionSuccessed").innerHTML =
    "Elections Successed  : 0"
  document.getElementById("totalMsgPass").innerHTML = "Total Message Passed : 0"
  document.getElementById("totalFires").innerHTML = "Total Fires Times    : 0"
  document.getElementById("currentLeader").innerHTML =
    "Current Leader       : 0"

  // Populate the nodes from the cowboyPool
  for (var k in cowboyPool) {
    nodes.push(cowboyPool[k])
  }

  // Populate the fully interconnected dashed lines
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      links.push({ source: nodes[i], target: nodes[j], type: "dashed" })
    }
  }

  document.getElementById("exportButton").addEventListener(
    "click",
    function () {
      // Generate download of hello.txt file with some content
      var child = document.getElementById("StatBoard").childNodes
      var content = ""

      for (let i = 1; i < child.length; i += 2) {
        content += child[i].innerHTML + "\n"
      }

      for (var prop in dataRecord) {
        if (typeof dataRecord[prop] == "string") {
          content += prop + dataRecord[prop] + "\n"
        } else {
          content += prop + dataRecord[prop] + "\n"
        }
      }

      var filename = "Result.csv"
      // exportResult(filename, text)
      const element = document.createElement("a")
      //data type that can store binary data
      const blob = new Blob([content], {
        //  type:'plain/text'
        type: "text/csv;charset=utf-8;",
      })
      //createObjectUrl() static method creates a DOMstring containing
      //a URL representing the object given in the parameter
      const fileUrl = URL.createObjectURL(blob)

      //file location
      element.setAttribute("href", fileUrl)
      element.setAttribute("download", filename)
      element.style.display = "none"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },
    false
  )

  var worldTime = 0
  tqueue.step()
  updateTasks()
  updateD3()
  var jump = true
  var stepCounter = 0
  stepButton.onclick = function () {
    var queneTime = tqueue.current().time
    //  console.log(tqueue.show())
    // console.log(worldTime)
    while (queneTime === worldTime) {
      tqueue.step()
      updateTasks()
      updateD3()
      queneTime = tqueue.current().time
    }
    requestAnimationFrame(() => world.doTick())
    worldTime++
    stepCounter++
    stopWatch(worldTime + 2)
    cowboyAlive()
    // console.log(worldTime)

    if (stepCounter % 100 == 0) {
      // export the integer from current message board
      var cowboy_Alive = parseInt(
        document.getElementById("cowboyAlive").innerHTML.split(": ").slice(-1)
      )
      var Alien_Defeated = parseInt(
        document.getElementById("alienDefeat").innerHTML.split(": ").slice(-1)
      )
      var Total_Election = parseInt(
        document
          .getElementById("electionSuccessed")
          .innerHTML.split(": ")
          .slice(-1)
      )
      var Total_Message_Pass = parseInt(
        document.getElementById("totalMsgPass").innerHTML.split(": ").slice(-1)
      )
      var Total_Fires = parseInt(
        document.getElementById("totalFires").innerHTML.split(": ").slice(-1)
      )

      dataRecord.Step_Interval.push(stepCounter)
      dataRecord.Cowboys_Alive.push(cowboy_Alive)
      dataRecord.Alien_Defeated.push(Alien_Defeated)
      dataRecord.Total_Election.push(Total_Election)
      dataRecord.Total_Message_Pass.push(Total_Message_Pass)
      dataRecord.Total_Fires.push(Total_Fires)
      console.log(dataRecord)
    }
  }

  jumpButton.onclick = function () {
    worldTime = tqueue.current().time
    console.log(worldTime)
    //   tqueue.step()
    //   updateTasks()
    //   updateD3()
    //   requestAnimationFrame(() => world.doTick())
  }

  var autoStep
  var AutoSpeed = 70
  // var timeVar
  // var checkCowboy
  var speedIng = 1
  startButton.onclick = function () {
    autoStep = window.setInterval(stepButton.onclick, AutoSpeed / speedIng)
    startButton.disabled = true
    speedButton.disabled = false
    stopButton.disabled = false
  }

  // change step speed by onclick event
  speedButton.onclick = function () {
    speedIng++
    speedButton.value = speedIng + "xSpeed"
    window.clearInterval(autoStep)
    autoStep = window.setInterval(stepButton.onclick, AutoSpeed / speedIng)
    if (speedIng === 5) {
      speedIng = 0
    }
  }

  stopButton.onclick = function () {
    window.clearInterval(autoStep)
    // clearInterval(timeVar)
    startButton.disabled = false
    speedButton.disabled = true
    stopButton.disabled = true
  }

  var ms, s
  function stopWatch(tt) {
    // tt = tt + 10
    ms = tt % 1000
    s = ((tt - ms) / 1000) % 60
    document.getElementById("stopWatch").innerHTML = s + "s" + ms + "ms"
  }

  function cowboyAlive() {
    var alive = world.checkCowboy()
    document.getElementById("cowboyAlive").innerHTML =
      "Cowboy Alive         : " + alive
    if (alive == 0) {
      console.log("Game over, time using " + s + "s" + ms + "ms.")
      window.clearInterval(autoStep)

      // clearInterval(timeVar)
      // clearInterval(checkCowboy)
      alert("Game over, time using\n " + s + "S " + ms + "MS.")
    }
  }
  reconfigButton.onclick = function () {
    document.getElementById("content").style.display = "none"
    document.getElementById("modal").style.display = "block"
  }

  window.addEventListener("resize", function () {
    currentW = svg_s.clientWidth

    if (currentW !== lastW) {
      width = currentW
      height = currentW
      var divs = d3.select("#divs").attr("style", function (d) {
        return "width: " + width + "px; height: " + height + "px;"
      })
      node = divs.selectAll(".node")
      // console.log(currentW);
    }

    lastW = currentW
  })
}

export { startDemo_render }
