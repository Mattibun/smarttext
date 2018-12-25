var parser=require("./basegrammar");
var st=require("./substitute.js");
var fs=require("fs");

var outhtml="<html><head><title>Generative Grammar Test</title></head><body>\r";


outhtml+="<h1>Example of using [properties]. </h1>\r";
var inputtext="[He] went down to the store and declared \"I'm a [boy]\"";
props1={He:function(){return "He";},boy:function(){return "boy";}};
props2={He:function(){return "She";},boy:function(){return "girl";}};
smarttext=st.parse("return:="+inputtext);

outhtml+="<p>input text:</p><pre>"+inputtext+"</pre>";
outhtml+="<p>output text for two different declarations of []:</p>";
smarttext.setProperties(props1);
outhtml+="<p>"+smarttext.generateText()+"</p>";
smarttext.setProperties(props2);
outhtml+="<p>"+smarttext.generateText()+"</p>";

outhtml+="<h1>Sanitized Junk Example</h1>\r";
smarttext=st.parseFile("junk.gg");
outhtml+="<p>There are "+smarttext.countPossible()+" possible outputs.</p>";
outhtml+="<h3> Sample outputs:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+smarttext.generateText()+"</li>";
}
outhtml+="</ul>";
outhtml+="<h3> Raw parsed output:</h3>";
outhtml+="<pre>";
outhtml+=JSON.stringify(smarttext.getSubstitutions(),null,2);
outhtml+="</pre>";

outhtml+="<h1>Happy Birthday Example</h1>\r";
smarttext=st.parseFile("happybirthday.gg");
outhtml+="<p>There are "+smarttext.countPossible()+" possible outputs.</p>";
outhtml+="<h3> Sample outputs:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+smarttext.generateText()+"</li>";
}
outhtml+="</ul>";
outhtml+="<h3> Raw parsed output:</h3>";
outhtml+="<pre>";
outhtml+=JSON.stringify(smarttext.getSubstitutions(),null,2);
outhtml+="</pre>";

outhtml+="<h1>Zizek Example</h1>\r";
smarttext=st.parseFile("zizek.gg");
outhtml+="<p>There are "+smarttext.countPossible()+" possible outputs.</p>";
outhtml+="<h3> Sample outputs:</h3><ul>";
for(var i=0;i<5;i++){
  outhtml+="<li>"+smarttext.generateText()+"</li>";
}
outhtml+="</ul>";
outhtml+="<h3> Raw parsed output:</h3>";
outhtml+="<pre>";
outhtml+=JSON.stringify(smarttext.getSubstitutions(),null,2);
outhtml+="</pre>";

outhtml+="</body></html>";

fs.writeFile('pegtest.html', outhtml, function (err) {
  if (err) throw err;
  console.log('Saved!');
});


