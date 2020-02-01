"use strict";

var TelegramBot = require('node-telegram-bot-api');

var fastcsv = require("fast-csv");

var mysql = require('mysql');

var express = require('express');

const schedule = require('node-schedule');

var token = '1039416009:AAEy6kssRb0JJFkh2RfndAGib20jOsvrr2Q';
var bot = new TelegramBot(token, {
  polling: true
});
var PORT = 3306;
var app = express();
var pool = mysql.createPool({
  connectionLimit: 100,
  database: 'heroku_29f5c4ca6f3b27d',
  host: 'us-cdbr-iron-east-05.cleardb.net',
  user: 'b8ff7d2ddf8691',
  password: 'dd26aaf7',
  charset: 'utf8_general_ci',
  debug: 'false'
});
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
    keyboard: [["Владелец", "Номер счетчика"], ["Номер пломбы", "Расчетный счет"], ["Помощь"]]
  }
};
var adminMenu = {
  parse_mode: "HTML",
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: true,
    keyboard: [["Очистить базу счетчиков"], ["Очистить базу пользователей", "Дать права администратора"]]
  }
};

function delete_counters_db(chatId) {
  var sql1 = "DROP TABLE IF EXISTS countersInfo";
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

function create_counters_db(chatId) {
  let sql2 = "CREATE TABLE countersInfo " + "(counter_id VARCHAR(255), " + "number_calc VARCHAR(250), " + "number_plomb VARCHAR(250), " + "owner VARCHAR(250), " + "adress VARCHAR(250), " + "object VARCHAR(250), " + "type VARCHAR(250), " + "power VARCHAR(250), " + "phone VARCHAR(250), " + "message VARCHAR(250), " + "Id INT not null AUTO_INCREMENT, " + " PRIMARY KEY (Id))";
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

function add_counter(list) {
  if (list.length < 10) {
    for (let n = list.length; n < 10; n++) {
      list[n] = "-";
    }
  }

  let str = "Values ('";

  for (let i = 0; i < list.length - 1; i++) {
    str += list[i] + "','";
  }

  str += list[list.length - 1] + "')";
  let sql3 = "Insert into countersInfo (counter_id, number_calc, number_plomb, owner, adress, object, type, power, phone, message) " + str;
  pool.getConnection(function (err, connection) {
    connection.query(sql3, function (err) {
      if (err) {
        bot.sendMessage(chatId, "Что то пошло не так...");
        throw err;
      } else {
        bot.sendMessage(chatId, "Счетчик добавлен в базу данных.");
      }
    });
    connection.release();
  });
}

function create_users_db(chatId) {
  let sql2 = "CREATE TABLE users " + "(user_id VARCHAR(255), " + "request_status VARCHAR(255), " + "request_count VARCHAR(250), " + "admin VARCHAR(20)," + "Id INT not null AUTO_INCREMENT, " + " PRIMARY KEY (Id))";
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

function turncate_users_db(msg) {
  let sql2 = "TRUNCATE TABLE users";
  pool.getConnection(function (err, connection) {
    connection.query(sql2, function (err) {
      if (err) {
        bot.sendMessage(msg.chat.id, "Что то пошло не так...2");
        throw err;
      } else {
        bot.sendMessage(msg.chat.id, "База пользователей очищена.");
        let sql3 = "Insert into users (user_id, request_status,request_count, admin) Values ('" + msg.from.id + "','-','0','true')";
        connection.query(sql3, function (err) {
          if (err) {
            bot.sendMessage(msg.chat.id, "Что то пошло не так...2");
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

function turncate_counters_db(msg) {
  let sql2 = "TRUNCATE TABLE countersInfo";
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
  get_user(list.user_id, function (list) {// bot.sendMessage(chatId, "Пользователь уже есть в базе данных.");
  }, function () {
    let str = "Values ('" + list.user_id + "','" + list.request_status + "', '0', '" + list.admin + "')";
    let sql3 = "Insert into users (user_id, request_status, request_count, admin) " + str;
    pool.getConnection(function (err, connection) {
      connection.query(sql3, function (err) {});
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
            "admin": results[0].admin,
            "user_id": results[0].user_id,
            "request_count": results[0].request_count,
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
            "admin": results[0].admin,
            "user_id": results[0].user_id,
            "request_count": results[0].request_count,
            "request_status": results[0].request_status
          };
          callback1();
        }
      }
    });
    connection.release();

    if (error) {
      callback2();
    }
  });
}

function show_user(msg, userId) {
  let chatId = msg.chat.id;
  let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
  pool.getConnection(function (error, connection) {
    connection.query(sql4, function (err, results) {
      if (err) {
        bot.sendMessage(chatId, "Пользователя нет в базе данных");
      } else {
        if (results.length == 0) {
          bot.sendMessage(chatId, "Пользователя нет в базе данных");
        } else {
          let list = {
            "admin": results[0].admin,
            "user_id": results[0].user_id,
            "request_count": results[0].request_count,
            "request_status": results[0].request_status
          };
          bot.sendMessage(chatId, "Админ: <b>" + list.admin + "</b> \nID: <b>" + list.user_id + "</b> \nКоличество запросов: <b>" + list.request_count + "</b> \nСтатус запроса: <b>" + list.request_status + "</b>", {
            parse_mode: "HTML"
          });
        }
      }
    });
    connection.release();

    if (error) {
      bot.sendMessage(chatId, "Пользователя нет в базе данных");
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
                "admin": results[k].admin,
                "user_id": results[k].user_id,
                "request_count": results[k].request_count,
                "request_status": results[k].request_status
              };
              bot.sendMessage(chatId, "Админ: <b>" + list.admin + "</b> \nID: <b>" + list.user_id + "</b> \nКоличество запросов: <b>" + list.request_count + "</b> \nСтатус запроса: <b>" + list.request_status + "</b>", {
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

function set_userStatus(msg, userId, status) {
  let chatId = msg.chat.id;

  try {
    let sql4 = "UPDATE users SET request_status = '" + status + "' WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
      connection.query(sql4, function (err, results) {
        if (err) {
          // bot.sendMessage(chatId, "Что то пошло не так.");
          return false;
        } else {
          // bot.sendMessage(chatId, "Статус успешно изменен.");
          return true;
        }
      });
      connection.release();

      if (error) {// bot.sendMessage(chatId, "Что то пошло не так.");
      }
    });
  } catch (err) {// bot.sendMessage(chatId, "Что то пошло не так.");
  }
}

function adminFilter(userId, callback) {
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
            "admin": results[0].admin,
            "user_id": results[0].user_id,
            "request_count": results[0].request_count,
            "request_status": results[0].request_status
          };

          if (list.admin == "true") {
            callback(list);
          } else {}
        }
      }
    });
  });
}

function set_userAdmin(msg, userId) {
  let chatId = msg.chat.id;

  try {
    let sql5 = "UPDATE users SET admin = 'true' WHERE user_id = '" + userId + "'";
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

function buttons(chatId, userInput, coll, page, allPages) {
  var txtData = chatId + "--" + userInput + "--" + coll + "--";

  function nullFunc() {
    return true;
  }

  if (allPages > 1) {
    if (page == 1) {
      var resultButtons = {
        parse_mode: 'HTML',
        caption: "",
        reply_markup: JSON.stringify({
          inline_keyboard: [[{
            text: 'Следующая страница',
            callback_data: txtData + (+page + 1)
          }]]
        })
      };
    } else if (page == allPages) {
      var resultButtons = {
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [[{
            text: 'Предыдущая страница',
            callback_data: txtData + (+page - 1)
          }]]
        })
      };
    } else {
      var resultButtons = {
        parse_mode: 'HTML',
        reply_markup: JSON.stringify({
          inline_keyboard: [[{
            text: 'Предыдущая страница',
            callback_data: txtData + (+page - 1)
          }], [{
            text: 'Следующая страница',
            callback_data: txtData + (+page + 1)
          }]]
        })
      };
    }
  } else {
    var resultButtons = {
      parse_mode: 'HTML'
    };
  }

  sendTime(0.02, chatId, "Страница " + page + " из " + allPages, {});
  return resultButtons;
}

function getFromBD(chatId, userInput, coll, page) {
  var message,
      filter = coll;

  if (coll == "counter_id") {
    message = "Счетчика с номером ";
  } else if (coll == "number_plomb") {
    message = "Счетчика с номером пломбы ";
  } else if (coll == "owner") {
    message = "Счетчика с владельцем ";
  } else if (coll == "number_calc") {
    message = "Счетчика с расчетным счетом ";
  } // var userId = msg.from.id;


  try {
    // var sql4 = "SELECT * FROM countersInfo WHERE " + coll + " LIKE '%" + match[1] + "%'" + ' LIMIT ' + page + ', ' + (page+10);
    var sql4 = "SELECT * FROM countersInfo WHERE " + coll + " LIKE '%" + userInput + "%'" + ' ORDER BY ' + filter;
    pool.getConnection(function (error, connection) {
      connection.query(sql4, function (err, results) {
        var allPages = Math.ceil(results.length / 10);

        if (results.slice((page - 1) * 10).length > 9) {
          results = results.slice((page - 1) * 10, page * 10 + 9);
        } else {
          results = results.slice((page - 1) * 10);
        }

        if (err) {
          bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
        } else {
          if (results.length == 0) {
            bot.sendMessage(chatId, message + "<b>" + userInput + "</b> в базе данных нету.", {
              parse_mode: "HTML"
            });
          } else {
            for (var k = 0; k < results.length && k < 10; k++) {
              var countersInfoMessage = "<b>Номер счетчика:</b> " + results[k].counter_id + " \n<b>Расчетный счет:</b> " + results[k].number_calc + "\n<b>Номер пломбы:</b> " + results[k].number_plomb + " \n<b>Владелец:</b> " + results[k].owner + "\n<b>Адрес:</b> " + results[k].adress + "\n<b>Объект:</b> " + results[k].object + "\n<b>Тип счетчика:</b> " + results[k].type + "\n<b>Мощность:</b> " + results[k].power + "\n<b>Телефон:</b> " + results[k].phone + "\n<b>Комментарий:</b> ";

              if (k == results.length - 1 && results.length < 11 || k == 9 && results.length > 10) {
                var buttonsOptions = buttons(chatId, userInput, coll, page, allPages);
                sendTime(0.02, chatId, countersInfoMessage, buttonsOptions);
              } else {
                buttonsOptions = {
                  parse_mode: 'HTML'
                };
                bot.sendMessage(chatId, countersInfoMessage, buttonsOptions);
              } // bot.sendMessage(chatId, JSON.stringify(buttonsOptions) + " ", buttonsOptions);

            }
          }
        }
      });
      connection.release();

      if (error) {
        bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
      }
    });
  } catch (err) {
    bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
  }
}

bot.on('callback_query', function (callbackQuery) {
  const message = callbackQuery.message;
  const txtData = callbackQuery.data.split("--"); // bot.sendMessage(message.chat.id, text);
  // var txtData = chatId + "_" + userInput + "_" + coll + "_" + (page+1);

  var chatId = txtData[0],
      userInput = txtData[1],
      coll = txtData[2],
      page = txtData[3];
  getFromBD(chatId, userInput, coll, page);
}); //Команды админа

bot.on('document', function (msg) {
  try {
    let fileID = msg.document.file_id;
    let file = bot.getFile(fileID);
    var extension;
    file.then(function (result) {
      extension = result.file_path.split(".")[result.file_path.split(".").length - 1];

      if (extension == "csv") {
        bot.sendMessage(msg.chat.id, "Пробую загрузить новый данные в базу...");
        const fileStream = bot.getFileStream(fileID);
        var csvData = [];
        var csvStream = fastcsv.parse({
          delimiter: ';'
        }).on("data", function (data) {
          csvData.push(data);
        }).on("end", function () {
          // remove the first line: headergo
          csvData.shift();
          var query = "INSERT INTO countersinfo (counter_id, number_calc, number_plomb, owner, adress, object, type, power, phone, message) VALUES ?";
          pool.getConnection(function (err, connection) {
            connection.query(query, [csvData], function (error, response) {
              if (!error) {
                bot.sendMessage(msg.chat.id, "Данные успешно загружены!");
              } else {
                const how_saveExcel = {
                  reply_markup: {
                    inline_keyboard: [[{
                      text: 'Как правильно сохранить файл Excel для импорта в базу.',
                      callback_data: 'saveGide'
                    }]]
                  }
                };
                bot.sendMessage(msg.chat.id, "Во время загрузки произошла ошибка, возможно вы не верно сохранили файл в Excel.", how_saveExcel);
                bot.on("callback_query", function onCallbackQuery(callbackQuery) {
                  bot.sendPhoto(msg.chat.id, "https://github.com/SmKostya/InfoBot/blob/master/img/gideSaveFileInCSV.jpg?raw=true");
                  bot.sendMessage(msg.chat.id, "Файл -> Сохранить как -> Тип файла -> CSV(разделители - запятые)");
                });
              }
            });
            connection.release();
          });
        });
        fileStream.pipe(csvStream);
        next();
      } else {
        bot.sendMessage(msg.chat.id, "." + extension);
      }
    });
  } catch (err) {
    bot.sendMessage(msg.chat.id, "Что-то пошло не так." + err);
  }
});
bot.onText(/(.+)/, function (msg, match) {
  let text = match[0];
  var chatId = msg.chat.id;
  let commands = ["/start", "тест", "Владелец", "showUsers", "Номер счетчика", "Номер пломбы", "Расчетный счет", "Помощь", "Очистить базу счетчиков", "Очистить базу пользователей", "/myID", "Дать права администратора", "админ", "Админ", "Admin", "admin", "/help", "/Help", "help", "Help", "помощь", "/Помощь", "/помощь"];
  let keyboards = ["Владелец", "Номер счетчика", "Номер пломбы", "Расчетный счет", "Дать права администратора"];

  if (!commands.includes(text)) {
    get_user(msg.from.id, function (list) {
      let status = list.request_status;

      switch (status) {
        case "-":
          bot.sendMessage(chatId, "Сначала выберите что искать.", menu);
          break;

        case "Владелец":
          getFromBD(msg.chat.id, text, "owner", 1);
          set_userStatus(msg, msg.from.id, "-");
          break;

        case "Номер счетчика":
          getFromBD(msg.chat.id, text, "counter_id", 1);
          set_userStatus(msg, msg.from.id, "-");
          break;

        case "Номер пломбы":
          getFromBD(msg.chat.id, text, "number_plomb", 1);
          set_userStatus(msg, msg.from.id, "-");
          break;

        case "Расчетный счет":
          getFromBD(msg.chat.id, text, "number_calc", 1);
          set_userStatus(msg, msg.from.id, "-");
          break;

        case "Дать права администратора":
          adminFilter(msg.from.id, function () {
            set_userAdmin(msg, text);
          });
          set_userStatus(msg, msg.from.id, "-");
          break;

        default:
          // bot.sendMessage(chatId, "Нема такого"); 
          break;
      }
    });
  } else if (keyboards.includes(text)) {
    set_userStatus(msg, msg.from.id, text);

    switch (text) {
      case "Номер счетчика":
        bot.sendMessage(chatId, "Введите номер счетчика.");
        break;

      case "Номер пломбы":
        bot.sendMessage(chatId, "Введите номер пломбы.");
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
bot.onText(/Очистить базу счетчиков/, function (msg) {
  var chatId = msg.chat.id;

  try {
    adminFilter(msg.from.id, function () {
      turncate_counters_db(msg);
    });
  } catch (err) {}
});
bot.onText(/Очистить базу пользователей/, function (msg) {
  try {
    adminFilter(msg.from.id, function () {
      turncate_users_db(msg);
    });
  } catch (err) {}
});
bot.onText(/\/myID/, function (msg) {
  bot.sendMessage(msg.chat.id, "Ваш ID:" + msg.from.id);
});
bot.onText(/admin/, function (msg) {
  var chatId = msg.chat.id;

  try {
    adminFilter(msg.from.id, function () {
      bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
    });
  } catch (err) {}
}); // bot.onText(/addCounterDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         create_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/deleteCounterDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         delete_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/addUsersDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         create_users_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/deleteUsersDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         delete_users_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/clearCounters/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         turncate_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/clearUsers/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         turncate_users_db(msg);
//     } catch (err) {}
// });
// bot.onText(/setStatus (.+)__(.+)/, function (msg, match) {
//     var userId = match[1], status = match[2];
//     set_userStatus(msg, userId, status);
// });
// bot.onText(/setAdmin (.+)/, function (msg, match) {
//     var userId = match[1];
//     set_userAdmin(msg, userId);
// });

bot.onText(/showUsers/, function (msg, match) {
  get_allUsers(msg.chat.id);
}); // bot.onText(/showUser (.+)/, function (msg, match) {
//     show_user(msg, match[1]);
// });
// Нуждаются в доработке

bot.onText(/\/start/, function (msg) {
  var newUser = {
    "user_id": msg.from.id,
    "request_status": "-",
    "request_count": "0",
    "admin": "false"
  };
  add_user(newUser);
  bot.sendMessage(msg.chat.id, helpMessage, menu);
}); //Разработка

bot.on("photo", function (msg) {
  try {
    var photoId = msg.photo[msg.photo.length - 1].file_id;
    const file = bot.getFile(photoId);
    file.then(function (result) {
      console.log(result);
    });
  } catch (err) {
    console.log(err);
  }
});
let helpMessage = "С помощью этого справочника вы сможете найти данные по нужному счетчику.\n" + "Выберите параметр для поиска и введите искомое значение.\n" + "Запрос в поиске можно писать не полностью и не с начала.";
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
    adminFilter(msg.from.id, function () {
      bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
    });
  } catch (err) {}
});
bot.onText(/Админ/, function (msg) {
  var chatId = msg.chat.id;

  try {
    adminFilter(msg.from.id, function () {
      bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
    });
  } catch (err) {}
});
bot.onText(/админ/, function (msg) {
  var chatId = msg.chat.id;

  try {
    adminFilter(msg.from.id, function () {
      bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
    });
  } catch (err) {}
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9nby5qcyJdLCJuYW1lcyI6WyJUZWxlZ3JhbUJvdCIsInJlcXVpcmUiLCJmYXN0Y3N2IiwibXlzcWwiLCJleHByZXNzIiwic2NoZWR1bGUiLCJ0b2tlbiIsImJvdCIsInBvbGxpbmciLCJQT1JUIiwiYXBwIiwicG9vbCIsImNyZWF0ZVBvb2wiLCJjb25uZWN0aW9uTGltaXQiLCJkYXRhYmFzZSIsImhvc3QiLCJ1c2VyIiwicGFzc3dvcmQiLCJjaGFyc2V0IiwiZGVidWciLCJsaXN0ZW4iLCJjb25zb2xlIiwibG9nIiwic2VuZFRpbWUiLCJ0aW1lIiwiY2hhdElkIiwidGV4dCIsIm9wdGlvbnMiLCJzY2hlZHVsZUpvYiIsInN0YXJ0IiwiRGF0ZSIsIm5vdyIsIk51bWJlciIsImVuZCIsInJ1bGUiLCJzZW5kTWVzc2FnZSIsIm1lbnUiLCJwYXJzZV9tb2RlIiwicmVwbHlfbWFya3VwIiwicmVzaXplX2tleWJvYXJkIiwib25lX3RpbWVfa2V5Ym9hcmQiLCJrZXlib2FyZCIsImFkbWluTWVudSIsImRlbGV0ZV9jb3VudGVyc19kYiIsInNxbDEiLCJnZXRDb25uZWN0aW9uIiwiZXJyIiwiY29ubmVjdGlvbiIsInF1ZXJ5IiwicmVsZWFzZSIsImNyZWF0ZV9jb3VudGVyc19kYiIsInNxbDIiLCJhZGRfY291bnRlciIsImxpc3QiLCJsZW5ndGgiLCJuIiwic3RyIiwiaSIsInNxbDMiLCJjcmVhdGVfdXNlcnNfZGIiLCJ0dXJuY2F0ZV91c2Vyc19kYiIsIm1zZyIsImNoYXQiLCJpZCIsImZyb20iLCJ0dXJuY2F0ZV9jb3VudGVyc19kYiIsImFkZF91c2VyIiwiZ2V0X3VzZXIiLCJ1c2VyX2lkIiwicmVxdWVzdF9zdGF0dXMiLCJhZG1pbiIsInVzZXJJZCIsImNhbGxiYWNrMSIsImNhbGxiYWNrMiIsInNxbDQiLCJlcnJvciIsInJlc3VsdHMiLCJyZXF1ZXN0X2NvdW50IiwiZ2V0X3N0YXR1cyIsInNob3dfdXNlciIsImdldF9hbGxVc2VycyIsImsiLCJzZXRfdXNlclN0YXR1cyIsInN0YXR1cyIsImFkbWluRmlsdGVyIiwiY2FsbGJhY2siLCJzZXRfdXNlckFkbWluIiwic3FsNSIsImJ1dHRvbnMiLCJ1c2VySW5wdXQiLCJjb2xsIiwicGFnZSIsImFsbFBhZ2VzIiwidHh0RGF0YSIsIm51bGxGdW5jIiwicmVzdWx0QnV0dG9ucyIsImNhcHRpb24iLCJKU09OIiwic3RyaW5naWZ5IiwiaW5saW5lX2tleWJvYXJkIiwiY2FsbGJhY2tfZGF0YSIsImdldEZyb21CRCIsIm1lc3NhZ2UiLCJmaWx0ZXIiLCJNYXRoIiwiY2VpbCIsInNsaWNlIiwiY291bnRlcnNJbmZvTWVzc2FnZSIsImNvdW50ZXJfaWQiLCJudW1iZXJfY2FsYyIsIm51bWJlcl9wbG9tYiIsIm93bmVyIiwiYWRyZXNzIiwib2JqZWN0IiwidHlwZSIsInBvd2VyIiwicGhvbmUiLCJidXR0b25zT3B0aW9ucyIsIm9uIiwiY2FsbGJhY2tRdWVyeSIsImRhdGEiLCJzcGxpdCIsImZpbGVJRCIsImRvY3VtZW50IiwiZmlsZV9pZCIsImZpbGUiLCJnZXRGaWxlIiwiZXh0ZW5zaW9uIiwidGhlbiIsInJlc3VsdCIsImZpbGVfcGF0aCIsImZpbGVTdHJlYW0iLCJnZXRGaWxlU3RyZWFtIiwiY3N2RGF0YSIsImNzdlN0cmVhbSIsInBhcnNlIiwiZGVsaW1pdGVyIiwicHVzaCIsInNoaWZ0IiwicmVzcG9uc2UiLCJob3dfc2F2ZUV4Y2VsIiwib25DYWxsYmFja1F1ZXJ5Iiwic2VuZFBob3RvIiwicGlwZSIsIm5leHQiLCJvblRleHQiLCJtYXRjaCIsImNvbW1hbmRzIiwia2V5Ym9hcmRzIiwiaW5jbHVkZXMiLCJuZXdVc2VyIiwiaGVscE1lc3NhZ2UiLCJwaG90b0lkIiwicGhvdG8iXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSUEsV0FBVyxHQUFHQyxPQUFPLENBQUMsdUJBQUQsQ0FBekI7O0FBQ0EsSUFBSUMsT0FBTyxHQUFHRCxPQUFPLENBQUMsVUFBRCxDQUFyQjs7QUFDQSxJQUFJRSxLQUFLLEdBQUdG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RCxDQUlFLE9BQU9JLEdBQVAsRUFBWSxDQUFFO0FBQ25CLENBUEQiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVGVsZWdyYW1Cb3QgPSByZXF1aXJlKCdub2RlLXRlbGVncmFtLWJvdC1hcGknKTtcclxudmFyIGZhc3Rjc3YgPSByZXF1aXJlKFwiZmFzdC1jc3ZcIik7XHJcbnZhciBteXNxbCA9IHJlcXVpcmUoJ215c3FsJyk7XHJcbnZhciBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xyXG5jb25zdCBzY2hlZHVsZSA9IHJlcXVpcmUoJ25vZGUtc2NoZWR1bGUnKTtcclxuXHJcbnZhciB0b2tlbiA9ICcxMDM5NDE2MDA5OkFBRXk2a3NzUmIwSkpGa2gyUmZuZEFHaWIyMGpPc3ZycjJRJztcclxudmFyIGJvdCA9IG5ldyBUZWxlZ3JhbUJvdCh0b2tlbiwge1xyXG4gICAgcG9sbGluZzogdHJ1ZVxyXG59KTtcclxuXHJcbnZhciBQT1JUID0gMzMwNjtcclxuXHJcbnZhciBhcHAgPSBleHByZXNzKCk7XHJcbnZhciBwb29sID0gbXlzcWwuY3JlYXRlUG9vbCh7XHJcbiAgICBjb25uZWN0aW9uTGltaXQ6IDEwMCxcclxuICAgIGRhdGFiYXNlOiAnaGVyb2t1XzI5ZjVjNGNhNmYzYjI3ZCcsXHJcbiAgICBob3N0OiAndXMtY2Rici1pcm9uLWVhc3QtMDUuY2xlYXJkYi5uZXQnLFxyXG4gICAgdXNlcjogJ2I4ZmY3ZDJkZGY4NjkxJyxcclxuICAgIHBhc3N3b3JkOiAnZGQyNmFhZjcnLFxyXG4gICAgY2hhcnNldDogJ3V0ZjhfZ2VuZXJhbF9jaScsXHJcbiAgICBkZWJ1ZzogJ2ZhbHNlJ1xyXG59KTtcclxuYXBwLmxpc3RlbihQT1JULCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZygnU2VydmVyIGlzIHJ1bm5pbmcgb24gcG9ydCAnICsgUE9SVCk7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gc2VuZFRpbWUodGltZSwgY2hhdElkLCB0ZXh0LCBvcHRpb25zKSB7XHJcbiAgICBuZXcgc2NoZWR1bGUuc2NoZWR1bGVKb2Ioe1xyXG4gICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgTnVtYmVyKHRpbWUpICogMTAwMCAqIDYwKSxcclxuICAgICAgICBlbmQ6IG5ldyBEYXRlKG5ldyBEYXRlKERhdGUubm93KCkgKyBOdW1iZXIodGltZSkgKiAxMDAwICogNjAgKyAxMDAwKSksXHJcbiAgICAgICAgcnVsZTogJyovMSAqICogKiAqIConXHJcbiAgICB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgdGV4dCwgb3B0aW9ucyk7XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIG1lbnUgPSB7XHJcbiAgICBwYXJzZV9tb2RlOiBcIkhUTUxcIixcclxuICAgIHJlcGx5X21hcmt1cDoge1xyXG4gICAgICAgIHJlc2l6ZV9rZXlib2FyZDogdHJ1ZSxcclxuICAgICAgICBvbmVfdGltZV9rZXlib2FyZDogdHJ1ZSxcclxuICAgICAgICBrZXlib2FyZDogW1xyXG4gICAgICAgICAgICBbXCLQktC70LDQtNC10LvQtdGGXCIsIFwi0J3QvtC80LXRgCDRgdGH0LXRgtGH0LjQutCwXCJdLFxyXG4gICAgICAgICAgICBbXCLQndC+0LzQtdGAINC/0LvQvtC80LHRi1wiLCBcItCg0LDRgdGH0LXRgtC90YvQuSDRgdGH0LXRglwiXSxcclxuICAgICAgICAgICAgW1wi0J/QvtC80L7RidGMXCJdXHJcbiAgICAgICAgXVxyXG4gICAgfVxyXG59O1xyXG52YXIgYWRtaW5NZW51ID0ge1xyXG4gICAgcGFyc2VfbW9kZTogXCJIVE1MXCIsXHJcbiAgICByZXBseV9tYXJrdXA6IHtcclxuICAgICAgICByZXNpemVfa2V5Ym9hcmQ6IHRydWUsXHJcbiAgICAgICAgb25lX3RpbWVfa2V5Ym9hcmQ6IHRydWUsXHJcbiAgICAgICAga2V5Ym9hcmQ6IFtcclxuICAgICAgICAgICAgW1wi0J7Rh9C40YHRgtC40YLRjCDQsdCw0LfRgyDRgdGH0LXRgtGH0LjQutC+0LJcIl0sIFxyXG4gICAgICAgICAgICBbXCLQntGH0LjRgdGC0LjRgtGMINCx0LDQt9GDINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5XCIsIFwi0JTQsNGC0Ywg0L/RgNCw0LLQsCDQsNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgNCwXCJdXHJcbiAgICAgICAgXVxyXG4gICAgfVxyXG59O1xyXG5cclxuXHJcbmZ1bmN0aW9uIGRlbGV0ZV9jb3VudGVyc19kYihjaGF0SWQpIHtcclxuICAgIHZhciBzcWwxID0gXCJEUk9QIFRBQkxFIElGIEVYSVNUUyBjb3VudGVyc0luZm9cIjtcclxuICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWwxLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0KfRgtC+INGC0L4g0L/QvtGI0LvQviDQvdC1INGC0LDQui4uLlwiKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0JHQsNC30LAg0LTQsNC90L3Ri9GFINGD0YHQv9C10YjQvdC+INGD0LTQsNC70LXQvdCwLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZV9jb3VudGVyc19kYihjaGF0SWQpIHtcclxuICAgIGxldCBzcWwyID0gXCJDUkVBVEUgVEFCTEUgY291bnRlcnNJbmZvIFwiICtcclxuICAgICAgICBcIihjb3VudGVyX2lkIFZBUkNIQVIoMjU1KSwgXCIgK1xyXG4gICAgICAgIFwibnVtYmVyX2NhbGMgVkFSQ0hBUigyNTApLCBcIiArXHJcbiAgICAgICAgXCJudW1iZXJfcGxvbWIgVkFSQ0hBUigyNTApLCBcIiArXHJcbiAgICAgICAgXCJvd25lciBWQVJDSEFSKDI1MCksIFwiICtcclxuICAgICAgICBcImFkcmVzcyBWQVJDSEFSKDI1MCksIFwiICtcclxuICAgICAgICBcIm9iamVjdCBWQVJDSEFSKDI1MCksIFwiICtcclxuICAgICAgICBcInR5cGUgVkFSQ0hBUigyNTApLCBcIiArXHJcbiAgICAgICAgXCJwb3dlciBWQVJDSEFSKDI1MCksIFwiICtcclxuICAgICAgICBcInBob25lIFZBUkNIQVIoMjUwKSwgXCIgK1xyXG4gICAgICAgIFwibWVzc2FnZSBWQVJDSEFSKDI1MCksIFwiICtcclxuICAgICAgICBcIklkIElOVCBub3QgbnVsbCBBVVRPX0lOQ1JFTUVOVCwgXCIgK1xyXG4gICAgICAgIFwiIFBSSU1BUlkgS0VZIChJZCkpXCI7XHJcbiAgICBwb29sLmdldENvbm5lY3Rpb24oZnVuY3Rpb24gKGVyciwgY29ubmVjdGlvbikge1xyXG4gICAgICAgIGNvbm5lY3Rpb24ucXVlcnkoc3FsMiwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCn0YLQviDRgtC+INC/0L7RiNC70L4g0L3QtSDRgtCw0LouLi5cIik7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCR0LDQt9CwINC00LDQvdC90YvRhSDRg9GB0L/QtdGI0L3QviDRgdC+0LfQtNCw0L3QsC5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRfY291bnRlcihsaXN0KSB7XHJcbiAgICBpZiAobGlzdC5sZW5ndGggPCAxMCkge1xyXG4gICAgICAgIGZvciAobGV0IG4gPSBsaXN0Lmxlbmd0aDsgbiA8IDEwOyBuKyspIHtcclxuICAgICAgICAgICAgbGlzdFtuXSA9IFwiLVwiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGxldCBzdHIgPSBcIlZhbHVlcyAoJ1wiO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgIHN0ciArPSBsaXN0W2ldICsgXCInLCdcIjtcclxuICAgIH1cclxuICAgIHN0ciArPSBsaXN0W2xpc3QubGVuZ3RoIC0gMV0gKyBcIicpXCI7XHJcbiAgICBsZXQgc3FsMyA9IFwiSW5zZXJ0IGludG8gY291bnRlcnNJbmZvIChjb3VudGVyX2lkLCBudW1iZXJfY2FsYywgbnVtYmVyX3Bsb21iLCBvd25lciwgYWRyZXNzLCBvYmplY3QsIHR5cGUsIHBvd2VyLCBwaG9uZSwgbWVzc2FnZSkgXCIgKyBzdHI7XHJcblxyXG4gICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnIsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDMsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQp9GC0L4g0YLQviDQv9C+0YjQu9C+INC90LUg0YLQsNC6Li4uXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQodGH0LXRgtGH0LjQuiDQtNC+0LHQsNCy0LvQtdC9INCyINCx0LDQt9GDINC00LDQvdC90YvRhS5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVfdXNlcnNfZGIoY2hhdElkKSB7XHJcbiAgICBsZXQgc3FsMiA9IFwiQ1JFQVRFIFRBQkxFIHVzZXJzIFwiICtcclxuICAgICAgICBcIih1c2VyX2lkIFZBUkNIQVIoMjU1KSwgXCIgK1xyXG4gICAgICAgIFwicmVxdWVzdF9zdGF0dXMgVkFSQ0hBUigyNTUpLCBcIiArXHJcbiAgICAgICAgXCJyZXF1ZXN0X2NvdW50IFZBUkNIQVIoMjUwKSwgXCIgK1xyXG4gICAgICAgIFwiYWRtaW4gVkFSQ0hBUigyMCksXCIgK1xyXG4gICAgICAgIFwiSWQgSU5UIG5vdCBudWxsIEFVVE9fSU5DUkVNRU5ULCBcIiArXHJcbiAgICAgICAgXCIgUFJJTUFSWSBLRVkgKElkKSlcIjtcclxuICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWwyLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0KfRgtC+INGC0L4g0L/QvtGI0LvQviDQvdC1INGC0LDQui4uLlwiKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0JHQsNC30LAg0LTQsNC90L3Ri9GFINGD0YHQv9C10YjQvdC+INGB0L7Qt9C00LDQvdCwLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR1cm5jYXRlX3VzZXJzX2RiKG1zZykge1xyXG5cclxuICAgIGxldCBzcWwyID0gXCJUUlVOQ0FURSBUQUJMRSB1c2Vyc1wiO1xyXG4gICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnIsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDIsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcItCn0YLQviDRgtC+INC/0L7RiNC70L4g0L3QtSDRgtCw0LouLi4yXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcItCR0LDQt9CwINC/0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INC+0YfQuNGJ0LXQvdCwLlwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBzcWwzID0gXCJJbnNlcnQgaW50byB1c2VycyAodXNlcl9pZCwgcmVxdWVzdF9zdGF0dXMscmVxdWVzdF9jb3VudCwgYWRtaW4pIFZhbHVlcyAoJ1wiICsgbXNnLmZyb20uaWQgKyBcIicsJy0nLCcwJywndHJ1ZScpXCI7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDMsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShtc2cuY2hhdC5pZCwgXCLQp9GC0L4g0YLQviDQv9C+0YjQu9C+INC90LUg0YLQsNC6Li4uMlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShtc2cuY2hhdC5pZCwgXCLQkNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgCDQtNC+0LHQsNCy0LvQtdC9LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHR1cm5jYXRlX2NvdW50ZXJzX2RiKG1zZykge1xyXG4gICAgbGV0IHNxbDIgPSBcIlRSVU5DQVRFIFRBQkxFIGNvdW50ZXJzSW5mb1wiO1xyXG4gICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnIsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDIsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcItCn0YLQviDRgtC+INC/0L7RiNC70L4g0L3QtSDRgtCw0LouLi5cIik7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIFwi0JHQsNC30LAg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0L7Rh9C40YnQtdC90LAuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5yZWxlYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBhZGRfdXNlcihsaXN0KSB7XHJcblxyXG4gICAgZ2V0X3VzZXIobGlzdC51c2VyX2lkLCBmdW5jdGlvbihsaXN0KXtcclxuICAgICAgICAvLyBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjCDRg9C20LUg0LXRgdGC0Ywg0LIg0LHQsNC30LUg0LTQsNC90L3Ri9GFLlwiKTtcclxuICAgIH0sXHJcbiAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgIGxldCBzdHIgPSBcIlZhbHVlcyAoJ1wiICsgbGlzdC51c2VyX2lkICsgXCInLCdcIiArIGxpc3QucmVxdWVzdF9zdGF0dXMgKyBcIicsICcwJywgJ1wiICsgbGlzdC5hZG1pbiArIFwiJylcIjtcclxuICAgICAgICBsZXQgc3FsMyA9IFwiSW5zZXJ0IGludG8gdXNlcnMgKHVzZXJfaWQsIHJlcXVlc3Rfc3RhdHVzLCByZXF1ZXN0X2NvdW50LCBhZG1pbikgXCIgKyBzdHI7XHJcbiAgICAgICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnIsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWwzLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRfdXNlcih1c2VySWQsIGNhbGxiYWNrMSwgY2FsbGJhY2syKSB7XHJcbiAgICBsZXQgc3FsNCA9IFwiU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSB1c2VyX2lkID0gJ1wiICsgdXNlcklkICsgXCInXCI7XHJcbiAgICBwb29sLmdldENvbm5lY3Rpb24oZnVuY3Rpb24gKGVycm9yLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWw0LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrMigpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazIoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRtaW5cIjogcmVzdWx0c1swXS5hZG1pbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyX2lkXCI6IHJlc3VsdHNbMF0udXNlcl9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X2NvdW50XCI6IHJlc3VsdHNbMF0ucmVxdWVzdF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X3N0YXR1c1wiOiByZXN1bHRzWzBdLnJlcXVlc3Rfc3RhdHVzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazEobGlzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5yZWxlYXNlKCk7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrMigpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0X3N0YXR1cyh1c2VySWQsIGNhbGxiYWNrMSwgY2FsbGJhY2syKSB7XHJcbiAgICBsZXQgc3FsNCA9IFwiU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSB1c2VyX2lkID0gJ1wiICsgdXNlcklkICsgXCInXCI7XHJcbiAgICBwb29sLmdldENvbm5lY3Rpb24oZnVuY3Rpb24gKGVycm9yLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgY29ubmVjdGlvbi5xdWVyeShzcWw0LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrMigpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazIoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRtaW5cIjogcmVzdWx0c1swXS5hZG1pbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyX2lkXCI6IHJlc3VsdHNbMF0udXNlcl9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X2NvdW50XCI6IHJlc3VsdHNbMF0ucmVxdWVzdF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X3N0YXR1c1wiOiByZXN1bHRzWzBdLnJlcXVlc3Rfc3RhdHVzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazEoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2syKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBzaG93X3VzZXIobXNnLCB1c2VySWQpIHtcclxuICAgIGxldCBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuICAgIGxldCBzcWw0ID0gXCJTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIHVzZXJfaWQgPSAnXCIgKyB1c2VySWQgKyBcIidcIjtcclxuICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyb3IsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDQsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQn9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0L3QtdGCINCyINCx0LDQt9C1INC00LDQvdC90YvRhVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQn9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0L3QtdGCINCyINCx0LDQt9C1INC00LDQvdC90YvRhVwiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRtaW5cIjogcmVzdWx0c1swXS5hZG1pbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyX2lkXCI6IHJlc3VsdHNbMF0udXNlcl9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X2NvdW50XCI6IHJlc3VsdHNbMF0ucmVxdWVzdF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X3N0YXR1c1wiOiByZXN1bHRzWzBdLnJlcXVlc3Rfc3RhdHVzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCQ0LTQvNC40L06IDxiPlwiICsgbGlzdC5hZG1pbiArIFwiPC9iPiBcXG5JRDogPGI+XCIgKyBsaXN0LnVzZXJfaWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjwvYj4gXFxu0JrQvtC70LjRh9C10YHRgtCy0L4g0LfQsNC/0YDQvtGB0L7QsjogPGI+XCIgKyBsaXN0LnJlcXVlc3RfY291bnQgKyBcIjwvYj4gXFxu0KHRgtCw0YLRg9GBINC30LDQv9GA0L7RgdCwOiA8Yj5cIiArIGxpc3QucmVxdWVzdF9zdGF0dXMgKyBcIjwvYj5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VfbW9kZTogXCJIVE1MXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5yZWxlYXNlKCk7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0J/QvtC70YzQt9C+0LLQsNGC0LXQu9GPINC90LXRgiDQsiDQsdCw0LfQtSDQtNCw0L3QvdGL0YVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRfYWxsVXNlcnMoY2hhdElkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCBzcWw0ID0gXCJTRUxFQ1QgKiBGUk9NIHVzZXJzXCI7XHJcbiAgICAgICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnJvciwgY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDQsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INCyINCx0LDQt9C1INC00LDQvdC90YvRhSDQvdC10YLRgy5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9tb2RlOiBcIkhUTUxcIlxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INCyINCx0LDQt9C1INC00LDQvdC90YvRhSDQvdC10YLRgy5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VfbW9kZTogXCJIVE1MXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCByZXN1bHRzLmxlbmd0aCAmJiBrIDwgMTA7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhZG1pblwiOiByZXN1bHRzW2tdLmFkbWluLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcl9pZFwiOiByZXN1bHRzW2tdLnVzZXJfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0X2NvdW50XCI6IHJlc3VsdHNba10ucmVxdWVzdF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVlc3Rfc3RhdHVzXCI6IHJlc3VsdHNba10ucmVxdWVzdF9zdGF0dXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCQ0LTQvNC40L06IDxiPlwiICsgbGlzdC5hZG1pbiArIFwiPC9iPiBcXG5JRDogPGI+XCIgKyBsaXN0LnVzZXJfaWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9iPiBcXG7QmtC+0LvQuNGH0LXRgdGC0LLQviDQt9Cw0L/RgNC+0YHQvtCyOiA8Yj5cIiArIGxpc3QucmVxdWVzdF9jb3VudCArIFwiPC9iPiBcXG7QodGC0LDRgtGD0YEg0LfQsNC/0YDQvtGB0LA6IDxiPlwiICsgbGlzdC5yZXF1ZXN0X3N0YXR1cyArIFwiPC9iPlwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCf0L7Qu9GM0LfQvtCy0LDRgtC10LvQtdC5INCyINCx0LDQt9C1INC00LDQvdC90YvRhSDQvdC10YLRgy5cIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0J/QvtC70YzQt9C+0LLQsNGC0LXQu9C10Lkg0LIg0LHQsNC30LUg0LTQsNC90L3Ri9GFINC90LXRgtGDLlwiLCB7XHJcbiAgICAgICAgICAgIHBhcnNlX21vZGU6IFwiSFRNTFwiXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldF91c2VyU3RhdHVzKG1zZywgdXNlcklkLCBzdGF0dXMpIHtcclxuICAgIGxldCBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgbGV0IHNxbDQgPSBcIlVQREFURSB1c2VycyBTRVQgcmVxdWVzdF9zdGF0dXMgPSAnXCIgKyBzdGF0dXMgK1wiJyBXSEVSRSB1c2VyX2lkID0gJ1wiICsgdXNlcklkICsgXCInXCI7XHJcbiAgICAgICAgcG9vbC5nZXRDb25uZWN0aW9uKGZ1bmN0aW9uIChlcnJvciwgY29ubmVjdGlvbikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDQsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCn0YLQviDRgtC+INC/0L7RiNC70L4g0L3QtSDRgtCw0LouXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQodGC0LDRgtGD0YEg0YPRgdC/0LXRiNC90L4g0LjQt9C80LXQvdC10L0uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xyXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIC8vIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0KfRgtC+INGC0L4g0L/QvtGI0LvQviDQvdC1INGC0LDQui5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAvLyBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCn0YLQviDRgtC+INC/0L7RiNC70L4g0L3QtSDRgtCw0LouXCIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhZG1pbkZpbHRlcih1c2VySWQsIGNhbGxiYWNrKXtcclxuICAgIGxldCBzcWw0ID0gXCJTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIHVzZXJfaWQgPSAnXCIgKyB1c2VySWQgKyBcIidcIjtcclxuICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyb3IsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICBjb25uZWN0aW9uLnF1ZXJ5KHNxbDQsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBsaXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFkbWluXCI6IHJlc3VsdHNbMF0uYWRtaW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidXNlcl9pZFwiOiByZXN1bHRzWzBdLnVzZXJfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWVzdF9jb3VudFwiOiByZXN1bHRzWzBdLnJlcXVlc3RfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWVzdF9zdGF0dXNcIjogcmVzdWx0c1swXS5yZXF1ZXN0X3N0YXR1c1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3QuYWRtaW4gPT0gXCJ0cnVlXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhsaXN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldF91c2VyQWRtaW4obXNnLCB1c2VySWQpIHtcclxuICAgIGxldCBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgc3FsNSA9IFwiVVBEQVRFIHVzZXJzIFNFVCBhZG1pbiA9ICd0cnVlJyBXSEVSRSB1c2VyX2lkID0gJ1wiICsgdXNlcklkICsgXCInXCI7XHJcbiAgICAgICAgICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyb3IsIGNvbm5lY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucXVlcnkoc3FsNSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQp9GC0L4g0YLQviDQv9C+0YjQu9C+INC90LUg0YLQsNC6LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0J/QvtC70YzQt9C+0LLQsNGC0LXQu9GOIElEOiBcIiArIHVzZXJJZCArIFwiINGD0YHQv9C10YjQvdC+INCy0YvQtNCw0L3RiyDQv9GA0LDQstCwINCw0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGA0LAuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0KfRgtC+INGC0L4g0L/QvtGI0LvQviDQvdC1INGC0LDQui5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQp9GC0L4g0YLQviDQv9C+0YjQu9C+INC90LUg0YLQsNC6LlwiKTtcclxuICAgICAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1dHRvbnMoY2hhdElkLCB1c2VySW5wdXQsIGNvbGwsIHBhZ2UsIGFsbFBhZ2VzKSB7XHJcbiAgICB2YXIgdHh0RGF0YSA9IGNoYXRJZCArIFwiLS1cIiArIHVzZXJJbnB1dCArIFwiLS1cIiArIGNvbGwgKyBcIi0tXCI7XHJcblxyXG4gICAgZnVuY3Rpb24gbnVsbEZ1bmMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoYWxsUGFnZXMgPiAxKSB7XHJcbiAgICAgICAgaWYgKHBhZ2UgPT0gMSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlc3VsdEJ1dHRvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZV9tb2RlOiAnSFRNTCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgcmVwbHlfbWFya3VwOiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lX2tleWJvYXJkOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAn0KHQu9C10LTRg9GO0YnQsNGPINGB0YLRgNCw0L3QuNGG0LAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZGF0YTogdHh0RGF0YSArICgrcGFnZSArIDEpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIGlmIChwYWdlID09IGFsbFBhZ2VzKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0QnV0dG9ucyA9IHtcclxuICAgICAgICAgICAgICAgIHBhcnNlX21vZGU6ICdIVE1MJyxcclxuICAgICAgICAgICAgICAgIHJlcGx5X21hcmt1cDogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgICAgIGlubGluZV9rZXlib2FyZDogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ9Cf0YDQtdC00YvQtNGD0YnQsNGPINGB0YLRgNCw0L3QuNGG0LAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZGF0YTogdHh0RGF0YSArICgrcGFnZSAtIDEpLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHRCdXR0b25zID0ge1xyXG4gICAgICAgICAgICAgICAgcGFyc2VfbW9kZTogJ0hUTUwnLFxyXG4gICAgICAgICAgICAgICAgcmVwbHlfbWFya3VwOiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5saW5lX2tleWJvYXJkOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAn0J/RgNC10LTRi9C00YPRidCw0Y8g0YHRgtGA0LDQvdC40YbQsCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhOiB0eHREYXRhICsgKCtwYWdlIC0gMSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ9Ch0LvQtdC00YPRjtGJ0LDRjyDRgdGC0YDQsNC90LjRhtCwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrX2RhdGE6IHR4dERhdGEgKyAoK3BhZ2UgKyAxKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdEJ1dHRvbnMgPSB7XHJcbiAgICAgICAgICAgIHBhcnNlX21vZGU6ICdIVE1MJ1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBzZW5kVGltZSgwLjAyLCBjaGF0SWQsIFwi0KHRgtGA0LDQvdC40YbQsCBcIiArIHBhZ2UgKyBcIiDQuNC3IFwiICsgYWxsUGFnZXMsIHt9KTtcclxuICAgIHJldHVybiByZXN1bHRCdXR0b25zO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGcm9tQkQoY2hhdElkLCB1c2VySW5wdXQsIGNvbGwsIHBhZ2UpIHtcclxuICAgIHZhciBtZXNzYWdlLCBmaWx0ZXIgPSBjb2xsO1xyXG4gICAgaWYgKGNvbGwgPT0gXCJjb3VudGVyX2lkXCIpIHtcclxuICAgICAgICBtZXNzYWdlID0gXCLQodGH0LXRgtGH0LjQutCwINGBINC90L7QvNC10YDQvtC8IFwiO1xyXG4gICAgfSBlbHNlIGlmIChjb2xsID09IFwibnVtYmVyX3Bsb21iXCIpIHtcclxuICAgICAgICBtZXNzYWdlID0gXCLQodGH0LXRgtGH0LjQutCwINGBINC90L7QvNC10YDQvtC8INC/0LvQvtC80LHRiyBcIjtcclxuICAgIH0gZWxzZSBpZiAoY29sbCA9PSBcIm93bmVyXCIpIHtcclxuICAgICAgICBtZXNzYWdlID0gXCLQodGH0LXRgtGH0LjQutCwINGBINCy0LvQsNC00LXQu9GM0YbQtdC8IFwiO1xyXG4gICAgfSBlbHNlIGlmIChjb2xsID09IFwibnVtYmVyX2NhbGNcIikge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBcItCh0YfQtdGC0YfQuNC60LAg0YEg0YDQsNGB0YfQtdGC0L3Ri9C8INGB0YfQtdGC0L7QvCBcIjtcclxuICAgIH1cclxuICAgIC8vIHZhciB1c2VySWQgPSBtc2cuZnJvbS5pZDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8gdmFyIHNxbDQgPSBcIlNFTEVDVCAqIEZST00gY291bnRlcnNJbmZvIFdIRVJFIFwiICsgY29sbCArIFwiIExJS0UgJyVcIiArIG1hdGNoWzFdICsgXCIlJ1wiICsgJyBMSU1JVCAnICsgcGFnZSArICcsICcgKyAocGFnZSsxMCk7XHJcbiAgICAgICAgdmFyIHNxbDQgPSBcIlNFTEVDVCAqIEZST00gY291bnRlcnNJbmZvIFdIRVJFIFwiICsgY29sbCArIFwiIExJS0UgJyVcIiArIHVzZXJJbnB1dCArIFwiJSdcIiArICcgT1JERVIgQlkgJyArIGZpbHRlcjtcclxuICAgICAgICBwb29sLmdldENvbm5lY3Rpb24oZnVuY3Rpb24gKGVycm9yLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ucXVlcnkoc3FsNCwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbFBhZ2VzID0gTWF0aC5jZWlsKHJlc3VsdHMubGVuZ3RoIC8gMTApO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMuc2xpY2UoKHBhZ2UgLSAxKSAqIDEwKS5sZW5ndGggPiA5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc2xpY2UoKHBhZ2UgLSAxKSAqIDEwLCBwYWdlICogMTAgKyA5KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc2xpY2UoKHBhZ2UgLSAxKSAqIDEwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBtZXNzYWdlICsgdXNlcklucHV0ICsgXCIg0LIg0LHQsNC30LUg0LTQsNC90L3Ri9GFINC90LXRgtGDLlwiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgbWVzc2FnZSArIFwiPGI+XCIgKyB1c2VySW5wdXQgKyBcIjwvYj4g0LIg0LHQsNC30LUg0LTQsNC90L3Ri9GFINC90LXRgtGDLlwiLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZV9tb2RlOiBcIkhUTUxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHJlc3VsdHMubGVuZ3RoICYmIGsgPCAxMDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY291bnRlcnNJbmZvTWVzc2FnZSA9IFwiPGI+0J3QvtC80LXRgCDRgdGH0LXRgtGH0LjQutCwOjwvYj4gXCIgKyByZXN1bHRzW2tdLmNvdW50ZXJfaWQgKyBcIiBcXG48Yj7QoNCw0YHRh9C10YLQvdGL0Lkg0YHRh9C10YI6PC9iPiBcIiArIHJlc3VsdHNba10ubnVtYmVyX2NhbGMgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXFxuPGI+0J3QvtC80LXRgCDQv9C70L7QvNCx0Ys6PC9iPiBcIiArIHJlc3VsdHNba10ubnVtYmVyX3Bsb21iICsgXCIgXFxuPGI+0JLQu9Cw0LTQtdC70LXRhjo8L2I+IFwiICsgcmVzdWx0c1trXS5vd25lciArIFwiXFxuPGI+0JDQtNGA0LXRgTo8L2I+IFwiICsgcmVzdWx0c1trXS5hZHJlc3MgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXFxuPGI+0J7QsdGK0LXQutGCOjwvYj4gXCIgKyByZXN1bHRzW2tdLm9iamVjdCArIFwiXFxuPGI+0KLQuNC/INGB0YfQtdGC0YfQuNC60LA6PC9iPiBcIiArIHJlc3VsdHNba10udHlwZSArIFwiXFxuPGI+0JzQvtGJ0L3QvtGB0YLRjDo8L2I+IFwiICsgcmVzdWx0c1trXS5wb3dlciArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcXG48Yj7QotC10LvQtdGE0L7QvTo8L2I+IFwiICsgcmVzdWx0c1trXS5waG9uZSArIFwiXFxuPGI+0JrQvtC80LzQtdC90YLQsNGA0LjQuTo8L2I+IFwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrID09IHJlc3VsdHMubGVuZ3RoIC0gMSAmJiByZXN1bHRzLmxlbmd0aCA8IDExIHx8IGsgPT0gOSAmJiByZXN1bHRzLmxlbmd0aCA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJ1dHRvbnNPcHRpb25zID0gYnV0dG9ucyhjaGF0SWQsIHVzZXJJbnB1dCwgY29sbCwgcGFnZSwgYWxsUGFnZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRUaW1lKDAuMDIsIGNoYXRJZCwgY291bnRlcnNJbmZvTWVzc2FnZSwgYnV0dG9uc09wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uc09wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlX21vZGU6ICdIVE1MJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgY291bnRlcnNJbmZvTWVzc2FnZSwgYnV0dG9uc09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgSlNPTi5zdHJpbmdpZnkoYnV0dG9uc09wdGlvbnMpICsgXCIgXCIsIGJ1dHRvbnNPcHRpb25zKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ucmVsZWFzZSgpO1xyXG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIG1lc3NhZ2UgKyB1c2VySW5wdXQgKyBcIiDQsiDQsdCw0LfQtSDQtNCw0L3QvdGL0YUg0L3QtdGC0YMuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgbWVzc2FnZSArIHVzZXJJbnB1dCArIFwiINCyINCx0LDQt9C1INC00LDQvdC90YvRhSDQvdC10YLRgy5cIik7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5ib3Qub24oJ2NhbGxiYWNrX3F1ZXJ5JywgZnVuY3Rpb24gKGNhbGxiYWNrUXVlcnkpIHtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSBjYWxsYmFja1F1ZXJ5Lm1lc3NhZ2U7XHJcbiAgICBjb25zdCB0eHREYXRhID0gY2FsbGJhY2tRdWVyeS5kYXRhLnNwbGl0KFwiLS1cIik7XHJcbiAgICAvLyBib3Quc2VuZE1lc3NhZ2UobWVzc2FnZS5jaGF0LmlkLCB0ZXh0KTtcclxuICAgIC8vIHZhciB0eHREYXRhID0gY2hhdElkICsgXCJfXCIgKyB1c2VySW5wdXQgKyBcIl9cIiArIGNvbGwgKyBcIl9cIiArIChwYWdlKzEpO1xyXG4gICAgdmFyIGNoYXRJZCA9IHR4dERhdGFbMF0sXHJcbiAgICAgICAgdXNlcklucHV0ID0gdHh0RGF0YVsxXSxcclxuICAgICAgICBjb2xsID0gdHh0RGF0YVsyXSxcclxuICAgICAgICBwYWdlID0gdHh0RGF0YVszXTtcclxuXHJcbiAgICBnZXRGcm9tQkQoY2hhdElkLCB1c2VySW5wdXQsIGNvbGwsIHBhZ2UpO1xyXG59KTtcclxuLy/QmtC+0LzQsNC90LTRiyDQsNC00LzQuNC90LBcclxuYm90Lm9uKCdkb2N1bWVudCcsIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgIHRyeXtcclxuICAgIGxldCBmaWxlSUQgPSBtc2cuZG9jdW1lbnQuZmlsZV9pZDtcclxuICAgIGxldCBmaWxlID0gYm90LmdldEZpbGUoZmlsZUlEKTtcclxuICAgIHZhciBleHRlbnNpb247XHJcbiAgICBmaWxlLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgIGV4dGVuc2lvbiA9IHJlc3VsdC5maWxlX3BhdGguc3BsaXQoXCIuXCIpW3Jlc3VsdC5maWxlX3BhdGguc3BsaXQoXCIuXCIpLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgICBpZiAoZXh0ZW5zaW9uID09IFwiY3N2XCIpIHtcclxuICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcItCf0YDQvtCx0YPRjiDQt9Cw0LPRgNGD0LfQuNGC0Ywg0L3QvtCy0YvQuSDQtNCw0L3QvdGL0LUg0LIg0LHQsNC30YMuLi5cIik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlU3RyZWFtID0gYm90LmdldEZpbGVTdHJlYW0oZmlsZUlEKTtcclxuICAgICAgICAgICAgdmFyIGNzdkRhdGEgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGNzdlN0cmVhbSA9IGZhc3Rjc3ZcclxuICAgICAgICAgICAgICAgIC5wYXJzZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyOiAnOydcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAub24oXCJkYXRhXCIsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3N2RGF0YS5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBmaXJzdCBsaW5lOiBoZWFkZXJnb1xyXG4gICAgICAgICAgICAgICAgICAgIGNzdkRhdGEuc2hpZnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gXCJJTlNFUlQgSU5UTyBjb3VudGVyc2luZm8gKGNvdW50ZXJfaWQsIG51bWJlcl9jYWxjLCBudW1iZXJfcGxvbWIsIG93bmVyLCBhZHJlc3MsIG9iamVjdCwgdHlwZSwgcG93ZXIsIHBob25lLCBtZXNzYWdlKSBWQUxVRVMgP1wiO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvb2wuZ2V0Q29ubmVjdGlvbihmdW5jdGlvbiAoZXJyLCBjb25uZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucXVlcnkocXVlcnksIFtjc3ZEYXRhXSwgZnVuY3Rpb24gKGVycm9yLCByZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShtc2cuY2hhdC5pZCwgXCLQlNCw0L3QvdGL0LUg0YPRgdC/0LXRiNC90L4g0LfQsNCz0YDRg9C20LXQvdGLIVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaG93X3NhdmVFeGNlbCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbHlfbWFya3VwOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmxpbmVfa2V5Ym9hcmQ6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAn0JrQsNC6INC/0YDQsNCy0LjQu9GM0L3QviDRgdC+0YXRgNCw0L3QuNGC0Ywg0YTQsNC50LsgRXhjZWwg0LTQu9GPINC40LzQv9C+0YDRgtCwINCyINCx0LDQt9GDLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrX2RhdGE6ICdzYXZlR2lkZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIFwi0JLQviDQstGA0LXQvNGPINC30LDQs9GA0YPQt9C60Lgg0L/RgNC+0LjQt9C+0YjQu9CwINC+0YjQuNCx0LrQsCwg0LLQvtC30LzQvtC20L3QviDQstGLINC90LUg0LLQtdGA0L3QviDRgdC+0YXRgNCw0L3QuNC70Lgg0YTQsNC50Lsg0LIgRXhjZWwuXCIsIGhvd19zYXZlRXhjZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5vbihcImNhbGxiYWNrX3F1ZXJ5XCIsIGZ1bmN0aW9uIG9uQ2FsbGJhY2tRdWVyeShjYWxsYmFja1F1ZXJ5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kUGhvdG8obXNnLmNoYXQuaWQsIFwiaHR0cHM6Ly9naXRodWIuY29tL1NtS29zdHlhL0luZm9Cb3QvYmxvYi9tYXN0ZXIvaW1nL2dpZGVTYXZlRmlsZUluQ1NWLmpwZz9yYXc9dHJ1ZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcItCk0LDQudC7IC0+INCh0L7RhdGA0LDQvdC40YLRjCDQutCw0LogLT4g0KLQuNC/INGE0LDQudC70LAgLT4gQ1NWKNGA0LDQt9C00LXQu9C40YLQtdC70LggLSDQt9Cw0L/Rj9GC0YvQtSlcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnJlbGVhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGZpbGVTdHJlYW0ucGlwZShjc3ZTdHJlYW0pO1xyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBcIi5cIiArIGV4dGVuc2lvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuY2F0Y2goZXJyKXtcclxuICAgIGJvdC5zZW5kTWVzc2FnZShtc2cuY2hhdC5pZCwgXCLQp9GC0L4t0YLQviDQv9C+0YjQu9C+INC90LUg0YLQsNC6LlwiICsgZXJyKTtcclxufVxyXG59KTtcclxuXHJcblxyXG5ib3Qub25UZXh0KC8oLispLywgZnVuY3Rpb24gKG1zZywgbWF0Y2gpIHtcclxuICAgIGxldCB0ZXh0ID0gbWF0Y2hbMF07XHJcbiAgICB2YXIgY2hhdElkID0gbXNnLmNoYXQuaWQ7XHJcbiAgICBsZXQgY29tbWFuZHMgPSBbXCIvc3RhcnRcIiwgXCLRgtC10YHRglwiLCBcItCS0LvQsNC00LXQu9C10YZcIiwgXCJzaG93VXNlcnNcIixcItCd0L7QvNC10YAg0YHRh9C10YLRh9C40LrQsFwiLFwi0J3QvtC80LXRgCDQv9C70L7QvNCx0YtcIixcItCg0LDRgdGH0LXRgtC90YvQuSDRgdGH0LXRglwiLFwi0J/QvtC80L7RidGMXCIsXHJcbiAgICBcItCe0YfQuNGB0YLQuNGC0Ywg0LHQsNC30YMg0YHRh9C10YLRh9C40LrQvtCyXCIsIFwi0J7Rh9C40YHRgtC40YLRjCDQsdCw0LfRgyDQv9C+0LvRjNC30L7QstCw0YLQtdC70LXQuVwiLCBcIi9teUlEXCIsXCLQlNCw0YLRjCDQv9GA0LDQstCwINCw0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGA0LBcIixcclxuICAgIFwi0LDQtNC80LjQvVwiLCBcItCQ0LTQvNC40L1cIixcIkFkbWluXCIsXCJhZG1pblwiLFwiL2hlbHBcIixcIi9IZWxwXCIsXCJoZWxwXCIsXCJIZWxwXCIsXCLQv9C+0LzQvtGJ0YxcIixcIi/Qn9C+0LzQvtGJ0YxcIixcIi/Qv9C+0LzQvtGJ0YxcIixcclxuICAgIF07XHJcbiAgICBsZXQga2V5Ym9hcmRzID0gW1wi0JLQu9Cw0LTQtdC70LXRhlwiLCBcItCd0L7QvNC10YAg0YHRh9C10YLRh9C40LrQsFwiLCBcItCd0L7QvNC10YAg0L/Qu9C+0LzQsdGLXCIsIFwi0KDQsNGB0YfQtdGC0L3Ri9C5INGB0YfQtdGCXCIsIFwi0JTQsNGC0Ywg0L/RgNCw0LLQsCDQsNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgNCwXCJcclxuICAgIF07XHJcbiAgICBpZiAoIWNvbW1hbmRzLmluY2x1ZGVzKHRleHQpKXtcclxuICAgICAgICBnZXRfdXNlcihtc2cuZnJvbS5pZCxmdW5jdGlvbihsaXN0KXtcclxuICAgICAgICAgICAgbGV0IHN0YXR1cyA9IGxpc3QucmVxdWVzdF9zdGF0dXM7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2goc3RhdHVzKXtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCItXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQodC90LDRh9Cw0LvQsCDQstGL0LHQtdGA0LjRgtC1INGH0YLQviDQuNGB0LrQsNGC0YwuXCIsIG1lbnUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyBcclxuICAgICAgICAgICAgICAgIGNhc2UgXCLQktC70LDQtNC10LvQtdGGXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0RnJvbUJEKG1zZy5jaGF0LmlkLCB0ZXh0LCBcIm93bmVyXCIsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldF91c2VyU3RhdHVzKG1zZywgbXNnLmZyb20uaWQsIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCLQndC+0LzQtdGAINGB0YfQtdGC0YfQuNC60LBcIjpcclxuICAgICAgICAgICAgICAgICAgICBnZXRGcm9tQkQobXNnLmNoYXQuaWQsIHRleHQsIFwiY291bnRlcl9pZFwiLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRfdXNlclN0YXR1cyhtc2csIG1zZy5mcm9tLmlkLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwi0J3QvtC80LXRgCDQv9C70L7QvNCx0YtcIjpcclxuICAgICAgICAgICAgICAgICAgICBnZXRGcm9tQkQobXNnLmNoYXQuaWQsIHRleHQsIFwibnVtYmVyX3Bsb21iXCIsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldF91c2VyU3RhdHVzKG1zZywgbXNnLmZyb20uaWQsIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhazsgXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwi0KDQsNGB0YfQtdGC0L3Ri9C5INGB0YfQtdGCXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0RnJvbUJEKG1zZy5jaGF0LmlkLCB0ZXh0LCBcIm51bWJlcl9jYWxjXCIsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldF91c2VyU3RhdHVzKG1zZywgbXNnLmZyb20uaWQsIFwiLVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhazsgXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwi0JTQsNGC0Ywg0L/RgNCw0LLQsCDQsNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgNCwXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW5GaWx0ZXIobXNnLmZyb20uaWQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldF91c2VyQWRtaW4obXNnLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRfdXNlclN0YXR1cyhtc2csIG1zZy5mcm9tLmlkLCBcIi1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCd0LXQvNCwINGC0LDQutC+0LPQvlwiKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYoa2V5Ym9hcmRzLmluY2x1ZGVzKHRleHQpKXtcclxuICAgICAgICBzZXRfdXNlclN0YXR1cyhtc2csIG1zZy5mcm9tLmlkLCB0ZXh0KTtcclxuICAgICAgICBzd2l0Y2godGV4dCl7XHJcbiAgICAgICAgICAgIGNhc2UgXCLQndC+0LzQtdGAINGB0YfQtdGC0YfQuNC60LBcIjpcclxuICAgICAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0JLQstC10LTQuNGC0LUg0L3QvtC80LXRgCDRgdGH0LXRgtGH0LjQutCwLlwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgXCLQndC+0LzQtdGAINC/0LvQvtC80LHRi1wiOlxyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQktCy0LXQtNC40YLQtSDQvdC+0LzQtdGAINC/0LvQvtC80LHRiy5cIik7XHJcbiAgICAgICAgICAgICAgICBicmVhazsgXHJcbiAgICAgICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSBcItCg0LDRgdGH0LXRgtC90YvQuSDRgdGH0LXRglwiOlxyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQktCy0LXQtNC40YLQtSDRgNCw0YHRh9C10YLQvdGL0Lkg0YHRh9C10YIuXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgXCLQktC70LDQtNC10LvQtdGGXCI6XHJcbiAgICAgICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCS0LLQtdC00LjRgtC1INGH0YLQvi3RgtC+INC40Lcg0KTQmNCeINCy0LvQsNC00LXQu9GM0YbQsC5cIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcItCU0LDRgtGMINC/0YDQsNCy0LAg0LDQtNC80LjQvdC40YHRgtGA0LDRgtC+0YDQsFwiOlxyXG4gICAgICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQktCy0LXQtNC40YLQtSBpZCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y8g0LrQvtGC0L7RgNC+0LzRgyDQstGL0LTQsNGC0Ywg0L/RgNCw0LLQsCDQsNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgNCwLlwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgLy8gYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQndC10LzQsCDRgtCw0LrQvtCz0L5cIik7IFxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbmJvdC5vblRleHQoL9Ce0YfQuNGB0YLQuNGC0Ywg0LHQsNC30YMg0YHRh9C10YLRh9C40LrQvtCyLywgZnVuY3Rpb24gKG1zZykge1xyXG4gICAgdmFyIGNoYXRJZCA9IG1zZy5jaGF0LmlkO1xyXG4gICAgdHJ5IHthZG1pbkZpbHRlcihtc2cuZnJvbS5pZCwgZnVuY3Rpb24oKXt0dXJuY2F0ZV9jb3VudGVyc19kYihtc2cpO30pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7fVxyXG59KTtcclxuXHJcbmJvdC5vblRleHQoL9Ce0YfQuNGB0YLQuNGC0Ywg0LHQsNC30YMg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10LkvLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGFkbWluRmlsdGVyKG1zZy5mcm9tLmlkLCBmdW5jdGlvbigpe3R1cm5jYXRlX3VzZXJzX2RiKG1zZyk7fSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgIH1cclxufSk7XHJcbmJvdC5vblRleHQoL1xcL215SUQvLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIFwi0JLQsNGIIElEOlwiICsgbXNnLmZyb20uaWQpO1xyXG59KTtcclxuYm90Lm9uVGV4dCgvYWRtaW4vLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICB2YXIgY2hhdElkID0gbXNnLmNoYXQuaWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGFkbWluRmlsdGVyKG1zZy5mcm9tLmlkLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCc0LXQvdGOINCw0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGA0LAg0LLQutC70Y7Rh9C10L3QvlwiLCBhZG1pbk1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7fVxyXG59KTtcclxuLy8gYm90Lm9uVGV4dCgvYWRkQ291bnRlckRCLywgZnVuY3Rpb24gKG1zZykge1xyXG4vLyAgICAgdmFyIGNoYXRJZCA9IG1zZy5jaGF0LmlkO1xyXG4vLyAgICAgdHJ5IHtcclxuLy8gICAgICAgICBjcmVhdGVfY291bnRlcnNfZGIoY2hhdElkKTtcclxuLy8gICAgIH0gY2F0Y2ggKGVycikge31cclxuLy8gfSk7XHJcbi8vIGJvdC5vblRleHQoL2RlbGV0ZUNvdW50ZXJEQi8sIGZ1bmN0aW9uIChtc2cpIHtcclxuLy8gICAgIHZhciBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuLy8gICAgIHRyeSB7XHJcbi8vICAgICAgICAgZGVsZXRlX2NvdW50ZXJzX2RiKGNoYXRJZCk7XHJcbi8vICAgICB9IGNhdGNoIChlcnIpIHt9XHJcbi8vIH0pO1xyXG4vLyBib3Qub25UZXh0KC9hZGRVc2Vyc0RCLywgZnVuY3Rpb24gKG1zZykge1xyXG4vLyAgICAgdmFyIGNoYXRJZCA9IG1zZy5jaGF0LmlkO1xyXG4vLyAgICAgdHJ5IHtcclxuLy8gICAgICAgICBjcmVhdGVfdXNlcnNfZGIoY2hhdElkKTtcclxuLy8gICAgIH0gY2F0Y2ggKGVycikge31cclxuLy8gfSk7XHJcbi8vIGJvdC5vblRleHQoL2RlbGV0ZVVzZXJzREIvLCBmdW5jdGlvbiAobXNnKSB7XHJcbi8vICAgICB2YXIgY2hhdElkID0gbXNnLmNoYXQuaWQ7XHJcbi8vICAgICB0cnkge1xyXG4vLyAgICAgICAgIGRlbGV0ZV91c2Vyc19kYihjaGF0SWQpO1xyXG4vLyAgICAgfSBjYXRjaCAoZXJyKSB7fVxyXG4vLyB9KTtcclxuLy8gYm90Lm9uVGV4dCgvY2xlYXJDb3VudGVycy8sIGZ1bmN0aW9uIChtc2cpIHtcclxuLy8gICAgIHZhciBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuLy8gICAgIHRyeSB7XHJcbi8vICAgICAgICAgdHVybmNhdGVfY291bnRlcnNfZGIoY2hhdElkKTtcclxuLy8gICAgIH0gY2F0Y2ggKGVycikge31cclxuLy8gfSk7XHJcbi8vIGJvdC5vblRleHQoL2NsZWFyVXNlcnMvLCBmdW5jdGlvbiAobXNnKSB7XHJcbi8vICAgICB2YXIgY2hhdElkID0gbXNnLmNoYXQuaWQ7XHJcbi8vICAgICB0cnkge1xyXG4vLyAgICAgICAgIHR1cm5jYXRlX3VzZXJzX2RiKG1zZyk7XHJcbi8vICAgICB9IGNhdGNoIChlcnIpIHt9XHJcbi8vIH0pO1xyXG5cclxuLy8gYm90Lm9uVGV4dCgvc2V0U3RhdHVzICguKylfXyguKykvLCBmdW5jdGlvbiAobXNnLCBtYXRjaCkge1xyXG4vLyAgICAgdmFyIHVzZXJJZCA9IG1hdGNoWzFdLCBzdGF0dXMgPSBtYXRjaFsyXTtcclxuLy8gICAgIHNldF91c2VyU3RhdHVzKG1zZywgdXNlcklkLCBzdGF0dXMpO1xyXG4vLyB9KTtcclxuXHJcbi8vIGJvdC5vblRleHQoL3NldEFkbWluICguKykvLCBmdW5jdGlvbiAobXNnLCBtYXRjaCkge1xyXG4vLyAgICAgdmFyIHVzZXJJZCA9IG1hdGNoWzFdO1xyXG4vLyAgICAgc2V0X3VzZXJBZG1pbihtc2csIHVzZXJJZCk7XHJcbi8vIH0pO1xyXG5cclxuXHJcbmJvdC5vblRleHQoL3Nob3dVc2Vycy8sIGZ1bmN0aW9uIChtc2csIG1hdGNoKSB7XHJcbiAgICBnZXRfYWxsVXNlcnMobXNnLmNoYXQuaWQpO1xyXG59KTtcclxuXHJcbi8vIGJvdC5vblRleHQoL3Nob3dVc2VyICguKykvLCBmdW5jdGlvbiAobXNnLCBtYXRjaCkge1xyXG4vLyAgICAgc2hvd191c2VyKG1zZywgbWF0Y2hbMV0pO1xyXG4vLyB9KTtcclxuXHJcblxyXG4vLyDQndGD0LbQtNCw0Y7RgtGB0Y8g0LIg0LTQvtGA0LDQsdC+0YLQutC1XHJcbmJvdC5vblRleHQoL1xcL3N0YXJ0LywgZnVuY3Rpb24gKG1zZykge1xyXG4gICAgdmFyIG5ld1VzZXIgPSB7XHJcbiAgICAgICAgXCJ1c2VyX2lkXCI6IG1zZy5mcm9tLmlkLFxyXG4gICAgICAgIFwicmVxdWVzdF9zdGF0dXNcIjogXCItXCIsXHJcbiAgICAgICAgXCJyZXF1ZXN0X2NvdW50XCI6IFwiMFwiLFxyXG4gICAgICAgIFwiYWRtaW5cIjogXCJmYWxzZVwiXHJcbiAgICB9O1xyXG4gICAgYWRkX3VzZXIobmV3VXNlcik7XHJcbiAgICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIGhlbHBNZXNzYWdlLCBtZW51KTtcclxufSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbi8v0KDQsNC30YDQsNCx0L7RgtC60LBcclxuYm90Lm9uKFwicGhvdG9cIiwgZnVuY3Rpb24gKG1zZykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcGhvdG9JZCA9IG1zZy5waG90b1ttc2cucGhvdG8ubGVuZ3RoIC0gMV0uZmlsZV9pZDtcclxuICAgICAgICBjb25zdCBmaWxlID0gYm90LmdldEZpbGUocGhvdG9JZCk7XHJcblxyXG4gICAgICAgIGZpbGUudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxubGV0IGhlbHBNZXNzYWdlID0gXCLQoSDQv9C+0LzQvtGJ0YzRjiDRjdGC0L7Qs9C+INGB0L/RgNCw0LLQvtGH0L3QuNC60LAg0LLRiyDRgdC80L7QttC10YLQtSDQvdCw0LnRgtC4INC00LDQvdC90YvQtSDQv9C+INC90YPQttC90L7QvNGDINGB0YfQtdGC0YfQuNC60YMuXFxuXCIgK1xyXG5cItCS0YvQsdC10YDQuNGC0LUg0L/QsNGA0LDQvNC10YLRgCDQtNC70Y8g0L/QvtC40YHQutCwINC4INCy0LLQtdC00LjRgtC1INC40YHQutC+0LzQvtC1INC30L3QsNGH0LXQvdC40LUuXFxuXCIgK1xyXG5cItCX0LDQv9GA0L7RgSDQsiDQv9C+0LjRgdC60LUg0LzQvtC20L3QviDQv9C40YHQsNGC0Ywg0L3QtSDQv9C+0LvQvdC+0YHRgtGM0Y4g0Lgg0L3QtSDRgSDQvdCw0YfQsNC70LAuXCI7XHJcblxyXG5ib3Qub25UZXh0KC/Qv9C+0LzQvtGJ0YwvLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIGhlbHBNZXNzYWdlLCBtZW51KTtcclxufSk7XHJcbmJvdC5vblRleHQoL1xcL9C/0L7QvNC+0YnRjC8sIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBoZWxwTWVzc2FnZSwgbWVudSk7XHJcbn0pO1xyXG5ib3Qub25UZXh0KC9cXC/Qn9C+0LzQvtGJ0YwvLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgIGJvdC5zZW5kTWVzc2FnZShtc2cuY2hhdC5pZCwgaGVscE1lc3NhZ2UsIG1lbnUpO1xyXG59KTtcclxuYm90Lm9uVGV4dCgvXFwvSGVscC8sIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBoZWxwTWVzc2FnZSwgbWVudSk7XHJcbn0pO1xyXG5ib3Qub25UZXh0KC9cXC9oZWxwLywgZnVuY3Rpb24gKG1zZykge1xyXG4gICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIGhlbHBNZXNzYWdlLCBtZW51KTtcclxufSk7XHJcbmJvdC5vblRleHQoL9Cf0L7QvNC+0YnRjC8sIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgYm90LnNlbmRNZXNzYWdlKG1zZy5jaGF0LmlkLCBoZWxwTWVzc2FnZSwgbWVudSk7XHJcbn0pO1xyXG5ib3Qub25UZXh0KC9IZWxwLywgZnVuY3Rpb24gKG1zZykge1xyXG4gICBib3Quc2VuZE1lc3NhZ2UobXNnLmNoYXQuaWQsIGhlbHBNZXNzYWdlLCBtZW51KTtcclxufSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG5ib3Qub25UZXh0KC9BZG1pbi8sIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgIHZhciBjaGF0SWQgPSBtc2cuY2hhdC5pZDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYWRtaW5GaWx0ZXIobXNnLmZyb20uaWQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGJvdC5zZW5kTWVzc2FnZShjaGF0SWQsIFwi0JzQtdC90Y4g0LDQtNC80LjQvdC40YHRgtGA0LDRgtC+0YDQsCDQstC60LvRjtGH0LXQvdC+XCIsIGFkbWluTWVudSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHt9XHJcbn0pO1xyXG5ib3Qub25UZXh0KC/QkNC00LzQuNC9LywgZnVuY3Rpb24gKG1zZykge1xyXG4gICAgdmFyIGNoYXRJZCA9IG1zZy5jaGF0LmlkO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhZG1pbkZpbHRlcihtc2cuZnJvbS5pZCwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgYm90LnNlbmRNZXNzYWdlKGNoYXRJZCwgXCLQnNC10L3RjiDQsNC00LzQuNC90LjRgdGC0YDQsNGC0L7RgNCwINCy0LrQu9GO0YfQtdC90L5cIiwgYWRtaW5NZW51KTtcclxuICAgICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycikge31cclxufSk7XHJcbmJvdC5vblRleHQoL9Cw0LTQvNC40L0vLCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICB2YXIgY2hhdElkID0gbXNnLmNoYXQuaWQ7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGFkbWluRmlsdGVyKG1zZy5mcm9tLmlkLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBib3Quc2VuZE1lc3NhZ2UoY2hhdElkLCBcItCc0LXQvdGOINCw0LTQvNC40L3QuNGB0YLRgNCw0YLQvtGA0LAg0LLQutC70Y7Rh9C10L3QvlwiLCBhZG1pbk1lbnUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7fVxyXG59KTsiXX0=