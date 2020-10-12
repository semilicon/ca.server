const openssl=require(__path+'lib/openssl.lib.js');
var init=function($){
	let options={};
	if($.DATA['domain'])options.domain=$.DATA['domain'];
	if($.DATA['organization'])options.organization=$.DATA['organization'];
	if($.DATA['locality'])options.locality=$.DATA['locality'];
	if($.DATA['state'])options.state=$.DATA['state'];
	if($.DATA['countryCode'])options.countryCode=$.DATA['countryCode'];
	let result=openssl.createNewCert(options);
	$.return({success:true,result:result});
}
module.exports=init;