const fs = require('fs'),
      request = require ('request'),
      Slack = require('slack-node'),
      FILE_JIRA_USER_PASSWORD_CSV = './set_values/jira_user_password.csv',
      jirauserpassword  = fs.readFileSync(FILE_JIRA_USER_PASSWORD_CSV, "utf-8"),
      jiraUserInfocells = jirauserpassword.split(","),
      jirauser     = jiraUserInfocells[0],
      jirapassword = jiraUserInfocells[1],
      token        = './set_values/token.txt',
      apiTokenPreData = fs.readFileSync(token, "utf-8"),
      apiToken        = apiTokenPreData.trim(),
      jiraDomain      = "yourDomain";//https://jira.yourDomain.

/*
#Creating an issue
*/
exports.createParent = function(bodyCont,slackRoom) {

  // Request params
  const options = {
      uri: jiraDomain + 'rest/auth/1/session',
      headers: {
          ContentType: 'application/json',
      },
      body: {
          username: jirauser,
          password: jirapassword,
      },
      method: 'POST',
      json: true
  };

  // Post request
  request(options, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        sendReply('チケットを作成しています...',slackRoom)

        const options = {
          uri: jiraDomain + 'rest/api/2/issue',
          headers: {
              'Content-Type': 'application/json',
              cookie: data.session.name + '=' + data.session.value,
          },
          body: bodyCont,
          method: 'POST',
          json: true
        };

        request(options, function (error, response, data) {
          if (!error && response.statusCode == 201) {
            var resultUrl = '`'+'Created issue: ' + jiraDomain + 'browse/' + data.key+'`'
            var slack = new Slack(apiToken);
            slack.api('chat.postMessage', {
              text:resultUrl,
              channel:slackRoom
            }, function(err, response){
              console.log(response);
            });

          } else {
            errorMsg = 'エラー発生のため処理中止します。\n'
                      + 'error : '+JSON.stringify(response.body.errors[0].elementErrors.errors)//+'/'+JSON.stringify(response)+'/////////'+JSON.stringify(data)
            sendReply(errorMsg,slackRoom);
          }
        });

      }else{

        errorMsg = 'エラー発生のため処理中止します。\n'
                 + 'error : '+JSON.stringify(response.body.errors[0].elementErrors.errors)//+'/'+JSON.stringify(response)+'/////////'+JSON.stringify(data)
        sendReply(errorMsg,slackRoom);

      }
  });
}

/*
#Creating an issue with sub-tasks
*/
exports.create = function(bodyCont,bodyCont1,slackRoom) {
  exports.objKey = "";
  var authData1 = "";
  var authData2 = "";

  function reqForPar(callback){
    const options = {
        uri: jiraDomain + 'rest/auth/1/session',
        headers: {
            ContentType: 'application/json',
        },
        body: {
            username: jirauser,
            password: jirapassword,
        },
        method: 'POST',
        json: true
    };

    request(options, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        sendReply('チケットを作成しています...',slackRoom)
        authData1=data.session.name;
        authData2=data.session.value;

        const options = {
          uri: jiraDomain + 'rest/api/2/issue',
          headers: {
              'Content-Type': 'application/json',
              cookie: data.session.name + '=' + data.session.value,
          },
          body: bodyCont,
          method: 'POST',
          json: true
        };

        request(options, function (error, response, data) {
          if (!error && response.statusCode == 201) {
              exports.objKey=data.key
              callback();
          }else{
            errorMsg = 'エラー発生のため処理中止します。\n'
                      + 'error : '+JSON.stringify(response.body.errors[0].elementErrors.errors)
            sendReply(errorMsg,slackRoom);
          }
        });
      }else{
        errorMsg = 'エラー発生のため処理中止します。\n'
                 + 'error : '+JSON.stringify(response.body.errors[0].elementErrors.errors)
        sendReply(errorMsg,slackRoom);
      }
    });
  }

  function reqForSub(){
    var afterReplaceStr=JSON.stringify(bodyCont1).replace(/ISSSUEKEY/g,exports.objKey)
    var afterReplace=JSON.parse(afterReplaceStr)
    var url2 = jiraDomain + 'rest/api/2/issue/bulk/';
    const optionsSub = {
      uri: url2,
      headers: {
        'Content-Type': 'application/json',
        cookie: authData1 + '=' + authData2,
      },
      body:afterReplace,
      method: 'POST',
      json:true
    };
    request(optionsSub, function(error, response, data) {
      if (!error && (response.statusCode === 201)) {
          var resultUrl = '`'+'Created issue: ' + jiraDomain + 'browse/' + exports.objKey+'`'
          var slack = new Slack(apiToken);
          slack.api('chat.postMessage', {
            text:resultUrl,
            channel:slackRoom
          }, function(err, response){
            console.log(response);
          });
      }else{
        errorMsg = 'エラー発生のため処理中止します。\n'
                 + 'error : '+JSON.stringify(response.body.errors[0].elementErrors.errors)//+'/'+JSON.stringify(response)+'/////////'+JSON.stringify(data)
        sendReply(errorMsg,slackRoom);
      }
    });
  }

  reqForPar(reqForSub)

}

/*
sendReply( message , slackroom )
*/ 
const sendReply =function(replyCont,slackRoom){
  var slack = new Slack(apiToken);
  slack.api('chat.postMessage',{
    text:replyCont,
    channel:slackRoom
  },function(err, response){
    console.log(response);
  });
};

/* 
# get New Date
*/
exports.returnDate= function() {
  var dt = new Date();
  var year = dt.getFullYear();
  var monthPreData = dt.getMonth()+1;
  var datePreData = dt.getDate();

  function zeroPadding(NUM, LEN){
    return ( Array(LEN).join('0') + NUM ).slice( -LEN );
  }
  var month = zeroPadding(monthPreData, 2);
  var date  = zeroPadding(datePreData, 2);
  return year+month+date;
}

/* 
#get date N days ago (a business day)
*/
exports.substructWorkingDay = function( distributionDate,duration  ) {
  const FILE_claender  = './set_values/calender.csv';
  const fsclaender  = fs.readFileSync(FILE_claender, "utf-8");
  const fsclaenderInfocells = fsclaender.split("\r\n");

  var holidayArray = [];
  const pushcsv = () =>
    Array.from(fsclaenderInfocells).map((id, idx) =>
      holidayArray.push(fsclaenderInfocells[idx]));
  pushcsv();

  const duedateData = distributionDate;
  const nDatsAgoPreset = duration;
  const duedate     = Date.parse(duedateData);
  const holidayPreFunc = function() {

    const dateHolidayDayPreFuncEndData = new Date( duedate );
    const dateHolidayDayPreFuncEnd     = new Date(dateHolidayDayPreFuncEndData.setDate(dateHolidayDayPreFuncEndData.getDate()-1));
    const dateHolidayDayPreFuncData0   = new Date( duedate );
    const dateHolidayDayPreFuncData    = new Date(dateHolidayDayPreFuncData0.setDate(dateHolidayDayPreFuncData0.getDate()-1));
    const dateHolidayDayPreFunc        = new Date(dateHolidayDayPreFuncData.setDate(dateHolidayDayPreFuncData.getDate()-Number(nDatsAgoPreset)));
    const d = dateHolidayDayPreFuncEnd;
    while (d > dateHolidayDayPreFunc) {
      const zeroPadding = (NUM, LEN) => (Array(LEN).join('0') + NUM).slice(-LEN);
      var dateForChk = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
      var dateData   = `${d.getFullYear()}-${zeroPadding(d.getMonth()+1,2)}-${zeroPadding(d.getDate(),2)}`;
      var holidayChk =  holidayArray.indexOf(dateForChk) >= 0 ? true : false;
      if (holidayChk || (d.getDay() === 0) || (d.getDay() === 6)) {
        dateHolidayDayPreFunc.setDate(dateHolidayDayPreFunc.getDate() - 1);
      }
      d.setDate(d.getDate() - 1);
    }
    return dateData;
  };

  return holidayPreFunc();

}

/* 
#get date N days later (a business day)
*/
exports.addWorkingDay = function( distributionDate,duration  ) {
  const FILE_claender  = './set_values/calender.csv';
  const fsclaender  = fs.readFileSync(FILE_claender, "utf-8");
  const fsclaenderInfocells = fsclaender.split("\r\n");

  var holidayArray = [];
  const pushcsv = () =>
    Array.from(fsclaenderInfocells).map((id, idx) =>
      holidayArray.push(fsclaenderInfocells[idx]));
  pushcsv();

  const duedateData = distributionDate;
  const nDatsAgoPreset = duration;
  const duedate     = Date.parse(duedateData);
  const holidayPreFunc1 = function() {

    const dateHolidayDayPreFuncData     = new Date( duedate );
    const dateHolidayDayPreFunc         = new Date(dateHolidayDayPreFuncData.setDate(dateHolidayDayPreFuncData.getDate()+1));
    const dateHolidayDayPreFuncEndData0 = new Date( duedate );
    const dateHolidayDayPreFuncEndData  = new Date(dateHolidayDayPreFuncEndData0.setDate(dateHolidayDayPreFuncEndData0.getDate()+1));
    const dateHolidayDayPreFuncEnd      = new Date(dateHolidayDayPreFuncEndData.setDate(dateHolidayDayPreFuncEndData.getDate()+Number(nDatsAgoPreset)));
    const d = dateHolidayDayPreFunc;
    while (d < dateHolidayDayPreFuncEnd) {
      const zeroPadding = (NUM, LEN) => (Array(LEN).join('0') + NUM).slice(-LEN);
      var dateForChk = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
      var dateData   = `${d.getFullYear()}-${zeroPadding(d.getMonth()+1,2)}-${zeroPadding(d.getDate(),2)}`;
      var holidayChk =  holidayArray.indexOf(dateForChk) >= 0 ? true : false;
      if (holidayChk || (d.getDay() === 0) || (d.getDay() === 6)) {
        dateHolidayDayPreFuncEnd.setDate(dateHolidayDayPreFuncEnd.getDate() + 1);
      }
      d.setDate(d.getDate() + 1);
    }
    return dateData;
  };
return holidayPreFunc1();
}
