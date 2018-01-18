var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

// define the class
CloudTest = function () {
}

// define the run function
CloudTest.prototype.run = function () {

  // TODO: Instantiate a configuration object
  
  let connectorConfiguration = new clover.WebSocketCloudCloverDeviceConfiguration(
    'com.krustykrab.KrabbyPOS',
    clover.BrowserWebSocketImpl.createInstance,
    new clover.ImageUtil(),
    "https://sandbox.dev.clover.com/",
    "acda2e1e-84d2-3dd4-fe19-2bce291047a0",
    new clover.HttpSupport(XMLHttpRequest),
    "FZX3HYMWZPE54",
    "9ad2c829-2edc-a36d-b141-0cbe47ce2d59",
    "friendly_id_yay",
    true,
    1000,
    3000
  );

  // TODO: create a clover connector

  let builderConfiguration = {};
  builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12;
  let cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration);

  let cloverConnector = cloverConnectorFactory.createICloverConnector(connectorConfiguration);

  
  // TODO: add the default listener

  cloverConnector.addCloverConnectorListener(defaultCloverConnectorListener);
  setCloverConnector(cloverConnector); // this will save the connector object that can be retrieved for other actions.  
  cloverConnector.initializeConnection();

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
CloudTest.prototype.performSale = function (amount) {
  var saleAmount = amount;
  // create a sale listener (appended to default listener object)
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      console.log({ message: "Sale complete!", response: response });
      if (!response.getIsSale()) {
        console.log({ error: "Response is not a sale!" });
        updateStatus("Sale failed.")
      } else {
        updateStatus("Sale complete!");
      }

      cleanup();
    },

    onConfirmPaymentRequest: function (request) {
      console.log({ message: "Processing payment...", request: request });
      updateStatus("Processing payment...");
      var challenges = request.getChallenges();
      if (challenges) {
        sign = window.confirm(challenges[0].message);
        if (sign) {
          cloverConnector.acceptPayment(request.getPayment());
        } else {
          cloverConnector.rejectPayment(request.getPayment(), challenges[0]);
        }
      } else {
        console.log({ message: "Accepted Payment!" });
        cloverConnector.acceptPayment(request.getPayment());
      }
    },

    onVerifySignatureRequest: function (request) {
      console.log({ message: "Automatically accepting signature", request: request });
      // updateStatus("Automatically accepting signature");
      cloverConnector.acceptSignature(request);
    }
  });
  // add the listener
  cloverConnector.addCloverConnectorListener(saleListener);

  // create a sale request
  var saleRequest = new sdk.remotepay.SaleRequest();
  saleRequest.setExternalId(clover.CloverID.getNewId());
  saleRequest.setAmount(saleAmount);
  saleRequest.setAutoAcceptSignature(false);

  // send the sale request
  console.log({ message: "Sending sale", request: saleRequest });
  getCloverConnector().sale(saleRequest);
}

CloudTest.prototype.disconnect = function () {
  cleanup();
}

CloudTest.prototype.toggleAction = function(key) {

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
  var disconnectKey = document.getElementById('key--disconnect');
  var chargeKey = document.getElementById('key--charge');

  if (show) {
    disconnectKey.classList.remove("key__disabled");
    chargeKey.classList.remove("key__disabled");
  } else {
    disconnectKey.classList.add("key__disabled");
    chargeKey.classList.add("key__disabled");
  }
}

module.exports = CloudTest;
