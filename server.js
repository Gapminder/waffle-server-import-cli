require('shelljs/global');

var http = require('http');
var Router = require('router');
var qs = require('querystring');
var fs = require('fs');

var router = Router();

router.post("/get-data-set-published", function (request, response) {

  var data = [
    {'dsId': 'some-dataset-1'},
    {'dsId': 'some-dataset-2'},
    {'dsId': 'some-dataset-3'},
    {'dsId': 'some-dataset-4'}
  ];
  console.log("get-data-set-published::ok");

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));

});

router.post("/get-data-set-non-published", function (request, response) {

  var data = [
    {'dsId': 'some-non-published-dataset-1'},
    {'dsId': 'some-non-published-dataset-2'},
    {'dsId': 'some-non-published-dataset-3'},
    {'dsId': 'some-non-published-dataset-4'}
  ];
  console.log("get-data-set-non-published::ok");

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));

});

router.post("/get-data-set-non-published-version", function (request, response) {

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

    var data = {
      'list': [
        'some-non-published-dataset-version-1',
        'some-non-published-dataset-version-2',
        'some-non-published-dataset-version-3',
        'some-non-published-dataset-version-4',
        'some-non-published-dataset-version-5'
      ]
    };
    console.log("get-data-set-non-published-version::ok");

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
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
    console.log("translations-import::ok");

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

router.post("/publish-dataset", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - dataset_id
     *     - version
     */
    var post = qs.parse(dataRequest);
    console.log("publish-dataset::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--create-concepts", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [concepts, Array]
     */

    var post = qs.parse(dataRequest);
    console.log("ddf-import--create-concepts::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drillups", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drillups, Array]
     */

    var post = qs.parse(dataRequest);
    console.log("ddf-import--add-concept-drillups::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drillups", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drillups, Array]
     */

    var post = qs.parse(dataRequest);
    console.log("ddf-import--add-concept-drillups::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drilldowns", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drilldowns, Array]
     */

    var post = qs.parse(dataRequest);
    console.log("ddf-import--add-concept-drilldowns::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-domains", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [domains, Array]
     */

    var post = qs.parse(dataRequest);
    console.log("ddf-import--add-concept-domains::ok");

    var data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/get-data-set-for-update", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    var params = qs.parse(dataRequest);


    var gitFolder = '--git-dir=./../' + params['folder'] + '/.git';
    var commandGitCmd = 'git ' + gitFolder + ' log --oneline';
    var resultGitCmd = exec(commandGitCmd, {silent: true}).stdout;

    var commitList = resultGitCmd.split("\n").filter(function(value){
      return !!value;
    });

    var data = {
      'list': commitList
    };

    console.log("get-data-set-for-update::ok");

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.get("/ws-import-dataset", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    var params = qs.parse(dataRequest);
    console.log("ws-import-dataset::ok");

    setTimeout(function(){

      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({}));

    }, 3000);

  });
});

router.get("/ws-update-incremental", function (request, response) {

  var dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    var params = qs.parse(dataRequest);
    console.log("ws-import-dataset::ok", params);

    setTimeout(function(){

      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({}));

    }, 3000);

  });
});


var server = http.createServer(function(req, res) {
  router(req, res, function(req, res) {

  });
})

server.listen(3010);