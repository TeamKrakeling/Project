var express 	= require("express");
var app     	= express();
var r 			= require("rethinkdb");
var request 	= require("request");
var bodyParser 	= require('body-parser');

app.use(bodyParser.json()); 							//support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); 	//support encoded bodies

//This will find and locate index.html from View or Scripts
app.get('/',function(req,res){
  res.sendFile(__dirname+'/View/index.html');
});

//This will find and locate about.html from View or Scripts
app.get('/about',function(req,res){
  res.sendFile(__dirname+'/view/about.html');
});

app.get('/token',function(req,res){
  res.sendFile(__dirname+'/view/TokenThingy.html');
});

//Handles all regular post calls to our api
//It expects a json with the following fields: 'table' (with the name of the table you want to insert data into), 'token' (with the token of that table) and 'content' (with the content you want to insert)
app.post('/post', function(req, res){
	console.log("*post*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('acknowledgement');
    
	//if(req.body.token === /*token for the table the user wants to edit, retrieved from the tokens table*/)		//<< token check start?
	request({
		uri: "http://145.24.222.95:8181/get_tablelist",
		method: "GET"
	}, function(error, response, body)
	{
		if(body.indexOf(req.body.table) > 0)
		{
			//Check the database for the token
			r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
				if(err) throw err;
				r.table('tokens').filter({'nodename': req.body.table}).run(conn, function(err, cursor)
				{
					if (err) throw err;
					cursor.toArray(function(err, result) {
						if (err) throw err;
						
						var resultJson = JSON.stringify(result, null, 2);
						console.log("*Get token*:");
						console.log(resultJson);
						
						console.log(result[0]["token"]);
						console.log(req.body.token);
						
						if(result[0]["token"] === req.body.token){
							console.log("Tokens match");
							//r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
								if(err) throw err;
								r.table(req.body.table).insert(req.body.content).run(conn, function(err, DBres)
								{
									if(err) throw err;
									console.log("Posted token");
								});
							//});
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

//This is a pre-fabricated post for creating tokens
app.post('/post_token_creator', function(req, res){
	console.log("*post token creator*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('acknowledgement');
	
	console.log("Created token: ");
	console.log(req.body.content);

	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table("tokens").insert(req.body.content).run(conn, function(err, DBres)
		{
			if(err) throw err;
			//console.log(DBres);
		});
	});
});

//Handles all delete calls to the api
//It expects a json with the following fields: 'table' (with the name of the table you want to delete data from) and 'content' (with the id of the table entry you want to delete)
app.post('/delete', function (req, res) {		//TODO: Add a confirmation before deleting?
	console.log("*delete*: ");
    console.log(req.body);

	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table(req.body.table).filter(req.body.content).delete().run(conn, function(err, DBres)
		{
			if(err) throw err;
			console.log(DBres);
		});
	});
});

//Handles all update calls to the api
//It expects a json with the following fields: 'table' (with the name of the table you want to update data in) and 'content' with some specified variables
//It expects the 'content' field to contain the following fields: 'fieldToUpdate' (with the name of the table field you want to update) and 'update' (with what you want to change the field to)
app.post('/update', function (req, res) {
	console.log("*update*: ");
    console.log(req.body);
	console.log(req.body.content.fieldToUpdate);
	console.log(req.body.content.update);

	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table('tokens').filter(req.body.content.fieldToUpdate).update(req.body.content.update).run(conn, function(err, DBres)
		{
			if(err) throw err;
			console.log(DBres);
		});
	});
});

//Get for testing purposes
app.get('/test_get',function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});

	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table('test').run(conn, function(err, cursor)
		{
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				var resultJson = JSON.stringify(result, null, 2);
				console.log("*Test get*:");
				console.log(resultJson);
				res.end(resultJson);
			});
		});
	});
});


//Get list of all the tables in the database
app.get('/get_tablelist',function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.db('test').tableList().run(conn, function(err, cursor)
		{
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				var resultJson = JSON.stringify(result, null, 2);
				console.log("*Get tablelist*:");
				console.log(resultJson);
				res.end(resultJson);
			});
		});
	});
});

//Get list of all tokens
app.get('/get_tokens',function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table('tokens').run(conn, function(err, cursor)
		{
			if (err) throw err;
			cursor.toArray(function(err, result) {
				if (err) throw err;
				
				var resultJson = JSON.stringify(result, null, 2);
				console.log("*Get tokens*:");
				console.log(resultJson);
				console.log("One: ");
				console.log(resultJson[1]);
				res.end(resultJson);
			});
		});
	});
});


app.listen(8181);
console.log("Running at Port 8181");