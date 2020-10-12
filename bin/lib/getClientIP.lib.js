/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var clientIP = {
	get:function(request){
		var clientIP=request.connection.remoteAddress;//определяем IP клиента
		if(clientIP)clientIP.replace(/^.*:/, '');
		if(clientIP=='127.0.0.1'||clientIP=='localhost'){
			clientIP=request.headers['x-forwarded-for']||clientIP;
			clientIP=request.headers['x-real-ip']||clientIP;
		}
		return clientIP;
	}
};
module.exports=clientIP;