import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { TaskStatus, ActivityType, EntityType } from '../constants';

export class TaskController {
  public static async listTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, priority, assignedToId, relatedToType, relatedToId } = req.query;
      const orgId = req.user!.organizationId;

      const filter: any = { organizationId: orgId };
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assignedToId) filter.assignedToId = assignedToId;
      if (relatedToType) filter.relatedToType = relatedToType;
      if (relatedToId) filter.relatedToId = relatedToId;

      const tasks = await Task.find(filter)
        .sort({ dueDate: 1 })
        .populate('assignedToId', 'name email avatar');

      return sendSuccess(res, tasks, 'Tasks retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const taskData = req.body;
      const orgId = req.user!.organizationId;

      const task = await Task.create({
        ...taskData,
        organizationId: orgId,
        assignedToId: taskData.assignedToId || req.user!.userId
      });

      if (task.relatedToId) {
        await Activity.create({
          organizationId: orgId,
          type: ActivityType.NOTE,
          title: `Task Created: ${task.title}`,
          description: task.description || '',
          entityType: task.relatedToType || EntityType.LEAD,
          entityId: task.relatedToId,
          entityName: task.relatedToName || task.title,
          performedById: req.user!.userId,
          performedByName: req.user!.name || 'System'
        });
      }

      return sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await Task.findOneAndUpdate(
        { _id: id, organizationId: req.user!.organizationId },
        req.body,
        { new: true }
      );

      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      return sendSuccess(res, task, 'Task updated');
    } catch (error) {
      next(error);
    }
  }

  public static async toggleTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.user!.organizationId;

      const task = await Task.findOne({ _id: id, organizationId: orgId });
      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      task.status = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
      await task.save();

      if (task.status === TaskStatus.COMPLETED && task.relatedToId) {
        await Activity.create({
          organizationId: orgId,
          type: ActivityType.TASK_DONE,
          title: `Task Completed: ${task.title}`,
          description: `Task "${task.title}" was marked completed.`,
          entityType: task.relatedToType || EntityType.LEAD,
          entityId: task.relatedToId,
          entityName: task.relatedToName || task.title,
          performedById: req.user!.userId,
          performedByName: req.user!.name || 'System'
        });
      }

      return sendSuccess(res, task, 'Task status updated');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await Task.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });

      if (!task) {
        return next(new AppError('Task not found', 404));
      }

      return sendSuccess(res, null, 'Task deleted');
    } catch (error) {
      next(error);
    }
  }
}

export class ActivityController {
  public static async listActivities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, type, limit = 50 } = req.query;
      const orgId = req.user!.organizationId;

      const filter: any = { organizationId: orgId };
      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = entityId;
      if (type) filter.type = type;

      const activities = await Activity.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('performedById', 'name email avatar');

      return sendSuccess(res, activities, 'Activities fetched');
    } catch (error) {
      next(error);
    }
  }

  public static async logActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, title, description, entityType, entityId, entityName } = req.body;
      const orgId = req.user!.organizationId;

      const activity = await Activity.create({
        organizationId: orgId,
        type,
        title,
        description,
        entityType,
        entityId,
        entityName,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      return sendCreated(res, activity, 'Activity logged successfully');
    } catch (error) {
      next(error);
    }
  }
}
