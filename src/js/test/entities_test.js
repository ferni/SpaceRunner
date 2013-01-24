    module("entities/core.js");
    asyncTest("ItemObject.trueSize()", function () {
	    th.onLevelReady(function(){
		    var door = utils.makeItem("door");
		    deepEqual(door.size, [2, 1]);
		    deepEqual(door.trueSize(), [2, 1]);

		    door.rotated(true);
		    deepEqual(door.trueSize(), [1, 2]);
		    equal(door.trueSize(0), 1);
		    equal(door.trueSize(1), 2);
		    start();
	    });
    });

    asyncTest("ItemObject onShip/offShip animations", function () {
	th.onLevelReady(function(){
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

		start();
	});
    });

    module("entities/items.js");
    asyncTest("engine proper placement", function () {
	    th.onLevelReady(function(){
		    ship.removeAll();
		    ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y, "engine"), "building succeeds");
		    start();
	    });
    });

    asyncTest("engine invalid placement", function () {
	th.onLevelReady(function(){
		ship.removeAll();
		ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y, "engine"), "building fails");
	    
		start();
	});
    });

    asyncTest("weapon proper placement", function () {
        th.onLevelReady(function(){
            ship.removeAll();
            ok(ship.buildAt(th.shipPositions.weapon.x, th.shipPositions.weapon.y, "weapon"), "building succeeds");
            start();
        });
	});

    asyncTest("weapon invalid placement", function () {
	    th.onLevelReady(function(){
            ship.removeAll();
            ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y, "weapon"), "building fails");
        	start();
	    });
	});

    asyncTest("Console placement", function () {
	    th.onLevelReady(function(){
            ship.removeAll();
            var x = th.shipPositions.free.x;
            var y = th.shipPositions.free.y;

            ok(!ship.buildAt(x, y, "console"), "Console building fails in the middle of nowhere");
            ok(ship.buildAt(x, y, "power"), "Power built");
            ok(ship.buildAt(x - 1, y, "console"), "Console building succeeds next to power");
        	start();
	    });
    });

    asyncTest("Wall building", function () {
	    th.restartGame(function(){
            var x = th.shipPositions.free.x;
            var y = th.shipPositions.free.y;
            ship.buildAt(x, y, "wall");
            equal(ui.mouseLockedOn.type, "wall", "Mouse locked on wall");

            th.mouseBegin();
            th.setMouse(x + 2, y);
            screen.mouseMove();
            screen.mouseDown({ which: me.input.mouse.LEFT });
            screen.mouseUp({ which: me.input.mouse.LEFT });
            th.setMouse(x + 2, y + 2);
            screen.mouseMove();
            screen.mouseDbClick({ which: me.input.mouse.LEFT });
            ok(!ui.mouseLockedOn, "Mouse unlocked after double click");
            equal(ship.mapAt(x, y).type, "wall");
            equal(ship.mapAt(x + 1, y).type, "wall");
            equal(ship.mapAt(x + 2, y).type, "wall");
            equal(ship.mapAt(x + 2, y + 1).type, "wall");
            equal(ship.mapAt(x + 2, y + 2).type, "wall");

            th.mouseEnd();

        	start();
	    });
	});
	
    asyncTest("Wall building canceled by escape key", function () {
        th.restartGame(function () {
            var x = th.shipPositions.free.x;
            var y = th.shipPositions.free.y;
            ui.choose("wall");
            th.mouseBegin();
            th.leftClick(x, y);
            equal(ui.mouseLockedOn.type, "wall", "Mouse locked on wall");

            th.leftClick(x + 2, y);
            th.leftClick(x + 2, y + 2);
            th.mouseEnd();
            //entire wall is seen on the screen...
            equal(ui.mapAt(x, y).type, "wall", "wall appears at x,y");
            equal(ui.mapAt(x + 1, y).type, "wall");
            equal(ui.mapAt(x + 2, y).type, "wall");
            equal(ui.mapAt(x + 2, y + 1).type, "wall");
            equal(ui.mapAt(x + 2, y + 2).type, "wall");
            //...but only the first one is built
            equal(ship.mapAt(x, y).type, "wall");
            notEqual(ship.mapAt(x + 1, y).type, "wall");
            notEqual(ship.mapAt(x + 2, y).type, "wall");
            notEqual(ship.mapAt(x + 2, y + 1).type, "wall");
            notEqual(ship.mapAt(x + 2, y + 2).type, "wall");

            me.input.triggerKeyEvent(me.input.KEY.ESC, true);
            screen.update();
            me.input.triggerKeyEvent(me.input.KEY.ESC, false);

            ok(!ui.mouseLockedOn, "Mouse no longer locked on wall after ESC key");
            //wall does no longer appear on the screen (except the cursor)
            equal(ui.mapAt(x, y).type, "wall", "Cursor still appears on the screen");
            notEqual(ui.mapAt(x + 1, y).type, "wall", "The rest of the wall is gone");
            notEqual(ui.mapAt(x + 2, y).type, "wall");
            notEqual(ui.mapAt(x + 2, y + 1).type, "wall");
            notEqual(ui.mapAt(x + 2, y + 2).type, "wall");
            //the first wall has been removed
            notEqual(ship.mapAt(x, y).type, "wall");
            start();
        });
    });
