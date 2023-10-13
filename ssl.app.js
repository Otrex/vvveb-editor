const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  if (req.url.includes('/runcertbot') && req.method === 'GET') {
    var query = url.parse(req.url,true).query;
    const domain = query.domain;
    const email = "obisiket@gmail.com";

    const command = `sudo certbot certonly --apache -d ${domain} --non-interactive --agree-tos --email ${email}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Error: ${error}`);
      } else {
        console.log(`Command output:\n${stdout}`);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Command output:\n${stdout}`);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});