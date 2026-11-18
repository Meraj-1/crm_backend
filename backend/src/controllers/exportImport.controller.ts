import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Lead } from '../models/Lead';
import { Contact } from '../models/Contact';
import { sendSuccess } from '../utils/responseHandler';

export class ExportImportController {
  public static async exportLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const leads = await Lead.find({ organizationId: req.user!.organizationId }).sort({ createdAt: -1 });

      const csvHeaders = ['Name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Source', 'Priority', 'EstimatedValue', 'Score', 'CreatedAt'];
      const csvRows = leads.map(l => [
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.company || '').replace(/"/g, '""')}"`,
        `"${(l.title || '').replace(/"/g, '""')}"`,
        `"${l.status}"`,
        `"${l.source}"`,
        `"${l.priority}"`,
        l.estimatedValue || 0,
        l.score || 50,
        `"${l.createdAt.toISOString()}"`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
      return res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  public static async exportContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contacts = await Contact.find({ organizationId: req.user!.organizationId }).sort({ createdAt: -1 });

      const csvHeaders = ['Name', 'Email', 'Phone', 'CompanyName', 'Designation', 'LeadSource', 'TotalDealsValue', 'Location', 'CreatedAt'];
      const csvRows = contacts.map(c => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${(c.companyName || '').replace(/"/g, '""')}"`,
        `"${(c.designation || '').replace(/"/g, '""')}"`,
        `"${c.leadSource || ''}"`,
        c.totalDealsValue || 0,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        `"${c.createdAt.toISOString()}"`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts_export.csv"');
      return res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
