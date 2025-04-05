import { ObjectId } from 'mongodb';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * 校验 patch 请求的数据
 * @param  {Map}    allowedFieldsMap 允许的字段，格式为 'fieldname' => fn()
 * @param  {Object} requestBody      要校验的请求体
 * @return 校验通过则返回数据库更新对象
 * @throw 参数类型不正确或参数值校验失败会抛出异常
 */
export async function validatePatchData(allowedFieldsMap, requestBody) {
  if (!(allowedFieldsMap instanceof Map)) {
    throw new ValidationError('参数 allowedFieldsMap 类型错误，要求为 Map');
  }

  if (!requestBody || typeof requestBody !== 'object') {
    throw new ValidationError('参数 requestBody 类型错误，要求为对象');
  }

  const { ids, updates } = requestBody;

  // 校验 id 格式

  if (!Array.isArray(ids) || !ids.length) {
    throw new ValidationError('请通过 ids （非空字符串数组）指定要更新的记录');
  }

  if (ids.some((id) => !ObjectId.isValid(id))) {
    throw new ValidationError('存在格式不合法的 id');
  }

  // 校验要更新的数据

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new ValidationError('参数 updates 必须是对象类型');
  }

  if (!Object.keys(updates).length) {
    throw new ValidationError('参数 updates 不能为空对象');
  }

  const updateOptions = {};

  for (const [field, value] of Object.entries(updates)) {
    if (!allowedFieldsMap.has(field)) {
      throw new ValidationError(`不允许的字段：updates[${ field }]`);
    }

    try {
      const validator = allowedFieldsMap.get(field);
      const operation = validator(value);
      // operation 示例 1:
      // {
      //   $set: { status: 'trashed' }
      // }
      // operation 示例 2:
      // {
      //   $addToSet: { albums: 'xxx' }
      // }
      for (const [opKey, opValue] of Object.entries(operation)) {
        updateOptions[opKey] = Object.assign(updateOptions[opKey] || {}, opValue);
      }
    } catch (e) {
      throw new ValidationError(e.message);
    }
  }

  return {
    updateOptions,
    validIds: ids.map((id) => ObjectId.createFromHexString(id)),
  };
}
