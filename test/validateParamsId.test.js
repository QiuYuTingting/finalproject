import { validateParamsId } from '../middlewares/validateParamsId.js';
import { ObjectId } from 'mongodb';

describe('validateParamsId 中间件', () => {
  let ctx;
  let next;

  beforeEach(() => {
    ctx = {
      params: {},
      status: 200,
      body: {},
    };
    next = jest.fn();
  });

  test('通过有效的 MongoDB ObjectId', async () => {
    const validId = '507f1f77bcf86cd799439011';
    ctx.params.id = validId;

    const middleware = validateParamsId();
    await middleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.status).toBe(200);
  });

  test('拒绝无效的 MongoDB ObjectId', async () => {
    const invalidId = 'invalid-id';
    ctx.params.id = invalidId;

    const middleware = validateParamsId();
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(400);
    expect(ctx.body.msg).toBe('无效的 id 格式');
  });

  test('支持自定义 id 属性名', async () => {
    const invalidId = 'invalid-id';
    ctx.params.user_id = invalidId;

    const middleware = validateParamsId('user_id');
    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(400);
    expect(ctx.body.msg).toBe('无效的 user_id 格式');
  });
});
