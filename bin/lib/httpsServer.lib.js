/////////////////////////////////////////////////////////////////////////////////////////////////////////
const https = require('https');//http сервер
const clientIP=require(__path+"lib/getClientIP.lib.js");
const querystring = require('qs');//парсер post
const url = require("url");
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib={
	start:function(port,options,call){
		async function onRequest(request, response) {
			var body = [];
			request.on('error', function(err) {
			}).on('data', function(chunk) {
				body.push(chunk);
			}).on('end', function() {
				body = Buffer.concat(body).toString('utf-8');
				lib.requestPreparation(request, body, response, call);
			});
		}
		https.createServer(options,onRequest).listen(port);
		console.log("---\n\r---Server has started on port: "+port+"\n\r---");
	},
	requestPreparation:function(request, body, response, call){
		//if(request.method=='OPTIONS')return lib.callOptionsResponse(request, response);
		var $=lib.createRequestObject(request, body, response);
		let __url=url.parse(request.url, true)
		if(__url.search&&__url.search.length>1){
			if(__url.search.includes('&signature='))$.queryString=__url.search.slice(1,__url.search.indexOf('&signature='))
			else $.queryString=__url.search.slice(1);
			try{$.GET=querystring.parse(__url.search.slice(1));}catch(err){}
		}
		if($.method == 'POST') {
			switch($.headers['content-type'].toLowerCase()){
				case "application/json":
					try {
						$.DATA = JSON.parse(body);
					}catch (err){
						return $.return({success:false,error:501});
					}
				break;
				case "application/x-www-form-urlencoded":
					try {
						$.DATA = querystring.parse(body);
					}catch (err){
						return $.return({success:false,error:501});
					}
				break;
			}
		}
		for (var key in $.GET){
			$.DATA[key]=$.GET[key];
		}
		$.VALUES=__url.pathname.replace(/^\/+|\/+$/g,'').split('/');
		$.PATH=$.VALUES.join('/');
		for (var i in $.VALUES){
			$.VALUES[i]=decodeURIComponent($.VALUES[i]);
		}
		call($);
	},
	createRequestObject:function(request, body, response){
		return {
			account:false,
			request:request,
			response:response,
			headers:request.headers,
			method:request.method,
			queryString:'',
			body:body,
			ip:clientIP.get(request),
			GET:{},
			DATA:{},
			hostname:request.headers.host,
			datetime:Date.now(),
			PATH:'',
			ACTION:'',
			VALUES:[],
			return:function(args){
				response.statusCode = 200;
				if(typeof args=="string"){
					response.setHeader('Content-Type:', 'text/html; charset=utf-8');
					response.write(text);
				}else{
					if(args===null)args={};
					response.setHeader('Content-Type', 'application/json; charset=utf-8');
					response.write(String(JSON.stringify(args)));
				}
				response.end();
			}
		}
	},
	detectActionFromValues:function(ACTIONS,VALUES){
		let _values=[];
		let endpoint=VALUES.join('/');
		while(VALUES.length>0&&!(typeof ACTIONS[endpoint]=="function"||typeof ACTIONS[endpoint]!=="undefined"&&typeof ACTIONS[endpoint].init=="function")){
			let val=VALUES.pop();
			if(val!='')_values.unshift(val);
			endpoint=VALUES.join('/');
		}
		if(VALUES.length==0){
			VALUES.push('main');
			endpoint='main';
		}
		return {
			action:endpoint,
			values:_values
		};
	},
	/*callOptionsResponse:function(request, response){
		response.statusCode = 200;
		response.end();
	}*/
};
module.exports=lib;
