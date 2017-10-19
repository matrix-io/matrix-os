// We use GRPC to communicate with the MALOS and external services

var grpc = require('grpc');
var protos = require('matrix-protos').proto;
var client = grpc.loadObject(protos, { protobufjsVersion: 6 }).matrix_io;

log(client);

// TODO: Parse versions for newest. Provide for stable vs building.

module.exports = {
  client: client,
  recognition: client.recognition.v1.RecognitionService,
  vision: client.vision.v1.VisionService
};
