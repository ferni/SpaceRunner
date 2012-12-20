window.pr = {
    PlacementRule: function (settings) {//settings: tile, inAny, inAll
        this.tile = settings.tile; //sugar for tileSatisfies = function(tile){return tile == <tile>;}
        this.inAny = settings.inAny; //coordenadas relativas al cuadro superior izquierdo del objeto, son objetos {x, y}
        this.inAll = settings.inAll; //igual
        this.tileCondition = settings.tileCondition; // function(tile) , returns bool
        if (this.tileCondition === undefined && this.tile !== undefined) {
            var wantedTile = this.tile;
            this.tileCondition = function (tile) { return tile == wantedTile; };
        }
        this.compliesAt = function (x, y, map) {
            return pr.utils.checkIsInAny(map, this.tileCondition, this.inAny, { x: x, y: y })
                && pr.utils.checkIsInAll(map, this.tileCondition, this.inAll, { x: x, y: y });
        };
    },
    make: {
        //has to have enough space
        spaceRule: function (tileCondition, width, height) {
            var coordArray = [];
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    coordArray.push({ x: x, y: y });
                }
            }
            var settings = {
                inAll : coordArray
            };
            if(_.isFunction(tileCondition))
                settings.tileCondition = tileCondition;
            else
                settings.tile = tileCondition; //tileCondition is just a tile
            
            return new pr.PlacementRule(settings);
        },
        //has to be next to something
        nextToRule: function (tileCondition, width, height) {
            var coordArray = [];
            for (var x = 0; x < width; x++) {
                coordArray.push({ x: x, y: -1 }); //top
                coordArray.push({ x: x, y: height }); //bottom
            }
            for (var y = 0; y < height; y++) {
                coordArray.push({ x: -1, y: y }); //left
                coordArray.push({ x: width, y: y }); //right
            }
            var settings = {
                inAny: coordArray
            };
            if (_.isFunction(tileCondition))
                settings.tileCondition = tileCondition;
            else
                settings.tile = tileCondition; //tileCondition is just a tile
            
            return new pr.PlacementRule(settings);
        }
    },
    utils: {
        //check if a tile is at any of the positions in the "relativeCoordinates" parameter
        checkIsInAny: function (tileMap, tileCondition, relativeCoordinates, currentCoordinate, areEqual) {
            return pr.utils.checkIsInAnyOrAll(tileMap, tileCondition, relativeCoordinates, currentCoordinate, true);
        },
        //check if a tile is at all of the positions in the "relativeCoordinates" parameter
        checkIsInAll: function (tileMap, tileCondition, relativeCoordinates, currentCoordinate) {
            return pr.utils.checkIsInAnyOrAll(tileMap, tileCondition, relativeCoordinates, currentCoordinate, false);
        },
        checkIsInAnyOrAll: function (tileMap, tileCondition, relativeCoordinates, currentCoordinate, inAny) {
            if (!relativeCoordinates || relativeCoordinates.length == 0) return true;
            for (var coor = 0; coor < relativeCoordinates.length; coor++) {
                var wantedTileCoordinate = relativeCoordinates[coor];
                var row = tileMap[currentCoordinate.y + wantedTileCoordinate.y];
                var tileAtCoordinate = null;
                if (row)
                    tileAtCoordinate = row[currentCoordinate.x + wantedTileCoordinate.x];
                if (inAny && tileAtCoordinate && tileCondition(tileAtCoordinate)) {
                    return true;
                }
                if (!inAny && (!tileAtCoordinate || !tileCondition(tileAtCoordinate))) {
                    return false;
                }
            }
            return !inAny;
        }

    }
};