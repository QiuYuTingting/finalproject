import { ObjectId } from 'mongodb';
import getPhotos from '../routers/getPhotos.js';
import { db } from '../db.js';
import { getBaseUrl } from '../utils/getBaseUrl.js';

// 模拟数据库连接
jest.mock('../db.js', () => ({
  db: {
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn()
    })
  }
}));

// 模拟getBaseUrl工具函数
jest.mock('../utils/getBaseUrl.js', () => ({
  getBaseUrl: jest.fn().mockReturnValue('http://localhost:3000')
}));

describe('getPhotos中间件测试', () => {
  let ctx;
  let next;
  let mockPhotos;

  beforeEach(() => {
    // 重置所有mock
    jest.clearAllMocks();
    
    // 设置mock数据
    mockPhotos = [
      {
        _id: new ObjectId(),
        mtime: new Date('2024-01-01'),
        user_id: new ObjectId(),
        faces: [{ who: new ObjectId() }],
        albums: [new ObjectId()],
        status: 'normal'
      },
      {
        _id: new ObjectId(),
        mtime: new Date('2024-01-02'),
        user_id: new ObjectId(),
        faces: [{ who: new ObjectId() }],
        albums: [new ObjectId()],
        status: 'trashed'
      }
    ];

    // 设置ctx对象
    ctx = {
      query: {},
      state: {
        currentUser: {
          _id: new ObjectId()
        }
      },
      body: null
    };

    next = jest.fn();

    // 设置数据库查询的mock返回值
    db.collection().find().sort().limit().toArray.mockResolvedValue(mockPhotos);
  });

  // 测试默认查询（无参数）
  test('默认查询应该返回正常状态的照片', async () => {
    await getPhotos(ctx, next);

    expect(db.collection).toHaveBeenCalledWith('photos');
    expect(ctx.body).toEqual({
      msg: '获取成功！',
      data: mockPhotos.map(photo => ({
        ...photo,
        src: `http://localhost:3000/photo/${photo._id}`
      })),
      cursor: mockPhotos[1].mtime
    });
  });

  // 测试分页参数
  test('应该正确处理pagesize参数', async () => {
    ctx.query.pagesize = '10';
    await getPhotos(ctx, next);

    expect(db.collection().find().limit).toHaveBeenCalledWith(10);
  });

  // 测试cursor参数
  test('应该正确处理cursor参数', async () => {
    ctx.query.cursor = '2024-01-01T00:00:00.000Z';
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        mtime: { $lt: new Date('2024-01-01T00:00:00.000Z') }
      })
    );
  });

  // 测试mode参数
  test('应该正确处理mode=all参数', async () => {
    ctx.query.mode = 'all';
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { status: { $exists: false } },
          { status: { $ne: 'deleted' } }
        ]
      })
    );
  });

  test('应该正确处理mode=trashed参数', async () => {
    ctx.query.mode = 'trashed';
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'trashed'
      })
    );
  });

  // 测试person_id参数
  test('应该正确处理person_id参数', async () => {
    const personId = new ObjectId();
    ctx.query.person_id = personId.toString();
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        faces: {
          $all: [{ $elemMatch: { who: personId } }]
        }
      })
    );
  });

  // 测试album_id参数
  test('应该正确处理album_id参数', async () => {
    const albumId = new ObjectId();
    ctx.query.album_id = albumId.toString();
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        albums: { $in: [albumId] }
      })
    );
  });

  // 测试exclude_album参数
  test('应该正确处理exclude_album参数', async () => {
    const excludeAlbumId = new ObjectId();
    ctx.query.exclude_album = excludeAlbumId.toString();
    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        albums: {
          $not: {
            $elemMatch: {
              $eq: excludeAlbumId
            }
          }
        }
      })
    );
  });

  // 测试多个参数组合
  test('应该正确处理多个参数组合', async () => {
    const personId = new ObjectId();
    const albumId = new ObjectId();
    
    ctx.query = {
      pagesize: '20',
      mode: 'all',
      person_id: personId.toString(),
      album_id: albumId.toString()
    };

    await getPhotos(ctx, next);

    expect(db.collection().find).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: ctx.state.currentUser._id,
        faces: {
          $all: [{ $elemMatch: { who: personId } }]
        },
        albums: { $in: [albumId] },
        $or: [
          { status: { $exists: false } },
          { status: { $ne: 'deleted' } }
        ]
      })
    );
    expect(db.collection().find().limit).toHaveBeenCalledWith(20);
  });
});
