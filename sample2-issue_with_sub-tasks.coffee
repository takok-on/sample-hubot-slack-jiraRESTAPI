module.exports = (robot) ->
  hoge = require("./createIssue")
  # コマンド 「keyWord 期限日・配信日(yyyy-mm-dd)」で処理開始
  robot.respond /keyWord (.*)/i, (msg) ->
    # 期限日・配信日
    distributionDate = msg.match[1]
    # ■ N営業日前
    # → hoge.substructWorkingDay 期限日・配信日(yyyy-mm-dd),N
    #
    # ■ N営業日後
    # → hoge.addWorkingDay 期限日・配信日(yyyy-mm-dd),N
    #
    dueDate01 = hoge.substructWorkingDay distributionDate,17
    dueDate02 = hoge.substructWorkingDay distributionDate,10
    dueDate03 = hoge.addWorkingDay distributionDate,7
    
    ######
    #Json#
    ######
    issue =
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
 
    #sub-tasks
    subTasks =
      issueUpdates:[
 
        #sub-tasks1
        {
          update: {}
          fields:
            project:
              key: ""
            parent:
              key: 'ISSSUEKEY' # ※親+サブチケット起票の際は、文字列'ISSSUEKEY'を入れる
            summary: ""
            issuetype:
              name: ""
            duedate:""+dueDate01+"" 
            reporter:
              name: ""
            labels:[
              "",
              ""
            ]
        }
        #sub-tasks2
        {
          update: {}
          fields:
            project:
              key: ""
            parent:
              key: 'ISSSUEKEY' 
            summary: ""
            issuetype:
              name: ""
            duedate:""+dueDate02+""
 
        }
      ]
 
    #method
    hoge.create(issue,subTasks,'slackroom')