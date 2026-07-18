// 16-color ANSI palette used by both fg() and bg() shader functions.
// Colors can also be given as a 256-color palette index (0-255).

var CODES = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  gray: 90,
  grey: 90,
  brightred: 91,
  brightgreen: 92,
  brightyellow: 93,
  brightblue: 94,
  brightmagenta: 95,
  brightcyan: 96,
  brightwhite: 97,
  default: 39
};

function isIndex(value) {
  return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 255;
}

function fgCode(name) {
  var code;

  if (name === undefined || name === null || name === '') {
    return CODES.default;
  }

  if (isIndex(name)) {
    return '38;5;' + Math.floor(name);
  }

  code = CODES[name];

  if (typeof code === 'undefined') {
    return CODES.default;
  }

  return code;
}

function bgCode(name) {
  var code;

  if (name === undefined || name === null || name === '' || name === 'default') {
    return 49;
  }

  if (isIndex(name)) {
    return '48;5;' + Math.floor(name);
  }

  code = CODES[name];

  if (typeof code === 'undefined') {
    return 49;
  }

  return code + 10;
}

module.exports = {
  CODES: CODES,
  fgCode: fgCode,
  bgCode: bgCode
};
