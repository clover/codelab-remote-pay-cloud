var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

// define the class
CloudTest = function () {
}

// define the run function
CloudTest.prototype.run = function () {

  // TODO: Instantiate a configuration object

  // TODO: create a clover connector

  setCloverConnector(); // this will save the connector object that can be retrieved for other actions.

  // TODO: add the default listener

}

// create a listener for the default device connection
var defaultCloverConnectorListener = Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {
  onDeviceReady: function (merchantInfo) {
    // TODO: log message here

    // UI code. It will update the HTML with a status as well as new actions.
    updateStatus("Pairing successfully completed, your Clover device is ready to process requests.");
    toggleActions(true);
  },

  onDeviceDisconnected: function () {
    // TODO: log message here

    toggleActions(false);
  },

  onDeviceConnected: function () {
    // TODO: log message here

    toggleActions(false);
  }
});

// show a message on the device
CloudTest.prototype.showMessage = function() {
  // TODO: retrieve the connector, and call showMessage();

  // Make sure to properly dispose of the connector
  cleanup();
}

// perform a sale
CloudTest.prototype.performSale = function () {

  // create a sale listener (appended to default listener object)
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      // TODO: log message here

      // UI
      updateStatus("Sale complete!");

      // Make sure to properly dispose of the connector
      cleanup();
    },

    onConfirmPaymentRequest: function (request) {
      // TODO: log message here

      // TODO: accept the payment request

      updateStatus("Automatically accepting payment...");
    },

    onVerifySignatureRequest: function (request) {
      // TODO: log message here

      // TODO: accept the signature

      updateStatus("Automatically accepting signature");
    }
  });
  // TODO: add the listener

  // TODO: create a sale request

  // TODO: make the sale request
}

var getCloverConnector = function () {
  return this.cloverConnector;
}

var setCloverConnector = function (cloverConnector) {
  this.cloverConnector = cloverConnector;
};

var updateStatus = function (newStatus) {
  var currentStatus = document.querySelector('.status');
  currentStatus.innerHTML = newStatus;
}

var cleanup = function() {
  getCloverConnector().dispose();

  // UI
  toggleActions(false);
  updateStatus("Not connected to your Clover device. Please connect to perform an action.")
}

var toggleActions = function(show) {
  var actions = document.querySelector('.actions');
  if (show) {
    actions.style.display = "block";
  } else {
    actions.style.display = "none";
  }
}

module.exports = CloudTest;
