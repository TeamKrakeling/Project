var express = require("express");
var app     = express();
var request = require("request");


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

//--Data generation functions
function tokenGenerator()
{
	var DMY = getCurrentDate("DMY");
	var ms = getCurrentDate("Milliseconds");
	
	var testToken = ms.toString(16);
	
	request({
		uri: "http://145.24.222.95:8181/tokenReceiver",
		method: "POST",
		form:
		{
			active: true,
			date: DMY,
			token: testToken,
			nodeName: "GeneratedToken"
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

//--General functions
//This function returns the current date, in the format specified in the arguments
//Possible returnTypes: "DMY" (day month year), "Milliseconds", and with no argument the function returns the full date
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
	else 
	{
		return date;
	}
}

setInterval(function(){requestSender()}, 3000);