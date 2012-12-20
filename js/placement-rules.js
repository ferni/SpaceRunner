window.pr = {
    PlacementRule: function (settings) {//settings: tile, inAny, inAll
        this.tile = settings.tile; //codigo caracter de tile (s, l, f, W, P ,etc) solid, left, front, Weapon, Power, etc
        this.inAny = settings.inAny; //coordenadas relativas al cuadro superior izquierdo del objeto, son objetos {x, y}
        this.inAll = settings.inAll; //igual
        this.compliesAt = function (x, y, map) {
            return pr.utils.checkIsInAny(map, this.tile, this.inAny, { x: x, y: y })
                && pr.utils.checkIsInAll(map, this.tile, this.inAll, { x: x, y: y });
        };
    },
    make: {
        //has to have enough space
        spaceRule: function (spaceChar, width, height) {
            var coordArray = [];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    coordArray.push({ x: x, y: y });
                }
            }
            return new pr.PlacementRule({ tile: spaceChar, inAll: coordArray });
        }
    },
    utils: {
        //check if a tile is at any of the positions in the "relativeCoordinates" parameter
        checkIsInAny: function (tileMap, wantedTile, relativeCoordinates, currentCoordinate) {
            return pr.utils.checkIsInAnyOrAll(tileMap, wantedTile, relativeCoordinates, currentCoordinate, true);
        },
        //check if a tile is at all of the positions in the "relativeCoordinates" parameter
        checkIsInAll: function (tileMap, wantedTile, relativeCoordinates, currentCoordinate) {
            return pr.utils.checkIsInAnyOrAll(tileMap, wantedTile, relativeCoordinates, currentCoordinate, false);
        },
        checkIsInAnyOrAll: function (tileMap, wantedTile, relativeCoordinates, currentCoordinate, inAny) {
            if (!relativeCoordinates || relativeCoordinates.length == 0) return true;
            for (var coor = 0; coor < relativeCoordinates.length; coor++) {
                var wantedTileCoordinate = relativeCoordinates[coor];
                var row = tileMap[currentCoordinate.y + wantedTileCoordinate.y];
                var tileAtCoordinate = null;
                if (row)
                    tileAtCoordinate = row[currentCoordinate.x + wantedTileCoordinate.x];
                if (inAny && tileAtCoordinate && tileAtCoordinate == wantedTile) {
                    return true;
                }
                if (!inAny && (!tileAtCoordinate || tileAtCoordinate !== wantedTile)) {
                    return false;
                }
            }
            return !inAny;
        }
        
    }
};