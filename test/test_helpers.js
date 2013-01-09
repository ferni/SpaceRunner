var th = {
    shipPositions: {
        free: { x: 4, y: 4 },
        engine: { x: 3, y: 1 },
        weapon: { x: 5, y: 2 },
        solid: { x: 13, y: 1 }
    },
    shipTest: function (testName, testFunction) {
        //reset ship
        ship.removeAll();
        test(testName, testFunction);
    },
    onLevelReady: function (callback) {
        var interval = setInterval(function () {
            if (me.state.isCurrent(me.state.PLAY)) {
                callback();
                clearInterval(interval);
            }
        }, 100);
    },
    //fakes the mouse position (x: tile column, y: tile row)
    setMouse: function (x, y) {
        if (!this._mousePosition) {
            this._mousePosition = {};
            //replace utils.getMouse function
            utils.getMouse = function () {
                var vector = new me.Vector2d();
                vector.x = th._mousePosition.x;
                vector.y = th._mousePosition.y;
                return vector;
            };
        }
        this._mousePosition.x = x;
        this._mousePosition.y = y;
    }
};
