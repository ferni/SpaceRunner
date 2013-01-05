var tests ={
    onLevelLoaded : function(callback){
        var interval = setInterval(function(){
            if(me.state.isCurrent(me.state.PLAY)){
                callback();
                clearInterval(interval);
            }
        },100);
    }
};

//a test that requires that the level is loaded
function loadedTest(testName, testFunction){
    asyncTest(testName, function() {
        tests.onLevelLoaded(function(){
            testFunction();
            start();
         });
    });
}

//a test that loads the "test" ship first
function shipTest(testName, testFunction){
    loadedTest(testName, function(){
        // set the "Play/Ingame" Screen Object
        me.state.set(me.state.PLAY, new PlayScreen("test"));
        // start the game
        me.state.change(me.state.PLAY, function(){
            testFunction();
        });
        
    });
}