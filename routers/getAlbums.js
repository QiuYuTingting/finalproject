import { db } from '../db.js';

/**
 * 获取当前用户的所有相册
 */
export default async (ctx, next) => {
  const collection = db.collection('albums');
  const albums = await collection.find({ user_id: ctx.state.currentUser?._id }).toArray();

  ctx.body = { 
    msg: '获取成功！', 
    data: albums,
  };
}
