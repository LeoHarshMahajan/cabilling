module.exports = {
  apps: [
    {
      name: "ca-billing",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/ca-billing",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
