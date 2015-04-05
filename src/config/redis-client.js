/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
var redis = require('redis'),
    Bromise = require('bluebird'),
    useOnline = false,
    url,
    redisURL,
    client;

Bromise.promisifyAll(redis);
if (useOnline) {
    console.log('Connecting to rediscloud...');
    url = require('url');
    redisURL = url.parse('redis://rediscloud:HapP0fPVKcGIVT5d@' +
        'pub-redis-11175.us-east-1-3.4.ec2.garantiadata.com:11175');
    client = redis.createClient(redisURL.port, redisURL.hostname,
        {no_ready_check: true});
    client.auth(redisURL.auth.split(':')[1]);
} else {
    client = redis.createClient();
}

module.exports = client;


