import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as render from './render.js'
import { DB } from "https://deno.land/x/sqlite/mod.ts";

const db = new DB("blog.db");
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT)");
db.query("CREATE TABLE IF NOT EXISTS posts (postid INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, title TEXT, body TEXT)");

const router = new Router();

router.get('/', userlist)
  .get('/newuser', adduser)
  .get('/:user', list)
  .get('/:user/post/new', add)
  .get('/:user/post/:postid', show)
  .post('/:user/post', create)
  .post('/adduser', createUser);

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

function queryuser(sql) {
  let list = []
  for (const [id, user] of db.query(sql)) {
    list.push({id, user})
  }
  return list
}

function querypost(sql, params = []) {
  let list = []
  for (const [postid, user, title, body] of db.query(sql, params)) {
    list.push({postid, user, title, body})
  }
  return list
}

async function userlist(ctx) {
  let users = queryuser("SELECT id, user FROM users")
  console.log('list:users=', users)
  let posts = querypost(`SELECT postid, user, title, body FROM posts`)
  console.log('list:posts=', posts)
  ctx.response.body = await render.userlist(users);
}

async function adduser(ctx) {
  ctx.response.body = await render.newUser();
}

async function createUser(ctx) {
  const body = ctx.request.body
  if (body.type() === "form") {
    const pairs = await body.form()
    const user = {}
    for (const [key, value] of pairs) {
      user[key] = value
    }
    console.log('create:user=', user)
    db.query("INSERT INTO users (user) VALUES (?)", [user.user]);
    db.query("INSERT INTO posts (user, title, body) VALUES (?, ?, ?)", [user.user, 'Example', 'example']);
    // let posts = querypost(`SELECT postid, user, title, body FROM posts WHERE user=?`,[user])
    // console.log('list:posts=', posts)
    ctx.response.redirect('/');
  }
}

async function list(ctx) {
  const user = ctx.params.user;
  console.log('username=', user)
  let posts = querypost(`SELECT postid, user, title, body FROM posts WHERE user=?`,[user])
  console.log('posts=', posts)
  // console.log('posts[user]=', posts[user])
  if (!posts[user]) {
    posts[user] = []; 
  }
  // console.log('username=', user)
  ctx.response.body = await render.list(user, posts);
}

async function add(ctx) {
  const user = ctx.params.user;
  ctx.response.body = await render.newPost(user);
}

async function show(ctx) {
  const user = ctx.params.user;
  const pid = ctx.params.postid;
  console.log('show:user=', user)
  console.log('show:pid=', pid)
  let posts = querypost(`SELECT postid, user, title, body FROM posts WHERE user=? AND postid=?`,[user,pid])
  let post = posts[0]
  console.log('show:post=', post)
  if (!post) ctx.throw(404, 'invalid post id');
  ctx.response.body = await render.show(user, post);
}

async function create(ctx) {
  const user = ctx.params.user;
  const body = ctx.request.body
  console.log('username=', user)

  if (body.type() === "form") {
    const pairs = await body.form()
    const post = {}
    for (const [key, value] of pairs) {
      post[key] = value
    }
    let posts = querypost(`SELECT postid, user,title, body FROM posts WHERE user=?`,[user])
    // console.log('posts=', posts);
    console.log('post=', post);
    if (!posts[user]) {
      posts[user] = []; // 若用戶的貼文列表不存在，則初始化為空陣列
    }
    // console.log('new_username=', user)
    // console.log('new:list:posts=', posts)
    console.log('new:create:post=', post)
    db.query("INSERT INTO posts (user, title, body) VALUES (?, ?, ?)", [user, post.title, post.body]);
    console.log('tset:list:posts=', posts)
    console.log('test:create:post=', post)
    ctx.response.redirect(`/${user}`);
  }
}

console.log(`Server run at http://127.0.0.1:8000`)
await app.listen({ port: 8000 });
