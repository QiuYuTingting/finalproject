import dotenv from 'dotenv';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import { ObjectId } from 'mongodb';
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { client } from './db.js';
import { validateParamsId } from './middlewares/validateParamsId.js';
import createUser from './routers/createUser.js';
import getToken from './routers/getToken.js';
import createAlbum from './routers/createAlbum.js';
import getAlbums from './routers/getAlbums.js';
import deleteAlbum from './routers/deleteAlbum.js';
import updateAlbum from './routers/updateAlbum.js';
import getUser from './routers/getUser.js';
import updateUser from './routers/updateUser.js';
import getAlbum from './routers/getAlbum.js';
import uploadPhotos from './routers/uploadPhotos.js';
import getPhoto from './routers/getPhoto.js';

dotenv.config();

var app = new Koa();
var router = new Router();

async function authorize(ctx, next) {
  const authorization = ctx.headers['authorization'];
  if (!authorization) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  const token = authorization.split(' ')[1];
  try {
    ctx.tokenPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    ctx.tokenPayload.userId = ObjectId.createFromHexString(ctx.tokenPayload.id);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  
  await next();
}

async function authorizeByCookie(ctx, next) {
  const token = ctx.cookies.get('token');
  try {
    ctx.tokenPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    ctx.tokenPayload.userId = ObjectId.createFromHexString(ctx.tokenPayload.id);
  } catch (err) {
    ctx.status = 302;
    ctx.redirect('/login');
    return;
  }

  await next();
}

async function cors(ctx, next) {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  ctx.set('Access-Control-Max-Age', '86400');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  await next();
} 

app.use(cors);

app.use(koaBody());

router.get('/', (ctx, next) => {
  ctx.body = { msg: 'Welcome!' };
});

router.post('/users', createUser);
router.post('/token', getToken);
router.get('/users/:id', authorize, validateParamsId(), getUser);
router.put('/users/:id', authorize, validateParamsId(), updateUser);
router.post('/albums', authorize, createAlbum);
router.get('/albums', authorize, getAlbums);
router.delete('/albums/:id', authorize, validateParamsId(), deleteAlbum);
router.put('/albums/:id', authorize, validateParamsId(), updateAlbum);
router.get('/albums/:id', authorize, validateParamsId(), getAlbum);
router.post('/photos', authorize, uploadPhotos)
router.get('/photo/:id', authorizeByCookie, validateParamsId(), getPhoto);

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);

async function shutdown() {
  await client.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
