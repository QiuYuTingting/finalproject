import { db, shutdown } from './db.js';
import bcrypt from 'bcryptjs';

const ADMIN_NAME = 'admin';
const ADMIN_PASSWORD = '00000000';

async function initDefaultAdmin() {
  const collection = db.collection('users');

  const adminExists = await collection.findOne({ is_admin: true });

  if (adminExists) {
    throw new Error('管理员账号已存在，无需重复创建');
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, salt);

  await collection.insertOne({
    name: ADMIN_NAME,
    password: hash,
    is_admin: true,
    created_at: new Date(),
  });
}

async function setup() {
  try {
    await initDefaultAdmin();
    console.log(`初始化管理员成功！用户名：${ADMIN_NAME} 密码：${ADMIN_PASSWORD}`);
  } catch (e) {
    console.error('初始化管理员失败', e);
  } finally {
    shutdown();
  }
}

setup();
