﻿"use strict";

function loadAllChrome() {
    chrome.storage.sync.get(null, function (list) {
        if (chrome.runtime.lastError) {
            syncError();
            return;
        }

        //console.log("Filters: loaded", list);
        filters = { wild: {}, direct: {} };
        actions = {} as Actions;
        importAll(list);

        //Always save locally
        saveAllLocal();
    });
}

function saveAllChrome() {
    var list = exportAll();
    //console.log("Filters: saving all", list);
    chrome.storage.sync.set(list, function () {
        if (chrome.runtime.lastError) {
            logError(chrome.runtime.lastError as string);
        }
        else {
            //Remove legacy code
            if (!chrome.runtime.lastError) {
                //console.log("Filters: removing legacy, filters");
                chrome.storage.sync.remove("filters", syncError);
            }
        }
    });
}

function syncDeleteChrome(key: string) {
    chrome.storage.sync.remove(key, syncError);
}

function syncUpdateChrome(key: string, value: any) {
    var i = {} as any;
    i[key] = value;
    chrome.storage.sync.set(i, syncError);
}

chrome.storage.onChanged.addListener(function (changed, namespace) {
    if (namespace != "sync")
        return;
    if (syncType != "chrome")
        return;

    for (var k in changed) {
        var c = changed[k];
        if (k.indexOf(syncActionPrefix) == 0) {
            var action = k.substring(syncActionPrefix.length);
            if (c.oldValue) {
                delete actions[action];
            }
            if (c.newValue) {
                actions[action] = c.newValue;
            }
            continue;
        }
        var sep = k.indexOf(filterFromToSeparator);
        if (sep >= 0) {
            var from = k.substring(0, sep);
            var to = k.substring(sep + filterFromToSeparator.length);
            if (c.oldValue) {
                deleteFilter(from, to);
            }
            if (c.newValue) {
                var f = c.newValue;
                f.from = from;
                f.to = to;
                addFilter(f);
            }
            continue;
        }
        if (k == "settings") {
            if (c.newValue)
                settings = c.newValue;
            continue;
        }
        //Unknown storage key
        console.log("Error, unknown sync storage key", k, c);
    }

    saveAllLocal();
});
