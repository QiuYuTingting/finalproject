import { authorize } from '../middlewares/authorize.js';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

jest.mock('jsonwebtoken');

describe('authorize 中间件', () => {
  let ctx;
  let next;

  beforeEach(() => {
    ctx = {
      headers: {},
      state: {},
      status: 200,
      body: {},
    };
    next = jest.fn();
    process.env.JWT_SECRET_KEY = 'test-secret';
  });

  test('正确解析有效的 token', async () => {
    const token = 'valid.token.here';
    const decodedToken = {
      name: 'test',
      id: '507f1f77bcf86cd799439011',
      is_admin: true
    };
    
    ctx.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue(decodedToken);

    const middleware = authorize();
    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.state.currentUser).toEqual({
      ...decodedToken,
      _id: expect.any(ObjectId)
    });
  });

  test('处理无效的 token', async () => {
    ctx.headers.authorization = 'Bearer invalid.token';
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const middleware = authorize();
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(401);
    expect(ctx.body.msg).toBe('未授权！');
  });

  test('处理缺失的 authorization header', async () => {
    const middleware = authorize();
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(401);
    expect(ctx.body.msg).toBe('未授权！');
  });
});