function reportError(error) {
    console.error(`Could not run: ${error}`);
}
function takeScreenShot() {
    browser.tabs.captureVisibleTab().then((imgUrl) => {
        download(imgUrl, 'screen_' + (new Date().getMilliseconds()) + '.png', 'image/png');
    }, reportError);
}

function markStrings(index) {
    inject(() => {
        browser.storage.local.get().then((results) => {
            var lang = results.lang || 'en';
            var arr = results && results[lang]? results[lang] : [];
            if (index) {
                arr = [ arr[index] ];
            }
            browser.tabs.query({ active: true, currentWindow: true })
                .then(curTab => {
                    browser.tabs.sendMessage(curTab[0].id, {
                        command: "markAll",
                        data: arr
                    });
                }).catch(reportError);
            });
    });
}

function markAll() {
    markStrings();
}

function markOne() {
    var e = document.getElementById('dd_strings');
    var i = e.options[e.selectedIndex].value;
    markStrings(i);
}

function initPlugin() {
    browser.commands.onCommand.addListener((command) => {
        console.log(command);
        if (command === 'take-screenshot') {
            takeScreenShot();   
        }
    });

    browser.storage.local.get().then((results) => {
        reloadStringsDropDown(results);
        document.getElementById('active_lang').value = results.lang || "en";
    });
}

function selectLang() {
    var ele = document.getElementById('active_lang');
    browser.storage.local.set({ "lang": ele.options[ele.selectedIndex].value });
}

function uploadXls() {
    var fileList = document.getElementById('xls_upload_ctrl').files;
    for (i = 0; i < fileList.length; i++) {
        var file = fileList[i];

        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
        if (regex.test(file.name.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();

                //For Browsers other than IE.
                if (reader.readAsBinaryString) {
                    reader.onload = function (e) {
                        ProcessExcel(e.target.result);
                    };
                    reader.readAsBinaryString(file);
                } else {
                    //For IE Browser.
                    reader.onload = function (e) {
                        var data = "";
                        var bytes = new Uint8Array(e.target.result);
                        for (var i = 0; i < bytes.byteLength; i++) {
                            data += String.fromCharCode(bytes[i]);
                        }
                        ProcessExcel(data);
                    };
                    reader.readAsArrayBuffer(file);
                }
            } else {
                alert("This browser does not support HTML5.");
            }
        } else {
            alert("Please upload a valid Excel file.");
        }
    }
}

function storeData(obj) {
    browser.storage.local.set(obj);
    reloadStringsDropDown(obj);
}

function reloadStringsDropDown(obj) {
    var dd = document.getElementById('dd_strings');
    dd.innerHTML = null;
    if (obj && obj.en) {
        for (var i=0; i<obj.en.length; i++) {
            dd.options.add(new Option(obj.en[i], i, false, false));
        }
    }    
}

function ProcessExcel(data) {
    var workbook = XLSX.read(data, {
        type: 'binary'
    });

    var firstSheet = workbook.SheetNames[0];
    var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);

    var xlsObj = {
        en: [],
        ja: [],
        zh: []
    };
    for(var i=0; i<excelRows.length; i++) {
        xlsObj.en[i] = excelRows[i].Source;
        xlsObj.ja[i] = excelRows[i].Target_ja;
        xlsObj.zh[i] = excelRows[i].Target_sc;   
    }
    storeData(xlsObj);
};
function uploadFile() {
    document.getElementById('xls_upload_ctrl').click();
}
function inject(cb) {
    browser.tabs.executeScript({ file: "/scripts/highlighter.js" }).then(()=> {
        browser.tabs.executeScript({ file: "/scripts/injector.js" }).then(cb);
    });    
}

browser.runtime.onMessage.addListener((msg) => {
    if(msg.command == "screen_capture") {
        takeScreenShot();
    }
});

document.getElementById('page_body').addEventListener("load", initPlugin, false);
document.getElementById('active_lang').addEventListener("change", selectLang, false);
document.getElementById('upload_xls').addEventListener("click", uploadFile, false);
document.getElementById('mark_str').addEventListener("click", markOne, false);
document.getElementById('mark_all').addEventListener("click", markAll, false);
document.getElementById('screen_shot').addEventListener("click", takeScreenShot, false);
document.getElementById('xls_upload_ctrl').addEventListener("change", uploadXls, false);