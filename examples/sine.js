// A single scrolling sine wave with a static midline, the "hello world"
// of text shaders.

function wave(x, t, rows) {
  var mid = rows / 2;
  var amplitude = rows / 3;
  return Math.round(mid
    + (Math.sin(x * 0.3 + t * 2) * amplitude)
    + (Math.sin(x * 0.13 + t * 1.34) * amplitude * 0.8)
    + (Math.sin(x * 5.33 + t * 5.32) * amplitude * 0.026)
  );
}

function char(x, y, t, cols, rows) {
  var lineY = wave(x, t, rows);

  if (y === lineY) {
    return '*';
  }
  if (y === Math.round(rows / 2)) {
    return '-';
  }
  return ' ';
}

function fg(x, y, t, cols, rows) {
  var lineY = wave(x, t, rows);

  if (y === lineY) {
    return 'yellow';
  }
  return 'gray';
}

exports.char = char;
exports.fg = fg;
