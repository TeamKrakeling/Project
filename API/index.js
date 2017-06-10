var express 	= require("express");
var app     	= express();
var r 			= require("rethinkdb");
var request 	= require("request");
var bodyParser 	= require('body-parser');

var DBHost		= 'localhost';
var DBPort		= 28015;

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
				r.table('tokens').filter({'nodename': req.body.table}).run(conn, function(err, cursor){
					if (err) throw err;
					cursor.toArray(function(err, result){
						if (err) throw err;
						
						var resultJson = JSON.stringify(result, null, 2);
						console.log("*Get token*:");
						
						if(result[0]["token"] === req.body.token){
							console.log("Tokens match");
								if(err) throw err;
								r.table(req.body.table).insert(req.body.content).run(conn, function(err, DBres)
								{
									if(err) throw err;
									console.log("Posted data");
								});
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
//It expects a json with a 'content' (with all the information fields for a token :'date', 'nodedame', 'token' and 'active')
app.post('/post_token_creator', function(req, res){
	console.log("*post token creator*: ");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('acknowledgement');
	
	console.log("Created token: ");
	console.log(req.body.content);

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.table("tokens").insert(req.body.content).run(conn, function(err, DBres){
			if(err) throw err;
			//console.log(DBres);
		});
	});
});

//Handles all delete calls to the api
//It expects a json with the following fields: 'table' (with the name of the table you want to delete data from) and 'content' (with the id of the table entry you want to delete)
app.post('/delete', function (req, res){		//TODO: Add a confirmation before deleting?
	console.log("*delete*: ");
    console.log(req.body);

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.table(req.body.table).filter(req.body.content).delete().run(conn, function(err, DBres){
			if(err) throw err;
			//console.log(DBres);
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

	r.connect({ host: DBHost, port: DBPort }, function(err, conn){
		if(err) throw err;
		r.table('tokens').filter(req.body.content.fieldToUpdate).update(req.body.content.update).run(conn, function(err, DBres){
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
		r.db('test').tableList().run(conn, function(err, cursor){
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
		r.table('tokens').run(conn, function(err, cursor){
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
		res.writeHead(200, {'Content-Type': 'text/html'});
	
		r.connect({ host: DBHost, port: DBPort }, function(err, conn){
			if(err) throw err;
			r.table(table).filter(function(doc){return doc('date').match(time_period)}).run(conn, function(err, cursor){
			if (err) throw err;
				cursor.toArray(function(err, result) {
					if (err) throw err;
				
					var resultJson = JSON.stringify(result, null, 2);
					console.log("*Get data from database*:");
					//console.log(resultJson);
					res.end(resultJson);
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