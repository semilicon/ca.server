/////////////////////////////////////////////////////////////////////////////////////////////////////////
	fs = require('fs');
	include = require(__path+"lib/actions.lib.js");//скрипт загрузки модулей или шаблонов из указанной папки
	unlink = function(path){delete require.cache[require.resolve(path)];}//отчистка загруженного компонента
	var publicServer = require(__path+"lib/httpServer.lib.js");//код запуска сервера
	var buildTopMenu = require(__path+"lib/ui.buildTopMenu.lib.js");//код запуска сервера
	var leftMenuItems=require(__path+'/system/menus/left.json');
	const crypto = require('crypto');// шифрование, md5, sha256
	const url = require("url");// URL parser
	const cookie = require('cookie');
	const redisLib = require('redis');
	const querystring = require('qs');//парсер post
	__mustache = require('mustache');
	dateUtil=require(__path+"lib/dateUtil.lib.js");
	//загружаем методы
	ACTIONS=null;
	REDIS={};
	pgToolsLib=require(__path+"lib/pgTools.lib.js");
	DB={};
	for(let key in config.postgres){
		DB[key.toUpperCase()]=pgToolsLib.newPostgresPool(key);
	}
	//загружаем шаблоны
	const templates=require(__path+"lib/templates.lib.js");
	TPL=templates.load(__path+'frontend/templates');
	const titleByHttpStatusCode=require(__path+"lib/titleByHttpStatusCode.lib.js");
	const restApiLib=require(__path+"lib/restApi.lib.js");
	//API={};
	//API.vrk=new restApiLib({host:config.api.vrk.host,port:config.api.vrk.port,publicKey:config.api.vrk.publicKey,secretKey:config.api.vrk.secretKey});
	//VRKAPI=new restApiLib({host:config.api.vrkapi.host,port:config.api.vrkapi.port,publicKey:config.api.vrkapi.publicKey,secretKey:config.api.vrkapi.secretKey});
	
	pageNav=require(__path+"lib/pageNavigation.lib.js");// pageNavigation класс
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var main = {
	callback:null,
	start:async function(start_callback){
		console.log("Main process starting;");
		for(let key in config.postgres){
			(await PS(pgToolsLib,pgToolsLib.postgresConnect)(key.toUpperCase()));
		}
		ACTIONS=include.actionsTree(__path+'actions');
		(await PS(main,main.connectRedis)());
		publicServer.start(config.server.http.port,main.call);
		if(typeof start_callback=='function')start_callback();
	},
	redisCallback:null,
	connectRedis:function(callback){
		main.redisCallback=callback;//save callback global for main
		REDIS.MEMORY = redisLib.createClient(config.redis.port,config.redis.host);
		REDIS.MEMORY.on('connect', main.onRedisConnected).on("error", main.onRedisConnectionError);
	},
	onRedisConnected:function(){
		//console.log("# redis connected;");
		if(typeof main.redisCallback=='function')main.redisCallback();
	},
	onRedisConnectionError:function(err){
		console.log("# redis connection error:",err);
	},
	//выявить ip
	getClientIP:function($,request){
		var clientIP=request.connection.remoteAddress;//определяем IP клиента
		if(typeof request.headers['x-forwarded-for']!='undefined')clientIP=request.headers['x-forwarded-for'];
		if(typeof request.headers['x-real-ip']!='undefined')clientIP=request.headers['x-real-ip'];
		return clientIP;
	},
	//основной обработчик запросов http/https
	call:async function(request, queryData, response) {
		var $=[];
		main.addReturnFunctions($);
		$.request=request;
		$.response=response;
		$.queryData=queryData;
		$.clientIP=main.getClientIP($,request);
		$.URL=url.parse(request.url, true);
		$.GET=$.URL.query;
		if($.URL.search&&$.URL.search.length>1){
			try{
				$.GET=querystring.parse($.URL.search.slice(1));
			}catch(err){}
		}
		$.DATA={};
		$.method=request.method;
		if($.method == 'POST') {
			try {$.DATA = JSON.parse($.queryData);}//пробуем рапознать JSON данные
			catch (err){//если не получилось то ничего страшного
				try {$.DATA = querystring.parse(queryData);}//пробуем рапознать POST данные
				catch (err){}//если не получилось то пусто
			}
		}
		$.hostname=request.headers.host;
		$.datetime=Date.now();
		$.ts=dateUtil.fromUnix($.datetime).toString("Y-m-dTh:i:s.nZ");
		$.COOKIE = cookie.parse(request.headers.cookie || '');
		main.addCookieFunctions($);
		$.sesID=$.COOKIE['SESID_'+config.name]||null;
		if($.sesID==null){
			$.sesID = crypto.createHash('md5').update(Date.now().toString()).digest("hex")+'-'+Math.floor(Math.random() * (999999 - 100000) + 100000);
			$.COOKIE.set('SESID_'+config.name,$.sesID);
		}
		$.SESSION={};
		$.ACCOUNT={};
		$.ACTION=$.URL.pathname.replace(/^\/+|\/+$/g,'').split('/');
		$.VALUES=[];
		$.ACTION_PATH=$.ACTION.join('/');
		main.detectAction($);
		if(ACTIONS[$.ACTION_PATH].isMain===true){
			$.MODULE=$.ACTION.join('/');
		}else{
			$.MODULE=$.ACTION.slice(0,-1).join('/');
		}
		for (var i in $.VALUES){
			$.VALUES[i]=decodeURIComponent($.VALUES[i]);
		}
		if($.VALUES.length==0||($.VALUES.length>0&&ACTIONS[$.ACTION_PATH].receivePathValues===true)){
			main.getSession($);
		
		}else{
			$.return(false,{statusCode:404});
		}
	},
	addReturnFunctions:function($){
		$.return=function(success,args,tpl){
			tpl=tpl||null;
			if(typeof success!='boolean'){
				tpl=args;
				args=success;
				success=true;
			}
			if(!args.content&&args.CONTENT){
				args.content=args.CONTENT;
				delete args.CONTENT;
			}
			if(!args.title&&args.TITLE){
				args.title=args.TITLE;
				delete args.TITLE;
			}
			//detect ajax
			if($.request.headers["x-requested-with"] == 'XMLHttpRequest')var __jsonFormat=true;
			else var __jsonFormat=false;
			//if args is string
			if((tpl=='text'||tpl=='string')&&typeof args=='string'){
				$.response.statusCode = 200;
				$.response.write(args);
				$.response.end();
			}
			//if args isn`t object
			if(typeof args=="string"||typeof args=="number"){
				args={content:args};
			}
			args.statusCode=args.statusCode||200;
			//if redirect
			if(args.location){
				args.Location=args.location;
				delete args.location;
			}
			if(args.Location){
				if(__jsonFormat){
					$.response.statusCode = 200;
					args.content='<script>window.location.href="'+args.Location+'";</script>';
					if(args.statusCode)delete args.statusCode;
					$.response.write(String(JSON.stringify({success:success,result:args})));
					$.response.end();
				}else{
					if(args.statusCode==302||args.statusCode==301){
						$.response.statusCode = args.statusCode;
					}else $.response.statusCode = 302;
					$.response.setHeader('Location', args.Location);
					$.response.end();
				}
				return;
			}
			//not json and not success
			if(__jsonFormat==false&&success==false){
				args.statusCode=args.statusCode||404;
				tpl='error.html';
			}
			//get title AND content if empty
			if(!args.title||args.title==''&&args.statusCode!=200)args.title=titleByHttpStatusCode.getTitle(args.statusCode);
			if(!args.content||args.content==''&&args.statusCode!=200)args.content='<h1>'+args.title+'</h1>';
			//preparation to output if not ajax
			if(__jsonFormat==false){
				if(tpl==null){
					__jsonFormat=true;
				}else if(tpl=='error.html'&&typeof TPL[tpl]=='undefined'){
					tpl='index.html';
				}else if(typeof TPL[tpl]=='undefined'){
					__jsonFormat=true;
				}
			}
			//final output
			if(__jsonFormat==true){
				$.response.statusCode = 200;
				if(args.statusCode)delete args.statusCode;
				$.response.write(String(JSON.stringify({success:success,result:args})));
				$.response.end();
			}else{
				$.response.statusCode = args.statusCode;
				var options={
					'app_title':config.title||'',
					'title':config.title||'',
				}
				if(typeof $.ACCOUNT!='undefined'){
					//if(typeof $.ACCOUNT.type=='undefined')$.ACCOUNT.type=-1;
					var topMenuBar=buildTopMenu.build($.ACCOUNT.access);
					//console.log(topMenuItemsB.left,topMenuItemsB.right)
					options.account_login=$.ACCOUNT.login||'';
					options.account_root=($.ACCOUNT&&$.ACCOUNT.type==0)?true:false;
					topMenuBar=__mustache.render(topMenuBar,options);
				}else var topMenuBar='';
				options.content='';
				options.head_base='//'+$.hostname+'/';
				options.topMenuBar=topMenuBar;
				options.leftMenuBar=__mustache.render(TPL['leftMenu.html'],{'leftMenu':leftMenuItems});
				for (int in args) {
					options[int]=args[int];
				}
				var html=__mustache.render(TPL[tpl],options);
				delete args.content;
				delete args.title;
				delete args.statusCode;
				let argsCount=0;
				for (int in args) {
					argsCount++;
				}
				if(argsCount>0)html=html+'<script>io.ajax.GETCURRENTDATA(\''+JSON.stringify(args)+'\');</script>';
				$.response.write(html);
				$.response.end();
			}
			
		};
	},
	addCookieFunctions:function($){
		$.COOKIE.set=function(name,value,maxAge){
			if(name=='set'||name=='delete')return false;
			maxAge=maxAge||31536000;
			$.COOKIE[name]=value;
			$.response.setHeader('Set-Cookie', cookie.serialize(name, value, {path:'/',maxAge:maxAge}));
			return true;
		}
		$.COOKIE.delete=function(name){
			if(name=='set'||name=='delete')return false;
			delete $.COOKIE[name];
			$.response.setHeader('Set-Cookie', cookie.serialize(name, '', {path:'/',maxAge:0}));
			return true;
		}
	},
	getSession:async function($){
		let exists=await PS(REDIS.MEMORY,REDIS.MEMORY.exists)('SESSION|'+$.sesID);
		if(exists=='1'){
			$.SESSION=await PS(REDIS.MEMORY,REDIS.MEMORY.hgetall)('SESSION|'+$.sesID);
			for(let key in $.SESSION){
				try {$.SESSION[key] = JSON.parse($.SESSION[key]);}catch (err){}
			}
			REDIS.MEMORY.expireat('SESSION|'+$.sesID,Math.floor(Date.now()/1000)+31536000)
		}
		main.auth($);
	},
	addSessionFunctions:function($){
		$.SESSION.set=function(name,value){
			if(name=='set'||name=='delete')return false;
			if(typeof name=='object'){
				for(let key in name){
					$.SESSION[key]=name[key];
					if(typeof name[key]=='object')name[key]=JSON.stringify(name[key]);
					REDIS.MEMORY.hset('SESSION|'+$.sesID, key, name[key]);
				}
			}else{
				if(!value)return false;
				$.SESSION[name]=value;
				if(typeof value=='object')value=JSON.stringify(value);
				REDIS.MEMORY.hset('SESSION|'+$.sesID, name, value);
			}
			return true;
		}
		$.SESSION.delete=function(name){
			if(name=='set'||name=='delete')return false;
			delete $.SESSION[name];
			REDIS.MEMORY.hdel('SESSION|'+$.sesID, name);
			return true;
		}
	},
	auth:function($){
		if($.SESSION.ACCOUNT){
			$.ACCOUNT=$.SESSION.ACCOUNT;
		}
		main.addSessionFunctions($);
		if(ACTIONS[$.ACTION_PATH].public===true||$.ACCOUNT.id>=0){
			main.callAction($);
		}else{
			if($.ACTION_PATH!='logout')$.SESSION.set('auth_referer',$.URL.path);
			$.return({statusCode:302,Location:'/auth'});
		}
	},
	detectAction:function($){
		$.VALUES=[];
		let action_path=$.ACTION.join('/');
		while($.ACTION.length>0&&typeof ACTIONS[action_path]!=="function"){
			let val=$.ACTION.pop();
			if(val!='')$.VALUES.unshift(val);
			action_path=$.ACTION.join('/');
		}
		if($.ACTION.length==0){
			$.ACTION.push('main');
			action_path='main';
		}
		$.ACTION_PATH=action_path;
	},
	//вызываем действие
	callAction:function($){
		let access=false;
		var options=null;
		if($.ACCOUNT.id>=0){
			//if($.ACCOUNT.access&&$.ACCOUNT.access[$.ACTION_PATH]&&$.ACCOUNT.access[$.ACTION_PATH].access){
			access=true;
			options={}//$.ACCOUNT.access[$.ACTION_PATH].options;
			//}
			/*if($.ACCOUNT.access&&!$.ACCOUNT.access[$.ACTION_PATH]){
				access=true;
				let $ap=$.ACTION_PATH.split('/');
				while($ap.pop()){
					if($.ACCOUNT.access[$ap.join('/')]){
						if($.ACCOUNT.access[$ap.join('/')].access==false)access=false;
						else if($.ACCOUNT.access[$ap.join('/')].access==true)options=$.ACCOUNT.access[$ap.join('/')].options;
						break;
					}
				}
			}*/
		}
		if(ACTIONS[$.ACTION_PATH].public===true)access=true;
		if(options&&$.ACCOUNT.access)options.__parent=$.ACCOUNT.access;
		if(access){
			ACTIONS[$.ACTION_PATH]($,options);
		}else{
			$.return(false,{statusCode:403});
		}
	}
};
module.exports=main;