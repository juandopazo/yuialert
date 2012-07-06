var env = process.env,
    https = require('https'),
    gzip = require('zlib'),
    MINUTES = 10,
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
    var time = lastUTCMinusMinutes(MINUTES),
        url = '/2.0/questions?fromdate=';
        url += Math.floor(time / 1000);
        url += '&order=desc&sort=creation&tagged=yui&site=stackoverflow';
        url += '&key=' + env.SO_KEY;
    return url;
}

function sendToTwitter(questions) {
    questions.forEach(function (question) {
        var title = question.title;
        if (title.length > 110) {
            title = title.substr(0, 107) + '...';
        }
        twitter.updateStatus(title + ' http://stackoverflow.com/questions/' + question.question_id + ' #yui', function (err) {
            if (err) {
                console.error(err);
            }
        });
    });
}

console.log('Checking Stack Overflow...');
var apiPath = getSOUrl();
console.log('Reading SO API: http://api.stackexchange.com' + apiPath);
https.get({
    host: 'api.stackexchange.com',
    path: apiPath
}, function (so) {
	var result = '';
	so.pipe(gzip.createGunzip()).on('data', function (chunk) {
		result += chunk;
	}).on('end', function () {
		result = JSON.parse(result);
        if (result.error_id) {
            console.error(result);
        } else {
            sendToTwitter(result.items);
        }
	});
}).on('error', function (err) {
    console.error(err);
});