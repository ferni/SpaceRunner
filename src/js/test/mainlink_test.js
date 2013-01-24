
module("mainlink.js");

asyncTest("Item click", function () {
    th.onLevelReady(function () {
        $(".items #item_weapon").trigger("click");
	    equal(ui.chosen.type, "weapon", "choose weapon");
	    ok($(".items #item_weapon").hasClass("chosen"), "weapon thumbnail has 'chosen' class");

	    $(".items #item_engine").trigger("click");
	    equal(ui.chosen.type, "engine", "choose engine");
	    ok($(".items #item_engine").hasClass("chosen"), "engine thumbnail has 'chosen' class");
	    ok(!$(".items #item_weapon").hasClass("chosen"), "now weapon does not longer have 'chosen' class");
	    start();
    });
});
