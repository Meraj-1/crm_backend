import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Pipeline } from '../models/Pipeline';
import { User } from '../models/User';
import { LeadStatus } from '../constants';

export class AnalyticsService {
  public static async getDashboardMetrics(organizationId: string) {
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const [
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      deals,
      defaultPipeline,
      pendingTasks,
      teamMembers
    ] = await Promise.all([
      Lead.countDocuments({ organizationId: orgId }),
      Lead.countDocuments({ organizationId: orgId, status: LeadStatus.NEW }),
      Lead.countDocuments({ organizationId: orgId, status: LeadStatus.WON }),
      Lead.countDocuments({ organizationId: orgId, status: LeadStatus.LOST }),
      Deal.find({ organizationId: orgId }),
      Pipeline.findOne({ organizationId: orgId, isDefault: true }),
      Task.countDocuments({ organizationId: orgId, status: { $ne: 'COMPLETED' } }),
      User.find({ organizationId: orgId }).select('name email role avatar')
    ]);

    // Calculate total pipeline value and expected revenue
    const totalPipelineValue = deals.reduce((acc, deal) => acc + (deal.value || 0), 0);
    const expectedRevenue = deals.reduce(
      (acc, deal) => acc + (deal.value || 0) * ((deal.probability || 0) / 100),
      0
    );

    // Won deals value
    const wonDeals = deals.filter(
      d => d.stageId.toLowerCase().includes('won') || d.probability === 100
    );
    const totalWonRevenue = wonDeals.reduce((acc, d) => acc + d.value, 0);

    // Conversion rate
    const closedLeads = wonLeads + lostLeads;
    const conversionRate = closedLeads > 0 ? ((wonLeads / closedLeads) * 100).toFixed(1) : '0';

    // Lead Sources Aggregation
    const sourceAggregation = await Lead.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$source', count: { $sum: 1 }, totalValue: { $sum: '$estimatedValue' } } },
      { $sort: { count: -1 } }
    ]);

    // Pipeline Stages Funnel Aggregation
    const stages = defaultPipeline?.stages || [];
    const stageFunnel = stages.map(stg => {
      const stageDeals = deals.filter(d => d.stageId === stg.id);
      const totalVal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      return {
        stageId: stg.id,
        stageName: stg.name,
        color: stg.color,
        order: stg.order,
        dealCount: stageDeals.length,
        totalValue: totalVal,
        probability: stg.probability
      };
    });

    // Top Performers by Deals won & pipeline value
    const userPerformers = teamMembers.map(member => {
      const userDeals = deals.filter(
        d => d.assignedToId && d.assignedToId.toString() === member._id.toString()
      );
      const closedWon = userDeals.filter(
        d => d.stageId.toLowerCase().includes('won') || d.probability === 100
      );
      return {
        userId: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        activeDealsCount: userDeals.length,
        wonDealsCount: closedWon.length,
        pipelineValue: userDeals.reduce((sum, d) => sum + d.value, 0),
        wonRevenue: closedWon.reduce((sum, d) => sum + d.value, 0)
      };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue);

    // Monthly Trend (Deals created in last 6 months)
    const monthlyStats = await Deal.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 5))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
      overview: {
        totalLeads,
        newLeads,
        wonLeads,
        lostLeads,
        conversionRate: `${conversionRate}%`,
        totalDeals: deals.length,
        totalPipelineValue,
        expectedRevenue: Math.round(expectedRevenue),
        totalWonRevenue,
        pendingTasks
      },
      leadSources: sourceAggregation.map(s => ({
        source: s._id,
        count: s.count,
        totalValue: s.totalValue
      })),
      stageFunnel,
      topPerformers: userPerformers,
      monthlyStats
    };
  }
}
