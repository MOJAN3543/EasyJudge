class outputContainer {
    constructor(caseNum){
        this.DOM = document.createElement("div");
        this.DOM.className = "output_container";
    
        this.textareaOut = document.createElement("textarea");
        this.textareaErr = document.createElement("textarea");
        this.textareaOut.className = "output_text";
        this.textareaErr.className = "output_text";
        this.textareaOut.rows = "4";
        this.textareaErr.rows = "4";
        this.textareaOut.spellcheck = false;
        this.textareaErr.spellcheck = false;
        this.textareaOut.wrap = "off";
        this.textareaErr.wrap = "off";
        this.textareaOut.readOnly = true;
        this.textareaErr.readOnly = true;

        this.runtimeA = document.createElement("a");
        this.runtimeA.innerHTML = "🏃‍♂️ Running ...";
        
        if(caseNum == 0){
            this.textareaOut.id = "stdout";
            this.textareaErr.id = "stderr";
            this.runtimeA.id = "stdruntime";
            this.DOM.id = "stdcontainer";
        }
        else{
            this.textareaOut.id = "out" + caseNum;
            this.textareaErr.id = "err" + caseNum;
            this.runtimeA.id = "runtime" + caseNum;
            this.DOM.classList.add("in_testcase");
        }
        const stdoutIndicator = document.createElement("div");
        stdoutIndicator.innerHTML = "🖥️ stdout";
        this.DOM.appendChild(stdoutIndicator);
        this.DOM.appendChild(this.textareaOut);
        const stderrIndicator = document.createElement("div");
        stderrIndicator.innerHTML = "🖥️ stderr";
        this.DOM.appendChild(stderrIndicator);
        this.DOM.appendChild(this.textareaErr);
        

        this.fileOutput = document.createElement("div");
        this.fileOutput.classList.add("invisible");
        this.fileOutput.classList.add("fileoutputcontainer");
        
        const name_button = new name_button_container("file"+caseNum , "📁Output Files", [false, true]);
        name_button.unchecked();
        this.fileOutput.appendChild(name_button.DOM);

        this.DOM.appendChild(this.fileOutput);

        this.DOM.appendChild(this.runtimeA);

    }
    Update(response){
        const responseJson = (response.responseText == "") ? null : JSON.parse(response.responseText);
        switch(response.status){
            case 0:
                this.DOM.classList.add("offline");
                this.textareaOut.value = "";
                this.textareaErr.value = "";
                this.runtimeA.innerHTML = "⛔ Server is offline";
                break;
            case 200:
                this.textareaOut.value = responseJson.stdout;
                this.textareaErr.value = responseJson.stderr;
                this.runtimeA.innerHTML = "🕒 Runtime : "+ responseJson.runtime.toFixed(4) + "s";
                if(responseJson.fileList.length != 0){
                    this.fileOutput.classList.remove("invisible");
                    responseJson.fileList.forEach((file) => {
                        const hr = document.createElement("div");
                        hr.className = "line";
                        this.fileOutput.appendChild(hr);
                        const fileoutput = new FileOutput(file.filename, file.contents)
                        this.fileOutput.appendChild(fileoutput.DOM);
                    });
                }
                break;
            case 408:
            case 413:
            case 400:
            case 500:
                this.DOM.classList.add("error");
                this.textareaOut.value = "";
                this.textareaErr.value = responseJson.stderr;
                this.runtimeA.innerHTML = "⚠️ " + responseJson.message;
                break;
            default:
                this.DOM.classList.add("error");
                this.textareaOut.value = "";
                this.textareaErr.value = "";
                this.runtimeA.innerHTML = "⚠️ Server Error";
                break;
        }
    }
}

class FileOutput{
    constructor(filename, contents){
        this.DOM = document.createElement("div");
        this.DOM.className = "fileoutput";

        const filenameIndicator = document.createElement("div");
        filenameIndicator.innerHTML = "🏷️ File name"
        this.DOM.appendChild(filenameIndicator);
        
        const filenameTextarea = document.createElement("textarea");
        filenameTextarea.className = "output_text";
        filenameTextarea.rows = "2";
        filenameTextarea.spellcheck = false;
        filenameTextarea.wrap = "off";
        filenameTextarea.readOnly = true;
        filenameTextarea.value = filename
        this.DOM.appendChild(filenameTextarea);

        const contentsIndicator = document.createElement("div");
        contentsIndicator.innerHTML = "📝 Contents";
        this.DOM.appendChild(contentsIndicator);

        const contentTextarea = document.createElement("textarea");
        contentTextarea.className = "output_text";
        contentTextarea.rows = "4";
        contentTextarea.spellcheck = false;
        contentTextarea.wrap = "off";
        contentTextarea.readOnly = true;
        contentTextarea.value = contents
        this.DOM.appendChild(contentTextarea);
    }
}

class TestCaseContainer {
    constructor(caseNum){
        this.caseNum = caseNum;
        this.DOM = document.createElement("div");
        this.DOM.className = "testcase_container";
    
        const statusContainerDiv = document.createElement("div");
        statusContainerDiv.className = "status_container";
        

        this.statusDiv = document.createElement("div");
        this.statusDiv.innerHTML = "Test Case <strong>#" + this.caseNum + "</strong> > 🏃‍♂️ Running";
        this.statusDiv.id = "status"+caseNum;

        const detailButton = document.createElement("input");
        detailButton.className = "detail_button";
        detailButton.type = "checkbox";
        detailButton.id = "btn" + caseNum;

        const detailLabel = document.createElement("label");
        detailLabel.className = "detail_label";
        detailLabel.htmlFor = "btn" + caseNum;

        statusContainerDiv.appendChild(this.statusDiv);
        statusContainerDiv.appendChild(detailButton);
        statusContainerDiv.appendChild(detailLabel);

        this.output = new outputContainer(this.caseNum);
        
        this.DOM.id = "case" + this.caseNum;

        this.DOM.appendChild(statusContainerDiv);
        this.DOM.appendChild(this.output.DOM);
    }
    Update(response, JudgeFunc, expect_stdout, expect_fileList){
        const responseJson = (response.responseText == "") ? null : JSON.parse(response.responseText);
        switch(response.status){
            case 0:
                this.statusDiv.innerHTML = "Test Case <strong>#" + (this.caseNum) + "</strong> > ⛔ Server is Offline";
                this.DOM.classList.add("offline");
                break;
            case 200:
                let isCorrect = JudgeFunc(responseJson.stdout, expect_stdout);
                if(responseJson.fileList.length != 0)
                    isCorrect = isCorrect && JudgeFile(responseJson.fileList, expect_fileList, JudgeFunc);
                else if(expect_fileList.length != 0){
                    expect_fileList.forEach((file) => {
                        if(file.filetype == "output")
                            isCorrect = false;
                    });
                }
                if(isCorrect){
                    this.statusDiv.innerHTML = "Test Case <strong>#" + (this.caseNum) + "</strong> >  ✔️ Passed";
                    this.DOM.classList.add("passed");
                }
                else{
                    this.statusDiv.innerHTML = "Test Case <strong>#" + (this.caseNum) + "</strong> >  ❌ Failed";
                    this.DOM.classList.add("failed");
                }
                break;
            case 408:
            case 400:
            case 500:
                this.statusDiv.innerHTML = "Test Case <strong>#" + (this.caseNum) + "</strong> >  ⚠️ Error";
                this.DOM.classList.add("error");
                break;
            default:
                this.statusDiv.innerHTML = "Test Case <strong>#" + (this.caseNum) + "</strong> >  ⚠️ Error";
                this.DOM.classList.add("error");
                break;
        }
        this.output.Update(response);
    }
    
}

class ProblemContainer{
    constructor(makechild, setting){
        this.DOM = document.createElement("div");
        this.DOM.className = "listblock";
        this.DOM.innerHTML = "Problem List";
        this.DOM.id = "ProblemList";
        this.makechild = makechild;
        this.child = [];
        
        if(makechild){
            const problem = new Problem(1, makechild);
            this.DOM.appendChild(problem.DOM);
            this.child.push(problem);
        }
        this.addProblem_buttton = new add_button("pa", "Add Problem");
        this.DOM.appendChild(this.addProblem_buttton.DOM);
        this.addProblem_buttton.DOM.addEventListener("click", () => {
            this.addProblem(setting);
        });
        this.problemCount = makechild?1:0;
    }
    addProblem(setting){
        this.problemCount++;
        const problem = new Problem(this.problemCount, this.makechild, setting);
        this.DOM.insertBefore(problem.DOM, this.addProblem_buttton.DOM);
        this.child.push(problem);
        return problem;
    }
}

class Problem{
    constructor(Num, makechild, problemSetting){
        this.id = "p"+Num;
        this.DOM = document.createElement("div");
        this.DOM.className = "listblock";
        this.makechild = makechild;
        this.child = [];

        const name_button = new name_button_container("p"+Num, "Problem #"+Num, [true, true]);
        this.DOM.appendChild(name_button.DOM);

        this.setting = new ProblemSetting(Num, problemSetting);
        this.DOM.appendChild(this.setting.DOM);

        if(makechild){
            const testcase = new Testcase("p"+Num, 1);
            this.DOM.appendChild(testcase.DOM);
            this.child.push(testcase);
        }

        this.addTestcase_buttton = new add_button("p"+Num+"ta", "Add Testcase");
        this.addTestcase_buttton.DOM.addEventListener("click", () => {
            this.addTestcase();
        });
        this.DOM.appendChild(this.addTestcase_buttton.DOM);

        this.testcaseCount = makechild?1:0;
    }
    addTestcase(){
        this.testcaseCount++;
        const testcase = new Testcase(this.id, this.testcaseCount);
        this.DOM.insertBefore(testcase.DOM, this.addTestcase_buttton.DOM);
        this.child.push(testcase);
        return testcase;
    }
}

class ProblemSetting{
    constructor(Num, problemSetting){
        this.id = "ps" + Num;
        this.DOM = document.createElement("div");
        this.DOM.className = "dictblock";

        const name_button = new name_button_container(this.id, "Problem Setting", [false, false]);
        this.DOM.appendChild(name_button.DOM);

        const setting_container = document.createElement("div");
        setting_container.className = "dictblock";

        const judgeMode = new JudgeInput(this.id+"jm", problemSetting[0]);
        setting_container.appendChild(judgeMode.DOM);

        const limitTime = new numberInput(this.id+"lt", "Limit Time (s)", 0, 0, problemSetting[1]);
        setting_container.appendChild(limitTime.DOM);

        const limitMemory = new numberInput(this.id+"lm", "Limit Memory (MB)", 0, 0, problemSetting[2]);
        setting_container.appendChild(limitMemory.DOM);

        this.DOM.appendChild(setting_container);
    }
}

class Testcase{
    constructor(id, Num){
        this.id = id + "t" + Num;
        this.DOM = document.createElement("div");
        this.DOM.className = "listblock";
        this.child = [];
        
        const name_button = new name_button_container(this.id, "Testcase #" + Num, [true, true]);
        this.DOM.appendChild(name_button.DOM);

        this.content = document.createElement("div");
        this.content.className = "dictblock";
        this.content.innerHTML = "stdin";

        this.stdin = new stringInput(id+"t"+Num+"stdin");
        this.content.appendChild(this.stdin.DOM);

        const a = document.createElement("div");
        a.innerHTML = "stdout";
        this.content.appendChild(a);

        this.stdout = new stringInput(id+"t"+Num+"stdout");
        this.content.appendChild(this.stdout.DOM);

        const fileList_button = new name_button_container(this.id+"f", "File List", [false, true]);
        this.content.appendChild(fileList_button.DOM);

        this.addTestcase_buttton = new add_button(this.id+"fa", "Add File");
        this.addTestcase_buttton.DOM.addEventListener("click", () => {
            this.addFile();
        });

        this.content.appendChild(this.addTestcase_buttton.DOM);
        this.DOM.appendChild(this.content);
        
        this.fileCount = 0;
    }
    addFile(){
        this.fileCount++;
        const filecontainer = new FileContainer(this.id+"f"+this.fileCount, this.fileCount);
        this.content.insertBefore(filecontainer.DOM, this.addTestcase_buttton.DOM);
        this.child.push(filecontainer);
        return filecontainer;
    }
    setTestcase(stdin, stdout){
        this.stdin.setString(stdin);
        this.stdout.setString(stdout);
    }
    
}

class FileContainer {
    constructor(id, Num){
        this.DOM = document.createElement("div");
        this.DOM.className = "listblock";
        
        const File_remove_button = new name_button_container(id, "File #"+Num, [true, false]);
        this.DOM.appendChild(File_remove_button.DOM);

        const Fileblock = document.createElement("div");
        Fileblock.className = "dictblock";
        Fileblock.innerHTML = "File name";

        this.Filename = new stringInput(id + "name");
        
        Fileblock.appendChild(this.Filename.DOM);
        const a = document.createElement("div");
        a.innerHTML = "File contents";
        Fileblock.appendChild(a);

        this.Filecontent = new stringInput(id + "content");
        Fileblock.appendChild(this.Filecontent.DOM);

        this.IO = new IOInput(id+"io");
        Fileblock.appendChild(this.IO.DOM);
        
        this.DOM.appendChild(Fileblock);
    }
    setFile(Filename, Filecontent, Filetype){
        this.Filename.setString(Filename);
        this.Filecontent.setString(Filecontent);
        this.IO.setType(Filetype);
    }
}

class JudgeInput{
    constructor(id, val){
        this.DOM = document.createElement("div");
        this.DOM.className = "selectInput";
        this.DOM.innerHTML = "Judge Mode";

        this.select = document.createElement("select");
        this.select.id = id;
        
        const JudgetypeList = ["Local Judge type", "No Judge", "Number Judge", "Normal Judge", "Perfect Judge"];

        JudgetypeList.forEach((Judgetype, index) => {
            const optionDOM = document.createElement("option");
            optionDOM.value = index;
            optionDOM.innerHTML = Judgetype;

            // optionDOM.selected = index == 0; // selected: "Local Judge type";
            
            this.select.appendChild(optionDOM);
        });

        this.select.value = val;

        this.DOM.appendChild(this.select);
    }
}

class IOInput {
    constructor(id){
        this.DOM = document.createElement("div");
        this.DOM.className = "selectInput";
        this.DOM.innerHTML = "File Type";

        this.select = document.createElement("select");
        this.select.id = id;
        
        const input = document.createElement("option");
        input.value = "input";
        input.innerHTML = "Input";
        input.selected = true;

        const output = document.createElement("option");
        output.value = "output";
        output.innerHTML = "Output";

        this.select.appendChild(input);
        this.select.appendChild(output);

        this.DOM.appendChild(this.select);
    }
    setType(Type){
        this.select.value = Type;
    }
}

class numberInput {
    constructor(id, content, min, max, val){
        this.DOM = document.createElement("div");
        this.DOM.className = "numberInput";
        this.DOM.innerHTML = content;

        this.input = document.createElement("input");
        this.input.type = "number";
        this.input.id = id;
        this.input.value = val;

        if(min != max){
            this.input.max = max;
            this.input.min = min;
        }
        this.DOM.appendChild(this.input);
    }
}

class stringInput {
    constructor(id){
        this.DOM = document.createElement("div");
        this.DOM.className = "stringInput";
        
        this.textarea = document.createElement("textarea");
        this.textarea.rows = "3";
        this.textarea.spellcheck = false;
        this.textarea.wrap = "off";
        this.textarea.id = id;

        this.DOM.appendChild(this.textarea);
    }
    setString(string){
        this.textarea.value = string;
    }
    getString(){
        return this.textarea.value;
    }
}

class name_button_container{
    constructor(id, contents, button_boolean){
        this.DOM = document.createElement("div");
        this.DOM.className = "name_button_container";
        this.DOM.innerHTML = contents;

        this.button = new button_container(id, button_boolean);

        this.DOM.appendChild(this.button.DOM);
    }
    unchecked(){
        this.button.unchecked();
    }
}

class button_container {
    constructor(id, button_boolean){ // remove / detail button create?
        this.DOM = document.createElement("div");
        this.DOM.className = "button_container";
        
        if(button_boolean[0]){
            const remove_button = document.createElement("button");
            remove_button.className = "remove_button";
            remove_button.innerHTML = "⛌";
            remove_button.id = id+"r";
            this.DOM.appendChild(remove_button);
        }

        if(button_boolean[1]){
            this.detail_button = document.createElement("input");
            this.detail_button.className = "detail_button";
            this.detail_button.type = "checkbox";
            this.detail_button.id = id;
            this.detail_button.checked = true;
            const detail_label = document.createElement("label");
            detail_label.className = "detail_label";
            detail_label.htmlFor = id;

            
            this.DOM.appendChild(this.detail_button);
            this.DOM.appendChild(detail_label);
        }
    }
    unchecked(){
        this.detail_button.checked = false;
    }
}

class add_button{
    constructor(id, content){
        this.DOM = document.createElement("div");
        this.DOM.classList.add("listblock", "plus");

        const button = document.createElement("button");
        button.className = "add_button";
        button.id = id;
        button.innerHTML = content;
        
        this.DOM.appendChild(button);
    }    
}

function JudgeFile(fileList, expect_fileList, JudgeFunc){
    let comapare_result = true;
    const fileListdict = {};

    fileList.forEach((file) => {
        fileListdict[file.filename] = file.contents;
    });
    const expect_fileListdict = {};
    expect_fileList.forEach((file) => {
        if(file.filetype == "output")
            expect_fileListdict[file.filename] = file.contents;
    });


    Object.keys(fileListdict).forEach((key) => {
        if(expect_fileListdict[key] != undefined){
            const result = JudgeFunc(fileListdict[key], expect_fileListdict[key]);
            comapare_result = comapare_result && result;
        } else{
            comapare_result = false;
        }
    });
    return comapare_result;
}


export {outputContainer, TestCaseContainer};

export {ProblemContainer, FileContainer, stringInput};