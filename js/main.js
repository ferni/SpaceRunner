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
                        ];
/*collision detection point */
var colWeapon = [
                    {x: 10, y: 1}, 
                    {x: 11, y: 2},
                    {x: 12, y: 3},
                    {x: 13, y: 4},
                    {x: 14, y: 5},
                    {x: 13, y: 6},
                    {x: 12, y: 7},
                    {x: 11, y: 8},
                    {x: 10, y: 9}, 
                 ];
var colEngine = [
                    {x: 0, y: 1}, 
                    {x: 3, y: 4},
                    {x: 3, y: 5},
                    {x: 3, y: 6},
                    {x: 0, y: 9}, 
                 ];
var colPower = [
                {x: 1, y : 1, w : 11, h : 2},
                {x: 1, y : 9, w : 11, h : 2},
                {x: 4, y : 3, w : 2 , h : 6},
                ];
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
        var pos = [];
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
         me.levelDirector.loadLevel("small");
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
        /* get tile style : (none = 0 / solid = 1 / plateform = 2 / leftslope = 3 / right = 4)*/
    getCollisionTileStyle : function(pX, pY){
        var tileLayer = me.game.currentLevel.getLayerByName("collision");
        if(tileLayer == null)
            return 0;
        var tileId = tileLayer.getTileId(pX + 1, pY + 1);
        if(tileId == null)
            return 0;
        var tileSet = tileLayer.tilesets.getTilesetByGid(tileId);
        if(tileSet == null)
            return 0;
        var tilePro = tileSet.getTileProperties(tileId);
        if(tilePro.isSolid)
            return 2;
        else if(tilePro.isPlatform)
            return 1;
        else if(tilePro.isLeftSlope)
            return 3;
        else if(tilePro.isRightSlope)
            return 4;
        return 0;
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
    checkObjectCollision : function(CurObj){
        var res = me.game.collide(CurObj);
        var checkPoint = new me.Vector2d(0, 0);
        var mflag = true;
        if(CurObj.mResource == 8){//door
            if(CurObj.rotateFlag == false)
            {
                for( checkPoint.x = 0 ; checkPoint.x < CurObj.width; checkPoint.x += this.TileWidth )
                {
                    CurObj.updateColRect( checkPoint.x, this.TileWidth, 0, this.TileHeight );
                    res = me.game.collide( CurObj );
                    if(CurObj.mfix == true)
                    {
                        if(res)
                        {
                            this.printRedStyle( CurObj.pos.x + checkPoint.x, CurObj.pos.y );
                            mflag = false;
                        }
                    }
                    else{
                        if(!res ||res.obj.mResource != 9){
                            this.printRedStyle( CurObj.pos.x + checkPoint.x, CurObj.pos.y );
                            mflag = false;
                        }
                    }
                }
                CurObj.updateColRect(0, CurObj.width, 0, CurObj.height);
            }
            else{
                for( checkPoint.y = 0 ; checkPoint.y < CurObj.width; checkPoint.y += this.TileHeight )
                {
                    CurObj.updateColRect( 16, this.TileWidth, checkPoint.y - 16, this.TileHeight );
                    res = me.game.collide( CurObj );
                    if(CurObj.mfix == true)
                    {
                        if(res)
                        {
                            this.printRedStyle( CurObj.pos.x + 16,  CurObj.pos.y - 16 + checkPoint.y );
                            mflag = false;
                        }
                    }
                    else{
                        if(!res ||res.obj.mResource != 9){
                            this.printRedStyle( CurObj.pos.x + 16,  CurObj.pos.y - 16 + checkPoint.y );
                            mflag = false;
                        }
                    }
                }
                CurObj.updateColRect(16, CurObj.height, 0 - 16, CurObj.width);
            }
            return mflag;
        }
        else
        {
            if(!res)
                return true;
            for(checkPoint.x = CurObj.pos.x + 1; checkPoint.x < CurObj.pos.x + CurObj.width; checkPoint.x += this.TileWidth)
            {
                for(checkPoint.y = CurObj.pos.y + 1; checkPoint.y < CurObj.pos.y + CurObj.height; checkPoint.y += this.TileHeight)
                {
                    CurObj.updateColRect(checkPoint.x - CurObj.pos.x, this.TileWidth - 2, checkPoint.y - CurObj.pos.y, this.TileHeight - 2);
                    res = me.game.collide(CurObj);
                    if(res){
                        this.printRedStyle(checkPoint.x - 1, checkPoint.y - 1);
                    }
                }
            }
            CurObj.updateColRect(0, CurObj.width, 0, CurObj.height);
        }
        delete checkPoint;
        /* process red style rect */
        return false;
    },
    /* check and process collision of Weapon object with outline */
    checkOutlineCollisionWithWeapon : function(CurObj){
        var rectVector = new me.Vector2d(0, 0);
        var PossibleRect = new me.Rect(rectVector, 0, 0);
        var checkPoint = new me.Vector2d(0, 0);
        var i = 0;
        var mRet = true;
        for(i = 0; i < colWeapon.length; i ++)
        {
            rectVector.y = colWeapon[i].y * this.TileHeight;
            if(CurObj.pos.y == rectVector.y)
            {
                rectVector.x = colWeapon[i].x * this.TileWidth;
                rectVector.y = colWeapon[i].y * this.TileHeight;
                PossibleRect.set(rectVector, CurObj.width, CurObj.height);
                break;
            }
        }
        for(checkPoint.x = CurObj.pos.x + 1; checkPoint.x < CurObj.pos.x + CurObj.width; checkPoint.x += this.TileWidth)
        {
            for(checkPoint.y = CurObj.pos.y + 1; checkPoint.y < CurObj.pos.y + CurObj.height; checkPoint.y += this.TileHeight)
            {
                if(!PossibleRect.containsPoint(checkPoint))
                {
                    this.printRedStyle(checkPoint.x - 1, checkPoint.y - 1);
                    mRet = false;
                }
            }
        }
        delete PossibleRect;
        delete rectVector;
        delete checkPoint;
        return mRet;
    },
    /* check and process collision of Engine object with outline */
    checkOutlineCollisionWithEngine : function(CurObj){
        var rectVector = new me.Vector2d(0, 0);
        var PossibleRect = new me.Rect(rectVector, 0, 0);
        var checkPoint = new me.Vector2d(0, 0);
        var i = 0;
        var mRet = true;
        for(i = 0; i < colEngine.length; i ++)
        {
            rectVector.y = colEngine[i].y * this.TileHeight;
            if(CurObj.pos.y == rectVector.y)
            {
                rectVector.x = colEngine[i].x * this.TileWidth;
                rectVector.y = colEngine[i].y * this.TileHeight;
                PossibleRect.set(rectVector, CurObj.width, CurObj.height);
                break;
            }
        }
        for(checkPoint.x = CurObj.pos.x + 1; checkPoint.x < CurObj.pos.x + CurObj.width; checkPoint.x += this.TileWidth)
        {
            for(checkPoint.y = CurObj.pos.y + 1; checkPoint.y < CurObj.pos.y + CurObj.height; checkPoint.y += this.TileHeight)
            {
                if(!PossibleRect.containsPoint(checkPoint))
                {
                    this.printRedStyle(checkPoint.x - 1, checkPoint.y - 1);
                    mRet = false;
                }
            }
        }
        delete PossibleRect;
        delete rectVector;
        delete checkPoint;
        return mRet;
    },
    /* check and process collision of Power with outline */
    checkOutlineCollisionWithPower : function(CurObj){
        var mRet = true;
        var mX = 0;
        var mY = 0;
        for(mX = CurObj.pos.x + this.TileWidth / 2; mX < CurObj.pos.x + CurObj.width; mX += this.TileWidth)
        {
            for(mY = CurObj.pos.y + this.TileHeight / 2; mY < CurObj.pos.y + CurObj.height; mY += this.TileHeight)
            {
                if( CurObj.getTileStyle(mX, mY) != 0 )
                {
                    this.printRedStyle( mX - (this.TileWidth / 2), mY - (this.TileHeight / 2) );
                    mRet = false;
                }
            }
        }
        return mRet;
    },
    /* check and process collision of Console with outline */
    checkOutlineCollisionWithConsole : function(CurObj){
        var mRet = true;
        if(CurObj.getTileStyle(CurObj.pos.x + this.TileWidth / 2, CurObj.pos.y + this.TileHeight / 2) != 0)
        {
            this.printRedStyle(CurObj.pos.x, CurObj.pos.y);
            mRet = false;
        }
        else if(!CurObj.checkCollisionAround()){
            this.printRedStyle(CurObj.pos.x, CurObj.pos.y);
            mRet = false;
        }
        return mRet;
    },
    /* check and process collision of Component with outline */
    checkOutlineCollisionWithComponent : function(CurObj){
        var mRet = true;
        var mX = 0;
        var mY = 0;
        for(mX = CurObj.pos.x + this.TileWidth / 2; mX < CurObj.pos.x + CurObj.width; mX += this.TileWidth)
        {
            for(mY = CurObj.pos.y + this.TileHeight / 2; mY < CurObj.pos.y + CurObj.height; mY += this.TileHeight)
            {
                if( CurObj.getTileStyle(mX, mY) != 0 )
                {
                    this.printRedStyle( mX - (this.TileWidth / 2), mY - (this.TileHeight / 2) );
                    mRet = false;
                }
            }
        }
        return mRet;
    },
    /* check and process collision of Door with outline */
    checkOutlineCollisionWithDoor : function(CurObj){
        var mRet = true;
        var mX = 0;
        var mY = 0;
        for(mX = CurObj.pos.x + this.TileWidth / 2; mX < CurObj.pos.x + CurObj.width; mX += this.TileWidth)
        {
            for(mY = CurObj.pos.y + this.TileHeight / 2; mY < CurObj.pos.y + CurObj.height; mY += this.TileHeight)
            {
                if( CurObj.getTileStyle(mX, mY) != 0 )
                {
                    this.printRedStyle( mX - (this.TileWidth / 2), mY - (this.TileHeight / 2));
                    mRet = false;
                }
            }
        }
        return mRet;
    },
    /* check and process collision of Wall with outline */
    checkOutlineCollisionWithWall : function(CurObj){
        var mRet = true;
        var mX = 0;
        var mY = 0;
        for(mX = CurObj.pos.x + this.TileWidth / 2; mX < CurObj.pos.x + CurObj.width; mX += this.TileWidth)
        {
            for(mY = CurObj.pos.y + this.TileHeight / 2; mY < CurObj.pos.y + CurObj.height; mY += this.TileHeight)
            {
                if( CurObj.getTileStyle(mX, mY) != 0 )
                {
                    this.printRedStyle( mX - (this.TileWidth / 2), mY - (this.TileHeight / 2) );
                    mRet = false;
                }
            }
        }
        return mRet;
    },
    /* check and process collision of CurObj with outline */
    checkOutlineCollision : function(CurObj){
        var mRet = false;
        if(!CurObj)
            return false;
        switch(CurObj.mResource)
        {
        case 3:// weapon
            mRet = this.checkOutlineCollisionWithWeapon(CurObj);
            break;
        case 4: //engine
            mRet = this.checkOutlineCollisionWithEngine(CurObj);
            break;
        case 5: // power 
            mRet = this.checkOutlineCollisionWithPower(CurObj);
            break;
        case 6: // console
            mRet = this.checkOutlineCollisionWithConsole(CurObj);
            break;
        case 7: // component
            mRet = this.checkOutlineCollisionWithComponent(CurObj);
            break;
        case 8: // door
            mRet = this.checkOutlineCollisionWithDoor(CurObj);
            break;
        case 9: // wall 
            mRet = this.checkOutlineCollisionWithWall(CurObj);
            break;
        }
        /* process red style rect */
        return mRet;
    },
    /* check and process collision of obj*/
    processCollision : function(CurObj){
        var mRet = true;
        var mTemp1 = false;
        var mTemp2 = false;
        /* remove red style */
        this.removeRedStyle();
        /* check collision */
        mTemp1 = this.checkObjectCollision(CurObj);
        mTemp2 = this.checkOutlineCollision(CurObj);
        if( mTemp1 && mTemp2)
            mRet = false;
        return mRet;
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
        me.levelDirector.loadLevel("small");
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
                onMouseClickItem(-1);
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