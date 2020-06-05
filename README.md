## Introduction
#### A simple web app to make local http server live on the internet without installing any tool on the client side

## Features:
1. Make any HTTP request and get response as one would make in local server
2. No hastle of installing third party tool
3. Very simple to use. Open the web page and type your running server's HTTP port
4. On screen real time log viewer
5. All devices are supported including smart phones as long as it has a web browser

## Screenshots:

![SS1](./screenshots/omran-desktop-heroku.png?raw=true "Desktop Version Hosted on Heroku")

![SS2](./screenshots/screenshot-chrome-local.png?raw=true "Desktop Version MD Hosted on Localhost")

## Limitations:
1. HTTP only, without TCP support
2. No stream support
3. Only text data is supported

## How to use Locally ( for now ):
1. Open terminal in the project directory and type:
```bash
npm i && npm start
```
2. Open http://localhost:5000 in browser
3. Set a username and HTTP port number (ex. 3000) of the project you want to tunnel
4. On the screen, there is a logger. If everything is okay, it will give an address (ex. http://localhost:5000/sony/), where the localhost server is being tunnelled
5. Now any request you make at the given address (ex. GET http://localhost:5000/sony/updates) will be tunnelled to the localhost address (ex. GET http://localhost:3000/sony/updates)


## How to use globally ( goal in future ):
1. Open http://localhost-tunnel.com/ in browser
2. Set a username and HTTP port number (ex. 3000) of the project you want to tunnel
3. On the screen, there is a logger. If everything is okay, it will give an address (ex. http://sony.localhost-tunnel.com/), where the localhost server is being tunnelled
4. Now any request you make at the given address (ex. GET http://sony.localhost-tunnel.com/updates) will be tunnelled to the localhost address (ex. GET http://localhost:3000/updates)

### A demo has been hosted at http://localhost-tunnel.herokuapp.com/

### All credit goes to: [Omran Jamal](https://github.com/omranjamal)