var chatClient = (function() {
    'use strict';
    var client = {};
    function ChatViewModel(){
        var self = this,
            fetchIntervalID;

        //array of: {id:<num>, sender:<string>, message:<string>}
        this.lines = ko.observableArray([{
            id:0,
            sender:'Chat',
            message:'Welcome to the chat.'

        }]);
        this.input = ko.observable('');
        this.enabled = ko.observable(false);
        this.fetch = function(){
            var $linesDom = $('#lines');
            $.getJSON('chat/getlines', {
                    last: this.lines()[this.lines().length - 1].id,
                    max: 25},
                function(fetchedLines){
                    for(var i = 0; i < fetchedLines.length; i++){
                        self.lines.push(fetchedLines[i]);
                    }
                    if(fetchedLines.length > 0) {
                        //scroll to bottom
                        $linesDom.scrollTop($linesDom.get(0).scrollHeight);
                    }
                });
        };
        this.send = function(){
            $.post('chat/send',
                {line: {
                    message: this.input()
                }}, 'json');
            this.input('');
        };
        this.enable = function(){
            //start fetching
            fetchIntervalID = setInterval(function(){
                self.fetch();
            },400);
            this.enabled(true);
        };
        this.disable = function(){
            clearInterval(fetchIntervalID);
            this.enabled(false);
        };

    }

    client.start = function(){
        var $clientDom = $('#chat-client');
        if($clientDom[0] !== undefined){
            ko.applyBindings(new ChatViewModel(), $clientDom.get(0));
            $clientDom.find('input').focus();
        }else{
            console.warn('#chat-client div not found');
        }
    };
    return client;
})();



