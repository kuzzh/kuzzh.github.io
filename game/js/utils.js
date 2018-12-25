function loadImage(imageUrl, width, height, callback) {
    var image = new Image();
    
    image.onload = function () {
        /*
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        callback(ctx.imageBitmap);
        */
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