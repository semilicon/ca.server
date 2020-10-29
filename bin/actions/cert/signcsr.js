const fs = require('fs');
const openssl=require(__path+'lib/openssl.lib.js');
var init=function($){
	if(!$.DATA['csr'])return $.return({success:false,error:400});
	let csr=$.DATA['csr'];
	let altnames=$.DATA['altnames']||[];
	let name=openssl.genTmpNeme();
	fs.writeFileSync(__root+'data/.tmp/'+name+'.csr', csr);
	if(altnames.length>0)openssl.altnamesCnf(name,altnames);
	try{
		openssl.signCsr(name,(altnames.length>0)?true:false);
	}catch(err){
		console.log(err);
		return $.return({success:false,error:422});
	}
	let result={
		cert: fs.readFileSync(__root+'data/.tmp/'+name+'.crt','utf8'),
		ca: fs.readFileSync(__root+'data/root_ca.crt','utf8')
	}
	fs.unlinkSync(__root+'data/.tmp/'+name+'.crt');
	$.return({success:true,result:result});
}
module.exports=init;