th.onLevelReady(function () {
    module("entities/core.js");
    test("ItemObject.trueSize()", function () {
        var door = utils.makeItem("door");
        deepEqual(door.size, [2, 1]);
        deepEqual(door.trueSize(), [2, 1]);

        door.rotated(true);
        deepEqual(door.trueSize(), [1, 2]);
        equal(door.trueSize(0), 1);
        equal(door.trueSize(1), 2);
    });

    test("ItemObject onShip/offShip animations", function () {
        var door = utils.makeItem("door");
        deepEqual(door.offShipAnimations, ["idle"]);
        deepEqual(door.onShipAnimations, ["h_open_close", "v_open_close"]);
        ok(!door.onShip(), "door is not on ship");
        ok(!door.rotated(), "door is not rotated");
        
        door.onShip(true); //not really ;)
        ok(door.isCurrentAnimation("h_open_close"), "on ship it has 'h_open_close' animation");

        door.rotated(true);
        door.onShip(false);
        ok(door.isCurrentAnimation("idle"), "door is rotated and off ship," +
            " but since it doesn't have off ship rotated animation, it uses 'idle'");

    });
});