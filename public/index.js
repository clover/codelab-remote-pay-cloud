var clover = require("remote-pay-cloud");

// RemotePayCloudTutorial object definition
RemotePayCloudTutorial = function() {
  // TODO: Set instance variables for CloverConnector configuration.
};

RemotePayCloudTutorial.prototype.showHelloWorld = function() {
  // TODO: Show a 'Hello World' message on the device.
};

// Define the connect() function. This is invoked onclick of the green 'Connect' button.
RemotePayCloudTutorial.prototype.connect = function() {
  // TODO: Create a configuration object, a CloverConnector, a 
  // CloverConnectorListener, and then initialize the connection.
};

// Perform a sale
RemotePayCloudTutorial.prototype.performSale = function(amount) {
  // TODO: Use the CloverConnector to initiate a sale.
};

module.exports = RemotePayCloudTutorial;
