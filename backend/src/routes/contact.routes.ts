import { Router } from 'express';
import { ContactController, CompanyController } from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createContactSchema, updateContactSchema } from '../validations/contact.validation';
import { createCompanySchema, updateCompanySchema } from '../validations/company.validation';

export const contactRoutes = Router();

contactRoutes.use(authenticate);
contactRoutes.get('/', ContactController.listContacts);
contactRoutes.post('/', validateRequest(createContactSchema), ContactController.createContact);
contactRoutes.get('/:id', ContactController.getContactById);
contactRoutes.patch('/:id', validateRequest(updateContactSchema), ContactController.updateContact);
contactRoutes.delete('/:id', ContactController.deleteContact);

export const companyRoutes = Router();

companyRoutes.use(authenticate);
companyRoutes.get('/', CompanyController.listCompanies);
companyRoutes.post('/', validateRequest(createCompanySchema), CompanyController.createCompany);
companyRoutes.patch('/:id', validateRequest(updateCompanySchema), CompanyController.updateCompany);
companyRoutes.delete('/:id', CompanyController.deleteCompany);
