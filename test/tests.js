

var config = {
    providerID: "google",
    client_id: "541950296471.apps.googleusercontent.com",
    redirect_uri: "http://bridge.uninett.no/jso/index.html",
    authorization: "https://accounts.google.com/o/oauth2/auth",
    scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]},
    debug:true
};


var RedirectCatcher = function() {
	var that = this;
	this.callback = null;
	this.url = null;
	setTimeout(function() {
		if (that.url === null) {
			if (typeof that.callback === 'function') {
				that.callback(null);	
			}
		}
	}, 2000);
};
RedirectCatcher.prototype.onRedirect = function(callback) {
	this.callback = callback;
};
RedirectCatcher.prototype.redirect = function(url) {
	console.log("RedirectCatcherreceived redirect to ", url);
	this.url = url;
	if (typeof this.callback === 'function') {
		this.callback(this.url);
	} else {
		console.error("Callback was not defined");	
	}
};


QUnit.test( "JSO Loaded", function( assert ) {
	console.log("JSO", JSO);
	assert.ok(typeof JSO === 'function', "JSO successfully loaded.");
	assert.ok( 1 == "1", "Passed!" );

});
QUnit.test( "JSO Authorization redirect", function( assert ) {
	var done = assert.async();
	var r = new RedirectCatcher();
	r.onRedirect(function(url) {
		assert.ok(url !== null, 'Redirect was performed');
		console.log("Redirect to ", url);
		done();
	});

	var jso = new JSO(config);
	jso.on('redirect', function(url) {
		r.redirect(url);
	});

	jso.getToken(function(token) {

		console.log("I got the token: ", token);

	}, {});


});