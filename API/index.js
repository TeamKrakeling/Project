var express = require("express");
var app     = express();

app.get('/',function(req,res){
  res.sendFile(__dirname+'/View/index.html');
  //It will find and locate index.html from View or Scripts
});

app.get('/about',function(req,res){
  res.sendFile(__dirname+'/view/about.html');
  //It will find and locate about.html from View or Scripts
});

app.get('/token',function(req,res){
  res.sendFile(__dirname+'/view/TokenThingy.html');
});

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/post', function(req, res){
    //console.log("received: " + req.body.name);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('acknowledgement');
	
	r = require('rethinkdb')
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
		if(err) throw err;
		r.table('test').insert( req.body ).run(conn, function(err, DBres)		//TODO: Make it so the table the data is sent to can be chosen.
		{
			if(err) throw err;
			//console.log(DBres);
		});
	});
});

app.get('/test_get',function(req, res){
	//console.log("Start get test");
	res.writeHead(200, {'Content-Type': 'text/html'});
    //res.end('acknowledgement');
	
	r = require('rethinkdb')
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

app.post('/tokenReceiver', function (req, res) {
	console.log("*TokenReceiver*: ");
    console.log(req.body);
	r = require('rethinkdb')
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
	if(err) throw err;
		r.table('tokens').insert(req.body).run(conn, function(err, DBres)
		{
			if(err) throw err;
			//console.log(DBres);
		});
	});
});

app.post('/tokenDeleter', function (req, res) {		//TODO: Add a confirmation before deleting?
	console.log("*TokenDeleter*: ");
    console.log(req.body);
	r = require('rethinkdb')
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
	if(err) throw err;
		r.table("tokens").filter(req.body).delete().run(conn, function(err, DBres)
		{
			if(err) throw err;
			console.log(DBres);
		});
	});
});

app.post('/tokenUpdater', function (req, res) {
	console.log("*TokenUpdater*: ");
    console.log(req.body);
	console.log(req.body.tokenToUpdate);
	console.log(req.body.update);
	r = require('rethinkdb')
	r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
	if(err) throw err;
		r.table("tokens").filter(req.body.tokenToUpdate).update(req.body.update).run(conn, function(err, DBres)
		{
			if(err) throw err;
			console.log(DBres);
		});
	});
});

app.listen(8181);
console.log("Running at Port 8181");