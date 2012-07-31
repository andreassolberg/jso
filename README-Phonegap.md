# Using JSO with Phonegap and ChildBrowser

Using JSO to perform OAuth 2.0 authorization in WebApps running on mobile devices in hybrid environment is an important deployment scenario for JSO.

Here is a detailed instruction on setting up JSO with Phonegap for iOS and configure OAuth 2.0 with Google. You may use it with Facebook or other OAuth providers as well.


# Preparations

* Install XCode from App Store, and iOS development kit
* Install [Phonegap 2.0, Cordova 2.0](http://phonegap.com/download)


# Setup App

To create a new App

	./create  /Users/andreas/Sites/cordovatest no.erlang.test "CordovaJSOTest"

# Install ChildBrowser

The original ChildBrowser plugin is available here.

* <https://github.com/purplecabbage/phonegap-plugins/tree/master/iPhone/ChildBrowser>

However, it is *not* compatible with Cordova 2.0. Instead, you may use this fork of ChildBrowser which should be working with Cordova 2.0:

* <https://github.com/Shereef/ChildBrowserOnCordova200>

What you need to do is to copy these files:

* <https://github.com/Shereef/ChildBrowserOnCordova200/tree/master/ChildBrowserOnCordova200/Plugins>

in to your WebApp project area, by using drag and drop into the Plugins folder in XCode.

Now you need to edit the file found in ``Resources/Cordova.plist`` found in your WebApp project area.

In this file you need to add one array entry with '*' into ExternalHosts, and two entries into Plugins:

* ChildBrowser -> ChildBrowser.js
* ChildBrowserCommand -> ChildBrowserCommand

as seen on the screenshot.


![](http://clippings.erlang.no/ZZ6D3C032F.jpg)


# Setting up your WebApp with ChildBrowser


I'd suggest to test and verify that you get ChildBrowser working before moving on to the OAuth stuff.

In your ``index.html`` file try this, and verify using the Simulator.

```html
<script type="text/javascript" charset="utf-8" src="cordova-2.0.0.js"></script>
<script type="text/javascript" charset="utf-8" src="ChildBrowser.js"></script>
<script type="text/javascript">

	var deviceready = function() {
		if(window.plugins.childBrowser == null) {
			ChildBrowser.install();
		}
		window.plugins.childBrowser.showWebPage("http://google.com");
	};

	document.addEventListener('deviceready', this.deviceready, false);

</script>
```

# Setting up JSO

Download the latest version of JSO:

* <https://github.com/andreassolberg/jso>

The documentation on JSO is available there as well.












