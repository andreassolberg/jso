# Using JSO with Phonegap and ChildBrowser


Here is a detailed instruction on setting up JSO with Phonegap for iOS and configure OAuth 2.0 with Google. You may use it with Facebook or other OAuth providers as well.


## Preparations


Install Cordova CLI:

	sudo npm install -g cordova


## Setup an App

To create a new App

	cordova create jsodemo no.uninett.jso-demo JSOdemo
	cd jsodemo/
	cordova platform add ios


## Two options

There is two options of how to make the hybrid app work with a web-based OAuth 2.0 provider.

* Using inappbrowser to load the login and authorization window as a web view within your app.
* Opening the login and authorization endpoint in the system browser, and catching the response by letting the OAuth provider redirecting to a custom URL scheme, such as `jsodemo://`.



## Using JSO with inappbrowser


Install the inappbrowser using the cordova CLI:

	cordova plugin add org.apache.cordova.inappbrowser


Load JSO as normal, and jQuery if needed.

	// Hand over jQuery to JSO, to allow usage of the ajax()-wrapper.
	JSO.enablejQuery($);

	var jso = new JSO({
		providerId: "feideconnect",
		client_id: "42934c73-6fae-4507-92a4-c67f87923aa9",
		redirect_uri: "https://static.uwap.uninettlabs.no/oauth-oob.html",
		authorization: "https://auth.uwap.uninettlabs.no/oauth/authorization"
	});

The `redirect_uri` endpoint is the URL that the user will be redirected back to with the access token after successfully login, and authorization. In the case with *inappbrowser*, this page typically can be an local or online page that is nearly empty. 

JSO will be configured to automatically monitor the URLs that changes within the inappbrowser, and automatically consume an access token and close the window, when appropriate.

The rest of the code will be after the onDeviceReady event:

```javascript
	var onReady = function() {

		// When JSO want to redirect, we'll make use of phonegap inappbrowser plugin.
		jso.on('redirect', jso.inappbrowser({"target": "_blank"}) );

		jso.ajax({
			url: "https://api.uwap.uninettlabs.no/userinfo",
			oauth: {
				scopes: {
					request: ["userinfo", "longterm"],
					require: ["userinfo"]
				}
			},
			dataType: 'json',
			success: function(data) {
				console.log("Response (data):", data);
				$("#out").empty().append( JSON.stringify(data, undefined, 3) );
			}
		});

	};
	document.addEventListener('deviceready', onReady, false);
```

The `jso.on('redirect')` allows us to set the redirect handler to open inappbrowser instead of redirecting the app it self, when JSO wants to send the user to the authorization endpoint.




## Using JSO with custom URL scheme


Cordova SHOULD be able to support custom url schems out of the box. However I did not make that to work.

Instead, I used the third party *LaunchMyApp* plugin, which works as expected. I registered the `jsodemo` scheme with the following command:

	cordova plugin add https://github.com/EddyVerbruggen/LaunchMyApp-PhoneGap-Plugin.git --variable URL_SCHEME=jsodemo



We load the library as usual, and configure JSO:

	JSO.enablejQuery($);

	var jso = new JSO({
		providerId: "feideconnect",
		client_id: "42934c73-6fae-4507-92a4-c67f87923aa9",
		redirect_uri: "jsodemo://",
		authorization: "https://auth.uwap.uninettlabs.no/oauth/authorization"
	});

Notice the `redirect_uri` to be configured as `jsodemo://`, matching the custom URL scheme.

First we need to define an `handleOpenURL` handler very early and with a global function name. I did it like this:

```html
	<script type="text/javascript">
	function handleOpenURL(url) {
	    window._handleOpenURL = url;
	}
	</script>
```

I stored the URL in a global property, because we cannot do anything with it before all the libraries are loaded properly.

Now, after the library is loaded, after the onDeviceReady, we use the inappbrowser plugin to handle redirects to system browser as well, altough there are probably other options of how to do that.

Notice in particular that we add a eventlistener with `resume` that is called after the user is sent to the app using the custom url scheme. In this event handler we checks the opened URL for access tokens using the `jso.callback()` function.

```javascript
	var onReady = function() {

		// When JSO want to redirect, we'll make use of phonegap inappbrowser plugin.
		jso.on('redirect', jso.inappbrowser({"target": "_system"}) );

		window.document.addEventListener("resume", function(e) {
			jso.callback(window._handleOpenURL);
		}, false);

		jso.ajax({
			url: "https://api.uwap.uninettlabs.no/userinfo",
			oauth: {
				scopes: {
					request: ["userinfo", "longterm"],
					require: ["userinfo"]
				}
			},
			dataType: 'json',
			success: function(data) {
				console.log("Response (data):", data);
				$("#out").empty().append( JSON.stringify(data, undefined, 3) );
			}
		});

	};
	document.addEventListener('deviceready', onReady, false);
```






