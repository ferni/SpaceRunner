var chatClient = (function(){
    var client = {};
    function ChatViewModel(nickname){
        var self = this;
        this.nickname = nickname;
        //array of: {id:<num>, sender:<string>, message:<string>}
        this.lines = ko.observableArray([{
            id:0,
            sender:'Chat',
            message:'Welcome to the chat.'
        }]);
        this.input = ko.observable('');
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
                    sender: this.nickname,
                    message: this.input()
                }}, 'json');
            this.input('');
        };

        //start fetching
        setInterval(function(){
            self.fetch();
        },200);
    }

    client.start = function(nickname){
        var $clientDom = $('#chat-client'),
            vm = new ChatViewModel(nickname);
        ko.applyBindings(vm, $clientDom.get(0));

        $clientDom.find('input').focus();
    };
    return client;
})();



