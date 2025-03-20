module.exports = {
  apps: [
    {
      name: 'vidis-mock-server',
      script: 'tsx',
      args: './e2e/vidis-mock-server.ts',
      instances: 100,
      exec_mode: 'cluster',
      watch: false,
      increment_var: 'PORT',
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
