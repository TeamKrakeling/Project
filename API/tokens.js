$(document).ready(function(){
	$('#button').click(function()
	{
		console.log("Klik");
		nodeName = $("#nodeNameInput").val();
		console.log(nodeName);
		if(nodeName.length > 0){
			token = generateToken();
			$("#token_display").html("<p>Token: " + token + "</p>");
			data = {}
			data["nodename"] = nodeName;
			data["date"] = getDate();
			data["token"] = token;
			data["active"] = true;
			data
			console.log(data);
			$.post('/tokenReceiver', data, function(data){
				console.log(data);
			}, 'json');
			
			$('#button').prop('disabled', true);
			setTimeout(function(){$('button').prop('disabled', false)}, 5000);
		} else {
			$("#token_display").html("<p>Please put in a node name.</p>");
		}
	});
	
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
});