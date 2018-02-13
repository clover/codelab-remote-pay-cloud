var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

// CloudTest object definition
CloudTest = function() {
  // TODO: set instance variables for CloverConnector configuration
};

CloudTest.prototype.showHelloWorld = function() {
  // TODO: show a 'Hello World' message on the device
};

// Define the connect() function. This is invoked onclick of the green 'Connect' button.
CloudTest.prototype.connect = function() {
  // TODO: create a configuration object, a CloverConnector, a 
  // CloverConnectorListener, and then initialize the connection
  };

// perform a sale
CloudTest.prototype.performSale = function(amount) {
  // TODO: use the CloverConnector to initiate a sale
};

module.exports = CloudTest;