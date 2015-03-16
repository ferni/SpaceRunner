/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/


/*global module*/

var socketsByUser = {},
    io;

module.exports = {
    init: function(ioWithServer) {
        'use strict';
        io = ioWithServer;
    },
    sendTo: function(userID, screen, eventType, data) {
        'use strict';
        if (socketsByUser[userID]) {
            if (socketsByUser[userID][screen]) {
                io.to(socketsByUser[userID][screen])
                    .emit(eventType, data);
            } else {
                console.log('User ' + userID + ' not in screen ' + screen);
            }
        } else {
            console.log('User ' + userID + ' does not have an open socket');
        }
    },
    save: function(socket, screen) {
        'use strict';
        var userID = socket.request.user.id;
        if (!socketsByUser[userID]) {
            socketsByUser[userID] = {};
        }
        socketsByUser[userID][screen] = socket.id;
    },
    remove: function(socket, screen) {
        'use strict';
        var userID = socket.request.user.id;
        delete socketsByUser[userID][screen];
    }
};