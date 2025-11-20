module.exports = {
  apps: [
    {
      name: 'grocery20-api',
      script: './server/dist/index.js',
      cwd: __dirname,
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Advanced settings
      instance_var: 'INSTANCE_ID',

      // Environment-specific settings
      node_args: '--max-old-space-size=2048',

      // Health monitoring
      wait_ready: true,
      shutdown_with_message: true,

      // Process management
      min_availability: 0.8,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,

      // Graceful shutdown
      signal: 'SIGTERM'
    }
  ],

  deploy: {
    production: {
      user: 'nq00klkavtq6',
      host: 'p3plzcpnl508117.prod.phx3.secureserver.net',
      ref: 'origin/main',
      repo: 'git@github.com:username/grocery20.git', // Update with your repo
      path: '~/public_html/grocery.dwaynecon.com',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
