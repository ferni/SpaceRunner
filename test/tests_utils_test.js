module("tests_utils.js");
asyncTest("tests.onLevelLoaded", function(){
	expect(1);
	tests.onLevelLoaded(function(){
		ok(me.state.isCurrent(me.state.PLAY), "State is PLAY.");
		start();
	});
});

shipTest("shipTest", function(){
	equal(me.levelDirector.getCurrentLevelId(), "test");
});