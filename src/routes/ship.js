var redis = require('redis');

exports.save = function(req, res){
    var data = req.body,
        client = redis.createClient();

    client.hset('ships', data.name, data.buildings, function(error, reply){
        res.json({error: error, reply: reply});
    });
};

exports.load = function(req, res){
    var name = req.body.name,
        client = redis.createClient();

    client.hget('ships', name, function(error, reply){
        if(!error){
            res.json(reply);
        }else{
            res.json(null);
        }
    });
    
};
