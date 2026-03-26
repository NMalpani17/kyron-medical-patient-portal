module.exports = {
  apps: [{
    name: 'kyron-server',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
