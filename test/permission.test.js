import { permission } from '../middlewares/permission.js';

describe('permission 中间件', () => {
  let ctx;
  let next;

  beforeEach(() => {
    // 为每个测试用例设置初始上下文
    console.log('初始化测试环境');
    ctx = {
      state: {},
      status: 200,
      body: {},
    };
    next = jest.fn();
  });

  describe('管理员权限测试', () => {
    test('场景1：管理员访问 admin-only 路由', async () => {
      // 准备测试数据
      console.log('测试管理员访问权限');
      ctx.state.currentUser = { is_admin: true };
      const middleware = permission('admin-only');
      
      // 执行测试
      await middleware(ctx, next);
      
      // 验证结果
      expect(next).toHaveBeenCalled();
      expect(ctx.status).toBe(200);
    });

    test('场景2：非管理员访问 admin-only 路由', async () => {
      console.log('测试非管理员访问限制');
      ctx.state.currentUser = { is_admin: false };
      const middleware = permission('admin-only');
      
      await middleware(ctx, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(ctx.status).toBe(403);
      expect(ctx.body).toEqual({
        msg: '您无权访问当前资源！'
      });
    });
  });

  describe('公共路由测试', () => {
    test('场景3：普通用户访问公共路由', async () => {
      console.log('测试公共路由访问');
      ctx.state.currentUser = { is_admin: false };
      const middleware = permission('public');
      
      await middleware(ctx, next);
      
      expect(next).toHaveBeenCalled();
      expect(ctx.status).toBe(200);
    });
  });
});