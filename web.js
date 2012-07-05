var env = process.env,
    port = env.PORT || 80,
    ip = env.PORT ? '0.0.0.0' : '127.0.0.1',
    http = require('http'),
    https = require('https'),
    gzip = require('zlib');
    /*Twitter = require('ntwitter');

var twitter = new Twitter({
    consumer_key: env.TWITTER_CONSUMER_KEY,
    consumer_secret: env.TWITTER_CONSUMER_SECRET,
    access_token_key: env.TWITTER_TOKEN_KEY,
    access_token_secret: env.TWITTER_TOKEN_SECRET
});*/

function lastUTCMinusMinutes(mins) {
    var now = new Date();
    now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    now.setMinutes(now.getMinutes() - mins);
    return now.getTime();
}

function getSOUrl() {
    var time = lastUTCMinusMinutes(+env.MINUTES),
        url = '/2.0/questions?fromdate=';
        url += Math.floor(time / 1000);
        url += '&order=desc&sort=creation&tagged=yui&site=stackoverflow';
        url += '&key=' + env.SO_KEY;
    return url;
}

http.createServer(function (req, res) {
    var url;
    if (req.url == '/favicon.ico') {
		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end();
    } else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		url = getSOUrl();

		console.log('getting url: ' + url);
		https.get({
            host: 'api.stackexchange.com',
            path: url
        }, function (so) {
			var result = '';
			so.pipe(gzip.createGunzip()).on('data', function (chunk) {
				result += chunk;
			}).on('end', function () {
				res.end(result + '\n');
			});
		}).on('error', function (err) {
			res.end('An error ocurred: ' + err.message);
		});
    }
}).listen(port, ip);
console.log('Server running at http://' + ip + ':' + port + '/');