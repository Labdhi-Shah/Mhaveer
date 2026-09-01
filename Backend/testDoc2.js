require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const custs = await Customer.find({ "documents.aadhaar": { $exists: true } }).limit(2).select('documents');
  console.log(JSON.stringify(custs, null, 2));
  process.exit();
});
