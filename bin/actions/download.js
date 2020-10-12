/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');	
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	var caFile=(fs.existsSync(__root+'data/root_ca.crt'))?fs.readFileSync(__root+'data/root_ca.crt'):'';
	var caFileSize=(fs.existsSync(__root+'data/root_ca.crt'))?fs.statSync(__root+'data/root_ca.crt').size:0;
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib={
	init:function($){
		$.response.setHeader("Content-disposition","attachment; filename=root_ca.crt");
		$.response.setHeader('Content-Type', 'application/x-x509-ca-cert');
		$.response.setHeader('Content-Length', caFileSize);
		$.response.write(caFile);
		$.response.end();
	}
}
module.exports=lib;
module.exports.public=true;