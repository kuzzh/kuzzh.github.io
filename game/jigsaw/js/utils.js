function loadImage(imageUrl, callback) {
    var image = new Image();

    image.onload = function () {
        callback(image);
    }

    image.src = imageUrl;
}

function resizeImage(img, width, height, callback) {
    createImageBitmap(img, {
        resizeWidth: width,
        resizeHeight: height
    }).then(function (sprite) {
        callback(sprite);
    });
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getPositionOnCanvas(canvas, x, y) {
    var box = canvas.getBoundingClientRect();
    return {
        x: x - box.left,
        y: y - box.top
    };
}