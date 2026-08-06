// Central Dummy Data Store for Sales Department Module

const INITIAL_LEADS = [
  {
    _id: "lead-1",
    leadId: "SLS-2026-001",
    companyName: "Apex Global Solutions",
    contactPerson: "Rajesh Sharma",
    phone: "9876543210",
    email: "rajesh@apexglobal.com",
    loanType: "Business Loan",
    loanAmount: 4500000,
    cibilScore: 780,
    stage: "New Lead",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-08-10",
    meetingTime: "11:30",
    followUpDate: "2026-08-08",
    followUpTime: "14:00",
    address: "402, Signature Towers, SG Highway, Ahmedabad, Gujarat"
  },
  {
    _id: "lead-2",
    leadId: "SLS-2026-002",
    companyName: "Blue Water Logistics",
    contactPerson: "Amrita Patel",
    phone: "8765432109",
    email: "amrita@bluewater.in",
    loanType: "Property Loan",
    propertyLoanCategory: "Commercial Property",
    loanAmount: 12000000,
    cibilScore: 720,
    stage: "Proposal Sent",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-08-12",
    meetingTime: "15:00",
    followUpDate: "2026-08-07",
    followUpTime: "11:00",
    address: "12, GIDC Industrial Estate, Makarpura, Vadodara, Gujarat"
  },
  {
    _id: "lead-3",
    leadId: "SLS-2026-003",
    companyName: "Zenith Retail Corp",
    contactPerson: "Vikram Mehta",
    phone: "7654321098",
    email: "vikram@zenithretail.com",
    loanType: "Business Loan",
    loanAmount: 1500000,
    cibilScore: 640,
    stage: "Contacted",
    interested: "Call Back Later",
    callStatus: "No Answer",
    meetingDate: "",
    meetingTime: "",
    followUpDate: "2026-08-09",
    followUpTime: "10:30",
    address: "A-504, Titanium City Center, Satellite, Ahmedabad, Gujarat"
  },
  {
    _id: "lead-4",
    leadId: "SLS-2026-004",
    companyName: "Deltatech Enterprises",
    contactPerson: "Sanjay Shah",
    phone: "6543210987",
    email: "sanjay@deltatech.co.in",
    loanType: "Home Loan",
    loanAmount: 6000000,
    cibilScore: 810,
    stage: "Won",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-08-01",
    meetingTime: "10:00",
    followUpDate: "",
    followUpTime: "",
    address: "Flat 102, Shanti Heights, Ring Road, Surat, Gujarat"
  },
  {
    _id: "lead-5",
    leadId: "SLS-2026-005",
    companyName: "Aura Boutique & Crafts",
    contactPerson: "Pooja Trivedi",
    phone: "9988776655",
    email: "pooja@auracrafts.com",
    loanType: "Business Loan",
    loanAmount: 800000,
    cibilScore: 590,
    stage: "Lost",
    interested: "No",
    callStatus: "Connected",
    meetingDate: "",
    meetingTime: "",
    followUpDate: "",
    followUpTime: "",
    address: "Shop 14, Heritage Market, Race Course Road, Rajkot, Gujarat"
  },
  {
    _id: "lead-6",
    leadId: "SLS-2026-006",
    companyName: "Microfab Industries",
    contactPerson: "Hasmukh Patel",
    phone: "9825012345",
    email: "hasmukh@microfab.com",
    loanType: "Property Loan",
    propertyLoanCategory: "Industrial Land",
    loanAmount: 25000000,
    cibilScore: 765,
    stage: "Negotiation",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-08-15",
    meetingTime: "12:00",
    followUpDate: "2026-08-08",
    followUpTime: "16:00",
    address: "Block C-21, GIDC Kalol, Gandhinagar, Gujarat"
  },
  {
    _id: "lead-7",
    leadId: "SLS-2026-007",
    companyName: "Horizon Agritech",
    contactPerson: "Kirit Bhai Patel",
    phone: "9879504321",
    email: "kirit@horizonagri.in",
    loanType: "Business Loan",
    loanAmount: 3500000,
    cibilScore: 735,
    stage: "Qualified",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-08-11",
    meetingTime: "14:30",
    followUpDate: "2026-08-06",
    followUpTime: "12:00",
    address: "Market Yard Road, Mehsana, Gujarat"
  },
  {
    _id: "lead-8",
    leadId: "SLS-2026-008",
    companyName: "Royal Ceramics Ltd",
    contactPerson: "Nilesh Prajapati",
    phone: "9099012345",
    email: "nilesh@royalceramics.com",
    loanType: "Property Loan",
    propertyLoanCategory: "Warehouse",
    loanAmount: 18000000,
    cibilScore: 795,
    stage: "Won",
    interested: "Yes",
    callStatus: "Connected",
    meetingDate: "2026-07-28",
    meetingTime: "11:00",
    followUpDate: "",
    followUpTime: "",
    address: "Lakhdhirpur Road, Morbi, Gujarat"
  }
];

const INITIAL_ACTIVITIES = [
  { id: 1, text: "Rajesh Sharma moved to Qualified Stage", time: "10 mins ago", iconType: "stage" },
  { id: 2, text: "New Business Loan lead added for Apex Global Solutions", time: "1 hour ago", iconType: "add" },
  { id: 3, text: "Consultation meeting scheduled with Blue Water Logistics", time: "3 hours ago", iconType: "meeting" },
  { id: 4, text: "Sent loan proposal to Blue Water Logistics (1.2 Cr)", time: "Yesterday", iconType: "proposal" },
  { id: 5, text: "Won Deal: Deltatech Enterprises (Home Loan - 60L)", time: "2 days ago", iconType: "won" }
];

const PERFORMANCE_CHART_DATA = [
  { name: "Week 1", Leads: 12, Conversions: 4 },
  { name: "Week 2", Leads: 18, Conversions: 6 },
  { name: "Week 3", Leads: 15, Conversions: 5 },
  { name: "Week 4", Leads: 22, Conversions: 9 },
  { name: "Week 5", Leads: 29, Conversions: 11 }
];

const REVENUE_CHART_DATA = [
  { name: "Mar", Revenue: 2.4 },
  { name: "Apr", Revenue: 3.1 },
  { name: "May", Revenue: 4.5 },
  { name: "Jun", Revenue: 3.8 },
  { name: "Jul", Revenue: 5.6 },
  { name: "Aug", Revenue: 6.8 }
];

const getStore = (key, initial) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initial;
  }
};

const setStore = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getLeads = () => getStore("sales_leads", INITIAL_LEADS);
export const saveLeads = (leads) => setStore("sales_leads", leads);

export const getActivities = () => getStore("sales_activities", INITIAL_ACTIVITIES);
export const addActivity = (text, iconType) => {
  const activities = getActivities();
  const newActivity = {
    id: Date.now(),
    text,
    time: "Just now",
    iconType
  };
  setStore("sales_activities", [newActivity, ...activities.slice(0, 15)]);
};

export const getPerformanceData = () => PERFORMANCE_CHART_DATA;
export const getRevenueData = () => REVENUE_CHART_DATA;

export const getCustomers = () => {
  const leads = getLeads();
  return leads.filter(l => l.stage === "Won");
};
