var couldLoadJsBeautifier = phantom.injectJs("tools/beautify.js");
var couldLoadGetFiles = phantom.injectJs("get-files.js");
if(!couldLoadJsBeautifier){
    console.log("ERROR: tools/beautify.js not found");
    phantom.exit();
}
if(!couldLoadGetFiles){
    console.log("ERROR: get-files.js not found");
    phantom.exit();
}

var files = getFiles("src",{
    extension:"js",
    exclude:["src"+fs.separator+"js"+fs.separator+"vendor"]
});

for(var i = 0; i < files.length; i++){
    console.log("Beautifying "+files[i]+" ...");
    var beautified = js_beautify(fs.read(files[i]),{
        jslint_happy: false
    });
    fs.write(files[i], beautified, "w");
}
phantom.exit();
