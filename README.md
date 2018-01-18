# Clover Remote Pay Cloud
## Example App

This repository contains an example web application that uses Clover Connector to connect to a Clover device and perform basic operations over cloud.

Once the repository is cloned to your computer, follow these instructions to get started with Clover's Remote Pay Cloud.

1. In the root project directory, run `npm install`. This will install `webpack` and `webpack-dev-server`, along with Clover's `remote-pay-cloud` and `remote-pay-cloud-api` libraries that contains the modules needed connect to the device.

2. Run npm run build to start webpack dev server, which will bundle your files and enable hot reloading.

3. To use Remote Pay Cloud, you will need access to your remote ID, API token, merchant ID, and device ID.
  * remote ID will be set in your semi-integrated app settings
  * API token can be retrieved with OAuth 2.0
  * merchant ID will be displayed on the url for a merchant page
  * device ID can be retrieved by making a GET request to
 `https://{clover_server}/v3/merchants/{your_merchant_id}/devices?access_token={your_api_token}`
    * clover server will be the base url for ther server (e.g. `https://www.clover.com, https://sandbox.dev.clover.com/`)

4. Let's define a class, called `CloudTest`, with a class function called `run` that will initialize the connection to the device. This is one way to organize the different functions we will implement for the integration.
  ```javascript
  CloudTest = function () {
  }

  CloudTest.prototype.run = function () {
    // code will be written here
  }
  ```
5. First, create a [`CloverConnectorConfiguration`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverDeviceConfiguration.html). Use the parameters from step 3. Keep the other default parameters for now.
  ```javascript
  var connectorConfiguration = new clover.WebSocketCloudCloverDeviceConfiguration(
    {your_remote_id},
    clover.BrowserWebSocketImpl.createInstance, //webSocketFactory
    new clover.ImageUtil(), //imageUtil
    {your_clover_server},
    {your_access_token},
    new clover.HttpSupport(XMLHttpRequest), //httpSupport
    {your_merchant_id},
    {your_device_id},
    "Cloud Test", //friendlyId
    true, //forceConnect
    1000, //heartbeatInterval
    3000 //reconnectDelay
  )
  ```
6. Create a [`CloverConnector`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html) object. For this we will need to define a configuration for the builder, and then finally create the connector using our previously defined connector configuration.
  ```javascript
    var builderConfiguration = {}; // we will define a builder configuration object here
    builderConfiguration[clover.CloverConnectorFactoryBuilder.FACTORY_VERSION] = clover.CloverConnectorFactoryBuilder.VERSION_12;
    var cloverConnectorFactory = clover.CloverConnectorFactoryBuilder.createICloverConnectorFactory(builderConfiguration);

    var cloverConnector = cloverConnectorFactory.createICloverConnector(connectorConfiguration); // create connector
  ```
7. Define a listener (specifically, an [`ICloverConnectorListener`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/ICloverConnectorListener.html)) for the default connector that will handle the connection to the device. For now, it will handle when the device is connected, ready to process requests, and disconnected. We will define this outside of the initial connection function as we will need it to define a sale listener in a separate class function.
```javascript
  var defaultCloverConnectorListener = Object.assign({}, clover.remotepay.ICloverConnectorListener.prototype, {
    onDeviceReady: function (merchantInfo) {
      console.log({message: "Device ready to process requests!", merchantInfo: merchantInfo});
    },

    onDeviceDisconnected: function () {
      console.log({message: "Disconnected"});
    },

    onDeviceConnected: function () {
      console.log({message: "Connected, but not available to process requests"});
    }
  });
```

8. Add the listener to the connector using `CloverConnector::addCloverConnectorListener()`, passing in the defaultCloverConnectorListener we just defined.

9. Initialize the connection using `CloverConnector::initializeConnection()`. If everything worked correctly, your status bar will display a ready message!

10. Define a class function `showMessage()` that will use the `CloverConnector::showMessage()` to display a message through the device. To retrieve the connector, a `getCloverConnector()` has been defined that will retrieve the connector that was set in the `run` function. Now you can show any message to the device. Note that this message will not disappear until it is changed, or the device/application is disconnected.

11. As an important side note, make sure to properly dispose of the connector on completion of the action (such as showing a message or completing a sale). A `cleanup()` function is defined already that invokes the `CloverConnector::dispose()` function.

12. Now add a sale listener. This is done by extending the `defaultCloverConnectorListener` with event handlers for sale actions. We will define onSaleResponse, onConfirmPaymentRequest, and onVerifySignatureRequest. Take a look at `CloverConnector::acceptPayment()` and `CloverConnector::acceptSignature()` for more information.
```javascript
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      console.log({message: "Sale complete!", response: response});
    },

    onConfirmPaymentRequest: function (request) {
      console.log({message: "Automatically accepting payment", request: request});

      cloverConnector.acceptPayment(request.getPayment());
    },

    onVerifySignatureRequest: function (request) {
      console.log({message: "Automatically accepting signature", request: request});

      cloverConnector.acceptSignature(request);
    }
  });
```
13. Add the listener, similar to step 8, passing in the saleListener.

14. Let's make a sale! Create a [`SaleRequest`]() object using the Remote Pay Cloud API, and set an external id, as well as the amount. We invoke `setAutoAcceptSignature(false)` since we want to see the signature handling.
```javascript
  var saleRequest = new sdk.remotepay.SaleRequest();
  saleRequest.setExternalId(clover.CloverID.getNewId());
  saleRequest.setAmount(10);
  saleRequest.setAutoAcceptSignature(false);
```
15. Finally, initiate the sale by calling the `CloverConnector::sale()` function, passing in the `saleRequest`. If everything goes smoothly, you should see instructions on the Clover device to process the payment method.

16. Congratulations, you made your first sale! Now take a moment to look at the log messages and its contents (you should have requests and responses set in the console.logs). Learn about a [`SaleResponse`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/messages/SaleResponse.html).

17. Make another sale, with the same card/payment method. Take a look at the confirm payment message in the console. You should see a challenges property, which is an array containing any number of potential issues with the transaction. Here you should have a "duplicate payment" message, because we just used the same card!

18. Now we need to create logic to handle this challenge. One simple way is to create a separate interface to confirm or reject this transaction from the POS. Then, depending on the input, call `CloverConnect:: acceptPayment()`, or the `CloverConnector::rejectPayment()` connector functions. We will also define some more logic for `onSaleResponse`, since rejecting a payment request will not result in a proper sale.

```javascript
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
```
19. Congratulations, you have now integrated a web application to a clover device, and are able to show messages and perform a sale. But the Clover Connector is capable of so much more. Here are some additional resources to expand on this project, and start integrating these functionalities into a personal application.
