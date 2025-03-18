import { ObjectId } from 'mongodb';
import { db } from '../db.js';

// TODO: 等待重构
export default async (ctx, next) => {
  const { id } = ctx.params;

  const { name } = ctx.request.body;
  if (!name || typeof name !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能为空或非字符串！' };
    return;
  } else if (name.length > 64) {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能超过64个字符！' };
    return;
  }

  const collection = db.collection('album');
  const result = await collection.updateOne(
    { _id: new ObjectId(id), user_id: ctx.tokenPayload?.id }, 
    { $set: { name } } 
  );
  if (result.matchedCount) {
    ctx.status = 200;
    ctx.body = { msg: "相册更新成功!" };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "相册不存在!" };
  }
  
}
