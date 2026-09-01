const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const Customer = require('./models/Customer');
const Meeting = require('./models/Meeting');
const Lead = require('./models/Lead');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const customers = await Customer.find({ loanAmount: { $in: [0, null, undefined] } });
    console.log(`Found ${customers.length} customers with 0 or missing loanAmount`);

    let updatedCount = 0;
    for (const customer of customers) {
      if (customer.meetingId) {
        const meeting = await Meeting.findById(customer.meetingId);
        if (meeting && meeting.leadId) {
          const lead = await Lead.findById(meeting.leadId);
          if (lead && lead.loanAmount) {
            customer.loanAmount = lead.loanAmount;
            await customer.save();
            updatedCount++;
            console.log(`Updated customer ${customer.fullName} with loanAmount: ${lead.loanAmount}`);
          }
        }
      }
    }
    
    console.log(`Successfully backfilled loanAmount for ${updatedCount} customers.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
