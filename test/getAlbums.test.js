import { ObjectId } from 'mongodb';
import getAlbums from '../routers/getAlbums.js';
import { db } from '../db.js';
import { getBaseUrl } from '../utils/getBaseUrl.js';

// 模拟数据库连接
jest.mock('../db.js', () => ({
  db: {
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      findOne: jest.fn()
    })
  }
}));

// 模拟getBaseUrl工具函数
jest.mock('../utils/getBaseUrl.js', () => ({
  getBaseUrl: jest.fn().mockReturnValue('http://localhost:3000')
}));

describe('getAlbums中间件测试', () => {
  let ctx;
  let next;
  let userId;
  let mockAlbums;
  let mockCoverPhoto;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置测试数据
    userId = new ObjectId();
    mockAlbums = [
      {
        _id: new ObjectId(),
        name: '相册1',
        user_id: userId
      },
      {
        _id: new ObjectId(),
        name: '相册2',
        user_id: userId
      }
    ];

    mockCoverPhoto = {
      _id: new ObjectId(),
      albums: [mockAlbums[0]._id]
    };

    // 设置ctx对象
    ctx = {
      state: {
        currentUser: {
          _id: userId
        }
      },
      body: null
    };

    next = jest.fn();

    // 设置数据库查询的mock返回值
    db.collection().find().toArray.mockResolvedValue(mockAlbums);
  });

  // 测试成功获取相册列表（有封面照片）
  test('成功获取相册列表并包含封面照片', async () => {
    // 模拟第一个相册有封面照片
    db.collection().findOne.mockResolvedValueOnce(mockCoverPhoto);
    // 模拟第二个相册没有封面照片
    db.collection().findOne.mockResolvedValueOnce(null);

    await getAlbums(ctx, next);

    // 验证相册查询
    expect(db.collection).toHaveBeenCalledWith('albums');
    expect(db.collection().find).toHaveBeenCalledWith({
      user_id: userId
    });

    // 验证封面照片查询
    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(db.collection().findOne).toHaveBeenCalledWith({
      albums: mockAlbums[0]._id
    });
    expect(db.collection().findOne).toHaveBeenCalledWith({
      albums: mockAlbums[1]._id
    });

    // 验证响应
    expect(ctx.body).toEqual({
      msg: '获取成功！',
      data: [
        {
          ...mockAlbums[0],
          cover: `http://localhost:3000/photo/${mockCoverPhoto._id}`
        },
        mockAlbums[1]
      ]
    });
  });

  // 测试成功获取相册列表（无封面照片）
  test('成功获取相册列表但无封面照片', async () => {
    // 模拟所有相册都没有封面照片
    db.collection().findOne.mockResolvedValue(null);

    await getAlbums(ctx, next);

    // 验证相册查询
    expect(db.collection).toHaveBeenCalledWith('albums');
    expect(db.collection().find).toHaveBeenCalledWith({
      user_id: userId
    });

    // 验证响应
    expect(ctx.body).toEqual({
      msg: '获取成功！',
      data: mockAlbums
    });
  });
});
