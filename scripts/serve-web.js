// Zero-dependency static file server for trying out the web/ editor
// locally (sandboxed iframes and CDN scripts behave better served over
// http:// than opened directly as a file:// URL).

var http = require('http');
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var PORT = process.env.PORT || 4173;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function main() {
  var server = http.createServer(function (req, res) {
    var reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '/web' || reqPath === '/web/') {
      reqPath = '/web/index.html';
    }

    var filePath = path.normalize(path.join(ROOT, reqPath));

    if (filePath.indexOf(ROOT) !== 0) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, function (err, data) {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found: ' + reqPath);
        return;
      }

      var ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.listen(PORT, function () {
    console.log('Serving ' + ROOT + ' at http://localhost:' + PORT + '/web/');
  });
}

main();
