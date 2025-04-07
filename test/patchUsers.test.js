import { ObjectId } from 'mongodb';
import patchUsers from '../routers/patchUsers.js';
import { db } from '../db.js';
import { validatePatchData } from '../utils/validatePatchData.js';
import bcrypt from 'bcryptjs';

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

// 模拟bcrypt
jest.mock('bcryptjs', () => ({
  genSaltSync: jest.fn().mockReturnValue('salt'),
  hashSync: jest.fn().mockImplementation((password, salt) => `hashed_${password}_${salt}`)
}));

describe('patchUsers中间件测试', () => {
  let ctx;
  let next;
  let userIds;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    userIds = [new ObjectId(), new ObjectId()];

    // 设置ctx对象
    ctx = {
      request: {
        body: {
          ids: userIds.map(id => id.toString()),
          updates: {}
        }
      },
      status: null,
      body: null
    };

    next = jest.fn();
  });

  // 测试成功更新用户名
  test('成功更新用户名', async () => {
    const newName = 'new_username';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: userIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchUsers(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('users');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: userIds }
      },
      { $set: { name: newName } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试无效的用户名格式
  test('无效的用户名格式应该返回400错误', async () => {
    const invalidName = 'a';
    const validationError = new Error('用户名只能由英文字母、数字、下划线和短横组成，且长度应为 2-15 个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { name: invalidName };

    await patchUsers(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试无效的密码长度
  test('密码长度不符合要求应该返回400错误', async () => {
    const shortPassword = '1234567';
    const validationError = new Error('密码长度应为 8-72 个字符');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { password: shortPassword };

    await patchUsers(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试用户名重复
  test('用户名重复应该返回409错误', async () => {
    const duplicateName = 'existing_username';
    const mongoError = new Error('Duplicate key error');
    mongoError.name = 'MongoServerError';
    mongoError.code = 11000;

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: duplicateName } },
      validIds: userIds
    });

    db.collection().updateMany.mockRejectedValue(mongoError);

    ctx.request.body.updates = { name: duplicateName };

    await patchUsers(ctx, next);

    expect(ctx.status).toBe(409);
    expect(ctx.body).toEqual({
      msg: '该用户名已被使用'
    });
  });

  // 测试部分用户更新成功
  test('部分用户更新成功的情况', async () => {
    const newName = 'new_username';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 1 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { name: newName } },
      validIds: userIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { name: newName };

    await patchUsers(ctx, next);

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });
});
