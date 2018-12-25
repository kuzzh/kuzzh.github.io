function loadImage(imageUrl, width, height, callback) {
    var image = new Image();
    
    image.onload = function () {
        createImageBitmap(image, {
            resizeWidth: width,
            resizeHeight: height
        }).then(function (sprite) {
            callback(sprite);
        });
    }

    image.src = imageUrl;
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