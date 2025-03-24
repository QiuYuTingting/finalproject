import { db } from '../db.js';
import { ObjectId } from 'mongodb';

const ALLOWED_FIELDS_MAP = new Map([
  [
    'status',
    (v) => {
      console.log('正在校验 status 字段', v);
      const validStatus = [null, 'trashed', 'deleted'];
      if (!validStatus.includes(v)) {
        throw new Error(`status 必须是 null${ validStatus.join(', ') } 中的一个`);
      }
    },
  ],
]);

/**
 * 更新照片信息（支持批量更新）
 * @param  {string[]}   ctx.request.body.ids 要更新的资源列表
 * @param  {any}        ctx.request.body.updates 要更新的字段
 */
export default async (ctx, next) => {
  const { ids, updates } = ctx.request.body;

  // 校验 id 格式

  if (!Array.isArray(ids) || !ids.length) {
    ctx.status = 400;
    ctx.body = { msg: `请通过 ids （非空字符串数组）指定要更新的记录` };
    return;
  }

  if (ids.some((id) => !ObjectId.isValid(id))) {
    ctx.status = 400;
    ctx.body = { msg: `存在格式不合法的 id` };
    return;
  }

  // 校验要更新的数据

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    ctx.status = 400;
    ctx.body = { msg: `参数 updates 必须是对象类型` };
    return;
  }

  const validUpdates = {};

  for (const [field, value] of Object.entries(updates)) {
    if (!ALLOWED_FIELDS_MAP.has(field)) {
      ctx.status = 400;
      ctx.body = { msg: `不允许的字段：updates[${ field }]` };
      return;
    }

    try {
      const validator = ALLOWED_FIELDS_MAP.get(field);
      validator(value);
      validUpdates[field] = updates[field];
    } catch (e) {
      ctx.status = 400;
      ctx.body = { msg: e.message };
      return;
    }
  }

  const result = await db.collection('photos').updateMany(
    {
      _id: { $in: ids.map((id) => ObjectId.createFromHexString(id)) }
    },
    {
      $set: validUpdates,
    }
  );

  ctx.body = {
    msg: `匹配到 ${result.matchedCount} 个记录；更新了 ${result.modifiedCount} 个记录。`,
    data: {},
  };
};
