// *-----------------------------------------------------*
// | Authors: Corné & Rianne (Team Krakeling)            |
// | Summary: The index file for the api of our project  |
// | It contains all of the functions for the various    |
// | post and get calls that can be done to our api.     |
// *-----------------------------------------------------*

var express 	= require("express");
var app     	= express();
var r 			= require("rethinkdb");
var request 	= require("request");
var bodyParser 	= require("body-parser");

var DBHost		= 'localhost';
var DBPort		= 28015;
var DBName		= 'ICTlab'

app.use(bodyParser.json()); 							//support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); 	//support encoded bodies

//use ejs for dynamic html page
app.set('views', __dirname+'/View');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

//Links various urls to their respective html pages
app.get('/',function(req,res){
  res.sendFile(__dirname+'/View/index.html');
});

app.get('/token',function(req,res){
  res.sendFile(__dirname+'/view/tokenpage.html');
});

//Routes to indidual part of 0896024 Corné Verhoog (0896024)
app.get('/0896024',function(req,res)
{res.sendFile(__dirname+'/view/individual_parts/0896024/0896024.html');});
app.get('/visualisation_0896024',function(req,res)
{res.sendFile(__dirname+'/view/individual_parts/0896024/visualisation_0896024.html');});
app.get('/node_manager_0896024',function(req,res)
{res.sendFile('individual_parts/0896024/node_manager_0896024.html');});

//Routes to indidual part of Rianne Schattenberg (0896535)
app.get('/0896535',function(req,res)
{res.sendFile(__dirname+'/view/individual_parts/0896535/0896535.html');});
app.get('/0896535_nodes',function(req,res)
{res.sendFile(__dirname+'/view/individual_parts/0896535/0896535_nodes.html');});
app.get('/0896535_plot_div',function(req,res)
{res.sendFile(__dirname+'/view/individual_parts/0896535/house_temperature_visualisation_div.html');});

//Handles all regular post calls to our api
//It expects a json with the following fields: 'table' (with the name of the table you want to insert data into), 'token' (with the token of that table) and 'content' (with the content you want to insert)
app.post('/post', function(req, res){
	console.log("*post*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('acknowledgement');
    
	//Check if a table is given and the table exists
	request({
		uri: "http://145.24.222.23:8181/get_tablelist",
		method: "GET"
	}, function(error, response, body)
	{
		if(body.indexOf(req.body.table) > 0)
		{
			//Check if the token the user supplemented and the token in the database match
			r.connect({ host: DBHost, port: DBPort }, function(err, conn){
				if(err) throw err;
				r.db(DBName).table('tokens').filter({'nodename': req.body.table}).run(conn, function(err, cursor){
					if (err) throw err;
					cursor.toArray(function(err, result){
						if (err) throw err;
						
						var resultJson = JSON.stringify(result, null, 2);
						console.log("*Get token*:");
						
						if((result[0]["token"] === req.body.token) && result[0]["active"] == "true"){
							console.log("Tokens match");
							if(err) throw err;
							
							//Insert the data
							r.db(DBName).table(req.body.table).insert(req.body.content).run(conn, function(err, DBres)
							{
								if(err) throw err;
								console.log("Posted data");
							});
							
							//Update the last_updated field of the node in the tokens table, so we know it has been updated
							var date = new Date();
							var milliseconds_since_epoch = date.getTime();	
							
							r.db(DBName).table("tokens").filter({token:req.body.token}).update({last_updated: milliseconds_since_epoch}).run(conn, function(err, DBres){
								if(err) throw err;
							});
							
							//TODO: insert python script execution here?
						} else if (result[0]["active"] == "false"){
							console.log("ignored because the token isn't active");
						}
						else {
							console.log("Tokens don't match");
						}
					});
				});
			});
		} else {
			console.log("The table does not exist.");
			res.end("The table does not exist.");
		}
	});
});

//This is a pre-fabricated post for creating nodes/tokens
//It expects a json with a 'content' (with all the information fields for a token: 'date', 'nodedname', 'token' and 'active')
app.post('/post_token_creator', function(req, res){
	console.log("*post token creator*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('acknowledgement');
	
	console.log("Created token: ");
	console.log(req.body.content);

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table("tokens").insert(req.body.content).run(conn, function(err, DBres){
			if(err) throw err;
			console.log(req.body.content);
			console.log(req.body.content.nodename);
			
			//Check if table exists, so it doesn't crash if the program tries to create a table that already exists
			request({
				uri: "http://145.24.222.23:8181/get_tablelist",
				method: "GET"
			}, function(error, response, body)
			{
				if(body.indexOf(req.body.content.nodename) <= 0){
					r.db("ICTlab").tableCreate(req.body.content.nodename).run(conn, function(err, DBres)
					{
						if(err) throw err;
						console.log("Created new node table: " + req.body.content.nodename);
					});
				}
				else {
					console.log("The table '" + req.body.content.nodename + "' already exists.");
					res.end("The table '" + req.body.content.nodename + "' already exists.");
				}
			});
		});
	});
});

//An update function that toggles the 'active' field of a node between true and false
//It expects a json with a 'content' content field with an identifier to an entry in the token table (which will be the token variable)
//It expects the 'content' field to contain 'fieldToUpdate' (with an identifier of the table entry (or entries) you want to update) and toggles the node active status
app.post('/toggle_node', function (req, res) {
	console.log("toggle_node");
	
	var active_boolean = "";
	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table("tokens").filter(function(doc){return doc('token').match(req.body.content.fieldToUpdate.token)}).run(conn, function(err, cursor){
			if (err) throw err;
				cursor.toArray(function(err, result) {
					if (err) throw err;
			
					if (result[0].active == "true") {
						active_boolean = "false";
					} else {
						active_boolean = "true";
					}
					r.db(DBName).table("tokens").filter(req.body.content.fieldToUpdate).update({active: active_boolean}).run(conn, function(err, DBres){
						if(err) throw err;
					});
				});
		});
	});
});

//Get a list of all the tables in the database
app.get('/get_tablelist',function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db('ICTlab').tableList().run(conn, function(err, cursor){
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				var resultJson = JSON.stringify(result, null, 2);
				console.log("*Get tablelist*:");
				res.end(resultJson);
			});
		});
	});
});

//Get a list of all tokens
app.get('/get_tokens',function(req, res){
	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table('tokens').orderBy("nodename").run(conn, function(err, cursor){
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				console.log("*Get tokens*:");
				res.send(result);
			});
		});
	});
});

//Get data from a table (based on what date you passed in YYYYMMDD format, '2016'' for all data in 2016, '201601' for January 2016, '20160101' for the first of January 2016)
//Pass table and time_period variables with /get_data?table=*VARIABELE*&time_period=*VARIABELE*
app.get('/get_data',function(req, res){
	var table = req.query.table;
	var time_period = req.query.time_period;
	if(table && time_period){	
		request({
			uri: "http://145.24.222.23:8181/get_tablelist",
			method: "GET"
		}, function(error, response, body)
		{
			if(body.indexOf(req.query.table) > 0)
			{
				r.connect({ host: DBHost, port: DBPort }, function(err, conn){
					if(err) throw err;
					r.db(DBName).table(table).filter(function(doc){return doc('date').match(time_period)}).run(conn, function(err, cursor){
					if (err) throw err;
						cursor.toArray(function(err, result) {
							if (err) throw err;
					
							console.log("*Get data from database*:");
							res.json(result);
						});
					});
				});
			} else {
				console.log("table doesn't exist");
			}
		});
	}
	else
	{
		res.end("error: pass variables")
	}
});

app.listen(8181);
console.log("Running at Port 8181");