import { ObjectId } from 'mongodb';

/**
 *
 * 验证路径参数中 id 的格式是否合法；默认验证 ctx.params.id；
 * @param  {String} idPropName 指定验证 ctx.params[idPropName] 属性
 * @examples `validateParamsId('user_id')` // 验证 ctx.params.user_id 的格式是否合法
 */
export function validateParamsId(idPropName = 'id') {
  return async (ctx, next) => {
    const id = ctx.params[idPropName];

    if (!ObjectId.isValid(id)) {
      ctx.status = 400;
      ctx.body = { msg: `无效的 ${idPropName} 格式` };
      return;
    }

    await next();
  };
};
