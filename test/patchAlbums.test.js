import { ObjectId } from 'mongodb';
import patchAlbums from '../routers/patchAlbums.js';
import { db } from '../db.js';
import { validatePatchData } from '../utils/validatePatchData.js';

// 模拟数据库连接
jest.mock('../db.js', () => ({
  db: {
    collection: jest.fn().mockReturnValue({
      updateMany: jest.fn()
    })
  }
}));

// 模拟validatePatchData函数
jest.mock('../utils/validatePatchData.js', () => ({
  validatePatchData: jest.fn()
}));

describe('patchAlbums中间件测试', () => {
  let ctx;
  let next;
  let userId;
  let albumIds;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    userId = new ObjectId();
    albumIds = [new ObjectId(), new ObjectId()];

    // 设置ctx对象
    ctx = {
      request: {
        body: {
          ids: albumIds.map(id => id.toString()),
          updates: {}
        }
      },
      state: {
        currentUser: {
          _id: userId
        }
      },
      status: null,
      body: null
    };

    next = jest.fn();
  });

  // 测试成功更新相册名称
  test('成功更新相册名称', async () => {
    const newName = '新相册名称';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    // 模拟validatePatchData返回
    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: albumIds
    });

    // 模拟数据库更新结果
    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchAlbums(ctx, next);

    // 验证validatePatchData调用
    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    // 验证数据库更新
    expect(db.collection).toHaveBeenCalledWith('albums');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: albumIds },
        user_id: userId
      },
      { $set: { name: newName } }
    );

    // 验证响应
    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试名称长度验证
  test('名称长度超过64个字符应该返回400错误', async () => {
    const longName = 'a'.repeat(65);
    const validationError = new Error('相册名至少1个字符，最多不超过64个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { name: longName };

    await patchAlbums(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试空名称
  test('空名称应该返回400错误', async () => {
    const emptyName = '';
    const validationError = new Error('相册名至少1个字符，最多不超过64个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { name: emptyName };

    await patchAlbums(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试无效的相册ID
  test('无效的相册ID应该返回400错误', async () => {
    const validationError = new Error('存在格式不合法的 id');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.ids = ['invalid-id'];

    await patchAlbums(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试部分相册更新成功
  test('部分相册更新成功的情况', async () => {
    const newName = '新相册名称';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 1 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: albumIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchAlbums(ctx, next);

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });
});
