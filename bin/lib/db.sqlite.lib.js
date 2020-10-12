
const fs = require('fs');
const pathLib = require('path');
var lib={
	install:async function(DB,pathToTablesConfig){
		let existsTables=await DB.all('SELECT name FROM sqlite_master WHERE type=\'table\'');
		let existsTablesList=[];
		for (let i in existsTables) {
			if(existsTables[i].name=='sqlite_sequence')continue;
			existsTablesList.push(existsTables[i].name);
		}
		var tablesConfigsFiles = fs.readdirSync(pathToTablesConfig);
		let newTablesList=[];
		for (let i in tablesConfigsFiles) {
			let file=tablesConfigsFiles[i];
			let ext=pathLib.extname(pathToTablesConfig+file);
			if(ext!='.json')continue;
			let tableConfig=require(pathToTablesConfig+file);
			newTablesList.push(tableConfig.name.toLowerCase());
			if(!existsTablesList.includes(tableConfig.name.toLowerCase())){
				await lib.createTable(DB,tableConfig);
				await lib.insertDefaultValues(DB,tableConfig);
			}else{
				await lib.updateTableStructure(DB,tableConfig);
			}
		}
		for (let i in existsTablesList) {
			let table=existsTablesList[i];
			if(!newTablesList.includes(table))await lib.deleteTable(DB,table);
		}
		return true;
	},
	createTable:async function(DB,tableConfig){
		let colomns=[];
		for (let i in tableConfig.cols) {
			let col=tableConfig.cols[i];
			let colomn=col.name+' '+col.type+' '+((col.primaryKey)?'PRIMARY KEY ASC AUTOINCREMENT':'')+' '+((col.notNull)?'NOT NULL':'')+' '+((typeof col.default!='undefined')?'DEFAULT '+((typeof col.default=='string')?'\''+col.default+'\'':col.default):'');
			colomns.push(colomn);
		}
		let request='CREATE TABLE IF NOT EXISTS '+tableConfig.name.toLowerCase()+' ('+colomns.join(', ')+')';
		let result = await DB.run(request);
		return result;
	},
	updateTableStructure:async function(DB,tableConfig){
		let tableStructure=await DB.all('PRAGMA table_info('+tableConfig.name.toLowerCase()+');');
		let existsColumnsList=[];
		let addList=[];
		for (let i in tableStructure) {
			existsColumnsList.push(tableStructure[i].name);
		}
		for (let i in tableConfig.cols) {
			let col=tableConfig.cols[i].name;
			if(!existsColumnsList.includes(col))addList.push(tableConfig.cols[i]);
		}	 
		if(addList.length>0){
			//ALTER TABLE users ADD COLUMN id_sort INTEGER;
			for (let i in addList) {
				let col=addList[i];
				let colomn=col.name+' '+col.type+' '+((col.primaryKey)?'PRIMARY KEY ASC AUTOINCREMENT':'')+' '+((col.notNull)?'NOT NULL':'')+' '+((typeof col.default!='undefined')?'DEFAULT '+((typeof col.default=='string')?'\''+col.default+'\'':col.default):'');
				let request='ALTER TABLE '+tableConfig.name.toLowerCase()+' ADD COLUMN '+colomn;
				await DB.run(request);
			}
		}
	},
	insertDefaultValues:async function(DB,tableConfig){
		if(tableConfig.defaultValues.length>0){
			for (let i in tableConfig.defaultValues) {
				let value=tableConfig.defaultValues[i];
				await DB.insert(tableConfig.name,value);
			}
		}
	},
	deleteTable:async function(DB,tableName){
		let request='DROP TABLE IF EXISTS '+tableName;
		let result = await DB.run(request);
		return result;
	}
};
module.exports=lib;
