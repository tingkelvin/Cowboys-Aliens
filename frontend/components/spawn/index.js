import { getShortestPath } from "./util.js"
import { generateGridMatrix, generateButton } from "./view.js"

// reference passed to lower function
const ref = {
  row: 30,
  col: 30,
  grid_color: "white",
  cowboy: [],
  alien: null,
  base: [],
}

generateGridMatrix(ref.row, ref.col, ref)
generateButton(ref)

// function getShortestPath(start_x, start_y, end_x, end_y, row, col)
// console.log(getShortestPath(0, 0, 4, 5, 6, 6));
