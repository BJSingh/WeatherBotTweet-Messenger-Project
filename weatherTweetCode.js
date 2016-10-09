//weather and its forcast tweet using Artik cloud and Raspberry Pi

//Led indicator setup remove below comment if you want to use RGB led /*** ----to--- ***/

var GPIO = require('onoff').Gpio,
    redLed = new GPIO(17,'out'),
    greenLed = new GPIO(27,'out'),
    blueLed = new GPIO(22,'out');

//here I have used common anode RGB led, so to on corresponding led make it 0
//comment below 3 lines if you are not using RGB led
redLed.writeSync(0);		// on
greenLed.writeSync(1);		// off
blueLed.writeSync(1);		// off

//related to artik cloud
var webSocketUrl = "wss://api.artik.cloud/v1.1/websocket?ack=true";
var device_id_todayData = "09dfddaa61034fec8513c1e188d47ce9"; //replace with your corresponding device id ; id for all current weather data
var device_token_todayData = "31bc52f35adf4ee98e084e82bf488e19";   // token
var device_id_tomData = "e84fec6b5e1e42a8a51b7e5e877b83c2";		//id for predicted tomorrow's weather data
var device_token_tomData = "1e3b94d54e24425291dca7167e03e05c";	//token

var isWebSocketReady = false;
var ws = null;

var WebSocket = require('ws');


//related to weather api
var WunderApi = require("wunderground-api-client").WunderApi;
var combined = new WunderApi('64-------acb--4fe', null, 'conditions', 'forecast'); //replace with your wounderground API key
var predict = false;
var todayRelHum;		
var todayTemp, todayWindFlow;
var tomTemp, tomRelHum, tomWindFlow;

//to predict chance of rain happening
function rainPredictFunction(relHum) {
	if (relHum == 100) {
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
    //comment below 3 lines if you are not using RGB led
	redLed.writeSync(0);
	greenLed.writeSync(0);
	blueLed.writeSync(1);

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
	//comment below 3 lines if you are not using RGB led
	redLed.writeSync(1);
	greenLed.writeSync(0);
	blueLed.writeSync(0);

    console.log("Registering device on the websocket connection");
    try{
        var registerMessage = '{"type":"register", "sdid":"'+device_id_todayData+'", "Authorization":"bearer '+device_token_todayData+'", "cid":"'+getTimeMillis()+'"}';
        //uncomment below line if you want to view regisration of your device to artik cloud
	    //console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});

		registerMessage = '{"type":"register", "sdid":"'+device_id_tomData+'", "Authorization":"bearer '+device_token_tomData+'", "cid":"'+getTimeMillis()+'"}';
        //console.log('Sending register message ' + registerMessage + '\n');
        ws.send(registerMessage, {mask: true});

		isWebSocketReady = true;
    }
    catch (e) {
        console.error('Failed to register messages. Error in registering message: ' + e.toString());
    }
}

/**
 * Send one message to ARTIK Cloud
 */
function sendData(){
	//comment below 3 lines if you are not using RGB led
	redLed.writeSync(0);
	greenLed.writeSync(1);
	blueLed.writeSync(0);

    try{

		var uploadVal = {
			 todayWData : {
				 "todayRelHumVal":todayRelHum,			//Weather API returns this as 78%, which is string
				 "todayTempVal":todayTemp,				//while others only number , double e.g. 33.4
				 "todayWindFlowVal":todayWindFlow		// Integer number e.g. 13
				 },
			 tomorrowWData : {
				"tomRelHumVal":tomRelHum,				//But for this it is Integer number
				"tomTempVal":tomTemp,
				"tomWindFlowVal":tomWindFlow
			}
		}

        ts = ', "ts": '+getTimeMillis();
		console.log("Uploading Value to Cloud");

        var payload = '{"sdid":"'+device_id_todayData+'"'+ts+', "data": '+JSON.stringify(uploadVal.todayWData)+', "cid":"'+getTimeMillis()+'"}';
        //uncomment below line to view payload of your data
	    console.log('Sending payload ' + payload);
        ws.send(payload, {mask: true});

		var payload = '{"sdid":"'+device_id_tomData+'"'+ts+', "data": '+JSON.stringify(uploadVal.tomorrowWData)+', "cid":"'+getTimeMillis()+'"}';
        console.log('Sending payload ' + payload);
        ws.send(payload, {mask: true});

    } catch (e) {
        console.error('Error in sending a message: ' + e.toString());
    }

}

/**
 * All start here
 */
start(); // create websocket connection

//Function repeats its execution after set interval of time
setInterval(function(){

	combined.query('India/Mumbai')
	  .then(function (result) {
			  //console.log(result);


			  var json_data = JSON.stringify(result);
			  var jsondata = JSON.parse(json_data);

			  //today's current weather data
			  todayTemp = jsondata.current_observation.temp_c;
			  todayRelHum = jsondata.current_observation.relative_humidity;
			  todayWindFlow = jsondata.current_observation.wind_mph;

			  //tomorrow's predicted  weather data
			  tomTemp = jsondata.forecast.simpleforecast.forecastday[0].high.celsius;
			  tomRelHum = jsondata.forecast.simpleforecast.forecastday[0].avehumidity;
			  tomWindFlow = jsondata.forecast.simpleforecast.forecastday[0].avewind.mph;
			  var tomforcast = jsondata.forecast.txt_forecast.forecastday[0].fcttext;

			  console.log("\n\n****************  Weather Forcast by WeatherBotTweet messenger  ****************");

			  console.log("\n\tObservation Time: "+jsondata.current_observation.observation_time);
			  console.log("\n\t|-------------- Today's Weather Report --------------|\n");
			  console.log("\tTemperature      : "+todayTemp+"C");
			  console.log("\tRelativeHumidity : "+todayRelHum);
			  console.log("\tWindFlow         : "+todayWindFlow+"mph");
			  console.log("\n");

			  console.log("\n\t|------------- Tomorrow's Weather Report ------------|\n");
			  console.log("\tTemperature      : "+tomTemp+"C");
			  console.log("\tRelativeHumidity : "+tomRelHum+"%");
			  console.log("\tWindFlow         : "+tomWindFlow+"mph");

			  console.log("\n"+tomforcast);

			  rainPredictFunction(tomRelHum);
			  if(predict){
				//indicate chane of rain
				redLed.writeSync(1);
				greenLedLed.writeSync(1);
				blueLed.writeSync(0);
				console.log("\n\tMax possiblity of Rain Tomorrow");
			  }
			  console.log("\n********************************************************************************");


		  })
	  .fail(function (err) {console.dir(err)})
	  .done();


	if (!isWebSocketReady){
		console.log("Websocket is not ready. Skip sending data to ARTIK Cloud");
		return;
	}

	sendData(); //calling function to upload avialable data on cloud
	redLed.writeSync(0);
	greenLed.writeSync(0);
	blueLed.writeSync(0);

},10000);		//repeat after every 10 sec
