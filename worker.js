var env = process.env,
    https = require('https'),
    gzip = require('zlib'),
    Twitter = require('ntwitter'),
    
// scheduler interval in minutes
SCHEDULE_INTERVAL = 10,
    
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

function lastRunTimeInSeconds() {
    var now = new Date(new Date().toUTCString());
    now.setMinutes(now.getMinutes() - SCHEDULE_INTERVAL);
    return Math.floor(now.getTime() / 1000);
}

function sendToTwitter(questions) {
    console.log('Publishing ' + questions.length + ' questions...');
    questions.forEach(function (question) {
        var title = question.title;
        // Twitter shortens URLs up to 20 characters
        // ' #yui' is 5 characters long
        // So we take 30 characters of title just in case
        if (title.length > 110) {
            title = title.substr(0, 107) + '...';
        }
        console.log('Question: ' + title);
        twitter.updateStatus(title + ' http://stackoverflow.com/questions/' + question.question_id + ' #yui', function (err) {
            if (err) {
                reportError(err);
            }
        });
    });
}

var apiPath = '/2.0/questions?fromdate=' + lastRunTimeInSeconds() + '&order=desc&sort=creation&tagged=yui&site=stackoverflow&key=' + env.SO_KEY;
console.log('Checking Stack Overflow: http://api.stackexchange.com' + apiPath);
https.get({ host: 'api.stackexchange.com', path: apiPath }, function (res) {
    var result = '';
    res
        .pipe(gzip.createGunzip())
        .on('data', function (chunk) {
            result += chunk;
        })
        .on('end', function () {
            try {
                result = JSON.parse(result);
                if (result.error_id) {
                    reportError(result);
                } else {
                    sendToTwitter(result.items);
                }
            } catch (e) {
                reportError(e);
            }
        });
}).on('error', reportError);