var TelegramBot = require('node-telegram-bot-api');
var mysql = require('mysql');
var express = require('express');
const schedule = require('node-schedule');
const LiqPay = require('liqpayjs-sdk');
const paymentToken = require("liqpay");
const server = require("./serverConfig");
const telegram = require("./telegram");


mysql.createPool(server);
var bot = new TelegramBot(telegram, {
    polling: true
});
var PORT = 3306;
var app = express();
app.listen(PORT, function () {
    console.log('Server is running on port ' + PORT);
});


function sendTime(time, chatId, text, options) {
    new schedule.scheduleJob({
        start: new Date(Date.now() + Number(time) * 1000 * 60),
        end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)),
        rule: '*/1 * * * * *'
    }, function () {
        bot.sendMessage(chatId, text, options);
    });
}

var menu = {
    parse_mode: "HTML",
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [
            ["Список всех битов","Стили битов"],
            ["Вопросы и предложения автору."],
            ["Помощь"]
        ]
    }
};
var adminMenu = {
    parse_mode: "HTML",
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [
            ["Добавить бит", "Удалить бит"], 
            ["Посмотреть статистику", "Сбросить статистику"],
            ["Очистить базу битов"]
        ]
    }
};


function delete_bits_db(chatId) {
    var sql1 = "DROP TABLE IF EXISTS bits";
    pool.getConnection(function (err, connection) {
        connection.query(sql1, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно удалена.");
            }
        });
        connection.release();
    });
}

function delete_users_db(chatId) {
    var sql1 = "DROP TABLE IF EXISTS users";
    pool.getConnection(function (err, connection) {
        connection.query(sql1, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно удалена.");
            }
        });
        connection.release();
    });
}

function create_bits_db(chatId) {
    let sql2 = "CREATE TABLE bits " +
        "(fullPackAudio_id VARCHAR(255), " +
        "demoAudio_id VARCHAR(250), " +
        "demoUniqueAudio_id VARCHAR(250), " +
        "price VARCHAR(250), " +
        "tags VARCHAR(250), " +
        "text VARCHAR(250), " +
        "date DATE, " +
        "Id INT not null AUTO_INCREMENT, " +
        " PRIMARY KEY (Id))";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно создана.");
            }
        });
        connection.release();
    });
}

function addBit(chatId, list, userId) {
    let today = new Date();
    if (+list.price < 24){
        list.price = 25;
    }else if(+list.price > 9999){
        list.price = 9999;
    }
    let date = today.getFullYear() + "--" + (today.getMonth() + 1) + "--" + today.getDate();
    let sql3 = "Insert into bits (fullPackAudio_id, demoAudio_id, demoUniqueAudio_id, price, tags, text, date) Values ('" + 
    list.fullPackAudio_id + "', '" + list.demoAudio_id + "', '" + list.demoUniqueAudio_id + "', '" + list.price + "', '" + 
    list.tags + "', '" + list.text + "', '" + date +"')";
    let txtData = "addBitTags__" + chatId;
    // bot.sendMessage(chatId, txtData + "__Yes" + userId);
    let YesNoButtons = {
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{
                    text: 'Да, давай добавим!',
                    callback_data: txtData + "__Yes__" + userId,

                }],
                [{
                    text: 'Не нужно.',
                    callback_data: txtData + "__No__" + userId,

                }]                
            ]
        })
    };
    pool.getConnection(function (err, connection) {
        connection.query(sql3, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "Бит(без текста и тегов) добавлен в базу.\nДобавить теги?", YesNoButtons);
                set_userStatus(userId, "addBitTags," + list.demoAudio_id);
            }
        });
        connection.release();
    });
}
function addBitTags(chatId, list, userId){
    let txtData = "addBitText__" + chatId;
    let YesNoButtons = {
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{
                    text: 'Да, давай добавим!',
                    callback_data: txtData + "__Yes",

                }],
                [{
                    text: 'Не нужно.',
                    callback_data: txtData + "__No",

                }]                
            ]
        })
    };
    let sql4 = "UPDATE bits SET tags = '" + list.tags +"' WHERE demoAudio_id = '" + list.demoAudio_id + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                return false;
            } else {
                 bot.sendMessage(chatId, "Теги добавлены, будем добавлять текст?", YesNoButtons);
                 set_userStatus(userId, "addBitText," + list.demoAudio_id);
            }

        });
        connection.release();
        if (error) {
            
        }
    });
}
function addBitText(chatId, list, userId){
    let sql4 = "UPDATE bits SET text = '" + list.text +"' WHERE demoAudio_id = '" + list.demoAudio_id + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                return false;
            } else {
                 connection.query(sql4, function (err, results) {
                    if (err) {
                        return false;
                    } else {
                        bot.sendMessage(chatId, "Текст добавлен, все готово.");
                        set_userStatus(userId, "-");
                    }
                });
            }
        });
        connection.release();
        if (error) {
           
        }
    });
}
function delete_bits(chatId, demoUniqueAudio_id){
    try{

        let sql2 = "DELETE FROM bits WHERE demoUniqueAudio_id = '" + demoUniqueAudio_id + "'";
        pool.getConnection(function (error, connection) {
            connection.query(sql2, function (err) {
                if (err || error) {
                    bot.sendMessage(chatId, "Что то пошло не так...");
                    throw err;
                } else {
                    bot.sendMessage(chatId, "Бит удален!\n");
                }
            });
            connection.release();
        });

}catch(err){

}
    
}

function getBit(demoUniqueAudio_id, callback){
    try{
    let sql2 = "SELECT * FROM bits WHERE demoUniqueAudio_id = '" + demoUniqueAudio_id + "'";
pool.getConnection(function (error, connection) {
    connection.query(sql2, function (err, results) {
        if (err || error) {
        } else {
            callback(results);
        }
    });
    connection.release();
});
    }catch(err){
        
    }
}
function create_users_db(chatId) {
    let sql2 = "CREATE TABLE users " +
        "(user_id VARCHAR(255), " +
        "request_status VARCHAR(255), " +
        "totalSpent VARCHAR(250), " +
        "admin VARCHAR(20)," +
        "phone VARCHAR(50)," +
        "Id INT not null AUTO_INCREMENT, " +
        " PRIMARY KEY (Id))";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База пользователей успешно создана.");
            }
        });
        connection.release();
    });
}

function turncate_users_db(msg) {

    let sql2 = "TRUNCATE TABLE users";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(msg.chat.id, "Что то пошло не так...2");
                throw err;
            } else {
                bot.sendMessage(msg.chat.id, "База пользователей очищена.");
                let sql3 = "Insert into users (user_id, request_status, totalSpent, admin, phone) Values ('" + msg.from.id + "','-','0','Админ','')";
                connection.query(sql3, function (err) {
                    if (err) {
                        bot.sendMessage(msg.chat.id, "Что то пошло не так...");
                        throw err;
                    } else {
                        bot.sendMessage(msg.chat.id, "Администратор добавлен.");
                    }
                });
            }
        });
        connection.release();
    });
}

function turncate_bits_db(msg) {
    let sql2 = "TRUNCATE TABLE bits";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(msg.chat.id, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(msg.chat.id, "База пользователей очищена.");
            }
        });
        connection.release();
    });
}

function add_user(list) {

    get_user(list.user_id, function(list){
        // bot.sendMessage(chatId, "Пользователь уже есть в базе данных.");
    },
    function(){
        let str = "Values ('" + list.user_id + "','-', '0', '" + list.admin + "','-')";
        let sql3 = "Insert into users (user_id, request_status,totalSpent, admin, phone) " + str;
        pool.getConnection(function (err, connection) {
            connection.query(sql3, function (err) {
            });
            connection.release();
        });
    });
}

function get_user(userId, callback1, callback2) {
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                callback2();
            } else {
                if (results.length == 0) {
                    callback2();
                } else {
                    let list = {
                        "user_id": results[0].user_id,
                        "admin": results[0].admin,
                        "phone": results[0].phone,
                        "totalSpent": results[0].totalSpent,
                        "request_status": results[0].request_status
                    };
                    callback1(list);
                }
            }

        });
        connection.release();
        if (error) {
            callback2();
        }
    });

}

function get_status(userId, callback1, callback2) {
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                callback2();
            } else {
                if (results.length == 0) {
                    callback2();
                } else {
                    let list = {
                        "user_id": results[0].user_id,
                        "admin": results[0].admin,
                        "phone": results[0].phone,
                        "totalSpent": results[0].totalSpent,
                        "request_status": results[0].request_status
                    };
                    callback1(list);
                }
            }

        });
        connection.release();
        if (error) {
            callback2();
        }
    });

}

function get_allUsers(chatId) {
    try {
        let sql4 = "SELECT * FROM users";
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                if (err) {
                    bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                        parse_mode: "HTML"
                    });
                } else {
                    if (results.length == 0) {
                        bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                            parse_mode: "HTML"
                        });
                    } else {
                        for (let k = 0; k < results.length && k < 10; k++) {
                            let list = {
                                "user_id": results[k].user_id,
                                "admin": results[k].admin,
                                "phone": results[k].phone,
                                "totalSpent": results[k].totalSpent,
                                "request_status": results[k].request_status
                            };
                            bot.sendMessage(chatId, "ID: <b>" + list.user_id + "</b> \nПрава доступа: <b>" + list.admin +
                                "</b> \nТелефон: <b>" + list.phone + "</b> \nОбщая сумма закупок: <b>" + list.totalSpent +  
                                "</b> \nСтатус запроса: <b>" + list.request_status + "</b>", {
                                    parse_mode: "HTML"
                            });
                        }
                    }
                }

            });
            connection.release();
            if (error) {
                bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                    parse_mode: "HTML"
                });
            }
        });

    } catch (err) {
        bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
            parse_mode: "HTML"
        });
    }
}

function set_userStatus(userId, status) {
    try {
        let sql4 = "UPDATE users SET request_status = '" + status +"' WHERE user_id = '" + userId + "'";
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                if (err) {
                    return false;
                } else {
                    return true;
                }

            });
            connection.release();
            if (error) {
            }
        });

    } catch (err) {
    }
}

function adminFilter(userId, callback){
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                return false;
            } else {
                if (results.length == 0) {
                    return false;
                } else {
                    let list = {
                        "user_id": results[0].user_id,
                        "admin": results[0].admin,
                        "phone": results[0].phone,
                        "totalSpent": results[0].totalSpent,
                        "request_status": results[0].request_status
                    };
                    if (list.admin == "Админ"){
                        callback(list);
                    } else {
                    }
                }
            }
        });
    });
}

function set_userAdmin(msg, userId) {
    let chatId = msg.chat.id;
        try {
            let sql5 = "UPDATE users SET admin = 'Админ' WHERE user_id = '" + userId + "'";
            pool.getConnection(function (error, connection) {
                connection.query(sql5, function (err, results) {
                    if (err) {
                        bot.sendMessage(chatId, "Что то пошло не так.");
                        return false;
                    } else {
                        bot.sendMessage(chatId, "Пользователю ID: " + userId + " успешно выданы права администратора.");
                        return true;
                    }

                });
                connection.release();
                if (error) {
                    bot.sendMessage(chatId, "Что то пошло не так.");
                }
            });

        } catch (err) {
            bot.sendMessage(chatId, "Что то пошло не так.");
        }
}

function buttons(chatId, coll, page, allPages) {
    var txtData = "button__" + chatId + "__" + coll + "__" + page;
    let resultButtons = {
        parse_mode: 'HTML'
    };
    if (allPages > 1) {
        if (page == 1) {
            let resultButtons = {
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Следующая страница',
                            callback_data: txtData + (+page + 1),
                        }]
                    ]
                })
            };
        } else if (page == allPages) {

            let resultButtons = {
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Предыдущая страница',
                            callback_data: txtData + (+page - 1),

                        }]
                    ]
                })
            };
        } else {
            let resultButtons = {
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Предыдущая страница',
                            callback_data: txtData + (+page - 1),
                        }],
                        [{
                            text: 'Следующая страница',
                            callback_data: txtData + (+page + 1),
                        }]
                    ]
                })
            };
        }
    } else {
        let resultButtons = {
            parse_mode: 'HTML'
        };
    }
    sendTime(0.02, chatId, "Страница " + page + " из " + allPages, resultButtons);
}

bot.on('message', function (msg) {
	if (msg.successful_payment != undefined) {
		var savedPayload = "yyy";	
		var savedStatus = "zzz";	
		if ((savedPayload != msg.successful_payment.invoice_payload) || (savedStatus != "WAIT")) {	// match saved data to payment data received
			bot.sendMessage(msg.chat.id, "Payment verification failed");
			return;
		}
		
		bot.sendMessage(msg.chat.id, "Payment complete!");
	}
});

function getFromBD(chatId, coll, page) {
    var messageError = "Битов в стиле " + coll + " в данный момент нет.";

    try {
        // let sql4 = "SELECT * FROM bits WHERE " + tags + " LIKE '%" + coll + "%'" + ' ORDER BY ' + date;
        let sql4 = "SELECT * FROM bits";
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                var allPages = Math.ceil(results.length / 10);
                if (results.slice((page - 1) * 10).length > 9) {
                    results = results.slice((page - 1) * 10, page * 10 + 9);
                } else {
                    results = results.slice((page - 1) * 10);
                }
                if (err) {
                    bot.sendMessage(chatId, messageError);
                } else {
                    if (results.length == 0) {
                        bot.sendMessage(chatId, messageError);

                    } else {
                        // let sql3 = "Insert into bits (fullPackAudio_id, demoAudio_id, price, tags, text) " + str;

                        for (var k = 0; k < results.length && k < 10; k++) {
                            const fileId = results[k].demoAudio_id;
  

                            var bitsInfoMessage = "<b>Цена: </b> " + results[k].price + " Грн \n\n" + "<b>Стили:</b> " + results[k].tags + " \n" + results[k].text;

                            let options ={
                                parse_mode: 'HTML',
                                caption: bitsInfoMessage,
                                reply_markup: JSON.stringify({
                                    force_reply: true,
                                    inline_keyboard: [
                                        [{
                                            text: 'Купить',
                                            callback_data: "pay__" + results[k].demoUniqueAudio_id + "__" + results[k].price,
                                        }]
                                    ]
                                }),
                            };
                            bot.sendAudio(chatId, fileId, options)
                                .then(function(sended) {
                                    var messageId = sended.message_id;
                                    bot.onReplyToMessage(chatId, messageId, function (message) {
                                        switch(message.text){
                                            case "удалить":
                                            case "del":
                                            case "Del":
                                            case "Удалить":
                                                delete_bits(chatId, message.reply_to_message.audio.file_unique_id);
                                                
                                                break;
                                            default:
                                                break;
                                        }
                                    });
                                });
                            if (k == results.length - 1 && results.length < 11 || k == 9 && results.length > 10) {
                                buttons(chatId, coll, page, allPages);
                            } else {
 
                            }

                        }
                    }
                }

            });
            connection.release();
            if (error) {
                bot.sendMessage(chatId, messageError);
            }
        });

    } catch (err) {
        bot.sendMessage(chatId, messageError);
    }
}

bot.on('callback_query', function (callbackQuery) {
    const message = callbackQuery.from.id;
    const txtData = callbackQuery.data.split("__");
    // bot.sendMessage(message.chat.id, text);
    let type = txtData[0];
        
    if (type == "pay"){
        let chatId = message,
        demoUniqueAudio_id = txtData[1],
        price = txtData[2];
        pay(chatId, price, demoUniqueAudio_id);
    }else if (type == "button"){
        let coll = txtData[2],
        page = txtData[3];
        getFromBD(chatId, coll, page);
    }else if (type == "addBitTags"){
        let chatId = txtData[1],
        yesNo = txtData[2],
        userId = txtData[3];
        if (yesNo == "Yes"){
            bot.sendMessage(chatId, "Введите через запятую теги для этого бита.");
            // set_userStatus(userId, "addBitTags," + demoAudio_id);
        }else if(yesNo == "No"){
            get_status(userId, function(list){
                set_userStatus(userId, "addBitText," + list.demoAudio_id);
                let txtData = "addBitText__" + chatId;
                let YesNoButtons = {
                    parse_mode: 'HTML',
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{
                                text: 'Да, давай добавим!',
                                callback_data: txtData + "__Yes__" + userId,
            
                            }],
                            [{
                                text: 'Не нужно.',
                                callback_data: txtData + "__No__" + userId,
            
                            }]                
                        ]
                    })
                };
                bot.sendMessage(chatId, "Будем добавлять текст для этого бита?", YesNoButtons);
        }, function(){});
        }
    }else if (type == "addBitText"){
        let chatId = txtData[1],
        yesNo = txtData[2],
        userId = txtData[3];
        if (yesNo == "Yes"){
            bot.sendMessage(chatId, "Введите текст/описание бита.");
        }else if(yesNo == "No"){
            set_userStatus(userId, "-");
            bot.sendMessage(chatId, "Бит добавлен!");
            ////////////////////////////////////////////
        }
    }
});


bot.onText(/delete (.+)/, function (msg, match) {
    let sql2 = "DELETE FROM bits WHERE demoAudio_id = '" + match[1] + "'";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "Бит удален!\n");
            }
        });
        connection.release();
    });
});

bot.onText(/(.+)/, function (msg, match) {
    let text = match[0];
    var chatId = msg.chat.id;
    let commands = ["/start", "showUsers", "Список всех битов", "Стили битов", "/myID", "Дать права администратора",
    "Вопросы и предложения автору.", "Добавить бит", "Удалить бит", "Посмотреть статистику", "Сбросить статистику",
    "админ", "Админ","Admin","admin","/help","/Help","help","Help","помощь","/Помощь","/помощь",
    "удалить","Удалить","del","Del",
    ];
    let keyboards = ["Добавить бит", "Удалить бит", "Дать права администратора", "Сбросить статистику",
    "Список всех битов"];
    if (!commands.includes(text)){
        get_user(msg.from.id,function(list){
            let status = list.request_status;

            try{
                
                let multiStatus = status.split(",");
                if (multiStatus[0] == "Добавить бит"){
                    let file1 = multiStatus[1].split("--");
                    let file2 = multiStatus[2].split("--");
                    if (file1[0] == "rar" && file2[0] == "mp3"){
                        let list ={
                            "fullPackAudio_id": file1[1], 
                            "demoUniqueAudio_id": file2[2], 
                            "demoAudio_id": file2[1], 
                            "price": text, 
                            "tags": " ", 
                            "text": " "
                        };
                        addBit(chatId, list, msg.from.id);
                    }else if(file2[0] == "rar" && file1[0] == "mp3"){
                        let list ={
                            "fullPackAudio_id": file2[1], 
                            "demoAudio_id": file1[1], 
                            "demoUniqueAudio_id": file1[2], 
                            "price": text, 
                            "tags": " ", 
                            "text": " "
                        };
                        addBit(chatId, list, msg.from.id);
                    }
                }else if (multiStatus[0] == "addBitTags"){
                    let list ={
                        "demoAudio_id": multiStatus[1], 
                        "tags": text 
                    };
                    addBitTags(msg.chat.id, list, msg.from.id);
                    // set_userStatus(msg.from.id, "-");
                }else if (multiStatus[0] == "addBitText"){
                    let list ={
                        "demoAudio_id": multiStatus[1], 
                        "text": text 
                    };
                    addBitText(msg.chat.id, list, msg.from.id);
                    // set_userStatus(msg.from.id, "-");
                }
                
            } catch(err){
                bot.sendMessage(chatId, "Что то пошло не так " + err);
            }
            switch(status){
                case "-":
                    bot.sendMessage(chatId, "Вы не выбрали ничего в меню", menu);
                    break;  
                case "Список всех битов":
                    getFromBD(msg.chat.id, "-", 1);
                    set_userStatus(msg.from.id, "-");
                    break;
                case "Дать права администратора":
                    adminFilter(msg.from.id, function(){
                        set_userAdmin(msg, text);
                    });
                    set_userStatus(msg.from.id, "-");
                    break; 
                default:
                    // bot.sendMessage(chatId, "Нема такого"); 
                    break;
            }

        },function(){});
    } else if(keyboards.includes(text)){
        set_userStatus(msg.from.id, text);
        switch(text){
            case "Добавить бит":
                bot.sendMessage(chatId, "Отправь mp3 демки. 🎵");
                break;
             
            case "Список всех битов":
                bot.sendMessage(chatId, "Введи интересующий тебя стиль.");
                break; 
             
            case "Расчетный счет":
                bot.sendMessage(chatId, "Введите расчетный счет.");
                break; 
                
            case "Владелец":
                bot.sendMessage(chatId, "Введите что-то из ФИО владельца.");
                break;
            case "Дать права администратора":
                bot.sendMessage(chatId, "Введите id пользователя которому выдать права администратора.");
                break;
            default:
                // bot.sendMessage(chatId, "Нема такого"); 
                break;
        }
    }
});

bot.on("audio", function(msg, match){

    let fileID = msg.audio.file_id;
    let file = bot.getFile(fileID);
    // bot.sendMessage(msg.chat.id, JSON.stringify(file));

    get_user(msg.from.id,function(list){
        let status = list.request_status.split(",");

        if (status[0] == "Добавить бит"){
            if (status[1]){
                set_userStatus(msg.from.id, status + ",mp3--" + fileID + "--" + msg.audio.file_unique_id);
                bot.sendMessage(msg.chat.id, "Какая цена будет у бита");
            }else{
                bot.sendMessage(msg.chat.id, "Теперь загрузи архив со всем добром");
                set_userStatus(msg.from.id, "Добавить бит,mp3--" + fileID + "--" + msg.audio.file_unique_id);
            }
        }
    },function(){});
});
    
bot.on("document", function(msg, match){
    let fileID = msg.document.file_id;
    let file = bot.getFile(fileID);

    get_user(msg.from.id,function(list){
        let status = list.request_status.split(",");

        if (status[0] == "Добавить бит"){
            if (status[1]){
                set_userStatus(msg.from.id, status + ",rar--" + fileID);
                bot.sendMessage(msg.chat.id, "Какая цена будет у бита");
            }else{
                bot.sendMessage(msg.chat.id, "Теперь загрузи mp3 демки");
                set_userStatus(msg.from.id, "Добавить бит,rar--" + fileID);
            }
        }
    },function(){});
});



bot.onText(/Очистить базу битов/, function (msg) {
    var chatId = msg.chat.id;
    try {adminFilter(msg.from.id, function(){turncate_bits_db(msg);});
    } catch (err) {}
});

bot.onText(/Очистить базу пользователей/, function (msg) {
    try {
        adminFilter(msg.from.id, function(){turncate_users_db(msg);});
    } catch (err) {
    }
});
bot.onText(/\/myID/, function (msg) {
    bot.sendMessage(msg.chat.id, "Ваш ID:" + msg.from.id);
});
bot.onText(/admin/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});

bot.onText(/showUsers/, function (msg, match) {
    get_allUsers(msg.chat.id);
});

bot.onText(/\/start/, function (msg) {

    var newUser = {
        "user_id": msg.from.id,
        "request_status": "-",
        "totalSpent": "0",
        "admin": "Админ",
        "phone": "-"
    };
    add_user(newUser);
    bot.sendMessage(msg.chat.id, helpMessage, menu);
});




let helpMessage = "...";

bot.onText(/помощь/, function (msg) {
    bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/Помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/Help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/Помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/Help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});







bot.onText(/Admin/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});
bot.onText(/Админ/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});
bot.onText(/админ/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});