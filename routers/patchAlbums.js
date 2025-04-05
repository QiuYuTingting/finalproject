import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { validatePatchData } from '../utils/validatePatchData.js';

const ALLOWED_FIELDS_MAP = new Map([
  [
    'name',
    (v) =>　{
      if (typeof v !== 'string' || !v.length || v.length > 64) {
        throw new Error('相册名至少1个字符，最多不超过64个字符');
      }
      return {
        $set: { name: v },
      };
    },
  ],
]);

/**
 * 更新相册信息（支持批量更新）
 * @param  {string[]}   ctx.request.body.ids 要更新的资源列表
 * @param  {any}        ctx.request.body.updates 要更新的字段
 */
export default async (ctx, next) => {
  try {
    const { updateOptions, validIds } = await validatePatchData(ALLOWED_FIELDS_MAP, ctx.request.body);

    const result = await db.collection('albums').updateMany(
      {
        _id: { $in: validIds },
        user_id: ctx.state.currentUser?._id,
      },
      updateOptions,
    );

    ctx.body = {
      msg: `匹配到 ${result.matchedCount} 个记录；更新了 ${result.modifiedCount} 个记录。`,
      data: result,
    };
  } catch (e) {
    ctx.status = e.name === 'ValidationError' ? 400 : 500;
    ctx.body = { msg: e.message };
  }
};
