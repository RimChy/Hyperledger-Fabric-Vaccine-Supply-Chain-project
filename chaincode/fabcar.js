/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { all } = require('async');
const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const vaccines = [
            {
                current_owner:'ABC',
                issue_date:'01-01-2021',
                amount:50,
                unit:'bottles',
                vaccine_number:'syl_A',
                issuer_org:'affr',
                key:'vaccine0',
                owners:['producer:a','distributor:b','distributor:c'],

            },    
        ];
        const users=[
            {
                email:'abc@gmail.com',
                password:'1234',
                role:'producer',
                name:'abc',
                key:'user0'
            


            }
        ];

        
        for (let i = 0; i < vaccines.length; i++) {
            vaccines[i].docType = 'vaccine';
            await ctx.stub.putState('vaccine' + i, JSON.stringify(vaccines[i]));
            console.info('Added <--> ', vaccines[i]);
        }
        for (let i = 0; i < users.length; i++) {
            users[i].docType = 'user';
            await ctx.stub.putState('user' + i, JSON.stringify(users[i]));
            console.info('Added <--> ', users[i]);
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryVaccine(ctx, vaccineNumber) {
        const carAsBytes = await ctx.stub.getState(vaccineNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${vaccineNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }
    async queryVaccineByOwner(ctx, current_owner) {
        //   0
        // 'bob'
        
    
        
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'vaccine';
        queryString.selector.owner = current_owner;
        
        let queryResults = await this.getQueryResultForQueryString(ctx,JSON.stringify(queryString));
        return queryResults.toString(); //shim.success(queryResults);
      }

    async createVaccine(ctx, id, current_owner, vaccine_number,issue_date,amount,unit) {
        console.info("============= START : Create Car ===========");

        const vaccine = {
            id,
            current_owner,
            vaccine_number,
            issue_date,
            amount,
            unit,
            issuer_name:current_owner,
            owners:[current_owner],
            key:id,
            docType: 'vaccine'
            
        };

        await ctx.stub.putState(id,JSON.stringify(vaccine));

        console.info("============= END : Create Car ===========");
    }
    async registerUser(ctx, userId, email, password, name,role) {
        console.info("============= START : Register User ===========");

        const user = {
            docType: "user",
            email,
            password,
            name,
            role,
            key: userId,
        };

        await ctx.stub.putState(userId, JSON.stringify(user));
        console.info("============= END : Register User ===========");
    }
     
  /*  async queryAllCars(ctx) {
        const startKey = 'vaccine0';
        const endKey = 'vaccine99';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }*/
    async getSingleResult(iterator, isHistory) {
        let allResults = [];
        let allKey={};
        var i;
        while (true) {
          let res = await iterator.next();
          
          if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            console.log(res.value.value.toString('utf8'));
            var Key;
            var Record;
            if (isHistory && isHistory === true) {
              jsonRes.TxId = res.value.tx_id;
              jsonRes.Timestamp = res.value.timestamp;
              jsonRes.IsDelete = res.value.is_delete.toString();
              //id=res.value.key;
              
              try {
               Key=res.value.key.toString('utf8');
               // jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
               Record = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                //.value hobe
                Record= res.value.value.toString('utf8');
              }
              
            } else {
              Key = res.value.key.toString('utf8');
              try {
                Record = res.value.value.toString('utf8');
              } catch (err) {
                console.log(err);
                //record
                Record= res.value.value.toString('utf8');
              }
            }
            //k+=i;
            allResults.push({Key,Record});
            //ar k="key"+i;
            //allKey.push(Key);
            i=Key;
          }
          if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allKey);
            return i;
          }
        
        }
      }
      async getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
          let res = await iterator.next();
    
          if (res.value && res.value.value.toString()) {
            let jsonRes = {};
            console.log(res.value.value.toString('utf8'));
    
            if (isHistory && isHistory === true) {
              jsonRes.TxId = res.value.tx_id;
              jsonRes.Timestamp = res.value.timestamp;
              jsonRes.IsDelete = res.value.is_delete.toString();
              try {
                jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Value = res.value.value.toString('utf8');
              }
            } else {
              jsonRes.Key = res.value.key;
              try {
                jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
              } catch (err) {
                console.log(err);
                jsonRes.Record = res.value.value.toString('utf8');
              }
            }
            allResults.push(jsonRes);
          }
          if (res.done) {
            console.log('end of data');
            await iterator.close();
            console.info(allResults);
            return allResults;
          }
        }
      }
    
    async getQueryResultForQueryString(ctx, queryString) {

        console.info('- getQueryResultForQueryString queryString:\n' + queryString)
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        
    
        let results = await this.getSingleResult(resultsIterator, false);
    
        return JSON.stringify(results);
      }
      async getQueryResultForQueryStringAll(ctx, queryString) {

        console.info('- getQueryResultForQueryString queryString:\n' + queryString)
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        
    
        let results = await this.getAllResults(resultsIterator, false);
    
        return JSON.stringify(results);
      }
      async queryVaccineByOwner(ctx,current_owner) {
        //   0
        // 'bob'
        if (current_owner.length=='') {
          throw new Error('Incorrect number of arguments. Expecting owner name.')
        }
    
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType= 'vaccine';
        queryString.selector.current_owner= current_owner;
        
        let queryResults = await this.getQueryResultForQueryStringAll(ctx, JSON.stringify(queryString));
        return queryResults; //shim.success(queryResults);
      }
      async loginUser(ctx,email,password,role) {
        //   0
        // 'bob'
        if (email=='' || password=='' || role=='') {
          throw new Error('Incorrect number of arguments. Expecting owner name.')
        }
    
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType= 'user';
        queryString.selector.email= email;
        queryString.selector.password=password;
        queryString.selector.role=role;
        
        let queryResults = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        if(!queryResults || queryResults.length==0){
          throw new Error(" User doesnot Exist");
        }
        return queryResults.toString(); //shim.success(queryResults);
      }
    
    async changeVaccineOwner(ctx, vaccineNumber, newOwner) {
        console.info('============= START : changeCarOwner ===========');

        const carAsBytes = await ctx.stub.getState(vaccineNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${vaccineNumber} does not exist`);
        }
        const car = JSON.parse(carAsBytes.toString());
        car.current_owner = newOwner;

        await ctx.stub.putState(vaccineNumber, Buffer.from(JSON.stringify(car)));
        console.info('============= END : changeCarOwner ===========');
    }

}

module.exports = FabCar;
