import { db } from '../db.js';

/**
 * 清空回收站
 */
export default async (ctx, next) => {
  const result = await db.collection('photos').updateMany(
    {
      user_id: ctx.state.currentUser?._id,
      status: 'trashed',
    },
    {
      $set: {
        status: 'deleted',
      },
    }
  );

  ctx.body = {
    msg: `匹配到 ${result.matchedCount} 个记录；更新了 ${result.modifiedCount} 个记录。`,
    data: result,
  };

}
