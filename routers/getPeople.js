import { db } from '../db.js';

/**
 * 获取当前用户的所有人物
 */
export default async (ctx, next) => {
  const collection = db.collection('people');
  const people = await collection.find({ 
    user_id: ctx.state.currentUser?._id,
    $or: [
      { hide: { $exists: false } },
      { hide: { $eq: false } },
    ],
  }).toArray();

  ctx.body = {
    msg: '获取成功！',
    data: people,
  };
}
