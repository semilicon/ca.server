/////////////////////////////////////////////////////////////////////////////////////////////////////////
const cluster = require('cluster');
const pathParser = require('path');
exit=function(){process.exit(0);};//функция завершения работы приложения
/////////////////////////////////////////////////////////////////////////////////////////////////////////
if(cluster.isWorker&&process.env['role']=='http'){
	var main=require(__path+'main-http.js');
	main.start(function(){
		console.log('Process "main-http" #'+cluster.worker.id+' is sterted.');
	});
}else if(cluster.isWorker&&pathParser.extname(process.env['role'])=='.handler'){
	let name =pathParser.basename(process.env['role'],'.handler');
	var main=require(__path+'handlers/'+name+'.js');
	main.start(function(){
		console.log('Process "'+process.env['role']+'" #'+cluster.worker.id+' is sterted.');
	}); 	
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////