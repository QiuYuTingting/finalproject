import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { getBaseUrl } from '../utils/getBaseUrl.js';

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

  photo.src = `${getBaseUrl(ctx)}/photo/${photo._id}`;

  ctx.body = {
    msg: '获取成功！',
    data: photo,
  };
}
