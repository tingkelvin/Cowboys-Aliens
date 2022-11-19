import { startDemo_render } from "../../web/demo_render.js";
import { pos_cowboy } from "./view.js";

var setButton = document.getElementById("5");

setButton.onclick = function () {
  var numsAlien = document.getElementById("Alien Num").value,
    alienMovementSpeed = document.getElementById("Alien Speed").value,
    messageSpeed = document.getElementById("Mes Speed").value,
    numsCowboy = document.getElementById("Cowboy Num").value,
    alienAttackRange = document.getElementById("Alien Attack Range").value,
    cowboyAttackRange = document.getElementById("Cowboy Attack Range").value;
    var algoType = document.getElementById("algorithms").value;
    

  // Initialize
  if (numsAlien == "") {
    numsAlien = 20;
  } else {
    numsAlien = parseInt(numsAlien);
  }
  if (alienMovementSpeed == "") {
    alienMovementSpeed = 40;
  } else {
    console.log("hi", alienMovementSpeed);
    alienMovementSpeed = parseInt(alienMovementSpeed);
  }
  if (messageSpeed == "") {
    messageSpeed = 1;
  } else {
    messageSpeed = parseInt(messageSpeed);
  }
  if (numsCowboy == "") {
    numsCowboy = 15;
  } else if (numsCowboy <= 1) {
    // cannot have less than one cowboy
    numsCowboy == 2;
  } else {
    numsCowboy = parseInt(numsCowboy);
  }
  if (alienAttackRange == "") {
    alienAttackRange = 10;
  } else {
    alienAttackRange = parseInt(alienAttackRange);
  }
  if (cowboyAttackRange == "") {
    cowboyAttackRange = 10;
  } else {
    cowboyAttackRange = parseInt(cowboyAttackRange);
  }

  hideModal();
  //   creatRaft()
  // Merger demo_render.js enter game
  startDemo_render(
    pos_cowboy,
    numsAlien,
    alienMovementSpeed,
    messageSpeed,
    numsCowboy,
    alienAttackRange,
    cowboyAttackRange,
    algoType
  );
};

// Shawn: div for game
function hideModal() {
  var div = (document.getElementById("modal").style.display = "none");
  document.getElementById("content").style.display = "block";
}

// function creatRaft() {
//   var main = document.getElementById("main")
//   var new_div = document.createElement("div")
//   var str = "<div class='two_column'><div id='viz'><svg id='svg'></svg><div id='divs'></div></div><canvas id='canvas'></canvas><div id='tasks'><header><h2>Timeline</h2></header><input id='stepButton' value='Step' type='button' /><input id='exportButton' value='Export' type='button' /><ul id='taskList'></ul></div></div><div><textarea id='messages' rows=20></textarea></div>"
//   // var text = document.createTextNode(str)
//   new_div.innerHTML = str
//   main.appendChild(new_div)
// }

function creatInput() {
  var inputPare = document.getElementById("input");

  const name_mapping = {
    1: "Alien Num",
    2: "Alien Speed",
    3: "Alien Attack Range",
    4: "Mes Speed",
    5: "Cowboy Num",
    6: "Cowboy Attack Range",
  };

  for (let i = 1; i <= Object.keys(name_mapping).length; i++) {
    var content = document.createElement("div");
    var className = document.createAttribute("class");
    className.value = "content";
    content.setAttributeNode(className);
    var str =
      "<input type='text' id='" +
      name_mapping[i] +
      "'/><label>" +
      name_mapping[i] +
      "</label>";
    content.innerHTML = str;
    inputPare.appendChild(content);
  }
}

function start() {
  creatInput();
}

start();
