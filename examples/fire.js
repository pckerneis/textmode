// The classic "Doom fire" cellular automaton: heat rises from the
// bottom row, decaying and drifting sideways at random as it goes.
// Uses "frame" because each cell's next heat depends on the cell below it.

var heat = null;
var lastCols = 0;
var lastRows = 0;

var PALETTE = [
  { ch: ' ', fg: 'default' },
  { ch: '.', fg: 'red' },
  { ch: ':', fg: 'red' },
  { ch: '+', fg: 'red' },
  { ch: '*', fg: 'yellow' },
  { ch: '%', fg: 'yellow' },
  { ch: '#', fg: 'brightyellow' },
  { ch: '@', fg: 'brightwhite' }
];

function setup(cols, rows) {
  var x, y;

  heat = [];

  for (y = 0; y < rows; y++) {
    heat.push([]);
    for (x = 0; x < cols; x++) {
      heat[y].push(0);
    }
  }

  lastCols = cols;
  lastRows = rows;
}

function frame(buffer, t, cols, rows) {
  var x, y, src, decay, level, spread, cell, paletteEntry;

  if (heat === null || lastCols !== cols || lastRows !== rows) {
    setup(cols, rows);
  }

  for (x = 0; x < cols; x++) {
    heat[rows - 1][x] = PALETTE.length - 1;
  }

  for (y = 0; y < rows - 1; y++) {
    for (x = 0; x < cols; x++) {
      src = heat[y + 1][x];
      decay = Math.floor(Math.random() * 3);
      level = src - decay;
      if (level < 0) {
        level = 0;
      }

      spread = x + Math.floor(Math.random() * 3) - 1;
      if (spread < 0) {
        spread = 0;
      }
      if (spread > cols - 1) {
        spread = cols - 1;
      }

      heat[y][spread] = level;
    }
  }

  for (y = 0; y < rows; y++) {
    for (x = 0; x < cols; x++) {
      level = heat[y][x];
      if (level > PALETTE.length - 1) {
        level = PALETTE.length - 1;
      }

      paletteEntry = PALETTE[level];
      cell = buffer[y][x];
      cell.ch = paletteEntry.ch;
      cell.fg = paletteEntry.fg;
    }
  }
}

exports.frame = frame;
