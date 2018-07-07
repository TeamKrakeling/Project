$(document).ready(function(){
//--Listeners for the buttons on the page
//The request button. This cgenerates a token and creates a corresponding new table for the given node name.
$('#requestButton').click(function()
{
	console.log("Klik request");
	nodeName = $("#nodeNameInput").val();
	if(nodeName.length > 0){
		token = generateToken();
		$("#token_display").html("<p>Token: " + token + "</p>");
		var data = {};

		var content	= {};					
		content["nodename"] = nodeName;
		content["date"] = getDate();
		content["token"] = token;	
		content["active"] = true;
		
		data["content"] = content;
		
		console.log(data);
		
		$.post('/post_token_creator', data, function(data){
			console.log(data);
		}, 'json');
		
		$('#requestButton').prop('disabled', true);
		setTimeout(function(){$('#requestButton').prop('disabled', false)}, 5000);
	} else {
		$("#token_display").html("<p>Please put in a node name.</p>");
	}
});

//The toggle button. This toggles the active status of the node matching the token the user specifies. If a node is inactive, any data it sends will be ignored.
$('#toggleButton').click(function()
{
	console.log("Klik update");
	nodeToken = $("#nodeToToggleInput").val();
	if(nodeToken.length > 0){
		var data = {};
		
		var content = {};
		var fieldToUpdate = {};
		fieldToUpdate["token"] = nodeToken;
		content["fieldToUpdate"] = fieldToUpdate;
		
		data["content"] = content;
		console.log(data);
		
		$.post('/toggle_node', data, function(data){
			//console.log(data);
		}, 'json');
		
		$('#toggleButton').prop('disabled', true);
		setTimeout(function(){$('#toggleButton').prop('disabled', false)}, 5000);
		location.reload();
	} else {
		$("#toggle_display").html("<p>Please put in a token to update.</p>");
	}
});

//--general functions used in the click listeners
function generateToken(){
	var date = new Date();
	var milliseconds = date.getTime();
	var token = milliseconds.toString(16);
	console.log(token);
	return token;
}

function getDate(){
	var date = new Date();
	var month = date.getUTCMonth() + 1;
	var day = date.getUTCDate();
	var year = date.getUTCFullYear();
	DMY = day + "/" + month + "/" + year;
	return DMY;
}

//--Table creation
//This creates an overview table of all existing node tables with additional information.
$.get('http://145.24.222.23:8181/get_tokens', function (json)
{
	var table = "<thead><tr><th>NodeName:</th><th>Token:</th><th>Active:</th><th>Status:</th></tr></thead>";
	table = table + "<tbody>";
	
	$.each(json, function (i, jsonobject)
	{
		table = table + "<tr><td>" + jsonobject.nodename + "</td><td>" + jsonobject.token + "</td>";
		if(jsonobject.active == "true"){
			table = table + "<td><span class='greenDot'></span>" + jsonobject.active + "</td>";
		} else {
			table = table + "<td><span class='redDot'></span>" + jsonobject.active + "</td>";
		}
		
		var date = new Date();
		var milliseconds_since_epoch = date.getTime();	
		
		console.log(jsonobject);
		//When the last updated time is more than 30 intervals (900 minutes) status is set to inactive.
		if((milliseconds_since_epoch - jsonobject.last_updated) > 54000000) //54000000 = 900 minutes, which is 30 intervals.
		{
			table = table + "<td><span class='redDot'></span>Inactive</td>";
		}
		//When the last updated time is more than 3 intervals (90 minutes) status turns to intermittent failures.
		else if (milliseconds_since_epoch - jsonobject.last_updated > 5460000) //5460000 = 91 minutes, every interval is 30 minutes.
		{
			table = table + "<td><span class='orangeDot'></span>Intermittent Failures</td>";
		}
		else 
		{
			table = table + "<td><span class='greenDot'></span>Active</td>";
		}
		table = table + "</tr>";
	});	
	
	table = table + "</tbody>";
	$( "#node_table" ).append(table);
});
});