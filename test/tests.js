
// var jso = require ('../dist/jso.js')

// console.log("--- jso ---")
// console.log(jso.JSO)
var JSO = jso.JSO
var config = {
  providerID: "google",
  client_id: "541950296471.apps.googleusercontent.com",
  redirect_uri: "http://bridge.uninett.no/jso/index.html",
  authorization: "https://accounts.google.com/o/oauth2/auth",
  scopes: { request: ["https://www.googleapis.com/auth/userinfo.profile"]},
  debug: true
};



var rcatcher = function(callback) {

	class RedirectCatcher extends jso.BasicLoader {

		execute() {
			return new Promise((resolve, reject) => {
				console.log("RedirectCatcherreceived redirect to ", this.url)
				if (typeof callback === 'function') {
					callback(this.url)
				} else {
					console.error("Callback was not defined")
				}
				resolve()
			})
		}
	}

	return RedirectCatcher;

};

QUnit.test( "JSO Get version", function( assert ) {
	console.log("JSO", JSO);
	var info = JSO.info();
	assert.ok(typeof info.version === 'string', "JSO version available. " + info.version);
	// assert.ok( 1 == "1", "Passed!" );

});


QUnit.test( "JSO Loaded", function( assert ) {
	console.log("JSO", JSO);
	assert.ok(typeof JSO === 'function', "JSO successfully loaded.");
	assert.ok( 1 == "1", "Passed!" );

});

QUnit.test( "JSO Authorization redirect", function( assert ) {
	var done = assert.async();
	var r = rcatcher(function(url) {
		assert.ok(url !== null, 'Redirect was performed');
		console.log("Redirect to ", url);
		done();
	});

	var jso = new JSO(config);
	jso.setLoader(r);

	jso.getToken(function(token) {

		console.log("I got the token: ", token);

	}, {});


});
