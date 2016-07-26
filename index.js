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
var LIGHT_COORS = [[0.55,0.00],[0.36,0.14],[0.55,0.14],[0.73,0.14],[0.45,0.21],[0.64,0.21],[0.36,0.29],[0.55,0.29],[0.73,0.29],[0.27,0.36],[0.45,0.36],[0.64,0.36],[0.82,0.36],[0.18,0.43],[0.36,0.43],[0.73,0.43],[0.91,0.43],[0.00,0.50],[0.09,0.50],[0.27,0.50],[0.82,0.50],[1.00,0.50],[0.18,0.57],[0.36,0.57],[0.73,0.57],[0.91,0.57],[0.27,0.64],[0.45,0.64],[0.64,0.64],[0.82,0.64],[0.36,0.71],[0.55,0.71],[0.73,0.71],[0.45,0.79],[0.64,0.79],[0.36,0.86],[0.55,0.86],[0.73,0.86],[0.55,1.00]];
var livePorts = [];


////////////////////////////////////////////////////////////////////////////////// 
// 
// SERIAL PORT
// 
//////////////////////////////////////////////////////////////////////////////////


// list all available ports
SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    if (port.comName.toLowerCase().indexOf('usb') !== -1) {
      var port = new SerialPort(port.comName, {
        baudRate: 115200,
        parser: SerialPort.parsers.readline('\n')
      });

      port.on('open', portOpen);
      port.on('error', portError);
      port.on('data', portData);

      livePorts.push(port);
    }
  });
});


// var port = new SerialPort("/dev/cu.wchusbserial1420", {


// set the index on the board
function portOpen() {

  var initMessage = "INIT: " + index;

  writePorts(initMessage);

  index++;

};

function writePorts(message, i) {
  if (!i) {
    i = 0;
  }
  if (i < livePorts.length) {
    livePorts[i].write(message, function(err, results) {
      if (err) {
        return console.log('Error on write: ', err.message);
      }
      console.log('message written to port ' + i);
      if (results) {
        console.log('Results: ', results);
      }
      i++;
      writePorts(message, i);
    });
  }
}

// open errors will be emitted as an error event
function portError(err) {
  console.log('Error: ', err.message);
};

function portData (data) {
  console.log('Data: ' + data);

  if (data.indexOf('DANGR: ') > -1) {
    var array = data.split(': ')[1].split(',');
    var index = parseInt(array[0]);
    var intensity = array[1];

    var neighbors = getNeighbors(index, intensity / 100 * .34);
    if (neighbors.length) {
      var message = 'SPRED: ';
      for (var i=0; i < neighbors.length; i++) {
        message += pad(neighbors[i], 2) + ",";
      }

      // console.log(message);
      // console.log(message);
      dispatch(message.substring(0, message.length - 1));
    }
  }

};

function getNeighbors(i, radius) {
  var neighbors = [];
  if (i < LIGHT_COORS.length) {
    var p1 = LIGHT_COORS[i];
    for (var i = 0; i < LIGHT_COORS.length; i++) {
      var p2 = LIGHT_COORS[i];
      var a = p1[0] - p2[0];
      var b = p1[1] - p2[1];
      var v = Math.sqrt(a*a + b*b);
      if (v !== 0 && v < radius) {
        neighbors.push(i);
      }
    }
  }
  return neighbors;
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

  writePorts(message);

  // port.write(message, function(err, results) {
  //     if (err) console.log('err ' + err);
  //     if (results) console.log('results ' + results);
  // });

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