import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { AIController } from '../controllers/ai.controller';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000)
});
const leadScoreSchema = z.object({});
const messageSchema = z.object({
  entityType: z.enum(['LEAD', 'CONTACT']),
  entityId: z.string().min(1),
  channel: z.enum(['EMAIL', 'WHATSAPP']),
  purpose: z.string().min(1).max(100),
  tone: z.enum(['Professional', 'Friendly', 'Formal', 'Persuasive', 'Short and direct']),
  language: z.enum(['English', 'Hindi', 'Hinglish']),
  instructions: z.string().max(1000).optional()
});
const sentimentSchema = z.object({
  entityType: z.enum(['LEAD', 'DEAL', 'CONTACT', 'COMPANY']),
  entityId: z.string().min(1),
  text: z.string().min(1).max(10000)
});

router.post('/chat', validateRequest({ body: chatSchema }), AIController.chat);
router.get('/conversations', AIController.listConversations);
router.get('/conversations/:id', AIController.getConversation);
router.delete('/conversations/:id', AIController.deleteConversation);
router.get('/insights', AIController.insights);
router.get('/lead-scoring/:leadId', AIController.getLeadScore);
router.post('/lead-scoring/:leadId', validateRequest({ body: leadScoreSchema }), AIController.scoreLead);
router.post('/message-generator', validateRequest({ body: messageSchema }), AIController.generateMessage);
router.post('/sentiment/analyze', validateRequest({ body: sentimentSchema }), AIController.analyzeSentiment);
router.post('/voice/session', AIController.voiceSession);

export default router;
