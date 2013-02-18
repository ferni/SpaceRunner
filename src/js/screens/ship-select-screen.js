var ShipSelectScreen = me.ScreenObject.extend({
    init: function () {
        this.parent();
    },
    onResetEvent: function () {
        me.video.clearSurface(me.video.getScreenContext(), 'gray');
        //me.game.add(new ShipSelectButton('Small', 100, 100, 'area_01'));
        //me.game.add(new ShipSelectButton('Test', 100, 140, 'test'));
        me.game.add(new Button('Cyborg', 200, 180));
        me.game.add(new ShipSelectButton('Frigate', 500, 180,
            'cyborg', 'frigate'));
        me.game.add(new ShipSelectButton('Cruiser', 500, 220,
            'cyborg', 'cruiser'));
        me.game.add(new ShipSelectButton('Battleship', 500, 260,
            'cyborg', 'battleship1'));
        me.game.add(new ShipSelectButton('Drone', 500, 300,
            'cyborg', 'drone'));
        
        me.game.sort();
        me.game.repaint();
    }

});