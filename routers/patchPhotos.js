import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { validatePatchData } from '../utils/validatePatchData.js';

const ALLOWED_FIELDS_MAP = new Map([
  [
    'status',
    (v) => {
      const validStatus = [null, 'trashed', 'deleted'];
      if (!validStatus.includes(v)) {
        throw new Error(`status 必须是 null${ validStatus.join(', ') } 中的一个`);
      }
      return {
        $set: { status: v },
      };
    },
  ],
  [
    'albums__append_one',
    (v) => {
      if (!ObjectId.isValid(v)) {
        throw new Error('相册 id 格式不合法！');
      }
      return {
        $addToSet: {
          albums: ObjectId.createFromHexString(v),
        },
      };
    },
  ],
]);

/**
 * 更新照片信息（支持批量更新）
 * @param  {string[]}   ctx.request.body.ids 要更新的资源列表
 * @param  {any}        ctx.request.body.updates 要更新的字段
 */
export default async (ctx, next) => {
  try {
    const { updateOptions, validIds } = await validatePatchData(ALLOWED_FIELDS_MAP, ctx.request.body);

    const result = await db.collection('photos').updateMany(
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
