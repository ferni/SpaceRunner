onLevelReady(function(){
    module("utils.js");
    test("toTileVector", function(){
        var tileVector = utils.toTileVector(new me.Vector2d(7,7));
        equal(tileVector.x, 0);
        equal(tileVector.y, 0);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE,TILE_SIZE));
        equal(tileVector.x, 1);
        equal(tileVector.y, 1);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE - 1, TILE_SIZE));
        equal(tileVector.x, 0);
        equal(tileVector.y, 1);
        
    });
});