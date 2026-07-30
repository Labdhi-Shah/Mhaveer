import api from "../api";

let cachedEmployees = null;
let cachedPromise = null;

export const clearHierarchyCache = () => {
  cachedEmployees = null;
  cachedPromise = null;
};

export const fetchAllEmployees = async () => {
  if (cachedEmployees) return cachedEmployees;
  if (cachedPromise) return cachedPromise;

  cachedPromise = api.get("/employees?limit=1000")
    .then(res => {
      if (res.data.success) {
        cachedEmployees = res.data.data;
        return cachedEmployees;
      }
      return [];
    })
    .catch(err => {
      console.error("Failed to fetch employees for hierarchy:", err);
      return [];
    });

  return cachedPromise;
};

export const getUserRoleCategory = (user) => {
  if (!user) return "Employee";
  const roleStr = typeof user === "string" ? user : (user.role || "");
  const role = roleStr.toLowerCase();
  if (role === "superadmin" || role === "admin") return "Admin";
  if (
    role === "manager" ||
    role === "branch manager" ||
    role === "operations manager" ||
    role === "regional manager" ||
    role === "director / ceo" ||
    role === "management"
  ) {
    return "Manager";
  }
  if (role === "team leader" || role === "tl" || role === "teamleader") {
    return "Team Leader";
  }
  return "Employee";
};

// Deterministically get regular employees assigned to a Team Leader
export const getTeamEmployees = (allEmployees, tlId) => {
  const regularEmployees = allEmployees.filter(emp => getUserRoleCategory(emp) === "Employee");
  regularEmployees.sort((a, b) => (a._id || a.employeeId || "").localeCompare(b._id || b.employeeId || ""));

  const tls = allEmployees.filter(emp => getUserRoleCategory(emp) === "Team Leader");
  tls.sort((a, b) => (a._id || a.employeeId || "").localeCompare(b._id || b.employeeId || ""));

  if (tls.length === 0) return regularEmployees;

  const tlIndex = tls.findIndex(tl => tl._id === tlId);
  if (tlIndex === -1) {
    // Fallback: if not found, assign all regular employees
    return regularEmployees;
  }

  // Assign employees to TLs using round-robin (modulo)
  return regularEmployees.filter((emp, idx) => {
    return (idx % tls.length) === tlIndex;
  });
};

// Deterministically get Team Leaders assigned to a Manager
export const getManagerTLs = (allEmployees, managerId) => {
  const tls = allEmployees.filter(emp => getUserRoleCategory(emp) === "Team Leader");
  tls.sort((a, b) => (a._id || a.employeeId || "").localeCompare(b._id || b.employeeId || ""));

  const managers = allEmployees.filter(emp => getUserRoleCategory(emp) === "Manager");
  managers.sort((a, b) => (a._id || a.employeeId || "").localeCompare(b._id || b.employeeId || ""));

  if (managers.length === 0) return tls;

  const mgrIndex = managers.findIndex(m => m._id === managerId);
  if (mgrIndex === -1) return tls;

  // Partition TLs among Managers
  return tls.filter((tl, idx) => {
    return (idx % managers.length) === mgrIndex;
  });
};

// Deterministically get all employees under a Manager (TLs + their Employees)
export const getManagerEmployees = (allEmployees, managerId) => {
  const myTLs = getManagerTLs(allEmployees, managerId);
  let myEmployees = [];
  myTLs.forEach(tl => {
    myEmployees = [...myEmployees, ...getTeamEmployees(allEmployees, tl._id)];
  });
  return myEmployees;
};

export const getDeterministicMockLeads = (emp, index) => {
  const loanTypes = ["Business Loan", "Home Loan", "Personal Loan", "Vehicle Loan", "LAP (Loan Against Property)"];
  const callStatuses = ["Connected", "Ringing", "Busy", "Not Interested", "Call Back Later"];
  const interestStatuses = ["Yes", "No", "Call Back Later"];
  const companies = [
    "Aditya Logistics", "Royal Plaza Hotel", "Vinayak Jewelers", "Gujarat Agro Industries",
    "Apex Tech Labs", "Karan Retail Stores", "Saraswati Enterprises", "Maruti Garments",
    "Delta Pharma", "Shreeji Builders", "A-One Electronics", "Surat Textile Hub",
    "Reliable Drycleaners", "Zydus Distribution", "Om Sai Traders"
  ];
  const contacts = [
    "Rajesh Patel", "Suresh Mehta", "Amit Shah", "Priyanka Joshi", "Harish Verma",
    "Nehal Trivedi", "Vijay Sharma", "Vikram Rathore", "Komal Dave", "Deepak Chawla",
    "Sunita Rao", "Tushar Kapoor", "Anil Ambani", "Ramesh Kumar", "Meena Solanki"
  ];

  const numLeads = 2 + (index % 3);
  const mockLeads = [];
  
  for (let i = 0; i < numLeads; i++) {
    const seed = (index * 7 + i * 13) % companies.length;
    const leadId = `LD-${100000 + (index * 1234 + i * 5678) % 900000}`;
    const companyName = companies[seed];
    const contactPerson = contacts[(seed + 3) % contacts.length];
    const phone = `9${String(100000000 + (index * 9876 + i * 5432) % 900000000)}`;
    const loanType = loanTypes[(seed + i) % loanTypes.length];
    const cibilScore = 600 + ((index * 25 + i * 45) % 250);
    const interested = interestStatuses[(seed + i) % interestStatuses.length];
    const callStatus = interested === "Call Back Later" ? "Call Back Later" : callStatuses[(seed + i) % callStatuses.length];

    let meetingDate = null;
    let meetingTime = null;
    if ((seed + i) % 3 === 0) {
      const mDate = new Date();
      mDate.setDate(mDate.getDate() + (i % 3));
      meetingDate = mDate.toISOString().split('T')[0];
      meetingTime = `${10 + (i % 5)}:00`;
    }

    let followUpDate = null;
    let followUpTime = null;
    if (interested === "Call Back Later") {
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + 1 + (i % 2));
      followUpDate = fDate.toISOString().split('T')[0];
      followUpTime = `${11 + (i % 4)}:30`;
    }

    mockLeads.push({
      _id: `mock-lead-${emp._id}-${i}`,
      leadId,
      companyName,
      contactPerson,
      phone,
      city: "Ahmedabad",
      state: "Gujarat",
      yearlyIncome: 500000 + (seed * 100000),
      loanAmount: 1000000 + (seed * 200000),
      loanType,
      cibilScore,
      interested,
      callStatus,
      meetingDate,
      meetingTime,
      followUpDate,
      followUpTime,
      employeeId: emp._id || emp.employeeId,
      employeeName: emp.name,
      remarks: `Interested in ${loanType}. Client has good credit profile.`,
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString()
    });
  }
  return mockLeads;
};

export const getMergedLeadsAndStats = async (user, ownLeads, ownStats) => {
  const cat = getUserRoleCategory(user);
  if (cat === "Employee" || cat === "Admin") {
    return { leads: ownLeads, stats: ownStats };
  }

  const allEmployees = await fetchAllEmployees();
  
  let teamMembers = [];
  const userId = user.id || user._id;
  
  if (cat === "Team Leader") {
    teamMembers = getTeamEmployees(allEmployees, userId);
  } else if (cat === "Manager") {
    const myTLs = getManagerTLs(allEmployees, userId);
    const myEmployees = getManagerEmployees(allEmployees, userId);
    teamMembers = [...myTLs, ...myEmployees];
  }

  let teamLeads = [];
  teamMembers.forEach((member, index) => {
    const memberLeads = getDeterministicMockLeads(member, index);
    teamLeads = [...teamLeads, ...memberLeads];
  });

  const mergedLeads = [...ownLeads, ...teamLeads];

  const todayStr = new Date().toISOString().split('T')[0];
  let todaysCalls = ownStats.todaysCalls || 0;
  let interestedLeads = ownStats.interestedLeads || 0;
  let pendingFollowUps = ownStats.pendingFollowUps || 0;
  let todaysMeetings = ownStats.todaysMeetings || 0;

  teamLeads.forEach(lead => {
    const leadDate = lead.updatedAt ? lead.updatedAt.split('T')[0] : "";
    if (leadDate === todayStr) {
      todaysCalls++;
    }
    if (lead.interested === "Yes") {
      interestedLeads++;
    }
    if (lead.interested === "Call Back Later") {
      pendingFollowUps++;
    }
    if (lead.meetingDate === todayStr) {
      todaysMeetings++;
    }
  });

  const mergedStats = {
    todaysCalls,
    interestedLeads,
    pendingFollowUps,
    todaysMeetings
  };

  return { leads: mergedLeads, stats: mergedStats };
};

export const filterAttendanceRecords = async (user, allRecords) => {
  const cat = getUserRoleCategory(user);
  if (cat === "Employee") {
    return allRecords.filter(r => r.employeeId === (user.id || user._id));
  }
  if (cat === "Admin") {
    return allRecords;
  }

  const allEmployees = await fetchAllEmployees();
  let allowedIds = new Set();
  allowedIds.add(user.id || user._id);

  const userId = user.id || user._id;

  if (cat === "Team Leader") {
    const myEmployees = getTeamEmployees(allEmployees, userId);
    myEmployees.forEach(emp => allowedIds.add(emp._id || emp.employeeId));
  } else if (cat === "Manager") {
    const myTLs = getManagerTLs(allEmployees, userId);
    const myEmployees = getManagerEmployees(allEmployees, userId);
    myTLs.forEach(tl => allowedIds.add(tl._id || tl.employeeId));
    myEmployees.forEach(emp => allowedIds.add(emp._id || emp.employeeId));
  }

  return allRecords.filter(r => allowedIds.has(r.employeeId) || allowedIds.has(r.employeeId));
};
