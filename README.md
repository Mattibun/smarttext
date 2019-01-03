Smart Text
=====

Description
---

The Grammar
---

The basegrammar.pegjs defines a grammar, which parses a string to a JSON object.
Arrays are meant to be concatenated together (so `["a","b","c"]` will generate the string
"abc"), and strings are interpreted literally. The object `{type:"paragraphmarker}` denotes
a newline and can be ignored (see generateText).

There are four other syntax features:
 1. **Assignment.** Each smart string should be assigned to some variable that can be looked
up later. It's some identifier (allowed characters [a-z\_.]+) followed by ":=" and can only
occur at the beginning of a line. Newlines are not allowed unless the newline is contained in a 
pair of brackets { }. The string "var := text" parses to `{ type:"assignment", id:"return", 
value:"text" }`
 2. **Choice.** Strings like "{text1,text2,text3}" will parse to the javascript object `{ type:"choice", value:
["text1","text2","text3"] }`. We allow whole paragraphs (newlines OK!) inside choice 
specifiers, because the brackets allow us to figure out where the statement starts and 
ends. The intention is to choose between the possibilities with equal weight.
 3. **Substitution.** Once you assign variables, you can substitute the value into the text
using $identifier. Substitutions are intended to be used to incorporate variables
previously declared using the ":=" symbol. The string "$identifier" parses to 
`{ type:"substitution", id:"idval" }`
 4. **Properties.** You can also substitute text using "[identifier]". It is like substitution,
but is intended to be used to substitute variables from the program itself. For example,
"My answer is [answer]." parses to `["My answer is ",{ type:"property", id:"answer" },"."]`

Examples
---

### Output the birthday example to the console

### Concatenate substitution lists from two files

### Using properties

Exports
---


### parse(string)

Returns a ParserObject with the following commands:
`this.generateText=function(arg,o)`
`this.getSubstitutions=function()`
`this.countPossible=function()`
`this.appendSubstitutions=function(arg)`
`this.appendProperties=function(arg)`
`this.setProperties=function(arg)`



`parse=(function(arg){return new ParserObject(arg);});`
`parseFile=parseFile;`
`module.exports.empty=(function(){return new ParserObject();});`
`module.exports.generateText=(function(str){return (new ParserObject("return:="+str)).generateText();});`
`module.exports.parseToJSON=parseToJSON;`
