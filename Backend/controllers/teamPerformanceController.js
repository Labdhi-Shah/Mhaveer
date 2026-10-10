const Employee = require("../models/Employee");
const Lead = require("../models/Lead");
const mongoose = require("mongoose");

const normalizeDepartment = (value = "") => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lower = raw.toLowerCase();
  
  if (lower.includes("kyc") || lower.includes("compliance")) return "Sales";
  if (lower.includes("admin")) return "Admin";
  if (lower.includes("sales")) return "Sales";
  if (lower.includes("telecalling") || lower.includes("lead generation")) return "Telecalling";
  if (lower.includes("lead")) return "Leads";
  
  return raw;
};

exports.getTeamPerformance = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    const { teamLeaderId } = req.query; // optional drill-down

    // Fetch the logged-in user's full Employee record
    const currentUser = await Employee.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { role, employeeId } = currentUser;
    // Use the already normalized department from req.user
    const normalizedDept = req.user.department;

    if (role === "Employee") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday as start
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // --- MANAGER VIEW ---
    if (role === "Manager" || role === "Admin") {
      if (teamLeaderId) {
        // Manager drilled down to view Employees under a specific Team Leader
        const query = { teamLeaderId: String(teamLeaderId), role: { $nin: ["Admin", "Manager", "Team Leader"] } };
        
        const employees = await Employee.find(query);

        if (!employees.length) {
          return res.json({ success: true, type: "Employee", data: [] });
        }

        const employeeIds = employees.map(emp => String(emp._id));

        // Aggregate Leads for these employees
        const leadsStats = await getLeadsStatsForEmployees(employeeIds, todayStart, todayEnd, weekStart, monthStart);

        const result = employees.map(emp => {
          const stats = leadsStats.find(stat => stat._id === String(emp._id)) || {};
          return {
            id: emp._id,
            employeeId: emp.employeeId,
            name: emp.name,
            totalCalls: stats.totalCalls || 0,
            todaysCalls: stats.todaysCalls || 0,
            interestedLeads: stats.interestedLeads || 0,
            pendingFollowUps: stats.pendingFollowUps || 0,
            todaysMeetings: stats.todaysMeetings || 0,
            lastActivity: stats.lastActivity || null
          };
        });

        return res.json({ success: true, type: "Employee", data: result });
      } else {
        // Default Manager View: Show Team Leaders
        const query = { role: "Team Leader" };
        let teamLeaders = await Employee.find(query);
        
        if (role !== "Admin" && normalizedDept) {
            teamLeaders = teamLeaders.filter(tl => normalizeDepartment(tl.department) === normalizedDept);
        }

        if (!teamLeaders.length) {
          // Fallback: If no Team Leaders are found, show all Employees directly
          const empQuery = { role: { $nin: ["Admin", "Manager"] } };
          let employees = await Employee.find(empQuery);
          
          if (role !== "Admin" && normalizedDept) {
            employees = employees.filter(emp => normalizeDepartment(emp.department) === normalizedDept);
          }
          
          if (!employees.length) {
            return res.json({ success: true, type: "Employee", data: [] });
          }
          
          const employeeIds = employees.map(emp => String(emp._id));
          const leadsStats = await getLeadsStatsForEmployees(employeeIds, todayStart, todayEnd, weekStart, monthStart);

          const result = employees.map(emp => {
            const stats = leadsStats.find(stat => stat._id === String(emp._id)) || {};
            return {
              id: emp._id,
              employeeId: emp.employeeId,
              name: emp.name,
              totalCalls: stats.totalCalls || 0,
              todaysCalls: stats.todaysCalls || 0,
              interestedLeads: stats.interestedLeads || 0,
              pendingFollowUps: stats.pendingFollowUps || 0,
              todaysMeetings: stats.todaysMeetings || 0,
              lastActivity: stats.lastActivity || null
            };
          });

          return res.json({ success: true, type: "Employee", data: result });
        }

        const tlIds = teamLeaders.map(tl => String(tl._id));

        // Get Employee counts per Team Leader
        const employeeCounts = await Employee.aggregate([
          { $match: { teamLeaderId: { $in: tlIds }, role: { $nin: ["Admin", "Manager", "Team Leader"] } } },
          { $group: { _id: "$teamLeaderId", count: { $sum: 1 } } }
        ]);

        // Aggregate Leads for these Team Leaders
        const leadsStats = await getLeadsStatsForTeamLeaders(tlIds, todayStart, todayEnd, weekStart, monthStart);

        const result = teamLeaders.map(tl => {
          const empCountObj = employeeCounts.find(ec => ec._id === String(tl._id));
          const stats = leadsStats.find(stat => stat._id === String(tl._id)) || {};

          return {
            id: tl._id,
            employeeId: tl.employeeId,
            name: tl.name,
            employeeCount: empCountObj ? empCountObj.count : 0,
            totalCalls: stats.totalCalls || 0,
            todaysCalls: stats.todaysCalls || 0,
            interestedLeads: stats.interestedLeads || 0,
            pendingFollowUps: stats.pendingFollowUps || 0,
            todaysMeetings: stats.todaysMeetings || 0,
            lastActivity: stats.lastActivity || null
          };
        });

        return res.json({ success: true, type: "Team Leader", data: result });
      }
    }

    // --- TEAM LEADER VIEW ---
    if (role === "Team Leader") {
      const employees = await Employee.find({
        teamLeaderId: String(currentUser._id),
        role: { $nin: ["Admin", "Manager", "Team Leader"] }
      });

      if (!employees.length) {
        return res.json({ success: true, type: "Employee", data: [] });
      }

      const employeeIds = employees.map(emp => String(emp._id));

      const leadsStats = await getLeadsStatsForEmployees(employeeIds, todayStart, todayEnd, weekStart, monthStart);

      const result = employees.map(emp => {
        const stats = leadsStats.find(stat => stat._id === String(emp._id)) || {};
        return {
          id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          totalCalls: stats.totalCalls || 0,
          todaysCalls: stats.todaysCalls || 0,
          interestedLeads: stats.interestedLeads || 0,
          pendingFollowUps: stats.pendingFollowUps || 0,
          todaysMeetings: stats.todaysMeetings || 0,
          lastActivity: stats.lastActivity || null
        };
      });

      return res.json({ success: true, type: "Employee", data: result });
    }

    return res.status(403).json({ success: false, message: "Role not supported for Team Performance" });
  } catch (error) {
    console.error("Team Performance error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getEmployeeLeads = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Optional: add authorization logic if a manager can only see their team's leads.
    // Assuming for now that if they can reach Team Performance, they have access.
    const leads = await Lead.find({ 
      $or: [
        { employeeId: employeeId },
        { teamLeaderId: employeeId }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`[getEmployeeLeads] Fetched leads for ${employeeId}. Count: ${leads.length}`);
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error("Get Employee Leads Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Helper functions for MongoDB Aggregation
async function getLeadsStatsForEmployees(employeeIds, todayStart, todayEnd, weekStart, monthStart) {
  const matchObj = { employeeId: { $in: employeeIds } };
  return executeLeadAggregation(matchObj, "$employeeId", todayStart, todayEnd, weekStart, monthStart);
}

async function getLeadsStatsForTeamLeaders(tlIds, todayStart, todayEnd, weekStart, monthStart) {
  // We need to group by the Team Leader ID.
  // A lead belongs to a TL if its teamLeaderId is the TL's ID OR its employeeId is the TL's ID.
  return await Lead.aggregate([
    {
      $match: {
        $or: [
          { teamLeaderId: { $in: tlIds } },
          { employeeId: { $in: tlIds } }
        ]
      }
    },
    {
      $addFields: {
        resolvedTlId: {
          $cond: [
            { $in: ["$teamLeaderId", tlIds] },
            "$teamLeaderId",
            "$employeeId"
          ]
        }
      }
    },
    ...getLeadAggregationStages("$resolvedTlId", todayStart, todayEnd, weekStart, monthStart)
  ]);
}

async function executeLeadAggregation(matchObj, groupIdField, todayStart, todayEnd, weekStart, monthStart) {
  return await Lead.aggregate([
    { $match: matchObj },
    ...getLeadAggregationStages(groupIdField, todayStart, todayEnd, weekStart, monthStart)
  ]);
}

function getLeadAggregationStages(groupIdField, todayStart, todayEnd, weekStart, monthStart) {
  return [
    {
      $group: {
        _id: groupIdField,
        totalCalls: { $sum: 1 },
        todaysCalls: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ["$updatedAt", todayStart] }, { $lte: ["$updatedAt", todayEnd] }] },
              1,
              0
            ]
          }
        },
        interestedLeads: {
          $sum: {
            $cond: [{ $eq: ["$interested", "Yes"] }, 1, 0]
          }
        },
        pendingFollowUps: {
          $sum: {
            $cond: [
              { $eq: ["$interested", "Call Back Later"] },
              1,
              0
            ]
          }
        },
        todaysMeetings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$meetingDate", null] },
                  // Ensure meetingDate is a Date object in DB or comparable
                  // We'll approximate by checking if it's not null since the dashboard does it simply.
                  // Actually, dashboardController uses: meetingDate: { $gte: today, $lt: tomorrow }
                  // Since meetingDate might be stored as string or date, let's just use the strict condition if it's a date:
                  { $gte: ["$meetingDate", todayStart] },
                  { $lte: ["$meetingDate", todayEnd] }
                ]
              },
              1,
              0
            ]
          }
        },
        lastActivity: { $max: "$updatedAt" }
      }
    }
  ];
}