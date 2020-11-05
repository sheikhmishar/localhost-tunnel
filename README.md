# PROJECT LOCALHOST-TUNNEL

## What's this?
### A simple web app to make local http server live on the internet without installing any tool on the client side

## Introduction
Have you ever used `ngrok` like services, where you can make your localhost web server go online? Guess what!!! It requires installing third party app in your device, which is a hasstle. Also, sometimes, it requires additional configurations. In worst case, the device or platform you're using may not even support it. But, almost every smart device today has a web browser. Here is an app for you to do something similar without the need of installing any additional app. Just open your browser, type the necesssary infos and you're done.

## Features:
1. Make any HTTP/S request and get response as one would do in local server
2. No hastle of installing third party tool
3. Very simple to use. Open the web page and type your running server's HTTP port
4. On screen real time log viewer
5. All devices are supported including smart phones as long as it has a web browser
6. Binary data supported with no content-size limit as long as your RAM permits
7. Partial stream support from server to requester
8. Full multi part form data upload support
9. Content type json, plain text, xml, markdown, urlencoded fully supported
10. Download/Upload progress in developer console
11. Authorization supported
12. Clickable link on logger
13. Real-time chunked file streaming with pause-resume support
14. Sub-domain added support for absolute path. Also, react-router support confirmed
15. Dynamic, auto-scaled, multi-node clustering support

## Screenshots:

![SS1](./views/screenshots/omran-desktop-heroku.png?raw=true "Desktop Version Hosted on Heroku")

![SS2](./views/screenshots/screenshot-chrome-local.png?raw=true "Desktop Version MD Hosted on Localhost")

## Limitations:
1. HTTP/S only, without TCP support
2. No stream support in client side
3. Max content-size is limited to your RAM size
4. CORS(Cross Origin Resource Sharing) must be enabled on the client localhost server
5. Redirect hasn't been implemented yet

## How to use (For Users):
1. Run your localhost http/s project that your want to be live. (example,`VSCode live server`)
2. Make sure that you enable CORS. If you cannot enable CORS programmatically for some reason, disable CORS from browser.(`VSCode live server` has this built-in) For chrome, you can do this using:
```bash
chrome --incognito --disable-web-security --user-data-dir="/tmp/chrome_dev_temp" --allow-file-access-from-files --disable-site-isolation-trials
```
3. Open your browser and open the link for [localhost-tunnel](http://tunnel.sheikhmishar.me)
4. Give a username(according to your wish) and PORT number(of the running project, ex. 5500) and click `start tunnel`
5. Follow the log. If everything goes ok, you will be given a link, where your site is live on the internet.

## How to use (For Developers):
1. Clone the repo, open terminal in the project directory and type:
```bash
npm i && npm build && npm start
```
2. Use a Local DNS. I suggest using `Technitium DNS` and add a local domain according to your preference. Let's assume you have a domain `tunnel.me`
3. Use `nginx` or any web server for reverse-proxy and sub-domain support. Configure it according to the next section (`nginx config`).
4. Open `http://domain_name.ext` in browser. For example, `http://tunnel.lan`
5. Set a username (ex. sony) and HTTP/S port number (ex. 3000) of the running localhost project you want to tunnel
6. On the screen, there is a logger. If everything is okay, it will give a clickable link (ex. http://sony.tunnel.lan), where the localhost server is being tunnelled
7. Now any request you make at the given address (ex. GET http://sony.tunnel.lan/updates) will be tunnelled to the localhost address (ex. GET http://localhost:3000/updates)

## `nginx` config
> websock.conf

```bash
proxy_http_version          1.1;
proxy_set_header            Upgrade                 $http_upgrade;
proxy_set_header            Connection              'upgrade';
proxy_set_header            Host                    $host;
proxy_cache_bypass          $http_upgrade;
```

> domain_name.ext

```bash
server {
	listen                      80;
	listen                      [::]:80;
	server_name                 ~^(?:www\.)?domain_name\.ext$;
	## replace domain_name and ext with your own

	location / {
		proxy_pass                  http://localhost:5000;
		include											websock.conf;
	}

	location /sock {
		proxy_pass                  http://localhost:5000/sock;
		include											websock.conf;
	}

	location ~(\.|\/)test {
		deny                        all;
	}
}

server {
	listen                      80;
	listen                      [::]:80;
	server_name                 ~^(?<subdomain>.+)\.domain_name\.ext$;
	## replace domain_name and ext with your own

	location / {
		proxy_pass                  http://localhost:5000/$subdomain$request_uri;
		include											websock.conf;
	}
}
```

### A demo has been hosted at http://tunnel.sheikhmishar.me/. If you need larger files and speed, use http://tunnel.sheikhmishar.me:8080/

### Tons of credits go to: [Omran Jamal](https://github.com/omranjamal). Whole project was his idea