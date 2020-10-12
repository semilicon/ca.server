const fs = require('fs');
const openssl=require(__path+'lib/openssl.lib.js');
var init=function($){
	if(!$.DATA['csr'])return $.return({success:false,error:400});
	let csr=$.DATA['csr'];
	let name=crypto.createHash('sha256').update(String(Date.now())).digest('hex');
	fs.writeFileSync(__root+'data/.tmp/'+name+'.csr', csr);
	try{
		openssl.signCsr(name);
	}catch(err){
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