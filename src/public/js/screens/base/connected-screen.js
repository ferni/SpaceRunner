
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global GameScreen, $*/

 /**
  * A screen that updates automatically from the server.
  * Override onData function to process the incoming data.
  * @type {*}
  */
var ConnectedScreen = GameScreen.extend({
    init: function(name) {
        'use strict';
        this.parent(name);
        this.url = name + '/get';
    },
    onReset: function(settings){
        'use strict';
        if (settings.id !== undefined) {
            this.id = settings.id;
        }else if (this.id === undefined) {
            throw 'ConnectedScreen should have id, or passed as a setting.';
        }
        //start fetching the data
        this.startFetching();
        this.parent(settings);
    },
    onDestroyEvent: function(){
        'use strict';
        this.stopFetching();
        this.parent();
    },
    startFetching: function(){
        'use strict';
        var self = this;
        this.fetchIntervalID = setInterval(function() {
            $.post(self.url, {id: self.id}, function(data) {
                self.data = data;
                self.onData(data);
            }, 'json');}, 500);
    },
     stopFetching: function(){
         'use strict';
         clearInterval(this.fetchIntervalID);
     },
    onData: function(data){
        //override this (the data is stored in this.data)
        return data;
    }
});