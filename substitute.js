var parser=require("./basegrammar");
var _=require("underscore");

function myTypeOf(node) {
  if(typeof(node)==="string")
    return "string";
  if(Array.isArray(node))
    return "array";
  if(typeof(node)==="object")
    return node.type;
  return undefined;
}
function rSanitize(node){
  if(myTypeOf(node)==="array"){
    for(var i=0;i<node.length;i++){
      node[i]=rSanitize(node[i]);
      if(myTypeOf(node[i])==="array" && node[i].length ==0 ){
        node.splice(i,1);
        i--;
      }
    }
    if(node.length===1){
      return node[0];
    } else {
      node=_.flatten(node);
      node=sanitizeStrings(node);
      return node;
    }
  } else if(myTypeOf(node)==="choice") {

    for(var i=0;i<node.value.length;i++){
      node.value[i]=rSanitize(node.value[i]);
      if(myTypeOf(node.value[i])==="array" && node.value[i].length==0){
        node.value[i]="";
      }
    }

    if(node.value.length===0) {
      return [];
    } else if(node.value.length===1) {
      return rSanitize(node.value[0]);
    }
    return node;
  } else if (myTypeOf(node)==="assignment") {
    node.value=rSanitize(node.value);
    return node;
  }
  return node;
}

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

module.exports.rSanitize=rSanitize;
