import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { ENV } from './config/env';
import { SchedulerService } from './services/scheduler.service';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Background Scheduler & Cron Jobs
    SchedulerService.initCronJobs();

    // 3. Create Express App
    const app = createApp();

    // 4. Listen on Port
    const server = app.listen(ENV.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Nexus CRM Enterprise Backend Running!`);
      console.log(`📡 Server URL:      http://localhost:${ENV.PORT}`);
      console.log(`📚 Swagger Docs:    http://localhost:${ENV.PORT}/api-docs`);
      console.log(`🩺 Health Check:    http://localhost:${ENV.PORT}/api/v1/health`);
      console.log(`🌱 Environment:     ${ENV.NODE_ENV}`);
      console.log('====================================================');
    });

    // Graceful Shutdown Signals
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        console.log('[Server] Graceful shutdown completed.');
        process.exit(0);
      });

      // Force exit after 10s if hung
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();
