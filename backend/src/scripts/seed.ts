import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Pipeline } from '../models/Pipeline';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { AutomationRule } from '../models/AutomationRule';
import { CommunicationLog } from '../models/CommunicationLog';
import {
  UserRole,
  PlanTier,
  LeadStatus,
  LeadSource,
  Priority,
  TaskStatus,
  ActivityType,
  EntityType,
  TriggerType,
  ActionType,
  CommunicationChannel
} from '../constants';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seeder] Cleaning existing database collections...');

    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Pipeline.deleteMany({}),
      Company.deleteMany({}),
      Contact.deleteMany({}),
      Lead.deleteMany({}),
      Deal.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
      AutomationRule.deleteMany({}),
      CommunicationLog.deleteMany({})
    ]);

    console.log('[Seeder] 1. Creating Organizations...');
    const orgNexus = await Organization.create({
      name: 'Nexus Innovations Pvt Ltd',
      slug: 'nexus-tech',
      plan: PlanTier.PRO,
      currency: 'INR',
      currencySymbol: '₹',
      maxUsers: 15,
      maxLeads: 10000,
      settings: {
        leadAutoAssign: true,
        notifyOnDealWon: true
      }
    });

    const orgApex = await Organization.create({
      name: 'Apex Growth Agency',
      slug: 'apex-growth',
      plan: PlanTier.ENTERPRISE,
      currency: 'USD',
      currencySymbol: '$',
      maxUsers: 50,
      maxLeads: 50000,
      settings: {
        leadAutoAssign: false,
        notifyOnDealWon: true
      }
    });

    console.log('[Seeder] 2. Creating Users with Hashed Passwords...');
    const password = 'Password@123'; // Standard test password for all seeded users

    const userOwner = await User.create({
      name: 'Mohammad Tariq',
      email: 'tariq@nexus.com',
      password,
      role: UserRole.OWNER,
      organizationId: orgNexus._id,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });

    const userManager = await User.create({
      name: 'Priya Sharma',
      email: 'priya@nexus.com',
      password,
      role: UserRole.MANAGER,
      organizationId: orgNexus._id,
      phone: '+91 98765 43211',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });

    const userRep1 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@nexus.com',
      password,
      role: UserRole.SALES_REP,
      organizationId: orgNexus._id,
      phone: '+91 98765 43212',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    });

    const userRep2 = await User.create({
      name: 'Ananya Iyer',
      email: 'ananya@nexus.com',
      password,
      role: UserRole.SALES_REP,
      organizationId: orgNexus._id,
      phone: '+91 98765 43213',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    });

    console.log('[Seeder] 3. Creating Pipelines & Stages...');
    const pipeline = await Pipeline.create({
      organizationId: orgNexus._id,
      name: 'Direct Sales Pipeline',
      isDefault: true,
      stages: [
        { id: 'stage-1', name: 'Lead In', order: 0, color: '#3b82f6', probability: 10 },
        { id: 'stage-2', name: 'Contact Made', order: 1, color: '#f59e0b', probability: 25 },
        { id: 'stage-3', name: 'Needs Discovery', order: 2, color: '#8b5cf6', probability: 40 },
        { id: 'stage-4', name: 'Proposal Sent', order: 3, color: '#6366f1', probability: 65 },
        { id: 'stage-5', name: 'Negotiation', order: 4, color: '#ec4899', probability: 85 },
        { id: 'stage-6', name: 'Closed Won', order: 5, color: '#10b981', probability: 100 },
        { id: 'stage-7', name: 'Closed Lost', order: 6, color: '#ef4444', probability: 0 }
      ]
    });

    orgNexus.settings.defaultPipelineId = pipeline._id as any;
    await orgNexus.save();

    console.log('[Seeder] 4. Creating Companies & Accounts...');
    const company1 = await Company.create({
      organizationId: orgNexus._id,
      name: 'Reliance Retail Ventures',
      industry: 'Retail & E-commerce',
      website: 'https://relianceretail.com',
      size: '201+',
      annualRevenue: 50000000,
      phone: '+91 22 3555 1000',
      email: 'contact@relianceretail.com',
      address: 'Maker Chambers IV, Nariman Point, Mumbai'
    });

    const company2 = await Company.create({
      organizationId: orgNexus._id,
      name: 'Zomato Media Pvt Ltd',
      industry: 'Food Delivery & Tech',
      website: 'https://zomato.com',
      size: '201+',
      annualRevenue: 30000000,
      phone: '+91 11 4455 6677',
      email: 'partnerships@zomato.com',
      address: 'DLF Cyber City, Gurugram'
    });

    const company3 = await Company.create({
      organizationId: orgNexus._id,
      name: 'Freshworks Technologies',
      industry: 'SaaS & Cloud',
      website: 'https://freshworks.com',
      size: '201+',
      annualRevenue: 45000000,
      phone: '+91 44 6667 8899',
      email: 'enterprise@freshworks.com',
      address: 'Global Infocity Park, Chennai'
    });

    console.log('[Seeder] 5. Creating Contacts...');
    const contact1 = await Contact.create({
      organizationId: orgNexus._id,
      name: 'Sameer Goel',
      email: 'sameer.goel@relianceretail.com',
      phone: '+91 98200 11223',
      companyName: 'Reliance Retail Ventures',
      companyId: company1._id,
      designation: 'VP of Digital Strategy',
      leadSource: LeadSource.REFERRAL,
      totalDealsValue: 2450000,
      location: 'Mumbai, MH',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    });

    const contact2 = await Contact.create({
      organizationId: orgNexus._id,
      name: 'Rohan Mehra',
      email: 'rohan.mehra@zomato.com',
      phone: '+91 99100 44556',
      companyName: 'Zomato Media Pvt Ltd',
      companyId: company2._id,
      designation: 'Head of Merchant Partnerships',
      leadSource: LeadSource.GOOGLE_ADS,
      totalDealsValue: 1800000,
      location: 'Gurugram, HR',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    });

    const contact3 = await Contact.create({
      organizationId: orgNexus._id,
      name: 'Meera Nambiar',
      email: 'meera.nambiar@freshworks.com',
      phone: '+91 94440 99887',
      companyName: 'Freshworks Technologies',
      companyId: company3._id,
      designation: 'Procurement Director',
      leadSource: LeadSource.LINKEDIN,
      totalDealsValue: 3200000,
      location: 'Chennai, TN',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    });

    console.log('[Seeder] 6. Creating Leads...');
    const lead1 = await Lead.create({
      organizationId: orgNexus._id,
      name: 'Vikramaditya Rao',
      email: 'vikram@tataauto.com',
      phone: '+91 98333 44112',
      company: 'Tata AutoComp Systems',
      title: 'Head of IT Infrastructure',
      status: LeadStatus.QUALIFIED,
      source: LeadSource.META_ADS,
      priority: Priority.HIGH,
      estimatedValue: 1500000,
      assignedToId: userRep1._id,
      tags: ['Automotive', 'Q3 Budget', 'Hot'],
      notes: 'Interested in enterprise automation for 12 manufacturing plants across India.',
      score: 85
    });

    const lead2 = await Lead.create({
      organizationId: orgNexus._id,
      name: 'Sneha Kulkarni',
      email: 'sneha@swiggy.in',
      phone: '+91 98450 67890',
      company: 'Bundl Technologies (Swiggy)',
      title: 'Director of Operations',
      status: LeadStatus.PROPOSAL_SENT,
      source: LeadSource.LINKEDIN,
      priority: Priority.URGENT,
      estimatedValue: 2800000,
      assignedToId: userRep2._id,
      tags: ['FoodTech', 'Enterprise', 'Executive Sponsor'],
      notes: 'Proposal submitted for customer lifecycle tracking and agent dispatch.',
      score: 92
    });

    const lead3 = await Lead.create({
      organizationId: orgNexus._id,
      name: 'Aditya Birla Chemicals',
      email: 'procurement@adityabirla.com',
      phone: '+91 22 2499 5000',
      company: 'Aditya Birla Group',
      title: 'Procurement Lead',
      status: LeadStatus.NEW,
      source: LeadSource.WEBSITE,
      priority: Priority.MEDIUM,
      estimatedValue: 850000,
      assignedToId: userManager._id,
      tags: ['Inbound', 'Manufacturing'],
      score: 60
    });

    console.log('[Seeder] 7. Creating Deals...');
    const deal1 = await Deal.create({
      organizationId: orgNexus._id,
      pipelineId: pipeline._id,
      stageId: 'stage-4',
      title: 'Reliance Omnichannel CRM Rollout',
      value: 2450000,
      currency: 'INR',
      contactId: contact1._id,
      contactName: contact1.name,
      companyName: 'Reliance Retail Ventures',
      companyId: company1._id,
      assignedToId: userRep1._id,
      priority: Priority.URGENT,
      probability: 65,
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: ['Enterprise', 'Multi-Store']
    });

    const deal2 = await Deal.create({
      organizationId: orgNexus._id,
      pipelineId: pipeline._id,
      stageId: 'stage-6', // Won
      title: 'Zomato Merchant Helpdesk Integration',
      value: 1800000,
      currency: 'INR',
      contactId: contact2._id,
      contactName: contact2.name,
      companyName: 'Zomato Media Pvt Ltd',
      companyId: company2._id,
      assignedToId: userRep2._id,
      priority: Priority.HIGH,
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      tags: ['Annual Contract', 'Won']
    });

    const deal3 = await Deal.create({
      organizationId: orgNexus._id,
      pipelineId: pipeline._id,
      stageId: 'stage-5',
      title: 'Freshworks Custom SLA Automation',
      value: 3200000,
      currency: 'INR',
      contactId: contact3._id,
      contactName: contact3.name,
      companyName: 'Freshworks Technologies',
      companyId: company3._id,
      assignedToId: userOwner._id,
      priority: Priority.URGENT,
      probability: 85,
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['Tier-1', 'Final Stage']
    });

    console.log('[Seeder] 8. Creating Tasks...');
    await Task.create([
      {
        organizationId: orgNexus._id,
        title: 'Review revised SLA terms with Sameer Goel',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: Priority.URGENT,
        status: TaskStatus.TODO,
        assignedToId: userRep1._id,
        relatedToType: EntityType.DEAL,
        relatedToId: deal1._id,
        relatedToName: deal1.title
      },
      {
        organizationId: orgNexus._id,
        title: 'Schedule product walkthrough demo for Tata Auto team',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        assignedToId: userRep1._id,
        relatedToType: EntityType.LEAD,
        relatedToId: lead1._id,
        relatedToName: lead1.name
      },
      {
        organizationId: orgNexus._id,
        title: 'Send onboarding welcome pack to Zomato team',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: Priority.MEDIUM,
        status: TaskStatus.COMPLETED,
        assignedToId: userRep2._id,
        relatedToType: EntityType.CONTACT,
        relatedToId: contact2._id,
        relatedToName: contact2.name
      }
    ]);

    console.log('[Seeder] 9. Creating Activity Logs...');
    await Activity.create([
      {
        organizationId: orgNexus._id,
        type: ActivityType.STAGE_CHANGE,
        title: 'Deal Won: Zomato Merchant Helpdesk Integration',
        description: 'Contract signed for 1 year. Deal moved to Closed Won stage.',
        entityType: EntityType.DEAL,
        entityId: deal2._id,
        entityName: deal2.title,
        performedById: userRep2._id,
        performedByName: userRep2.name
      },
      {
        organizationId: orgNexus._id,
        type: ActivityType.CALL,
        title: 'Discovery call with Vikramaditya Rao',
        description: 'Discussed architecture integration with SAP ERP backend.',
        entityType: EntityType.LEAD,
        entityId: lead1._id,
        entityName: lead1.name,
        performedById: userRep1._id,
        performedByName: userRep1.name
      },
      {
        organizationId: orgNexus._id,
        type: ActivityType.EMAIL,
        title: 'Quote Sent: Reliance Omnichannel CRM',
        description: 'Sent formal commercial proposal with Tier-1 enterprise discounts.',
        entityType: EntityType.DEAL,
        entityId: deal1._id,
        entityName: deal1.title,
        performedById: userRep1._id,
        performedByName: userRep1.name
      }
    ]);

    console.log('[Seeder] 10. Creating Automation Rules...');
    await AutomationRule.create([
      {
        organizationId: orgNexus._id,
        name: 'Auto Follow-Up on New High-Priority Lead',
        description: 'Automatically creates a follow-up task when a high priority lead is captured.',
        trigger: TriggerType.LEAD_CREATED,
        triggerCondition: 'HIGH',
        action: ActionType.CREATE_TASK,
        actionPayload: JSON.stringify({
          title: 'Immediate Contact: New High Priority Lead',
          delayDays: 1,
          priority: 'URGENT'
        }),
        isActive: true,
        executionCount: 14,
        createdById: userOwner._id
      },
      {
        organizationId: orgNexus._id,
        name: 'Deal Won Team Notification',
        description: 'Notify management team whenever a deal reaches Closed Won status.',
        trigger: TriggerType.DEAL_WON,
        action: ActionType.NOTIFY_TEAM,
        actionPayload: JSON.stringify({
          channel: 'EMAIL',
          subject: 'Big Win Celebration 🎉'
        }),
        isActive: true,
        executionCount: 8,
        createdById: userOwner._id
      }
    ]);

    console.log('====================================================');
    console.log('🎉 [Seeder] Database Seeded Successfully with MongoDB!');
    console.log('----------------------------------------------------');
    console.log(`👤 Owner Login:    tariq@nexus.com / Password@123`);
    console.log(`👤 Manager Login:  priya@nexus.com / Password@123`);
    console.log(`👤 Sales Rep:      rahul@nexus.com / Password@123`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Fatal error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
