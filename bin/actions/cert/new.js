const openssl=require(__path+'lib/openssl.lib.js');
var init=function($){
	let options={};
	if($.DATA['domain'])options.domain=$.DATA['domain'];
	if($.DATA['organization'])options.organization=$.DATA['organization'];
	if($.DATA['locality'])options.locality=$.DATA['locality'];
	if($.DATA['countryCode'])options.countryCode=$.DATA['countryCode'];
	if($.DATA['altnames'])options.altnames=$.DATA['altnames'];
	let result=openssl.createNewCert(options);
	$.return({success:true,result:result});
}
module.exports=init;