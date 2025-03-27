import { db } from '../db.js';

/**
 * 创建相册
 * @param  {string} ctx.request.body.name 相册名
 */
export default async (ctx, next) =>{
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

  const collection = db.collection('albums');
  const album = await collection.findOne({ name, user_id: ctx.state.currentUser?._id });

  if (album) {
    ctx.status = 409;
    ctx.body = { msg: `相册 ${name} 已存在！` };
  } else {
    const result = await collection.insertOne({
      name,
      user_id: ctx.state.currentUser?._id,
      created_at: new Date(),
    });

    ctx.status = 201;
    ctx.body = {
      msg: '创建成功！',
      data: result,
    };
  }

}
