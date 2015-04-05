/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/


/*global module, require*/

var io;

module.exports = {
    init: function(ioWithServer) {
        'use strict';
        io = ioWithServer;
    },
    sendTo: function(userID, eventType, data) {
        'use strict';
        io.to('user:' + userID).emit(eventType, data);
    },
    save: function(socket) {
        'use strict';
        socket.join('user:' + socket.request.user.id);
    }
};
