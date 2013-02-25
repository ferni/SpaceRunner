/*This file is for running with PhantomJS
    Reports problems found with JSLint
*/
var couldLoadJsLint = phantom.injectJs("tools/jslint.js");
var couldLoadGetFiles = phantom.injectJs("get-files.js");
if(!couldLoadJsLint){
    console.log("ERROR: tools/jslint.js not found");
    phantom.exit();
}
if(!couldLoadGetFiles){
    console.log("ERROR: get-files.js not found");
    phantom.exit();
}

//Returns an array with paths to js files which would be analized with JSLint
function getFilesForLint(){
    return getFiles("src", {
        extension: "js", 
        exclude: ["src"+fs.separator+"js"+fs.separator+"vendor"]
    });
}

function reportForFile(path){
    console.log("----- (JSLint) FILE  :  "+path+"   -----");
    if(!fs.exists(path)){ 
        console.log(path+" does not exist!");
        return;
    }
    if(!fs.isFile(path)){
        console.log(path+" is not a file.");
        return;
    }
    var allOk = JSLINT(fs.read(path), {
		nomen: true,
		white: true,
		browser: true,
		devel: true,
		plusplus: true
	});
    if(allOk){
        console.log("JSLint found no problems.");
    }else{
        var errors = JSLINT.errors;
        for(var i = 0; i < errors.length; i++){
            if(errors[i] === null){
                break;
            }
            console.log("Line "+errors[i].line+": "+errors[i].reason);
        }
    }
}

//returns object,
//obj.correct = true if header is correct
//obj.line is differing line
function checkHeader(file){
    var headerLines = ['/*',
            '-*- coding: utf-8 -*-',
            '* vim: set ts=4 sw=4 et sts=4 ai:',
            '* Copyright 2013 MITHIS',
            '* All rights reserved.',
            '*/'],
        line,
        stream = fs.open(file, 'r');
    for(var i = 0; i < headerLines.length; i++){
        line = stream.readLine();
        if(line !== headerLines[i]){
            return {correct: false, line: i};
        }
    }
    return {correct: true};
}

function checkHeaders(files){
    var checkHeaderResult, isCorrect, i, incorrectFiles = [];
    console.log('\n*************************');
    console.log('******   HEADERS   ******');
    console.log('*************************');
    for(i = 0; i < files.length; i++){
        checkHeaderResult = checkHeader(files[i]);
        isCorrect = checkHeaderResult.correct;
        if(!isCorrect){
            incorrectFiles.push({
                    file: files[i],
                    line: checkHeaderResult.line
            });
        }
    }
    if(incorrectFiles.length > 0){
        console.log('The following ' + incorrectFiles.length + ' files have incorrect headers:');
        for(i = 0; i < incorrectFiles.length; i++){
            console.log(' - ' + incorrectFiles[i].file +
                ' (Line ' + incorrectFiles[i].line + ')');
        }
    }
    console.log('\n('+ (files.length - incorrectFiles.length) + ' files OK)\n');
}

//"Main"

var files = getFilesForLint();

for(var i = 0; i < files.length; i++){
    reportForFile(files[i]);
}
checkHeaders(files);
phantom.exit();


