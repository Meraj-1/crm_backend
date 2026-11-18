import mongoose, { Document, Schema } from 'mongoose';

export interface IAIConversation extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const aiConversationSchema = new Schema<IAIConversation>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New AI conversation', trim: true },
  messages: [{
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
aiConversationSchema.index({ organizationId: 1, userId: 1, updatedAt: -1 });

export interface IAILeadScore extends Document {
  organizationId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  score: number;
  category: 'HOT' | 'WARM' | 'POTENTIAL' | 'COLD';
  positiveFactors: string[];
  negativeFactors: string[];
  explanation: string;
  nextBestAction: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
}

const aiLeadScoreSchema = new Schema<IAILeadScore>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  category: { type: String, enum: ['HOT', 'WARM', 'POTENTIAL', 'COLD'], required: true },
  positiveFactors: [{ type: String }],
  negativeFactors: [{ type: String }],
  explanation: { type: String, required: true },
  nextBestAction: { type: String, required: true },
  createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });
aiLeadScoreSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });

export interface IAISentiment extends Document {
  organizationId: mongoose.Types.ObjectId;
  entityType: 'LEAD' | 'DEAL' | 'CONTACT' | 'COMPANY';
  entityId: mongoose.Types.ObjectId;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  topics: string[];
  signals: string[];
  recommendedResponse: string;
  sourceText: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
}

const aiSentimentSchema = new Schema<IAISentiment>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  entityType: { type: String, enum: ['LEAD', 'DEAL', 'CONTACT', 'COMPANY'], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  sentiment: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  topics: [{ type: String }],
  signals: [{ type: String }],
  recommendedResponse: { type: String, required: true },
  sourceText: { type: String, required: true },
  createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });
aiSentimentSchema.index({ organizationId: 1, entityId: 1, createdAt: -1 });

export interface IAIUsageLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  feature: string;
  aiModel: string;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  error?: string;
  createdAt: Date;
}

const aiUsageLogSchema = new Schema<IAIUsageLog>({
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  feature: { type: String, required: true },
  aiModel: { type: String, required: true },
  inputTokens: { type: Number, default: 0 },
  outputTokens: { type: Number, default: 0 },
  success: { type: Boolean, default: true },
  error: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });
aiUsageLogSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', aiConversationSchema);
export const AILeadScore = mongoose.model<IAILeadScore>('AILeadScore', aiLeadScoreSchema);
export const AISentiment = mongoose.model<IAISentiment>('AISentiment', aiSentimentSchema);
export const AIUsageLog = mongoose.model<IAIUsageLog>('AIUsageLog', aiUsageLogSchema);
