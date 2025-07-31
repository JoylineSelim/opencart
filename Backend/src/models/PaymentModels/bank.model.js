import mongoose from "mongoose";
const bankTransactionSchema = new mongoose.Schema({
  conversationID: { type: String, required: true, unique: true },
  originatorConversationID: { type: String, required: true },
  transactionType: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  accountNumber: { type: String, required: true },
  bankCode: { type: String, required: true },
  accountName: { type: String, required: true },
  status: { type: String, enum: ['Successful','Failed','Pending'], default: 'Pending' },
  mpesaReceiptNumber: String,
  transactionDate: Date,
  resultDesc: String,
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

const BankTransaction = mongoose.model('BankTransaction',bankTransactionSchema)
export default BankTransaction