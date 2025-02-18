import * as authService from '../../src/service/authService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../src/models/user';

// Mock các module bên ngoài
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');  // Mock model User
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: jest.fn(),
            connect: jest.fn(),
        };
    });
});

describe('authService.login()', () => {
    let mockUser;

    beforeEach(() => {
        mockUser = {
            _id: '67af13e2bbfdc7e23fc77240',
            email: 'tunade170244@fpt.edu.vn',
            password: 'tunade170244@fpt.edu.vn',
            status: 'active',
            roles: [{ roleName: 'carowner' }]
        };
    });

    afterEach(() => {
        jest.clearAllMocks();  // Dọn dẹp mock sau mỗi test case
    });

    it('should throw error when email is empty', async () => {
        await expect(authService.login('', 'password123'))
            .rejects
            .toThrow('Email không được để trống');
    });

    it('should throw error when email format is invalid', async () => {
        await expect(authService.login('invalidemail', 'password123'))
            .rejects
            .toThrow('Email không đúng định dạng');
    });

    it('should throw error when password is empty for non-Google login', async () => {
        await expect(authService.login('test@example.com', ''))
            .rejects
            .toThrow('Mật khẩu không được để trống');
    });

    it('should throw error when password length is less than 6 characters', async () => {
        await expect(authService.login('test@example.com', '12345'))
            .rejects
            .toThrow('Mật khẩu phải từ 6-50 ký tự');
    });

    it('should throw an error if user not found', async () => {
        // Mock User.findOne trả về null (không tìm thấy user)
        User.findOne.mockResolvedValue(null);

        await expect(authService.login('test@example.com', 'password123'))
            .rejects
            .toThrow('Invalid email or password');
    });

    it('should throw an error if password does not match', async () => {
        // Mock User.findOne trả về user
        User.findOne.mockResolvedValue(mockUser);

        // Mock bcrypt.compare trả về false (mật khẩu không đúng)
        bcrypt.compare.mockResolvedValue(false);

        await expect(authService.login('test@example.com', 'wrongPassword'))
            .rejects
            .toThrow('Invalid email or password');
    });

    it('should throw an error if user status is not active', async () => {
        // Mock User.findOne trả về user nhưng với status không phải "active"
        const inactiveUser = { ...mockUser, status: 'inactive' };
        User.findOne.mockResolvedValue(inactiveUser);

        await expect(authService.login('test@example.com', 'password123'))
            .rejects
            .toThrow('Account is not active');
    });

    it('should return token when login is successful', async () => {
        // Mock User.findOne trả về user hợp lệ
        User.findOne.mockResolvedValue(mockUser);

        // Mock bcrypt.compare trả về true (mật khẩu đúng)
        bcrypt.compare.mockResolvedValue(true);

        // Mock jwt.sign để tạo token
        jwt.sign.mockReturnValue('mocked_jwt_token');

        const result = await authService.login('tunade170244@fpt.edu.vn', 'tunade170244@fpt.edu.vn');

        expect(result).toEqual({ token: 'mocked_jwt_token' });  // Kiểm tra kết quả trả về
        expect(User.findOne).toHaveBeenCalledWith({ email: 'tunade170244@fpt.edu.vn' });  // Kiểm tra findOne có gọi đúng không
        expect(bcrypt.compare).toHaveBeenCalledWith('tunade170244@fpt.edu.vn', mockUser.password);  // Kiểm tra so sánh mật khẩu có đúng không
        expect(jwt.sign).toHaveBeenCalledWith(
            { 
                id: mockUser._id, 
                email: mockUser.email, 
                roles: mockUser.roles.map(role => role.roleName) 
            },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '1h' }
        );
    });
});
