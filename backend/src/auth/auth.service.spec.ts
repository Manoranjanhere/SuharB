import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  } as any;
  const otpRepository = {
    update: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    findOne: jest.fn(),
  } as any;
  const banRepository = { findOne: jest.fn() } as any;
  const resetRepository = { findOne: jest.fn(), save: jest.fn() } as any;
  const jwtService = { sign: jest.fn(() => 'jwt-token') } as any;
  const mailService = { sendNewUserAlertToAdmins: jest.fn() } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    banRepository.findOne.mockResolvedValue(null);
    service = new AuthService(
      userRepository,
      otpRepository,
      banRepository,
      resetRepository,
      jwtService,
      mailService,
    );
  });

  it('sends OTP in development mode without Twilio call', async () => {
    process.env.NODE_ENV = 'development';
    const result = await service.sendWhatsAppOtp({ phone: '+919999999999' });

    expect(result).toEqual({ message: 'OTP sent via WhatsApp' });
    expect(otpRepository.update).toHaveBeenCalled();
    expect(otpRepository.save).toHaveBeenCalled();
  });
});
