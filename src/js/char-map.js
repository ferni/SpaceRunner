window.charMap = {
    _current: null,
    codes: {
        _solid: "s",
        _front: "f",
        _back: "b",
        _cleared: "."
    },
    getCollisionTileChar: function (x, y) {
        var tileLayer = me.game.currentLevel.getLayerByName("collision");
        var tileId = tileLayer.getTileId(x + 1, y + 1);
        if (tileId == null)
            return charMap.codes._cleared;
        var tileSet = tileLayer.tilesets.getTilesetByGid(tileId);
        var tilePro = tileSet.getTileProperties(tileId);
        if (tilePro.isSolid)
            return charMap.codes._solid;
        else if (tilePro.isPlatform)
            return charMap.codes._back;
        else if (tilePro.isLeftSlope)
            return charMap.codes._front;
        else if (tilePro.isRightSlope)
            return charMap.codes._front;
    },
    get: function () {
        if (this._current !== null) return this._current;
        var tileWidth = me.game.currentLevel.tilewidth;
        var tileHeight = me.game.currentLevel.tileheight;
        var y, x;
        var pixelPos = { x: tileWidth / 2, y: tileHeight / 2 };
        this._current = new Array();
        for (y = 0; y < me.game.currentLevel.height; y++) {
            var row = [];
            pixelPos.x = tileWidth / 2;
            for (x = 0; x < me.game.currentLevel.width; x++) {
                row.push(this.getCollisionTileChar(pixelPos.x, pixelPos.y));
                pixelPos.x += tileWidth;
            }
            this._current.push("");
            this._current[y] = row.join("");
            pixelPos.y += tileHeight;
        }
        return this._current;
    }
};