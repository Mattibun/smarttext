var parser=require("./basegrammar");
var sanitizer=require("./substitute.js");

var fs=require("fs");
var zizek=fs.readFileSync('zizek.gg','utf8');
var birthday=fs.readFileSync('happybirthday.gg','utf8');
var junk=fs.readFileSync('junk.gg','utf8');
var outhtml="<html><head><title>Generative Grammar Test</title></head><body>\r";

outhtml+="<h1>Junk Example</h1><pre>\r";
outhtml+=JSON.stringify(parser.parse(junk),null,2);
outhtml+="<h1>Sanitized Junk Example</h1><pre>\r";
outhtml+=JSON.stringify(sanitizer.rSanitize(parser.parse(junk)),null,2);
outhtml+="</pre><h1>Birthday Example</h1><pre>\r";
outhtml+=JSON.stringify(sanitizer.rSanitize(parser.parse(birthday)),null,2);
outhtml+="</pre><h1>Zizek example</h1><pre>\r"
outhtml+=JSON.stringify(sanitizer.rSanitize(parser.parse(zizek)),null,2);
outhtml+="</pre><h1>Unsdanitized Zizek example</h1><pre>\r"
outhtml+=JSON.stringify((parser.parse(zizek)),null,2);
outhtml+="</pre></body></html>";

fs.writeFile('pegtest.html', outhtml, function (err) {
  if (err) throw err;
  console.log('Saved!');
});


