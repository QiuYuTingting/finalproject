import { db } from '../db.js';
import { ObjectId } from 'mongodb';

/**
 * 获取人物详情
 * @param  {string}   ctx.params.id 要查询的人物id
 */
export default async (ctx, next) => {
  const { id } = ctx.params;

  const collection = db.collection('people');

  const person = await collection.findOne({
    user_id: ctx.state.currentUser?._id,
    _id: ObjectId.createFromHexString(id),
  });

  if (!person) {
    ctx.status = 404;
    ctx.body = { msg: `人物 ${id} 不存在` };
    return;
  }

  ctx.body = {
    msg: '获取成功！',
    data: person,
  };
}
