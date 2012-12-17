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
    spots: {
        getAllowedSpots: function (map, placementRules, objSize, cannonTile) {
            var mapHeight = map.length;
            var mapWidth = 0;
            if(map[0])
                mapWidth = map[0].length;
            var matrix = pr.utils.getZeroMatrix(mapWidth, mapHeight);
            var objWidth = objSize[0];
            var objHeight = objSize[1];
            for (var y = 0; y < mapHeight; y++) {
                for (var x = 0; x < mapWidth; x++) {
                    var compliesAll = true;
                    for (var r = 0; r < placementRules.length; r++) {
                        if (!placementRules[r].compliesAt(x, y, map)) {
                            compliesAll = false;
                            break;
                        }
                    };
                    if (compliesAll) {
                        for (var i = 0; i < objWidth; i++) {
                            for (var j = 0; j < objHeight; j++) {
                                matrix[y + j + cannonTile[1]][x + i + cannonTile[0]] = pr.spots.allowedZone;
                            }
                        }
                        matrix[y + cannonTile[1]][x + cannonTile[0]] = pr.spots.allowed;
                    }

                }
            }
            return matrix;
        },
        //Spot types
        forbidden: 0, //Forbidden spot
        allowed: 1, //Can place at that position
        allowedZone: 2 //Is part of an allowed zone
    }
    ,
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
        },
        getZeroMatrix: function (width, height) {
            var matrix = new Array();
            for (var i = 0; i < height; i++) {
                matrix.push(new Array());
                for (var j = 0; j < width; j++) {
                    matrix[i].push(0);
                }
            }
            return matrix;
        }
    }
};