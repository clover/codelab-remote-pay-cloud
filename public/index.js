var clover = require("remote-pay-cloud");

// RemotePayCloudTutorial object definition
RemotePayCloudTutorial = function() {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1];
  this.cloverServer = window.location.href.includes("localhost") ? "https://sandbox.dev.clover.com" : "https://www.clover.com";
  this.remoteApplicationId = "CLOVERDEV.655VQ41Z9CVF8";
  this.friendlyId = "Primary POS";

};

RemotePayCloudTutorial.prototype.showHelloWorld = function() {
  // TODO: Show a 'Hello World' message on the device.
};

// Define the connect() function. This is invoked onclick of the green 'Connect' button.
RemotePayCloudTutorial.prototype.connect = function() {
  
var deviceId = document.getElementById("select--clover-device-serials").value;

var cloverConnectorFactoryConfiguration = {};
cloverConnectorFactoryConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12;
var cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(cloverConnectorFactoryConfiguration);
const configBuilder = new clover.WebSocketCloudCloverDeviceConfigurationBuilder(this.remoteApplicationId,
  deviceId, this.merchant_id, this.access_token);
  configBuilder.setCloverServer(this.cloverServer);
  configBuilder.setFriendlyId(this.friendlyId);
var cloudConfig = configBuilder.build();  
this.cloverConnector = cloverConnectorFactory.createICloverConnector(cloudConfig);

this.setCloverConnectorListener(this.cloverConnector);
this.setDisposalHandler();
this.cloverConnector.initializeConnection();
};

RemotePayCloudTutorial.prototype.setCloverConnectorListener = function(cloverConnector) {
   var CloverConnectorListener = function(connector) {
     clover.remotepay.ICloverConnectorListener();
     this.cloverConnector = connector;
   };
  
   CloverConnectorListener.prototype = Object.create(clover.remotepay.ICloverConnectorListener.prototype);
   CloverConnectorListener.prototype.constructor = CloverConnectorListener;
  
   CloverConnectorListener.prototype.onDeviceConnected = function() {
     document.getElementById("status-message").innerHTML = "Device is connected!";
   };
  
   CloverConnectorListener.prototype.onDeviceReady = function() {
     document.getElementById("status-message").innerHTML = "Device is connected and ready!";
   };
  
   CloverConnectorListener.prototype.onDeviceError = function(deviceErrorEvent) {
     window.alert(`Message: ${deviceErrorEvent.getMessage()}`);
   };
  
   CloverConnectorListener.prototype.onDeviceDisconnected = function() {
     document.getElementById("status-message").innerHTML = "Device is disconnected!";
   };
  
   this.cloverConnectorListener = new CloverConnectorListener(cloverConnector);
   cloverConnector.addCloverConnectorListener(this.cloverConnectorListener);
};

RemotePayCloudTutorial.prototype.setDisposalHandler = function() {
  window.onbeforeunload = function(event) {
    try {
      this.cloverConnector.dispose();
    } catch (e) {
      console.error(e);
    }
  }.bind(this);
};

// Perform a sale
RemotePayCloudTutorial.prototype.performSale = function(amount) {
  // TODO: Use the CloverConnector to initiate a sale.
};

module.exports = RemotePayCloudTutorial;