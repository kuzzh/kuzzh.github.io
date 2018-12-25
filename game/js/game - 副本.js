
const COL_NUM = 2,
    ROW_NUM = 2;
// 自动吸附有效距离
const ABSORB_DISTANCE = 30,
    INVALID_POSITION = -1;

var JigsawGame = function (){
    var jigsawGame = {
        _canvasWidth: 400,
        _canvasHeight: 300,
        _boardWidth : 600,
        _boardHeight:600,
        _sliceWidth:_boardWidth / COL_NUM,
        _sliceHeight:_boardHeight / ROW_NUM
    };
    return jigsawGame;
};
var _canvasWidth, _canvasHeight;
var _boardWidth = 600,
    _boardHeight = 600;
var _sliceWidth = _boardWidth / COL_NUM,
    _sliceHeight = _boardHeight / ROW_NUM;


var _imageUrl = document.location.href.split('?')[1],
    _image;
var mousePosition = { x: 0, y: 0 };

var slices = [];
var hoverSlice,
    mouseDown,
    startDragSlicePosition,
    startDragMousePosition;

function createSlices(canvasWidth, canvasHeight) {
    let position = 0;
    for (let col = 0; col < COL_NUM; col++) {
        for (let row = 0; row < ROW_NUM; row++) {
            let sx = col * _sliceWidth;
            let sy = row * _sliceHeight;
            let dx = random(0, canvasWidth - _sliceWidth);
            let dy = random(0, canvasHeight - _sliceHeight);

            slices.push({
                id: col + "_" + row,
                sx: sx,
                sy: sy,
                sWidth: _sliceWidth,
                sHeight: _sliceHeight,
                dx: dx,
                dy: dy,
                dWidth: _sliceWidth,
                dHeight: _sliceHeight,
                currentPosition: INVALID_POSITION,
                rightPosition: position++
            });
        }
    }
}

function isMouseInSlice(slice) {
    return (mousePosition.x >= slice.dx && mousePosition.x <= slice.dx + slice.dWidth &&
        mousePosition.y >= slice.dy && mousePosition.y <= slice.dy + slice.dHeight);
}

function getHoverSlice() {
    // 若 hoverSlice 不为空，优先判断鼠标是否仍在 hoverSlice 中
    if (hoverSlice && isMouseInSlice(hoverSlice)) {
        return hoverSlice;
    }
    for (var i = 0; i < slices.length; i++) {
        var slice = slices[i];
        if (isMouseInSlice(slice)) {
            return slice;
        }
    }
}

function updateHoverSlice() {
    // 有 hoverSlice 正在拖动中，不作更新
    if (hoverSlice && mouseDown) {
        return;
    }
    hoverSlice = getHoverSlice();
}

function redraw() {
    if (_image === undefined) {
        window.requestAnimationFrame(redraw);
        return;
    }
    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (slices.length <= 0) {
        createSlices(ctx.canvas.width, ctx.canvas.height);
    }

    // draw background
    ctx.globalAlpha = 0.4;
    ctx.drawImage(_image, 0, 0, _boardWidth, _boardHeight, (ctx.canvas.width - _boardWidth) / 2, (ctx.canvas.height - _boardHeight) / 2, _boardWidth, _boardHeight);
    ctx.globalAlpha = 1;

    for (var i = 0; i < slices.length; i++) {
        var slice = slices[i];
        if (hoverSlice && hoverSlice.id == slice.id) {
            continue;
        }
        ctx.drawImage(_image, slice.sx, slice.sy, slice.sWidth, slice.sHeight,
            slice.dx, slice.dy, slice.dWidth, slice.dHeight);
    }
    if (hoverSlice) {
        ctx.drawImage(_image, hoverSlice.sx, hoverSlice.sy, hoverSlice.sWidth, hoverSlice.sHeight,
            hoverSlice.dx, hoverSlice.dy, hoverSlice.dWidth, hoverSlice.dHeight);
        ctx.strokeRect(hoverSlice.dx, hoverSlice.dy, hoverSlice.dWidth, hoverSlice.dHeight);
    }

    window.requestAnimationFrame(redraw);
}

function resizeCanvas(canvas) {
    if (window.innerWidth == 0 || window.innerHeight == 0) {
        canvas.width = screen.width;
        canvas.height = screen.height;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    _canvasWidth = canvas.width;
    _canvasHeight = canvas.height;
    _boardWidth = _boardHeight = Math.min(canvas.width, canvas.height) * 0.65;
    _sliceWidth = _boardWidth / COL_NUM;
    _sliceHeight = _boardHeight / ROW_NUM;
}

function correctHoverSliceCoord(ctx) {
    if (hoverSlice.dx < 0) {
        hoverSlice.dx = 0;
    }
    if (hoverSlice.dx > ctx.canvas.width - _sliceWidth) {
        hoverSlice.dx = ctx.canvas.width - _sliceWidth;
    }
    if (hoverSlice.dy < 0) {
        hoverSlice.dy = 0;
    }
    if (hoverSlice.dy > ctx.canvas.height - _sliceHeight) {
        hoverSlice.dy = ctx.canvas.height - _sliceHeight;
    }
}
function isPositionFree(position) {
    for (let i = 0; i < slices.length; i++) {
        if (slices[i].currentPosition == position) {
            return false;
        }
    }
    return true;
}
function autoAbsorb() {
    if (!hoverSlice) {
        return;
    }
    hoverSlice.currentPosition = INVALID_POSITION;

    let position = 0;
    for (let col = 0; col < COL_NUM; col++) {
        for (let row = 0; row < ROW_NUM; row++) {
            let x = (_canvasWidth - _boardWidth) / 2 + col * _sliceWidth;
            let y = (_canvasHeight - _boardHeight) / 2 + row * _sliceHeight;

            if (Math.abs(hoverSlice.dx - x) < ABSORB_DISTANCE &&
                Math.abs(hoverSlice.dy - y) < ABSORB_DISTANCE &&
                isPositionFree(position)) {
                hoverSlice.dx = x;
                hoverSlice.dy = y;
                hoverSlice.currentPosition = position;

                var player = document.querySelector("#dropRing");
                player.play();

                return;
            }
            position += 1;
        }
    }
}

function isGameWin() {
    for (let i = 0; i < slices.length; i++) {
        if (slices[i].currentPosition != slices[i].rightPosition) {
            return false;
        }
    }
    return true;
}

window.onload = function () {
    var canvas = document.querySelector("#canvas");
    var ctx = canvas.getContext("2d");

    resizeCanvas(canvas);

    _image = loadImage(_imageUrl);
    _image.onload = function () {
        window.onresize = function () {
            resizeCanvas(canvas);
        }
        canvas.onmousemove = function (evt) {
            mousePosition = { x: evt.offsetX, y: evt.offsetY };

            updateHoverSlice();

            if (hoverSlice) {
                if (mouseDown) {
                    hoverSlice.dx = evt.offsetX - (startDragMousePosition.x - startDragSlicePosition.x);
                    hoverSlice.dy = evt.offsetY - (startDragMousePosition.y - startDragSlicePosition.y);

                    correctHoverSliceCoord(ctx);
                }
            }
        };

        canvas.onmousedown = function (evt) {
            if (hoverSlice) {
                startDragSlicePosition = { x: hoverSlice.dx, y: hoverSlice.dy };
            }
            startDragMousePosition = mousePosition;
            mouseDown = true;
        };
        canvas.onmouseup = function (evt) {
            startDragSlicePosition = null;
            startDragMousePosition = null;
            mouseDown = false;

            autoAbsorb();

            if (isGameWin()) {
                var player = document.querySelector("#winRing");
                player.play();
            }
        };
        // 触屏设备
        canvas.ontouchmove = function (evt) {
            mousePosition = { x: evt.touches[0].pageX, y: evt.touches[0].pageY };

            updateHoverSlice();

            if (hoverSlice) {
                if (mouseDown) {
                    hoverSlice.dx = evt.touches[0].pageX - (startDragMousePosition.x - startDragSlicePosition.x);
                    hoverSlice.dy = evt.touches[0].pageY - (startDragMousePosition.y - startDragSlicePosition.y);

                    correctHoverSliceCoord(ctx);
                }
            }
        };
        // 触屏设备
        canvas.ontouchstart = function (evt) {
            mousePosition = { x: evt.touches[0].pageX, y: evt.touches[0].pageY };
            updateHoverSlice();
            if (hoverSlice) {
                startDragSlicePosition = { x: hoverSlice.dx, y: hoverSlice.dy };
            }
            startDragMousePosition = mousePosition;
            mouseDown = true;
        };
        // 触屏设备
        canvas.ontouchend = function (evt) {
            startDragSlicePosition = null;
            startDragMousePosition = null;
            mouseDown = false;

            autoAbsorb();

            if (isGameWin()) {
                var player = document.querySelector("#winRing");
                player.play();
            }
        };
    };

    window.requestAnimationFrame(redraw);
};