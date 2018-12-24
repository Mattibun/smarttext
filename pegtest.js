var parser=require("./basegrammar");
var sanitizer=require("./substitute.js");

var fs=require("fs");
var zizek=fs.readFileSync('zizek.gg','utf8');
var birthday=fs.readFileSync('happybirthday.gg','utf8');
var junk=fs.readFileSync('junk.gg','utf8');
var outhtml="<html><head><title>Generative Grammar Test</title></head><body>\r";


outhtml+="<h1>Sanitized Junk Example</h1>\r";
data=sanitizer.sanitize(parser.parse(junk));
outhtml+="<p>There are "+sanitizer.countPossible(data)+" possible outputs.</p>";
outhtml+="<h3> Sample output:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+sanitizer.generateString(data)+"</li>";
}
outhtml+="<pre>";
outhtml+=JSON.stringify(data,null,2);
outhtml+="</pre>";

outhtml+="<h1>Birthday Example</h1>\r";
data=sanitizer.sanitize(parser.parse(birthday));
outhtml+="<p>There are "+sanitizer.countPossible(data)+" possible outputs.</p>";
outhtml+="<h3> Sample output:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+sanitizer.generateString(data)+"</li>";
}
outhtml+="<pre>";
outhtml+=JSON.stringify(data,null,2);
outhtml+="</pre>";

outhtml+="<h1>Zizek Example</h1>\r";
data=sanitizer.sanitize(parser.parse(zizek));
outhtml+="<p>There are "+sanitizer.countPossible(data)+" possible outputs.</p>";
outhtml+="<h3> Sample output:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+sanitizer.generateString(data)+"</li>";
}
outhtml+="<pre>";
outhtml+=JSON.stringify(data,null,2);
outhtml+="</pre>";


fs.writeFile('pegtest.html', outhtml, function (err) {
  if (err) throw err;
  console.log('Saved!');
});


