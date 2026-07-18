// 16-color ANSI palette used by both fg() and bg() shader functions.

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

function fgCode(name) {
  var code;

  if (!name) {
    return CODES.default;
  }

  code = CODES[name];

  if (typeof code === 'undefined') {
    return CODES.default;
  }

  return code;
}

function bgCode(name) {
  var code;

  if (!name || name === 'default') {
    return 49;
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
