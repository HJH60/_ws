# 習題 4: 請為 blogSignup 加上分版功能 
+ 根目錄是列出所有貼文
+ 於根目錄點擊使用者名稱，會顯示該使用者貼文
```js
router.get('/', list)
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/post/new', add)
  .get('/post/:id', show)
  .post('/post', create)
  .get('/list/:user', listUserPosts)  // 只顯示該使用者的貼文
  ```
## 程式碼
+ 參考老師的範例程式去寫的

[app.js](./app.js)

[render.js](./render.js)