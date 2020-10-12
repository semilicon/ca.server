const execSync = require('child_process').execSync;
//проверяем открытость порта
function lib(portZone,port){
	var stdout=execSync('ps aux | grep [f]irewalld | wc -l');
	if(stdout>=1){
		let o=execSync('firewall-cmd --zone='+portZone+' --list-ports').toString().replace(/^\s+|\s+$/g, '');
		let ports = o.split(' ');
		if(ports.indexOf(port+'/tcp')!=-1){
			//console.log('Port '+port+' is open.');
			return true;
		}else{
			execSync('firewall-cmd --permanent --zone='+portZone+' --add-port='+port+'/tcp');
			execSync('firewall-cmd --reload');
			let o=execSync('firewall-cmd --zone='+portZone+' --list-ports').toString().replace(/^\s+|\s+$/g, '');
			let ports = o.split(' ');
			if(ports.indexOf(port+'/tcp')!=-1){
				console.log('Port '+port+' is open.');
				return true;
			}else{
				console.log('Port '+port+' is closed.');	
				return false;
			}
		}
	}else{
		console.log('Error! Service "firewalld" are not active.');
		return false;
	}
}
module.exports=lib;
