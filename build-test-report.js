//This file is for running with PhantomJS
var page = require('webpage').create();
var fs = require("fs");

var rootUrl = require("system").args[1];
if(rootUrl[rootUrl.length - 1] != "/")
    rootUrl = rootUrl + "/";
var testsUrl = rootUrl + "test.html";

console.log("Starting report ...");
var reportPath = beginReport();

console.log("Opening "+ testsUrl +" ...");

page.open(testsUrl, function () {
	console.log("Running tests ...");
	onTestsDone(page,function(){
		writeTestsReport(page);
		console.log("Retrieving code coverage information ...");
		var coverage =page.evaluate(function(){return JSON.stringify(_$jscoverage);});
    	writeCoverageReport(coverage, function(){
    	    finishReport();
    	    console.log("Report finished at "+reportPath+". Open this file in your browser.");
    	    phantom.exit();
    	});
        
	});
});

//Creates the report file and returns its path
function beginReport(){
    var number = 1;
    var path = "build/report.html";
    console.log("Creating report ...");
    fs.copy("report-beginning.html", path);
    fs.write(path, "<span id='report-date'>"+ getCurrentDate(false)+"</span>", "a");
    return path;
}

function finishReport(){
    fs.write(reportPath, "</body></html>", "a");
}

function writeTestsReport(qunitPage){
    var couldLoadJQuery = qunitPage.injectJs("jquery-1.9.0.min.js");
    if(couldLoadJQuery){
        qunitPage.evaluate(function(){$("a").attr("href","#");});
    }
    
    var testsHtml = qunitPage.evaluate(function(){
        return document.getElementById("qunit").outerHTML;
    });
    console.log("Copying tests html to report ...");
    fs.write(reportPath,testsHtml,"a");
}

function writeCoverageReport(coverage, onDone){
    var coverageUrl = rootUrl + "jscoverage.html";
    console.log("Opening "+coverageUrl+" ...");
    page.open(coverageUrl, function(){
        var summary = page.evaluate(function(c){
            window._$jscoverage = JSON.parse(c);
            jscoverage_recalculateSummaryTab();
            return document.getElementById("summaryDiv").outerHTML;
        },coverage);
        console.log("Copying code coverage html to report ...");
        fs.write(reportPath, "<div id='jscoverage' style='display:none'>"+summary+"</div>", "a");
        onDone();
    });
}

function onTestsDone(page, callback){
	page.evaluate(function(){
		window._testDetails = null;
		QUnit.done(function(details){
			_testDetails = details;
		});
		window._modulesDone = new Array();
		QUnit.moduleDone(function( details ) {
          _modulesDone.push(details);
        });
	});
	var modulesLogged  = 0;
	var interval = setInterval(function(){
		var info = page.evaluate(function(){
			return {testDetails: _testDetails, modulesDone: _modulesDone};
		});
		for(var i = modulesLogged; i < info.modulesDone.length; i++){
		    var m = info.modulesDone[i];
	        console.log(" * "+m.name+"(Passed "+m.passed +" of "+m.total+")");
	        modulesLogged++;
		}
		
		if(info.testDetails){
			console.log("Tests completed (Passed "+info.testDetails.passed+" of "+info.testDetails.total+").");
			clearInterval(interval);
			callback();
		}else{
			//console.log("Tests not done yet...");
		}
	}, 100);
}

function getCurrentDate(reverse){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10){dd='0'+dd} 
    if(mm<10){mm='0'+mm}
    if(reverse)
        today = yyyy+'-'+ mm+'-'+dd;
    else
        today = dd+'/'+mm+'/'+yyyy;
    return today;
}
