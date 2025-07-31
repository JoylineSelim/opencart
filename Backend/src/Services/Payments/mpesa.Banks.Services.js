import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import logger from '../../utils/logger.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });




class MpesaService {
    constructor (){
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET
        this.businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE
        this.passkey = process.env.MPESA_PASSKEY
        this.baseURL= process.env.MPESA_BASE_URL
        this.initiatorName = process.env.MPESA_INITIATOR_NAME
        this.securityCredential = process.env.MPESA_SECURITY_CREDENTIAL
        this.resultURL = process.env.MPESA_RESULT_URL
        this.queueTimeoutURL = process.env.MPESA_QUEUE_TIMEOUT_URL
        this.bankB2BShortCode = process.env.BANK_B2B_SHORTCODE
        this.bankB2CShortCode = process.env.BANK_B2C_SHORTCODE




    }

async getAccessToken() {
  const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
  console.log('Encoded Auth Header:', auth);
  console.log('Key:', this.consumerKey);
 console.log('Secret:', this.consumerSecret);

  try {
    const response = await axios.get(
      `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    logger.error('Failed to obtain access token', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}


generatePassword(){
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,-3)
    const password = Buffer.from(this.businessShortCode + this.passkey + timestamp).toString('base64')
    return {password,timestamp}
}

//initiate STKPush
async initiateSTKPush(phone,amount,accountReference,transactionDesc){
    const accessTokem = await this.getAccessToken()
    const {password,timestamp} = this.generatePassword()

    const requestBody = {
      BusinessShortCode: this.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: this.businessShortCode,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    }
    try {
        const response = await axios.post(`${this.baseURL}/mpesa/stkpush/v1/processrequest`,requestBody,{
            headers:{
                'Authorization':`Bearer ${accessTokem}`,
                'Content-Type':'application/json'
            }
        })
         logger.info('STK Initalized successfully')
        return response.data
    } catch (error) {
      console.error('STK Push error:', error.response?.data || error.message);
      throw new Error('STK Push Failed');
        
        
    }
}
 // NEW: B2C - Send money to bank account (Credit)
  async sendToBank(accountNumber, amount, bankCode, accountName, remarks) {
    const accessToken = await this.getAccessToken();
    
    const requestBody = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: this.businessShortCode,
      PartyB: accountNumber,
      Remarks: remarks,
      QueueTimeOutURL: this.queueTimeoutURL,
      ResultURL: this.resultURL,
      Occasion: `Payment to ${accountName}`,
      AccountReference: accountNumber,
      // Additional fields for bank transfer
      ReceiverIdentifierType: '4', // 4 for bank account
      BankCode: bankCode
    };

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/b2c/v1/paymentrequest`, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Bank transfer failed: ' + error.response?.data?.errorMessage || error.message);
    }
  }
 // NEW: B2B - Collect money from bank account (Debit)
  async collectFromBank(accountNumber, amount, bankCode, accountName, remarks) {
    const accessToken = await this.getAccessToken();
    
    const requestBody = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'BusinessPayBill',
      Amount: amount,
      PartyA: accountNumber,
      PartyB: this.businessShortCode,
      Remarks: remarks,
      QueueTimeOutURL: this.queueTimeoutURL,
      ResultURL: this.resultURL,
      AccountReference: accountNumber,
      // Additional fields for bank debit
      SenderIdentifierType: '4', // 4 for bank account
      BankCode: bankCode,
      Requester: accountName
    };

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/b2b/v1/paymentrequest`, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Bank debit failed: ' + error.response?.data?.errorMessage || error.message);
    }
  }

  // NEW: Account balance inquiry
  async checkAccountBalance(accountType = 'BusinessPayBill') {
    const accessToken = await this.getAccessToken();
    
    const requestBody = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'AccountBalance',
      PartyA: this.businessShortCode,
      IdentifierType: '4',
      Remarks: 'Balance inquiry',
      QueueTimeOutURL: this.queueTimeoutURL,
      ResultURL: this.resultURL
    };

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/accountbalance/v1/query`, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Balance inquiry failed: ' + error.response?.data?.errorMessage || error.message);
    }
  }

  // NEW: Transaction status query
  async queryTransactionStatus(transactionID, occasionRef) {
    const accessToken = await this.getAccessToken();
    
    const requestBody = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'TransactionStatusQuery',
      TransactionID: transactionID,
      PartyA: this.businessShortCode,
      IdentifierType: '4',
      ResultURL: this.resultURL,
      QueueTimeOutURL: this.queueTimeoutURL,
      Remarks: 'Transaction status query',
      Occasion: occasionRef,
      CheckoutRequestID: checkoutRequestID
    };

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/transactionstatus/v1/query`, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Transaction status query failed: ' + error.response?.data?.errorMessage || error.message);
    }
  }

  async queryTransactionStatusMPESA(checkoutRequestID) {
  const token = await this.getAccessToken();

  const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
  const body = {
    BusinessShortCode: this.businessShortCode,
    Password: this.generatePassword().password,
    Timestamp: this.generatePassword().timestamp,
    CheckoutRequestID: checkoutRequestID
  };

  const res = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
}

  // NEW: Reverse transaction
  async reverseTransaction(transactionID, amount, remarks) {
    const accessToken = await this.getAccessToken();
    
    const requestBody = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'TransactionReversal',
      TransactionID: transactionID,
      Amount: amount,
      ReceiverParty: this.businessShortCode,
      RecieverIdentifierType: '4',
      ResultURL: this.resultURL,
      QueueTimeOutURL: this.queueTimeoutURL,
      Remarks: remarks,
      Occasion: 'Transaction reversal'
    };

    try {
      const response = await axios.post(`${this.baseURL}/mpesa/reversal/v1/request`, requestBody, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Transaction reversal failed: ' + error.response?.data?.errorMessage || error.message);
    }
  }
}

export default new MpesaService