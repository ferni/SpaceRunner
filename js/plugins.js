


var ObjectsMng = {
    Objects : [],
    init : function(){
        this.Objects = [];
    },
    addObject : function(Obj){
        if(Obj)
            this.Objects[this.Objects.length] = Obj;
    },
    removeObject : function(Obj){
        if(Obj)
            this.Objects.remove(Obj);
    },
    getSize : function(){
        return this.Objects.length;
    },
    searchWallGroupfromWall : function(Obj){
        var i = 0;
        var mObj = null;
        if( Obj && (Obj.mResource == 9 || Obj.mResource == 8) )
        {
            for(i = 0; i < this.getSize(); i ++)
            {
                mObj = this.Objects[i];
                if(mObj && mObj.mResource == 101 && mObj.mid == Obj.mid)
                    return mObj;
            }
        }
        return null;
    },
    
    
};