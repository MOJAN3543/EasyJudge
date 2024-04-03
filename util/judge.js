function NoJudge(stdout, expect_stdout){
    return true;
}
function NumberJudge(stdout, expect_stdout){
    const regex = /[^0-9]/g;
    stdout = stdout.replace(regex, "");
    expect_stdout = expect_stdout.replace(regex, "");
    const comapare_result = stdout === expect_stdout;
    return comapare_result;
}
function NormalJudge(stdout, expect_stdout){
    stdout = stdout.toUpperCase();
    expect_stdout = expect_stdout.toUpperCase();
    const regex = /[^!-~]/g;
    stdout = stdout.replace(regex, "");
    expect_stdout = expect_stdout.replace(regex, "");
    const comapare_result = stdout === expect_stdout;
    return comapare_result;
}
function PerfectJudge(stdout, expect_stdout){ 
    stdout = stdout.trim();
    expect_stdout = expect_stdout.trim();
    const comapare_result = stdout === expect_stdout;
    return comapare_result;
}



export {NoJudge, NumberJudge, NormalJudge, PerfectJudge};