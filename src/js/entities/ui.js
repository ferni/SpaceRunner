; /* */
var RedColorObject = TileObject.extend({
    init: function(x, y) {
        this.size = [1, 1];
        this.parent(x, y, {
            image: 'selector',
            name: 'red'
        });
        this.zIndex = 200;
    }
});