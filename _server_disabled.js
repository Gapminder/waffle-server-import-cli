/* TEMP */

router.post("/get-data-set-published", function (request, response) {

  let data = [
    {'dsId': 'some-dataset-1'},
    {'dsId': 'some-dataset-2'},
    {'dsId': 'some-dataset-3'},
    {'dsId': 'some-dataset-4'}
  ];

  _log("get-data-set-published::ok");

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));

});

router.post("/get-data-set-non-published", function (request, response) {

  let data = [
    {'dsId': 'some-non-published-dataset-1'},
    {'dsId': 'some-non-published-dataset-2'},
    {'dsId': 'some-non-published-dataset-3'},
    {'dsId': 'some-non-published-dataset-4'}
  ];

  _log("get-data-set-non-published::ok");

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(data));

});

router.post("/get-data-set-non-published-version", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - dataset_id
     */
    let post = qs.parse(dataRequest);

    let data = {
      'list': [
        'some-non-published-dataset-version-1',
        'some-non-published-dataset-version-2',
        'some-non-published-dataset-version-3',
        'some-non-published-dataset-version-4',
        'some-non-published-dataset-version-5'
      ]
    };
    _log("get-data-set-non-published-version::ok");

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/translations-import", function (request, response) {

  let dataRequest = '';
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
    let post = qs.parse(dataRequest);
    _log("translations-import::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/translations-publish", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - dataset_id
     */
    let post = qs.parse(dataRequest);
    _log("translations-publish::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/publish-dataset", function (request, response) {

  let dataRequest = '';
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
    let post = qs.parse(dataRequest);
    _log("publish-dataset::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--create-concepts", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [concepts, Array]
     */

    let post = qs.parse(dataRequest);
    _log("ddf-import--create-concepts::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drillups", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drillups, Array]
     */

    let post = qs.parse(dataRequest);
    _log("ddf-import--add-concept-drillups::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drillups", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drillups, Array]
     */

    let post = qs.parse(dataRequest);
    _log("ddf-import--add-concept-drillups::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-drilldowns", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [drilldowns, Array]
     */

    let post = qs.parse(dataRequest);
    _log("ddf-import--add-concept-drilldowns::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

router.post("/ddf-import--add-concept-domains", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {
    /*
     *   POST params:
     *
     *     - data [domains, Array]
     */

    let post = qs.parse(dataRequest);
    _log("ddf-import--add-concept-domains::ok");

    let data = {'status': 'ok'};
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});