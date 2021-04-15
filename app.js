/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const { urlencoded } = require('express');
const hbs=require('hbs');
var bodyParser=require('body-parser');


async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        const express=require("express");
        //const path=require("path");

        var app=express();
        var static_path=path.join(__dirname +'/public');
        var view_path=path.join(__dirname+'/views');
        app.use(express.static(static_path));
        app.set('view engine','hbs');
        app.set('views',view_path);
        app.use(express.json());
        var urlencodedParser = bodyParser.urlencoded({ extended: false })

                // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
      app.get('/',(req,res)=>{
            res.render('index');
        })
        app.get('/register',(req,res)=>{
            res.render('register');
        })
        app.post('/login',urlencodedParser,async function(req,res){
            //var name=req.body.name;
            var email=req.body.email;
            var password=req.body.password;
            var role=req.body.role;
            //var id="user"+email;
            try{
           const result= await contract.evaluateTransaction('loginUser',email,password,role);
            res.send("Login successful");
            }
            catch(error){
                 console.log(error);
            }
            
        })

        app.post('/register',urlencodedParser,async function(req,res){
            //var name=req.body.name;
            var email=req.body.email;
            var password=req.body.password;
            var role=req.body.role;
            var name=req.body.name;
            var id="user"+email;
            var id="user"+email;
            try{
          const result= await contract.submitTransaction('registerUser',id,email,password,name,role);
            res.send(email+password+role+name+id);
            }
            catch(error){
                 console.log(error);
            }
            
        })
       /* app.get('http://localhost:5984/_utils/#database/mychannel_fabcar/_all_docs',(req,res)=>{
            console.log(res);
        })*/
       
       app.listen(3000,console.log("running"));
      // Disconnect from the gateway.
        await gateway.disconnect();
        
    } catch (error) {
       console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();
