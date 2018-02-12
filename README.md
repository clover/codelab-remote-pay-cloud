# Clover Remote Pay Cloud Tutorial

## Before We Start

### What We're Building

Today, we're going to integrate a browser-based Point of Sale (POS) system with a Clover Mini.

We've already built a simple UI of the POS for you. However, in its current state, the POS cannot connect to a Clover Mini, and the buttons do nothing. In this tutorial, we will be building that functionality.

It is important to complete this tutorial in its entirety. We will be learning both how to build an integration as well as implementation best practices, so you can avoid very common mistakes, and ship code to production with confidence.

This tutorial uses the  [`CloverConnector`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html) to connect to a Clover device and perform operations over the cloud. The Clover Connector SDK provides a consolidated asynchronous interface for your POS to integrate with Clover's customer-facing payment devices.

### Prerequisites

We'll assume some familiarity with HTML and JavaScript, but you should be able to follow along even if you haven't used them before.

We are keeping this tutorial agnostic of any frontend JavaScript framework, so some adaptation may be required to implement the same behavior into your own POS.

We recommend reading an [Overview of the Clover Platform](https://docs.clover.com/build/architecture/), including the [Developer Guidelines](https://docs.clover.com/build/developer-guidelines/).

You will need to [order a Clover Developer Kit (DevKit)](https://cloverdevkit.com/) and [set it up](https://docs.clover.com/build/devkit/). An emulator cannot be used, because our Secure Payments application relies on certain aspects of our hardware. Currently, the Clover Mini, Mobile, and Flex are eligible for semi-integration.

Our JavaScript Clover Connector SDK is distributed as an npm package. If you do not already have npm installed, [install it](https://www.npmjs.com/get-npm).

You will need to [set up a Sandbox developer account](https://sandbox.dev.clover.com/developers) and create your test merchant.

### How to Follow Along

You should keep this document open to follow along while completing the tutorial in your favorite text editor. As you progress, making and saving JavaScript changes, the POS will hot-reload in your browser of choice.

### Help, I'm Stuck!

If you get stuck, check out Clover's [Community support resources](https://community.clover.com/). If you don't find someone with the same question, post a new one, and we'll help you out.

With this out of the way, let's get started!

__________

## Setup

After you have completed setup of your Clover DevKit, find and install the **Cloud Pay Display** application from the App Market. Go ahead and touch the four corners of the device's screen to exit Cloud Pay Display. When it re-launches programmatically, you'll know you've accomplished the first major milestone of this tutorial — device pairing.

`git clone https://github.com/Tulen/cloudpaytut-mock.git` to clone this repository locally. `cd cloudpaytut-mock` to navigate to the project's root directory, and then run `npm install`. This will install `webpack` and `webpack-dev-server`, along with Clover's `remote-pay-cloud` and `remote-pay-cloud-api` libraries are needed to connect to and communicate with the device.

Run `npm run build` to start webpack-dev-server, which will bundle your files and enable hot reloading.

Open a new browser tab and [login to your Sandbox Developer Account](https://sandbox.dev.clover.com/home/login). Find the **Cloud Pay Tut** app in the App Market. Install and launch it, and Clover will redirect you to https://localhost:8080, including a few query parameters with the redirect which we will explain shortly. You should see a simple Point of Sale system.

Open the project's root directory in your favorite text editor. We will first be editing `index.js`.

## Getting Started

### Device Pairing

We'll first need to build the device pairing between our POS and the Clover customer-facing device.

The POS has a green 'Connect' button which has a bound `onclick` handler to invoke a `connect()` function that we have defined in `index.js`. We'll make the `connect()` function pair the devices.

To successfully `connect()` to the Clover device, we'll require:
* The `merchant_id`
* An `access_token`
* The `client_id`
* The `targetCloverDomain` - either Clover's Sandbox or Production environment.
* The `remoteApplicationId` of the POS.
* The `deviceSerialId` (serial number) of the Clover device you are connecting to.

The `merchant_id` was passed to your POS as a query parameter when you launched your POS from Clover. We'll grab it using regex, and assign it to a property of the `CloudTest` object that gets instantiated when the page loads (see `index.html`).

```diff
CloudTest = function () {
+ this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
};
```

The `access_token` was also passed to your POS as a query parameter. This is because our Remote Pay Cloud Tutorial does not have a backend server, so we have configured it to redirect to our POS with an `access_token` rather than a `code`. To read more about how to securely obtain an `access_token` using your own POS's backend server, please reference our [OAuth documentation](https://docs.clover.com/build/oauth-2-0/).

```diff
CloudTest = function () {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
+ this.access_token = window.location.href.match(/access_token=([^&]*)/)[1];
};
```

The `client_id` was also passed to your POS as a query parameter. It uniquely identifies your app in the Clover App Market. You can read more about this topic [here](https://docs.clover.com/build/oauth-2-0/#1merch_auth).

```diff
CloudTest = function () {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1];
+ this.client_id = window.location.href.match(/client_id=([^&]*)/)[1];
};
```

Clover maintains [different environments for Sandbox and Production](https://docs.clover.com/build/web-apps/#before-you-begin-sandbox-vs-production). The `targetCloverDomain` specifies which one you would like to connect to. In this tutorial, we'll assume you want to target our Sandbox environment while you're developing, and our Production environment for your deployed web application.

```diff
CloudTest = function () {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1];
  this.client_id = window.location.href.match(/client_id=([^&]*)/)[1];
+ this.targetCloverDomain = window.location.href.includes("localhost") ? "https://sandbox.dev.clover.com" : "https://www.clover.com";
};
```

The `remoteApplicationId` is a constant value for your particular POS, and is used by Clover's Engineering team to track SDK usage, as well as to help triage issues, if you encounter any. Learn more about creating your own `remoteApplicationId` [here](https://docs.clover.com/build/create-your-remote-app-id/). For this tutorial, we'll provide our own `remoteApplicationId` that we have created, but for your own semi-integrated POS, this value needs to be replaced with your own unique `remoteApplicationId`.

```diff
CloudTest = function () {
  this.merchant_id = window.location.href.match(/merchant_id=([^&]*)/)[1];
  this.access_token = window.location.href.match(/access_token=([^&]*)/)[1];
  this.client_id = window.location.href.match(/client_id=([^&]*)/)[1];
  this.targetCloverDomain = window.location.href.includes("localhost") ? "https://sandbox.dev.clover.com" : "https://www.clover.com";
+ this.remoteApplicationId = "rpc.tut";
};
```

The `deviceSerialId` was *not* passed to us as a query parameter. Furthermore, a merchant can have more than one device associated with them. One way to obtain the `deviceSerialId` would be to allow the merchant to manually enter it in an `input`. However, we will use Clover's [REST APIs](https://docs.clover.com/build/web-api/) to fetch the serial numbers of all Clover devices that a merchant has associated with them. We'll render a list of the serial numbers, and then we will connect to the one that the merchant selects.

First, we'll create an empty `select` element above the 'Connect' button that we'll eventually populate with those `option`s.

In `index.html`:

```diff
<div class="pos--container tdshadow">
+   <select id="select--clover-device-serials">
+   </select>
    <div class="numpad--key key--primary" id="key--connect">
        Connect
    </div>
    <div class="numpad--key key--danger key__disabled" id="key--disconnect">
        Disconnect
    </div>
</div>
```

`DOMContentLoaded` is a suitable hook for when we can fetch the serial numbers of all Clover devices belonging to a merchant, and then create an `option` to be rendered in the DOM for each serial number. We'll add those `option`s to the `select` we just created.

In `events.js`:

```diff
  chargeKey.addEventListener("click", function() {
      if (chargeKey.classList.length < 3) {
          cloudtest.performSale(displayState);
      }
  });
+  
+ fetch(`${cloudtest.targetCloverDomain}/v3/merchants/${cloudtest.merchant_id}/devices?access_token=${cloudtest.access_token}`)
+ .then(function(response) {
+   return response.json();
+ })
+ .then(function(data) {
+   var select = document.getElementById("select--clover-device-serials");
+
+   data.elements.forEach(function(device) {
+     if (device.serial === "unknown") {
+       // Exclude Clover emulators
+       return;
+     } else {
+       var option = document.createElement("option");
+       option.text = device.serial;
+       select.add(option);
+     }
+   });
+ })    
+ .catch(function(error) {
+   window.alert(error);
+ });
```

**Important:** Receiving a `200 OK` response from this particular REST request required our POS to have *MERCHANT_R* permission. Without this permission, we would have received a `401 Unauthorized` response. Read more about properly configuring permissions in your own POS [here](https://docs.clover.com/build/permissions/).

**Note:** In the above implementation, we chose to create an `option` for all Clover devices, excluding [emulators](https://docs.clover.com/build/android-emulator-setup/), which should only be in use by developers in our Sandbox environment. You, however, might want to only render `option`s for Clover devices which are eligible for Cloud Pay Display (currently, Clover Mini, Clover Mobile, and Clover Flex), and exclude ineligible devices (currently, Clover Station and Clover 2018). In that case, the following code snippet could be used. **However,** as Clover continues our commitment to developing new, best of breed hardware, we may release additional hardware products which are also not Cloud Pay Display eligible. As a result, we realize this particular code block is **not fully future-proof**, should only be used at your own risk, and might require patching in the future. Only use this code snippet if you understand the associated risks.

```javascript
fetch(`${cloudtest.targetCloverDomain}/v3/merchants/${cloudtest.merchant_id}/devices?access_token=${cloudtest.access_token}`)
.then(function(response) {
  return response.json();
})
.then(function(data) {
  var select = document.getElementById("select--clover-device-serials");

  data.elements.forEach(function(device) {
    // Currently, Clover Mobile, Mini and Flex are eligible for Cloud Pay Display.
    // Their serial numbers begin with C02, C03 and C04, respectively.
    var serialFirstThree = device.serial.slice(0, 3);

    // Clover Station and Clover Station 2018 have serial numbers that begin with
    // C01 and C05. They will likely never be eligible for Cloud Pay Display,
    // because they are not the best form factors for a customer-facing screen.
    // Additionally, Clover emulators have a serial of 'unknown'.

    var ineligibleDevicesFirstThree = ["C01", "C05", "unk"];
    if (ineligibleDevicesFirstThree.includes(serialFirstThree)) {
      // Exclude Clover emulators, Clover Stations, and Clover Station 2018's
      return;
    } else {
      var option = document.createElement("option");
      option.text = device.serial;
      select.add(option);
    }
    // As Clover continues our commitment to developing new, best of breed hardware,
    // we may release additional hardware products which are also not Cloud Pay Display
    // eligible. As a result, we realize this particular code block is not fully
    // future-proof, and should be used at your own risk.
  });
})
.catch(function(error) {
  window.alert(error);
});
```

**Important:** The remote-pay-cloud SDK was developed for a one-to-one pairing between POS and Clover terminal. There is a high probability that issues will arise if you attempt to pair your POS with multiple Clover devices simultaneously. For the most reliable results, please use a one-to-one relationship.

We now have all of the data required to initialize a connection, so let's make the green 'Connect' button behave as expected. We'll connected to the currently select `deviceSerialId` in the `select` element we previously created. In `index.js`:

```diff
CloudTest.prototype.connect = function () {
+ this.cloverConnector = new clover.CloverConnectorFactory().createICloverConnector({
+   "merchantId": this.merchant_id,
+   "oauthToken": this.access_token,
+   "clientId": this.client_id,
+   "domain": this.targetCloverDomain,
+   "remoteApplicationId": this.remoteApplicationId,
+   "deviceSerialId": document.getElementById("select--clover-device-serials").value
+ });
+ 
+ this.cloverConnector.initializeConnection();
};
```

Under the hood, using the `remote-pay-cloud` SDK, this code will instantiate a WebSocket connection. As such, to follow WebSocket best practices, we need to properly dispose of resources the user navigates to a different page, refreshes the current page, or closes the tab/window. [window.onbeforeunload](https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload) is the proper `WindowEventHandler` to handle all of these events.

```diff
CloudTest.prototype.connect = function () {
  this.cloverConnector = new clover.CloverConnectorFactory().createICloverConnector({
    "merchantId": this.merchant_id,
    "oauthToken": this.access_token,
    "clientId": this.client_id,
    "domain": this.targetCloverDomain,
    "remoteApplicationId": this.remoteApplicationId,
    "deviceSerialId": document.getElementById("select--clover-device-serials").value
  });
  
+ this.setDisposalHandler();
  this.cloverConnector.initializeConnection();
};

+ CloudTest.prototype.setDisposalHandler = function() {
+   window.onbeforeunload = function(event) {
+     try {
+       this.cloverConnector.dispose();
+     } catch (e) {
+       console.error(e);
+     }
+   }.bind(this);
+ };
```

Let the webpage hot reload, select the device serial you would like to connect to, and then press the 'Connect' button. You should now see Cloud Pay Display launch on the device, indicating that we have successfully paired devices. Congratulations!

TODO: "Did Cloud Pay Display not launch? Common troubleshooting here." - link to common mistakes. e.g., Device not connected to the internet? Something else? Blah blah blah? If your issue is not resolved by these common mistakes, and you are still unable to connect to your Clover device, please post a question on our [Clover Developer Community](https://community.clover.com/).

### Implement a CloverConnectorListener

We canonically refer to the WebSocket connection we've now created as the `cloverConnector` API. In order to send data from your POS to the Clover device, you will invoke methods on the `cloverConnector`. You have already become familiar with `cloverConnector.initializeConnection()`.

However, one-way communication is not enough. The device will also need to send payloads of data to your POS through the same WebSocket connection. You'll need to implement a `CloverConnectorListener` to respond to events, keep track of the device's state, and know if transactions succeeded or failed. Our POS will receive information about the Clover device by implementing a number of different callbacks.

We will set a `CloverConnectorListener` on our `cloverConnector` instance before initializing the connection. The `remote-pay-cloud` SDK will hook into these `CloverConnectorListener` callbacks at various stages of the device's lifecycle.

It can also be useful to set a pointer to the `cloverConnector` on the `CloverConnectorListener` instance, so that `cloverConnector` methods can be easily invoked from directly within a `CloverConnectorListener` callback. We will first implement the `onDeviceConnected` and `onDeviceReady` callbacks, which get invoked sequentially during the device pairing process. In this example, we will simply update the UI to indicate that device pairing has been successful. We will also implement the `onDeviceError` callback, allowing us to render any Clover error messages to the user.

```diff
+ this.setCloverConnectorListener(this.cloverConnector);
  this.setDisposalHandler();
  this.cloverConnector.initializeConnection();
};
+
+ CloudTest.prototype.setCloverConnectorListener = function(cloverConnector) {
+   var CloverConnectorListener = function(connector) {
+     clover.remotepay.ICloverConnectorListener();
+     this.cloverConnector = connector;
+   };
+   
+   CloverConnectorListener.prototype = Object.create(clover.remotepay.ICloverConnectorListener.prototype);
+   CloverConnectorListener.prototype.constructor = CloverConnectorListener;
+   
+   CloverConnectorListener.prototype.onDeviceConnected = function() {
+     document.getElementById("status-message").innerHTML = "Device is connected!";
+   };
+   
+   CloverConnectorListener.prototype.onDeviceReady = function() {
+     document.getElementById("status-message").innerHTML = "Device is connected and ready!";
+   };
+   
+   CloverConnectorListener.prototype.onDeviceError = function(deviceErrorEvent) {
+     window.alert(`Message: ${deviceErrorEvent.getMessage()}`);
+   };
+   
+   this.cloverConnectorListener = new CloverConnectorListener(cloverConnector);
+   cloverConnector.addCloverConnectorListener(this.cloverConnectorListener);
+ };
```

After the page refreshes, reconnect to your device, and "Device is connected and ready!" should be rendered. `onDeviceConnected` and `onDeviceReady` are occasionally invoked very rapidly, to the point where you may never see the "Device is connected!" message on the DOM.

**Important:** *Never* invoke a `cloverConnector` method from within the `CloverConnectorListener#onDeviceReady` callback. This callback is **not** guaranteed to fire only once, and unintended consequences can arise if you start multiple `TransactionRequests` concurrently.

### Starting our first Sale

We are now ready to start our first Sale, one of the three transaction types that Clover semi-integration supports. You can find more detailed information about all of our transaction types here. Initiating a Sale requires you to generate a `SaleRequest` instance, which inherits from our `TransactionRequest` class. We'll reference both in this section. // TODO: replace with the proper link to our docs after https://jira.dev.clover.com/browse/DS-63 has been completed and published.

We already have a 'Charge' button, but it does nothing. Let's add some functionality.

In `events.js`, we'll add functionality to the `onclick` handler, parsing the `total` into an `int`, and attempting to start a Sale:

```diff
chargeKey.addEventListener("click", function() {
+ var amount = parseInt(document.getElementById("total").innerHTML.replace(".", ""));
+ // 'amount' is an int of the number of pennies to charge
+ if (amount > 0) {
+   cloudtest.performSale(amount);
+ }
});
```

We'll interact with the actual `cloverConnector` API in `index.js`. Note that we are setting an `ExternalId` on our `SaleRequest`. An `ExternalId` serves a number of different purposes:
1. Your POS can use it to associate your `Order` and `Payment` models with Clover's `Payment` objects.
2. It helps prevent accidental duplicate charges. The Clover device will reject back-to-back `TransactionRequests` that have identical `ExternalId`s.
3. If you use universally unique `ExternalId`s on every transaction, they can be used as a last resort to help Clover Engineering triage issues that may arise with individual transactions. Please note that providing a Clover `PaymentId` will resolve issues quicker. However, there can be rare instances when your POS only knows the `ExternalId` of a `TransactionRequest`, but not its Clover `PaymentId` (e.g., if connectivity between the POS and Clover device is dropped mid-transaction).

For these reasons, **you should persist both ExternalIds and Clover Payments in your database.** We also highly recommend making `ExternalId`s universally unique. If your POS is not already generating unique Payment IDs, our SDK provides a utility method to generate a 13-digit alphanumeric UUID. While we can't guarantee universal uniqueness, our utility method has only a 1/1,180,591,620,685,165,462,528 chance of collision.

The `ExternalId` is required on every `TransactionRequest`, and must have a length between 1 and 32.

```diff
CloudTest.prototype.performSale = function (amount) {
+ var saleRequest = new clover.remotepay.SaleRequest();
+ saleRequest.setAmount(amount);
+ saleRequest.setExternalId(clover.CloverID.getNewId());
+ this.cloverConnector.sale(saleRequest);
};
```

After the webpage reloads, re-establish a connection to the device, enter an amount into the calculator, and press 'Charge'. You should see instructions on the Clover device to process your first card transaction. Swipe/dip/tap to pay, and follow the on-screen instructions.

After you enter your signature on-screen, you might notice the device is "stuck" on this screen. However, this is the intended behavior. The Clover device is waiting for our POS to either approve or reject the customer's signature. The POS, rather than the Clover device, needs to handle this approval/denial, as semi-integrated Clover devices are frequently utilized as being customer-facing only.

![](public/assets/images/verifyingSignature.png)

Exit Cloud Pay Display by touching the four corners of the screen, and let's write some more code. We don't want any of our merchants to get "stuck" at this screen.

If you never saw this screen, you'll need to adjust your merchant level settings, and initiate another Sale to reach this point. // TODO: link to a page that talks about merchant-level signature settings in depth.

### Handling signature verification

In this section, we'll render the signature captured on the Clover device onto our POS's DOM, and provide the user with the option of either accepting or denying it. Let's start by providing a `<canvas>` element which we can write our signature to.

In `index.html`:

```diff
<div class="row">
    <div class="col-md-6 logo--container">
        <img src="./assets/clover_logo.png" class="logo"></img>
    </div> 
    <div class="col-md-5 status--container">
        <h3 class="status" id="status-message"> Not connected to your Clover device. Please connect to perform an action. </h3>
    </div>
</div>
+ 
+ <div class="row">
+   <div class="col-xs-12">
+     <canvas ref="canvas" width="300" height="175" id="verify-signature-canvas"/>
+   </div> 
+ </div>
```

Next, we'll need to implement the `CloverConnectorListener#onVerifySignatureRequest` callback that gets invoked at this stage of the transaction lifecycle. In that method, we will render the signature on the `<canvas>` element we just created, and then provide the merchant with the option of either approving or denying the signature.

First, we'll draw the signature. In `index.js`:

```diff
CloverConnectorListener.prototype.onDeviceError = function(deviceErrorEvent) {
  window.alert(`Message: ${deviceErrorEvent.getMessage()}`);
};

+ CloverConnectorListener.prototype.onVerifySignatureRequest = function(verifySignatureRequest) {
+   // clear any previous signatures, draw the current signature
+   var canvas = document.getElementById("verify-signature-canvas");
+   var ctx = canvas.getContext('2d');
+   ctx.clearRect(0, 0, canvas.width, canvas.height);
+   ctx.scale(0.25, 0.25);
+   ctx.beginPath();
+   for (var strokeIndex = 0; strokeIndex < verifySignatureRequest.getSignature().strokes.length; strokeIndex++) {
+     var stroke = verifySignatureRequest.getSignature().strokes[strokeIndex];
+     ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
+     for (var pointIndex = 1; pointIndex < stroke.points.length; pointIndex++) {
+         ctx.lineTo(stroke.points[pointIndex].x, stroke.points[pointIndex].y);
+         ctx.stroke();
+     }
+   }
+   // reset the scale so clearing the previous signature will function as intended
+   ctx.scale(4, 4);
+ };
```

Then, we'll present the merchant with the option of accepting or rejecting the transaction, based on verifying the signature. Due to the asynchronous nature of drawing on an html canvas, we use `setTimeout()` to enqueue this code in the call stack. Otherwise, the confirm dialog will appear before the signature has been drawn.

```diff
CloverConnectorListener.prototype.onVerifySignatureRequest = function(verifySignatureRequest) {
  // clear any previous signatures, draw the current signature
  var canvas = document.getElementById("verify-signature-canvas");
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(0.25, 0.25);
  ctx.beginPath();
  for (var strokeIndex = 0; strokeIndex < verifySignatureRequest.getSignature().strokes.length; strokeIndex++) {
    var stroke = verifySignatureRequest.getSignature().strokes[strokeIndex];
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (var pointIndex = 1; pointIndex < stroke.points.length; pointIndex++) {
        ctx.lineTo(stroke.points[pointIndex].x, stroke.points[pointIndex].y);
        ctx.stroke();
    }
  }
  // reset the scale so clearing the previous signature will function as intended
  ctx.scale(4, 4);
+  
+  // present the merchant with the option of approving or denying the signature
+  
+  // due to the asynchronous nature of drawing on an html canvas, we need to
+  // enqueue this in the message queue to be executed when the call stack is
+  // empty. otherwise, the confirm dialog will appear before the signature
+  // has rendered.
+  setTimeout(function() {
+    if (confirm("Would you like to approve this signature?")) {
+      // accept or reject, based on the merchant's input
+      this.cloverConnector.acceptSignature(verifySignatureRequest);
+    } else {
+      this.cloverConnector.rejectSignature(verifySignatureRequest);
+    }
+  }.bind(this), 0);
};
```

Refresh the webpage, reconnect to the Clover device, initiate another Sale, and accept the signature. You have now completed your first `remote-pay-cloud` Sale! 🎉 

But don't ship this code to production just yet. Start *another* Sale, proceed through the transaction lifecycle using the **same card** as you just used, and you will be presented with this screen, again being "stuck". Let's discuss how to proceed.

![](public/assets/images/verifyingPayment.png)

### Working with challenges

By using the same payment card twice in quick succession, we have triggered a `DUPLICATE_CHALLENGE`, which we'll need to resolve in the `CloverConnectorListener#onConfirmPaymentRequest` callback. You can read more about working with Challenges [here](https://docs.clover.com/build/working-with-challenges/). Let's render all possible challenges, and then give the merchant the option to approve, or reject the payment.

If we're resolving the last challenge in the Challenges array, we want a merchant input of 'OK' to actually accept the Payment.

```diff
    setTimeout(function() {
      if (confirm("Would you like to approve this signature?")) {
        // accept or reject, based on the merchant's input
        this.cloverConnector.acceptSignature(verifySignatureRequest);
      } else {
        this.cloverConnector.rejectSignature(verifySignatureRequest);
      }
    }.bind(this), 0);
  };
+
+  CloverConnectorListener.prototype.onConfirmPaymentRequest = function(confirmPaymentRequest) {
+  for (var i = 0; i < confirmPaymentRequest.getChallenges().length; i++) {
+    // boolean of whether or not we are resolving the last challenge in the Challenges array
+    var isLastChallenge = i === confirmPaymentRequest.getChallenges().length - 1;
+    
+    if (confirm(confirmPaymentRequest.getChallenges()[i].getMessage())) {
+      if (isLastChallenge) {
+        this.cloverConnector.acceptPayment(confirmPaymentRequest.getPayment());
+      }
+    } else {
+      this.cloverConnector.rejectPayment(confirmPaymentRequest.getPayment(), request.getChallenges()[i]);
+      return;
+    }
+  }
};
```

Start a new Sale, ensure you're able to resolve the `DUPLICATE_CHALLENGE`, and then let's move on to the next section.

----------

----------

----------

### Add a listener to the Clover Connector
Define a listener (specifically, an [`ICloverConnectorListener`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/ICloverConnectorListener.html), as you are writing over predefined events on the CloverConnector interface) for the default connector that will handle the connection to the device. For now, it will handle when the device is connected, ready to process requests, and disconnected. You will define this outside of the initial connection function as you will need it to define a sale listener in a separate class function.
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

Add the listener to the connector using [`CloverConnector::addCloverConnectorListener()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#addCloverConnectorListener-com.clover.remote.client.ICloverConnectorListener-), passing in the defaultCloverConnectorListener you just defined.

### Initialize the connection
Initialize the connection using [`CloverConnector::initializeConnection()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#initializeConnection--). In the app, click the green connect button. If everything worked correctly, the status bar at the top will display a ready message! You are now able to connect and disconnect from a Clover device.

### Display a message
Define a class function `showMessage()` that will use the [`CloverConnector::showMessage()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#showMessage-java.lang.String-) to display a message through the device through the "Show Message" button. To retrieve the connector, a `getCloverConnector()` has been defined that will retrieve the connector that was set in the `run` function. Now you can show any message to the device. Note that this message will not disappear until it is changed, or the device/application is disconnected.

As an important side note, make sure to properly dispose of the connector on completion of the action (such as showing a message or completing a sale). A `cleanup()` function is defined already that invokes the [`CloverConnector::dispose()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#dispose--) function.

  ```javascript
  CloudTest.prototype.showMessage = function() {
    // This will send a welcome message to the device
    getCloverConnector().showMessage("Welcome to Clover Connector")

    // Make sure to properly dispose of the connector
    cleanup();
  }
  ```

### Add a sale listener
Now add a sale listener. This is done by extending the `defaultCloverConnectorListener` with event handlers for sale actions. You will define onSaleResponse, onConfirmPaymentRequest, and onVerifySignatureRequest. Take a look at [`CloverConnector::acceptPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptPayment-com.clover.sdk.v3.payments.Payment-) and [`CloverConnector::acceptSignature()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptSignature-com.clover.remote.client.messages.VerifySignatureRequest-) for more information.
  ```javascript
  var saleListener = Object.assign({}, defaultCloverConnectorListener, {
    onSaleResponse: function (response) {
      console.log({message: "Sale complete!", response: response});
    },

    onConfirmPaymentRequest: function (request) {
      console.log({message: "Automatically accepting payment", request: request});

      getCloverConnector().acceptPayment(request.getPayment());
    },

    onVerifySignatureRequest: function (request) {
      console.log({message: "Automatically accepting signature", request: request});

      getCloverConnector().acceptSignature(request);
    }
  });
  ```
Add the listener, similar to step 8, passing in the saleListener.

### Make a sale
Time to make a sale! Create a [`SaleRequest`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/messages/SaleRequest.html) object using the Remote Pay Cloud API, and set an external id, as well as the amount. The `calculator.js` will have access to the amount on the number pad. Invoke `setAutoAcceptSignature(false)` since we want to see the signature handling.
  ```javascript
  var saleAmount = amount
  var saleRequest = new sdk.remotepay.SaleRequest();
  saleRequest.setExternalId(clover.CloverID.getNewId());
  saleRequest.setAmount(amount);
  saleRequest.setAutoAcceptSignature(false);
  ```
Finally, initiate the sale by calling the [`CloverConnector::sale()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#sale-com.clover.remote.client.messages.SaleRequest-) function, passing in the `saleRequest`. If everything goes smoothly, you should see instructions on the Clover device to process the payment method.

### Handling requests and responses
Congratulations, you made your first sale! Now take a moment to look at the log messages and its contents (you should have requests and responses set in the console.logs). Learn about a [`SaleResponse`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/messages/SaleResponse.html).

Make another sale, with the same card/payment method. Take a look at the confirm payment message in the console. You should see a challenges property, which is an array containing any number of potential issues with the transaction. Here you should have a "duplicate payment" message, because we just used the same card!

Now we need to create logic to handle this challenge. One simple way is to create a separate interface to confirm or reject this transaction from the POS. Then, depending on the input, call [`CloverConnect:: acceptPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#acceptPayment-com.clover.sdk.v3.payments.Payment-), or the [`CloverConnector::rejectPayment()`](https://clover.github.io/remote-pay-java/1.4.0/docs/com/clover/remote/client/CloverConnector.html#rejectPayment-com.clover.sdk.v3.payments.Payment-com.clover.remote.Challenge-) connector functions. You will also define some more logic for `onSaleResponse`, since rejecting a payment request will not result in a proper sale.

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
        getCloverConnector().acceptPayment(request.getPayment());
      } else {
        getCloverConnector().rejectPayment(request.getPayment(), challenges[0]);
      }
    } else {
      console.log({message: "Accepted Payment!"});
      cloverConnector.acceptPayment(request.getPayment());
    }
  },
  ```

### Additional Resources
Congratulations! You have now integrated a web application to a clover device, and are able to show messages and perform a sale. But the Clover Connector is capable of so much more. Here are some additional resources to expand on this project, and start integrating these functionalities into a personal application:

  * [Clover Connector Browser SDK](https://github.com/clover/remote-pay-cloud/)
  * [API documentation](http://clover.github.io/remote-pay-cloud/1.4.0/)
  * [API class documentation](https://clover.github.io/remote-pay-cloud-api/1.4.0/)
  * [Example apps](https://github.com/clover/remote-pay-cloud-examples)
  * [Semi-Integration FAQ](https://community.clover.com/spaces/11/semi-integration.html?topics=FAQ)
  * [Clover Developer Community](https://community.clover.com/index.html)
