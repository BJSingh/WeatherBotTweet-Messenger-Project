var WunderApi = require("wunderground-api-client").WunderApi;
var combined = new WunderApi('64----yourkey---fe', null, 'conditions', 'forecast');//replace with your wounderground API key

setInterval(function(){
	
combined.query('India/Bhiwandi')
  .then(function (result) {
	  //uncomment console log to view complete result in console window if you want
	  //console.log(result);
	  
	  //JSON.stringify turns a Javascript object into JSON text and stores that JSON text in a string.
	  //JSON.parse turns a string of JSON text into a Javascript object.
	  var json_data = JSON.stringify(result);
	  var jsondata = JSON.parse(json_data);
	  
	  //uncomment below line to view full data received from wunderground which is converted into Javascript object
	  //console.log(jsondata);
	  var Temp = jsondata.current_observation.temp_c;
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
	  
	  
	  
	  })
  .fail(function (err) {console.dir(err)})
  .done();
  
},5000);