/////////////////////////////////////////////////////////////////////////////////////////////////////////
const openssl=require(__path+'lib/openssl.lib.js');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var main = {
	start:async function(callback){
		openssl.startHostSertMonitor();
		if(typeof callback=='function')callback();
	}
};
module.exports=main;