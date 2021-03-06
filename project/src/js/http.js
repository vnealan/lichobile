var assign = require('lodash-node/modern/objects/merge');
var Spinner = require('spin.js');
var spinner = new Spinner();

var http = {};
http.apiVersion = 1;

var baseUrl = window.lichess.apiEndPoint;

function onSuccess(data) {
  spinner.stop();
  return data;
}

function onError(data) {
  spinner.stop();
  throw data;
}

function xhrConfig(xhr) {
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Accept', 'application/vnd.lichess.v' + http.apiVersion + '+json');
  xhr.timeout = 8000;
}

// throw an error message that may be given to i18n() function and displayed
// to the user
function extract(xhr) {
  var s = xhr.status;
  if (s === 0)
    throw new Error('noInternetConnection');
  else if (s === 401)
    throw new Error('unauthorizedError');
  else if (s === 404)
    throw new Error('resourceNotFoundError');
  else if (s === 503)
    throw new Error('lichessIsUnavailableError');
  else if (s >= 500)
    throw new Error('Server error');

  return xhr.responseText.length === 0 ? null : xhr.responseText;
}

function uncache(url) {
  return url + '?_=' + new Date().getTime();
}

// convenient wrapper around m.request
http.request = function(url, opts, feedback) {

  var cfg = {
    url: uncache(baseUrl + url),
    method: 'GET',
    config: xhrConfig,
    extract: extract
  };
  assign(cfg, opts);

  var promise = m.request(cfg);

  if (feedback) {
    spinner.spin(document.body);
    return promise.then(onSuccess, onError);
  } else
    return promise;
};

module.exports = http;
