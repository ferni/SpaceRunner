function Ship(tmxName) {
    'use strict';
    this.tmxName = tmxName;
    this._buildings = [];
    this.buildings = function () {
        return this._buildings;
    };
    //this should be called when the user builds something
    this.buildAt = function (x, y, buildingType) {
        var self = this,
        building = utils.makeItem(buildingType),
        canBuild = building.canBuildAt(x, y, this),
        canBuildRotated;
        if (!canBuild) {
            canBuildRotated = building.canBuildRotated(x, y, this);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if (canBuild || canBuildRotated) {
            building.x(x).y(y);
            //remove anything in its way
            utils.itemTiles(building, function (iX, iY) {
                self.removeAt(iX, iY);
            });
            this.add(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    };

    //Adds an item to the ship ignoring its placement rules
    this.add = function (item) {
        me.game.add(item, item.zIndex);
        item.onShip(true);
        this.buildingsChanged();
    };
    this.removeAt = function (x, y) {
        while (this.mapAt(x, y).name === 'item') {
            this.remove(this.mapAt(x, y), true);
        }
    };
    this.remove = function (item, updateBuildings) {
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        me.game.remove(item, true);

        if (updateBuildings) {
            this.buildingsChanged();
        }
    };

    this.removeAll = function () {
        var self = this;
        _.each(this.buildings(), function (building) {
            self.remove(building, false);
        });
        this.buildingsChanged();
    };
    //to call whenever buildings change
    this.buildingsChanged = function () {
        this._buildings = _.filter(me.game.getEntityByName('item'),
            function (item) {
                return item.onShip();
            });
        this.buildingsMap.update();
        this.onBuildingsChanged();
        
    };
    this.onBuildingsChanged = function() {};
    this._map = null;
    this.map = function () {
        if (this.buildingsMap.changed || this.hullMap.changed ||
            this._map === null) {
            this._map = this._getJointMap();
            this.buildingsMap.changed = false;
            this.hullMap.changed = false;
        }
        return this._map;
    };
    this.mapAt = function (x, y) {
        if (this.map()[y] !== undefined && this.map()[y][x] !== undefined) {
            return this.map()[y][x];
        }
        return null;
    };
    this.buildingsMap = {
        thisShip: this,
        changed: true,
        _buildingsMap: null,
        update: function () {
            var self = this;
            self._buildingsMap = utils.getEmptyMatrix(WIDTH(), HEIGHT(),
                charMap.codes._cleared);
            _.each(self.thisShip.buildings(), function (b) {
                if (!b.hidden()) {
                    utils.itemTiles(b, function (x, y) {
                        self._buildingsMap[y][x] = b;
                    });
                }
            });

            this.changed = true;
        },
        get: function () {
            if (this._buildingsMap === null) {
                this.update();
            }
            return this._buildingsMap;
        }
    };
    this.hullMap = {
        changed: true,
        _hullMap: null,
        update: function () {
            
            this._hullMap = charMap.get();
            this._changed = true;
        },
        get: function () {
            if (this._hullMap === null) {
                this.update();
            }
            return this._hullMap;
        }
    };
    //joins hullMap and buildingsMap
    this._getJointMap = function () {
        var self = this,
        joint = utils.getEmptyMatrix(WIDTH(), HEIGHT(), charMap.codes._cleared);
        utils.levelTiles(function (x, y) {
            joint[y][x] = self.hullMap.get()[y][x];
            if (self.buildingsMap.get()[y][x] !== charMap.codes._cleared) {
                joint[y][x] = self.buildingsMap.get()[y][x];
            }
        });
        return joint;
    };
    this.toJsonString = function () {
        return JSON.stringify(_.map(this.buildings(), function (b) {
            return {
                type: b.type,
                x: b.x(),
                y: b.y(),
                rotated: b.rotated()
            };
        }));
    };
    this.fromJsonString = function (jsonString) {
        var itemArray, item, i;
        this.removeAll();
        itemArray = JSON.parse(jsonString);
        for (i = 0; i < itemArray.length; i++) {
            item = utils.makeItem(itemArray[i].type);
            item.x(itemArray[i].x)
                .y(itemArray[i].y)
                .rotated(itemArray[i].rotated);
            this.add(item);
        }
        this.buildingsChanged();
    };

}

var ships = {
    
};