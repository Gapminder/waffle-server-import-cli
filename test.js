'use strict';

let request = require('superagent');
let request2 = require('request-stream');
let through2 = require('through2');
let JSONStream = require('JSONStream');
let stream = require('stream');

/********************************************************/

let requestObj = [];

for(let i=0; i<5000000; i++) {
  requestObj.push({
    name: 'Georgiy',
    message: 'Stop procrastination!!!',
    data: 'item:' + i
  });
}

let data = {
  commit: 'some hash',
  github: 'some url',
  diff: requestObj
};

/********************************************************/

var objectStream = JSONStream.stringify();

let req = request
  .post('http://192.168.1.98:3000/api/ddf/cli/update-incremental')
  .timeout(24 * 60 * 60 * 1000);

req.on('response', function(response){
  console.log("onEnd", response.body);
});

objectStream.pipe(req);

objectStream.on('end', function(){
  console.log("osOnEnd", arguments);
});


for(let j = 0; j < 5000000; j += 100000) {

  let sliced = data.diff.slice(j, 100000);

  objectStream.write({
    commit: data.commit,
    github: data.github,
    diff: sliced
  });

  //objectStream.write(null);
  console.log("chunk", j);
}

//objectStream.write(data);
objectStream.end();



/*

WORKING!!!


 var objectStream = through2({ objectMode: true }, function(chunk, enc, callback) {
 this.push(JSON.stringify(chunk) + '\n')
 callback()
 });

 let req = request
 .post('http://192.168.1.98:3000/api/ddf/cli/update-incremental')
 .timeout(24 * 60 * 60 * 1000);

 req.on('response', function(response){
 console.log("onEnd", response.body);
 });

 objectStream.pipe(req);

 objectStream.on('end', function(){
 console.log("osOnEnd", arguments);

});


objectStream.write(data);
objectStream.end();



 */
















// objectStream.write({ status: 500, message: 'Internal server error'})

/*

WORK

var Transform = require("stream").Transform;
var util = require("util");

function ProblemStream () {
  Transform.call(this, { "objectMode": true }); // invoke Transform's constructor
}

util.inherits(ProblemStream, Transform); // inherit Transform

ProblemStream.prototype._transform = function(obj, encoding, cb){
  this.push(JSON.stringify(obj));
  cb();
};

//let rs = new stream.Readable({ objectMode: true });
const rs = JSONStream.stringify();

let req = request
  .post('http://192.168.1.98:3000/api/ddf/cli/update-incremental')
  .timeout(24 * 60 * 60 * 1000);

rs.pipe(new ProblemStream()).pipe(req);

//rs.push(null);

rs.on('end', function(){
  console.log("onEnd", arguments);
});

rs.push(data);
rs.push(null);


*/










// var rs = new stream.Readable({ objectMode: true });
// rs.push(data);
// rs.push(null);
//
//
/*
var util = require('util');
//
function StringifyStream(){
   stream.Transform.call(this);

   this._readableState.objectMode = false;
   this._writableState.objectMode = true;
 }
 util.inherits(StringifyStream, stream.Transform);
//
StringifyStream.prototype._transform = function(obj, encoding, cb){
   this.push(JSON.stringify(obj));
   cb();
};

// const rs = JSONStream.stringify();
const rs = new stream.Readable({ objectMode: true });

//rs.pipe(new StringifyStream()).pipe(process.stdout);

let req = request
  .post('http://192.168.1.98:3000/api/ddf/cli/update-incremental')
  .timeout(24 * 60 * 60 * 1000);

//rs.pipe(new StringifyStream()).pipe(req);
rs.pipe(new stream.Transform({objectMode: true})).pipe(req);

rs.push(data);
rs.push(null);
*/

/*
request
  .get('http://localhost:3000/api/ddf/demo/prestored-queries')
  .timeout(10 * 1000)
  .end(function(error, result){
    if(error) {
      console.log("ERROR", error);
    } else {
      console.log("DONE", result.body);
    }

});

console.log("data ready");

let stream = JSONStream.stringify();
//
// through(function (data) {
// stream(['key', 'value']);
//stream.pipe(data);

if(true)
{
  request
    .post('http://192.168.1.98:3000/api/ddf/cli/update-incremental')
    //.type('json')
    //.send(stream)
    .timeout(24 * 60 * 60 * 1000)
    //.send({param: 'some value'})
    .pipe(stream)
    .end(function(error, result){
      if(error) {
        console.log("ERROR", error);
      } else {
        console.log("DONE", result.body);
      }
    });
}
else
{

  var objectMode = through2.obj();

  var jsonStream = through2.obj(function(chunk, encoding, callback) {
    this.push(JSON.stringify(chunk, null, 4) + '\n');
    callback()
  });

  let req = request2.post(
  //let req = request
    'http://192.168.1.98:3000/api/ddf/cli/update-incremental',
    {},
    function() {
      console.log("DONE", arguments);
    }
  );


  //objectMode.pipe(jsonStream).pipe(req).pipe(process.stdout);
  objectMode.write({key: 'value'});
  objectMode.pipe(jsonStream).pipe(process.stdout);


}
*/