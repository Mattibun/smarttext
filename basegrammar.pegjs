{
	function concatArray(a1,a2) {
		if(Array.isArray(a2)) 
        	if(Array.isArray(a1))
            	return a1.concat(a2);
            else
            	return [a1].concat(a2);
        else 
        	if(Array.isArray(a1))
            	return a1.concat([a2]);
            else
            	return [a1,a2];
    }
}

document= a:document0 { return a;}

document0 = whitespacene a2:document0 { return a2; } 
/ a1:assignment a2:document0 { return [a1].concat(a2); } 
/ a1:comment a2:document0 { return a2; }
/ whitespace { 
    return []; 
}


 /**                 SmartText                
 A piece of smarttext is a piece of text making use of $substitutions, 
 {choice}s, comments, and dumb strings. It has no newlines unless those
 newlines are contained within comments or {choice}s.
 
 smarttext will sometimes return an array, or sometimes an object/string
 if no concatenation of strings is required.
*/
smarttext= a1:primitive a2:smarttext { return concatArray(a1,a2); }
/ comment a2:smarttext { return a2; }
/ primitive
/ comment { return []; }


 /**                 SmartParagraphs                
 smartparagraph matches a single paragraph, smartparagraphs match multiple
 paragraphs. In a single paragraph, you may have one newline but not two
 newlines per line (LaTeX style). If you have two newlines in a row,
 a line break "paragraphmarker" is inserted and the next paragraph is added.
*/
smartparagraphs = a1:smartparagraph a2:smartparagraphs { return concatArray(a1,a2); }
/ whitespacene a2:smartparagraphs { 
	if(a2.length>0)
		return [{ type: "paragraphmarker"}].concat(a2); 
    return [];
}
/ whitespace { return []; }

smartparagraph= a1:primitive a2:smartparagraph { return concatArray(a1,a2); }
/ singlenewline a2:smartparagraph { return a2; }
/ comment a2:smartparagraph {  return a2; }
/ primitive
/ comment { return []; }


/**                                    Primitive Symbols 
The four basic functional syntax features are:
 1. Assignment. Each smart string should be assigned to some variable that can be looked
up later. It's some identifier (allowed characters [a-z_.]+) followed by ":=" and can only
occur at the beginning of a line.
 2. Choice. Strings like "{text1,text2,text3}" will parse to { type:choice, value:
["text1","text2","text3"] }. We allow whole paragraphs (newlines OK!) inside choice 
specifiers, because the brackets allow us to figure out where the statement starts and 
ends.
 3. Substitution. Once you assign variables, you can substitute the value into the text
using $identifier. Substitutions are intended to be used to incorporate variables
previously declared using the ":=" symbol.
 4. Properties. You can also substitute text using [identifier]. It is like substitution,
but is intended to be used to substitute variables from the program itself. For example,
you could write "My answer is [answer].", and the program would look up what the javascript
"answer" variable was. 
*/
primitive = choice / substitution / property / dumbstringnonempty

assignment = spaces idval:identifier spaces ":=" spaces smrt:smarttext {
    return { type:"assignment",id:idval, value:smrt };
}

choice = "{" ch:choicelist "}" { 
    return {type:"choice", value:ch }; 
}
choicelist=  a1:smartparagraphs ";" a2:choicelist { return [a1].concat(a2); } 
/ a1:smartparagraphs { return [a1]; }

substitution= "$" idval:identifier { 
    return { type:"substitution", id:idval }; 
}

property= "[" idval:identifier "]" { 
    return { type:"property", id:idval }; 
}

/* terminal symbols */
//Dumb strings are used in single line commands
dumbstring = str:(!("//") !("/*") [^\r\n;{}\[\]$]i)* {return text();} 
dumbstringnonempty = str:(!("//") !("/*") [^\r\n;{}\[\]$]i)+ {return text();}
//identifiers are allowed variable names
identifier = str:[a-z0-9_.]i+ { return text();}

//whitespace definitions
spaces=[ \t]*
whitespace = [\r\n\t ]*
whitespacene = [\r\n\t ]+
newline=[\r\n]
singlenewline= !(newline newline) newline

//comment definitions (commentmulti from https://stackoverflow.com/a/26556852 )
comment = commentmulti / commentsingle 
commentsingle = '//' p:([^\n\r]*) {return p.join('')}
commentmulti = "/*" (!"*/" .)* "*/"

