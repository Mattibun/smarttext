
/* Turn strings into HTML paragraphs, 
 * turning *emphasis* into <em>emphasis</em> and **bold** into <strong>bold</strong>.
 * */
var htmlify=function(text){
    var replaceNewlineWithP=function(text){
        return "<p>"+text.replace(/\n/g,"</p><p>")+"</p>";
    };
    var replaceStarsWithEM=function(text){
        return text.replace(/\*(.*?)\*/g,"<em>$&</em>").replace(/\*/g,"");
    };
    var replaceDoubleStarsWithStrong=function(text){
        return text.replace(/\*\*(.*?)\*\*/g,"<strong>$&</strong>").replace(/\*\*/g,"");
    };
    return replaceStarsWithEM(replaceDoubleStarsWithStrong(replaceNewlineWithP(text)));
};

//Cut any commas who try to escape in half
var splitEscapedCommas=function(val){
    //Split every value into a list of comma delimited strings, unless the comma is escaped.
    //idea from https://stackoverflow.com/a/7330150/1030718
    return val.replace(/([^\\]),/g, '$1\u000B').split('\u000B');
};

//Turn a string "Hello:=1" into the array ["Hello","1"], and throw an error if it is not of this form.
//Note: "Hello:=" is turned into ["Hello",""]
var splitByAssignment=function(line){
    var ret=line.split(":=");
    if(!(_.isArray(ret)&&ret.length==2)){
        console.log("Error! Invalid line. No ':=' or multiple ':=' delimiter! Ignoring line. Line in question:");
        console.log(line);
    }
    return ret;
};

//A named rule is of the form "$rule". The argument to this function should NOT include the $ delimeter.
//This returns a function which, when passed o, returns a string. It fetches the string from calling o[str](o)
var parseNamedRule=function(str){
    return function(o){
        if(o[str]===undefined)
            return "$"+str; //fail without replacing the key
        else if(_.isFunction(o[str]))
            return o[str](o);
        console.log("invalid o["+str+"]! : " + o[str]);
        return "";
    };
};

//Turn a grammar syntax string "{Hello,Hi,Good morning $name{, you bastard}}!" into a function
//which accepts an object "o" and returns the required sentence. This is a recursive function. 
var compileRuleString=function(str){
    var choices=[]; //list of possible choices of functions that can be called.
    /* The goal of this parsing function is to fill choices with an array:
     *    [["a",func1,func2,"."],["b",func3,"!"]]
     * The compile function then returns a function which makes a random choice between these two arrays.
     * If it chooses the first array, for example, it returns "a"+func1(o)+func2(o)+"." */

    var flist=[]; // list of functions which accept objects, or strings. This is the ["a",func1,func2,"."] in the above example
    var register=""; //chunk of text being stored by the parser.
    var state=0;  // 0 is read plaintext, 1 is read $namedRule, 2 is read {} brackets.

    //used for ignoring '\\' '\$' '\,' '\{' and '\}' and just inserting '\' '$' ',' '{' and '}'.
    //only relevant for state==0
    var ignoreNextCharacter=false; 

    //Used for counting the number of opening curly brackets encountered minus closing curly brackets.
    //Only relevant for state==2
    var numBrackets=0; 

    var i=-1;
    while(i<str.length){
        i++;
        if(i==str.length){ //EOL!
            if(state==0){
                flist.push(register);
            } else if(state==1) {
                flist.push(parseNamedRule(register));
            } else if(state==2){
                console.log("ERROR: Mismatched curly braces while parsing rule "+str);
                flist.push(register); //push whatever junk is currently in the register.
            }
            choices.push(flist);
            flist=[];
            register="";
            break;
        }

        //Else not EOL, and we can actually parse.
        var c=str.charAt(i);

        if(state==0) {
            /* Adding plaintext
             * 5 special characters "\${}," means 5 ifs! 
             * One more if for if we just read a backslash and are ignoring a character
             * */
            if(ignoreNextCharacter) {
                if(c==="n")
                    register+="\n";
                else
                    register+=c;
                ignoreNextCharacter=false;
            } else if(c==="\\") { //if it's a backslash, it's escaping the next character.
                ignoreNextCharacter=true;
            } else if(c==='$') {
                //If the character is a $namedRule, start parsing it.
                flist.push(register);
                register="";
                state=1; //note that the "$" character is not added to the register.
            } else if(c==='{') {
                //If it's a barcket, it's an anonymous rule.
                flist.push(register);
                register="";
                numBrackets=0;
                state=2; //note that the "{" character is not added to the register.
            } else if(c==='}') {
                //If it's a closing bracket and we're in state 0, something's malformed.
                console.log("Error! Curly brace mismatch while parsing rule "+str);
                register+=c;
            } else if(c===',') {
                //If it's a comma, start a new random choice. We do not need to change state here.
                flist.push(register);
                register="";
                choices.push(flist);
                flist=[];
            } else {
                //not a special character, just add it to the register!
                register+=c;
            }
        } else if(state==1) {
            //Adding named rule
            if(c.search(/^[a-zA-Z0-9_]+$/)===0) { 
                //if the character is alphanumeric or has underscores, add it.
                register+=c;
            } else {
                flist.push(parseNamedRule(register));
                register="";
                state=0;
                i--; // move the counter back so that we read the non-alphanumeric character again, this time with state=0.
            }
        } else if(state==2){
            /* Adding anonymous rule.
             * This is where recursion is used. Rather than using a stack or anything complicated like that, 
             * we just read to the next closing bracket '}' and pass the contents to compileRuleString again!
             * Because we start in state 0 and only ever enter state 2 when we reach a '{' character, this 
             * will never undergo infinite recursion. The depth of recursion can only be the number of opening brackets.
             */
            if(c==='{') 
                numBrackets++;
            else if(c==='}')
                numBrackets--;

            if(numBrackets==-1){
                //We have reached the last closing bracket, 
                //and thus the end of our long journey.
                flist.push(compileRuleString(register));
                register="";
                state=0;
            } else {
                register+=c;
            }
        }
    }
    return function(o){
        var j=Math.floor(Math.random() * choices.length);
        var flist=choices[j];
        var ret="";
        for(var i=0;i<flist.length;i++){
            if(_.isFunction(flist[i]))
                ret+=flist[i](o);
            else if(_.isString(flist[i]))
                ret+=flist[i];
        }
        return ret;
    };
};

var compileGGDocument=function(str){
  //LAYERS OF SANITIZATION! Todo: split this into manageable functions and 
  //test them, because lord knows this needs testing!

  //Split by newlines and remove whitespace
  var lines=_.map(str.split("\n"),function(line){return line.trim();});

  //Remove empty lines or lines starting with "#"
  lines=_.filter(lines,function(line){return !((line==="")||(line.charAt(0)==='#'));});

  //Split each line into [key, value]
  lines=_.map(lines, splitByAssignment );

  //Remove all lines that are not lists of length two.
  lines=_.filter(lines,function(line){ return _.isArray(line)&&line.length==2; });

  //Compile all of the individual rules.
  lines=_.map(lines,function(line){ return [line[0],compileRuleString(line[1])]; });

  //Split every value into a list of comma delimited strings, unless the comma is escaped.
  //lines=_.map(lines,function(line){ return [line[0],splitEscapedCommas(line[1])]; });

  //Turn the list into an actual key-value pair. "o" for "output".
  var o={};
  lines.forEach(function(e){
    o[e[0]]=e[1];
  });

  return o;
};



