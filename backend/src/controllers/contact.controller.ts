import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Activity } from '../models/Activity';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';

export class ContactController {
  public static async listContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, companyId } = req.query;
      const orgId = req.user!.organizationId;

      const filter: any = { organizationId: orgId };
      if (companyId) filter.companyId = companyId;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const contacts = await Contact.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, contacts, 'Contacts retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getContactById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.user!.organizationId;

      const contact = await Contact.findOne({ _id: id, organizationId: orgId });
      if (!contact) {
        return next(new AppError('Contact not found', 404));
      }

      const [deals, activities] = await Promise.all([
        Deal.find({ organizationId: orgId, contactId: contact._id }),
        Activity.find({ organizationId: orgId, entityId: contact._id }).sort({ createdAt: -1 })
      ]);

      return sendSuccess(res, { contact, deals, activities });
    } catch (error) {
      next(error);
    }
  }

  public static async createContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const contactData = req.body;
      const orgId = req.user!.organizationId;

      const contact = await Contact.create({
        ...contactData,
        organizationId: orgId
      });

      return sendCreated(res, contact, 'Contact created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contact = await Contact.findOneAndUpdate(
        { _id: id, organizationId: req.user!.organizationId },
        req.body,
        { new: true }
      );

      if (!contact) {
        return next(new AppError('Contact not found', 404));
      }

      return sendSuccess(res, contact, 'Contact updated');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contact = await Contact.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });

      if (!contact) {
        return next(new AppError('Contact not found', 404));
      }

      return sendSuccess(res, null, 'Contact deleted');
    } catch (error) {
      next(error);
    }
  }
}

export class CompanyController {
  public static async listCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const orgId = req.user!.organizationId;

      const filter: any = { organizationId: orgId };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } }
        ];
      }

      const companies = await Company.find(filter).sort({ name: 1 });
      return sendSuccess(res, companies, 'Companies retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const company = await Company.create({
        ...req.body,
        organizationId: req.user!.organizationId
      });
      return sendCreated(res, company, 'Company created');
    } catch (error) {
      next(error);
    }
  }

  public static async updateCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await Company.findOneAndUpdate(
        { _id: id, organizationId: req.user!.organizationId },
        req.body,
        { new: true }
      );
      if (!company) {
        return next(new AppError('Company not found', 404));
      }
      return sendSuccess(res, company, 'Company updated');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await Company.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });
      if (!company) {
        return next(new AppError('Company not found', 404));
      }
      return sendSuccess(res, null, 'Company deleted');
    } catch (error) {
      next(error);
    }
  }
}
