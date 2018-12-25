
const COL_NUM = 2,
    ROW_NUM = 2;
// 自动吸附有效距离
const ABSORB_DISTANCE = 30,
    INVALID_POSITION = -1;

var JigsawGame = function (canvas, imageUrl) {
    var jigsawGame = {
        that: this,
        _isRunning: true,
        _imageUrl: imageUrl,
        _image: null,
        _canvas: canvas,
        _ctx: canvas.getContext("2d"),
        _boardWidth: 600,
        _boardHeight: 600,
        _sliceWidth: this._boardWidth / COL_NUM,
        _sliceHeight: this._boardHeight / ROW_NUM,
        _mousePosition: { x: 0, y: 0 },
        _slices: [],
        _hoverSlice: null,
        _mouseDown: false,
        _startDragSlicePosition: null,
        _startDragMousePosition: null,

        _createSlices: function () {
            let position = 0;
            for (let col = 0; col < COL_NUM; col++) {
                for (let row = 0; row < ROW_NUM; row++) {
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

        _updateSlices: function () {
            for (let i = 0; i < this._slices.length; i++) {
                let slice = this._slices[i];
                slice.dWidth = this._sliceWidth;
                slice.dHeight = this._sliceHeight;
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

        _resizeCanvas: function () {
            let backBtn = $('#btnBack');
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
            this._sliceWidth = this._boardWidth / COL_NUM;
            this._sliceHeight = this._boardHeight / ROW_NUM;

            this._updateSlices();
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
            for (let col = 0; col < COL_NUM; col++) {
                for (let row = 0; row < ROW_NUM; row++) {
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

        _isGameWin: function () {
            for (let i = 0; i < this._slices.length; i++) {
                if (this._slices[i].currentPosition != this._slices[i].rightPosition) {
                    return false;
                }
            }
            return true;
        },

        replay: function () {
            this._isRunning = true;
            this._hoverSlice = null;
            this._slices.length = 0;
        },

        init: function () {
            var that = this;

            this._resizeCanvas();

            window.onresize = function () {
                that._resizeCanvas();
            }

            loadImage(this._imageUrl, this._boardWidth, this._boardHeight, function (image) {
                that._image = image;

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
                    that._canvas.onmousemove({
                        offsetX: evt.touches[0].clientX,
                        offsetY: evt.touches[0].clientY - (screen.height - that._canvas.height)
                    });
                };
                // 触屏设备
                that._canvas.ontouchstart = function (evt) {
                    if (!that._isRunning) {
                        return;
                    }
                    console.log(evt)
                    that._mousePosition.x = evt.touches[0].clientX;
                    that._mousePosition.y = evt.touches[0].clientY - (screen.height - that._canvas.height);

                    that._updateHoverSlice();

                    that._canvas.onmousedown();
                };
                // 触屏设备
                that._canvas.ontouchend = function (evt) {
                    that._canvas.onmouseup();
                };
                window.requestAnimationFrame(_redraw);
            });
        }
    };

    function _redraw() {
        if (jigsawGame._image === undefined) {
            window.requestAnimationFrame(_redraw);
            return;
        }
        jigsawGame._ctx.clearRect(0, 0, jigsawGame._canvas.width, jigsawGame._canvas.height);

        if (jigsawGame._slices.length <= 0) {
            jigsawGame._createSlices(jigsawGame._canvas.width, jigsawGame._canvas.height);
        }

        // draw background
        jigsawGame._ctx.globalAlpha = 0.4;
        jigsawGame._ctx.drawImage(jigsawGame._image, 0, 0, jigsawGame._boardWidth, jigsawGame._boardHeight, (jigsawGame._canvas.width - jigsawGame._boardWidth) / 2, (jigsawGame._canvas.height - jigsawGame._boardHeight) / 2, jigsawGame._boardWidth, jigsawGame._boardHeight);
        jigsawGame._ctx.globalAlpha = 1;

        for (var i = 0; i < jigsawGame._slices.length; i++) {
            var slice = jigsawGame._slices[i];
            if (jigsawGame._hoverSlice && jigsawGame._hoverSlice.id == slice.id) {
                continue;
            }
            jigsawGame._ctx.drawImage(jigsawGame._image, slice.sx, slice.sy, slice.sWidth, slice.sHeight,
                slice.dx, slice.dy, slice.dWidth, slice.dHeight);
        }
        if (jigsawGame._hoverSlice) {
            jigsawGame._ctx.drawImage(jigsawGame._image, jigsawGame._hoverSlice.sx, jigsawGame._hoverSlice.sy, jigsawGame._hoverSlice.sWidth, jigsawGame._hoverSlice.sHeight,
                jigsawGame._hoverSlice.dx, jigsawGame._hoverSlice.dy, jigsawGame._hoverSlice.dWidth, jigsawGame._hoverSlice.dHeight);
            if (jigsawGame._isRunning) {
                jigsawGame._ctx.strokeRect(jigsawGame._hoverSlice.dx, jigsawGame._hoverSlice.dy, jigsawGame._hoverSlice.dWidth, jigsawGame._hoverSlice.dHeight);
            }
        }

        window.requestAnimationFrame(_redraw);
    }

    return jigsawGame;
};