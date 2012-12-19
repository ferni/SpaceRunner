/* */
var RedColorObject = TileObject.extend({
    init : function (x, y, settings){
		var mSetting = me.ObjectSettings;
		mSetting.image = g_resources_size[2].name;
		mSetting.spritewidth = 32;
		mSetting.spriteheight = 32;
		mSetting.collidable = false;
        this.parent(x, y , mSetting);
        this.gravity = 0;
        this.collidable = false;
        this.type = g_resources_size[2].name;
    },
});