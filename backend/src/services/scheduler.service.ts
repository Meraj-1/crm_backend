import cron from 'node-cron';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { emailService } from './email.service';
import { TaskStatus } from '../constants';
import { ENV } from '../config/env';

export class SchedulerService {
  public static initCronJobs() {
    if (!ENV.ENABLE_CRON_JOBS) {
      console.log('[Scheduler] Cron jobs disabled via config');
      return;
    }

    console.log('[Scheduler] Initializing automated CRM background cron jobs...');

    // 1. Check for upcoming and overdue tasks every morning at 08:00 AM (or every 10 min in dev)
    const scheduleTime = ENV.NODE_ENV === 'production' ? '0 8 * * *' : '*/30 * * * *';
    
    cron.schedule(scheduleTime, async () => {
      try {
        console.log('[Scheduler] Running task reminder check...');
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Find pending tasks due today or earlier without reminder sent
        const pendingTasks = await Task.find({
          status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
          dueDate: { $lte: today },
          isReminderSent: false
        }).populate('assignedToId', 'name email');

        for (const task of pendingTasks) {
          const user = task.assignedToId as any;
          if (user && user.email) {
            await emailService.sendEmail({
              to: user.email,
              subject: `[Task Reminder] ${task.title} is due!`,
              html: `
                <p>Hi ${user.name},</p>
                <p>This is a reminder that the task <strong>"${task.title}"</strong> is due on ${new Date(task.dueDate).toLocaleDateString()}.</p>
                <p>Priority: <strong>${task.priority}</strong></p>
              `
            });
            task.isReminderSent = true;
            await task.save();
          }
        }
      } catch (err) {
        console.error('[Scheduler] Error running task reminder cron:', err);
      }
    });

    console.log('[Scheduler] Cron jobs successfully scheduled.');
  }
}
