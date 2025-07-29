import {jest} from '@jest/globals'
const mockAxios ={
  get:jest.fn(),
  post:jest.fn()
} 
jest.unstable_mockModule('axios', () => ({
  default: mockAxios
    
}));
const{default:axios} = await import('axios')
const {default: MpesaService} = await import('../Services/Payments/mpesa.Banks.Services.js')



describe('MpesaService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAccessToken - should return access token', async () => {
    const mockToken = 'mocked_token';
    axios.get.mockResolvedValue({ data: { access_token: mockToken } });

    const token = await MpesaService.getAccessToken();
    expect(token).toBe(mockToken);
    expect(axios.get).toHaveBeenCalled();
  });

  test('initiateSTK - should initiate stk push', async () => {
    const mockResponse = {
      MerchantRequestID: '123',
      CheckoutRequestID: '456',
      ResponseCode: '0',
    };

    axios.post.mockResolvedValue({ data: mockResponse });
    MpesaService.getAccessToken = jest.fn().mockResolvedValue('mock_token');
    MpesaService.generatePassword = jest.fn().mockReturnValue({
      password: 'encoded_pass',
      timestamp: '20250714083000',
    });

    const result = await MpesaService.initiateSTKPush('254712345678', 100, 'Ref123', 'Test');

    expect(result).toEqual(mockResponse);
    expect(axios.post).toHaveBeenCalled();
  });

  test('checkAccountBalance - should return balance info', async () => {
    const mockBalance = { Result: { Balance: 1000 } };
    axios.post.mockResolvedValue({ data: mockBalance });
    MpesaService.getAccessToken = jest.fn().mockResolvedValue('mock_token');

    const res = await MpesaService.checkAccountBalance();
    expect(res).toEqual(mockBalance);
  });

  test('queryTransactionStatus(MPESA) - should return status', async () => {
    const mockStatus = { ResponseCode: '0', ResultDesc: 'Success' };
    axios.post.mockResolvedValue({ data: mockStatus });
    MpesaService.getAccessToken = jest.fn().mockResolvedValue('mock_token');

    const res = await MpesaService.queryTransactionStatusMPESA('Trans123', 'Occ123');
    expect(res).toEqual(mockStatus);
  });

  test('reverseTransaction - should send reversal request', async () => {
    const mockResponse = { ResponseCode: '0', ResponseDescription: 'Accepted' };
    axios.post.mockResolvedValue({ data: mockResponse });
    MpesaService.getAccessToken = jest.fn().mockResolvedValue('mock_token');

    const res = await MpesaService.reverseTransaction('TX123', 500, 'Test reversal');
    expect(res).toEqual(mockResponse);
  });
});
