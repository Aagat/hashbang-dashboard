var blessed = require('blessed')
	, contrib = require('blessed-contrib')
	, Server = require('ssh2').Server;

var configuration = { privateKey: require('fs').readFileSync('keys/host_rsa.key'),};

function noop(v) {}

new Server(configuration, function(client) {
	var stream,
		name;

	client.on('authentication', function(ctx) {
		return ctx.accept();
	});

	client.on('ready', function(ctx) {

		var rows,
			cols,
			term;

		client.once('session', function(accept, reject) {
			accept().once('pty', function(accept, reject, info) {
				rows = info.rows;
				cols = info.cols;
				term = info.term;
				accept && accept();
			}).once('shell', function(accept, reject){

				stream = accept();

				stream.name = name;
				stream.rows = rows || 24;
				stream.columns = cols || 80;
				stream.isTTY = true;
				stream.setRawMode = noop;
				stream.on('error', noop);

				var screen = blessed.screen({
					autoPadding: true,
					smartCSR: true,
					program: new blessed.program({
						input: stream,
						output: stream
					}),
					terminal: term || 'ansi'
				});

				// Hides things in local term I guess.
				//screen.program.attr('invisible', true);

				var grid = new contrib.grid({rows: 2, cols: 2, screen: screen});

				var result = {"ny1.hashbang.sh": {"ip": "45.58.35.111", "location": "New York City, New York, USA", "currentUsers": 521, "maxUsers": "500"}, "sf1.hashbang.sh": {"ip": "45.58.38.224", "location": "San Francisco, California, USA", "currentUsers": 100, "maxUsers": "500"}, "da1.hashbang.sh": {"ip": "104.245.35.240", "location": "Dallas, Texas, USA", "currentUsers": 83, "maxUsers": "500"}, "to1.hashbang.sh": {"ip": "104.245.37.138", "location": "Toronto, Ontario, Canada", "currentUsers": 62, "maxUsers": "500"}}
				var servers = [];
				var utilization = [];
				var locations = [
					{"lon" : "-74.0059", "lat" : "40.7127", color: 'yellow', char: 'ny' },
					{"lon" : "-122.4167", "lat" : "37.7833", color: 'yellow', char: 'sf' },
					{"lon" : "-96.7970", "lat" : "32.7767", color: 'yellow', char: 'da' },
					{"lon" : "-79.4000", "lat" : "43.7000", color: 'yellow', char: 'to' },
				];


				for (var server in result) {
					servers.push(server.split('.')[0]);
					utilization.push((result[server].currentUsers));
				}


				var bar =  grid.set(0,1,1,1, contrib.bar, { label: 'Registered Users'
					, barWidth: 4
					, barSpacing: 6
					, xOffset: 2
					, maxHeight: 9});

				screen.append(bar) //must append before setting data

				bar.setData({ titles: servers, data: utilization });

				var map = grid.set(0, 0, 1, 1, contrib.map, {label: 'Servers Location'})

				var setMapData = function() {
					for (var location in locations) {
						map.addMarker(locations[location]);
					}
				}();

				//grid.set(row, col, rowSpan, colSpan, obj, opts)
				var box = grid.set(1, 0, 1, 1, blessed.box, {label: 'Service Alerts', content: 'All services are operational'})
				var sparkline = grid.set(1, 1, 1, 1, contrib.sparkline,
										 { label: 'Throughput (bits/sec)'
					, tags: true
					, style: { fg: 'blue', titleFg: 'white' }})

				var spark1 = [1,2,5,2,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]
				var spark2 = [4,4,5,4,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]

				refreshSpark()
				setInterval(refreshSpark, 100);

				function refreshSpark() {
					spark1.shift()
					spark1.push(Math.random()*5+1)
					spark2.shift()
					spark2.push(Math.random()*5+1)
					sparkline.setData(servers, [spark1, spark2, spark1, spark2])
				}

				screen.key(['escape', 'q', 'C-c'], function(ch, key) {
					return process.exit(0);
				});

				screen.render()
				screen.program.emit('resize');
			});
		});
	});
	
	client.on('end', function(){
		// ingore
	});

	client.on('error', function(error) {
		throw error;
	});

}).listen(55555, function() {
  console.log('Listening on port ' + this.address().port);
});