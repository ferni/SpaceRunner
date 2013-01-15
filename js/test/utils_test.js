th.onLevelReady(function () {
    module("utils.js");
    test("getParameterByName", function () {
        equal(utils.getParameterByName("asdf"), null, "'asdf' not in query string");
    });

    test("getQueriedShip: queried ship not found", function () {
        var originalFunction = utils.getParameterByName;
        utils.getParameterByName = function () {
            return "unknownShip";
        };
        equal(utils.getQueriedShip(), "area_01", "'unknownShip' not found, returns default ship");
        utils.getParameterByName = originalFunction;
    });

    test("getQueriedShip", function () {
        var originalFunction = utils.getParameterByName;
        utils.getParameterByName = function () {
            return "test";
        };
        equal(utils.getQueriedShip(), "test");
        utils.getParameterByName = originalFunction;
    });

    test("toTileVector", function () {
        var tileVector = utils.toTileVector(new me.Vector2d(7, 7));
        equal(tileVector.x, 0);
        equal(tileVector.y, 0);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE, TILE_SIZE));
        equal(tileVector.x, 1);
        equal(tileVector.y, 1);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE - 1, TILE_SIZE));
        equal(tileVector.x, 0);
        equal(tileVector.y, 1);

    });

    test("getEmptyMatrix", function () {
        var matrix = utils.getEmptyMatrix(2, 3, 0);
        equal(matrix[0][0], 0);
        equal(matrix[0][1], 0);
        equal(matrix[1][0], 0);
        equal(matrix[1][1], 0);
        equal(matrix[2][0], 0);
        equal(matrix[2][1], 0);
        equal(matrix[0][2], undefined);
        equal(matrix[3], undefined);

    });

    test("makeItem: invalid item", function () {
        equal(utils.makeItem("asdf"), null);
    });

    test("getMouse", function () {
        var m = utils.getMouse();
        equal(m.x, 0);
        equal(m.y, 0);
    });
});