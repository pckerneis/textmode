// ----------------------
// Water ripple by pck404
// ----------------------

var lastCols = 0;
var lastRows = 0;

var previous = null;
var current = null;
var next = null;

var DAMP = 0.9;

function buildGrid() {
  var grid = [];
  
  for (let y = 0; y < height; ++y) {
    let row = [];
      
    for (let x = 0; x < width; ++x) {
      row.push(0);
    }
      
    grid.push(row);
  }
  
  return grid;
  
}

exports.frame = function (grid) {
  if (current == null || previous == null || next == null) {
    current = buildGrid();
    previous = buildGrid();
    next = buildGrid();
  }
  
  if (frame % 10 == 0) {
    const edge = Math.min(width, height) / 5;
    let x = edge + Math.floor(Math.random() * (width - 2 * edge));
    let y = edge + Math.floor(Math.random() * (height - 2 * edge));
    
    const r = 5;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        let xx = x + dx;
        let yy = y + dy;

        if (xx < 0 || xx >= width || yy < 0 || yy >= height)
          continue;

        let d2 = dx*dx + dy*dy;
        current[yy][xx] += 0.4 * Math.exp(-d2 / 2);
      }
    }
  }
  
  for (let y = 0; y < height; ++y) {
    const row = current[y];
    
    for (let x = 0; x < width; ++x) {
      let left = x == 0 ? 0 : row[x - 1];
      let right = x == width - 1 ? 0 : row[x + 1];
      let up = y == 0 ? 0 : current[y - 1][x];
      let down = y == height - 1 ? 0 : current[y + 1][x];
      let prev = previous[y][x];
      let ul = (x == 0 || y == 0) ? 0 : current[y - 1][x - 1];
      let ur = (x == width - 1 || y == 0) ? 0 : current[y - 1][x + 1];
      let dl = (x == 0 || y == height - 1) ? 0 : current[y + 1][x - 1];
      let dr = (x == width - 1 || y == height - 1) ? 0 : current[y + 1][x + 1];
      
      let sum = left + right + up + down + 0.707 * (ul + ur + dl + dr);
			next[y][x] = (sum / (4 + 4 * 0.707) * 2 - prev) * DAMP;
      
      let edge = Math.min(x, y, width-1-x, height-1-y);
      let absorb = Math.min(1, edge / Math.min(12, width/5, height/5));
      absorb *= absorb;

      next[y][x] *= absorb;
    }
  }
  
  
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      const cell = grid[y][x];
      
      const left = x == 0 ? 0 : current[y][x - 1];
      const right = x == width - 1 ? 0 : current[y][x + 1];
      const down = y == 0 ? 0 : current[y - 1][x];
      const up = y == height - 1 ? 0 : current[y + 1][x];
      const gx = right - left;
      const gy = down - up;

      const v = Math.sqrt(gx*gx + gy*gy);

      const chars = " .:-=+*#%@";

      const a = Math.min(1, Math.abs(v) * 8);
      const i = Math.floor(a * (chars.length - 1));

cell.ch = chars[i];
      
      cell.fg = 7;
      cell.bg = 4;
    }
  }
  
  const tmp = previous
  previous = current;
  current = next;
  next = tmp;
};
