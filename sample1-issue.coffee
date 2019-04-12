module.exports = (robot) ->
  hoge = require("./createIssue")
 
  # コマンド 「keyWord 期限日・配信日(yyyy-mm-dd)」で処理開始
  robot.respond /keyWord (.*)/i, (msg) ->
 
    # 期限日・配信日
    distributionDate = msg.match[1]
  
    ######
    #Json#
    ######
    
    #Issues
    Issue =
      fields:
        project:
          key: ""
        summary: ""
        duedate:distributionDate
        issuetype:
          name: ""
        assignee:
          name: ""
        labels:[
          "",
          "",
          ""
        ]
 
    #method
    hoge.createParent(Issue,'slackroom')