import { authorizeByCookie } from '../middlewares/authorizeByCookie.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

jest.mock('jsonwebtoken');

describe('authorizeByCookie 中间件', () => {
  let ctx;
  let next;

  beforeEach(() => {
    ctx = {
      cookies: {
        get: jest.fn(),
      },
      state: {},
      status: 200,
      redirect: jest.fn(),
    };
    next = jest.fn();
    process.env.JWT_SECRET_KEY = 'test-secret';
  });

  test('正确解析有效的 cookie token', async () => {
    const token = 'valid.token.here';
    const decodedToken = {
      name: 'test',
      id: '507f1f77bcf86cd799439011',
    };
    
    ctx.cookies.get.mockReturnValue(token);
    jwt.verify.mockReturnValue(decodedToken);

    const middleware = authorizeByCookie();
    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.state.currentUser).toEqual({
      ...decodedToken,
      _id: expect.any(ObjectId)
    });
  });

  test('当 token 无效时应该重定向到登录页面', async () => {
    ctx.cookies.get.mockReturnValue('invalid.token');
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const middleware = authorizeByCookie();
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(302);
    expect(ctx.redirect).toHaveBeenCalledWith('/login');
  });

  test('当 cookie 不存在时应该重定向到登录页面', async () => {
    ctx.cookies.get.mockReturnValue(null);

    const middleware = authorizeByCookie();
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(302);
    expect(ctx.redirect).toHaveBeenCalledWith('/login');
  });
});
