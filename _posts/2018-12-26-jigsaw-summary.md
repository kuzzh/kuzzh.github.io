---
layout: post
title: 拼图游戏总结
tags: [技术,游戏]
date: 2018-12-26
---

> 最近使用 `HTML 5` 中的 `Canvas` 写了一个简单的拼图游戏，在这个过程中遇到了不少问题，经过搜索也一一解决了，现在做一个记录方便日后再次遇到时查阅。

- 在 Canvas 中绘制圆角图片

    代码很简单，核心代码就一个函数：
    ```javascript
    function roundedImage(img, x, y, width, height, radius) {
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.clip();

        ctx.drawImage(img, x, y, width, height);

        ctx.restore();
    }
    ```
- 调整图片尺寸

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
