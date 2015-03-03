/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/

var _ = require('underscore')._,
    sh = require('shared'),
    rc = require('../config/redis-client'),
    join = require('bluebird');
    //chat = require('./chat'),


function Player(hash) {
    'use strict';
    _.extend(this, hash);
    this.hash = hash;
}

Player.prototype.set = function(prop, value) {
    'use strict';
    var self = this;
    if (value === undefined) {
        this.del(prop);
    }
    return rc.hsetAsync('user:' + this.id, prop, value).then(function() {
        self[prop] = value;
        self.hash[prop] = value;
    });
};

Player.prototype.del = function(prop) {
    'use strict';
    var self = this;
    return rc.hdelAsync('user:' + this.id, prop).then(function() {
        delete self[prop];
        delete self.hash[prop];
    });
};

Player.prototype.toJson = function() {
    'use strict';
    return this.hash;
};

module.exports = {
    /**
     * Gets the player given an id.
     * @param {int} id
     * @return {*}
     */
    playerByID: function(id) {
        'use strict';
        return rc.hgetallAsync('user:' + id).then(function(hash) {
            return new Player(hash);
        });
    },
    /**
     * Creates a new player and add it to currentPlayers.
     * @return {sh.Player}
     */
    createNewPlayer: function(email, pass) {
        'use strict';
        var userHash = {
            email: email,
            pass: pass
        };
        return rc.incrAsync('next_user_id').then(function(id) {
            userHash.id = id;
            return rc.hmsetAsync('user:' + id, userHash).then(function() {
                return rc.hsetAsync('users', email, id);
            });
        }).then(function() {
            return new Player(userHash);
        });
    },
    exists: function(email) {
        'use strict';
        return rc.hexistsAsync('users', email);
    },
    byEmail: function(email) {
        'use strict';
        return rc.hgetAsync('users', email).then(function(id) {
            return rc.hgetallAsync('user:' + id);
        }).then(function(hash) {
            return new Player(hash);
        });
    }
};
