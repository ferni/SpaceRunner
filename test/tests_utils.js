function onLevelReady(callback){
        var interval = setInterval(function(){
            if(me.state.isCurrent(me.state.PLAY)){
                callback();
                clearInterval(interval);
            }
        },100);
}

function shipTest(testName, testFunction){
    //reset ship
    ship = new Ship();
    test(testName, testFunction);
}

var testShipPositions = {
    free: {x:4, y:4},
    engine: {x:3, y:1},
    weapon: {x:5, y:2},
    solid: {x:13, y:1}
};
