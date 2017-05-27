$(document).ready(function(){				//TODO: This JQuery part could be removed later if not needed anymore
				$('#requestButton').click(function()
				{
					console.log("Klik request");
					nodeName = $("#nodeNameInput").val();
					if(nodeName.length > 0){
						token = generateToken();
						$("#token_display").html("<p>Token: " + token + "</p>");
						var data = {};
						data["table"] = "tokens";
						
						var content	= {};					
						content["nodename"] = nodeName;
						content["date"] = getDate();
						content["token"] = token;				//TODO: Change this to status with an int or string, or make an extra value with intermittent failures. Maybe also store regular interval?
						content["active"] = true;
						
						data["content"] = content;
						
						console.log(data);
						
						$.post('/post', data, function(data){
							console.log(data);
						}, 'json');
						
						$('#requestButton').prop('disabled', true);
						setTimeout(function(){$('#requestButton').prop('disabled', false)}, 5000);
					} else {
						$("#token_display").html("<p>Please put in a node name.</p>");
					}
				});
				
				$('#deleteButton').click(function()
				{
					console.log("Klik delete");
					nodeToken = $("#nodeToDeleteInput").val();
					if(nodeToken.length > 0){
						var data = {};
						data["table"] = "tokens";
						
						var content	= {};	
						content["token"] = nodeToken;
						
						data["content"] = content;
						
						console.log(data);
						
						$.post('/delete', data, function(data){
							console.log(data);
						}, 'json');
						
						$('#deleteButton').prop('disabled', true);
						setTimeout(function(){$('#deleteButton').prop('disabled', false)}, 5000);
					} else {
						$("#delete_display").html("<p>Please put in a token to delete.</p>");
					}
				});
				
				$('#updateButton').click(function()
				{
					console.log("Klik update");
					nodeToken = $("#nodeToUpdateInput").val();
					if(nodeToken.length > 0){
						var data = {};
						data["table"] = "Tokens";
						
						var content = {};
						var update = {};
						var fieldToUpdate = {};
						update["active"] = false;
						fieldToUpdate["token"] = nodeToken;
						content["update"] = update;
						content["fieldToUpdate"] = fieldToUpdate;
						
						data["content"] = content;
						console.log(data);
						
						$.post('/update', data, function(data){
							console.log(data);
						}, 'json');
						
						$('#updateButton').prop('disabled', true);
						setTimeout(function(){$('#updateButton').prop('disabled', false)}, 5000);
					} else {
						$("#update_display").html("<p>Please put in a token to update.</p>");
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