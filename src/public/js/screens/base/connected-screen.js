
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

 /**
  * A screen that updates automatically from the server.
  * @type {*}
  */
var ConnectedScreen = GameScreen.extend({
    init: function(name) {
        this.parent(name);
        this.url = name + '/get';
    },
    onReset: function(settings){
        var self = this,
            first = true,
            id;
        if (typeof settings.id !== 'undefined') {
            id = settings.id;
        }else if (typeof this.id !== 'undefined') {
            id = this.id;
        }else {
            throw 'ConnectedScreen should have id, or passed as a setting.';
        }
        //start fetching the data
        this.fetchIntervalID = setInterval(function(){
            $.post(self.url, {id: settings.id}, function(data){
                self.data = data;
                if(first){
                   self.onDataInit();
                   first = false;
                }else{
                    self.onDataUpdated();
                }
            }, 'json');}, 1000);
        this.parent(settings);
    },
    onDestroyEvent: function(){
        clearInterval(this.fetchIntervalID);
        this.parent();
    },
    onDataInit: function(){
        //override this (the data is stored in this.data)
    },
    onDataUpdated: function(){
        //override this (the data is stored in this.data)
    }
});