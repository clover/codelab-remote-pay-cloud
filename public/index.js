var clover = require("remote-pay-cloud");
var sdk = require("remote-pay-cloud-api");

var cloudConfig = {
  remoteId: "com.greg.cloudtest",
  cloverServer: "https://sandbox.dev.clover.com",
  accessToken: "290b8ef0-0e35-5f12-7eb8-504f026c0007",
  merchantId: "RADM5HD23A8RM",
  deviceId: "02d8e2ad-1ec1-286f-e814-123d12b2ea97"
}

CloudTest = function () {
}

CloudTest.prototype.run = function () {

  // instantiate a configuration object
  var connectorConfiguration = new clover.WebSocketCloudCloverDeviceConfiguration(
    cloudConfig.remoteId,
    clover.BrowserWebSocketImpl.createInstance,
    new clover.ImageUtil(),
    cloudConfig.cloverServer,
    cloudConfig.accessToken,
    new clover.HttpSupport(XMLHttpRequest),
    cloudConfig.merchantId,
    cloudConfig.deviceId,
    "Cloud Test",
    true,
    1000,
    3000
  )

  // create a clover connector
  var builderConfiguration = {}; // we will define a builder configuration object here
  builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12;
  var cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration);

  var cloverConnector = cloverConnectorFactory.createICloverConnector(connectorConfiguration); // create connector

  // add the listeners
  cloverConnector.addCloverConnectorListener(defaultCloverConnectorListener);
  cloverConnector.initializeConnection();

  setCloverConnector(cloverConnector);
}

// show a message on the device
CloudTest.prototype.showMessage = function() {
  getCloverConnector().showMessage("Welcome to Clover Connector!");

  cleanup();
}

// perform a sale
CloudTest.prototype.performSale = function () {

  // create a sale listener (appended to default listener object)
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      console.log({message: "Sale complete!", response: response});
      if (!response.getIsSale()) {
        console.log({error: "Response is not a sale!"});
        updateStatus("Sale failed.")
      } else {
        updateStatus("Sale complete!");
      }

      cleanup();
    },

    onConfirmPaymentRequest: function (request) {
      console.log({message: "Processing payment...", request: request});
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
        console.log({message: "Accepted Payment!"});
        cloverConnector.acceptPayment(request.getPayment());
      }
    },

    onVerifySignatureRequest: function (request) {
      console.log({message: "Automatically accepting signature", request: request});
      // updateStatus("Automatically accepting signature");
      cloverConnector.acceptSignature(request);
    }
  });
  // add the listener
  cloverConnector.addCloverConnectorListener(saleListener);

  // create a sale request
  var saleRequest = new sdk.remotepay.SaleRequest();
  saleRequest.setExternalId(clover.CloverID.getNewId());
  saleRequest.setAmount(10);
  saleRequest.setAutoAcceptSignature(false);

  // send the sale request
  console.log({message: "Sending sale", request: saleRequest});
  getCloverConnector().sale(saleRequest);
}

// create a listener for the default device connection
var defaultCloverConnectorListener = Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {
  onDeviceReady: function (merchantInfo) {
    updateStatus("Pairing successfully completed, your Clover device is ready to process requests.");
    console.log({message: "Device ready to process requests!", merchantInfo: merchantInfo});
    toggleActions(true);
  },

  onDeviceDisconnected: function () {
    console.log({message: "Disconnected"});
    toggleActions(false);
  },

  onDeviceConnected: function () {
    console.log({message: "Connected, but not available to process requests"});
    toggleActions(false);
  }
});

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
