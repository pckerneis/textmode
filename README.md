# TEXTMODE

A platform for text based demos and animated visual experimentation.

TEXTMODE is a zero-dependency CLI that runs small JS files ("text shaders")
and renders their output as an animated, colored grid of characters in your
terminal. No npm packages, no build step, no ES6 magic - plain old JS
functions in, ANSI escape codes out.

## Install

```
npm link
```

This puts a `textmode` command on your PATH (see `bin/textmode.js`).
You can also just run it directly with `node bin/textmode.js`.

### Building a self-contained executable

If you don't want to depend on a Node install, you can build a standalone
binary using Node's [Single Executable Applications](https://nodejs.org/api/single-executable-applications.html)
feature:

```
npm install
npm run build:exe
```

This produces `dist/textmode` (or `dist/textmode.exe` on Windows) - a
single native binary with the CLI and the Node runtime baked in. It runs
on its own, with no `node` or `npm` required on the target machine:

```
dist/textmode run examples/plasma.js
```

The build step itself uses `esbuild` (to bundle the CLI into one file)
and `postject` (to inject it into a copy of the Node binary) as
dev-only tooling - the shipped executable has no dependencies.

## Usage

```
textmode run <file> [fps=30] [w=80] [h=25] [seconds=N]
textmode help
```

- `fps` - frames per second (default 30)
- `w`, `h` - grid width/height in characters (default: your terminal size)
- `seconds` - stop automatically after N seconds (default: run until Ctrl+C)

Try the bundled examples:

```
textmode run examples/plasma.js
textmode run examples/fire.js fps=24 w=100 h=30
textmode run examples/life.js
textmode run examples/rain.js
textmode run examples/sine.js
textmode run examples/cube.js
```

## Writing a shader

A shader is a plain `.js` file that exports one of two styles of function.
It runs inside a locked-down `vm` sandbox: it can see `Math`, `Date`, and
`console` (which prints to stderr so it doesn't mess up the animation), but
nothing else from the host - no `require`, no filesystem, no network.

### Style 1: per-cell (`char` / `fg` / `bg`)

The simplest style. TEXTMODE calls these once per cell, per frame:

```js
// x, y   - column/row of the cell being drawn
// t      - seconds elapsed since the shader started
// cols   - total columns in the grid
// rows   - total rows in the grid

exports.char = function (x, y, t, cols, rows) {
  return '#';           // a single character
};

exports.fg = function (x, y, t, cols, rows) {
  return 'green';       // foreground color (optional, defaults to 'default')
};

exports.bg = function (x, y, t, cols, rows) {
  return 'default';     // background color (optional, defaults to 'default')
};
```

Only `char` is required. Good for effects where each cell can be computed
independently, like `examples/plasma.js` and `examples/sine.js`.

### Style 2: whole-buffer (`frame`)

For effects that need to remember state between frames or look at
neighboring cells (cellular automata, particle trails, anything with
"memory"), export a single `frame` function instead:

```js
// buffer - a rows x cols array of cells: buffer[y][x] = { ch, fg, bg }
//          mutate cells in place; whatever is in the buffer after this
//          function returns is what gets drawn
// t      - seconds elapsed
// cols, rows - grid size

exports.frame = function (buffer, t, cols, rows) {
  buffer[0][0].ch = '@';
  buffer[0][0].fg = 'red';
};
```

Since the shader file is just a normal JS module, you can keep your own
state in plain module-level `var`s - they persist for as long as the
shader keeps running. See `examples/life.js`, `examples/rain.js`,
`examples/fire.js`, and `examples/cube.js`.

### Colors

Available color names for `fg`/`bg`:

```
black red green yellow blue magenta cyan white
gray brightred brightgreen brightyellow brightblue
brightmagenta brightcyan brightwhite default
```

`fg`/`bg` also accept a 256-color palette index (an integer from `0` to
`255`) instead of a name:

```js
exports.fg = function (x, y, t, cols, rows) {
  return 196;           // bright red, from the 256-color palette
};
```

## Examples

| File | Style | Description |
|---|---|---|
| `examples/plasma.js` | per-cell | Classic sine-wave plasma effect |
| `examples/sine.js` | per-cell | A single scrolling sine wave |
| `examples/rain.js` | frame | Matrix-style digital rain |
| `examples/life.js` | frame | Conway's Game of Life |
| `examples/fire.js` | frame | Doom-style fire effect |
| `examples/cube.js` | frame | Solid-shaded cube spinning in 3D |

## How it works

- `bin/textmode.js` - entry point, delegates to `lib/cli.js`
- `lib/cli.js` - argument parsing and subcommands (`run`, `help`)
- `lib/loader.js` - reads a shader file and runs it in a `vm` sandbox
- `lib/render.js` - owns the screen buffer, the animation loop, and drawing
  frames to the terminal with ANSI escape codes
- `lib/colors.js` - color name to ANSI code table
