var grammar=require("./basegrammar");
var _=require("underscore");
var fs=require("fs");

/*More useful TypeOf operator. Can return the following values:
string, array, assignment, choice, property, paragraphmarker, undefined.
*/
function myTypeOf(node) {
  if(typeof(node)==="string")
    return "string";
  if(Array.isArray(node))
    return "array";
  if(typeof(node)==="object")
    return node.type;
  return undefined;
}

//String helper functions
function joinStringsWithSpaces(str1,str2){
  var bool1=(str1.charAt(str1.length-1)==' ');
  var bool2=(str2.charAt(0)==' ');
  if(!bool1&&!bool2)
    return str1+" "+str2;
  if( (bool1 && !bool2)|| (!bool1 && bool2))
    return str1+str2;
  if(bool1 && bool2){
    return str1+str2.slice(1);
  }
}
function sanitizeStrings(list){
  if(list.length===0)
    return [];

  var newlist=[];
  var register=list[0];
  for(var i=1;i<list.length;i++){
    if((typeof(register)==="string") && (typeof(list[i])==="string") ){
      register=joinStringsWithSpaces(register, list[i]);
    } else {
      newlist.push(register);
      register=list[i];
    }
  }
  newlist.push(register);
  return newlist;
}

/* Recursive sanitizer to get rid of dumb objects like {type:"choice", value: [] } (empty choice),
 * or to combine strings and flatten arrays without changing output, for example,  [["mary had a","little"],["lamb"]] will
 * get sanitized to "mary had a little lamb" (note how spaces are handled!) */
function rSanitize(node){
  if(myTypeOf(node)==="array"){
    //First, call rSanitize on each element of the array and remove empty elements. (Strings like "" will be taken care of later).
    for(var i=0;i<node.length;i++){
      node[i]=rSanitize(node[i]);
      if(myTypeOf(node[i])==="array" && node[i].length ==0 ){
        node.splice(i,1);
        i--;
      }
    }
    //Flatten the structure, [["mary had a","little"],["lamb"]] -> ["mary had a","little","lamb"]
    node=_.flatten(node);
    //Combine same level strings, ["mary had a","little","lamb"] -> ["mary had a little lamb"]
    node=sanitizeStrings(node);
    if(node.length===1){
      // ["mary had a little lamb"]->"mary had a little lamb"
      return node[0];
    } else {
      return node;
    }
  } else if(myTypeOf(node)==="choice") {
    for(var i=0;i<node.value.length;i++){
      node.value[i]=rSanitize(node.value[i]);
      //Strings like "{;test}" will parse to a choice object like {type:"choice", value:[ [],["test"]]}.
      //So if we see an empty array, it's best to simplify it to an empty string. 
      if(myTypeOf(node.value[i])==="array" && node.value[i].length==0){
        node.value[i]="";
      }
    }

    if(node.value.length===0) {
      //if we had an empty choice, get rid of the choice object.
      return [];
    } else if(node.value.length===1) {
      //If we had a choice with 1 element, that's not really a choice, so we just return the node.
      return node.value[0];
    }
    return node;
  } else if (myTypeOf(node)==="assignment") {
    //Assignment nodes just get simplified recursively
    node.value=rSanitize(node.value);
    return node;
  }
  //No other nodes need simplifying, so we do nothing.
  return node;
}


function rCountPossible(node,substitutions){
  if(myTypeOf(node)==="string"){
    return 1;
  } else if(myTypeOf(node)==="array"){
    var result=1;
    for(var i=0;i<node.length;i++){
      //Number of possible outputs of "{a;b;c}{d;e;f}" is 9, 3 times 3.
      result*=rCountPossible(node[i],substitutions);
    }
    return result;
  } else if(myTypeOf(node)==="choice"){
    var result=0;
    for(var i=0;i<node.value.length;i++){
      //Number of possible outputs of "{{a;b;c};{d;e;f}}" is 6, 3 plus 3.
      result+=rCountPossible(node.value[i],substitutions);
    }
    if(result==0) { 
      result=1;
      console.log("Warning! Empty choice encountered. This should have been sanitized out.");
    }
    return result;
  } else if(myTypeOf(node)==="substitution"){
    if(node.id==="return"){
      throw new Error("Error! Infinite recursion by substituting return!");
    } else if(substitutions[node.id]===undefined) {
      console.log("Warning! Substitution id "+node.id+" is undefined!");
      return 1;
    } else {
      return rCountPossible(substitutions[node.id],substitutions);
    }
  } else if(myTypeOf(node)==="property"){
    return 1;
  } else if(myTypeOf(node)==="paragraphmarker") {
    return 1
  } else {
    throw new Error("Error! rCountPossible called on object with invalid type!");
  }
}

//substitutions, properties,allowReturn=false
/* substitutions an object
 * properties should be an object containing functions
 * allowReturn should be a boolean
 * these options should all be defined before calling the functions! If they are undefined there will be errors.
 * TODO: infinite recursion detection and reporting. (add a list of used substitutions, track that it hasn't occurred yet).
 * */
function rParseObject(node,o){
  if(myTypeOf(node)==="string"){
    return node;
  } else if(myTypeOf(node)==="array"){
    var ret="";
    for(var i=0;i<node.length;i++){
      ret+=rParseObject(node[i],o);
    }
    return ret;
  } else if(myTypeOf(node)==="choice"){
    var index = Math.floor(Math.random() * node.value.length);
    return rParseObject(node.value[index],o);
  } else if(myTypeOf(node)==="substitution"){
    if((!o.allowReturn)&&(node.id==="return")){
      throw new Error("Error! Infinite recursion detected when substituting return!");
      return "";
    } else if(o.substitutions[node.id]===undefined) {
      console.log("Warning! Substitution id "+node.id+" is undefined!");
      return "$"+node.id;
    } else {
      return rParseObject(o.substitutions[node.id],o);
    }
  } else if(myTypeOf(node)==="property"){
    if(o.properties[node.id]===undefined){
      return "["+node.id+"]";
    } else {
      return o.properties[node.id]();
    }
  } else if(myTypeOf(node)==="paragraphmarker") {
    return "</br>"
  }
}

//Sanitize an array of substitutions
function sanitize(substitutions){
  for(var i=0;i<substitutions.length;i++){
    substitutions[i]=rSanitize(substitutions[i]);
  }
  return substitutions;
}

var ParserObject=function(arg){
  
  var substitutions={};
  var properties={};
  var nPossible;

  if(arg!==undefined){
    var parsedData; 
    if(typeof(arg)==="string"){
      parsedData=sanitize(grammar.parse(arg));
    } else if(Array.isArray(arg)) {
      parsedData=arg;
    } else {
      throw new Error("Error! ParserObject constructor called without string or array argument!");
      parsedData=[];
    }
    for(var i=0;i<parsedData.length;i++){
      if(myTypeOf(parsedData[i])!=="assignment"){
        throw new Error("Error! Inside ParserObject constructor. Non-assignment node parsed.");
      } else {
        if(substitutions[parsedData[i].id] !== undefined){
          console.log("Warning! Inside ParserObject constructor. Assignment id "+parsedData[i].id+" multiply defined! ");
        } else {
          substitutions[parsedData[i].id]=parsedData[i].value;
        }
      }
    }
  }

  this.generateText=function(arg){
    if(arg===undefined){
      if(substitutions["return"] === undefined){
        throw new Error("Error in ParserObject.generateText! Return variable left undefined!");
        return "";
      } else {
        return rParseObject(substitutions["return"],{substitutions:substitutions,properties:properties,allowReturn:false});
      }
    } else if(typeof(arg)==="string"){
      var parsedData=parseToJSON("return:="+arg);
      if(parsedData.length>1){
        throw new Error("Error in ParserObject.generateText! arg passed with too many assignment declarations");
        return "";
      }
      //Third parameter tells rParseObject that substituting $return is fine. So you 
      //can pass in "This object returns $return" to generateText and not generate an error.
      return rParseObject(parsedData[0].value,{substitutions:substitutions,properties:properties,allowReturn:true});
    }
  };
  this.getSubstitutions=function(){
    return substitutions;
  };
  this.countPossible=function(){
    if(substitutions["return"] === undefined){
      console.log("Error! Return variable left undefined!");
    } else {
      return rCountPossible(substitutions["return"],substitutions);
    }
    return 1;
  };
  this.appendSubstitutions=function(arg){
    if(Array.isArray(arg)){
      for(var i=0;i<arg.length;i++){
        if(myTypeOf(arg[i])==="assignment"){
          if(substitutions[arg[i].id] !== undefined){
            console.log("Warning! Inside ParserObject.appendSubstitutions. Assignment id "+arg[i].id+" multiply defined! ");
          } else {
            substitutions[arg[i].id]=arg[i].value;
          }
        } else {
          console.log("Error! Unknown array element encountered in ParserObject.appendSubstitutions!");
        }
      }
    } else if (typeof(arg)==="object"){
      for(var key in arg){
        if(substitutions[key] !== undefined){
          console.log("Warning! Inside ParserObject.appendSubstitutions. Assignment id "+key+" multiply defined! ");
        } else {
          substitutions[key]=arg[key];
        }
      }
    } else {
      console.log("Error! Unknown object passed in to ParserObject.appendSubstitutions.");
    }
  };
  this.appendProperties=function(arg){
    if (typeof(arg)==="object"){
      for(var key in arg){ 
        if(properties[key] !== undefined){
          console.log("Warning! Inside ParserObject.appendProperties. Assignment id "+key+" multiply defined! ");
        } else {
          properties[key]=arg[key];
        }
      }
    } else {
      console.log("Error! Unknown object passed in to ParserObject.appendProperties.");
    }
  };
  this.setProperties=function(arg){
    if(typeof(arg)==="object")
      properties=arg;
    else
      console.log("Error! Non-object passed in to ParserObject.setProperties.");
  };
};

var parseFile=function(arg){
  var data=fs.readFileSync(arg,'utf8');
  return new ParserObject(data);
};
var parseToJSON=function(arg){
  return sanitize(grammar.parse(arg));
};

module.exports.parse=(function(arg){return new ParserObject(arg);});
module.exports.parseFile=parseFile;
module.exports.empty=(function(){return new ParserObject();});
module.exports.generateText=(function(str){return (new ParserObject("return:="+str)).generateText();});
module.exports.parseToJSON=parseToJSON;
