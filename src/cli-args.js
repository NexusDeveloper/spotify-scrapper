require('dotenv').config({});

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

module.exports = yargs((hideBin(process.argv)))
    .usage('Usage: $0 <request> [options]')
    .example('$0 "techn9ne" -L="login" -P="password"', '')
    .command('request', 'The request to get recommendations')
    .env('SPOTIFY')
    .option('login', {
        alias: 'L',
        type: 'string',
        description: 'Login of Spotify account',
        default: process.env.SPOTIFY_LOGIN,
    })
    .option('password', {
        alias: 'P',
        type: 'string',
        description: 'Password of Spotify account',
        default: process.env.SPOTIFY_PASSWORD,
    })
    .option('only-simplified-tracks', {
        type: "boolean",
        default: false,
        alias: 'S',
    })
    .demandCommand(1, 'Missing the request param')
    .help('h')
    .alias('h', 'help')
    .parse();
