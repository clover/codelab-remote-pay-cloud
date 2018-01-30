var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

// define the class
var CloudTest = function () {
};

// define the run function
CloudTest.prototype.run = function () {

  // TODO: create a configuration object

  // TODO: create a Clover Connector

  setCloverConnector(cloverConnector); // this will save the connector object that can be retrieved for other actions.

  // TODO: add the default listener (after filling it in)

  // TODO: initialize the connection
};

// create a listener for the default device connection
var defaultCloverConnectorListener = Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {
  onDeviceReady: function (merchantInfo) {
    // TODO log message here

    // UI code. It will update the HTML with a status as well as new actions.
    updateStatus("Pairing successfully completed, your Clover device is ready to process requests.");
    toggleActions(true);
  },

  onDeviceDisconnected: function () {
    // TODO log message here

    toggleActions(false);
  },

  onDeviceConnected: function () {
    // TODO log message here

    toggleActions(false);
  }
});

// show a message on the device
CloudTest.prototype.showMessage = function() {
  // TODO: retrieve the Clover Connector, and display a message

  // Make sure to properly dispose of the connector
  cleanup();
};

// perform a sale
CloudTest.prototype.performSale = function (amount) {

  // TODO: create a sale listener (appended to default listener object)

  // TODO: add the listener

  // TODO: create a saleRequest

  // TODO: Send the sale request
};


CloudTest.prototype.disconnect = function () {
  cleanup();
};

// KEEP: Helper functions.

var getCloverConnector = function () {
  return this.cloverConnector;
};

var setCloverConnector = function (cloverConnector) {
  this.cloverConnector = cloverConnector;
};

var updateStatus = function (newStatus) {
  var currentStatus = document.querySelector('.status');
  currentStatus.innerHTML = newStatus;
};

var cleanup = function() {
  getCloverConnector().dispose();

  // UI
  toggleActions(false);
  updateStatus("Not connected to your Clover device. Please connect to perform an action.");
};

var toggleActions = function(show) {
  var disconnectKey = document.getElementById('key--disconnect');
  var chargeKey = document.getElementById('key--charge');

  if (show) {
    disconnectKey.classList.remove("key__disabled");
    chargeKey.classList.remove("key__disabled");
  } else {
    disconnectKey.classList.add("key__disabled");
    chargeKey.classList.add("key__disabled");
  }
};

module.exports = CloudTest;
