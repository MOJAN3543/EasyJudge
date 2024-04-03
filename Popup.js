import { outputContainer, TestCaseContainer, ProblemContainer} from "./util/domController.js";
import { setvar, getvar, PopJudge } from "./util/setting.js";
import { NoJudge, NumberJudge, NormalJudge, PerfectJudge } from "./util/judge.js";

function sendPostHttp(request, callback){ // Send Post Request To HTTP Server (Flask...)
    const req = new XMLHttpRequest();
    const baseUrl = request.url;
    const data = JSON.stringify({
        code: request.code,
        stdin: request.stdin,
        fileList: request.fileList,
        setting: request.setting
    });
    req.open("post", baseUrl, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function(){
        if(req.readyState == XMLHttpRequest.DONE){
            callback(req);
        }
    }
    req.send(data);
    return true;
}


function judgestdinMode(){
    const codeVal = document.getElementById("code_block").value;
    const stdinVal = document.getElementById("stdin_input").value;
    const URL = document.getElementById("server_address").value + "judge";
    const limittime = document.getElementById("limittime").value;
    const limitmemory = document.getElementById("limitmemory").value;

    const output = new outputContainer(0);
    document.querySelector(".judgeResult_container").appendChild(output.DOM);

    const judgeResult = sendPostHttp({
        query: 'postRequest',
        url: URL,
        code: codeVal,
        stdin: stdinVal,
        setting: {"limitTime": Number(limittime), "limitMemory": Number(limitmemory)},
        fileList: []
    }, (response) => output.Update(response));

    document.getElementById("stdout").value = "Running...";
    document.getElementById("stderr").value = "Running...";

    
}

function judgejudgeMode(){
    const codeVal = document.getElementById("code_block").value;
    const judgeVal = document.getElementById("judge_textarea").value;
    const URL = document.getElementById("server_address").value + "judge";

    const problemNo = document.getElementsByName("judge_number")[0].value - 1;

    const judgeJson = JSON.parse(judgeVal);
    const testcaseList = judgeJson.problemList[problemNo].testcaseList;

    const setting = {"limitTime": judgeJson.problemList[problemNo].problemSetting.limitTime, "limitMemory": judgeJson.problemList[problemNo].problemSetting.limitMemory};

    let JudgeFunc;
    let JudgeMode;
    if(judgeJson.problemList[problemNo].problemSetting.judgeMode == 0)
        JudgeMode = Number(document.getElementById("mode_input").value);
    else
        JudgeMode = judgeJson.problemList[problemNo].problemSetting.judgeMode;
    
    switch(JudgeMode){
        case 1:
            JudgeFunc = NoJudge;
            break;
        case 2:
            JudgeFunc = NumberJudge;
            break;
        case 3:
            JudgeFunc = NormalJudge;
            break;
        case 4:
            JudgeFunc = PerfectJudge;
            break;
    }

    testcaseList.forEach((testcase, index) => {
        const output = new TestCaseContainer(index+1);
        document.querySelector(".judgeResult_container").appendChild(output.DOM);

        const judgeResult = sendPostHttp({
            query: 'postRequest',
            url: URL,
            code: codeVal,
            stdin: testcase.stdin,
            setting: setting,
            fileList: testcase.fileList
        }, (response) => output.Update(response, JudgeFunc, testcase.stdout, testcase.fileList));
    })
}

function GetCodeByURL(){
    const URL = document.getElementById("code_url").value;
    const codeBlock = document.getElementById("code_block");
    chrome.runtime.sendMessage({
        query: 'getRequest',
        url: URL
    }, function(response){codeBlock.value = response; setvar(document)});
}

function removeResult(){
    const resultdivList = document.querySelectorAll(".judgeResult_container > div");
    resultdivList.forEach((resultdiv) => resultdiv.remove());
}

function removeJudgeSettingDOM(){
    const JudgeSettingList = document.getElementById("ProblemList");
    if(JudgeSettingList != null)
        JudgeSettingList.remove();
}

function runCode(){
    const isJudgeMode = document.getElementById("judge").checked;
    removeResult();
    if(isJudgeMode == true){
        judgejudgeMode();
    }
    else{
        judgestdinMode();
    }
}

function makeJudgeJson(){
    const ret = {
        "problemList" : []
    };
    document.querySelectorAll("#ProblemList > .listblock:not(.plus)").forEach((P, Pi) => {
        const problemSetting = {
            "judgeMode" : 0,
            "limitTime" : 0,
            "limitMemory": 0
        };
        problemSetting.judgeMode = Number(P.querySelector("#ps" + (Pi+1) + "jm").value);
        problemSetting.limitTime = Number(P.querySelector("#ps" + (Pi+1) + "lt").value);
        problemSetting.limitMemory = Number(P.querySelector("#ps" + (Pi+1) + "lm").value);
        const problem = {
            "problemSetting": problemSetting,
            "testcaseList": []
        };
        P.querySelectorAll("#ProblemList > div:nth-child("+(Pi+1)+") > .listblock:not(.plus)").forEach((T, Ti) => {
            const testcase = {
                "stdin" : "",
                "stdout" : "",
                "fileList": []
            }
            testcase.stdin = T.querySelector("#p"+(Pi+1)+"t"+(Ti+1)+"stdin").value;
            testcase.stdout = T.querySelector("#p"+(Pi+1)+"t"+(Ti+1)+"stdout").value;
            T.querySelectorAll("#ProblemList > div:nth-child("+(Pi+1)+") > div:nth-child("+(Ti+3)+") > .dictblock > .listblock:not(.plus)").forEach((F, Fi) => {
                const file = {
                    "filename": "",
                    "contents": "",
                    "filetype": ""
                }
                file.filename = F.querySelector("#p"+(Pi+1)+"t"+(Ti+1)+"f"+(Fi+1)+"name").value;
                file.contents = F.querySelector("#p"+(Pi+1)+"t"+(Ti+1)+"f"+(Fi+1)+"content").value;
                file.filetype = F.querySelector("#p"+(Pi+1)+"t"+(Ti+1)+"f"+(Fi+1)+"io").value;
                testcase.fileList.push(file);
            });
            problem.testcaseList.push(testcase);
        });
        ret.problemList.push(problem);
    })
    return ret;
}
function makeDOMbyJudgeJson(){
    removeJudgeSettingDOM();
    document.getElementById("judge_textarea").classList.remove("wrong");
    const JudgeData = document.getElementById("judge_textarea").value;
    if(JudgeData == ""){
        chrome.storage.local.get(["limittime", "limitmemory"], function(items){
            const limititme = items.limittime;
            const limitmemory = items.limitmemory;
            document.getElementById("judge_textarea").value = "{\n  \"problemList\": [\n    {\n      \"problemSetting\": {\n        \"judgeMode\": 0,\n        \"limitTime\": "+limititme+",\n        \"limitMemory\": "+limitmemory+"\n      },\n      \"testcaseList\": [\n        {\n          \"stdin\": \"\",\n          \"stdout\": \"\",\n          \"fileList\": []\n        }\n      ]\n    }\n  ]\n}";
            return makeDOMbyJudgeJson();
        });  
    }
    let JudgeJson;
    try{
        JudgeJson = JSON.parse(JudgeData);
    } catch(e){
        document.getElementById("judge_textarea").classList.add("wrong");
        return;
    }

    const limititme = document.getElementById("limittime").value;
    const limitmemory = document.getElementById("limitmemory").value;

    const problem_container_DOM = new ProblemContainer(false, [0, limititme, limitmemory]);

    JudgeJson.problemList.forEach((problem) => {
        const problem_setting = [problem.problemSetting.judgeMode, problem.problemSetting.limitTime, problem.problemSetting.limitMemory];
        const problem_DOM = problem_container_DOM.addProblem(problem_setting);
        problem.testcaseList.forEach((testcase) => {
            const testcase_DOM = problem_DOM.addTestcase();
            testcase_DOM.setTestcase(testcase.stdin, testcase.stdout);
            testcase.fileList.forEach((file) => {
                const file_DOM = testcase_DOM.addFile();
                file_DOM.setFile(file.filename, file.contents, file.filetype);
            });
        });
    });

    document.querySelector(".judge_setting_area").appendChild(problem_container_DOM.DOM);

    optionRefresh();

    return problem_container_DOM;
}

function removeJudgeSettingJson(id){
    

    const textarea = document.getElementById("judge_textarea");
    const JudgeData = textarea.value;
    const JudgeJson = JSON.parse(JudgeData);

    const pIndex = Number(id.match(/p(\d+)/) ? id.match(/p(\d+)/)[1]:"0");
    const tIndex = Number(id.match(/t(\d+)/) ? id.match(/t(\d+)/)[1]:"0");
    const fIndex = Number(id.match(/f(\d+)/) ? id.match(/f(\d+)/)[1]:"0");
    
    if(tIndex == 0)
        JudgeJson.problemList.splice(pIndex-1, 1);
    else if(fIndex == 0)
        JudgeJson.problemList[pIndex-1].testcaseList.splice(tIndex-1, 1);
    else{
        JudgeJson.problemList[pIndex-1].testcaseList[tIndex-1].fileList.splice(fIndex-1, 1);
        
    }
    
    if(tIndex != 0 && JudgeJson.problemList[pIndex-1].testcaseList.length == 0)
        JudgeJson.problemList.splice(pIndex-1, 1);
    if(JudgeJson.problemList.length == 0)
        textarea.value = "";
    else
        textarea.value = JSON.stringify(JudgeJson, null, 2);
    
    
    makeDOMbyJudgeJson();
}

function optionRefresh(){
    const textarea = document.getElementById("judge_textarea");
    const JudgeData = textarea.value;
    const JudgeJson = JSON.parse(JudgeData);

    
    document.querySelectorAll('select[name="judge_number"] > option').forEach((option) => {
        option.remove();
    });

    const selectDOM = document.getElementsByName("judge_number")[0];
    for(let Number=1; Number<=JudgeJson.problemList.length; Number++){
        const optionDOM = document.createElement("option");
        optionDOM.innerHTML = Number;
        optionDOM.value = Number;
        selectDOM.appendChild(optionDOM);
    }
}

function modesetup(){
    const modeVal = Number(document.getElementById("mode_input").value);
    const modeName = document.getElementById("mode_name");
    const JudgeVal = document.getElementById("mode_judge");
    const OutputVal = document.getElementById("mode_output");
    const modeDetail = document.getElementById("mode_detail");

    switch(modeVal){
        case 1:
            modeName.innerHTML = "No Judge";
            OutputVal.innerHTML = "Hello, World!";
            modeDetail.innerHTML = "Always pass";
            break;
        case 2:
            modeName.innerHTML = "Number Judge";
            OutputVal.innerHTML = "1234";
            modeDetail.innerHTML = "Check only number";
            break;
        case 3:
            modeName.innerHTML = "Normal Judge";
            OutputVal.innerHTML = "a1b2c3d4";
            modeDetail.innerHTML = "Check except spaces and case letters";
            break;
        case 4:
            modeName.innerHTML = "Perfect Judge";
            OutputVal.innerHTML = "A1 B2 C3 D4";
            modeDetail.innerHTML = "Output must be same";
            break;
    }
    JudgeVal.value = "A1 B2 C3 D4";
    mode_Output_judge();
}

function mode_Output_judge(){
    const judgeMode = Number(document.getElementById("mode_input").value);
    const stdout = document.getElementById("mode_judge").value;
    const expect_stdout = document.getElementById("mode_output").value;
    const result = document.getElementById("mode_result");
    switch(judgeMode){
        case 1:
            result.innerHTML = NoJudge(stdout, expect_stdout) ? "✔️" : "❌";
            break;
        case 2:
            result.innerHTML = NumberJudge(stdout, expect_stdout) ? "✔️" : "❌";
            break;
        case 3:
            result.innerHTML = NormalJudge(stdout, expect_stdout) ? "✔️" : "❌";
            break;
        case 4:
            result.innerHTML = PerfectJudge(stdout, expect_stdout) ? "✔️" : "❌";
            break;
    }
}

window.onload = function(){
    let problem_container_DOM;
    document.getElementById("code_block").addEventListener('keydown', function(e){
        if(e.key == 'Tab'){
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;

            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

            this.selectionStart = this.selectionEnd = start + 1;
        }
        if(e.ctrlKey && e.key == '/'){
            e.preventDefault();
            let isCommented = true;
            let lastindex = this.selectionEnd;
            for(let index= this.value.lastIndexOf("\n", this.selectionStart-1)+1; index<=this.selectionEnd;){
                if(this.value.substring(index, index+2) != "//"){
                    isCommented = false;
                    break;
                }
                index = this.value.indexOf("\n", index)+1;
                if(index == 0)
                    break;
            }
            if(!isCommented){
                for(let index = this.selectionStart; index<=lastindex;){
                    const lastNewLineIndex = this.value.lastIndexOf("\n", index-1);
                    this.value = this.value.substring(0, lastNewLineIndex+1) + "//" + this.value.substring(lastNewLineIndex+1);
                    index = this.value.indexOf("\n", index)+1;
                    lastindex += 2;
                    if(index == 0)
                        break;
                }
            }
            else{
                for(let index = this.selectionStart; index<=lastindex;){
                    const lastNewLineIndex = this.value.lastIndexOf("\n", index-1);
                    const commentIndex = this.value.indexOf("//", lastNewLineIndex);
                    this.value = this.value.substring(0, lastNewLineIndex+1) + this.value.substring(commentIndex+2);
                    lastindex -= 2;
                    index = this.value.indexOf("\n", index)+1;
                    if(index == 0)
                        break;
                }
            }
            this.selectionEnd = lastindex;
        }
        makeJudgeJson();
    });
    getvar(document, () => {
        makeDOMbyJudgeJson();
        modesetup();
        if(document.getElementById("darkmode").checked){
            document.documentElement.classList.add("dark");
        }
        else if(document.documentElement.classList.contains("dark")){
            document.documentElement.classList.remove("dark");
        }
        const popjudge = PopJudge((item) => {
            const popjudge = item.popjudge;
            if(popjudge != undefined){
                chrome.storage.local.remove(["popjudge"]);
                document.querySelector('select[name="judge_number"]').value = popjudge;
                judgejudgeMode();
            }
        });
        
    });

    document.getElementById("run_button").addEventListener("click", runCode);
    document.getElementById("url_code_button").addEventListener("click", GetCodeByURL);
    document.getElementById("mode_input").addEventListener("change", () => {modesetup(); setvar(document)});
    document.getElementById("judge_textarea").addEventListener("blur", makeDOMbyJudgeJson);
    document.getElementById("mode_judge").addEventListener("keyup", mode_Output_judge);
    document.getElementById("mode_output").addEventListener("keyup", mode_Output_judge);

    document.getElementById("code_block").addEventListener("change", () => {setvar(document)});
    document.getElementById("stdin").addEventListener("click", () => {setvar(document)});
    document.getElementById("judge").addEventListener("click", () => {setvar(document)});
    document.getElementById("server_address").addEventListener("change", () => {setvar(document)});
    document.getElementById("judge_textarea").addEventListener("change", () => {setvar(document);});
    document.getElementById("limittime").addEventListener("change", () => {setvar(document)});
    document.getElementById("limitmemory").addEventListener("change", () => {setvar(document);});
    document.getElementById("darkmode").addEventListener("change", () => {
        setvar(document);
        if(document.getElementById("darkmode").checked){
            document.documentElement.classList.add("dark");
        }
        else if(document.documentElement.classList.contains("dark")){
            document.documentElement.classList.remove("dark");
        }
    });
    
    
    document.querySelector(".judge_setting_area").addEventListener("keyup", () => {
        const textarea = document.getElementById("judge_textarea");
        if(textarea != document.activeElement){
            const dict = makeJudgeJson();
            textarea.value = JSON.stringify(dict, null, 2);
            setvar(document);
        }
    });
    document.querySelector(".judge_setting_area").addEventListener("click", () => {
        const id = document.activeElement.id;
        if(id.charAt(id.length-1) == 'r'){
            removeJudgeSettingJson(id);
            setvar(document);
        }
        else if(document.activeElement.className == "add_button"){
            const textarea = document.getElementById("judge_textarea")
            if(textarea != document.activeElement){
                const dict = makeJudgeJson();
                textarea.value = JSON.stringify(dict, null, 2);
            }
            setvar(document);
        }
    });
    document.querySelector(".judge_setting_area").addEventListener("mouseup", ()=>{
            const textarea = document.getElementById("judge_textarea")
            if(textarea != document.activeElement){
                const dict = makeJudgeJson();
                textarea.value = JSON.stringify(dict, null, 2);
            }
            setvar(document);
    })
}