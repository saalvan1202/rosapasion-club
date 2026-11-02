module.exports = {
  apps: [
    {
      name: "rosapasion-club",
      script: "npm",
      args: "start",
      cwd: "./",
      instances: "max", // Utiliza todos los núcleos del CPU para alta concurrencia
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};

