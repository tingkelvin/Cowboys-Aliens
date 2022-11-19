const DIRECTIONS = [ [-1, 0], [1, 0],[0, 1],[0, -1] ];

function getShortestPath(start_x, start_y, end_x, end_y, row, col) {
  const queue = [
    [
        [start_x, start_y]
    ]
  ]; 
  const visited = new Set();

  while (queue) {
    let path = queue.shift();
    let length = path.length;
    let x = path[length - 1][0];
    let y = path[length - 1][1];

    for (let i = 0; i < DIRECTIONS.length; i++) {
      let _x = x + DIRECTIONS[i][0];
      let _y = y + DIRECTIONS[i][1];

      if (!isValid(_x, _y, row, col, visited)) {
        continue;
      }

      let new_path = [...path, [_x, _y]];
      if (_x == end_x && _y == end_y) {
        return new_path;
      }
      queue.push(new_path);
    }
  }

  return [];
}

function isValid(x, y, row, col, visited) {
  if (x < 0 || x >= row || y < 0 || y >= col) {
    return false;
  }
  if (visited.has(x * col + y)) {
    return false;
  }
  return true;
}


export { getShortestPath };
