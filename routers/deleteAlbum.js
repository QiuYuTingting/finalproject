import { ObjectId } from 'mongodb';
import { db } from '../db.js';

/**
 * 删除相册
 * @param  {string}   ctx.params.id 要删除的相册的id
 */
export default async (ctx, next) => {
  const { id } = ctx.params;

  const collection = db.collection('albums');

  const result = await collection.deleteOne({ 
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id),
  });
  
  if (result.deletedCount) {
    ctx.body = { msg: '删除成功！' };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '相册不存在!' };
  }
}
