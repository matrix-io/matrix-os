// We use GRPC to communicate with the MALOS and external services

var grpc = require('grpc');
var protos = require('matrix-protos').proto;
var client =  grpc.loadObject(protos, { protobufjsVersion: 6 }).matrix_io;

module.exports = client;
