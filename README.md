Smart Text
=====

```
var st=require("@owloil/smarttext");
console.log(st.generateText("This package is {great;awesome;dope}{!;.;!!!;?}"));
//out: This package is dope?
```

Description
---

This is my own take on ["Practical Procedural Generation for Everyone"](https://www.youtube.com/watch?v=WumyfLEa6bU) and its implementation [Tracery](http://tracery.io/).
It's not very original, but it uses [pegjs](https://pegjs.org/) to 
parse grammars and handle random choice, substitution, assignment, and 
some other things.


Examples
---

### Output the birthday example to the console
happybirthday.gg:
```return:={Dear $name,

{We wish you a;Have a happy} birthday{!;.} And congratulations on turning $age years {old;young}!

{Sincerely;Best wishes;Best;Happy holidays;Yours},

$name}
name:={Bob;Jane;Joey;Nobody}
age:={1;2;3;10;11;20;25;110}```

index.js:
```
var st=require("@owloil/smarttext");
var parsed=st.parseFile("happybirthday.gg");
console.log(parsed.generateText());
//out: Dear Bob,</br>Have a happy birthday! And congratulations on turning 11 years young!</br>Yours,</br>Joey
```


### Concatenate substitution lists from two files

### Using appendSubstitutions

```
var st=require("@owloil/smarttext");
var e=st.empty();
e.appendSubstitutions( {"name":{type:"choice",value:["Jane","Jenny","Tom"]}});
console.log(e.generateText("My name is $name!"));
//out: My name is Jane!
```

### Using properties

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

Exports
---


### parse(string)

Attempts to parse the string. Returns a ParserObject with the following commands:

`this.generateText=function(arg,o)`


`this.getSubstitutions=function()`

`this.countPossible=function()` ---- counts the number of possible outputs. For example, 
"{{a,b,c},{d,e,f}}" has six possible outputs, while "{a,b,c} {d,e,f}" has nine possible outputs.
This number gets large very quickly, so in a large example you could expect this number to overflow.

`this.appendSubstitutions=function(arg)` ---- A substitutionslist is an object like 
{"return":"string",


`this.appendProperties=function(arg)`

`this.setProperties=function(arg)`


### parseFile(filename)
Loads filename as a utf8 string using fs.readFileSync, and returns a `new ParserObject(data);`.


### empty()
Calls  `return new ParserObject();` This is an empty object with no return values, but all the 
methods denoted above.

### generateText(string)
Calls  `return (new ParserObject("return:="+str)).generateText();`

### parseToJSON(string)
Returns a JSON object as defined by the Grammar section of this document. This should be 
a list of assignment objects. Note that
`parse(string).getSubstitutions()` returns a slightly different object, whose keys are the 
assignment ids and values are assignment strings. 
