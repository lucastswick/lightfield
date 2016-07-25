// http://stackoverflow.com/questions/5697047/convert-serial-read-into-a-useable-string-using-arduino
// https://hackingmajenkoblog.wordpress.com/2016/02/01/reading-serial-on-the-arduino/

////////////////////////////////////////////////////////////////////////////////// 
// 
// REQUIRE
// 
//////////////////////////////////////////////////////////////////////////////////

var SerialPort = require("serialport");
var keypress = require('keypress');



////////////////////////////////////////////////////////////////////////////////// 
// 
// VARS
// 
//////////////////////////////////////////////////////////////////////////////////

var index = 0;
var STATES = {
  AMBIENT: 0,
  RED: 1, 
  GREEN: 2, 
  BLUE: 3
};
var state = STATES.AMBIENT;



////////////////////////////////////////////////////////////////////////////////// 
// 
// SERIAL PORT
// 
//////////////////////////////////////////////////////////////////////////////////


// list all available ports
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    
    // if (port.comName.indexOf('usb') > -1) {
      // onPortReady(port.comName);
    // }
  });
});


// var port = new SerialPort("/dev/cu.wchusbserial1420", {
var port = new SerialPort("/dev/cu.usbmodem1411", {
  baudRate: 9600,
  parser: SerialPort.parsers.readline('\n')
});

// set the index on the board
port.on('open', function() {

  var initMessage = "INIT: " + index;

  port.write(initMessage, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });

  index++;

});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
});

port.on('data', function (data) {
  console.log('Data: ' + data);

  if (data.indexOf('DANGR: ') > -1) {
    var array = data.split(': ')[1].split(',');
    var index = parseInt(array[0]);
    var intensity = array[1];

    var neighbors = getNeighbors(index);
    var message = 'SPRED: ';
    for (var i=0; i < neighbors.length; i++) {
      message += pad(neighbors[i], 2) + ","; 
    }
    message += ":" + pad(intensity, 3);

    // console.log(message);
    dispatch(message);
    
  }

});

function getNeighbors(i) {
  
  var n1 = i-1;
  if (n1 < 0) n1 = 7;
  
  var n2 = i+1;
  if (n2 > 7) n2 = 0;

  // console.log("neighbors of ", i, " are ", n1, " and ", n2);

  return [n1, n2];
}



////////////////////////////////////////////////////////////////////////////////// 
// 
// KEYPRESSES
// 
//////////////////////////////////////////////////////////////////////////////////


// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  
  console.log('got "keypress"', ch);

  // control+c should pause the listener
  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause();
    process.exit();
  }

  // 1-8 keys
  switch (ch < 8) {
    case true:
      setIndex(ch);
      break;
  }
  
  if (key) {
    switch (key.name) {
      case "a":
        setState(STATES.AMBIENT);
        break;
      case "r":
        setState(STATES.RED);
        break;
      case "g":
        setState(STATES.GREEN);
        break;
      case "b":
        setState(STATES.BLUE);
        break;
      case "s":
        var message = "SPRED: " + state + '!';
        dispatch(message);
        break;
    }
  }

});

process.stdin.setRawMode(true);
process.stdin.resume();




////////////////////////////////////////////////////////////////////////////////// 
// 
// STATES
// 
//////////////////////////////////////////////////////////////////////////////////

function setIndex(index) {
  console.log(pad(index, 2));
  var message = 'INDEX: ' + pad(index, 2) + '!';
  dispatch(message);
}

function setState(theState) {
  
  // switch (theState) {
  
  //   case STATES.AMBIENT:
  //     dispatch("A");
  //     break;
  //   case STATES.RED:
  //     dispatch("R");
  //     break;
  //   case STATES.GREEN:
  //     dispatch("G");
  //     break;
  //   case STATES.BLUE:
  //     dispatch("B");
  //     break;
  // }

  switch (theState) {
  
    case STATES.AMBIENT:
    case STATES.RED:
    case STATES.GREEN:
    case STATES.BLUE:
      state = theState;
      // var message = state + '\r';
      // var message = "STATE: " + state + '\r';
      var message = "STATE: " + state + '!';
      dispatch(message);
      break;
  }
}

function dispatch(message) {

  var l = message.length;
  console.log("Dispatching ", message);
  // for(var i=0; i<l; i++){
  //     port.write(new Buffer(message[i], 'ascii'), function(err, results) {
  //         if (err) console.log('Error: ' + err);
  //         if (results) console.log('Results ' + results);
  //     });
  // }

  port.write(message, function(err, results) {
      if (err) console.log('err ' + err);
      if (results) console.log('results ' + results);
  });

  // // Sending the terminate character
  // port.write(new Buffer('\n', 'ascii'), function(err, results) {
  //     if (err) console.log('err ' + err);
  //     if (results) console.log('results ' + results);
  // });
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}