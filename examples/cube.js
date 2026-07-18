// A solid-shaded cube spinning in 3D. Uses "frame" because each face is a
// filled polygon spanning many cells, not something a single cell can
// compute on its own.
//
// Colors aren't picked per face - each face's color is its own rotated
// surface normal encoded straight into RGB (the classic "normal map"
// visualization: x/y/z components of the unit normal, each remapped from
// [-1, 1] to [0, 1], become the r/g/b channels), quantized to the
// 6x6x6 color cube that lives at 256-color palette indices 16-231.

var VERTICES = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
];

// Each face as a quad of vertex indices.
var FACES = [
  { verts: [0, 1, 2, 3] }, // back   z = -1
  { verts: [5, 4, 7, 6] }, // front  z = +1
  { verts: [4, 0, 3, 7] }, // left   x = -1
  { verts: [1, 5, 6, 2] }, // right  x = +1
  { verts: [4, 5, 1, 0] }, // top    y = -1
  { verts: [3, 2, 6, 7] }  // bottom y = +1
];

// Terminal character cells are taller than they are wide (roughly 1:2), so
// x needs to travel more columns than y travels rows to cover the same
// visual distance - otherwise the cube reads as flattened.
var CHAR_ASPECT = 2.0;
var CAMERA_DIST = 4;
var FOV = 3;

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v) {
  var len = Math.sqrt(dot(v, v));
  if (len === 0) {
    return [0, 0, 0];
  }
  return [v[0] / len, v[1] / len, v[2] / len];
}

// Make each face's winding order produce an outward-pointing normal,
// regardless of how it was listed above, by checking it against the
// (unrotated) face centroid direction from the cube's center.
(function orientFaces() {
  var i, face, v, p0, p1, p2, normal, centroid, j;

  for (i = 0; i < FACES.length; i++) {
    face = FACES[i];
    v = face.verts;
    p0 = VERTICES[v[0]];
    p1 = VERTICES[v[1]];
    p2 = VERTICES[v[2]];
    normal = cross(sub(p1, p0), sub(p2, p0));

    centroid = [0, 0, 0];
    for (j = 0; j < v.length; j++) {
      centroid[0] += VERTICES[v[j]][0];
      centroid[1] += VERTICES[v[j]][1];
      centroid[2] += VERTICES[v[j]][2];
    }

    if (dot(normal, centroid) < 0) {
      face.verts = [v[3], v[2], v[1], v[0]];
    }
  }
}());

function rotate(p, ax, ay) {
  var x = p[0], y = p[1], z = p[2];
  var cosY = Math.cos(ay), sinY = Math.sin(ay);
  var cosX = Math.cos(ax), sinX = Math.sin(ax);
  var x1 = x * cosY + z * sinY;
  var z1 = z * cosY - x * sinY;
  var y1 = y * cosX - z1 * sinX;
  var z2 = y * sinX + z1 * cosX;

  return [x1, y1, z2];
}

function project(p, cols, rows) {
  var distance = CAMERA_DIST + p[2];
  var scale = FOV / distance;
  var unit = Math.min(rows, cols / CHAR_ASPECT) * 0.42;

  return {
    x: cols / 2 + p[0] * scale * unit * CHAR_ASPECT,
    y: rows / 2 + p[1] * scale * unit,
    distance: distance
  };
}

// Encodes a unit normal's x/y/z as r/g/b: each component goes from
// [-1, 1] to a level in [0, 5], then into a 256-color cube index.
function normalColor(n) {
  var r = Math.max(0, Math.min(5, Math.round((n[0] + 1) / 2 * 5)));
  var g = Math.max(0, Math.min(5, Math.round((n[1] + 1) / 2 * 5)));
  var b = Math.max(0, Math.min(5, Math.round((n[2] + 1) / 2 * 5)));

  return 16 + 36 * r + 6 * g + b;
}

function fillPolygon(buffer, cols, rows, points, color) {
  var n = points.length;
  var minY = Infinity, maxY = -Infinity;
  var i, y, p1, p2, t, xs, xStart, xEnd, x;

  for (i = 0; i < n; i++) {
    if (points[i].y < minY) {
      minY = points[i].y;
    }
    if (points[i].y > maxY) {
      maxY = points[i].y;
    }
  }

  minY = Math.max(0, Math.floor(minY));
  maxY = Math.min(rows - 1, Math.ceil(maxY));

  for (y = minY; y <= maxY; y++) {
    xs = [];

    for (i = 0; i < n; i++) {
      p1 = points[i];
      p2 = points[(i + 1) % n];

      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        t = (y - p1.y) / (p2.y - p1.y);
        xs.push(p1.x + t * (p2.x - p1.x));
      }
    }

    xs.sort(function (a, b) { return a - b; });

    for (i = 0; i + 1 < xs.length; i += 2) {
      xStart = Math.max(0, Math.round(xs[i]));
      xEnd = Math.min(cols - 1, Math.round(xs[i + 1]));

      for (x = xStart; x <= xEnd; x++) {
        buffer[y][x].ch = ' ';
        buffer[y][x].bg = color;
      }
    }
  }
}

exports.frame = function (grid) {
  var ax = time * 0.6;
  var ay = time * 0.9;
  var rotated = [];
  var projected = [];
  var visible = [];
  var i, x, y, face, v, p0, p1, p2, normal, unitNormal, poly, j, depth;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      grid[y][x].ch = ' ';
      grid[y][x].fg = 'default';
      grid[y][x].bg = 'default';
    }
  }

  for (i = 0; i < VERTICES.length; i++) {
    rotated.push(rotate(VERTICES[i], ax, ay));
    projected.push(project(rotated[i], width, height));
  }

  for (i = 0; i < FACES.length; i++) {
    face = FACES[i];
    v = face.verts;
    p0 = rotated[v[0]];
    p1 = rotated[v[1]];
    p2 = rotated[v[2]];
    normal = cross(sub(p1, p0), sub(p2, p0));

    if (normal[2] >= 0) {
      continue; // facing away from the camera
    }

    unitNormal = normalize(normal);

    poly = [];
    depth = 0;
    for (j = 0; j < v.length; j++) {
      poly.push(projected[v[j]]);
      depth += projected[v[j]].distance;
    }
    depth /= v.length;

    visible.push({ poly: poly, color: normalColor(unitNormal), depth: depth });
  }

  visible.sort(function (a, b) { return b.depth - a.depth; });

  for (i = 0; i < visible.length; i++) {
    fillPolygon(grid, width, height, visible[i].poly, visible[i].color);
  }
};
