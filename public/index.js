var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

// RemotePayCloudTutorial object definition
RemotePayCloudTutorial = function() {
  // TODO: set instance variables for CloverConnector configuration
};

RemotePayCloudTutorial.prototype.showHelloWorld = function() {
  // TODO: show a 'Hello World' message on the device
};

// Define the connect() function. This is invoked onclick of the green 'Connect' button.
RemotePayCloudTutorial.prototype.connect = function() {
  // TODO: create a configuration object, a CloverConnector, a 
  // CloverConnectorListener, and then initialize the connection
};

// perform a sale
RemotePayCloudTutorial.prototype.performSale = function(amount) {
  // TODO: use the CloverConnector to initiate a sale
};

module.exports = RemotePayCloudTutorial;