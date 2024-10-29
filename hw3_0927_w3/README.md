# 習題 3: 請為 sqlite 的 blog 程式加上分版功能
+ 分版功能參考 [blog](https://github.com/ccc113a/html2denojs/tree/master/02-%E5%BE%8C%E7%AB%AF/04b-formBlog/blog/%E5%88%86%E7%89%88)
+ sqlite參考 [sqlite blog](https://github.com/ccc113a/html2denojs/tree/master/02-%E5%BE%8C%E7%AB%AF/05-sqlite/03-blog)

```javascript
router.get('/:user/', list)
  .get('/:user/post/new', add)
  .get('/:user/post/:id', show)
  .post('/:user/post', create);
```