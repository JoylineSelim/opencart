import MPESA from '../../models/PaymentModels/mpesa.model.js'
import MpesaServices from '../../Services/Payments/mpesa.Banks.Services.js'



const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  return (phone = phone.replace(/\s+/g, '') && phone.startsWith('254') ? phone : `254${phone.replace(/^0/, '')}`);
};


export const initiateSTK = async (req,res) =>{
    try {
        const {phone,amount,accountReference,transactionDesc} = req.body;
        if(!phone || !amount || !accountReference ){
            return res.status(400).json({message:"Please input all required fields"})
        }
        if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
        }

        
        const formattedPhoneNo = formatPhoneNumber(phone)
        if (!/^2547\d{8}$/.test(formattedPhoneNo)) {
        return res.status(400).json({ message: "Invalid phone number format. Use Kenyan format e.g. 2547XXXXXXXX." });
        }
        const response = await MpesaServices.initiateSTKPush(
            formattedPhoneNo,
            amount,
            accountReference,
            transactionDesc
        )
         await MPESA.create({
            phone: formattedPhoneNo,
            amount,
            accountReference,
            transactionDesc,
            status: 'Pending',
            merchantRequestID: response.MerchantRequestID,
            checkoutRequestID: response.CheckoutRequestID,
            responseData: response
            });
        return res.status(200).json({message:"STK Initialized successfully", data:{
            checkoutRequestID: response.CheckoutRequestID,
            merchantRequestID: response.MerchantRequestID
        }})

    } catch (error) {
        console.error('STK Init Error:', error.message);
       return  res.status(500).json({message:'Error in initializing the STK',error:error.message})
    }
}

export const paymentStatus = async (req,res) =>{
    try {
        const {checkoutRequestID} = req.body
        if (!checkoutRequestID) return res.status(400).json({message:'CheckoutRequestID is required'})
        const response = await MpesaServices.queryTransactionStatusMPESA(checkoutRequestID)
        await MPESA.findOneAndUpdate(
        { checkoutRequestID },
        { $set: { status: 'Queried', lastQueryResponse: response } }

        );
        return res.status(200).json({message:"Status confrimed",data:response})

    } catch (error) {
        console.error('Payment Status Error:', error);
        return res.status(500).json({message:"Could not recover Status",error:error.message})
    }
}

export const mpesaCallback = async (req,res) =>{
    try {
    const { Body } = req.body;

    if (!Body?.stkCallback) {
      return res.status(400).json({ message: 'Invalid callback structure.' });
    }

    const callback = Body.stkCallback;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    // Find transaction in DB
    const transaction = await MPESA.findOne({ checkoutRequestID: CheckoutRequestID });

    if (!transaction) {
      console.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction status
    transaction.status = ResultCode === 0 ? 'completed' : 'failed';
    transaction.resultDesc = ResultDesc;
    transaction.resultCode = ResultCode;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // Convert metadata array into a simple key-value map
      const metadata = {};
      CallbackMetadata.Item.forEach(item => {
        metadata[item.Name] = item.Value;
      });

      // Update transaction with M-Pesa metadata
      transaction.mpesaReceiptNumber = metadata.MpesaReceiptNumber || '';
      transaction.transactionDate = metadata.TransactionDate || '';
      transaction.amountPaid = metadata.Amount || 0;
      transaction.payerPhone = metadata.PhoneNumber || transaction.phone;
    }

    await transaction.save();

    console.log('M-Pesa callback processed for:', CheckoutRequestID);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully',
      data:transaction
    });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal Server Error'
    });
  }
}


