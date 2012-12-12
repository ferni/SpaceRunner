/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// game resources
var g_resources = [
                    {name: "outline",         type: "image",     src: "data/img/render/outline.png"},
                    {name: "small",         type: "tmx",     src: "data/outlines/small.tmx"},
                    {name: "selector",         type: "image",     src: "data/img/render/selector.png"},
                    {name: "weapon",         type: "image",     src: "data/img/render/weapon_01.png"},
                    {name: "engine",         type: "image",    src: "data/img/render/engine_01.png"},
                    {name: "power",         type: "image",     src: "data/img/render/power_01.png"},
                    {name: "console",         type: "image",     src: "data/img/render/console_02.png"},
                    {name: "component",        type: "image",     src: "data/img/render/components_01.png"},
                    {name: "door",            type: "image",     src: "data/img/render/door_01.png"},
                    {name: "wall",            type: "image",     src: "data/img/render/wall_001.png"},
                    {name: "colTile",        type: "image",    src: "data/img/render/metatiles32x32.png"},
                    {name: "test",          type: "tmx",       src: "data/outlines/test.tmx"}
                ];

var g_resources_size = [
                    {name: "outline",         width: 192,     height: 256},
                    {name: "small",         width: 576,     height: 384},
                    {name: "selector",         width: 32,         height: 32},
                    {name: "weapon",         width: 96,         height: 64},
                    {name: "engine",         width: 96,         height: 64},
                    {name: "power",         width: 64,         height: 64},
                    {name: "console",         width: 32,         height: 32},
                    {name: "component",        width: 64,         height: 64},
                    {name: "door",            width: 64,         height: 32},
                    {name: "wall",            width: 32,         height: 32},
                    {name: "test",         width: 576,     height: 384}
                        ];

//indexes for the g_resources array.
var idx = {
    weapon: 3,
    engine: 4,
    power: 5,
    console: 6,
    component: 7,
    door: 8,
    wall: 9
};

//returns the name of the object given the index
function getItemName(index){
    if(!g_resources[index]){
        return null;
    }
    return g_resources[index].name;
}

function getQueriedShip() {
    var defaultShip = "small";
    var ship = getParameterByName("ship");
    if(ship === null) return defaultShip;
    for (var i = 0; i < g_resources.length; i++) {
        if(g_resources[i].name == ship && g_resources[i].type == "tmx") {
            return ship;
        }
    }
    alert("Ship \"" + ship + "\" doesn't exist. Loading \""+defaultShip+"\" instead.");
    return defaultShip;
    
}


var select_item = -1;
var isSelectObject = false;
var SelectObject = null;
var isDragable = false;
var wallDrawing = false;
var DeleteObject = null;
var GameScreen = null;

//var weaponmng = new WeaponMng();

var jsApp = {
    /* ---

     Initialize the jsApp

     --- */
    onload: function() {
        // init the video
        if (!me.video.init('jsapp', g_resources_size[1].width, g_resources_size[1].height)) {
            alert("Sorry but your browser does not support html 5 canvas.");
            return;
        }
        // initialize the "audio"
//        me.audio.init("mp3,ogg");
        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this);
        // set all resources to be loaded
        me.loader.preload(g_resources);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
     callback when everything is loaded
     --- */
    loaded: function() {
        // set the "Play/Ingame" Screen Object
        GameScreen = new PlayScreen;
        me.state.set(me.state.PLAY, GameScreen);
        // start the game
        me.state.change(me.state.PLAY);
    },
    // get tile row and col from pixels
    getTilePosition: function(x, y) {
        var pos = {};
        pos.x = Math.floor(x / me.game.currentLevel.tilewidth);
        pos.y = Math.floor(y / me.game.currentLevel.tileheight);
        return pos;
    },
    // get tile position in pixels from pixels
    getTilePosPixels: function(x, y) {
        var tilePos = this.getTilePosition(x, y);
        var pos = [];
        pos.x = tilePos.x * me.game.currentLevel.tilewidth;
        pos.y = tilePos.y * me.game.currentLevel.tileheight;
        return pos;
    },
    // get tile position in pixels from row and col
    getTileCoord: function(x, y) {
        var pos = [];
        pos.x = x * me.game.currentLevel.tilewidth;
        pos.y = y * me.game.currentLevel.tileheight;
        return pos;
    },
    initLevel : function(){
         me.game.reset();
         me.levelDirector.loadLevel(getQueriedShip());
//         me.state.set(me.state.PLAY, GameScreen);
    },
};

var checkCollision = {
    RedScreen : [],
    RedIndex : 0,
    TileWidth : 0,
    TileHeight : 0,
    init : function(){
        this.TileWidth = me.game.currentLevel.tilewidth;
        this.TileHeight = me.game.currentLevel.tileheight;
    },
    printRedStyle : function(mX, mY){
        this.RedScreen[this.RedIndex] = new RedColorObject(mX, mY, {});
        me.game.add(this.RedScreen[this.RedIndex], 101);
        this.RedIndex ++;
    },
    removeRedStyle : function(){
        var i = 0;
        for(i = this.RedIndex; i > 0; i -- )
        {
            me.game.remove(this.RedScreen[i - 1]);
            delete this.RedScreen[i - 1];
        }
        this.RedIndex = 0;
    },
    /**/
    
    /* check and process collision of obj*/
    processCollision : function(CurObj){
        return CurObj.processCollision();
    },
    
};
// jsApp
/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({
    iItemID : 0,
    init : function(){
        this.parent(true);
    },
   onResetEvent: function()
    {
        this.parent(true);
        me.game.reset();
        // stuff to reset on state change
        me.levelDirector.loadLevel(getQueriedShip());
        me.game.sort();
        me.input.bindKey(me.input.KEY.ESC,  "escape");
        me.input.registerMouseEvent('mousedown', me.game.viewport, this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport, this.mouseMove.bind(this));
        me.input.registerMouseEvent('mouseup',      me.game.viewport, this.mouseUp.bind(this));
        me.video.getScreenCanvas().addEventListener("dblclick", this.mouseDbClick, false);
		
        checkCollision.init();
        MapMatrix.init();
    },
	
    update : function(){
        this.addAsObject = true;
        if( me.input.isKeyPressed("escape") )
        {
            if((SelectObject && select_item != -1) || DeleteObject)
                onMouseClickItem();
        }
    },
    mouseDbClick : function(e) {
        if(SelectObject)
        {
            if(SelectObject.mResource == 101)
            {
                removeClassItem(9);
                ObjectsMng.addObject(SelectObject);
            }
            else
                removeClassItem(SelectObject.mResource);
            if(SelectObject.mResource != 101 && checkCollision.processCollision(SelectObject))
            {
                me.game.remove(SelectObject);
                delete SelectObject;
            }
            checkCollision.removeRedStyle();
            SelectObject = null;
        }
        isDragable = false;
        select_item = -1;
        wallDrawing = false;
        
        me.game.sort();
        me.game.repaint();
        
    },
    mouseDown: function(e) {
    },
    mouseMove : function(e){
        var mX = me.input.mouse.pos.x;
        var mY = me.input.mouse.pos.y;
        if(select_item != -1)
        {
            if(select_item == 101)
            {
                mX -= (Math.floor(g_resources_size[9].width / (32 * 2)) * 32);
                mY -= (Math.floor(g_resources_size[9].height / (32 * 2)) * 32);
            }
            else
            {
                mX -= (Math.floor(g_resources_size[select_item].width / (32 * 2)) * 32);
                mY -= (Math.floor(g_resources_size[select_item].height / (32 * 2)) * 32);
            }
            var mPos = jsApp.getTilePosPixels(mX, mY);
            if(isDragable == false)
            {
                switch(select_item)
                {
                case 3:
                    SelectObject = new iWeaponObject(mPos.x, mPos.y, {}, this.iItemID);
                    me.game.add( SelectObject, 100 );
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 4:
                    SelectObject = new iEngineObject(mX, mY, {}, this.iItemID);
                    me.game.add( SelectObject, 100);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 5:
                    SelectObject = new iPowerObject(mX, mY, {}, this.iItemID);
                    me.game.add( SelectObject, 100);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 6:
                    SelectObject = new iConsoleObject(mX, mY, {}, this.iItemID);
                    me.game.add( SelectObject, 100);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 7:
                    SelectObject = new iComponentObject(mX, mY, {}, this.iItemID);
                    me.game.add( SelectObject, 100);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 8:
                    SelectObject = new iDoorObject(mX, mY, {}, this.iItemID);
                    me.game.add( SelectObject, 110);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                case 9:
                    SelectObject = new WallGroupObject(this.iItemID);
                    SelectObject.addWallObject(mPos.x, mPos.y);
                    this.iItemID ++;
                    isDragable = true;
                    break;
                }
            }
            else if( select_item == 9 )
            {
                SelectObject.process(wallDrawing, mPos);
            }
            else if(SelectObject)
            {
                if(SelectObject.mResource == 101)
                    SelectObject.movePorcess(mPos.x, mPos.y);
                else
                {
                    if(SelectObject.mResource == 8 && SelectObject.rotateFlag)
                    {
                        SelectObject.pos.x = mPos.x + 16;
                        SelectObject.pos.y = mPos.y - 16;
                    }
                    else
                    {
                        SelectObject.pos.x = mPos.x;
                        SelectObject.pos.y = mPos.y;
                    }
                    if(SelectObject.mResource == 8)
                        SelectObject.processRotate();
                    /* collision check */
                    checkCollision.processCollision(SelectObject);
                }
            }
        }
        me.game.sort();
        me.game.repaint();
    },
    mouseUp : function(e){
        /* check collision */
        if(select_item == 9)
        {
            if(wallDrawing == false && 
               !checkCollision.processCollision(SelectObject.getFirstWallObject()))
                    wallDrawing = true;
            else if(wallDrawing == true)
                    SelectObject.setFixFlag();
        }
        else
        {
            if(SelectObject && SelectObject.mid != 101)
            {
                isDragable = checkCollision.processCollision(SelectObject);
                if(!isDragable)
                {
                    SelectObject.mfix = true;
                    if(SelectObject.mResource == 8)
                    {
                        if(!SelectObject.rotateFlag)
                            SelectObject.setCurrentAnimation("v_open_close");
                        else
                            SelectObject.setCurrentAnimation("h_open_close");
                        /* remove wall */
                        SelectObject.removeWallinCollision();
                        SelectObject = null;
                    }
                    else if(SelectObject.mResource == 7 )
                        SelectObject.setCurrentAnimation("charge");
                    if(SelectObject)
                        MapMatrix.setUnWalkable(SelectObject.pos.x, SelectObject.pos.y, SelectObject.width, SelectObject.height);
                }
            }
            else
                isDragable = false;
        }
        me.game.sort();
        me.game.repaint();
    },
    /* ---
     action to perform when game is finished (state change)
     --- */
    onDestroyEvent: function() {
    }
});

//bootstrap :)
window.onReady(function() {
    jsApp.onload();
});