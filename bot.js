var env = process.env,
    https = require('https'),
    gzip = require('zlib'),
    ent = require('ent'),
    Twitter = require('ntwitter'),
    
twitter = new Twitter({
    consumer_key: env.TWITTER_CONSUMER_KEY,
    consumer_secret: env.TWITTER_CONSUMER_SECRET,
    access_token_key: env.TWITTER_TOKEN_KEY,
    access_token_secret: env.TWITTER_TOKEN_SECRET
});

function defErrorHandler(err) {
    if (err) {
        console.error(err);
    }
}

function sendToTwitter(question) {
    var tweet = ent.decode(question.title);
    // Twitter shortens URLs up to 20 characters
    // So we take 25 characters of title just in case
    if (tweet.length > 115) {
        tweet = tweet.substr(0, 112) + '...';
    }
    console.log('Question: ' + tweet);
    tweet += ' http://stackoverflow.com/questions/' + question.question_id;
    twitter.updateStatus(tweet, defErrorHandler);
}

exports.check = function (mins) {
    var lastRunTimeInSeconds = Math.floor(new Date(new Date().toUTCString()).getTime() / 1000) - 60 * mins,
        apiPath = '/2.0/questions?fromdate=' + lastRunTimeInSeconds +
                  '&order=desc&sort=creation&tagged=yui&site=stackoverflow&key=' +
                  env.SO_KEY;
    console.log('Checking Stack Overflow: http://api.stackexchange.com' + apiPath);
    https.get({ host: 'api.stackexchange.com', path: apiPath }, function (res) {
        var result = '';
        res
            .pipe(gzip.createGunzip())
            .on('data', function (chunk) {
                result += chunk;
            })
            .on('end', function () {
                result = JSON.parse(result);
                if (result.error_id) {
                    defErrorHandler(result);
                } else {
                    console.log('Publishing ' + result.items.length + ' questions...');
                    result.items.forEach(sendToTwitter);
                }
            });
    }).on('error', defErrorHandler);
};
