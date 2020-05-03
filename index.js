var express=require('express');
var app=express();
var session = require('express-session');
var server=require('http').createServer(app);
app.use(session({secret: 'abcd',resave:'false', saveUninitialized:'false',name:'usess',cookie: { maxAge: 10000 }}));
var io=require('socket.io').listen(server);
// var req = require('request');


var user = undefined;
var page = undefined;
var flg_page  = 1; 
var flg_stat  = 0; 
var client_id = [];
// var username = undefined;
server.listen(3000, function() {
    console.log('listening on *:3000');
});

io.on('connection', function(client) {
    // console.log('Client connected..');
    
    client.on('setconnect', function(data) {
        user = data.username;
        page = data.page;
        flg_stat = 1;
        // client_id[client.id] = {'user':user, 'page' :page, 'stat': flg_stat };
        req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_session_set/',{i:client.id, n:user, v:JSON.stringify({page:page}) });
        
        req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_uses_member/',{user:user, stat:'1'})

        console.log("%s client id : %s  user %s connect activated page %s",new Date(), client.id, user, page); 
        client.emit(user,{hi:'Hi!', id:client.id});
        client.broadcast.emit('administrator',{user:user, coloe:'green'} );
        setTimeout( ()=>{flg_stat = 0}, 5000);
    });

    client.on('administrator', function(data) {
        console.log(data);
        // client.broadcast.emit("reply_message", data);
    }); 
    client.on('chenge-link', (data)=> {
        flg_page = 0; 
        if( data.username === undefined ) client.emit(client.id,'Bye!');
        console.log('%s client id : %s  user %s change  page %s',new Date(), client.id, data.username, data.page);
    });   
    client.on('bad-member', (u)=> {
        req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_uses_member/',{ user:u.username, stat:'0'} );
        user = u.username;
        client.broadcast.emit(`${u.username}-bad`); 
        // client.broadcast.emit("reply_message", data); bad-member
    }); 
    
    client.on('disconnect', function() {  
         var us, pg; 
         if( flg_page == 1)
             setTimeout( ()=>{
                 if( flg_stat == 0 ){ 
                     console.log(client.id);
                     user = req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_session_get/',{i:client.id},
                     (error, res, body) => {
                         
                        if( body.length > 0 ){
                            us = body[0]["sess_name"]; 
                            pg = JSON.parse( body[0]["sess_value"] );
                        }else{
                            us = user; 
                            pg = {page:"not found"};                           
                        } 
                            console.log('%s client id : %s  user %s disconnected page %s close',new Date(), client.id, us, pg.page  );
                            
                            client.broadcast.emit('administrator',{user:us, coloe:'red'});
                            req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_session_del/',{n:us});
                            req_http_get('http://192.168.161.102/api_system/Api_event_reportaccess/evtsys_uses_member/',{user:us, stat:'0'});                 
                     }); 
                 }else { 
                     flg_stat = 0;
                 }
             },2500)
        else flg_page = 1;
             // console.log(client_id);
             // console.clear();   
    });  
});

function req_http_post(url, obj){
    const req = require('request');
    req.post(
        url
        , { json: obj }, 
        (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        // console.log(`statusCode: ${res.statusCode}`)
        //console.log(body)
    })
}
function req_http_get(url, obj, b){
    const req = require('request');
    var dat;
    req.get(
        url, 
        { json: obj }, 
        b
    )

    if(b){ return dat; }
}