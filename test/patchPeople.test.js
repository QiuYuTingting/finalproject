import { ObjectId } from 'mongodb';
import patchPeople from '../routers/patchPeople.js';
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

describe('patchPeople中间件测试', () => {
  let ctx;
  let next;
  let userId;
  let peopleIds;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    userId = new ObjectId();
    peopleIds = [new ObjectId(), new ObjectId()];

    // 设置ctx对象
    ctx = {
      request: {
        body: {
          ids: peopleIds.map(id => id.toString()),
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

  // 测试成功更新人物名称
  test('成功更新人物名称', async () => {
    const newName = '新人物名称';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: peopleIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchPeople(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('people');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: peopleIds },
        user_id: userId
      },
      { $set: { name: newName } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试成功更新隐藏状态
  test('成功更新隐藏状态', async () => {
    const hide = true;
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { hide } },
      validIds: peopleIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { hide };

    await patchPeople(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('people');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: peopleIds },
        user_id: userId
      },
      { $set: { hide } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试名称长度验证
  test('名称长度超过64个字符应该返回400错误', async () => {
    const longName = 'a'.repeat(65);
    const validationError = new Error('人物名至少1个字符，最多不超过64个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { name: longName };

    await patchPeople(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试空名称
  test('空名称应该返回400错误', async () => {
    const emptyName = '';
    const validationError = new Error('人物名至少1个字符，最多不超过64个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { name: emptyName };

    await patchPeople(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试无效的hide值
  test('非布尔类型的hide值应该返回400错误', async () => {
    const invalidHide = 'true';
    const validationError = new Error('hide 属性应该为布尔类型');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { hide: invalidHide };

    await patchPeople(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试同时更新多个字段
  test('同时更新名称和隐藏状态', async () => {
    const newName = '新人物名称';
    const hide = true;
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName, hide } },
      validIds: peopleIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName, hide };

    await patchPeople(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('people');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: peopleIds },
        user_id: userId
      },
      { $set: { name: newName, hide } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试部分人物更新成功
  test('部分人物更新成功的情况', async () => {
    const newName = '新人物名称';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 1 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: peopleIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchPeople(ctx, next);

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });
});
