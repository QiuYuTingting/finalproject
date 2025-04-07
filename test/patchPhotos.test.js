import { ObjectId } from 'mongodb';
import patchPhotos from '../routers/patchPhotos.js';
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

describe('patchPhotos中间件测试', () => {
  let ctx;
  let next;
  let userId;
  let photoIds;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    userId = new ObjectId();
    photoIds = [new ObjectId(), new ObjectId()];

    // 设置ctx对象
    ctx = {
      request: {
        body: {
          ids: photoIds.map(id => id.toString()),
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

  // 测试成功更新照片状态
  test('成功更新照片状态为trashed', async () => {
    const status = 'trashed';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { status } },
      validIds: photoIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { status };

    await patchPhotos(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: photoIds },
        user_id: userId
      },
      { $set: { status } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试成功添加相册
  test('成功添加相册到照片', async () => {
    const albumId = new ObjectId();
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $addToSet: { albums: albumId } },
      validIds: photoIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { albums__append_one: albumId.toString() };

    await patchPhotos(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: photoIds },
        user_id: userId
      },
      { $addToSet: { albums: albumId } }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试无效的状态值
  test('无效的状态值应该返回400错误', async () => {
    const invalidStatus = 'invalid';
    const validationError = new Error('status 必须是 null, trashed, deleted 中的一个');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { status: invalidStatus };

    await patchPhotos(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试无效的相册ID
  test('无效的相册ID应该返回400错误', async () => {
    const invalidAlbumId = 'invalid-id';
    const validationError = new Error('相册 id 格式不合法！');
    validationError.name = 'ValidationError';

    validatePatchData.mockRejectedValue(validationError);

    ctx.request.body.updates = { albums__append_one: invalidAlbumId };

    await patchPhotos(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      msg: validationError.message
    });
  });

  // 测试同时更新状态和添加相册
  test('同时更新状态和添加相册', async () => {
    const status = 'trashed';
    const albumId = new ObjectId();
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 2 };

    validatePatchData.mockResolvedValue({
      updateOptions: {
        $set: { status },
        $addToSet: { albums: albumId }
      },
      validIds: photoIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = {
      status,
      albums__append_one: albumId.toString()
    };

    await patchPhotos(ctx, next);

    expect(validatePatchData).toHaveBeenCalledWith(
      expect.any(Map),
      ctx.request.body
    );

    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      {
        _id: { $in: photoIds },
        user_id: userId
      },
      {
        $set: { status },
        $addToSet: { albums: albumId }
      }
    );

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });

  // 测试部分照片更新成功
  test('部分照片更新成功的情况', async () => {
    const status = 'trashed';
    const mockUpdateResult = { matchedCount: 2, modifiedCount: 1 };

    validatePatchData.mockResolvedValue({
      updateOptions: { $set: { status } },
      validIds: photoIds
    });

    db.collection().updateMany.mockResolvedValue(mockUpdateResult);

    ctx.request.body.updates = { status };

    await patchPhotos(ctx, next);

    expect(ctx.body).toEqual({
      msg: `匹配到 ${mockUpdateResult.matchedCount} 个记录；更新了 ${mockUpdateResult.modifiedCount} 个记录。`,
      data: mockUpdateResult
    });
  });
});
