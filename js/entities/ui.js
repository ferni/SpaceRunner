/* */
var RedColorObject = TileObject.extend({
    init : function (x, y){
        this.type = "selector";
        this.size = [1, 1];
        this.parent(x, y , {});
        this.zIndex = 200;
    },
});