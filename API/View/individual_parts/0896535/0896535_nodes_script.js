$(document).ready(function(){
	//--Listeners for the buttons on the page
	//The request button. This cgenerates a token and creates a corresponding new table for the given node name.
	$('#requestButton').click(function()
	{
		console.log("Click request");
		nodeName = $("#nodeNameInput").val();
		if(nodeName.length > 0){
			token = generateToken();
			
			var data_to_send = {};

			var content	= {};					
			content["nodename"] = nodeName;
			content["date"] = getDate("DMY");
			content["token"] = token;	
			content["active"] = true;
			content["last_updated"] = getDate("Mill");
			
			data_to_send["content"] = content;
			
			console.log("data to send: ");
			console.log(data_to_send);
			
			$.post('/post_token_creator', data_to_send, function(data){
				console.log(data);
				if(data == "acknowledgement"){
					$("#token_display").html("<p>New node created.<br>Token: " + token + "</p>");
				} 
				else{
					$( "#token_display" ).html("<p class='errorMessage'>" + data + "</p>" );
				}
			});
			
			$('#requestButton').prop('disabled', true);
			setTimeout(function(){$('#requestButton').prop('disabled', false)}, 5000);
		} else {
			$("#token_display").html("<p class='errorMessage'>Please put in a node name.</p>");
		}
	});

	//The toggle button. This toggles the active status of the node matching the token the user specifies. If a node is inactive, any data it sends will be ignored.
	$('#toggleButton').click(function()
	{
		console.log("Click update");
		nodeName = $("#nodeToToggleInput").val();
		if(nodeName.length > 0){
			var data_to_send = {};
			
			var content = {};
			var fieldToUpdate = {};
			fieldToUpdate["nodename"] = nodeName;
			content["fieldToUpdate"] = fieldToUpdate;
			
			data_to_send["content"] = content;
			console.log(data_to_send);
			
			$.post('/toggle_node', data_to_send, function(data){
				//console.log(data);
			}, 'json');
			
			$('#toggleButton').prop('disabled', true);
			setTimeout(function(){$('#toggleButton').prop('disabled', false)}, 5000);
			location.reload();
		} else {
			$("#toggle_display").html("<p class='errorMessage'>Please put in a node name for the node to toggle.</p>");
		}
	});

	//--general functions used in the click listeners
	function generateToken(){
		var milliseconds = getDate("Mill")
		var token = milliseconds.toString(16);
		console.log(token);
		return token;
	}

	function getDate(type){
		var date = new Date();
		if(type == "DMY"){
			var month = date.getUTCMonth() + 1;
			var day = date.getUTCDate();
			var year = date.getUTCFullYear();
			DMY = day + "/" + month + "/" + year;
			return DMY;
		}
		if(type == "Mill"){
			var milliseconds_since_epoch = date.getTime();
			return milliseconds_since_epoch;
		}
		else{
			console.log("No known date type was given, returned full date");
			return date;
		}
	}

	//--Table creation
	//This creates an overview table of all existing node tables with additional information.
	$.get('http://145.24.222.23:8181/get_tokens', function (json)
	{
		var regular_interval = 1800000
		var table = "<thead><tr><th>Node name:</th><th>Token:</th><th>On/off:</th><th>Current status:</th></tr></thead>";
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
			//When the active property of the node is false, status is set to inactive.
			if(jsonobject.active == "false"){
				console.log("!! thingy is not active")
				table = table + "<td><span class='redDot'></span>Inactive: this node has been turned off.</td>";
			}
			//When the last updated time is more than 30 intervals (900 minutes) status is set to inactive.
			else if((milliseconds_since_epoch - jsonobject.last_updated) > (regular_interval*30)){ //54000000 = 900 minutes, which is 30 intervals.
				table = table + "<td><span class='redDot'></span>Inactive: this node has not received data for at least 30 regular intervals of 30 minutes.</td>";
			}
			//When the last updated time is more than 3 intervals (90 minutes) status turns to intermittent failures.
			else if (milliseconds_since_epoch - jsonobject.last_updated > (regular_interval*3)){ //5460000 = 91 minutes, every interval is 30 minutes.
				table = table + "<td><span class='orangeDot'></span>Intermittent Failures: this node has not received data for 3 regular intervals of 30 minutes.</td>";
			}
			else{
				table = table + "<td><span class='greenDot'></span>Active: this node is functional.</td>";
			}
			table = table + "</tr>";
		});	
		
		table = table + "</tbody>";
		$( "#node_table" ).append(table);
	});
});