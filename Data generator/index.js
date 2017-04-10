var express = require("express");
var app     = express();
var request = require("request");


function requestSender()
{
	var date = new Date();
	var milliseconds = date.getTime();

	var month = date.getUTCMonth() + 1;
	var day = date.getUTCDate();
	var year = date.getUTCFullYear();
	DMY = day + "/" + month + "/" + year;
	
	request(
	{
		uri: "http://145.24.222.95:8181/post",
		method: "POST",
		form:
		{
			id: milliseconds,
			timestamp: DMY,
			randomint: Math.floor(Math.random() * 65) -30
		}
	}, function(error, response, body)
	{
		console.log("received: " + body);
	});
}

setInterval(function(){requestSender()}, 3000);