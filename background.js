chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.query == 'getRequest'){
            fetch(request.url)
                .then(response => response.text())
                .then(text => sendResponse(text))
                .catch(error => alert(error));
            return true;
        }
        else if(request.query == 'postRequest'){
            console.log(JSON.stringify({
                code: request.code,
                stdin: request.stdin,
                fileList: request.fileList
            }));
            fetch(request.url, {
                method: "POST",
                body: JSON.stringify({
                    code: request.code,
                    stdin: request.stdin,
                    fileList: request.fileList
                })
            })
                .then(response => response.json)
                .then(result => sendResponse(result))
                .catch(error => console.log(error));
        }
    }
)

chrome.contextMenus.removeAll();
const Menu = chrome.contextMenus.create({
    id: "Judge",
    title: "EasyJudge ― Judge code",
    contexts: ["link"]
});
chrome.storage.local.get(["judge"], function(items){
    const judgeValue = items.judge;
    const judgeJson = JSON.parse(judgeValue);
    for(let index=1; index<=judgeJson.problemList.length; index++){
        chrome.contextMenus.create({
            title: 'Problem #' + index,
            parentId: Menu,
            id: index.toString(),
            contexts: ["link"]
        });
    }
});
function genericOnClick(info){
    const url = info.linkUrl;
    const selText = info.selectionText;
    if(url != undefined){
        fetch(url)
            .then(response => response.text())
            .then(text => {
                chrome.storage.local.set({"code" : text});
            })
            .catch(error => console.log(error));
    }
    else{
        chrome.storage.local.set({"code" : selText});
    }
    const index = info.menuItemId;
    chrome.storage.local.set({"popjudge": index});
    chrome.storage.local.set({"runmode" : "judge"});

}
chrome.contextMenus.onClicked.addListener(genericOnClick);