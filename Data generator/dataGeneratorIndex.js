// *-----------------------------------------------------------------------*
// | Authors: Corné & Rianne (Team Krakeling)                              |
// | Summary: The index file for the dummy data generator for our project. |
// | It generates test data for our databse.                               |
// | It will no longer be nescessary when we the real data generators are  |
// | provided to us by school.                                             |
// *-----------------------------------------------------------------------*

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

//--Data generation functions
function requestSenderTemperatures(temp_node)
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
				temperature: Math.floor(Math.random() * 15) + 15
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

function requestSenderHumidity(humid_node)
{
	var table_name = humid_node[0];
	var table_token = humid_node[1];
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
				humidity: Math.floor(Math.random() * 20) + 30
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

function requestSenderPH(humid_node)
{
	var table_name = humid_node[0];
	var table_token = humid_node[1];
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
				pH: ((Math.random() * 3) + 5).toFixed(2)
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

function requestSenderLight(humid_node)
{
	var table_name = humid_node[0];
	var table_token = humid_node[1];
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
				light: Math.floor(Math.random() * 600) + 50
			}
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

//--General functions
//This function returns the current date, in the format specified in the arguments
//Possible returnTypes: "yyyymmdd" (year month day), "Time" (in hours and minutes). With no arguments the function returns the full date.
function getCurrentDate(returnType)
{
	var date = new Date();

	if(returnType === "yyyymmdd") 
	{
		var month = date.getUTCMonth() + 1;
		var day = date.getUTCDate();
		var year = date.getUTCFullYear();
		var yyyymmdd = year + "";
		
		if(month < 10)
		{
			yyyymmdd+= "0";
		}
		yyyymmdd+= month + "";
		
		if(day < 10)
		{
			yyyymmdd+= "0";
		}
		yyyymmdd+= day;
		
		return yyyymmdd;
	} 
	else if(returnType === "Time") 
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
		requestSenderTemperatures(element);
	});
	humidity_tokens.forEach(function(element){
		requestSenderHumidity(element);
	});
	wall_temperature.forEach(function(element){
		requestSenderTemperatures(element);
	});
	wall_humidity.forEach(function(element){
		requestSenderHumidity(element);
	});
	plant_soil_temperature.forEach(function(element){
		requestSenderTemperatures(element);
	});
	plant_soil_humidity.forEach(function(element){
		requestSenderHumidity(element);
	});
	plant_soil_ph.forEach(function(element){
		requestSenderPH(element);
	});
	plant_light.forEach(function(element){
		requestSenderLight(element);
	});
	
}, 1800000);	//1800000 goes every half hour