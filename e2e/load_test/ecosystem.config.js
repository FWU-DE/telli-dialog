module.exports = {
  apps: [
    {
      name: 'vidis-mock-server',
      script: './node_modules/.bin/tsx',
      args: './e2e/vidis-mock-server.ts',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      wait_ready: true, // Wait for ready signal
      listen_timeout: 10000, // Give it 10 seconds to start up
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
