
const keys = require(__root+"keys.json");
var lib={
	insert:async function(STORAGE){
		let accounts=await STORAGE.all('SELECT publicKey,secretKey FROM accounts');
		let existsKeys=[];
		let existsKeysObj=[];
		let installKeys=[];
		let installKeysObj=[];
		for(let i in accounts){
			existsKeys.push(accounts[i].publicKey);
			existsKeysObj[accounts[i].publicKey]=accounts[i].secretKey;
		}
		for(let i in keys){
			installKeys.push(keys[i].publicKey);
			installKeysObj[keys[i].publicKey]=keys[i].secretKey;
		}
		let delKeys=[];
		let addKeys=[];
		let updateKeys=[];
		for(let i in accounts){
			if(!installKeys.includes(accounts[i].publicKey))delKeys.push(accounts[i].publicKey);
		}
		for(let i in keys){
			let item=keys[i];
			if(!existsKeys.includes(item.publicKey))addKeys.push(item);
			else if(installKeysObj[item.publicKey]!=existsKeysObj[item.publicKey])updateKeys.push(item);
		}
		//console.log(delKeys);
		if(delKeys.length>0){
			for(let i in delKeys){
				let item=delKeys[i];
				await STORAGE.delete('accounts',{publicKey:item});
			}
		}
		//console.log(addKeys);
		if(addKeys.length>0){
			for(let i in addKeys){
				let item=addKeys[i];
				await STORAGE.insert('accounts',item);
			}
		}
		//console.log(updateKeys);
		if(updateKeys.length>0){
			for(let i in updateKeys){
				let item=updateKeys[i];
				await STORAGE.update('accounts',{secretKey:item.secretKey},{publicKey:item.publicKey});
			}
		}
	}
	
};
module.exports=lib;
