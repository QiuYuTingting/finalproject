import { db } from '../db.js';
import { ObjectId } from 'mongodb';

export default async (ctx, next) => {
  const { id } = ctx.params;

  const collection = db.collection('albums');
  const album = await collection.findOne({ 
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id), 
  });

  if (!album) {
    ctx.status = 404;
    ctx.body = { msg: `相册 ${id} 不存在` };
    return;
  }

  delete album.user_id;
  album.id = album._id;
  delete album._id;

  ctx.body = { 
    msg: '获取成功！', 
    data: album,
  };
}
