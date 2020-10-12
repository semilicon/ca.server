/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');	
	const include = require(__path+"lib/actions.lib.js");//скрипт загрузки модулей или шаблонов из указанной папки
	const publicServer = require(__path+"lib/httpsServer.lib.js");//код запуска сервера
	const sqlite3 = require(__path+'lib/await.sqlite3.lib.js');
	const crypto = require('crypto');
	var STORAGE = sqlite3.Database(__root+"data/storage.db");
	var ACTIONS = null;
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var main = {
	start:async function(callback){
		ACTIONS=include.actionsTree(__path+'actions');
		let options={
			key: fs.readFileSync(__root+'data/server.key'),
			cert: fs.readFileSync(__root+'data/server.crt'),
			ca: fs.readFileSync(__root+'data/root_ca.crt')
		}
		publicServer.start(config.server.https.port,options,main.call);
		if(typeof callback=='function')callback();
	},
	call:async function($) {
		{
			let {action,values} = publicServer.detectActionFromValues(ACTIONS,$.VALUES);
			$.ACTION=action;
			$.VALUES=values;
		}
		if($.VALUES.length>0&&ACTIONS[$.ACTION].receivePathValues!==true)return $.return({success:false,error:404});
		let access=false;
		if(ACTIONS[$.ACTION].public===true)access=true;
		const x_signature=($.GET['signature'])?$.GET['signature']:$.headers['X-SIGNATURE'];
		const x_apikey=($.GET['publickey'])?$.GET['publickey']:$.headers['X-APIKEY'];
		const x_nonce=$.GET['nonce'];
		if(access==false&&(typeof x_signature=='undefined'||x_signature==''||typeof x_apikey=='undefined'||x_apikey==''||typeof x_nonce=='undefined'||x_nonce==''))return $.return({success:false,error:403});
		let ignoreAuth=false;
		if(access==true&&(typeof x_signature=='undefined'||x_signature==''||typeof x_apikey=='undefined'||x_apikey==''||typeof x_nonce=='undefined'||x_nonce==''))ignoreAuth=true;
		if(!ignoreAuth){
			let account=await STORAGE.get('SELECT * FROM accounts WHERE publicKey="'+x_apikey+'"');
			if(typeof account=='undefined')return $.return({success:false,error:403});
			if(account.nonce>=x_nonce)return $.return({success:false,error:403});
			const signbody=$.queryString+$.body;
			const signature = crypto.createHmac('sha256', account.secretKey).update(signbody).digest('hex');
			if(x_signature!=signature){
				if(config.developerMode&&config.developerModeDemonstrateSignature){
					return $.return({success:false,error:403,signature:signature});
				}else return $.return({success:false,error:403});
			}
			await STORAGE.update('accounts',{'nonce':x_nonce},{publicKey:account.publicKey});
			account.nonce=x_nonce;
			$.account=account;
		}
		return main.callAction($);
	},
	//вызываем действие
	callAction:function($,options){
		options=options||null;
		if(typeof ACTIONS[$.ACTION]=='function')ACTIONS[$.ACTION]($,options);
		else if(typeof ACTIONS[$.ACTION].init=='function')ACTIONS[$.ACTION].init($,options);
	},
	
};
module.exports=main;