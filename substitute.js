var parser=require("./basegrammar");
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
      console.log("Error! Empty choice encountered. This should have been sanitized out.");
    }
    return result;
  } else if(myTypeOf(node)==="substitution"){
    if(node.id==="return"){
      console.log("Error! Infinite recursion by substituting return!");
      return 1;
    } else if(substitutions[node.id]===undefined) {
      console.log("Error! Substitution id "+node.id+" is undefined!");
      return 1;
    } else {
      return rCountPossible(substitutions[node.id],substitutions);
    }
  } else if(myTypeOf(node)==="property"){
    return 1;
  } else if(myTypeOf(node)==="paragraphmarker") {
    return 1
  } else {
    console.log("Error! rCountPossible called on object with invalid type!");
  }
}
function rParseObject(node,substitutions){
  if(myTypeOf(node)==="string"){
    return node;
  } else if(myTypeOf(node)==="array"){
    var ret="";
    for(var i=0;i<node.length;i++){
      ret+=rParseObject(node[i],substitutions);
    }
    return ret;
  } else if(myTypeOf(node)==="choice"){
    var index = Math.floor(Math.random() * node.value.length);
    return rParseObject(node.value[index],substitutions);
  } else if(myTypeOf(node)==="substitution"){
    if(node.id==="return"){
      console.log("Error! Infinite recursion by substituting return!");
      return "";
    } else if(substitutions[node.id]===undefined) {
      console.log("Error! Substitution id "+node.id+" is undefined!");
      return "";
    } else {
      return rParseObject(substitutions[node.id],substitutions);
    }
  } else if(myTypeOf(node)==="property"){
    return "["+node.id+"]";
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

function countPossible(parsedData){
  substitutions={};
  console.log(parsedData.length);
  for(var i=0;i<parsedData.length;i++){
    if(myTypeOf(parsedData[i])!=="assignment"){
      console.log("Error! Non-assignment node parsed.");
    } else {
      if(substitutions[parsedData[i].id] !== undefined){
        console.log("Error! Assignment id "+parsedData[i].id+" multiply defined!");
      } else {
        substitutions[parsedData[i].id]=parsedData[i].value;
      }
    }
  }

  if(substitutions["return"] === undefined){
    console.log("Error! Return variable left undefined!");
  } else {
    return rCountPossible(substitutions["return"],substitutions);
  }
  return 1;
}

function generateString(parsedData){
  substitutions={};
  console.log(parsedData.length);
  for(var i=0;i<parsedData.length;i++){
    if(myTypeOf(parsedData[i])!=="assignment"){
      console.log("Error! Non-assignment node parsed.");
    } else {
      if(substitutions[parsedData[i].id] !== undefined){
        console.log("Error! Assignment id "+parsedData[i].id+" multiply defined!");
      } else {
        substitutions[parsedData[i].id]=parsedData[i].value;
      }
    }
  }

  if(substitutions["return"] === undefined){
    console.log("Error! Return variable left undefined!");
  } else {
    
    return rParseObject(substitutions["return"],substitutions);
  }
  return "";

}

module.exports.sanitize=sanitize;
module.exports.generateString=generateString;
module.exports.countPossible=countPossible;
