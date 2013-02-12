var ShipSelectScreen = me.ScreenObject.extend({
    init: function () {
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'gray');
        
    },
    onResetEvent: function () {
        //me.game.add(new ShipSelectButton('Small', 100, 100, 'area_01'));
        //me.game.add(new ShipSelectButton('Test', 100, 140, 'test'));
        me.game.add(new ShipSelectButton('Cyborg: Battleship I', 100, 180, 'cyborg_battleship1'));
        me.game.sort();
        me.game.repaint();
    }

});