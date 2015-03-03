/*global require, module*/
var redis = require('redis');
var Promise = require("bluebird");
Promise.promisifyAll(redis);
/*
var url = require('url');
var redisURL = url.parse('redis://rediscloud:HapP0fPVKcGIVT5d@pub-redis-11175.us-east-1-3.4.ec2.garantiadata.com:11175');
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);

 module.exports = client;
*/

module.exports = redis.createClient();


