JS Bootstrap Analyzer for RuneScape's HTML5 Client
##################################################

## Usage

`git clone URLOFREPO`

`npm install`

`node JSAnalyser.js`

It will download the current bootstrap source and then run the analyzers over it.

If you do not want to redownload the JS file from the RuneScape site each time, just change `forceRedownload` to `false` in `JSAnalyser.js`. It is simply a convenience method since I'm too lazy to parse command line args.
