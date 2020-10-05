/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');
	const execSync = require('child_process').execSync;
	var clusterUtils=require(__path+'lib/cluster.utils.lib.js');
	const systemdLib=require(__path+'lib/systemd.lib.js');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//проверяем установленны ли компоненты
	if(!fs.existsSync(__root+'node_modules/')){
		console.log('Alert: need install node_modules;');
		execSync('cd '+__root);
		execSync('npm install');
		console.log('Info: node_modules has been installed;');
	}
	//создаём папки
	const systemDirs=['log','data'];
	for(let i in systemDirs){
		if(!fs.existsSync(__root+systemDirs[i]+'/'))fs.mkdirSync(__root+systemDirs[i]+'/');
	}
	//создаём файлы
	const systemFiles=['log/_syslog.log'];
	for(let i in systemFiles){
		if(!fs.existsSync(__root+systemFiles[i]))fs.writeFileSync(__root+systemFiles[i],'');
	}
	//создаём системные конфигурации для автозапуска приложения
	systemdLib.register(config.name,__root);
	//открываем порт
	var openPort=require(__path+"lib/openPort.lib.js");
	if(!openPort(config.server.https.portZone,config.server.https.port))process.exit(0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	clusterUtils.init();
	clusterUtils.developerMode(config.developerMode);
	clusterUtils.startHandlersForks();
	clusterUtils.startHttpForks();
	