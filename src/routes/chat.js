/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, linesInServer*/

var url = require('url'),
    auth = require('../screens/_common/server-js/auth'),
    chat = require('../screens/_common/server-js/chat');

/**
 * Gets all the chat lines.
 * @param {*} req
 * @param {*} res
 */
exports.getlines = function(req, res) {
    'use strict';
    var queryData = url.parse(req.url, true).query,
        lastLineId = parseInt(queryData.last, 10),
        maxLines = queryData.max,
        lastLineIndex,
        i,
        forSending = [];
    for (i = 0; i < linesInServer.length; i++) {
        if (linesInServer[i].id === lastLineId) {
            lastLineIndex = i;
            break;
        }
    }
    if (maxLines && linesInServer.length - lastLineIndex > maxLines) {
        lastLineIndex = linesInServer.length - maxLines - 1;
    }
    for (i = lastLineIndex + 1; i < linesInServer.length; i++) {
        forSending.push(linesInServer[i]);
    }
    res.json(forSending);
};

/**
 * Send a line to the server
 * @param {*} req
 * @param {*} res
 */
exports.send = function(req, res) {
    'use strict';
    var line = req.body.line;
    chat.addLine(auth.getPlayer(req).name, line.message);
    res.json({});
};
