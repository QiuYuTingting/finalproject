# 毕业设计 后端

## 如何设计 REST 风格的接口

- [以 REST 方式设计 /login 或 /register 资源？](https://stackoverflow.com/a/7260540/8198710)
- [使用 GET 或 POST 生成令牌](https://stackoverflow.com/a/50776478/8198710)
- 关于嵌套资源的 api 设计参见 [Shallow Nesting](https://guides.rubyonrails.org/routing.html#shallow-nesting)

经过一系列调查以及和 AI 探讨之后，确定接口列表如下：

| Method | Path | 说明 |
| --- | --- | --- |
| POST   | `/users`               | 创建用户（即注册） |
| GET    | `/users/me`            | 获取用户自己的信息 |
| DELETE | `/users/{id}`          | 删除用户（即注销） |
| PATCH  | `/users`               | 修改用户信息 |
| GET    | `/users/{id}`          | 获取用户信息（仅管理员使用） |
| GET    | `/users?q={query}`     | 查询用户列表（仅管理员使用） |
| POST   | `/token`               | 获取令牌（即登录） |
| POST   | `/albums`              | 创建相册 |
| DELETE | `/albums/{id}`         | 删除相册 |
| PATCH  | `/albums`              | 修改相册信息 |
| GET    | `/albums/{id}`         | 获取相册信息 |
| GET    | `/albums?q={query}`    | 查询相册列表 |
| POST   | `/photos`              | 上传照片 |
| DELETE | `/photos/{id}`         | 删除照片 |
| PATCH  | `/photos`              | 修改照片信息（例如备注） |
| GET    | `/photos?q={query}`    | 查询照片列表 |
| GET    | `/photo/{id}`          | 获取照片 |
| POST   | `/albums/{id}/photos`  | 上传照片到相册 |
| GET    | `/albums/{id}/photos`  | 获取相册的照片列表 |

> 备注：没有 `DELETE /albums/{id}/photos/{photo_id}` 这样嵌套过深的接口，因为如果你已经得到了某个照片的id，直接调用上面的 `DELETE /photos/{id}` 即可。

## 如何存储用户照片

使用 AWS S3 或 MinIO 等服务对于一个毕业设计来说太取巧了，我们优先考虑将图片直接存储在服务器磁盘上，更加直观，没有额外的经济和网络条件依赖。

如何在服务器磁盘上存储和管理大量用户上传的照片是个问题。下面是几篇相关讨论：

- [将用户上传的文件存储在网络服务器上的实践](https://stackoverflow.com/a/7925338/8198710)
- [在网站上上传和存储图片的最佳方式是什么？](https://stackoverflow.com/a/8922090/8198710)
- [图片上传存储策略](https://stackoverflow.com/a/2664956)

综合这几个讨论，最终决策是：

- 文件名使用 UUID 等算法创建，以避免冲突；
- 不为每个用户创建一个单独的文件夹；
- 文件夹结构采用 `year/mmdd/{filename}` 方案；

## 如何加载照片

如果服务器提供图片的静态地址，则会导致用户照片泄露到公共领域。可以创建一个常规接口用来提供照片，前端使用照片id加载图片。同时，为了验证用户对照片的访问权限，还需要使用cookie来验证用户信息。

具体做法是，将常规服务使用的Bearer Token同步存储在cookie中。但不使用全局中间件对cookie进行全局验证（就像对待Authorization标头那样），仅在图片资源相关服务校验 cookie。其余常规服务如无特殊说明，依然不用理会cookie，继续使用Authorization标头中的cookie。

## 权限系统

本系统采用主流的基于角色的访问控制（RBAC）。访问控制逻辑主要集中在管理端。用户端不做考虑。

### 权限

权限即系统功能的映射，例如删除用户、阅读文章、查看评论等。由于系统功能是固定的，权限种类也是一个固定的集合，只会随着系统版本改变。在实现时，可简单地硬编码到服务逻辑中。

```js
const PERMISSIONS = {
  VIEW_REPORTS: 'view_reports',
  MANAGE_PHOTOS: 'manage_photos',
  MANAGE_USERS: 'manage_users',
  // ...
};
```

### 角色

角色是一组权限的具名集合，例如，“数据分析员”可以查看系统运行数据、用户数据等，但无法编辑数据。在实现时，可以允许具有任一角色的用户访问管理端页面。

| 角色名 | 查看运营数据 | 维护照片数据 | 维护用户数据 | XXX |
| --- | --- | --- | --- | --- | --- |
| 运营者 | 是 | 是 | 是 | 是 |
| 数据分析员 | 是 | 否 | 否 | 否 | 否 |
| …… | …… |

### 用户

用户可以有多个角色。在用户访问管理端页面时，会让其选择特定角色进入。一般来说，使用不同角色进入管理页面能访问的功能不一样。

总之，前端页面访问控制、API接口调用控制等逻辑只认角色，不认用户。

```js
if (permission === PERMISSIONS.VIEW_REPORTS) {
  // 允许查看报表数据
}
```

### （超级）管理员

在本系统的设计中，为了保持简单，仅允许有一个管理员。管理员使用特殊字段标识（例如，`is_super: true`），无需对应任何角色，只要系统识别到此特殊字段，则任何权限控制逻辑都对其放行。

为了保持简单，管理员标识字段由运维人员手动添加，并在 mongodb 数据库的 users 表中创建唯一索引，确保只有此用户才有 `is_super: true`，
当在代码中为其余用户添加 `is_super: true` 时会报错，确保整个用户表只有一个记录是 `is_super: true`。

> 这更像常规语境中的“超级管理员”；而上面提到的具有某种角色的用户更类似其它系统中常规的“管理员”。

## 照片的客户端缓存策略

浏览器在加载图片时，建议使用 HTTP 缓存机制，用于减少不必要的请求、提高性能。

- Cache-Control 控制缓存行为；
- ETag 和 Last-Modified 进行缓存校验；

在我们的设计中，将用户上传的照片视为不可变资源，则 `GET /photo/{id}` 服务这样设置请求头即可：

```js
// immutable 告诉浏览器此资源永远不会变
ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
```

当照片被编辑时，原图不会被覆盖，而是将编辑后的版本另存为一个新文件。
