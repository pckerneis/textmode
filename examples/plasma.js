// Classic "plasma" demo effect: a handful of sine waves summed together
// and mapped to an ascii ramp and a color band.

var CHARS = ' .:-=+*#%@';
var PALETTE = ['blue', 'cyan', 'green', 'yellow', 'red', 'magenta'];

function value() {
  var v = Math.sin(x * 0.2 + time) +
          Math.sin(y * 0.15 + time * 1.3) +
          Math.sin((x + y) * 0.1 + time * 0.7) +
          Math.sin(Math.sqrt(x * x + y * y) * 0.1 - time);

  return (v + 4) / 8; // normalize roughly to 0..1
}

function char() {
  var v = value();
  var index = Math.floor(v * (CHARS.length - 1));
  return CHARS.charAt(index);
}

function fg() {
  var v = value();
  var index = Math.floor(v * (PALETTE.length - 1));
  return PALETTE[index];
}

exports.char = char;
exports.fg = fg;
