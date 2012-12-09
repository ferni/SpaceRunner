/*
 * JavaScript Code : 
*/
var matrix = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
              [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
              [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
              [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
              [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]];
var MapMatrix = {
    MapGrid : null,
    init : function(mMatrix){
        if(this.MapGrid)
            delete this.MapGrid;
        this.MapGrid = new PF.Grid(18, 12, matrix);
    },
    setUnWalkable : function(mX, mY, mWidth, mHeight){
        var unPosX = 0;
        var unPosY = 0;
        for(unPosX = mX; unPosX < mX + mWidth; unPosX += checkCollision.TileWidth)
        {
            for(unPosY = mY; unPosY < mY + mHeight; unPosY += checkCollision.TileHeight)
            {
                this.MapGrid.setWalkableAt( Math.floor(unPosX / checkCollision.TileWidth), Math.floor(unPosY / checkCollision.TileHeight), false);
            }
        }
    },
    setWalkable : function(mX, mY, mWidth, mHeight){
        var unPosX = mX / checkCollision.TileWidth;
        var unPosY = mY / checkCollision.TileHeight;
        for(unPosX = mX; unPosX < mX + mWidth; unPosX += checkCollision.TileWidth)
        {
            for(unPosY = mY; unPosY < mY + mHeight; unPosY += checkCollision.TileHeight)
            {
                this.MapGrid.setWalkableAt( Math.floor(unPosX / checkCollision.TileWidth), Math.floor(unPosY / checkCollision.TileHeight), true);
            }
        }
    },
};