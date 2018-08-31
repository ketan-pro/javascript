function JsonUtil() {
    this.flatten = function(data) {
        var result = {};
        function recurse (cur, prop) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for(var i=0, l=cur.length; i<l; i++)
                    recurse(cur[i], prop + "[" + i + "]");
                if (l == 0)
                    result[prop] = [];
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop+"."+p : p);
                }
                if (isEmpty && prop)
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    };

    this.unflatten = function(data) {
        "use strict";
        if (Object(data) !== data || Array.isArray(data))
            return data;
        var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
            resultholder = {};
        for (var p in data) {
            var cur = resultholder,
                prop = "",
                m;
            while (m = regex.exec(p)) {
                cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
                prop = m[2] || m[1];
            }
            cur[prop] = data[p];
        }
        return resultholder[""] || resultholder;
    };

    this.print = function(obj) {
        return JSON.stringify(obj, null, 4);
    };
}

function FileUtil() {
    this.readText = function(readFile, cb) {
        var reader = new FileReader();
        reader.readAsText(readFile, "UTF-8");
        reader.onload = function(evt) {
            var fileString = evt.target.result;
            cb(fileString);
        };
    }

    this.download = function(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
}


var util = new function() {
    this.json = new JsonUtil();
    this.file = new FileUtil();
}
