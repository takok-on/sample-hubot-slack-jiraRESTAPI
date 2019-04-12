module.exports = (robot) ->
  hoge = require("./createIssue")
  robot.respond /keyWord (.*)/i, (msg) ->
    distributionDate = msg.match[1]

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
        
    hoge.createParent(Issue,'slackroom')