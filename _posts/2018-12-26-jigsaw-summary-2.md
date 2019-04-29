---
layout: post
title: 拼图游戏总结2-调整图片尺寸
categories: [技术,游戏]
date: 2018-12-26
---

在游戏开发过程中，需要根据窗口尺寸大小调整图片的尺寸，否则图片会显示不完整。这在传统桌面程序中是很简单的事情，但使用 `Canvas` 还是费了一番周折。

最后的解决方案很简单，可能比桌面程序还要简单，核心就使用了一个方法：`createImageBitmap`。

```javascript
function resizeImage(img, width, height, callback) {
    createImageBitmap(img, {
        resizeWidth: width,
        resizeHeight: height
    }).then(function (sprite) {
        callback(sprite);
    });
}
```

