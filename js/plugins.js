// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function() {
        var noop = function() {};
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}

function test_RedColorObject(){
    var mX = 0;
    var mY = 0;
    var mObj = new RedColorObject(0, 0, {});
    assertEquals(g_resources_size[2].name, mObj.settings.image);
    assertEquals(0, mObj.gravity);
    assertFalse(mObj.collidable);
    assertEquals(g_resources_size[2].name, mObj.type);
};

/* */
var RedColorObject = me.ObjectEntity.extend({

    init : function (x, y, settings){
        
        settings.image = g_resources_size[2].name;
        this.parent(x, y , settings);
        
        this.gravity = 0;
        this.collidable = false;
        this.type = g_resources_size[2].name;
    },

});

function test_ItemObject(){
    var mX = 0;
    var mY = 0;
    var mIndex = 5;
    if( mIndex >= 3 && mIndex <= 9 )
        assertTrue(true);
    else
        assertFalse(false);
        
    var mObj = new ItemObject(0, 0, {}, mIndex);
    assertNotNull(mObj);
    assertEquals(g_resources_size[mIndex].name, mObj.settings.image);
    assertEquals(0, mObj.gravity);
    assertTrue(mObj.collidable);
    assertEquals(g_resources_size[mIndex].name, mObj.type);
};

/* individual object class */
var ItemObject = me.ObjectEntity.extend({
    mfix : false,
    mid : 0,
    
    init : function (x, y, settings, iIndex){
        
        if( iIndex >= 0 )
        {
            settings.image = g_resources_size[iIndex].name;
            this.parent(x, y , settings);
            
            this.gravity = 0;
            this.collidable = true;
            this.type =  g_resources_size[iIndex].name;
            this.updateColRect(1, g_resources_size[iIndex].width - 1, 1,g_resources_size[iIndex].height - 1);
            this.name = "Building";
        }
    },
    
    test_getTileStyle : function(){
        var mX = 0;
        var mY = 0;
        var mRet = this.getTileStyle(mX, mY);
        switch(mRet){
            case 0:
                assertTrue("none style", true);
                break;
            case 1:
                assertTrue("plateform style", true);
                break;
            case 2:
                assertTrue("solid style", true);
                break;
            case 3:
                assertTrue("leftslope style", true);
                break;
            case 4:
                assertTrue("rightslope style", true);
                break;
            default:
                assertFalse(true);
                break;
        }
    },
    
    /* get tile style : (none = 0 / solid = 1 / plateform = 2 / leftslope = 3 / right = 4)*/
    getTileStyle : function(pX, pY){
        
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
    
    
    test_containLine : function(){
        var sPos = new me.Vector2d(0, 0);
        var mRect = new me.Rect(sPos, 32, 32);
        var ePos = new me.Vector2d(10, 10);
        
        assertNotNull(mRect);
        assertNotNull(ePos);
        assertNotNull(sPos);
        assertTrue(this.containLine(mRect,sPos,ePos));
    },
    
    /* check if obj contains the specified line 
        sPos : start position
        ePos : end position
    */
    containLine : function(obj, sPos, ePos){
        if(obj.containsPoint(sPos) && obj.containsPoint(ePos))
            return true;
            
        return false;
    },
    
    onCollision : function(res, obj){
    },

});


function test_iWeaponObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iWeaponObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 3);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
    mTemp.test_onMouseDown();
    mTemp.test_onMouseUp();
};

// weapon object 
var iWeaponObject = ItemObject.extend({
    // init function
    isDrag : false,
    preX : 0,
    preY : 0,
    
    init : function(x, y, settings, mID){
        this.mResource = 3;
        this.mid = mID;
        this.parent(x, y, settings, this.mResource);
        
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    
    test_onMouseDown : function(){
        this.pos.x = 100;
        this.pos.y = 100;
        
        assertNotEquals(select_item, -1);
        
        this.onMouseDown();
        assertTrue(this.isDrag);
        assertEquals(SelectObject, this);
        assertEquals(select_item, this.mResource);
        assertTrue(isDragable);
        
        assertEquals(this.preX, this.pos.x);
        assertEquals(this.preY, this.pos.y);
    },
    
    onMouseDown : function() {
        if(select_item == -1)
        {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;
            
            this.preX = this.pos.x;
            this.preY = this.pos.y;
        }
    },
    
    
    test_onMouseUp : function(){
        assertTrue(this.isDrag);
        
        this.onMouseUp();
        assertFalse(this.isDrag);
        assertNull(SelectObject);
        assertEquals(select_item, -1);
        assertFalse(isDragable);
        
        assertNotEquals(this.pos.x, this.preX);
        assertNotEquals(this.pos.y, this.preY);
    },
    
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            
            if(checkCollision.processCollision(this))
            {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
            }
        }
    },
    
});

function test_iEngineObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iEngineObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 4);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
    
    mTemp.test_onMouseDown();
    mTemp.test_onMouseUp();
};

// engine object 
var iEngineObject = ItemObject.extend({
    isDrag : false,
    preX : 0,
    preY : 0,
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 4;
        this.mid = mID;
        this.parent(x, y, settings, this.mResource);
        
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    
    test_onMouseDown : function(){
        this.pos.x = 100;
        this.pos.y = 100;
        
        assertNotEquals(select_item, -1);
        
        this.onMouseDown();
        assertTrue(this.isDrag);
        assertEquals(SelectObject, this);
        assertEquals(select_item, this.mResource);
        assertTrue(isDragable);
        
        assertEquals(this.preX, this.pos.x);
        assertEquals(this.preY, this.pos.y);
    },
    
    
    onMouseDown : function() {
        if(select_item == -1)
        {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;
            
            this.preX = this.pos.x;
            this.preY = this.pos.y;
        }
    },
    
    test_onMouseUp : function(){
        assertTrue(this.isDrag);
        
        this.onMouseUp();
        assertFalse(this.isDrag);
        assertNull(SelectObject);
        assertEquals(select_item, -1);
        assertFalse(isDragable);
        
        assertNotEquals(this.pos.x, this.preX);
        assertNotEquals(this.pos.y, this.preY);
    },
    
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            
            if(checkCollision.processCollision(this))
            {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
            }
        }
    },
    
});

function test_iPowerObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iPowerObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 5);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
    
    mTemp.test_onMouseDown();
    mTemp.test_onMouseUp();
};

// power object 
var iPowerObject = ItemObject.extend({
    isDrag : false,
    preX : 0,
    preY : 0,
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 5;
        this.mid = mID;
        this.parent(x, y, settings, this.mResource);
        
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    
    test_onMouseDown : function(){
        this.pos.x = 100;
        this.pos.y = 100;
        
        assertNotEquals(select_item, -1);
        
        this.onMouseDown();
        assertTrue(this.isDrag);
        assertEquals(SelectObject, this);
        assertEquals(select_item, this.mResource);
        assertTrue(isDragable);
        
        assertEquals(this.preX, this.pos.x);
        assertEquals(this.preY, this.pos.y);
    },
    
    onMouseDown : function() {
        if(select_item == -1)
        {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;
            
            this.preX = this.pos.x;
            this.preY = this.pos.y;
        }
    },
    
    test_onMouseUp : function(){
        assertTrue(this.isDrag);
        
        this.onMouseUp();
        assertFalse(this.isDrag);
        assertNull(SelectObject);
        assertEquals(select_item, -1);
        assertFalse(isDragable);
        
        assertNotEquals(this.pos.x, this.preX);
        assertNotEquals(this.pos.y, this.preY);
    },
    
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            
            if(checkCollision.processCollision(this))
            {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
            }
        }
    },
    
});

function test_iConsoleObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iConsoleObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 6);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
    
    mTemp.test_onMouseDown();
    mTemp.test_onMouseUp();
};


// console object class 
var iConsoleObject = ItemObject.extend({
    isDrag : false,
    preX : 0,
    preY : 0,
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 6;
        this.mid = mID;
        this.parent(x, y, settings, this.mResource);
        
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    
    test_onMouseDown : function(){
        this.pos.x = 100;
        this.pos.y = 100;
        
        assertNotEquals(select_item, -1);
        
        this.onMouseDown();
        assertTrue(this.isDrag);
        assertEquals(SelectObject, this);
        assertEquals(select_item, this.mResource);
        assertTrue(isDragable);
        
        assertEquals(this.preX, this.pos.x);
        assertEquals(this.preY, this.pos.y);
    },
    
    onMouseDown : function() {
        if(select_item == -1)
        {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;
            
            this.preX = this.pos.x;
            this.preY = this.pos.y;
        }
    },
    
    test_onMouseUp : function(){
        assertTrue(this.isDrag);
        
        this.onMouseUp();
        assertFalse(this.isDrag);
        assertNull(SelectObject);
        assertEquals(select_item, -1);
        assertFalse(isDragable);
        
        assertNotEquals(this.pos.x, this.preX);
        assertNotEquals(this.pos.y, this.preY);
    },
    
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            
            if(checkCollision.processCollision(this))
            {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
            }
        }
    },
    
    test_checkItemPos : function(){
        var obj = this;
        var mX = 0;
        var mY = 0;
        var de = 1;
        
        assertNotNull(obj);
        if(de >= 0 && de <= 3)
            assertTrue(true);
        else
            assertFalse(true);
            
        assertTrue(this.checkItemPos(obj, mX, mY, de, this.mResource));
    },
    
    checkItemPos : function(res, mX, mY, de, mItem){
        
        var sPos = new me.Vector2d(0, 0);
        var ePos = new me.Vector2d(0, 0);
        var mRet = false;
        
        switch(de)
        {
        case 0:
            /* left line */
            if(mItem != 3)
            {
                sPos.x = mX;
                sPos.y = mY;
                
                ePos.x = mX;
                ePos.y = mY + this.height;
                
                if(this.containLine(res, sPos, ePos))
                    mRet = true;
            }
            break;
            
        case 1:
            // top line 
            sPos.x = mX;
            sPos.y = mY;
            
            ePos.x = mX + this.width;
            ePos.y = mY;
            
            if(this.containLine(res, sPos, ePos))
                mRet = true;
                
            break;
            
        case 2:
            /* right line */
            if(mItem != 4)
            {
                sPos.x = mX + this.width;
                sPos.y = mY;
                
                ePos.x = mX + this.width;
                ePos.y = mY + this.height;
                
                if(this.containLine(res, sPos, ePos))
                    mRet = true;
            }
            break;
        case 3:
            /* bottom line */
            sPos.x = mX;
            sPos.y = mY + this.height;
            
            ePos.x = mX + this.width;
            ePos.y = mY + this.height;
            
            if(this.containLine(res, sPos, ePos))
                mRet = true;
                
            break;
        }
        delete sPos;
        delete ePos;
        
        return mRet;
    },

    test_checkCollisionAround : function(){
        assertTrue(this.checkCollisionAround());
    },
    
    checkCollisionAround : function(){
        var mRet = false;
        var mX = this.pos.x;
        var mY = this.pos.y;
            
        for(i = 0; i < 4; i ++)
        {
            //left
            if( i == 0 ){
                this.updateColRect(1 - this.width / 2, this.width - 2,  1, this.height - 2);
            }
            else if( i == 1 ){//top
                this.updateColRect(1 , this.width - 2,  1 - this.height / 2, this.height - 2);
            }
            else if( i == 2 ){//right
                this.updateColRect(1 + this.width / 2 , this.width - 2,  1, this.height - 2);
            }
            else if( i == 3 ){//bottom
                this.updateColRect(1 , this.width - 2,  1 + this.height / 2, this.height - 2);
            }
            
            res = me.game.collide(this);
            if(res)
            {
                /* Weapon */
                if(res.obj.type == g_resources_size[3].name && this.checkItemPos(res.obj, mX, mY, i, 3))
                    mRet = true;
                /* Engine */
                if(res.obj.type == g_resources_size[4].name && this.checkItemPos(res.obj, mX, mY, i, 4))
                    mRet = true;
                /* power */
                if(res.obj.type == g_resources_size[5].name && this.checkItemPos(res.obj, mX, mY, i, 5))
                    mRet = true;
            }
        }
        this.updateColRect(1, this.width - 2, 1, this.height - 2);
        this.pos.x = mX;
        this.pos.y = mY;
        return mRet;
    },
    
});


function test_iComponentObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iComponentObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 7);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
    
    mTemp.test_onMouseDown();
    mTemp.test_onMouseUp();
};

// component object class
var iComponentObject = ItemObject.extend({
    isDrag : false,
    preX : 0,
    preY : 0,
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 7;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 64;

        this.parent(x, y, settings, this.mResource);

        // add animation
        this.addAnimation ("idle", [3]);
        this.addAnimation ("charge", [0, 1, 2, 3, 4, 5, 5]);
        
        // set animation
        this.setCurrentAnimation("idle");
        this.animationspeed = 15;
        
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },

    test_onMouseDown : function(){
        this.pos.x = 100;
        this.pos.y = 100;
        
        assertNotEquals(select_item, -1);
        
        this.onMouseDown();
        assertTrue(this.isDrag);
        assertEquals(SelectObject, this);
        assertEquals(select_item, this.mResource);
        assertTrue(isDragable);
        
        assertEquals(this.preX, this.pos.x);
        assertEquals(this.preY, this.pos.y);
    },
    

    onMouseDown : function() {
        if(select_item == -1)
        {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;
            
            this.preX = this.pos.x;
            this.preY = this.pos.y;
            
            this.setCurrentAnimation("idle");
        }
    },
    
    test_onMouseUp : function(){
        assertTrue(this.isDrag);
        
        this.onMouseUp();
        assertFalse(this.isDrag);
        assertNull(SelectObject);
        assertEquals(select_item, -1);
        assertFalse(isDragable);
        
        assertNotEquals(this.pos.x, this.preX);
        assertNotEquals(this.pos.y, this.preY);
    },
    
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            this.setCurrentAnimation("charge");
            
            if(checkCollision.processCollision(this))
            {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
                
            }
        }
    },
    
});

function test_iDoorObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iDoorObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 8);
    assertEquals(mTemp.mid, mID);
    assertTrue(this.rotateFlag);
    assertFalse(this.mfix);
    assertEquals(this.angle, Math.PI / 2);
};


// door object class 
var iDoorObject = ItemObject.extend({
                                    
    rotateFlag : false,
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 8;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 32;

        this.parent(x, y, settings, this.mResource);

        // add animation
        this.addAnimation ("idle",  [2]);
//        this.addAnimation ("v_open_close",  [10]);
        this.addAnimation ("v_open_close",  [0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
        this.addAnimation ("h_open_close",  [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1]);
        this.angle = 0;
        this.rotateFlag  = false;
        // set animation
        this.setCurrentAnimation("idle");
        this.animationspeed = 10;
        
        this.angle = Math.PI / 2;
        this.rotateFlag = true;
        this.mfix = false;
    },
    
    test_processRotate : function(){
        this.processRotate();
        assertFalse(this.rotateFlag);
        assertEquals(this.angle, 0);
        assertNotEquals(this.width, 0);
        assertNotEquals(this.height, 0);
    },
    
    processRotate : function()
    {
        var dX = 0;
        var dY = 0;
        var dWidth = 0;
        var dHeight = 0;
        var mRes  = null;
        var mOk = true;
        
        if(!this.rotateFlag)
        {
            dX = 0;
            dY = 0;
            dWidth = this.width;
            dHeight = this.height;
        }
        else {
            dX = -16;
            dY = 16;
            dWidth = this.width;
            dHeight = this.height;
        }
        
        // left and right
        this.updateColRect(dX - checkCollision.TileWidth, checkCollision.TileWidth, dY, checkCollision.TileHeight);
        mRes = me.game.collide(this);
        if(!mRes || mRes.obj.mResource != 9)
            mOk = false;

        if(mOk)
        {
            this.updateColRect(dX + checkCollision.TileWidth + this.width, checkCollision.TileWidth, dY, checkCollision.TileHeight);
            mRes = me.game.collide(this);
            if(!mRes || mRes.obj.mResource != 9)
                mOk = false;
        }
        
        if(mOk)
        {
            this.rotateFlag = false;
            this.angle = 0;
        }
        else{
            this.rotateFlag = true;
            this.angle = Math.PI / 2;
        }
        this.updateColRect(0, this.width, 0, this.height);
    },
    
    test_removeWallinCollision : function(){
        this.removeWallinCollision();
        assertNull(me.game.collide(this));
    },
    
    /* remove wall */
    removeWallinCollision : function() {
        
        var mRes = null;
        var mTemp = null;
        
        while(1){
            if(this.rotateFlag)
            {
                this.updateColRect(17, this.height - 1, -15, this.width - 1);
                mRes = me.game.collide(this);
                if(!mRes || mRes.obj.mResource != 9)
                    break;
                mRes.obj.removeObject();
            }
            else{
                this.updateColRect(1, this.width - 2, 1, this.height - 2);
                mRes = me.game.collide(this);
                if(!mRes || mRes.obj.mResource != 9)
                    break;
                mRes.obj.removeObject();
            }
        }
    },
});


function test_iWallObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    
    var mTemp = new iWallObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 9);
    assertEquals(mTemp.mid, mID);
};


// wall object class
var iWallObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = 9;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 32;
        settings.spriteheight = 32;

        this.parent(x, y, settings, this.mResource);

        // add animation
        // add animation
        this.addAnimation ("vWall", [0]);
        this.addAnimation ("hWall", [1]);
        this.addAnimation ("LL_Wall", [2]);
        this.addAnimation ("E_Wall", [3]);
        this.addAnimation ("PL_Wall", [4]);
        this.addAnimation ("RL_Wall", [5]);
        this.addAnimation ("I_LL_Wall", [6]);
        this.addAnimation ("I_E_Wall", [7]);
        this.addAnimation ("I_RL_Wall", [8]);
        this.addAnimation ("LE_Wall", [9]);
        this.addAnimation ("RE_Wall", [10]);
        
        // set animation
        this.setCurrentAnimation("hWall");
        
        this.animationspeed = 6;
    },
    
    test_checkTopAndBottomWall : function(){
        var mRet = this.checkTopAndBottomWall();
        switch(mRet){
        case 0:
            assertEquals("None collide", 0, mRet);
            break;
        case 2:
            assertEquals("collide with object else wall", 2, mRet);
            break;
        case 3:
            assertEquals("collide with wall on topside", 3, mRet);
            break;
        case 4:
            assertEquals("collide with wall on bottomside", 4, mRet);
            break;
        case 5:
            assertEquals("collide with wall on top/bottomside", 5, mRet);
            break
        default:
            assertEquals("Unknown value", 0, mRet);
        }
    },
    
    checkTopAndBottomWall : function()
    {
        var mRet = 0;
        var mX = 0;
        var mY = 0;
        var mRes = 0;
        
        this.updateColRect( 0, this.width, 0 - checkCollision.TileHeight / 2, this.height + checkCollision.TileHeight );
        
        mRes = me.game.collide(this);
        
        if( !mRes )
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 0;
        }
        
/*        if(mRes.obj.mResource < this.mResource - 1)
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 1;
        }*/
        mRet = 2;
        /* top */
        this.updateColRect( 0, this.width, 0 - checkCollision.TileHeight / 2, this.height);
        mRes = me.game.collide(this);
        if( mRes && mRes.obj.mResource >= this.mResource - 1 )
        {
            if(mRes.obj.mResource == this.mResource - 1 && !mRes.obj.mfix)
            {
            }
            else
                mRet += 1; //3
        }
            
        /* bottom */
        this.updateColRect( 0, this.width, 0 + checkCollision.TileHeight / 2, this.height);
        mRes = me.game.collide(this);
        if( mRes && mRes.obj.mResource >= this.mResource - 1 )
        {
            if(mRes.obj.mResource == this.mResource - 1 && !mRes.obj.mfix)
            {
            }
            else
                mRet += 2; //4, 5
        }
        
        this.updateColRect( 0, this.width, 0, this.height );
        if(mRet == 2)
            return 1;
            
        return mRet;
    },

    test_checkLeftAndRightWall : function(){
        var mRet = this.checkLeftAndRightWall();
        switch(mRet){
        case 0:
            assertEquals("None collide", 0, mRet);
            break;
        case 8:
            assertEquals("collide with object else wall", 2, mRet);
            break;
        case 7:
            assertEquals("collide with wall on leftside", 3, mRet);
            break;
        case 6:
            assertEquals("collide with wall on rightside", 4, mRet);
            break;
        case 5:
            assertEquals("collide with wall on left/right side", 5, mRet);
            break
        default:
            assertEquals("Unknown value", 0, mRet);
        }
    },

    checkLeftAndRightWall : function()
    {
        var mRet = 0;
        var mX = 0;
        var mY = 0;
        var mRes = 0;
        
        this.updateColRect( 0 - checkCollision.TileWidth / 2 , this.width + checkCollision.TileWidth,
                           0, this.height);
        
        mRes = me.game.collide(this);
        
        this.updateColRect( 0, this.width, 0, this.height );
        
        if( !mRes )
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 0;
        }
/*            
        if(mRes.obj.mResource < this.mResource - 1)
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 1;
        }
*/
        mRet = 8;
        /* left */
        this.updateColRect( 0 - checkCollision.TileWidth / 2 , this.width, 0, this.height );
        
        mRes = me.game.collide(this);
        if( mRes &&  mRes.obj.mResource >= this.mResource - 1)
        {
            if(mRes.obj.mResource == this.mResource - 1 && !mRes.obj.mfix)
            {
            }
            else
                mRet -= 1; //7 / left
        }
            
        /* right */
        this.updateColRect(  0 + checkCollision.TileWidth / 2, this.width , 0, this.height );
        mRes = me.game.collide(this);
        
        if(mRes && mRes.obj.mResource >= this.mResource - 1)
        {
            if(mRes.obj.mResource == this.mResource - 1 && !mRes.obj.mfix)
            {
            }
            else
                mRet -= 2; //6, 5 right / both
        }
    
        this.updateColRect( 0, this.width, 0, this.height );
        
        if(mRet == 8)
            return 1;
            
        return mRet;
    },
    
    test_checkDirectWall : function(){
        this.checkDirectWall();
        
        this.addAnimation ("vWall", [0]);
        this.addAnimation ("hWall", [1]);
        this.addAnimation ("LL_Wall", [2]);
        this.addAnimation ("E_Wall", [3]);
        this.addAnimation ("PL_Wall", [4]);
        this.addAnimation ("RL_Wall", [5]);
        this.addAnimation ("I_LL_Wall", [6]);
        this.addAnimation ("I_E_Wall", [7]);
        this.addAnimation ("I_RL_Wall", [8]);
        this.addAnimation ("LE_Wall", [9]);
        this.addAnimation ("RE_Wall", [10]);
        
        if(this.isCurrentAnimation("vWall") || this.isCurrentAnimation("hWall") || this.isCurrentAnimation("LL_Wall") || this.isCurrentAnimation("E_Wall") ||
            this.isCurrentAnimation("PL_Wall") || this.isCurrentAnimation("RL_Wall") || this.isCurrentAnimation("I_LL_Wall") || this.isCurrentAnimation("I_E_Wall") ||
            this.isCurrentAnimation("I_RL_Wall") || this.isCurrentAnimation("LE_Wall") || this.isCurrentAnimation("RE_Wall"))
            assertTrue(true);
        else
            assertFalse(true);
    },
    
    /* check direction of wall (horizon / vertical / L-model / E - Model / Crosshair )*/
    checkDirectWall : function()
    {
        var mX = 0;
        var mY = 0;
        var mDirect = 0;
        var mTopBottom = mTopBottom = this.checkTopAndBottomWall();
        var mLeftRight = this.checkLeftAndRightWall();
        
        if(mLeftRight == 0 && mTopBottom == 0)
            return ;

        this.angle = 0;

        switch(mLeftRight)
        {
        case 0://none
        case 1:
            switch(mTopBottom)
            {
            case 3://top
            case 4://bottom
            case 5://both
                this.setCurrentAnimation("hWall");
                break;
            }
            break;
        case 5:
            switch(mTopBottom)
            {
            case 0:
            case 1:
                this.setCurrentAnimation("vWall");
                break;
            case 3://top
                this.setCurrentAnimation("E_Wall");
                break;
            case 4://bottom
                this.setCurrentAnimation("I_E_Wall");
                break;
            case 5:
                this.setCurrentAnimation("PL_Wall");
                break;
            }
            break;
        case 7://left
            switch(mTopBottom)
            {
            case 0:
            case 1:
                this.setCurrentAnimation("vWall");
                break;
            case 3://top
                this.setCurrentAnimation("RL_Wall");
                break;
            case 4://bottom
                this.setCurrentAnimation("I_RL_Wall");
                break;
            case 5://both
                this.setCurrentAnimation("LE_Wall");
                break;
            }
            break;
        case 6://right
            switch(mTopBottom)
            {
            case 0:
            case 1:
                this.setCurrentAnimation("vWall");
                break;
            case 3://top
                this.setCurrentAnimation("LL_Wall");
                break;
            case 4://bottom
                this.setCurrentAnimation("I_LL_Wall");
                break;
            case 5:
                this.setCurrentAnimation("RE_Wall");
                break;
            }
            break;
        }
    },
    
    removeObject : function(){
        me.game.remove(this);
        delete this;
    },
    
    update : function(){
        this.checkDirectWall();
    },
    
});

function test_WallMngObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp1 = new iWallObject(mX, mY, {}, mID);
    var mTemp = new WallMngObject(mID, mTemp1);
    
    assertNotNull(mTemp);
    assertEquals(mTemp.mIndex, 1);
    assertEquals(mTemp.mWallObject, mTemp1);
};

// wall manager object class
var WallMngObject = ItemObject.extend({
                                      
    mWallObject : [],
    mIndex : 0,
    
    init : function(mID, sObj){
        this.mIndex = 0;
        this.mid = mID;
        this.mWallObject[0] = sObj;
        
        me.game.add(this.mWallObject[0], 100);
        this.mIndex ++ ;
    },
    
    test_removeWallObject : function(){
        var dIndex = 1;
        
        this.removeWallObject(dIndex);
        assertEquals(this.mIndex, dIndex);
    },
    
    removeWallObject : function(eIndex) {
        var i = 0;
        
        for( i = this.mIndex - 1; i >= eIndex; i -- )
            me.game.remove(this.mWallObject[i]);
            
        this.mIndex = eIndex;
    },
    
    test_drawWallObject : function(){
        var mPos = new me.Vector2d(100, 100);
        assertNotNull(mPos);
        assertNotNull(this.mWallObject[0]);
        this.drawWallObject(mPos);
        assertNotEquals(this.mIndex, 0);
    },
    
    drawWallObject : function(mPos) {
        var addObj = null;
        var mX = this.mWallObject[0].pos.x;
        var mY = this.mWallObject[0].pos.y;
        var mPluse = false;
        var res = null;
        
        if(Math.abs(mX - mPos.x) > Math.abs(mY - mPos.y))
        {
            if(mX != mPos.x)
            {
                if(mX < mPos.x)
                {
                    mPluse = true;
                    mX += checkCollision.TileWidth;
                }
                else{
                    mX -= checkCollision.TileWidth;
                }
                
                for( ; mX != mPos.x; )
                {
                    addObj = new iWallObject(mX, mY, {}, this.mIndex);
                    me.game.add(addObj, 100);
                    
                    if(checkCollision.processCollision(addObj))
                    {
                        res = me.game.collide(addObj);
                        checkCollision.removeRedStyle();
                        me.game.remove(addObj);
                        delete addObj;
                        addObj = null;

                        if( res && res.obj.mResource != 9 )
                            break;
                    }
                    else{
                        this.mWallObject[this.mIndex] = addObj;
                        this.mIndex ++;
                    }
                    if(mPluse)
                        mX += checkCollision.TileWidth;
                    else
                        mX -= checkCollision.TileWidth;
                }
            }
        }
        else
        {
            if(mY != mPos.y)
            {
                if(mY < mPos.y)
                {
                    mPluse = true;
                    mY += checkCollision.TileHeight;
                }
                else{
                    mY -= checkCollision.TileHeight;
                }
                    
                for( ; mY != mPos.y; )
                {
                    addObj = new iWallObject(mX, mY, {}, this.mIndex);
                    me.game.add(addObj, 100);
                    
                    if(checkCollision.processCollision(addObj))
                    {
                        res = me.game.collide(addObj);
                        checkCollision.removeRedStyle();
                        me.game.remove(addObj);
                        delete addObj;
                        addObj = null;
                        
                        if( res && res.obj.mResource != 9 )
                            break;
                    }
                    else{
                        this.mWallObject[this.mIndex] = addObj;
                        this.mIndex ++;
                    }
                    
                    if(mPluse)
                        mY += checkCollision.TileHeight;
                    else
                        mY -= checkCollision.TileHeight;
                }
            }
        }
    },
    
    test_processWallObject : function(){
        var mPos = new me.Vector2d(100, 100);
        assertNotNull(mPos);
        assertNotNull(this.mWallObject[0]);
        this.processWallObject(mPos);
        assertNotEquals(this.mIndex, 0);
    },
    
    /* process wall objects  */
    processWallObject : function(mPos){
        if( this.mWallObject[this.mIndex - 1].pos.x != mPos.x ||
            this.mWallObject[this.mIndex - 1].pos.y != mPos.y )
        {
            this.removeWallObject(1);
            this.drawWallObject(mPos);
        }
    },
    
    test_setFixFlag : function() {
        var mIndex = 0;
        
        this.setFixFlag();
        for(mIndex = 0; mIndex < this.mWallObject.length; mIndex ++)
        {
            assertNotNull(this.mWallObject[mIndex]);
            assertTrue(this.mWallObject[mIndex].mfix, true);
        }
    },
    
    setFixFlag : function(){
        var mIndex = 0;
        
        for(mIndex = 0; mIndex < this.mWallObject.length; mIndex ++)
            this.mWallObject[mIndex].mfix = true;
    },
    
});

var makeJsonString = {
    /*
    JsonString = {
        'Objects' : [
            {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234},
            {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234, 'Setting' : 'wewer'},
            {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234, 'Setting' : 'wewer'},
            {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234, 'Setting' : 'wewer'},
        ]
    }
    */
    JsonString : "",
    
    test_init : function(){
        this.init();
        assertEquals(this.JsonString, "");
    },
    
    init : function(){
        this.JsonString = "";
    },
    
    test_setFirstString : function(){
        this.setFirstString();
        assertEquals(this.JsonString, '{"Objects" : [');
    },
    
    setFirstString : function(){
        this.JsonString = '{"Objects" : [';
    },
    
    test_makeObjecttoString : function(){
        var mTemp1 = new iWallObject(0, 0, {}, 1);
        assertNotNull(mTemp1);
        
        this.makeObjecttoString(mTemp1, true);
        assertEquals(this.JsonString, '{"Resource":9,"id":1,"PosX":0,"PosY":0,"Fix":false,"angle":0,"animation":"hWall"}');
    },
    
    makeObjecttoString : function(curObj, firstItem){
        if(curObj)
        {
            if(!firstItem)
                this.JsonString += ',';
                
            this.JsonString += '{"Resource":' + curObj.mResource;
            this.JsonString += ',"id":' + curObj.mid;
            this.JsonString += ',"PosX":' + curObj.pos.x;
            this.JsonString += ',"PosY":' + curObj.pos.y;
            this.JsonString += ',"Fix":' + curObj.mfix;
            this.JsonString += ',"angle":' + curObj.angle;
            
            this.JsonString += ',"animation":"' + curObj.current.name;
            this.JsonString += '"}';
        }
    },
    
    test_setEndString : function(){
        this.JsonString = "";
        this.setEndString();
        assertEquals(this.JsonString, ']}');
    },
    
    setEndString : function(){
        this.JsonString += ']}';
    },
    
    test_makeString : function(){
        var mTemp1 = new iWallObject(32, 32, {}, 1);
        assertNotNull(mTemp1);
        me.game.add(mTemp1);
        
        this.makeString();
        assertEquals(this.JsonString, '{"Objects" : [{"Resource":9,"id":1,"PosX":32,"PosY":32,"Fix":false,"angle":0,"animation":"hWall"}]}');
    },
    
    makeString : function(){
        var mX = 0;
        var mY = 0;
        var TempObject = new ItemObject(0, 0, {}, 9);
        var firstFlag = true;
        var tempPos = new me.Vector2d(0, 0);
        
        this.init();
        
        this.setFirstString();
        me.game.add(TempObject, 1);
        TempObject.updateColRect(1, checkCollision.TileWidth -2, 1, checkCollision.TileHeight - 2);
        
        for(mX = 0; mX < g_resources_size[1].width; mX += checkCollision.TileWidth)
        {
            for(mY = 0; mY < g_resources_size[1].height; mY += checkCollision.TileHeight)
            {
                TempObject.pos.x = mX;
                TempObject.pos.y = mY;
                
                res = me.game.collide(TempObject);
                
                if(res)
                {
                    tempPos.x = res.obj.pos.x;
                    tempPos.y = res.obj.pos.y;
                    
                    if(res.obj.mResource == 8)
                    {
                        tempPos.x += res.obj.collisionBox.colPos.x;
                        tempPos.y += res.obj.collisionBox.colPos.y;
                    }
                    if(TempObject.containsPoint(tempPos) && res.obj.mfix)
                    {
                        this.makeObjecttoString(res.obj, firstFlag);
                    
                        if(firstFlag == true)
                            firstFlag = false;
                    }
                }
            }
        }
        
        this.setEndString();
        me.game.remove(TempObject);
        delete TempObject;
        delete tempPos;
        
        return this.JsonString;
    },
    
};

var LoadDraw = {
    test_draw : function(){
        var jString = '{"Objects" : [{"Resource":9,"id":1,"PosX":32,"PosY":32,"Fix":false,"angle":0,"animation":"hWall"}]}';
        assertTrue(this.draw(jString));
    },
    
    draw : function(JString){
        var i = 0;
        var ParseStr = null;
        var ParseItem = null;
        var OneObject = null;
        ParseStr = JSON.parse(JString);
        if(!ParseStr)
        {
            alert("Unknown string format!");
            return false;
        }
        
        for(i = 0; i < ParseStr.Objects.length; i ++){
            ParseItem = ParseStr.Objects[i];
            if(!ParseItem)
                break;
                
            switch(ParseItem.Resource){
            case 3://weapon
                OneObject = new iWeaponObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 4://engine
                OneObject = new iEngineObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 5://power
                OneObject = new iPowerObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 6://console
                OneObject = new iConsoleObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 7://component
                OneObject = new iComponentObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.setCurrentAnimation(ParseItem.animation);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 8://door
                OneObject = new iDoorObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.setCurrentAnimation(ParseItem.animation);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            case 9://wall
                OneObject = new iWallObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
                OneObject.angle = ParseItem.angle;
                OneObject.mfix = ParseItem.Fix;
                me.game.add( OneObject, 100 );
                break;
            }
        }
        me.game.sort();
        me.game.repaint();
        return true;
    },
    
};
