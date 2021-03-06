//weather and its forcast tweet using Artik cloud and Raspberry Pi

//related to artik cloud, utilizing socket connection to send data on artik cloud
var webSocketUrl = "wss://api.artik.cloud/v1.1/websocket?ack=true";
var device_id_temp = "e831---------youid--------276d"; //replace with your corresponding device id ; id for current temperature
var device_token_temp = "5d-----------------b39c4a";   // current temperature token
var device_id_wd = "34e------------------------cdh9f"; //id for rainPredictData
var device_token_wd = "3e2a---------------------b1391";	//token for rainPredictData

var isWebSocketReady = false;
var ws = null;

var WebSocket = require('ws');

//related to Led indicator setup
//remove below comment if you want to use RGB led /*** ----to--- ***/
/***
var GPIO = require('onoff').Gpio,
    red = new GPIO(17,'out'),
    green = new GPIO(27,'out'),
    blue = new GPIO(22,'out');

//here I have used common anode RGB led, so to on corresponding led make it 0
red.writeSync(1);
green.writeSync(0);
blue.writeSync(0);
***/

//related to weather api
var WunderApi = require("wunderground-api-client").WunderApi;
var combined = new WunderApi('6s4------yourid--------48fe', null, 'conditions', 'forecast'); //replace with your wounderground API key
var Temp = 0;			//variable to store today's temperature value of city
var predict = false;		//variable to store tomorrow's prediction status of rain in city

//to predict chance of rain happening
function rainPredictFunction(relHum) {
	if (relHum > 95) {
		predict = true;
	}
	else predict = false;
}

/**
 * Gets the current time in millis
 */
function getTimeMillis(){
    return parseInt(Date.now().toString());
}

/**
 * Create a /websocket device channel connection
 */
function start() {
    //Create the websocket connection
    isWebSocketReady = false;
    ws = new WebSocket(webSocketUrl);
    ws.on('open', function() {
        console.log("Websocket connection is open ....");
        register();
    });
    ws.on('message', function(data, flags) {
        console.log("Received message: " + data + '\n');
    });
    ws.on('close', function() {
        console.log("Websocket connection is closed ....");
    });
}

/**
 * Sends a register message to the websocket and starts the message flooder
 */
function register(){
    console.log("Registering device on the websocket connection");
    try{
        var registerMessage = '{"type":"register", "sdid":"'+device_id_temp+'", "Authorization":"bearer '+device_token_temp+'", "cid":"'+getTimeMillis()+'"}';
        //uncomment below line if you want to view regisration of your device to artik cloud 
	//console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});

		registerMessage = '{"type":"register", "sdid":"'+device_id_wd+'", "Authorization":"bearer '+device_token_wd+'", "cid":"'+getTimeMillis()+'"}';
        //console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});

		isWebSocketReady = true;
    }
    catch (e) {
        console.error('Failed to register messages. Error in registering message: ' + e.toString());
    }
}

/**
 * function to send weather data as a message to ARTIK Cloud
 */
function sendData(){
    try{

		var uploadVal = {
			 currenttempData : {
				"currentTempVal": Temp	     //currentTempVal defined as per field name during device type creation(todayTempDevice) on artik developer
			},
			 rainPredictData : {
				"rainPredictStatus": predict  //similarly rainPredictStatus defined as per field name for rainPredictDevice on artik developer
			}
		}

        ts = ', "ts": '+getTimeMillis();
        var payload = '{"sdid":"'+device_id_temp+'"'+ts+', "data": '+JSON.stringify(uploadVal.currenttempData)+', "cid":"'+getTimeMillis()+'"}';
        //uncomment below line to view payload of your data
	    //console.log('Sending payload ' + payload);
        ws.send(payload, {mask: true});

		ts = ', "ts": '+getTimeMillis();
		var payload = '{"sdid":"'+device_id_wd+'"'+ts+', "data": '+JSON.stringify(uploadVal.rainPredictData)+', "cid":"'+getTimeMillis()+'"}';
        //console.log('Sending payload ' + payload);
        ws.send(payload, {mask: true});

    } catch (e) {
        console.error('Error in sending a message: ' + e.toString());
    }
}

/**
 * All start here
 */
start(); // create websocket connection

setInterval(function(){


	combined.query('India/Bhiwandi')
	  .then(function (result) {
		  //console.log(result);
		  var json_data = JSON.stringify(result);
		  var jsondata = JSON.parse(json_data);
		  Temp = jsondata.current_observation.temp_c;
		  var relHumidity = jsondata.current_observation.relative_humidity;
		  console.log("Today Temp: "+Temp);
		  console.log("Today relativeHumidity: "+relHumidity);


		  var dayTemp = jsondata.forecast.simpleforecast.forecastday[0].high.celsius;
		  var nightTemp = jsondata.forecast.simpleforecast.forecastday[0].low.celsius;
		  var tomRelHumidity = jsondata.forecast.simpleforecast.forecastday[0].avehumidity;
		  var tomforcast = jsondata.forecast.txt_forecast.forecastday[0].fcttext;
      
		  console.log("Tom DayT: "+dayTemp);
		  console.log("Tom NightT: "+nightTemp);
		  console.log("Tom relHumidity: "+tomRelHumidity);
		  console.log("Tom weather: "+tomforcast);
		  rainPredictFunction(tomRelHumidity);
		  console.log(predict);
		  
		  //remove below comment if you are using RGB led /*** ----to--- ***/
		  /***
		  if(predict){
	            //blue led on to indicate chane of rain
		    red.writeSync(1);
		    green.writeSync(1);
                    blue.writeSync(0);     
		  }
		  ***/
		  //console.log(jsondata);

		  })
	  .fail(function (err) {console.dir(err)})
	  .done();


	if (!isWebSocketReady){
		console.log("Websocket is not ready. Skip sending data to ARTIK Cloud (temp:" + Temp +")"+"(predict:"+predict+")");
		return;
	}

	sendData(); //function

},5000);
