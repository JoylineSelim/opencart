import mongoose from 'mongoose'

const MPESATransactionsSchema = new mongoose.Schema({
  checkoutRequestID: { type: String, required: true, unique: true },
  merchantRequestID: { type: String, required: true },
  amount: { type: Number, required: true },
  phone: { type: String, required: true },
  accountReference: { type: String, required: true },
  status: { type: String, enum: ['successful','failed','pending'], default: 'pending', set: v => (v || '').toLowerCase()},
  mpesaReceiptNumber: String,
  transactionDate: Date,
  transactionDesc: String,
  createdAt: { type: Date, default: Date.now }
})

const MPESATransaction = mongoose.model('MPESATransaction',MPESATransactionsSchema)
export default MPESATransaction