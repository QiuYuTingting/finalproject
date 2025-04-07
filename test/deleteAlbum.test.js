import { ObjectId } from 'mongodb';
import deleteAlbum from '../routers/deleteAlbum.js';
import { db } from '../db.js';

// 模拟数据库连接
jest.mock('../db.js', () => ({
  db: {
    collection: jest.fn().mockReturnValue({
      deleteOne: jest.fn(),
      updateMany: jest.fn()
    })
  }
}));

describe('deleteAlbum中间件测试', () => {
  let ctx;
  let next;
  let albumId;
  let userId;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    albumId = new ObjectId();
    userId = new ObjectId();

    // 设置ctx对象
    ctx = {
      params: {
        id: albumId.toString()
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

  // 测试成功删除相册的场景
  test('成功删除相册并更新相关照片', async () => {
    // 模拟相册删除成功
    db.collection().deleteOne.mockResolvedValue({ deletedCount: 1 });
    // 模拟照片更新成功
    db.collection().updateMany.mockResolvedValue({ modifiedCount: 2 });

    await deleteAlbum(ctx, next);

    // 验证相册删除
    expect(db.collection).toHaveBeenCalledWith('albums');
    expect(db.collection().deleteOne).toHaveBeenCalledWith({
      user_id: userId,
      _id: albumId
    });

    // 验证照片更新
    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(db.collection().updateMany).toHaveBeenCalledWith(
      { albums: albumId },
      { $pull: { albums: albumId } }
    );

    // 验证响应
    expect(ctx.body).toEqual({ msg: '删除成功！' });
    expect(ctx.status).toBeNull();
  });

  // 测试相册不存在的场景
  test('相册不存在时应返回404', async () => {
    // 模拟相册删除失败（相册不存在）
    db.collection().deleteOne.mockResolvedValue({ deletedCount: 0 });

    await deleteAlbum(ctx, next);

    // 验证相册删除
    expect(db.collection).toHaveBeenCalledWith('albums');
    expect(db.collection().deleteOne).toHaveBeenCalledWith({
      user_id: userId,
      _id: albumId
    });

    // 验证没有调用照片更新
    expect(db.collection).not.toHaveBeenCalledWith('photos');

    // 验证响应
    expect(ctx.status).toBe(404);
    expect(ctx.body).toEqual({ msg: '相册不存在!' });
  });

  // 测试无效的相册ID
  test('无效的相册ID应该抛出错误', async () => {
    ctx.params.id = 'invalid-id';

    await expect(deleteAlbum(ctx, next)).rejects.toThrow();

    // 验证没有调用数据库操作
    expect(db.collection).not.toHaveBeenCalled();
  });
});
