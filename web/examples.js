// Inlined copies of ../examples/*.js, so the web editor works standalone
// (no fetch, no server needed) even when opened straight from disk.
// Keep these in sync with the CLI examples by hand if those change.

window.TEXTMODE_EXAMPLES = [
  {
    name: 'plasma',
    label: 'Plasma',
    code:
"// Classic \"plasma\" demo effect: a handful of sine waves summed together\n" +
"// and mapped to an ascii ramp and a color band.\n" +
"\n" +
"var CHARS = ' .:-=+*#%@';\n" +
"var PALETTE = ['blue', 'cyan', 'green', 'yellow', 'red', 'magenta'];\n" +
"\n" +
"function value() {\n" +
"  var time = frame / fps;\n" +
"  var v = Math.sin(x * 0.2 + time) +\n" +
"          Math.sin(y * 0.15 + time * 1.3) +\n" +
"          Math.sin((x + y) * 0.1 + time * 0.7) +\n" +
"          Math.sin(Math.sqrt(x * x + y * y) * 0.1 - time);\n" +
"\n" +
"  return (v + 4) / 8; // normalize roughly to 0..1\n" +
"}\n" +
"\n" +
"function char() {\n" +
"  var v = value();\n" +
"  var index = Math.floor(v * (CHARS.length - 1));\n" +
"  return CHARS.charAt(index);\n" +
"}\n" +
"\n" +
"function fg() {\n" +
"  var v = value();\n" +
"  var index = Math.floor(v * (PALETTE.length - 1));\n" +
"  return PALETTE[index];\n" +
"}\n" +
"\n" +
"exports.char = char;\n" +
"exports.fg = fg;\n"
  },
  {
    name: 'sine',
    label: 'Sine wave',
    code:
"// A single scrolling sine wave with a static midline, the \"hello world\"\n" +
"// of text shaders.\n" +
"\n" +
"function wave() {\n" +
"  var t = frame / fps;\n" +
"  var mid = height / 2;\n" +
"  var amplitude = height / 3;\n" +
"  return Math.round(mid\n" +
"    + (Math.sin(x * 0.3 + t * 2) * amplitude)\n" +
"    + (Math.sin(x * 0.13 + t * 1.34) * amplitude * 0.8)\n" +
"    + (Math.sin(x * 5.33 + t * 5.32) * amplitude * 0.026)\n" +
"  );\n" +
"}\n" +
"\n" +
"function char() {\n" +
"  var lineY = wave();\n" +
"\n" +
"  if (y === lineY) {\n" +
"    return '*';\n" +
"  }\n" +
"  if (y === Math.round(height / 2)) {\n" +
"    return '-';\n" +
"  }\n" +
"  return ' ';\n" +
"}\n" +
"\n" +
"function fg() {\n" +
"  var lineY = wave();\n" +
"\n" +
"  if (y === lineY) {\n" +
"    return 'yellow';\n" +
"  }\n" +
"  return 'gray';\n" +
"}\n" +
"\n" +
"exports.char = char;\n" +
"exports.fg = fg;\n"
  },
  {
    name: 'rain',
    label: 'Digital rain',
    code:
"// Matrix-style digital rain. Uses the \"frame\" style since each column\n" +
"// needs to remember its own drop position and speed between frames -\n" +
"// state that a stateless per-cell char()/fg() pair can't hold on its own.\n" +
"\n" +
"var CHARS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';\n" +
"var TRAIL_LENGTH = 12;\n" +
"\n" +
"var drops = null;\n" +
"var lastCols = 0;\n" +
"\n" +
"function randomChar() {\n" +
"  var index = Math.floor(Math.random() * CHARS.length);\n" +
"  return CHARS.charAt(index);\n" +
"}\n" +
"\n" +
"function setup(cols, rows) {\n" +
"  var i;\n" +
"\n" +
"  drops = [];\n" +
"\n" +
"  for (i = 0; i < cols; i++) {\n" +
"    drops.push({\n" +
"      y: -Math.floor(Math.random() * rows),\n" +
"      speed: 0.3 + Math.random() * 0.7\n" +
"    });\n" +
"  }\n" +
"\n" +
"  lastCols = cols;\n" +
"}\n" +
"\n" +
"exports.frame = function (grid) {\n" +
"  var x, y, drop, headY, dist, cell;\n" +
"\n" +
"  if (drops === null || lastCols !== width) {\n" +
"    setup(width, height);\n" +
"  }\n" +
"\n" +
"  for (y = 0; y < height; y++) {\n" +
"    for (x = 0; x < width; x++) {\n" +
"      grid[y][x].ch = ' ';\n" +
"      grid[y][x].fg = 'default';\n" +
"    }\n" +
"  }\n" +
"\n" +
"  for (x = 0; x < width; x++) {\n" +
"    drop = drops[x];\n" +
"    drop.y += drop.speed;\n" +
"\n" +
"    if (drop.y - TRAIL_LENGTH > height) {\n" +
"      drop.y = -Math.floor(Math.random() * height);\n" +
"      drop.speed = 0.3 + Math.random() * 0.7;\n" +
"    }\n" +
"\n" +
"    headY = Math.floor(drop.y);\n" +
"\n" +
"    for (y = 0; y < height; y++) {\n" +
"      dist = headY - y;\n" +
"\n" +
"      if (dist < 0 || dist > TRAIL_LENGTH) {\n" +
"        continue;\n" +
"      }\n" +
"\n" +
"      cell = grid[y][x];\n" +
"      cell.ch = randomChar();\n" +
"      cell.fg = dist === 0 ? 'brightwhite' : 'green';\n" +
"    }\n" +
"  }\n" +
"};\n"
  },
  {
    name: 'life',
    label: "Conway's Life",
    code:
"// Conway's Game of Life. Needs to look at each cell's neighbors, so it\n" +
"// keeps its own grid (wrapped at the edges) and only uses the \"frame\"\n" +
"// buffer as an output sink.\n" +
"\n" +
"var cells = null;\n" +
"var next = null;\n" +
"var lastCols = 0;\n" +
"var lastRows = 0;\n" +
"var STEP_EVERY_N_FRAMES = 3;\n" +
"\n" +
"function setup(cols, rows) {\n" +
"  var x, y;\n" +
"\n" +
"  cells = [];\n" +
"  next = [];\n" +
"\n" +
"  for (y = 0; y < rows; y++) {\n" +
"    cells.push([]);\n" +
"    next.push([]);\n" +
"    for (x = 0; x < cols; x++) {\n" +
"      cells[y].push(Math.random() < 0.2 ? 1 : 0);\n" +
"      next[y].push(0);\n" +
"    }\n" +
"  }\n" +
"\n" +
"  lastCols = cols;\n" +
"  lastRows = rows;\n" +
"}\n" +
"\n" +
"function countNeighbors(x, y, cols, rows) {\n" +
"  var count = 0;\n" +
"  var dx, dy, nx, ny;\n" +
"\n" +
"  for (dy = -1; dy <= 1; dy++) {\n" +
"    for (dx = -1; dx <= 1; dx++) {\n" +
"      if (dx === 0 && dy === 0) {\n" +
"        continue;\n" +
"      }\n" +
"      nx = (x + dx + cols) % cols;\n" +
"      ny = (y + dy + rows) % rows;\n" +
"      count += cells[ny][nx];\n" +
"    }\n" +
"  }\n" +
"\n" +
"  return count;\n" +
"}\n" +
"\n" +
"function step(cols, rows) {\n" +
"  var x, y, alive, neighbors, willLive, tmp;\n" +
"\n" +
"  for (y = 0; y < rows; y++) {\n" +
"    for (x = 0; x < cols; x++) {\n" +
"      alive = cells[y][x];\n" +
"      neighbors = countNeighbors(x, y, cols, rows);\n" +
"      willLive = alive ? (neighbors === 2 || neighbors === 3) : (neighbors === 3);\n" +
"      next[y][x] = willLive ? 1 : 0;\n" +
"    }\n" +
"  }\n" +
"\n" +
"  tmp = cells;\n" +
"  cells = next;\n" +
"  next = tmp;\n" +
"}\n" +
"\n" +
"exports.frame = function (grid) {\n" +
"  var x, y, cell;\n" +
"\n" +
"  if (cells === null || lastCols !== width || lastRows !== height) {\n" +
"    setup(width, height);\n" +
"  }\n" +
"\n" +
"  if (frame % STEP_EVERY_N_FRAMES === 0) {\n" +
"    step(width, height);\n" +
"  }\n" +
"\n" +
"  for (y = 0; y < height; y++) {\n" +
"    for (x = 0; x < width; x++) {\n" +
"      cell = grid[y][x];\n" +
"      if (cells[y][x]) {\n" +
"        cell.ch = '#';\n" +
"        cell.fg = 'brightwhite';\n" +
"      } else {\n" +
"        cell.ch = ' ';\n" +
"        cell.fg = 'default';\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"};\n"
  },
  {
    name: 'fire',
    label: 'Fire',
    code:
"// The classic \"Doom fire\" cellular automaton: heat rises from the\n" +
"// bottom row, decaying and drifting sideways at random as it goes.\n" +
"// Uses \"frame\" because each cell's next heat depends on the cell below it.\n" +
"\n" +
"var heat = null;\n" +
"var lastCols = 0;\n" +
"var lastRows = 0;\n" +
"\n" +
"var PALETTE = [\n" +
"  { ch: ' ', fg: 'default' },\n" +
"  { ch: '.', fg: 'red' },\n" +
"  { ch: ':', fg: 'red' },\n" +
"  { ch: '+', fg: 'red' },\n" +
"  { ch: '*', fg: 'yellow' },\n" +
"  { ch: '%', fg: 'yellow' },\n" +
"  { ch: '#', fg: 'brightyellow' },\n" +
"  { ch: '@', fg: 'brightwhite' }\n" +
"];\n" +
"\n" +
"function setup(cols, rows) {\n" +
"  var x, y;\n" +
"\n" +
"  heat = [];\n" +
"\n" +
"  for (y = 0; y < rows; y++) {\n" +
"    heat.push([]);\n" +
"    for (x = 0; x < cols; x++) {\n" +
"      heat[y].push(0);\n" +
"    }\n" +
"  }\n" +
"\n" +
"  lastCols = cols;\n" +
"  lastRows = rows;\n" +
"}\n" +
"\n" +
"exports.frame = function (grid) {\n" +
"  var x, y, src, decay, level, spread, cell, paletteEntry;\n" +
"\n" +
"  if (heat === null || lastCols !== width || lastRows !== height) {\n" +
"    setup(width, height);\n" +
"  }\n" +
"\n" +
"  for (x = 0; x < width; x++) {\n" +
"    heat[height - 1][x] = PALETTE.length - 1;\n" +
"  }\n" +
"\n" +
"  for (y = 0; y < height - 1; y++) {\n" +
"    for (x = 0; x < width; x++) {\n" +
"      src = heat[y + 1][x];\n" +
"      decay = Math.floor(Math.random() * 2.2);\n" +
"      level = src - decay;\n" +
"      if (level < 0) {\n" +
"        level = 0;\n" +
"      }\n" +
"\n" +
"      spread = x + Math.floor(Math.random() * 3) - 1;\n" +
"      if (spread < 0) {\n" +
"        spread = 0;\n" +
"      }\n" +
"      if (spread > width - 1) {\n" +
"        spread = width - 1;\n" +
"      }\n" +
"\n" +
"      heat[y][spread] = level;\n" +
"    }\n" +
"  }\n" +
"\n" +
"  for (y = 0; y < height; y++) {\n" +
"    for (x = 0; x < width; x++) {\n" +
"      level = heat[y][x];\n" +
"      if (level > PALETTE.length - 1) {\n" +
"        level = PALETTE.length - 1;\n" +
"      }\n" +
"\n" +
"      paletteEntry = PALETTE[level];\n" +
"      cell = grid[y][x];\n" +
"      cell.ch = paletteEntry.ch;\n" +
"      cell.fg = paletteEntry.fg;\n" +
"    }\n" +
"  }\n" +
"};\n"
  },
  {
    name: 'cube',
    label: 'Spinning cube',
    code:
"// A solid-shaded cube spinning in 3D. Uses \"frame\" because each face is a\n" +
"// filled polygon spanning many cells, not something a single cell can\n" +
"// compute on its own.\n" +
"//\n" +
"// Colors aren't picked per face - each face's color is its own rotated\n" +
"// surface normal encoded straight into RGB (the classic \"normal map\"\n" +
"// visualization: x/y/z components of the unit normal, each remapped from\n" +
"// [-1, 1] to [0, 1], become the r/g/b channels), quantized to the\n" +
"// 6x6x6 color cube that lives at 256-color palette indices 16-231.\n" +
"\n" +
"var VERTICES = [\n" +
"  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],\n" +
"  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]\n" +
"];\n" +
"\n" +
"// Each face as a quad of vertex indices.\n" +
"var FACES = [\n" +
"  { verts: [0, 1, 2, 3] }, // back   z = -1\n" +
"  { verts: [5, 4, 7, 6] }, // front  z = +1\n" +
"  { verts: [4, 0, 3, 7] }, // left   x = -1\n" +
"  { verts: [1, 5, 6, 2] }, // right  x = +1\n" +
"  { verts: [4, 5, 1, 0] }, // top    y = -1\n" +
"  { verts: [3, 2, 6, 7] }  // bottom y = +1\n" +
"];\n" +
"\n" +
"// Terminal character cells are taller than they are wide (roughly 1:2), so\n" +
"// x needs to travel more columns than y travels rows to cover the same\n" +
"// visual distance - otherwise the cube reads as flattened.\n" +
"var CHAR_ASPECT = 2.0;\n" +
"var CAMERA_DIST = 4;\n" +
"var FOV = 3;\n" +
"\n" +
"function sub(a, b) {\n" +
"  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];\n" +
"}\n" +
"\n" +
"function cross(a, b) {\n" +
"  return [\n" +
"    a[1] * b[2] - a[2] * b[1],\n" +
"    a[2] * b[0] - a[0] * b[2],\n" +
"    a[0] * b[1] - a[1] * b[0]\n" +
"  ];\n" +
"}\n" +
"\n" +
"function dot(a, b) {\n" +
"  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];\n" +
"}\n" +
"\n" +
"function normalize(v) {\n" +
"  var len = Math.sqrt(dot(v, v));\n" +
"  if (len === 0) {\n" +
"    return [0, 0, 0];\n" +
"  }\n" +
"  return [v[0] / len, v[1] / len, v[2] / len];\n" +
"}\n" +
"\n" +
"// Make each face's winding order produce an outward-pointing normal,\n" +
"// regardless of how it was listed above, by checking it against the\n" +
"// (unrotated) face centroid direction from the cube's center.\n" +
"(function orientFaces() {\n" +
"  var i, face, v, p0, p1, p2, normal, centroid, j;\n" +
"\n" +
"  for (i = 0; i < FACES.length; i++) {\n" +
"    face = FACES[i];\n" +
"    v = face.verts;\n" +
"    p0 = VERTICES[v[0]];\n" +
"    p1 = VERTICES[v[1]];\n" +
"    p2 = VERTICES[v[2]];\n" +
"    normal = cross(sub(p1, p0), sub(p2, p0));\n" +
"\n" +
"    centroid = [0, 0, 0];\n" +
"    for (j = 0; j < v.length; j++) {\n" +
"      centroid[0] += VERTICES[v[j]][0];\n" +
"      centroid[1] += VERTICES[v[j]][1];\n" +
"      centroid[2] += VERTICES[v[j]][2];\n" +
"    }\n" +
"\n" +
"    if (dot(normal, centroid) < 0) {\n" +
"      face.verts = [v[3], v[2], v[1], v[0]];\n" +
"    }\n" +
"  }\n" +
"}());\n" +
"\n" +
"function rotate(p, ax, ay) {\n" +
"  var x = p[0], y = p[1], z = p[2];\n" +
"  var cosY = Math.cos(ay), sinY = Math.sin(ay);\n" +
"  var cosX = Math.cos(ax), sinX = Math.sin(ax);\n" +
"  var x1 = x * cosY + z * sinY;\n" +
"  var z1 = z * cosY - x * sinY;\n" +
"  var y1 = y * cosX - z1 * sinX;\n" +
"  var z2 = y * sinX + z1 * cosX;\n" +
"\n" +
"  return [x1, y1, z2];\n" +
"}\n" +
"\n" +
"function project(p, cols, rows) {\n" +
"  var distance = CAMERA_DIST + p[2];\n" +
"  var scale = FOV / distance;\n" +
"  var unit = Math.min(rows, cols / CHAR_ASPECT) * 0.42;\n" +
"\n" +
"  return {\n" +
"    x: cols / 2 + p[0] * scale * unit * CHAR_ASPECT,\n" +
"    y: rows / 2 + p[1] * scale * unit,\n" +
"    distance: distance\n" +
"  };\n" +
"}\n" +
"\n" +
"// Encodes a unit normal's x/y/z as r/g/b: each component goes from\n" +
"// [-1, 1] to a level in [0, 5], then into a 256-color cube index.\n" +
"function normalColor(n) {\n" +
"  var r = Math.max(0, Math.min(5, Math.round((n[0] + 1) / 2 * 5)));\n" +
"  var g = Math.max(0, Math.min(5, Math.round((n[1] + 1) / 2 * 5)));\n" +
"  var b = Math.max(0, Math.min(5, Math.round((n[2] + 1) / 2 * 5)));\n" +
"\n" +
"  return 16 + 36 * r + 6 * g + b;\n" +
"}\n" +
"\n" +
"function fillPolygon(buffer, cols, rows, points, color) {\n" +
"  var n = points.length;\n" +
"  var minY = Infinity, maxY = -Infinity;\n" +
"  var i, y, p1, p2, t, xs, xStart, xEnd, x;\n" +
"\n" +
"  for (i = 0; i < n; i++) {\n" +
"    if (points[i].y < minY) {\n" +
"      minY = points[i].y;\n" +
"    }\n" +
"    if (points[i].y > maxY) {\n" +
"      maxY = points[i].y;\n" +
"    }\n" +
"  }\n" +
"\n" +
"  minY = Math.max(0, Math.floor(minY));\n" +
"  maxY = Math.min(rows - 1, Math.ceil(maxY));\n" +
"\n" +
"  for (y = minY; y <= maxY; y++) {\n" +
"    xs = [];\n" +
"\n" +
"    for (i = 0; i < n; i++) {\n" +
"      p1 = points[i];\n" +
"      p2 = points[(i + 1) % n];\n" +
"\n" +
"      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {\n" +
"        t = (y - p1.y) / (p2.y - p1.y);\n" +
"        xs.push(p1.x + t * (p2.x - p1.x));\n" +
"      }\n" +
"    }\n" +
"\n" +
"    xs.sort(function (a, b) { return a - b; });\n" +
"\n" +
"    for (i = 0; i + 1 < xs.length; i += 2) {\n" +
"      xStart = Math.max(0, Math.round(xs[i]));\n" +
"      xEnd = Math.min(cols - 1, Math.round(xs[i + 1]));\n" +
"\n" +
"      for (x = xStart; x <= xEnd; x++) {\n" +
"        buffer[y][x].ch = ' ';\n" +
"        buffer[y][x].bg = color;\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"}\n" +
"\n" +
"exports.frame = function (grid) {\n" +
"  var time = frame / fps;\n" +
"  var ax = time * 0.6;\n" +
"  var ay = time * 0.9;\n" +
"  var rotated = [];\n" +
"  var projected = [];\n" +
"  var visible = [];\n" +
"  var i, x, y, face, v, p0, p1, p2, normal, unitNormal, poly, j, depth;\n" +
"\n" +
"  for (y = 0; y < height; y++) {\n" +
"    for (x = 0; x < width; x++) {\n" +
"      grid[y][x].ch = ' ';\n" +
"      grid[y][x].fg = 'default';\n" +
"      grid[y][x].bg = 'default';\n" +
"    }\n" +
"  }\n" +
"\n" +
"  for (i = 0; i < VERTICES.length; i++) {\n" +
"    rotated.push(rotate(VERTICES[i], ax, ay));\n" +
"    projected.push(project(rotated[i], width, height));\n" +
"  }\n" +
"\n" +
"  for (i = 0; i < FACES.length; i++) {\n" +
"    face = FACES[i];\n" +
"    v = face.verts;\n" +
"    p0 = rotated[v[0]];\n" +
"    p1 = rotated[v[1]];\n" +
"    p2 = rotated[v[2]];\n" +
"    normal = cross(sub(p1, p0), sub(p2, p0));\n" +
"\n" +
"    if (normal[2] >= 0) {\n" +
"      continue; // facing away from the camera\n" +
"    }\n" +
"\n" +
"    unitNormal = normalize(normal);\n" +
"\n" +
"    poly = [];\n" +
"    depth = 0;\n" +
"    for (j = 0; j < v.length; j++) {\n" +
"      poly.push(projected[v[j]]);\n" +
"      depth += projected[v[j]].distance;\n" +
"    }\n" +
"    depth /= v.length;\n" +
"\n" +
"    visible.push({ poly: poly, color: normalColor(unitNormal), depth: depth });\n" +
"  }\n" +
"\n" +
"  visible.sort(function (a, b) { return b.depth - a.depth; });\n" +
"\n" +
"  for (i = 0; i < visible.length; i++) {\n" +
"    fillPolygon(grid, width, height, visible[i].poly, visible[i].color);\n" +
"  }\n" +
"};\n"
  }
];
