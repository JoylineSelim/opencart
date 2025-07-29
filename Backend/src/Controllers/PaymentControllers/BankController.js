import BankService from '../../Services/Payments/mpesa.Banks.Services.js'
import BankTransaction from '../../models/PaymentModels/bank.model.js'
import { initiateSTK } from './MPESAController.js'



const BANK_CODES = {
    'KCB': '01',
  'EQUITY': '68',
  'COOP': '31',
  'ABSA': '03',
  'STANDARD': '02',
  'DTBK': '49',
  'FAMILY': '70',
  'NCBA': '07',
  'PRIME': '10',
  'HOUSING': '61'
}

export const sendMoney_Credit = async (req,res) => {
    try{
         const { accountNumber, amount, bankCode, accountName, remarks } = req.body;

        if(!accountNumber ||!amount ||!bankCode || !accountName) return res.status(400).json({message:"Input all required fields"})
        if (!accountNumber || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid account number or amount" });
        }

        if (!BANK_CODES[bankCode.toUpperCase()]) {
        return res.status(400).json({
            success: false,
            message: 'Invalid bank code'
        });
        }

        const response = await BankService.sendToBank(
        accountNumber,
        amount,
        BANK_CODES[bankCode.toUpperCase()],
        accountName,
        remarks
        );

        const transaction = new BankTransaction({
        conversationID: response.ConversationID,
        originatorConversationID: response.OriginatorConversationID,
        transactionType: 'credit',
        amount,
        accountNumber,
        bankCode: bankCode.toUpperCase(),
        accountName,
        remarks,
        status: 'pending'
        });

        await transaction.save();

        res.json({
        success: true,
        message: 'Bank credit initiated successfully',
        data: response
        });
    } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
    }
}

export const collectMoney_Debit = async (req,res) =>{
    try {
    const { accountNumber, amount, bankCode, accountName, remarks } = req.body;

    if(!accountNumber ||!amount ||!bankCode || !accountName) return res.status(400).json({message:"Input all required fields"})
    if (!accountNumber || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid account number or amount" });
    }

    if (!BANK_CODES[bankCode.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bank code'
      });
    }

    const response = await BankService.collectFromBank(
      accountNumber,
      amount,
      BANK_CODES[bankCode.toUpperCase()],
      accountName,
      remarks
    );

    // Save transaction to database
    const transaction = new BankTransaction({
      conversationID: response.ConversationID,
      originatorConversationID: response.OriginatorConversationID,
      transactionType: 'debit',
      amount,
      accountNumber,
      bankCode: bankCode.toUpperCase(),
      accountName,
      remarks,
      status: 'pending'
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Bank debit initiated successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
    }
}
export const queryTransactionStatus =  async (req, res) => {
  try {
    const { transactionID, occasionRef } = req.body;
    const response = await BankService.queryTransactionStatus(transactionID, occasionRef);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NEW: Reverse transaction
export const reverseTransaction = async (req, res) => {
  try {
    const { transactionID, amount, remarks } = req.body;
    if (!accountNumber || !amount || isNaN(amount) || amount <= 0) {
     return res.status(400).json({ message: "Invalid account number or amount" });
    }

    const response = await BankService.reverseTransaction(transactionID, amount, remarks);
    
    res.json({
      success: true,
      message: 'Transaction reversal initiated',
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NEW: Result callback for bank transactions
export const resultCallback = async (req, res) => {
  try {
    const { Result } = req.body;
    
    if (Result) {
      const { ConversationID, ResultCode, ResultDesc } = Result;
      
      // Find and update bank transaction
      const transaction = await BankTransaction.findOne({ conversationID: ConversationID });
      
      if (transaction) {
        transaction.status = ResultCode === 0 ? 'completed' : 'failed';
        transaction.resultDesc = ResultDesc;
        
        if (ResultCode === 0 && Result.ResultParameters) {
          const parameters = Result.ResultParameters.ResultParameter;
          const receiptNumber = parameters.find(param => param.Key === 'TransactionReceipt')?.Value;
          const transactionDate = parameters.find(param => param.Key === 'TransactionCompletedDateTime')?.Value;
          
          transaction.mpesaReceiptNumber = receiptNumber;
          transaction.transactionDate = new Date(transactionDate);
        }
        
        await transaction.save();
        
        // You can add webhook notifications here
        console.log('Bank transaction result:', Result);
      }
    }
    
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Result callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Error' });
  }
};

// NEW: Timeout callback
export const timeout = (req, res) => {
  console.log('Transaction timeout:', req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
};

// NEW: Get available banks
export const banks = (req, res) => {
  const banks = Object.keys(BANK_CODES).map(code => ({
    code,
    name: getBankName(code),
    value: BANK_CODES[code]
  }));
  
  res.json({
    success: true,
    data: banks
  });
};

function getBankName(code) {
  const names = {
    'KCB': 'Kenya Commercial Bank',
    'EQUITY': 'Equity Bank',
    'COOP': 'Co-operative Bank',
    'ABSA': 'Absa Bank Kenya',
    'STANDARD': 'Standard Chartered Bank',
    'DTBK': 'Diamond Trust Bank',
    'FAMILY': 'Family Bank',
    'NCBA': 'NCBA Bank',
    'PRIME': 'Prime Bank',
    'HOUSING': 'Housing Finance'
  };
  return names[code] || code;
}

