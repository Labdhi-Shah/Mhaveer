const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mhaveer').then(async () => {
  const Employee = require('./models/Employee');
  const Lead = require('./models/Lead');
  
  const gita = await Employee.findOne({ name: /Gita/i });
  console.log('Gita:', gita ? gita._id : 'Not found');
  if (gita) {
    const leads = await Lead.find({ 
      $or: [
        { employeeId: String(gita._id) },
        { teamLeaderId: String(gita._id) }
      ]
    });
    console.log('Gita leads count by ID:', leads.length);
    
    // Also try human readable ID
    const leadsByHumanId = await Lead.find({ 
      $or: [
        { employeeId: gita.employeeId },
        { teamLeaderId: gita.employeeId }
      ]
    });
    console.log('Gita leads count by human ID:', leadsByHumanId.length);
  }
  process.exit(0);
});
