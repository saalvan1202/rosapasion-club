module.exports = {
  apps: [
    {
      name: "rosapasion-club",
      script: "npm",
      args: "start",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3006,
      },
    },
  ],
};


