var env = process.env,
    https = require('https'),
    gzip = require('zlib'),
    Twitter = require('ntwitter'),
    
twitter = new Twitter({
    consumer_key: env.TWITTER_CONSUMER_KEY,
    consumer_secret: env.TWITTER_CONSUMER_SECRET,
    access_token_key: env.TWITTER_TOKEN_KEY,
    access_token_secret: env.TWITTER_TOKEN_SECRET
});

function reportError(err) {
    // TODO: send DMs with alerts?
    console.error(err);
}

function sendToTwitter(questions) {
    console.log('Publishing ' + questions.length + ' questions...');
    questions.forEach(function (question) {
        var tweet = question.title;
        // Twitter shortens URLs up to 20 characters
        // ' #yui' is 5 characters long
        // So we take 30 characters of title just in case
        if (tweet.length > 110) {
            tweet = tweet.substr(0, 107) + '...';
        }
        console.log('Question: ' + tweet);
        tweet += ' http://stackoverflow.com/questions/' + question.question_id + ' #YUI';
        twitter.updateStatus(tweet, function (err) {
            if (err) {
                reportError(err);
            }
        });
    });
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
                    reportError(result);
                } else {
                    sendToTwitter(result.items);
                }
            });
    }).on('error', reportError);
};
exports.say = function (msg) {
    if (msg.length > 140) {
        console.error('Message longer than 140 characters');
    } else {
        twitter.updateStatus(msg, function (err) {
            if (err) {
                console.error(err);
            }
        });
    }
};