import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || "https://mhaveer.onrender.com";
const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
  baseURL: `${cleanBaseURL}/api`,
  withCredentials: true,
});

// Mock Database Initialization
const initLeads = () => {
  const stored = localStorage.getItem("crm_leads");
  if (!stored) {
    const defaultLeads = [
      {
        _id: "lead_1",
        leadId: "LD-1001",
        companyName: "Acme Corporates",
        contactPerson: "Jane Smith",
        phone: "9876543210",
        city: "Mumbai",
        state: "Maharashtra",
        yearlyIncome: 1200000,
        loanAmount: 5000000,
        loanType: "Business Loan",
        cibilScore: 780,
        interested: "Yes",
        callStatus: "Connected",
        meetingDate: new Date().toISOString().split("T")[0], // Today's meeting
        meetingTime: "11:00",
        remarks: "Highly interested in commercial loan. documents pending.",
        createdAt: new Date().toISOString()
      },
      {
        _id: "lead_2",
        leadId: "LD-1002",
        companyName: "Hindustan Traders",
        contactPerson: "Rajesh Kumar",
        phone: "8765432109",
        city: "Ahmedabad",
        state: "Gujarat",
        yearlyIncome: 800000,
        loanAmount: 2000000,
        loanType: "Home Loan",
        cibilScore: 720,
        interested: "Call Back Later",
        callStatus: "Busy",
        followUpDate: new Date().toISOString().split("T")[0], // Today's follow-up
        followUpTime: "16:00",
        remarks: "Asked to call back tomorrow afternoon.",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        _id: "lead_3",
        leadId: "LD-1003",
        companyName: "Techno Solutions",
        contactPerson: "Amit Patel",
        phone: "7654321098",
        city: "Surat",
        state: "Gujarat",
        yearlyIncome: 1500000,
        loanAmount: 1000000,
        loanType: "Car Loan",
        cibilScore: 640,
        interested: "No",
        callStatus: "Connected",
        remarks: "CIBIL score too low, rejected.",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    localStorage.setItem("crm_leads", JSON.stringify(defaultLeads));
  }
};

// Interceptor to attach JWT token to headers automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Custom Mock Adapter to intercept specific requests
const originalAdapter = axios.defaults.adapter || (async (config) => {
  // Fallback if defaults.adapter is undefined in newer Axios versions
  const { xhrAdapter } = await import('axios');
  return xhrAdapter ? xhrAdapter(config) : Promise.reject(new Error("No adapter"));
});

api.defaults.adapter = async (config) => {
  const url = config.url || "";
  
  if (url.includes("/leads") || url.includes("/auth/change-password")) {
    initLeads();
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    let leads = JSON.parse(localStorage.getItem("crm_leads") || "[]");

    // 1. GET /leads/stats
    if (url.includes("/leads/stats") && config.method === "get") {
      const today = new Date().toISOString().split("T")[0];
      const todayCalls = leads.filter(l => l.createdAt.startsWith(today)).length;
      const interestedLeads = leads.filter(l => l.interested === "Yes").length;
      const pendingFollowups = leads.filter(l => l.interested === "Call Back Later").length;
      const todayMeetings = leads.filter(l => l.meetingDate === today).length;

      return {
        data: {
          success: true,
          data: { todayCalls, interestedLeads, pendingFollowups, todayMeetings }
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 2. GET /leads (with search, filter, pagination)
    if (url.includes("/leads") && config.method === "get") {
      // Parse query params
      const parsedUrl = new URL(url, "https://mhaveer.onrender.com");
      const search = parsedUrl.searchParams.get("search")?.toLowerCase() || "";
      const loanType = parsedUrl.searchParams.get("loanType") || "";
      const interested = parsedUrl.searchParams.get("interested") || "";
      const page = parseInt(parsedUrl.searchParams.get("page") || "1");
      const limit = parseInt(parsedUrl.searchParams.get("limit") || "10");

      let filtered = [...leads];

      if (search) {
        filtered = filtered.filter(
          l => l.companyName.toLowerCase().includes(search) || 
               l.contactPerson.toLowerCase().includes(search) ||
               l.leadId.toLowerCase().includes(search)
        );
      }

      if (loanType) {
        filtered = filtered.filter(l => l.loanType === loanType);
      }

      if (interested) {
        filtered = filtered.filter(l => l.interested === interested);
      }

      // Sort: descending by default
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Paginate
      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);
      const pages = Math.ceil(total / limit);

      return {
        data: {
          success: true,
          data: paginated,
          pages: pages || 1,
          total
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 3. POST /leads
    if (url.includes("/leads") && config.method === "post") {
      const body = JSON.parse(config.data);
      
      // Generate unique sequential lead id
      const leadNums = leads.map(l => parseInt(l.leadId.split("-")[1]) || 1000);
      const nextNum = Math.max(...leadNums, 1000) + 1;
      
      const newLead = {
        _id: `lead_${Date.now()}`,
        leadId: `LD-${nextNum}`,
        ...body,
        createdAt: new Date().toISOString()
      };

      leads.push(newLead);
      localStorage.setItem("crm_leads", JSON.stringify(leads));

      return {
        data: { success: true, data: newLead },
        status: 201,
        statusText: "Created",
        headers: {},
        config
      };
    }

    // 4. PUT /leads/:id
    if (url.includes("/leads/") && config.method === "put") {
      const match = url.match(/\/leads\/([^?]+)/);
      const leadId = match ? match[1] : null;
      const body = JSON.parse(config.data);

      if (leadId) {
        leads = leads.map(l => (l._id === leadId ? { ...l, ...body } : l));
        localStorage.setItem("crm_leads", JSON.stringify(leads));
      }

      return {
        data: { success: true, data: body },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 5. DELETE /leads/:id
    if (url.includes("/leads/") && config.method === "delete") {
      const match = url.match(/\/leads\/([^?]+)/);
      const leadId = match ? match[1] : null;

      if (leadId) {
        leads = leads.filter(l => l._id !== leadId);
        localStorage.setItem("crm_leads", JSON.stringify(leads));
      }

      return {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }

    // 6. POST /auth/change-password
    if (url.includes("/auth/change-password") && config.method === "post") {
      return {
        data: { success: true, message: "Password updated successfully!" },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    }
  }

  // Delegate other routes (like real server auth/employees) to the default adapter
  return originalAdapter(config);
};

export default api;