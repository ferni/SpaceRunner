/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, TileEntity, _*/

var Unit = ItemEntity.extend({
    _paused: true,
    speed: 1, //tiles per second
    path: [],
    script: [],
    selected: false,
    //TODO: maybe make setting the size more direct
    size:[0.5,0.5],
    imgRow: 0,
    init: function(x, y, settings) {
        'use strict';
        var toImgRow;
        settings = this.completeSettings(settings);
        this.speed = settings.speed;
        this.imgRow = settings.imgRow;
        if(settings.turnDuration) {
            this.turnDuration = settings.turnDuration;
        }

        this.parent(x, y, {
            name: 'unit',
            image: 'creatures_16x16'
        });
        toImgRow = function(array){
            for(var i = 0; i < array.length; i++){
                array[i] += settings.imgRow * 4;
            }
            return array;
        };
        this.addAnimation('idle', toImgRow([0, 1, 2, 1]));

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');
    },
    pause: function() {
        'use strict';
        this._paused = true;
        this.adjustPath();
        this.script = [];
        //update position on ship
        if(this.onShip()){
            if(this.onShip() === true){
                throw "onShip shouldn't be true, it should be a Ship";
            }
            this.onShip().buildingsChanged();
        }
    },
    resume: function() {
        'use strict';
        this._paused = false;
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
    },
    update: function() {
        'use strict';
        //Assumes it's the battle screen
        var screen = me.state.current(),
            elapsed,
            position;
        if (this._paused) {
            //if update doesn't return true, melonjs breaks
            return true;
        }
        this.parent();
        if (screen.name !== 'battle') {
            throw 'The unit should be on the battle screen (update).';
        }
        elapsed = screen.getElapsedTime();
        position = this.getPosGivenTime(elapsed);

        //TODO: set the pixel position, and calculate the tile position
        this.x(position.x);
        this.y(position.y);
        return true;
    },
    completeSettings: function(settings){
        'use strict';
        if (!settings) {
            settings = {};
        }
        if (!settings.imgRow) {
            settings.imgRow = 0;
        }
        if(!settings.speed){
            settings.speed = 1;
        }
        return settings;
    },
    drawPath: function(ctx){
        'use strict';
        var outOfReach = false, i,
            path = this.path,
            reachLength = this.script.length;
        if (path.length === 0) {
            return;
        }
        if (path.length === 1) {
            //console.warn('drawPath: path given to draw has 1 length');
            return;
        }
        path = utils.pathToPixels(path);
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        if(!this.selected) {
            ctx.globalAlpha = 0.5;
        }
        ctx.moveTo(path[0][0], path[0][1]);
        for (i = 1; i < path.length; i++) {
            if (i === reachLength) {
                ctx.beginPath();
                ctx.strokeStyle = 'orange';
                ctx.moveTo(path[i - 1][0], path[i - 1][1]);
                outOfReach = true;
            }
            ctx.lineTo(path[i][0], path[i][1]);
            ctx.stroke();
        }

        ctx.beginPath();
        if (outOfReach) {
            ctx.fillStyle = 'orange';
        }else {
            ctx.fillStyle = 'green';
        }

        ctx.arc(path[path.length - 1][0], path[path.length - 1][1],
            HALF_TILE / 2, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    },
    /**
     *Generates a list of positions and the corresponding time
     * according to the unit's path and speed.
     *Stores the list in the "script" array.
     * @param {int} maxTime max time in milliseconds.
     * @param pathStart {int} path index from which it should start processing.
     */
    generateScript: function(maxTime, pathStart) {
        'use strict';
        var i,
            step = this.getTimeForOneTile() * 1000,
            elapsed,
            pos;

        if (!pathStart) {
            pathStart = 0;
            this.script = [];
        }
        elapsed = pathStart * step;
        for (i = pathStart; i < this.path.length && elapsed <= maxTime;
            i++, elapsed += step) {
            pos = {
                x: this.path[i][0],
                y: this.path[i][1]};
            this.script.push({pos: pos, time: elapsed});
        }
        //console.log('generated script for unit '+ this.GUID);
        //this.printScript();
    },
    /**
     * End of turn position according to the script
     * @returns {*}
     */
    eotPos: function(){
        'use strict';
        if (this.script.length > 0) {
            return this.script[this.script.length - 1].pos;
        } else {
            return {x: this.x(), y: this.y()};
        }
    },
    willMove: function(){
        return this.script && this.script.length > 0;
    },
    adjustPath: function() {
        'use strict';
        this.path = _.last(this.path, this.path.length -
            this.script.length + 1);
    },
    printScript: function() {
        'use strict';
        _.each(this.script, function(frame) {
            console.log(frame.time + 'ms : (' + frame.pos.x + ', ' +
                frame.pos.y + ')');
        });
    },
    getPosGivenTime: function(elapsed) {
        'use strict';
        var i,
            frame,
            prevFrame,
            interpolationFactor,
            interpolationX,
            interpolationY,
            position;
        if (this.script.length === 0) {
            return {x: this.x(), y: this.y()};
        }
        //find first frame
        for (i = 0; i < this.script.length; i++) {
            if (this.script[i].time === elapsed) {
                return this.script[i].pos;
            }
            if (this.script[i].time > elapsed) {
                break;
            }
        }
        //surpassed script's last frame time
        if (i >= this.script.length) {
            //return last position
            return this.script[this.script.length - 1].pos;
        }
        frame = this.script[i];
        if (i > 0) {
            prevFrame = this.script[i - 1];
        }
        else
        {
            //time elapsed it's exactly the frame time
            if (frame.time !== elapsed) {
                throw 'expected time elapsed to be equal to frame time';
            }
            return frame.pos;
        }

        interpolationFactor = (elapsed - prevFrame.time) /
            (frame.time - prevFrame.time);
        interpolationX = interpolationFactor *
            (frame.pos.x - prevFrame.pos.x);
        interpolationY = interpolationFactor *
            (frame.pos.y - prevFrame.pos.y);
        position = new me.Vector2d(prevFrame.pos.x, prevFrame.pos.y);
        position.x += interpolationX;
        position.y += interpolationY;
        return position;

    },
    getTilesTraversedGivenTime: function(seconds) {
        'use strict';
        return seconds * this.speed;
    },
    //this should be divisor of TURN_DURATION
    //check that on battle screen
    getTimeForOneTile: function() {
        'use strict';
        return 1 / this.speed;
    },
    insertWait: function(scriptIndex, milliseconds) {
        'use strict';
        var i, forCopying, forInserting;
        if (scriptIndex < 0 || scriptIndex >= scriptIndex.length) {
            throw 'scriptIndex out of bounds (' + scriptIndex+ ')';
        }
        if (milliseconds <= 0) {
            throw 'Inserted wait time should be a positive greater than' +
                ' zero value.';
        }
        forCopying = this.script[scriptIndex];
        forInserting = {
            pos: {x: forCopying.pos.x, y: forCopying.pos.y},
            time: forCopying.time
        };

        this.script.splice(scriptIndex, 0, forInserting);
        this.path.splice(scriptIndex, 0, this.path[scriptIndex]);
        for (i = scriptIndex + 1; i < this.script.length; i++) {
            this.script[i].time += milliseconds;
        }
        //remove script that does not fit into time
        this.cropScript(this.turnDuration);
    },
    /**
     *
     * @param scriptIndex {int} Must be the same as used in insertWait.
     */
    removeWait: function(scriptIndex) {
        'use strict';
        var waitingTime, i;
        waitingTime = this.script[scriptIndex + 1].time -
                      this.script[scriptIndex].time;
        this.script.splice(scriptIndex, 1);
        this.path.splice(scriptIndex, 1);
        for (i = scriptIndex; i < this.script.length; i++) {
            this.script[i].time -= waitingTime;
        }
        this.generateScript(this.turnDuration,
            this.script.length);
    },
    /**
     * Deletes frames that are not within maxTime
     * @param maxTime
     */
    cropScript: function(maxTime){
        var i, removeAt;
        for (i = 0; i < this.script.length; i++) {
            if (this.script[i].time > maxTime) {
                removeAt = i;
                break;
            }
        }
        this.script.splice(removeAt, this.script.length - removeAt);
    },
    getTimeWindow: function(scriptIndex){
        var //total = this.getTimeForOneTile(),
            time = this.script[scriptIndex].time;
        //  from = time  - (total / 2);
        if(!this.turnDuration) {
            throw 'The turn duration for the unit has not been set';
        }
        return {
            from: time,
            to: this.script[scriptIndex + 1] ?
                this.script[scriptIndex + 1].time :
                this.turnDuration
        }
    },
    toJson: function(){
        var self = this;
        return {
            x: self.x(),
            y: self.y(),
            settings: {
                imgRow: self.imgRow,
                speed: self.speed
            }
        }
    }
});

var units = {
    'default' : Unit
};