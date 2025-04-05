import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import { validatePatchData } from '../utils/validatePatchData.js';

const ALLOWED_FIELDS_MAP = new Map([
  [
    'name',
    (v) =>　{
      if (!v || !/^[a-zA-Z0-9_-]{2,15}$/.test(v)) {
        throw new Error('用户名只能由英文字母、数字、下划线和短横组成，且长度应为 2-15 个字符');
      }
      return {
        $set: { name: v },
      };
    },
  ],
  [
    'password',
    (v) => {
      if (!v || v.length < 8 || v.length > 72) {
        throw new Error('密码长度应为 8-72 个字符');
      }
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(v, salt);
      return {
        $set: { password: hash },
      };
    },
  ],
]);

/**
 * 更新用户信息（支持批量更新）
 * @param  {string[]}   ctx.request.body.ids 要更新的资源列表
 * @param  {any}        ctx.request.body.updates 要更新的字段
 */
export default async (ctx, next) => {
  try {
    const { updateOptions, validIds } = await validatePatchData(ALLOWED_FIELDS_MAP, ctx.request.body);

    const result = await db.collection('users').updateMany(
      {
        _id: { $in: validIds },
      },
      updateOptions,
    );

    ctx.body = {
      msg: `匹配到 ${result.matchedCount} 个记录；更新了 ${result.modifiedCount} 个记录。`,
      data: result,
    };
  } catch (e) {
    if (e.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = { msg: e.message };
    } else if (e.name === 'MongoServerError' && e.code === 11000) {
      ctx.status = 409;
      ctx.body = { msg: '该用户名已被使用' };
    } else {
      ctx.status = 500;
      ctx.body = { msg: e.message };
    }
  }
};
