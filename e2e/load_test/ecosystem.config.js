module.exports = {
  apps: [
    {
      name: 'vidis-mock-server',
      script: 'node',
      args: 'e2e/vidis-mock-server.js',
      instances: 50,
      exec_mode: 'fork',
      watch: false,
      increment_var: 'PORT',
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
