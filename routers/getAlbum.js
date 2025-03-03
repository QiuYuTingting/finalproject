import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  const { id } = ctx.params;

  if (!id || typeof id !== 'string' || id.length !== 24 ) {
    ctx.status = 400;
    ctx.body = { msg: '请输入相册id！' };
    return;
  }

  const collection = db.collection('albums');
  const album = await collection.findOne({ 
    user_id: ctx.tokenPayload?.userId, 
    _id: ObjectId.createFromHexString(id), 
  });

  delete album.user_id;
  album.id = album._id;
  delete album._id;

  ctx.status = 200;
  ctx.body = { 
    msg: '获取成功！', 
    data: album,
  };

}