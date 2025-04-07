import { corsForDevelopment } from '../middlewares/corsForDevelopment.js';

describe('corsForDevelopment 中间件', () => {
  let ctx;
  let next;
  const originalEnv = process.env;

  beforeEach(() => {
    ctx = {
      set: jest.fn(),
      method: 'GET',
      status: 200,
    };
    next = jest.fn();
    process.env = {
      ...originalEnv,
      CORS_ORIGIN: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('在生产环境中应该返回空中间件', async () => {
    process.env.NODE_ENV = 'production';
    const middleware = corsForDevelopment();
    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.set).not.toHaveBeenCalled();
  });

  test('在开发环境中应该设置 CORS 头', async () => {
    process.env.NODE_ENV = 'development';
    const middleware = corsForDevelopment();
    await middleware(ctx, next);

    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Methods', 
      'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Max-Age', '86400');
    expect(ctx.set).toHaveBeenCalledWith('Access-Control-Allow-Headers', 
      'Content-Type, Authorization');
    expect(next).toHaveBeenCalled();
  });

  test('在开发环境中应该正确处理 OPTIONS 请求', async () => {
    process.env.NODE_ENV = 'development';
    ctx.method = 'OPTIONS';
    
    const middleware = corsForDevelopment();
    await middleware(ctx, next);

    expect(ctx.status).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });
});
