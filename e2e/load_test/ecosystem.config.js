module.exports = {
  apps: [
    {
      name: 'vidis-mock-server',
      script: 'node',
      args: 'e2e/vidis-mock-server.js',
      instances: 50,
      exec_mode: 'cluster',
      watch: false,
      wait_ready: true, // Wait for ready signal
      listen_timeout: 10000, // Give it 10 seconds to start up
      increment_foreach: 'PORT',
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
