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

//Links various urls to their respective html pages
app.get('/',function(req,res){
  res.sendFile(__dirname+'/View/index.html');
});

app.get('/token',function(req,res){
  res.sendFile(__dirname+'/view/tokenpage.html');
});

app.get('/unit_test',function(req,res){
  res.sendFile(__dirname+'/view/UnitTest.html');
});

app.get('/visualisation_0896024',function(req,res){
  res.sendFile(__dirname+'/view/visualisation/0896024/visualisation_0896024.html');
});


//Handles all regular post calls to our api
//It expects a json with the following fields: 'table' (with the name of the table you want to insert data into), 'token' (with the token of that table) and 'content' (with the content you want to insert)
app.post('/post', function(req, res){
	console.log("*post*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('acknowledgement');
    
	//Check if the table exists
	request({
		uri: "http://145.24.222.95:8181/get_tablelist",
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
						
						if(result[0]["token"] === req.body.token){
							console.log("Tokens match");
								if(err) throw err;
								r.db(DBName).table(req.body.table).insert(req.body.content).run(conn, function(err, DBres)
								{
									if(err) throw err;
									console.log("Posted data");
								});											//TODO: Create table for created node?
						} else {
							console.log("Tokens don't match");
						}
					});
				});
			});
		} else {
			console.log("The table '" + req.body.table + "' does not exist.");
			res.end("The table '" + req.body.table + "' does not exist.");
		}
	});
});

//This is a pre-fabricated post for creating nodes/tokens
//It expects a json with a 'content' (with all the information fields for a token :'date', 'nodedname', 'token' and 'active')
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
			//console.log(DBres);
			console.log(req.body.content);
			console.log(req.body.content.nodename);
			
			//Check if table exists, so it doesn't crash if the program tries to create a table that already exists
			request({
				uri: "http://145.24.222.95:8181/get_tablelist",
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

//Handles the update calls to the token table.
//It expects a json with a 'content' content field with some specified variables
//It expects the 'content' field to contain 'fieldToUpdate' (with an identifier of the table entry (or entries) you want to update) and 'update' (with the field you want to update, and what you want to change it to)
app.post('/update_node', function (req, res) {
	console.log("*update_node*: ");
    console.log(req.body);

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table("tokens").filter(req.body.content.fieldToUpdate).update(req.body.content.update).run(conn, function(err, DBres){
			if(err) throw err;
			console.log(DBres);
		});
	});
});

//Handles all delete calls to the api
//It expects a json with the following fields: 'table' (with the name of the table you want to delete data from) and 'content' (with the id of the table entry you want to delete)
app.post('/delete', function (req, res){		//TODO: Add a confirmation before deleting? Or some kind of protection?
	console.log("*delete*: ");
    console.log(req.body);

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table(req.body.table).filter(req.body.content).delete().run(conn, function(err, DBres){
			if(err) throw err;
			console.log(DBres);
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
				//console.log(resultJson);
				res.end(resultJson);
			});
		});
	});
});

//Get a list of all tokens
app.get('/get_tokens',function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.db(DBName).table('tokens').run(conn, function(err, cursor){
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				var resultJson = JSON.stringify(result, null, 2);
				console.log("*Get tokens*:");
				//console.log(resultJson);
				res.end(resultJson);
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
	
		r.connect({ host: DBHost, port: DBPort }, function(err, conn){
			if(err) throw err;
			r.db(DBName).table(table).filter(function(doc){return doc('date').match(time_period)}).run(conn, function(err, cursor){
			if (err) throw err;
				cursor.toArray(function(err, result) {
					if (err) throw err;
				
					var resultJson = JSON.stringify(result, null, 2);
					console.log("*Get data from database*:");
					//console.log(resultJson);
					res.json(result);
				});
			});
		});
	}
	else
	{
		res.end("error pass variables")
	}
});

app.listen(8181);
console.log("Running at Port 8181");