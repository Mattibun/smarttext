
var st=require("./smarttext");
var fs=require("fs");
var ejs=require("ejs");


var args = process.argv.slice(2);

if(args.length!==2){
  throw new Error("exporter.js called with incorrect arguments!");
}

var parsed=st.parseFile(args[0]);
parsed.getSubstitutions

var title=parsed.generateText("$titleHTML");
var outjs=JSON.stringify(parsed.getSubstitutions(),null,2);
var noutputs=parsed.countPossible();
var inhtml=fs.readFileSync("exportertemplate.html",'utf8');

var outhtml=ejs.render(inhtml,{title:title,outjs:outjs,noutputs:noutputs});

fs.writeFileSync(args[1],outhtml,'utf8');
