import { ObjectId } from 'mongodb';

// 验证路径参数中 id 的格式是否合法。
// 默认验证 ctx.params.id；可以通过参数指定验证其它属性，例如：
// 调用 validateParamsId('user_id') 则会验证 ctx.params.user_id
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
