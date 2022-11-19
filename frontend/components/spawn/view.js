import { Grid } from "./components/grid.js";
import { Button } from "./components/button.js";

const color_mapping = {
  Cowboy: "green",
  Alien: "red",
  Base: "yellow",
};

var pos_cowboy = [];
console.log(document.getElementById("content").style.display);

function generateGridMatrix(row, col, ref) {
  const gridMatrix = document.getElementsByClassName("grid_container")[0];

  // generate gridMatrix
  for (let r = 0; r < row; r++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let c = 0; c < col; c++) {
      const id = r * col + c;
      const gridItem = Grid(id, id);
      row.appendChild(gridItem);
    }

    gridMatrix.appendChild(row);
  }

  // add onclick listener, change grid color
  gridMatrix.onclick = function (e) {
    const element = e.target;
    var element_id = element.id;

    if (element.style.backgroundColor == "white") {
      element.style.backgroundColor = ref.grid_color;
      // save selected positions of cowboy in array
      if (ref.grid_color == "green") {
        pos_cowboy.push(element_id);
      }
    } else {
      // pop canceled selection of cowboy's position out of array
      if (ref.grid_color == "green") {
        pos_cowboy.pop(element_id);
      }
      element.style.backgroundColor = "white";
    }
    console.log(pos_cowboy);
  };
}

function generateButton(ref) {
  const button_list = document.getElementsByClassName("button_list")[0];

  const name_mapping = {
    1: "Cowboy",
    2: "Alien",
    3: "Base",
  };

  // button to select object
  for (let i = 1; i <= 3; i++) {
    // Button(className, value, textContent, id)
    const button = Button(
      "button_listItem",
      name_mapping[i],
      name_mapping[i],
      i
    );

    // add event listener
    button.onclick = function (e) {
      const object_name = e.target.value;
      ref.grid_color = color_mapping[object_name];
    };

    button_list.appendChild(button);
  }

  // Shawn: add set button
  const setbutton = Button(
    "button_list",
    "Set Configuration",
    "Set Configuration",
    5
  );
  button_list.appendChild(setbutton);

  // button reset
  // Button(className, value, textContent, id)
  const button = Button("button_listItem", "reset", "reset", 4);
  button.onclick = function (e) {
    resetGrid(ref);
  };
  button_list.appendChild(button);
}

function resetGrid(ref) {
  for (let r = 0; r < ref.row; r++) {
    for (let c = 0; c < ref.col; c++) {
      const div = document.getElementById(r * ref.col + c);
      div.style.backgroundColor = "white";
    }
  }
  ref.grid_color = "white";
}

export { generateGridMatrix, generateButton, pos_cowboy };
