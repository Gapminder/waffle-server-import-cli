var http = require('http');
var Router = require('router');
var qs = require('querystring');

var router = Router();

router.post("/get-data-set-published", function (request, response) {

  var data = [
    {'dsId': 'some-dataset-1'},
    {'dsId': 'some-dataset-2'},
    {'dsId': 'some-dataset-3'},
    {'dsId': 'some-dataset-4'}
  ];

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));

});

router.post("/translations-import", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
    *   POST params:
    *
    *     - language
    *     - dataset_id
    *     - data (stringify JSON :: JSON.parse(post['data'])
    */
    var post = qs.parse(dataRequest);
    console.log("translations-upload::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/translations-publish", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - dataset_id
     */
    var post = qs.parse(dataRequest);
    console.log("translations-publish::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

var server = http.createServer(function(req, res) {
  router(req, res, function(req, res) {

  });
})

server.listen(3010);