document.addEventListener("DOMContentLoaded", function() {
  
  var displayState = '';
  var numpadKeys = document.querySelectorAll('.numpad--key');
  var total = document.getElementById('total');
  
  var connectKey = document.getElementById('key--connect');
  var chargeKey = document.getElementById('key--charge');
  var helloWorldKey = document.getElementById("key--hello-world");
  
  numpadKeys.forEach(function(key) {
    key.addEventListener("click", function() {
      var keyValue = key.id.slice(5, key.id.length);
      
      switch (true) {
        case ('12345678900'.includes(keyValue)):
          if (displayState + keyValue < 1) {
            break;
          }
          if (displayState.length < 7) {
            displayState += keyValue;
          }
          break;
        case keyValue === 'del':
          displayState = displayState.slice(0, displayState.length - 1);
          break;
        default:
          break;
      }
      
      if (displayState.length === 0 || displayState < 1) {
        total.innerHTML = '0.00';
      } else if (displayState.length === 1) {
        total.innerHTML = '0.0' + displayState;
      } else if (displayState.length === 2) {
        total.innerHTML = '0.' + displayState;
      } else {
        total.innerHTML = displayState.slice(0, displayState.length - 2) + '.' + displayState.slice(displayState.length - 2, displayState.length);
      }
      if (displayState.length >= 4) {
        total.style.marginLeft = 120 - (27.5 * (displayState.length - 3)) + "px";
      } else {
        total.style.marginLeft = '120px';
      }
      
    });
  });
  
  connectKey.addEventListener("click", function() {
    remotePayCloudTutorial.connect();
  });
  
  chargeKey.addEventListener("click", function() {
  });
  
  helloWorldKey.addEventListener("click", function() {
    remotePayCloudTutorial.showHelloWorld();
  });
});
