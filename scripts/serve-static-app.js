const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const port = Number(process.env.PORT || process.argv[2] || 5173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function safeResolve(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const resolved = path.resolve(root, `.${requestedPath}`);
  if (!resolved.startsWith(root)) {
    return null;
  }
  return resolved;
}

const server = http.createServer((request, response) => {
  const filePath = safeResolve(request.url || '/');
  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('File non trovato');
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
    response.end(content);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Il Faro di Canicattì è avviato su http://127.0.0.1:${port}/`);
  console.log('Premi Ctrl+C per fermare il server.');
});
