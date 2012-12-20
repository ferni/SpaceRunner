
// weapon object 
var iWeaponObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.size = [2, 2];
        this.mResource = items.weapon.index;
        this.mid = mID;
        this.charCode = items.weapon.code;
        this.parent(x, y, settings, this.mResource);
        
    },
    buildPlacementRules : function() {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({tile:charMap.codes._front, 
                                                       inAny:[{ x: 2, y: 0 }, { x: 2, y: 1 }]}));
    }
    
});
// engine object 
var iEngineObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.engine.index;
        this.mid = mID;
        this.size = [2, 2];
        this.cannonTile = [1, 0];
        this.charCode = items.engine.code;
        this.parent(x, y, settings, this.mResource);
    },
    buildPlacementRules : function() {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({tile:charMap.codes._back, 
                                                       inAll:[{ x: -1, y: 0 }, { x: -1, y: 1 }]}));
    }
    
});


// power object 
var iPowerObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.power.index;
        this.mid = mID;
        this.size = [2, 2];
        this.charCode = items.power.code;
        this.parent(x, y, settings, this.mResource);
    }
    
});

// console object class 
var iConsoleObject = ItemObject.extend({
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.console.index;
        this.mid = mID;
        this.size = [1, 1];
        this.charCode = items.console.code;
        this.parent(x, y, settings, this.mResource);
    },
    buildPlacementRules: function () {
        this.parent();
        this.placementRulesAny = new Array();//has to comply at least one (see "canBuildAt")
        this.placementRulesAny.push(pr.make.nextToRule(items.weapon.code, this.size[0], this.size[1]));
        this.placementRulesAny.push(pr.make.nextToRule(items.engine.code, this.size[0], this.size[1]));
        this.placementRulesAny.push(pr.make.nextToRule(items.power.code, this.size[0], this.size[1]));
    },
    //overrides ItemObject.canBuildAt
    canBuildAt: function (x,y) {
        return this.parent(x,y)
            && _.some(this.placementRulesAny, function(r) {
                    return r.compliesAt(x,y, ship.map());
                });
    }
});

// component object class
var iComponentObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.component.index;
        this.mid = mID;
        this.size = [2, 2];
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 64;
        this.charCode = items.component.code;
        this.parent(x, y, settings, this.mResource);
        // add animation
        this.addAnimation ("idle", [3]);
        this.addAnimation ("charge", [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.setCurrentAnimation("idle");
        this.animationspeed = 15;
    },
    onMouseDown : function() {
        if(select_item == -1)
        {
            this.parent();
            this.setCurrentAnimation("idle");
        }
    },
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            this.parent();
            this.setCurrentAnimation("charge");
        }
    },
    setWalkable : function(){
            MapMatrix.setWalkable(this.pos.x, this.pos.y, this.width, this.height);
    },
    setUnWalkable : function(){
        MapMatrix.setUnWalkable(this.pos.x, this.pos.y, this.width, this.height);
    },
});
// door object class 
var iDoorObject = ItemObject.extend({
    rotateFlag : false,
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.door.index;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 32;
        this.charCode = items.door.code;
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
    /* remove wall */
    removeWallinCollision : function() {
        var mRes = null;
        var mTemp = null;
        var mWallGroup = null;
        while(1){
            if(this.rotateFlag)
            {
                this.updateColRect(17, this.height - 1, -15, this.width - 1);
                mRes = me.game.collide(this);
                if(!mRes || mRes.obj.mResource != 9)
                    break;
            }
            else{
                this.updateColRect(1, this.width - 2, 1, this.height - 2);
                mRes = me.game.collide(this);
                if(!mRes || mRes.obj.mResource != 9)
                    break;
            }
            mWallGroup = ObjectsMng.searchWallGroupfromWall(mRes.obj);
            if(mWallGroup)
            {
                mWallGroup.removeWallObject(mRes.obj);
            }
        }
        if(mWallGroup)
            mWallGroup.addOtherObject(this);
        this.updateColRect(0, this.width, 0, this.height);
    },
    checkObjectCollision: function() {
        var res = me.game.collide(this);
        var checkPoint = new me.Vector2d(0, 0);
        var mflag = true;
        var tileWidth = me.game.currentLevel.tilewidth;
        var tileHeight = me.game.currentLevel.tileheight;
        if(this.rotateFlag == false)
        {
            for( checkPoint.x = 0 ; checkPoint.x < this.width; checkPoint.x += tileWidth )
            {
                this.updateColRect( checkPoint.x, tileWidth, 0, tileHeight );
                res = me.game.collide( this );
                if(this.mfix == true)
                {
                    if(res)
                    {
                        checkCollision.printRedStyle( this.pos.x + checkPoint.x, this.pos.y );
                        mflag = false;
                    }
                }
                else{
                    if(!res ||res.obj.mResource != 9){
                        checkCollision.printRedStyle( this.pos.x + checkPoint.x, this.pos.y );
                        mflag = false;
                    }
                }
            }
            this.updateColRect(0, this.width, 0, this.height);
        }
        else{
            for( checkPoint.y = 0 ; checkPoint.y < this.width; checkPoint.y += tileHeight )
            {
                this.updateColRect( 16, tileWidth, checkPoint.y - 16, tileHeight );
                res = me.game.collide( this );
                if(this.mfix == true)
                {
                    if(res)
                    {
                        checkCollision.printRedStyle( this.pos.x + 16,  this.pos.y - 16 + checkPoint.y );
                        mflag = false;
                    }
                }
                else{
                    if(!res ||res.obj.mResource != 9){
                        checkCollision.printRedStyle( this.pos.x + 16,  this.pos.y - 16 + checkPoint.y );
                        mflag = false;
                    }
                }
            }
            this.updateColRect(16, this.height, 0 - 16, this.width);
        }
        return mflag;
        
    }
//    update : function(){
//        this.processRotate();
//    },
});
// wall object class
var iWallObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.wall.index;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 32;
        settings.spriteheight = 32;
        
        this.size = [1, 1];
        this.charCode = items.wall.code;
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
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    onMouseDown : function() {
        if(select_item == -1)
        {
            SelectObject = ObjectsMng.searchWallGroupfromWall(this);
            if(SelectObject)
            {
                this.isDrag = true;
                select_item = 101;
                isDragable = true;
                SelectObject.setPrePostoCurPos();
                SelectObject.WallPosX = this.pos.x;
                SelectObject.WallPosY = this.pos.y;
                SelectObject.setWalkable();
                displayMoveCursor();
            }
        }
    },
    onMouseUp : function(){
        if(this.isDrag == true)
        {
            if(SelectObject)
            {
                DeleteObject = SelectObject;
                if(SelectObject.checkCollissionGroup())
                {
                    checkCollision.removeRedStyle();
                    SelectObject.setCurPostoPrePos();
                }
                SelectObject.setUnWalkable();
                SelectObject = null;
            }
            this.isDrag = false;
            select_item = -1;
            isDragable = false;
            displayDefaultCursor();
       }
    },
    checkTopAndBottomWall : function()
    {
        var mRet = 0;
        var mX = 0;
        var mY = 0;
        var mRes = 0;
        this.updateColRect( 0, this.width, 0 - checkCollision.TileHeight, this.height + checkCollision.TileHeight * 2 );
        mRes = me.game.collide(this);
        if( !mRes )
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 0;
        }
        mRet = 2;
        /* top */
        this.updateColRect( 0, this.width, 0 - checkCollision.TileHeight, this.height);
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
        this.updateColRect( 0, this.width, 0 + checkCollision.TileHeight, this.height);
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
    checkLeftAndRightWall : function()
    {
        var mRet = 0;
        var mX = 0;
        var mY = 0;
        var mRes = 0;
        this.updateColRect( 0 - checkCollision.TileWidth , this.width + checkCollision.TileWidth * 2,
                           0, this.height);
        mRes = me.game.collide(this);
        this.updateColRect( 0, this.width, 0, this.height );
        if( !mRes )
        {
            this.updateColRect( 0, this.width, 0, this.height );
            return 0;
        }
        mRet = 8;
        /* left */
        this.updateColRect( 0 - checkCollision.TileWidth , this.width, 0, this.height );
        
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
        this.updateColRect(  0 + checkCollision.TileWidth, this.width , 0, this.height );
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

var WallGroupObject = ItemObject.extend({
    mWallObject : [],
    mStarti : 0,
    WallPosX : 0,
    WallPosY : 0,
    init : function(mID){
        this.mid = mID;
        this.mResource = 101;
        this.WallPosX = 0;
        this.WallPosY = 0;
        this.mStarti = 0;
        this.mWallObject = [];
    },
    addOtherObject : function(Obj){
        if(Obj)
            this.mWallObject[this.mWallObject.length] = Obj;
    },
    addWallObject : function(x, y){
        var wallObj = new iWallObject(x, y, {}, this.mid);
        me.game.add(wallObj, 102);
        this.mWallObject[this.mWallObject.length] = wallObj;
        return wallObj;
    },
    removeWallObject : function(Obj){
        if(Obj && this.mid == Obj.mid)
        {
            me.game.remove(Obj);
            this.mWallObject.remove(Obj);
            return true;
        }
        return false;
    },
    removeAll : function(eIndex) {
        var i = 0;
        var Obj = null;
        
        for( i = this.mWallObject.length - 1; i >= eIndex; i -- )
        {
            Obj = this.mWallObject[i];
            me.game.remove(Obj);
            this.mWallObject.remove(Obj);
        }
    },
    removeUnFixedObject : function() {
        var i = 0;
        var Obj = null;
        for( i = this.mWallObject.length - 1; i >= 0; i -- )
        {
            Obj = this.mWallObject[i];
            
            if(Obj.mfix == true)
                break;
            me.game.remove(Obj);
            this.mWallObject.remove(Obj);
        }
        return i;
    },
    getFirstWallObject : function(){
        return this.mWallObject[0];
    },
    process : function(dragflag, mPos){
        if(!dragflag)
        {
            this.mWallObject[0].pos.x = mPos.x;
            this.mWallObject[0].pos.y = mPos.y;
            checkCollision.processCollision(this.mWallObject[0]);
        }
        else{
            if(this.mWallObject[0].mfix != true)
                this.mWallObject[0].mfix = true;
            this.mStarti = this.removeUnFixedObject();
            this.drawWall(mPos);
        }
    },
    drawWall : function(mPos){
        var startX = this.mWallObject[this.mStarti].pos.x / checkCollision.TileWidth;
        var startY = this.mWallObject[this.mStarti].pos.y / checkCollision.TileHeight;
        var endX = mPos.x / checkCollision.TileWidth;
        var endY = mPos.y / checkCollision.TileHeight;
        var finder = new PF.BestFirstFinder();
        var cloneGrid = MapMatrix.MapGrid.clone();
        var path = finder.findPath(startX, startY, endX, endY, cloneGrid);
        var i = 0;
        for(i = 1; i < path.length; i ++)
            this.addWallObject(path[i][0] * checkCollision.TileWidth, path[i][1] * checkCollision.TileHeight);
    },
    setFixFlag : function(){
        var mIndex = 0;
        for(mIndex = 0; mIndex < this.mWallObject.length; mIndex ++)
        {
            this.mWallObject[mIndex].mfix = true;
            MapMatrix.setUnWalkable(this.mWallObject[mIndex].pos.x, this.mWallObject[mIndex].pos.y, this.mWallObject[mIndex].width, this.mWallObject[mIndex].height);
        }
    },
    setWalkable : function(){
        var mIndex = 0;
        for(mIndex = 0; mIndex < this.mWallObject.length; mIndex ++)
        {
            if(this.mWallObject[mIndex].mResource == 8)
                MapMatrix.setWalkable(this.mWallObject[mIndex].pos.x, this.mWallObject[mIndex].pos.y, this.mWallObject[mIndex].width, this.mWallObject[mIndex].height * 2);
            else
                MapMatrix.setWalkable(this.mWallObject[mIndex].pos.x, this.mWallObject[mIndex].pos.y, this.mWallObject[mIndex].width, this.mWallObject[mIndex].height);
        }
    },
    setUnWalkable : function(){
        var mIndex = 0;
        for(mIndex = 0; mIndex < this.mWallObject.length; mIndex ++)
        {
            if(this.mWallObject[mIndex].mResource == 8)
                MapMatrix.setUnWalkable(this.mWallObject[mIndex].pos.x, this.mWallObject[mIndex].pos.y, this.mWallObject[mIndex].width, this.mWallObject[mIndex].height * 2);
            else
                MapMatrix.setUnWalkable(this.mWallObject[mIndex].pos.x, this.mWallObject[mIndex].pos.y, this.mWallObject[mIndex].width, this.mWallObject[mIndex].height);
        }
    },
    movePorcess : function(mX, mY){
        var dtX = mX - this.WallPosX;
        var dtY = mY - this.WallPosY;
        this.WallPosX = mX;
        this.WallPosY = mY;
        var i = 0;
        checkCollision.removeRedStyle();
        for(i = 0; i < this.mWallObject.length; i ++)
        {
            this.mWallObject[i].pos.x += dtX;
            this.mWallObject[i].pos.y += dtY;
            
            this.checkCollission(this.mWallObject[i]);
        }
    },
    checkCollissionGroup : function(){
        var mRet = false;
        var i = 0;
        for(i = 0; i < this.mWallObject.length; i ++)
        {
            if(this.checkCollission(this.mWallObject[i]))
            {
                mRet = true;
                break;
            }
        }
        return mRet;
    },
    checkCollission : function(Obj){
        var mRet = true;
        var mTemp1 = checkCollision.checkObjectCollision(Obj);
        var mTemp2 = checkCollision.checkOutlineCollision(Obj);
        if( mTemp1 && mTemp2)
            mRet = false;
        return mRet;
    },
    setPrePostoCurPos : function(){
        for(i = 0; i < this.mWallObject.length; i ++)
        {
            this.mWallObject[i].preX = this.mWallObject[i].pos.x;
            this.mWallObject[i].preY = this.mWallObject[i].pos.y;
        }
    },
    setCurPostoPrePos : function(){
        for(i = 0; i < this.mWallObject.length; i ++)
        {
            this.mWallObject[i].pos.x = this.mWallObject[i].preX;
            this.mWallObject[i].pos.y = this.mWallObject[i].preY;
        }
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
            {'Resource' : 101, Walls : [{'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234}, {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234},{...}]},
            {'Resource' : 101, Walls : [{'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234}, {'Resource' : 1, 'id' : 3, 'PosX' : 123, 'PosY' : 234},{...}]},
        ],
    }
    */
    JsonString : "",
    init : function(){
        this.JsonString = "";
    },
    setFirstString : function(){
        this.JsonString = '{"Objects" : [';
    },
    makeObjecttoString : function(curObj, firstItem){
        var i = 0;
        var subObj = null;
        var subfirst = true;
        if(curObj)
        {
            if(!firstItem)
                this.JsonString += ',';
            this.JsonString += '{"Resource":' + curObj.mResource;
            this.JsonString += ',"id":' + curObj.mid;
            if(curObj.mResource == 101)
            {
                this.JsonString += ',"Walls":[';
                for(i = 0; i < curObj.mWallObject.length; i ++)
                {
                    subObj = curObj.mWallObject[i];
                    if(subObj)
                    {
                        this.makeObjecttoString(subObj, subfirst);
                        if(subfirst == true)
                            subfirst = false;
                    }
                }
                this.setEndString();
            }
            else{
                this.JsonString += ',"PosX":' + curObj.pos.x;
                this.JsonString += ',"PosY":' + curObj.pos.y;
                this.JsonString += ',"Fix":' + curObj.mfix;
                this.JsonString += ',"angle":' + curObj.angle;
                this.JsonString += ',"animation":"' + curObj.current.name;
                this.JsonString += '"}';
            }
        }
    },
    setEndString : function(){
        this.JsonString += ']}';
    },
    makeString : function(){
        var mX = 0;
        var mY = 0;
        var TempObject = new ItemObject(0, 0, {}, 9);
        var firstFlag = true;
        var tempPos = new me.Vector2d(0, 0);
        var res = null;
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
                    if(res.obj.mResource != 8 && res.obj.mResource != 9)
                    {
                        if(TempObject.containsPoint(tempPos) && res.obj.mfix)
                        {
                            this.makeObjecttoString(res.obj, firstFlag);
                            if(firstFlag == true)
                                firstFlag = false;
                        }
                    }
                }
            }
        }
        var i = 0;
        for(i = 0; i < ObjectsMng.Objects.length; i ++)
        {
            res = ObjectsMng.Objects[i];
            if(res)
            {
                this.makeObjecttoString(res, firstFlag);
                if(firstFlag == true)
                    firstFlag = false;
            }
        }
        this.setEndString();
        me.game.remove(TempObject);
        delete TempObject;
        delete tempPos;
        return this.JsonString;
    },
    
};