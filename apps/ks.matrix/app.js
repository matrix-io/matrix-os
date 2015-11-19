console.log('log');
console.error('error');
//
// var cheerio = require('cheerio');
//
// justDoIt();
//
// setInterval(function() {
//
//   justDoIt();
// }, 15 * 1000 * 60);
//
// function justDoIt(){
//   var ksPage = require('child_process').execSync('curl -s https://www.kickstarter.com/projects/2061039712/matrix-the-internet-of-things-for-everyonetm')
//   var phPage = require('child_process').execSync('curl -s https://www.producthunt.com/tech/matrix');
//
//   var $ = cheerio.load(ksPage);
//
//   var pledged = $('#pledged').text();
//   var backers = $('#backers_count').text();
//
//   $ = cheerio.load(phPage);
//
//   var hunters = $('.post-vote-button--count').text();
//
//   console.log(pledged.trim(), backers.trim(), hunters.trim());
//   require('child_process').execSync('say "Matrix has raised ' + pledged.replace(/\D/g, '') + ' dollars from ' + backers + ' supporters"');
//   require('child_process').execSync('say "and ' + hunters + ' votes on Product Hunt!"');
//
//   matrix.send({ type: 'metrics', data: { pledged: pledged, backers: backers, hunters: hunters }});
// }
