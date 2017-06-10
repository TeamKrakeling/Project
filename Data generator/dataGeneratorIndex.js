var express = require("express");
var app     = express();
var request = require("request");

var temperature_tokens = [["temperature_node_1", "15c87a77025"],["temperature_node_2", "15c87a7a361"],["temperature_node_3", "15c87a7b974"],["temperature_node_4", "15c87a7d423"],["temperature_node_5", "15c87a7f0b7"],["temperature_node_6", "15c87a80696"],["temperature_node_7", "15c87a81c78"],["temperature_node_8", "15c87a83397"],["temperature_node_9", "15c87a84912"],["temperature_node_10", "15c87a78da2"]];
var humidity_tokens = [["humidity_node_1", "15c87a59689"],["humidity_node_2", "15c87a5cc4e"],["humidity_node_3", "15c87a5e80a"],["humidity_node_4", "15c87a60631"],["humidity_node_5", "15c87a623cf"],["humidity_node_6", "15c87a63b3f"],["humidity_node_7", "15c87a65460"],["humidity_node_8", "15c87a66dc4"],["humidity_node_9", "15c87a697be"],["humidity_node_10", "15c87a5b4bb"]];
var wall_temperature = [["wall_temperature_node_1","15c87a8e9ff"],["wall_temperature_node_2","15c87a900c7"],["wall_temperature_node_3","15c87a916cb"],["wall_temperature_node_4","15c87a92f65"],["wall_temperature_node_5","15c87a94cca"]];
var wall_humidity = [["wall_humidity_node_1","15c87a87298"],["wall_humidity_node_2","15c87a88857"],["wall_humidity_node_3","15c87a89e24"],["wall_humidity_node_4","15c87a8b3e4"],["wall_humidity_node_5","15c87a8cb63"]];
var plant_soil_temperature = [["plant_soil_temperature","15c87a757bb"]];
var plant_soil_humidity = [["plant_soil_humidity_1","15c87a6c8e6"],["plant_soil_humidity_2","15c87a6de50"],["plant_soil_humidity_3","15c87a6f86a"]];
var plant_soil_ph = [["plant_soil_ph_1","15c87a70f88"],["plant_soil_ph_2","15c87a72660"],["plant_soil_ph_3","15c87a73cf7"]];
var plant_light = [["plant_light","15c87a6b1fc"]];

/*
function requestSender()
{
	var DMY = getCurrentDate("DMY");
	var milliseconds = getCurrentDate("Milliseconds");
	
	request(
	{
		uri: "http://145.24.222.95:8181/post",
		method: "POST",
		form:
		{
			token: "15c538bd0bb",
			table: 'test',
			content: {
				id: milliseconds,
				timestamp: DMY,
				randomint: Math.floor(Math.random() * 65) -30
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}
*/


function requestSenderTemps(temp_node)
{
	var table_name = temp_node[0];
	var table_token = temp_node[1];
	var date = getCurrentDate("yyyymmdd");
	var time = getCurrentDate("Time");
	
	request(
	{
		uri: "http://145.24.222.95:8181/post",
		method: "POST",
		form:
		{
			token: table_token,
			table: table_name,
			content: {
				date: date,
				time: time,
				temperature: Math.floor(Math.random() * 5) + 15
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

//--Data generation functions
/*function tokenGenerator()
{
	var DMY = getCurrentDate("DMY");
	var ms = getCurrentDate("Milliseconds");
	
	var testToken = ms.toString(16);
	
	request({
		uri: "http://145.24.222.95:8181/post",
		method: "POST",
		form:
		{
			table: 'tokens',
			content: {
				active: true,
				date: DMY,
				token: testToken,
				nodeName: "GeneratedToken"
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}*/



//--General functions
//This function returns the current date, in the format specified in the arguments
//Possible returnTypes: "DMY" (day month year), "Milliseconds", YYYYMMDD (year month day), and with no argument the function returns the full date

function getCurrentDate(returnType)
{
	var date = new Date();

	if(returnType === "DMY") 
	{
		var month = date.getUTCMonth() + 1;
		var day = date.getUTCDate();
		var year = date.getUTCFullYear();
		var DMY = day + "/" + month + "/" + year;
		return DMY;
	} 
	else if (returnType === "Milliseconds")
	{
		var milliseconds = date.getTime();
		return milliseconds;
	} 
	if(returnType === "yyyymmdd") 
	{
		var month = date.getUTCMonth() + 1 - 5;
		var day = date.getUTCDate();
		var year = date.getUTCFullYear();
		
		var yyyymmdd = year + "";
		
		if(month < 10)
		{yyyymmdd+= "0";}
	
		yyyymmdd+= month + "";
		
		if(day < 10)
		{yyyymmdd+= "0";}
		yyyymmdd+= day;
		
		return yyyymmdd;
	} 
	if(returnType === "Time") 
	{
		var hours = date.getUTCHours();
		var minutes = date.getUTCMinutes();
		
		if(minutes < 10)
		{
			var time = hours + ":" + "0" + minutes;
		}
		else
		{
			var time = hours + ":" + minutes;
		}
		return time;
	}
	else 
	{
		return date;
	}
}

setInterval(function()
{
	temperature_tokens.forEach(function(element){
		requestSenderTemps(element);
	});
}, 1800000);	//1800000 goes every half hour