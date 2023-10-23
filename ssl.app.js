const http = require('http');
const url = require('url');
const qs = require('querystring'); 
const { exec } = require('child_process');

const hostname = '127.0.0.1';
const port = 3000;
const WEBEDITOR_PATH = '/var/www/webeditor';

const execute = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout)
      }
    });
  })
}

const context = (req, res) => {
  let data = '';
  req.on('data', (chunk) => { data += chunk });

  const ctx = { 
    req, 
    res, 
    routeKey: "fallback",
    handler(routers) {
      const routeKey = `${req.method} ${this.req.pathname}`
      return (routers[routeKey] || routers.fallback)(this);
    },
    init() {
      const parsedUrl = url.parse(req.url);
      const res = this.res;

      Object.assign(this.req, {
        query: qs.parse((parsedUrl.query || '')),
        pathname: parsedUrl.pathname,
        body: qs.parse(data),
      });

      Object.assign(this.res, {
        send({ status, message, headers }) {
          const $status = status || 200;
          const $headers = {
            ['Content-Type']: 'text/plain',
            ...(headers || {}),
          }

          if ($status === 500) {
            console.error(message)
          }

          res.writeHead($status, $headers);
          res.end(message);
        }
      })
    }
  };
  return ctx
}

const commands = {
  async reloadApache() {
    return execute("sudo systemctl reload apache2");
  },
  async symLink(folder) {
    if (!folder) {
      throw new Error("no file path or destination path provided.");
    }
    return execute(`sudo ln -s ${WEBEDITOR_PATH}/${folder}/${folder}.conf /etc/apache2/sites-enabled/${folder}.conf`);
  },
  async generateSSL(domain, email="obisiket@gmail.com") {
    if (!domain) {
      throw new Error("no domain provided");
    }

    return execute(`
      sudo certbot --apache \
      -d ${domain} --non-interactive \
      --agree-tos --email ${email} -v`)
  }
}


const server = http.createServer((req, res) => {
  const ctx = context(req, res);
  req.on('end', () => {
    ctx.init();
    ctx.handler({
      ["POST /runcertbot"]: async ({ res, req }) => {
        try {
          const {
            domain, 
            folder
          } = req.body;
      
          if (!domain) {
            throw new Error("no domain provided");
          }
      
          if (!folder) {
            throw new Error("no folder provided");
          }
      
          await commands.reloadApache();
          await commands.symLink(folder);
          await commands.generateSSL(domain);
          await commands.reloadApache();

          return res.send({
            status: 200,
            message: "OK",
          })

        } catch (error) {
          return res.send({
            status: 500,
            message: `Error: ${error}`
          })
        } 
      },
      fallback: ({ res }) => {
        return res.send({
          status: 404,
          message: "Not Found",
        });
      }
    })
  })
});

server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});