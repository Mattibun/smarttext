Smart Text
=====

```
var st=require("@owloil/smarttext");
console.log(st.generateText("This package is {great;awesome;dope}{!;.;!!!;?}"));
//out: This package is dope?
```

This is my own take on ["Practical Procedural Generation for Everyone"](https://www.youtube.com/watch?v=WumyfLEa6bU) and its implementation [Tracery](http://tracery.io/).
It's not very original, but it uses [pegjs](https://pegjs.org/) to 
parse grammars and handle random choice, substitution, assignment, and 
some other things.


Examples
---

### Output the birthday example to the console
happybirthday.gg:
```
return:={Dear $name,

{We wish you a;Have a happy} birthday{!;.} And congratulations on turning $age years {old;young}!

{Sincerely;Best wishes;Best;Happy holidays;Yours},

$name}
name:={Bob;Jane;Joey;Nobody}
age:={1;2;3;10;11;20;25;110}
```

index.js:
```
var st=require("@owloil/smarttext");
var parsed=st.parseFile("happybirthday.gg");
console.log(parsed.generateText());
//out: Dear Bob,</br>Have a happy birthday! And congratulations on turning 11 years young!</br>Yours,</br>Joey
```

We can also change the newline style by using the options on generateText:
```
var st=require("@owloil/smarttext");
var parsed=st.parseFile("happybirthday.gg");
console.log(parsed.generateText(undefined,{paragraphmarker:"\n"}));
/*out: Dear Nobody,
Have a happy birthday! And congratulations on turning 3 years old!
Yours,
Nobody*/
```

### Concatenate substitution lists from two sources

```
var st=require("@owloil/smarttext");

var parsed1=st.parse(`letters1:={a;b;c;d;e}
  names1:={john;joey;mark;adam}`);

var parsed2=st.parse(`letters2:={f;g;h;i;j}
  names2:={jane;mary;katelyn}`);

parsed1.appendSubstitutions(parsed2.getSubstitutions());

console.log(parsed1.generateText("$letters1, $names1, $letters2, $names2"));
//out: d, mark, j, jane
```

### Using properties

Properties are used to insert text made by arbitrary javascript functions into the generated text. 
Here, "[He] ran [his] [nailscolor] nails through [his] [haircolor] hair." can be modified so that 
[He] gets replaced by "She". 

```
var st=require("@owloil/smarttext");

var haircolor="blue";
var nailscolor="green";
var pronoun1="He";
var pronoun2="his";

var properties={"haircolor": (()=>haircolor), 
  "nailscolor": (()=>nailscolor),
  "He": (()=>pronoun1),
  "his": (()=>pronoun2)};

var parsed=st.parse("return:=[He] ran [his] [nailscolor] nails through [his] [haircolor] hair.");
parsed.setProperties(properties);
console.log(parsed.generateText());
//out: He ran his green nails through his blue hair.

haircolor="brown";
nailscolor="orange";
pronoun1="She";
pronoun2="her";
console.log(parsed.generateText());
//out: She ran her orange nails through her brown hair.
```

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

`this.generateText=function(arg,o)` ---- if arg is undefined, look to see if a "return:=" statement
has been defined. If so, return that. If arg is a string, that string is parsed using any substitutions and 
properties stored in this. The option object o accepts the parameter "paragraphmarker" which should be 
a string to be substituted whenever two newlines occur in a row.

`this.getSubstitutions=function()` ---- gets the substitutions list. 
A substitutionslist is an object like 
`{"return":"string1","other":"string2"}`.

`this.countPossible=function()` ---- counts the number of possible outputs. For example, 
"{{a,b,c},{d,e,f}}" has six possible outputs, while "{a,b,c} {d,e,f}" has nine possible outputs.
This number gets large very quickly, so in a large example you could expect this number to overflow.

`this.appendSubstitutions=function(arg)` ---- Appends substitutions to the substitution list.

`this.appendProperties=function(arg)` ---- Appends properties. Arg should be an object of key-value
pairs whose keys are simple identifiers and whose values are functions that return a single string.

`this.setProperties=function(arg)` ---- Sets the properties list, erasing whatever stored functions
used to be there.


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
