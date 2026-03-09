const { spawn } = require('child_process');
const net = require('net');

const START_PORT = 3000;
const MAX_PORT = 3010;

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > MAX_PORT) {
        reject(new Error('No available port found'));
        return;
      }

      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => {
          resolve(port);
        });
        server.close();
      });
      server.on('error', () => {
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        tryPort(port + 1);
      });
    };

    tryPort(startPort);
  });
}

findAvailablePort(START_PORT)
  .then(port => {
    console.log(`Starting server on port ${port}...`);
    const server = spawn('npx', ['next', 'start', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
