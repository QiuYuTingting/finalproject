import { db } from '../db.js';
import Ajv from 'ajv';
import addErrors from 'ajv-errors';
import bcrypt from 'bcryptjs';

const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });

addErrors(ajv);

const schema = {
  type: 'object',
  properties: {
    name: { 
      type: 'string', 
      minLength: 6, 
      maxLength: 64,
      errorMessage: {
        type: '用户名必须是字符串！',
        minLength: '用户名不能少于6个字符！',
        maxLength: '用户名不能超过64个字符！',
      },
    },
    password: { 
      type: 'string', 
      minLength: 8, 
      maxLength: 32,
      errorMessage: {
        type: '密码必须是字符串！',
        minLength: '密码不能少于8个字符！',
        maxLength: '密码不能超过32个字符！',
      },
    },
  },
  required: ['name', 'password'], 
  additionalProperties: false,
  errorMessage: {
    required: {
      name: '请输入用户名！',
      password: '请输入密码！',
    },
    additionalProperties: '不允许额外的字段！',
  }, 
};

const validate = ajv.compile(schema);

// TODO: 限制用户名只能由字母和数字组成。

export default async (ctx, next) => {
  try {
    const valid = validate(ctx.request.body);
    if (!valid) {
      throw new Error(validate.errors[0].message);
    }
  } catch (err) {
    ctx.status = 400;
    ctx.body = { msg: err.message };
    return;
  }

  const { name, password } = ctx.request.body;

  const collection = db.collection('users');
  const user = await collection.findOne({ name });

  if (user) {
    ctx.status = 409;
    ctx.body = { msg: '用户已存在！' };
  } else {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await collection.insertOne({ 
      name, 
      password: hash, 
    });
    ctx.status = 201;
    ctx.body = {msg: '创建成功！'};
  }

}