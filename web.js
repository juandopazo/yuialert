var env = process.env,
    port = env.PORT || 80,
    ip = env.PORT ? '0.0.0.0' : '127.0.0.1',
    http = require('http'),
    https = require('https'),
    gzip = require('zlib'),
    Twitter = require('ntwitter');

var twitter = new Twitter({
    consumer_key: env.TWITTER_CONSUMER_KEY,
    consumer_secret: env.TWITTER_CONSUMER_SECRET,
    access_token_key: env.TWITTER_TOKEN_KEY,
    access_token_secret: env.TWITTER_TOKEN_SECRET
});

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

    function handleError(err) {
        console.error(err);
        res.end('An error has ocurred\n');
    }
    
    function sendToTwitter(questions) {
        questions.forEach(function (question) {
            var title = question.title;
            if (title.length > 115) {
                title = title.substr(0, 112) + '...';
            }
            twitter.updateStatus(title + ' http://stackoverflow.com/questions/' + question.question_id, function (err) {
                if (err) {
                    console.error(err);
                }
            });
        });
        res.end('published ' + questions.length + ' questions\n');
    }

    if (req.url == '/favicon.ico') {
		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end();
    } else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });

		https.get({
            host: 'api.stackexchange.com',
            path: getSOUrl()
        }, function (so) {
			var result = '';
			so.pipe(gzip.createGunzip()).on('data', function (chunk) {
				result += chunk;
			}).on('end', function () {
				result = JSON.parse(result);
                if (result.error_id) {
                    handleError(result);
                } else {
                    sendToTwitter(result.items);
                }
			});
		}).on('error', handleError);
    }
}).listen(port, ip);
console.log('Server running at http://' + ip + ':' + port + '/');