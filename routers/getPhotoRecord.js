import { db } from '../db.js';
import { ObjectId } from 'mongodb';

/**
 * 获取照片详情
 * @param  {string}   ctx.params.id 要查询的照片id
 */
export default async (ctx, next) => {
  const { id } = ctx.params;

  const collection = db.collection('photos');

  const photo = await collection.findOne({
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id),
  });

  if (!photo) {
    ctx.status = 404;
    ctx.body = { msg: `照片 ${id} 不存在` };
    return;
  }

  // 获取当前服务的域名
  const host = ctx.request.get('X-Forwarded-Host') || ctx.request.host;
  const protocol = ctx.request.get('X-Forwarded-Proto') || ctx.request.protocol;
  const baseUrl = `${protocol}://${host}`;

  photo.src = `${baseUrl}/photo/${photo._id}`

  ctx.body = {
    msg: '获取成功！',
    data: photo,
  };
}
