'use strict';

process.env.STRONGLOOP_LICENSE = require('./helpers').shortTestLicense();
require('../lib/config').baseInterval = 25;

var agent = require('../');
agent.profile('deadbeef', 'deadbeef', {quiet: true});

var assert = require('assert');
var http = require('http');

var topFunctions = require('../lib/top-functions');
var updates = [];

agent.on('topCalls', updates.push.bind(updates));

http.createServer(onrequest).listen(0, '127.0.0.1', onlisten);

function onrequest(req, res) {
  res.writeHead(200, {'Content-Length': '32'});
  res.end(Buffer(32));
}

function onlisten() {
  var server = this;
  var address = server.address().address;
  var port = server.address().port;
  function done() { setTimeout(server.close.bind(server), 100) }
  function next() { pummel(address, port, --next.rounds > 0 ? next : done) }
  next.rounds = 32;
  next();
}

function pummel(host, port, next) {
  http.get({host: host, port: port}, function(res) {
    res.on('end', next);
    res.resume();
  });
}

process.on('exit', function() {
  assert(updates.length > 0);
  updates.forEach(function(update) { assert('httpCalls' in update); });
});
