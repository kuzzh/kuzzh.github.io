
// 自动吸附有效距离
const ABSORB_DISTANCE = 30,
    INVALID_POSITION = -1;

var JigsawGame = function (canvas, imageUrl) {
    var jigsawGame = {
        that: this,
        _colNum: 2,
        _rowNum: 2,
        _isRunning: true,
        _imageUrl: imageUrl,
        _originImage: null,
        _resizedImage: null,
        _canvas: canvas,
        _ctx: canvas.getContext("2d"),
        _borderColor: "#17cea1",
        _boardWidth: 600,
        _boardHeight: 600,
        _sliceWidth: this._boardWidth / this._colNum,
        _sliceHeight: this._boardHeight / this._rowNum,
        _mousePosition: { x: 0, y: 0 },
        _slices: [],
        _hoverSlice: null,
        _mouseDown: false,
        _startDragSlicePosition: null,
        _startDragMousePosition: null,

        _createSlices: function () {
            let position = 0;
            for (let col = 0; col < this._colNum; col++) {
                for (let row = 0; row < this._rowNum; row++) {
                    let sx = col * this._sliceWidth;
                    let sy = row * this._sliceHeight;
                    let dx = random(0, this._canvas.width - this._sliceWidth);
                    let dy = random(0, this._canvas.height - this._sliceHeight);

                    this._slices.push({
                        id: col + "_" + row,
                        sx: sx,
                        sy: sy,
                        sWidth: this._sliceWidth,
                        sHeight: this._sliceHeight,
                        dx: dx,
                        dy: dy,
                        dWidth: this._sliceWidth,
                        dHeight: this._sliceHeight,
                        currentPosition: INVALID_POSITION,
                        rightPosition: position++
                    });
                }
            }
        },

        _isMouseOverSlice: function (slice) {
            return (this._mousePosition.x >= slice.dx && this._mousePosition.x <= slice.dx + slice.dWidth &&
                this._mousePosition.y >= slice.dy && this._mousePosition.y <= slice.dy + slice.dHeight);
        },

        _getHoverSlice: function () {
            // 若 hoverSlice 不为空，优先判断鼠标是否仍在 hoverSlice 中
            if (this._hoverSlice && this._isMouseOverSlice(this._hoverSlice)) {
                return this._hoverSlice;
            }
            for (var i = 0; i < this._slices.length; i++) {
                var slice = this._slices[i];
                if (this._isMouseOverSlice(slice)) {
                    return slice;
                }
            }
        },

        _updateHoverSlice: function () {
            // 有 hoverSlice 正在拖动中，不作更新
            if (this._hoverSlice && this._mouseDown) {
                return;
            }
            this._hoverSlice = this._getHoverSlice();
        },

        _updateSlicesSize: function () {
            if (this._slices.length < this._colNum * this._rowNum) {
                return;
            }
            let position = 0;
            for (let col = 0; col < this._colNum; col++) {
                for (let row = 0; row < this._rowNum; row++) {
                    let slice = this._slices[position++];

                    slice.sx = col * this._sliceWidth;
                    slice.sy = row * this._sliceHeight;
                    slice.sWidth = this._sliceWidth;
                    slice.sHeight = this._sliceHeight;

                    slice.dWidth = this._sliceWidth;
                    slice.dHeight = this._sliceHeight;
                }
            }
        },

        _resizeCanvas: function () {
            let backBtn = $('#back');
            let topHeight = parseInt(backBtn.height()) + parseInt(backBtn.css('margin-top')) + parseInt(backBtn.css('margin-bottom')) +
                parseInt(backBtn.css('padding-top')) + parseInt(backBtn.css('padding-bottom'));
            if (window.innerWidth == 0 || window.innerHeight == 0) {
                this._canvas.width = screen.width;
                this._canvas.height = screen.height - topHeight;
            } else {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight - topHeight;
            }

            this._boardWidth = this._boardHeight = Math.min(this._canvas.width, this._canvas.height) * 0.65;
            this._sliceWidth = this._boardWidth / this._colNum;
            this._sliceHeight = this._boardHeight / this._rowNum;

            this._updateSlicesSize();

            var that = this;
            if (this._originImage != undefined) {
                resizeImage(this._originImage, this._boardWidth, this._boardHeight, function (resizedImg) {
                    that._resizedImage = resizedImg;
                });
            }
        },

        _correctHoverSliceCoord: function () {
            if (this._hoverSlice.dx < 0) {
                this._hoverSlice.dx = 0;
            }
            if (this._hoverSlice.dx > this._canvas.width - this._sliceWidth) {
                this._hoverSlice.dx = this._canvas.width - this._sliceWidth;
            }
            if (this._hoverSlice.dy < 0) {
                this._hoverSlice.dy = 0;
            }
            if (this._hoverSlice.dy > this._canvas.height - this._sliceHeight) {
                this._hoverSlice.dy = this._canvas.height - this._sliceHeight;
            }
        },

        _isPositionFree: function (position) {
            for (let i = 0; i < this._slices.length; i++) {
                if (this._slices[i].currentPosition == position) {
                    return false;
                }
            }
            return true;
        },

        _autoAbsorb: function () {
            if (!this._hoverSlice) {
                return;
            }
            this._hoverSlice.currentPosition = INVALID_POSITION;

            let position = 0;
            for (let col = 0; col < this._colNum; col++) {
                for (let row = 0; row < this._rowNum; row++) {
                    let x = (this._canvas.width - this._boardWidth) / 2 + col * this._sliceWidth;
                    let y = (this._canvas.height - this._boardHeight) / 2 + row * this._sliceHeight;

                    if (Math.abs(this._hoverSlice.dx - x) < ABSORB_DISTANCE &&
                        Math.abs(this._hoverSlice.dy - y) < ABSORB_DISTANCE &&
                        this._isPositionFree(position)) {
                        this._hoverSlice.dx = x;
                        this._hoverSlice.dy = y;
                        this._hoverSlice.currentPosition = position;

                        var player = document.querySelector("#dropRing");
                        player.play();

                        return;
                    }
                    position += 1;
                }
            }
        },

        _roundedImage: function (img, sx, sy, sw, sh, dx, dy, dw, dh, radius) {
            this._ctx.save();

            this._ctx.beginPath();
            this._ctx.moveTo(dx + radius, dy);
            this._ctx.lineTo(dx + dw - radius, dy);
            this._ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + radius);
            this._ctx.lineTo(dx + dw, dy + dh - radius);
            this._ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - radius, dy + dh);
            this._ctx.lineTo(dx + radius, dy + dh);
            this._ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - radius);
            this._ctx.lineTo(dx, dy + radius);
            this._ctx.quadraticCurveTo(dx, dy, dx + radius, dy);
            this._ctx.closePath();

            this._ctx.clip();

            this._ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

            this._ctx.restore();
        },

        _isGameWin: function () {
            for (let i = 0; i < this._slices.length; i++) {
                if (this._slices[i].currentPosition != this._slices[i].rightPosition) {
                    return false;
                }
            }
            return true;
        },

        replay: function (col, row) {
            this._colNum = col || 2;
            this._rowNum = row || 2;

            this._hoverSlice = null;
            this._slices.length = 0;
            this._sliceWidth = this._boardWidth / this._colNum;
            this._sliceHeight = this._boardHeight / this._rowNum;

            this._isRunning = true;
        },

        init: function () {
            var that = this;

            this._resizeCanvas();

            window.onresize = function () {
                that._resizeCanvas();
            }

            loadImage(this._imageUrl, function (image) {
                that._originImage = image;

                resizeImage(image, that._boardWidth, that._boardHeight, function (resizedImg) {
                    that._resizedImage = resizedImg;

                    that._canvas.onmousemove = function (evt) {
                        if (!that._isRunning) {
                            return;
                        }

                        that._mousePosition.x = evt.offsetX;
                        that._mousePosition.y = evt.offsetY;

                        that._updateHoverSlice();

                        if (that._hoverSlice) {
                            if (that._mouseDown && that._startDragMousePosition && that._startDragSlicePosition) {
                                that._hoverSlice.dx = evt.offsetX - (that._startDragMousePosition.x - that._startDragSlicePosition.x);
                                that._hoverSlice.dy = evt.offsetY - (that._startDragMousePosition.y - that._startDragSlicePosition.y);

                                that._correctHoverSliceCoord();
                            }
                        }
                    };

                    that._canvas.onmousedown = function (evt) {
                        if (!that._isRunning) {
                            return;
                        }

                        if (that._hoverSlice) {
                            that._startDragSlicePosition = { x: that._hoverSlice.dx, y: that._hoverSlice.dy };
                        }
                        that._startDragMousePosition = { x: that._mousePosition.x, y: that._mousePosition.y };
                        that._mouseDown = true;
                    };
                    that._canvas.onmouseup = function (evt) {
                        if (!that._isRunning) {
                            return;
                        }
                        that._startDragSlicePosition = null;
                        that._startDragMousePosition = null;
                        that._mouseDown = false;

                        that._autoAbsorb();

                        if (that._isGameWin()) {
                            that._isRunning = false;

                            var player = document.querySelector("#winRing");
                            player.play();

                            flyBallon(function () {
                                $("#myModal").modal('show');
                            });
                        }
                    };
                    // 触屏设备
                    that._canvas.ontouchmove = function (evt) {
                        evt.preventDefault();
                        that._canvas.onmousemove({
                            offsetX: evt.changedTouches[0].pageX,
                            offsetY: evt.changedTouches[0].pageY - (window.innerHeight - that._canvas.height)
                        });
                    };
                    // 触屏设备
                    that._canvas.ontouchstart = function (evt) {
                        evt.preventDefault();
                        if (!that._isRunning) {
                            return;
                        }
                        that._mousePosition.x = evt.changedTouches[0].pageX;
                        that._mousePosition.y = evt.changedTouches[0].pageY - (window.innerHeight - that._canvas.height);

                        that._updateHoverSlice();

                        that._canvas.onmousedown();
                    };
                    // 触屏设备
                    that._canvas.ontouchend = function (evt) {
                        evt.preventDefault();
                        that._canvas.onmouseup();
                    };
                    window.requestAnimationFrame(_redraw);
                });
            });
        }
    };

    function _redraw() {
        if (jigsawGame._resizedImage === undefined) {
            window.requestAnimationFrame(_redraw);
            return;
        }
        jigsawGame._ctx.clearRect(0, 0, jigsawGame._canvas.width, jigsawGame._canvas.height);

        if (jigsawGame._slices.length <= 0) {
            jigsawGame._createSlices(jigsawGame._canvas.width, jigsawGame._canvas.height);
        }

        // draw background
        jigsawGame._ctx.globalAlpha = 0.4;
        jigsawGame._roundedImage(jigsawGame._resizedImage, 0, 0, jigsawGame._boardWidth, jigsawGame._boardHeight, (jigsawGame._canvas.width - jigsawGame._boardWidth) / 2, (jigsawGame._canvas.height - jigsawGame._boardHeight) / 2, jigsawGame._boardWidth, jigsawGame._boardHeight, 10);
        jigsawGame._ctx.globalAlpha = 1;

        for (var i = 0; i < jigsawGame._slices.length; i++) {
            var slice = jigsawGame._slices[i];
            if (jigsawGame._hoverSlice && jigsawGame._hoverSlice.id == slice.id) {
                continue;
            }
            jigsawGame._ctx.drawImage(jigsawGame._resizedImage, slice.sx, slice.sy, slice.sWidth, slice.sHeight,
                slice.dx, slice.dy, slice.dWidth, slice.dHeight);
        }
        // draw hover slice
        if (jigsawGame._hoverSlice) {
            jigsawGame._ctx.drawImage(jigsawGame._resizedImage, jigsawGame._hoverSlice.sx, jigsawGame._hoverSlice.sy, jigsawGame._hoverSlice.sWidth, jigsawGame._hoverSlice.sHeight,
                jigsawGame._hoverSlice.dx, jigsawGame._hoverSlice.dy, jigsawGame._hoverSlice.dWidth, jigsawGame._hoverSlice.dHeight);
            if (jigsawGame._isRunning) {
                jigsawGame._ctx.strokeStyle = jigsawGame._borderColor;
                jigsawGame._ctx.strokeRect(jigsawGame._hoverSlice.dx, jigsawGame._hoverSlice.dy, jigsawGame._hoverSlice.dWidth, jigsawGame._hoverSlice.dHeight);
            }
        }

        // draw copyright
        jigsawGame._ctx.font = "11px Helvetica Neue";
        jigsawGame._ctx.fillStyle = "#ccc";
        jigsawGame._ctx.textBaseline = "bottom";
        jigsawGame._ctx.textAlign = "center";
        jigsawGame._ctx.fillText("Copyright©kuzzh 2018", jigsawGame._canvas.width / 2, jigsawGame._canvas.height);

        window.requestAnimationFrame(_redraw);
    }

    return jigsawGame;
};