const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const hostname = '127.0.0.1';
const port = 3000;
const WEBEDITOR_PATH = '/var/www/html/webeditor';

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

const q = (queryString) => {
  return Object.fromEntries(
    queryString.split('&').map((p) => {
      return p.split('=')
    })
  )
}

const context = (req, res) => {
  const $url = url.parse(req.url);
  const routeKey = `${req.method} ${$url.pathname}`;
  const getController = (routers) => routers[routeKey] || routers.fallback;

  const send = ({ status, message, headers }) => {
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

  return {
    req: {
      ...$url,
      ...req,
      routeKey,
      query: q($url.query),
    },
    res: {
      ...res,
      send,
    },
    getController 
  }
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
  console.log(req.url);
  const ctx = context(req, res);
  ctx.getController({
    ["GET /runcertbot"]: async ({ res, req }) => {
      try {
        const {
          domain, 
          folder
        } = req.query;
    
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
      } catch (error) {
        res.send({
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
  })(ctx);
});

server.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});