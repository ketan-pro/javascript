function reportError(error) {
    console.error(`Could not run: ${error}`);
}

function dataURItoBlob(dataURI, callback) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new Blob([ab], {type: mimeString});
    return bb;
}

function takeScreenShot() {
    browser.tabs.captureVisibleTab().then((imgUrl) => {
        //download(imgUrl, 'screen_' + (new Date().getMilliseconds()) + '.png', 'image/png');
        var imgBlob = dataURItoBlob(imgUrl);
        browser.storage.local.get().then((results) => {
            var filePath = "";
            filePath += results.xls_file_name? ('/' + results.xls_file_name) : '';
            filePath += results.lang? ('/' + results.lang) : '';
            var tmp = document.getElementById('screenshot_filename').value;
            tmp = tmp.lastIndexOf('.')>0? tmp.substring(0, tmp.lastIndexOf('.')) : tmp;
            filePath += '/' + (tmp? tmp: (results.selected_str_idx? results.selected_str_idx: '0'));
            filePath = (filePath[0] == '/'? filePath.substring(1) : filePath ) + '.png';
            browser.downloads.download({
                url: URL.createObjectURL(imgBlob),
                filename: filePath,
                saveAs: true
            });            
        });
    }, reportError);
}

function markStrings(index) {
    var markerObj = {
        color: document.querySelector('input[name="marker_color"]:checked').value,
        size: document.getElementById('marker_dd').value,
        matchFullStr: document.querySelector('input[name="match_type"]:checked').value == 'full'
    };
    
    inject(() => {
        browser.storage.local.get().then((results) => {
            var lang = results.lang || 'en';
            var arr = results && results[lang]? results[lang] : [];
            if (index) {
                arr = [ arr[index] ];
            }
            index = index? index : 0;
            browser.storage.local.set({ "selected_str_idx": index });
            document.getElementById('screenshot_filename').value = index + '.png';
            browser.tabs.query({ active: true, currentWindow: true })
                .then(curTab => {
                    browser.tabs.sendMessage(curTab[0].id, {
                        command: "markAll",
                        data: arr,
                        marker: markerObj
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

function selectLang() {
    var ele = document.getElementById('active_lang');
    browser.storage.local.set({ "lang": ele.options[ele.selectedIndex].value });
}

function selectMarkerSize() {
    var ele = document.getElementById('marker_dd');
    browser.storage.local.set({ "marker_size": ele.options[ele.selectedIndex].value });
}

function uploadXls() {
    var fileList = document.getElementById('xls_upload_ctrl').files;
    if (fileList.length > 0) {
        var fname = fileList[0].name.substring(0, fileList[0].name.lastIndexOf('.'));
        browser.storage.local.set({ "xls_file_name": fname });
    }
    
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

function initPlugin() {
    browser.commands.onCommand.addListener((command) => {
        console.log(command);
        if (command === 'take-screenshot') {
            takeScreenShot();   
        }
    });

    browser.storage.local.get().then((results) => {
        reloadStringsDropDown(results);
        if (!results.lang) {
            results.lang = 'en';
            browser.storage.local.set({ "lang": results.lang });
        }
        document.getElementById('active_lang').value = results.lang;
    });
}

browser.runtime.onMessage.addListener((msg) => {
    if(msg.command == "screen_capture") {
        takeScreenShot();
    }
});

window.onload = initPlugin;
//document.getElementById('page_body').addEventListener("load", initPlugin, false);
document.getElementById('active_lang').addEventListener("change", selectLang, false);
document.getElementById('marker_dd').addEventListener("change", selectMarkerSize, false);
document.getElementById('upload_xls').addEventListener("click", uploadFile, false);
document.getElementById('mark_str').addEventListener("click", markOne, false);
document.getElementById('mark_all').addEventListener("click", markAll, false);
document.getElementById('screen_shot').addEventListener("click", takeScreenShot, false);
document.getElementById('xls_upload_ctrl').addEventListener("change", uploadXls, false);