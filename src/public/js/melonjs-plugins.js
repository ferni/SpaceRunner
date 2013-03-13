me.plugin.patch(me.TMXTileMap, 'load', function(){
	this.parent();
	this.mapLayers.push(new me.ColorLayer('background_color', '#000000',
		this.z - 10));
});