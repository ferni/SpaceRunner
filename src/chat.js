/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global GLOBAL, linesInServer, exports*/


(function(chat) {
    'use strict';
    chat.lines = [];
    chat.init = function(io) {
        chat.lines = [{
            id: 0,
            sender: 'Server',
            message: 'Logged into chat'
        }];
        io.on('connection', function(socket) {
            socket.on('chat message', function(msg) {
                io.emit('chat message', {sender: 'someone', message: msg});
                chat.addLine('someone', 'message');
            });
        });
    };

    chat.addLine = function(sender, message) {
        chat.lines.push({
            sender: sender,
            message: message,
            id: chat.lines.length
        });
        if (chat.lines > 50) {
            chat.lines.shift();
        }
    };

    chat.log = function(message) {
        console.log(message);
        chat.addLine('Server', message);
    };

    chat.error = chat.log;
}(exports));
