## Introduction
#### A simple web app to make local http server live on the internet without installing any tool on the client side

## Features:
1. #### Make any HTTP request and get response as one would make in local server
2. #### Very simple to use. Just client needs to open the web page and type his running http port.

## Limitations:
1. #### HTTP only, without TCP support
2. #### No stream support
3. #### Only text data is supported

## How to use ( for now ):
1. #### Open terminal in the project directory and type:
```bash
npm i && npm start
```
2. #### Open http://localhost:5000 in browser
3. #### Set a username and HTTP port number (ex. 3000) of the project you want to tunnel
4. #### On the screen, there is a logger. If everything is okay, it will give an address (ex. http://localhost:5000/sony/), where the localhost server is being tunnelled
5. #### Now any request you make at the given address (ex. GET http://localhost:5000/sony/updates) will be tunnelled to the localhost address (ex. GET http://localhost:3000/sony/updates)


## How to use ( goal in future ):
1. #### Open terminal in the project directory and type:
```bash
npm i && npm start
```
2. #### Open http://localhost-tunnel.com/ in browser
3. #### Set a username and HTTP port number (ex. 3000) of the project you want to tunnel
4. #### On the screen, there is a logger. If everything is okay, it will give an address (ex. http://localhost-tunnel.com/sony/), where the localhost server is being tunnelled
5. #### Now any request you make at the given address (ex. GET http://localhost-tunnel.com/sony/updates) will be tunnelled to the localhost address (ex. GET http://localhost:3000/sony/updates)