export function setvar(Doc){
    const server = Doc.getElementById("server_address").value;
    
    const judge = Doc.getElementById("judge_textarea").value;
    const code = Doc.getElementById("code_block").value;
    const runmode = Doc.getElementById("stdin").checked ? "stdin" : "judge";
    const judgemode = Doc.getElementById("mode_input").value;
    const limittime = Doc.getElementById("limittime").value;
    const limitmemory = Doc.getElementById("limitmemory").value;
    const darkmode = Doc.getElementById("darkmode").checked;

    chrome.storage.local.set({"server" : server});
    chrome.storage.local.set({"judge" : judge});
    chrome.storage.local.set({"code" : code});
    chrome.storage.local.set({"runmode" : runmode});
    chrome.storage.local.set({"judgemode": judgemode});
    chrome.storage.local.set({"limittime": limittime});
    chrome.storage.local.set({"limitmemory": limitmemory});
    chrome.storage.local.set({"darkmode": darkmode});
    

    const judgeValue = judge;
    const judgeJson = JSON.parse(judgeValue);
    chrome.contextMenus.removeAll();
    const Menu = chrome.contextMenus.create({
        id: "Judge",
        title: "EasyJudge ― Judge code",
        contexts: ["link", "selection"]
    });
    for(let index=1; index<=judgeJson.problemList.length; index++){
        chrome.contextMenus.create({
            title: 'Problem #' + index,
            parentId: Menu,
            id: index.toString(),
                contexts: ["link", "selection"]
        });
    }

}

export function getvar(Doc, func){
    chrome.storage.local.get(["server", "judge", "code", "runmode", "judgemode", "limittime", "limitmemory", "darkmode"], function(items){

        const server = items.server;
        const judge = items.judge;
        const code = items.code;
        const runmode = items.runmode;
        const judgemode = items.judgemode;
        const limittime = items.limittime;
        const limitmemory = items.limitmemory;
        const darkmode = items.darkmode;

        if(judge == undefined){
            chrome.storage.local.set({"server" : "localhost:5000"});
            chrome.storage.local.set({"judge" : "{\n  \"problemList\": [\n    {\n      \"problemSetting\": {\n        \"judgeMode\": 0,\n        \"limitTime\": 3,\n        \"limitMemory\": 512\n      },\n      \"testcaseList\": [\n        {\n          \"stdin\": \"\",\n          \"stdout\": \"\",\n          \"fileList\": []\n        }\n      ]\n    }\n  ]\n}"});
            chrome.storage.local.set({"code" : "#include <stdio.h>\n\nint main(int ac, char* av[]){\n\n    printf(\"Hello, World!\");\n\n    return 0;\n\n}"});
            chrome.storage.local.set({"runmode" : "stdin"});
            chrome.storage.local.set({"judgemode": "1"});
            chrome.storage.local.set({"limittime": "3"});
            chrome.storage.local.set({"limitmemory": "512"});
            chrome.storage.local.set({"darkmode": false});
            getvar(Doc, func);
            return;
        }

        Doc.getElementById("server_address").value = server;
        Doc.getElementById("judge_textarea").value = judge;
        Doc.getElementById("code_block").value = code;
        Doc.getElementById(runmode).checked = true;
        Doc.getElementById("mode_input").value = judgemode;
        Doc.getElementById("limittime").value = limittime;
        Doc.getElementById("limitmemory").value = limitmemory;
        Doc.getElementById("darkmode").checked = darkmode;

        func();
    });
}

export function PopJudge(func){
    chrome.storage.local.get(["popjudge"], (item) => func(item));
}