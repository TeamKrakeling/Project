var express = require("express");
var app     = express();
var r 		= require('rethinkdb');

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

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 							//support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); 	//support encoded bodies

//Handles all regular post calls to our api
//It expects a json with the following fields: 'table' (with the name of the table you want to insert data into) and 'content' (with the content you want to insert)
app.post('/post', function(req, res){
    console.log("*post*: inserted: ");
	console.log(req.body.content);							//TODO: Add the token check
	console.log("into table: " + req.body.table);			//TODO: Check if table exists
	
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('acknowledgement');
	
	//if(req.body.token === /*token for the table the user wants to edit, retrieved from the tokens table*/)		//<< token check start?
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table(req.body.table).insert(req.body.content).run(conn, function(err, DBres)
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
    //res.end('acknowledgement');
	
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

app.listen(8181);
console.log("Running at Port 8181");