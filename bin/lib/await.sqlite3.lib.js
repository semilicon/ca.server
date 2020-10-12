const sqlite3 = require('sqlite3').verbose();

var lib={
	Database:function(db_path){
		let dbConnection = new sqlite3.Database(db_path);
		let wrapper={
			run:function(query, params){
				return new Promise(function(resolve, reject) {
					dbConnection.run(query, params, 
						function(err)  {
							if(err) reject(err.message)
							else resolve(true)
					})
				})
			},
			get:function(query, params){
				return new Promise(function(resolve, reject) {
					dbConnection.get(query, params, function(err, row)  {
						if(err) reject("Read error: " + err.message)
						else {resolve(row)}
					})
				})
			},
			all:function(query, params){
				return new Promise(function(resolve, reject) {
					if(params == undefined) params=[]
					dbConnection.all(query, params, function(err, rows)  {
						if(err) reject("Read error: " + err.message)
						else {resolve(rows)}
					})
				}) 
			},
			each:function(query, params, action){
				return new Promise(function(resolve, reject) {
					dbConnection.serialize(function() {
						dbConnection.each(query, params, function(err, row)  {
							if(err) reject("Read error: " + err.message)
							else {
								if(row) {
									action(row)
								}    
							}
						})
						dbConnection.get("", function(err, row)  {
							resolve(true)
						})            
					})
				})
			},
			prepare:function(query) {
				return dbConnection.prepare(query);
			},
			close:function() {
				return new Promise(function(resolve, reject) {
					dbConnection.close()
					resolve(true)
				}) 
			},
			insert:async function(table,value){
				let keys=[];
				let vals=[];
				let vq=[];
				for (let key in value) {
					keys.push(key);
					vq.push('?');
					if(value[key]===null||typeof value[key]=='undefined'){
						vals.push(null);
					}else if(typeof value[key]=='boolean'){
						vals.push((value[key]==true)?'1':'0');
					}else if(typeof value[key]=='number'||typeof value[key]=='string'){
						vals.push(value[key]);
					}else if(typeof value[key]=='object'){
						vals.push(JSON.stringify(value[key]));
					}
				}
				let request='INSERT INTO '+table.toLowerCase()+' ('+keys.join(',')+') VALUES('+vq.join(',')+')';
				//console.log(request,vals);
				try{
					var result = await this.run(request,vals);
				}catch(err){
					throw new Error(err);
				}
				return result;
			},
			update:async function(table,value,where){
				let keys=[];
				let vals=[];
				for (let key in value) {
					keys.push(key+'=?');
					if(value[key]===null||typeof value[key]=='undefined'){
						vals.push(null);
					}else if(typeof value[key]=='boolean'){
						vals.push((value[key]==true)?'1':'0');
					}else if(typeof value[key]=='number'||typeof value[key]=='string'){
						vals.push(value[key]);
					}else if(typeof value[key]=='object'){
						vals.push(JSON.stringify(value[key]));
					}
				}
				if(typeof where=='number')where='id='+where;
				else if(typeof where=='object'){
					let newWhere=[];
					for (let key in where) {
						newWhere.push(key+'=?');
						vals.push(where[key]);
					}
					where=newWhere.join(' AND ');
				}
				let request='UPDATE '+table.toLowerCase()+' SET '+keys.join(',')+((where)?' WHERE '+where:'');
				//console.log(request,vals)
				try{
					var result = await this.run(request,vals);
				}catch(err){
					throw new Error(err);
				}
				return result;
			},
			delete:async function(table,where){
				let vals=[];
				if(typeof where=='number')where='id='+where;
				else if(typeof where=='object'){
					let newWhere=[];
					for (let key in where) {
						newWhere.push(key+'=?');
						vals.push(where[key]);
					}
					where=newWhere.join(' AND ');
				}
				let request='DELETE FROM '+table.toLowerCase()+((where)?' WHERE '+where:'');
				console.log(request,vals)
				try{
					var result = await this.run(request,vals);
				}catch(err){
					throw new Error(err);
				}
				return result;
			},
		};
		return wrapper;
	}
};
module.exports=lib;
