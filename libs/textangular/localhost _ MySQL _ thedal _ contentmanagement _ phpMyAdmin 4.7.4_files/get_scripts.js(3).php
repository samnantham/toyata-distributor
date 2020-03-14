// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var HINT_ELEMENT_CLASS        = "CodeMirror-hint";
  var ACTIVE_HINT_ELEMENT_CLASS = "CodeMirror-hint-active";

  // This is the old interface, kept around for now to stay
  // backwards-compatible.
  CodeMirror.showHint = function(cm, getHints, options) {
    if (!getHints) return cm.showHint(options);
    if (options && options.async) getHints.async = true;
    var newOpts = {hint: getHints};
    if (options) for (var prop in options) newOpts[prop] = options[prop];
    return cm.showHint(newOpts);
  };

  CodeMirror.defineExtension("showHint", function(options) {
    options = parseOptions(this, this.getCursor("start"), options);
    var selections = this.listSelections()
    if (selections.length > 1) return;
    // By default, don't allow completion when something is selected.
    // A hint function can have a `supportsSelection` property to
    // indicate that it can handle selections.
    if (this.somethingSelected()) {
      if (!options.hint.supportsSelection) return;
      // Don't try with cross-line selections
      for (var i = 0; i < selections.length; i++)
        if (selections[i].head.line != selections[i].anchor.line) return;
    }

    if (this.state.completionActive) this.state.completionActive.close();
    var completion = this.state.completionActive = new Completion(this, options);
    if (!completion.options.hint) return;

    CodeMirror.signal(this, "startCompletion", this);
    completion.update(true);
  });

  function Completion(cm, options) {
    this.cm = cm;
    this.options = options;
    this.widget = null;
    this.debounce = 0;
    this.tick = 0;
    this.startPos = this.cm.getCursor("start");
    this.startLen = this.cm.getLine(this.startPos.line).length - this.cm.getSelection().length;

    var self = this;
    cm.on("cursorActivity", this.activityFunc = function() { self.cursorActivity(); });
  }

  var requestAnimationFrame = window.requestAnimationFrame || function(fn) {
    return setTimeout(fn, 1000/60);
  };
  var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

  Completion.prototype = {
    close: function() {
      if (!this.active()) return;
      this.cm.state.completionActive = null;
      this.tick = null;
      this.cm.off("cursorActivity", this.activityFunc);

      if (this.widget && this.data) CodeMirror.signal(this.data, "close");
      if (this.widget) this.widget.close();
      CodeMirror.signal(this.cm, "endCompletion", this.cm);
    },

    active: function() {
      return this.cm.state.completionActive == this;
    },

    pick: function(data, i) {
      var completion = data.list[i];
      if (completion.hint) completion.hint(this.cm, data, completion);
      else this.cm.replaceRange(getText(completion), completion.from || data.from,
                                completion.to || data.to, "complete");
      CodeMirror.signal(data, "pick", completion);
      this.close();
    },

    cursorActivity: function() {
      if (this.debounce) {
        cancelAnimationFrame(this.debounce);
        this.debounce = 0;
      }

      var pos = this.cm.getCursor(), line = this.cm.getLine(pos.line);
      if (pos.line != this.startPos.line || line.length - pos.ch != this.startLen - this.startPos.ch ||
          pos.ch < this.startPos.ch || this.cm.somethingSelected() ||
          (pos.ch && this.options.closeCharacters.test(line.charAt(pos.ch - 1)))) {
        this.close();
      } else {
        var self = this;
        this.debounce = requestAnimationFrame(function() {self.update();});
        if (this.widget) this.widget.disable();
      }
    },

    update: function(first) {
      if (this.tick == null) return
      var self = this, myTick = ++this.tick
      fetchHints(this.options.hint, this.cm, this.options, function(data) {
        if (self.tick == myTick) self.finishUpdate(data, first)
      })
    },

    finishUpdate: function(data, first) {
      if (this.data) CodeMirror.signal(this.data, "update");

      var picked = (this.widget && this.widget.picked) || (first && this.options.completeSingle);
      if (this.widget) this.widget.close();

      if (data && this.data && isNewCompletion(this.data, data)) return;
      this.data = data;

      if (data && data.list.length) {
        if (picked && data.list.length == 1) {
          this.pick(data, 0);
        } else {
          this.widget = new Widget(this, data);
          CodeMirror.signal(data, "shown");
        }
      }
    }
  };

  function isNewCompletion(old, nw) {
    var moved = CodeMirror.cmpPos(nw.from, old.from)
    return moved > 0 && old.to.ch - old.from.ch != nw.to.ch - nw.from.ch
  }

  function parseOptions(cm, pos, options) {
    var editor = cm.options.hintOptions;
    var out = {};
    for (var prop in defaultOptions) out[prop] = defaultOptions[prop];
    if (editor) for (var prop in editor)
      if (editor[prop] !== undefined) out[prop] = editor[prop];
    if (options) for (var prop in options)
      if (options[prop] !== undefined) out[prop] = options[prop];
    if (out.hint.resolve) out.hint = out.hint.resolve(cm, pos)
    return out;
  }

  function getText(completion) {
    if (typeof completion == "string") return completion;
    else return completion.text;
  }

  function buildKeyMap(completion, handle) {
    var baseMap = {
      Up: function() {handle.moveFocus(-1);},
      Down: function() {handle.moveFocus(1);},
      PageUp: function() {handle.moveFocus(-handle.menuSize() + 1, true);},
      PageDown: function() {handle.moveFocus(handle.menuSize() - 1, true);},
      Home: function() {handle.setFocus(0);},
      End: function() {handle.setFocus(handle.length - 1);},
      Enter: handle.pick,
      Tab: handle.pick,
      Esc: handle.close
    };
    var custom = completion.options.customKeys;
    var ourMap = custom ? {} : baseMap;
    function addBinding(key, val) {
      var bound;
      if (typeof val != "string")
        bound = function(cm) { return val(cm, handle); };
      // This mechanism is deprecated
      else if (baseMap.hasOwnProperty(val))
        bound = baseMap[val];
      else
        bound = val;
      ourMap[key] = bound;
    }
    if (custom)
      for (var key in custom) if (custom.hasOwnProperty(key))
        addBinding(key, custom[key]);
    var extra = completion.options.extraKeys;
    if (extra)
      for (var key in extra) if (extra.hasOwnProperty(key))
        addBinding(key, extra[key]);
    return ourMap;
  }

  function getHintElement(hintsElement, el) {
    while (el && el != hintsElement) {
      if (el.nodeName.toUpperCase() === "LI" && el.parentNode == hintsElement) return el;
      el = el.parentNode;
    }
  }

  function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    this.picked = false;
    var widget = this, cm = completion.cm;

    var hints = this.hints = document.createElement("ul");
    hints.className = "CodeMirror-hints";
    this.selectedHint = data.selectedHint || 0;

    var completions = data.list;
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(document.createElement("li")), cur = completions[i];
      var className = HINT_ELEMENT_CLASS + (i != this.selectedHint ? "" : " " + ACTIVE_HINT_ELEMENT_CLASS);
      if (cur.className != null) className = cur.className + " " + className;
      elt.className = className;
      if (cur.render) cur.render(elt, data, cur);
      else elt.appendChild(document.createTextNode(cur.displayText || getText(cur)));
      elt.hintId = i;
    }

    var pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null);
    var left = pos.left, top = pos.bottom, below = true;
    hints.style.left = left + "px";
    hints.style.top = top + "px";
    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
    (completion.options.container || document.body).appendChild(hints);
    var box = hints.getBoundingClientRect(), overlapY = box.bottom - winH;
    var scrolls = hints.scrollHeight > hints.clientHeight + 1
    var startScroll = cm.getScrollInfo();

    if (overlapY > 0) {
      var height = box.bottom - box.top, curTop = pos.top - (pos.bottom - box.top);
      if (curTop - height > 0) { // Fits above cursor
        hints.style.top = (top = pos.top - height) + "px";
        below = false;
      } else if (height > winH) {
        hints.style.height = (winH - 5) + "px";
        hints.style.top = (top = pos.bottom - box.top) + "px";
        var cursor = cm.getCursor();
        if (data.from.ch != cursor.ch) {
          pos = cm.cursorCoords(cursor);
          hints.style.left = (left = pos.left) + "px";
          box = hints.getBoundingClientRect();
        }
      }
    }
    var overlapX = box.right - winW;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = (winW - 5) + "px";
        overlapX -= (box.right - box.left) - winW;
      }
      hints.style.left = (left = pos.left - overlapX) + "px";
    }
    if (scrolls) for (var node = hints.firstChild; node; node = node.nextSibling)
      node.style.paddingRight = cm.display.nativeBarWidth + "px"

    cm.addKeyMap(this.keyMap = buildKeyMap(completion, {
      moveFocus: function(n, avoidWrap) { widget.changeActive(widget.selectedHint + n, avoidWrap); },
      setFocus: function(n) { widget.changeActive(n); },
      menuSize: function() { return widget.screenAmount(); },
      length: completions.length,
      close: function() { completion.close(); },
      pick: function() { widget.pick(); },
      data: data
    }));

    if (completion.options.closeOnUnfocus) {
      var closingOnBlur;
      cm.on("blur", this.onBlur = function() { closingOnBlur = setTimeout(function() { completion.close(); }, 100); });
      cm.on("focus", this.onFocus = function() { clearTimeout(closingOnBlur); });
    }

    cm.on("scroll", this.onScroll = function() {
      var curScroll = cm.getScrollInfo(), editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top;
      var point = newTop - (window.pageYOffset || (document.documentElement || document.body).scrollTop);
      if (!below) point += hints.offsetHeight;
      if (point <= editor.top || point >= editor.bottom) return completion.close();
      hints.style.top = newTop + "px";
      hints.style.left = (left + startScroll.left - curScroll.left) + "px";
    });

    CodeMirror.on(hints, "dblclick", function(e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {widget.changeActive(t.hintId); widget.pick();}
    });

    CodeMirror.on(hints, "click", function(e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        if (completion.options.completeOnSingleClick) widget.pick();
      }
    });

    CodeMirror.on(hints, "mousedown", function() {
      setTimeout(function(){cm.focus();}, 20);
    });

    CodeMirror.signal(data, "select", completions[0], hints.firstChild);
    return true;
  }

  Widget.prototype = {
    close: function() {
      if (this.completion.widget != this) return;
      this.completion.widget = null;
      this.hints.parentNode.removeChild(this.hints);
      this.completion.cm.removeKeyMap(this.keyMap);

      var cm = this.completion.cm;
      if (this.completion.options.closeOnUnfocus) {
        cm.off("blur", this.onBlur);
        cm.off("focus", this.onFocus);
      }
      cm.off("scroll", this.onScroll);
    },

    disable: function() {
      this.completion.cm.removeKeyMap(this.keyMap);
      var widget = this;
      this.keyMap = {Enter: function() { widget.picked = true; }};
      this.completion.cm.addKeyMap(this.keyMap);
    },

    pick: function() {
      this.completion.pick(this.data, this.selectedHint);
    },

    changeActive: function(i, avoidWrap) {
      if (i >= this.data.list.length)
        i = avoidWrap ? this.data.list.length - 1 : 0;
      else if (i < 0)
        i = avoidWrap ? 0  : this.data.list.length - 1;
      if (this.selectedHint == i) return;
      var node = this.hints.childNodes[this.selectedHint];
      node.className = node.className.replace(" " + ACTIVE_HINT_ELEMENT_CLASS, "");
      node = this.hints.childNodes[this.selectedHint = i];
      node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
      if (node.offsetTop < this.hints.scrollTop)
        this.hints.scrollTop = node.offsetTop - 3;
      else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop + this.hints.clientHeight)
        this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
      CodeMirror.signal(this.data, "select", this.data.list[this.selectedHint], node);
    },

    screenAmount: function() {
      return Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1;
    }
  };

  function applicableHelpers(cm, helpers) {
    if (!cm.somethingSelected()) return helpers
    var result = []
    for (var i = 0; i < helpers.length; i++)
      if (helpers[i].supportsSelection) result.push(helpers[i])
    return result
  }

  function fetchHints(hint, cm, options, callback) {
    if (hint.async) {
      hint(cm, callback, options)
    } else {
      var result = hint(cm, options)
      if (result && result.then) result.then(callback)
      else callback(result)
    }
  }

  function resolveAutoHints(cm, pos) {
    var helpers = cm.getHelpers(pos, "hint"), words
    if (helpers.length) {
      var resolved = function(cm, callback, options) {
        var app = applicableHelpers(cm, helpers);
        function run(i) {
          if (i == app.length) return callback(null)
          fetchHints(app[i], cm, options, function(result) {
            if (result && result.list.length > 0) callback(result)
            else run(i + 1)
          })
        }
        run(0)
      }
      resolved.async = true
      resolved.supportsSelection = true
      return resolved
    } else if (words = cm.getHelper(cm.getCursor(), "hintWords")) {
      return function(cm) { return CodeMirror.hint.fromList(cm, {words: words}) }
    } else if (CodeMirror.hint.anyword) {
      return function(cm, options) { return CodeMirror.hint.anyword(cm, options) }
    } else {
      return function() {}
    }
  }

  CodeMirror.registerHelper("hint", "auto", {
    resolve: resolveAutoHints
  });

  CodeMirror.registerHelper("hint", "fromList", function(cm, options) {
    var cur = cm.getCursor(), token = cm.getTokenAt(cur);
    var to = CodeMirror.Pos(cur.line, token.end);
    if (token.string && /\w/.test(token.string[token.string.length - 1])) {
      var term = token.string, from = CodeMirror.Pos(cur.line, token.start);
    } else {
      var term = "", from = to;
    }
    var found = [];
    for (var i = 0; i < options.words.length; i++) {
      var word = options.words[i];
      if (word.slice(0, term.length) == term)
        found.push(word);
    }

    if (found.length) return {list: found, from: from, to: to};
  });

  CodeMirror.commands.autocomplete = CodeMirror.showHint;

  var defaultOptions = {
    hint: CodeMirror.hint.auto,
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s()\[\]{};:>,]/,
    closeOnUnfocus: true,
    completeOnSingleClick: true,
    container: null,
    customKeys: null,
    extraKeys: null
  };

  CodeMirror.defineOption("hintOptions", null);
});
;

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../mode/sql/sql"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../mode/sql/sql"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var tables;
  var defaultTable;
  var keywords;
  var CONS = {
    QUERY_DIV: ";",
    ALIAS_KEYWORD: "AS"
  };
  var Pos = CodeMirror.Pos, cmpPos = CodeMirror.cmpPos;

  function isArray(val) { return Object.prototype.toString.call(val) == "[object Array]" }

  function getKeywords(editor) {
    var mode = editor.doc.modeOption;
    if (mode === "sql") mode = "text/x-sql";
    return CodeMirror.resolveMode(mode).keywords;
  }

  function getText(item) {
    return typeof item == "string" ? item : item.text;
  }

  function wrapTable(name, value) {
    if (isArray(value)) value = {columns: value}
    if (!value.text) value.text = name
    return value
  }

  function parseTables(input) {
    var result = {}
    if (isArray(input)) {
      for (var i = input.length - 1; i >= 0; i--) {
        var item = input[i]
        result[getText(item).toUpperCase()] = wrapTable(getText(item), item)
      }
    } else if (input) {
      for (var name in input)
        result[name.toUpperCase()] = wrapTable(name, input[name])
    }
    return result
  }

  function getTable(name) {
    return tables[name.toUpperCase()]
  }

  function shallowClone(object) {
    var result = {};
    for (var key in object) if (object.hasOwnProperty(key))
      result[key] = object[key];
    return result;
  }

  function match(string, word) {
    var len = string.length;
    var sub = getText(word).substr(0, len);
    return string.toUpperCase() === sub.toUpperCase();
  }

  function addMatches(result, search, wordlist, formatter) {
    if (isArray(wordlist)) {
      for (var i = 0; i < wordlist.length; i++)
        if (match(search, wordlist[i])) result.push(formatter(wordlist[i]))
    } else {
      for (var word in wordlist) if (wordlist.hasOwnProperty(word)) {
        var val = wordlist[word]
        if (!val || val === true)
          val = word
        else
          val = val.displayText ? {text: val.text, displayText: val.displayText} : val.text
        if (match(search, val)) result.push(formatter(val))
      }
    }
  }

  function cleanName(name) {
    // Get rid name from backticks(`) and preceding dot(.)
    if (name.charAt(0) == ".") {
      name = name.substr(1);
    }
    return name.replace(/`/g, "");
  }

  function insertBackticks(name) {
    var nameParts = getText(name).split(".");
    for (var i = 0; i < nameParts.length; i++)
      nameParts[i] = "`" + nameParts[i] + "`";
    var escaped = nameParts.join(".");
    if (typeof name == "string") return escaped;
    name = shallowClone(name);
    name.text = escaped;
    return name;
  }

  function nameCompletion(cur, token, result, editor) {
    // Try to complete table, column names and return start position of completion
    var useBacktick = false;
    var nameParts = [];
    var start = token.start;
    var cont = true;
    while (cont) {
      cont = (token.string.charAt(0) == ".");
      useBacktick = useBacktick || (token.string.charAt(0) == "`");

      start = token.start;
      nameParts.unshift(cleanName(token.string));

      token = editor.getTokenAt(Pos(cur.line, token.start));
      if (token.string == ".") {
        cont = true;
        token = editor.getTokenAt(Pos(cur.line, token.start));
      }
    }

    // Try to complete table names
    var string = nameParts.join(".");
    addMatches(result, string, tables, function(w) {
      return useBacktick ? insertBackticks(w) : w;
    });

    // Try to complete columns from defaultTable
    addMatches(result, string, defaultTable, function(w) {
      return useBacktick ? insertBackticks(w) : w;
    });

    // Try to complete columns
    string = nameParts.pop();
    var table = nameParts.join(".");

    var alias = false;
    var aliasTable = table;
    // Check if table is available. If not, find table by Alias
    if (!getTable(table)) {
      var oldTable = table;
      table = findTableByAlias(table, editor);
      if (table !== oldTable) alias = true;
    }

    var columns = getTable(table);
    if (columns && columns.columns)
      columns = columns.columns;

    if (columns) {
      addMatches(result, string, columns, function(w) {
        var tableInsert = table;
        if (alias == true) tableInsert = aliasTable;
        if (typeof w == "string") {
          w = tableInsert + "." + w;
        } else {
          w = shallowClone(w);
          w.text = tableInsert + "." + w.text;
        }
        return useBacktick ? insertBackticks(w) : w;
      });
    }

    return start;
  }

  function eachWord(lineText, f) {
    if (!lineText) return;
    var excepted = /[,;]/g;
    var words = lineText.split(" ");
    for (var i = 0; i < words.length; i++) {
      f(words[i]?words[i].replace(excepted, '') : '');
    }
  }

  function findTableByAlias(alias, editor) {
    var doc = editor.doc;
    var fullQuery = doc.getValue();
    var aliasUpperCase = alias.toUpperCase();
    var previousWord = "";
    var table = "";
    var separator = [];
    var validRange = {
      start: Pos(0, 0),
      end: Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
    };

    //add separator
    var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
    while(indexOfSeparator != -1) {
      separator.push(doc.posFromIndex(indexOfSeparator));
      indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator+1);
    }
    separator.unshift(Pos(0, 0));
    separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));

    //find valid range
    var prevItem = null;
    var current = editor.getCursor()
    for (var i = 0; i < separator.length; i++) {
      if ((prevItem == null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0) {
        validRange = {start: prevItem, end: separator[i]};
        break;
      }
      prevItem = separator[i];
    }

    var query = doc.getRange(validRange.start, validRange.end, false);

    for (var i = 0; i < query.length; i++) {
      var lineText = query[i];
      eachWord(lineText, function(word) {
        var wordUpperCase = word.toUpperCase();
        if (wordUpperCase === aliasUpperCase && getTable(previousWord))
          table = previousWord;
        if (wordUpperCase !== CONS.ALIAS_KEYWORD)
          previousWord = word;
      });
      if (table) break;
    }
    return table;
  }

  CodeMirror.registerHelper("hint", "sql", function(editor, options) {
    tables = parseTables(options && options.tables)
    var defaultTableName = options && options.defaultTable;
    var disableKeywords = options && options.disableKeywords;
    defaultTable = defaultTableName && getTable(defaultTableName);
    keywords = getKeywords(editor);

    if (defaultTableName && !defaultTable)
      defaultTable = findTableByAlias(defaultTableName, editor);

    defaultTable = defaultTable || [];

    if (defaultTable.columns)
      defaultTable = defaultTable.columns;

    var cur = editor.getCursor();
    var result = [];
    var token = editor.getTokenAt(cur), start, end, search;
    if (token.end > cur.ch) {
      token.end = cur.ch;
      token.string = token.string.slice(0, cur.ch - token.start);
    }

    if (token.string.match(/^[.`\w@]\w*$/)) {
      search = token.string;
      start = token.start;
      end = token.end;
    } else {
      start = end = cur.ch;
      search = "";
    }
    if (search.charAt(0) == "." || search.charAt(0) == "`") {
      start = nameCompletion(cur, token, result, editor);
    } else {
      addMatches(result, search, tables, function(w) {return w;});
      addMatches(result, search, defaultTable, function(w) {return w;});
      if (!disableKeywords)
        addMatches(result, search, keywords, function(w) {return w.toUpperCase();});
    }

    return {list: result, from: Pos(cur.line, start), to: Pos(cur.line, end)};
  });
});
;

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";
  var GUTTER_ID = "CodeMirror-lint-markers";

  function showTooltip(e, content) {
    var tt = document.createElement("div");
    tt.className = "CodeMirror-lint-tooltip";
    tt.appendChild(content.cloneNode(true));
    document.body.appendChild(tt);

    function position(e) {
      if (!tt.parentNode) return CodeMirror.off(document, "mousemove", position);
      tt.style.top = Math.max(0, e.clientY - tt.offsetHeight - 5) + "px";
      tt.style.left = (e.clientX + 5) + "px";
    }
    CodeMirror.on(document, "mousemove", position);
    position(e);
    if (tt.style.opacity != null) tt.style.opacity = 1;
    return tt;
  }
  function rm(elt) {
    if (elt.parentNode) elt.parentNode.removeChild(elt);
  }
  function hideTooltip(tt) {
    if (!tt.parentNode) return;
    if (tt.style.opacity == null) rm(tt);
    tt.style.opacity = 0;
    setTimeout(function() { rm(tt); }, 600);
  }

  function showTooltipFor(e, content, node) {
    var tooltip = showTooltip(e, content);
    function hide() {
      CodeMirror.off(node, "mouseout", hide);
      if (tooltip) { hideTooltip(tooltip); tooltip = null; }
    }
    var poll = setInterval(function() {
      if (tooltip) for (var n = node;; n = n.parentNode) {
        if (n && n.nodeType == 11) n = n.host;
        if (n == document.body) return;
        if (!n) { hide(); break; }
      }
      if (!tooltip) return clearInterval(poll);
    }, 400);
    CodeMirror.on(node, "mouseout", hide);
  }

  function LintState(cm, options, hasGutter) {
    this.marked = [];
    this.options = options;
    this.timeout = null;
    this.hasGutter = hasGutter;
    this.onMouseOver = function(e) { onMouseOver(cm, e); };
    this.waitingFor = 0
  }

  function parseOptions(_cm, options) {
    if (options instanceof Function) return {getAnnotations: options};
    if (!options || options === true) options = {};
    return options;
  }

  function clearMarks(cm) {
    var state = cm.state.lint;
    if (state.hasGutter) cm.clearGutter(GUTTER_ID);
    for (var i = 0; i < state.marked.length; ++i)
      state.marked[i].clear();
    state.marked.length = 0;
  }

  function makeMarker(labels, severity, multiple, tooltips) {
    var marker = document.createElement("div"), inner = marker;
    marker.className = "CodeMirror-lint-marker-" + severity;
    if (multiple) {
      inner = marker.appendChild(document.createElement("div"));
      inner.className = "CodeMirror-lint-marker-multiple";
    }

    if (tooltips != false) CodeMirror.on(inner, "mouseover", function(e) {
      showTooltipFor(e, labels, inner);
    });

    return marker;
  }

  function getMaxSeverity(a, b) {
    if (a == "error") return a;
    else return b;
  }

  function groupByLine(annotations) {
    var lines = [];
    for (var i = 0; i < annotations.length; ++i) {
      var ann = annotations[i], line = ann.from.line;
      (lines[line] || (lines[line] = [])).push(ann);
    }
    return lines;
  }

  function annotationTooltip(ann) {
    var severity = ann.severity;
    if (!severity) severity = "error";
    var tip = document.createElement("div");
    tip.className = "CodeMirror-lint-message-" + severity;
    if (typeof ann.messageHTML != 'undefined') {
        tip.innerHTML = ann.messageHTML;
    } else {
        tip.appendChild(document.createTextNode(ann.message));
    }
    return tip;
  }

  function lintAsync(cm, getAnnotations, passOptions) {
    var state = cm.state.lint
    var id = ++state.waitingFor
    function abort() {
      id = -1
      cm.off("change", abort)
    }
    cm.on("change", abort)
    getAnnotations(cm.getValue(), function(annotations, arg2) {
      cm.off("change", abort)
      if (state.waitingFor != id) return
      if (arg2 && annotations instanceof CodeMirror) annotations = arg2
      updateLinting(cm, annotations)
    }, passOptions, cm);
  }

  function startLinting(cm) {
    var state = cm.state.lint, options = state.options;
    var passOptions = options.options || options; // Support deprecated passing of `options` property in options
    var getAnnotations = options.getAnnotations || cm.getHelper(CodeMirror.Pos(0, 0), "lint");
    if (!getAnnotations) return;
    if (options.async || getAnnotations.async) {
      lintAsync(cm, getAnnotations, passOptions)
    } else {
      var annotations = getAnnotations(cm.getValue(), passOptions, cm);
      if (!annotations) return;
      if (annotations.then) annotations.then(function(issues) {
        updateLinting(cm, issues);
      });
      else updateLinting(cm, annotations);
    }
  }

  function updateLinting(cm, annotationsNotSorted) {
    clearMarks(cm);
    var state = cm.state.lint, options = state.options;

    var annotations = groupByLine(annotationsNotSorted);

    for (var line = 0; line < annotations.length; ++line) {
      var anns = annotations[line];
      if (!anns) continue;

      var maxSeverity = null;
      var tipLabel = state.hasGutter && document.createDocumentFragment();

      for (var i = 0; i < anns.length; ++i) {
        var ann = anns[i];
        var severity = ann.severity;
        if (!severity) severity = "error";
        maxSeverity = getMaxSeverity(maxSeverity, severity);

        if (options.formatAnnotation) ann = options.formatAnnotation(ann);
        if (state.hasGutter) tipLabel.appendChild(annotationTooltip(ann));

        if (ann.to) state.marked.push(cm.markText(ann.from, ann.to, {
          className: "CodeMirror-lint-mark-" + severity,
          __annotation: ann
        }));
      }

      if (state.hasGutter)
        cm.setGutterMarker(line, GUTTER_ID, makeMarker(tipLabel, maxSeverity, anns.length > 1,
                                                       state.options.tooltips));
    }
    if (options.onUpdateLinting) options.onUpdateLinting(annotationsNotSorted, annotations, cm);
  }

  function onChange(cm) {
    var state = cm.state.lint;
    if (!state) return;
    clearTimeout(state.timeout);
    state.timeout = setTimeout(function(){startLinting(cm);}, state.options.delay || 500);
  }

  function popupTooltips(annotations, e) {
    var target = e.target || e.srcElement;
    var tooltip = document.createDocumentFragment();
    for (var i = 0; i < annotations.length; i++) {
      var ann = annotations[i];
      tooltip.appendChild(annotationTooltip(ann));
    }
    showTooltipFor(e, tooltip, target);
  }

  function onMouseOver(cm, e) {
    var target = e.target || e.srcElement;
    if (!/\bCodeMirror-lint-mark-/.test(target.className)) return;
    var box = target.getBoundingClientRect(), x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
    var spans = cm.findMarksAt(cm.coordsChar({left: x, top: y}, "client"));

    var annotations = [];
    for (var i = 0; i < spans.length; ++i) {
      var ann = spans[i].__annotation;
      if (ann) annotations.push(ann);
    }
    if (annotations.length) popupTooltips(annotations, e);
  }

  CodeMirror.defineOption("lint", false, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      clearMarks(cm);
      if (cm.state.lint.options.lintOnChange !== false)
        cm.off("change", onChange);
      CodeMirror.off(cm.getWrapperElement(), "mouseover", cm.state.lint.onMouseOver);
      clearTimeout(cm.state.lint.timeout);
      delete cm.state.lint;
    }

    if (val) {
      var gutters = cm.getOption("gutters"), hasLintGutter = false;
      for (var i = 0; i < gutters.length; ++i) if (gutters[i] == GUTTER_ID) hasLintGutter = true;
      var state = cm.state.lint = new LintState(cm, parseOptions(cm, val), hasLintGutter);
      if (state.options.lintOnChange !== false)
        cm.on("change", onChange);
      if (state.options.tooltips != false && state.options.tooltips != "gutter")
        CodeMirror.on(cm.getWrapperElement(), "mouseover", state.onMouseOver);

      startLinting(cm);
    }
  });

  CodeMirror.defineExtension("performLint", function() {
    if (this.state.lint) startLinting(this);
  });
});
;

CodeMirror.sqlLint = function(text, updateLinting, options, cm) {

    // Skipping check if text box is empty.
    if(text.trim() == "") {
        updateLinting(cm, []);
        return;
    }

    function handleResponse(response) {
        var found = [];
        for (var idx in response) {
            found.push({
                from: CodeMirror.Pos(
                    response[idx].fromLine, response[idx].fromColumn
                ),
                to: CodeMirror.Pos(
                    response[idx].toLine, response[idx].toColumn
                ),
                messageHTML: response[idx].message,
                severity : response[idx].severity
            });
        }

        updateLinting(cm, found);
    }

    $.ajax({
        method: "POST",
        url: "lint.php",
        dataType: 'json',
        data: {
            sql_query: text,
            token: PMA_commonParams.get('token'),
            server: PMA_commonParams.get('server'),
            options: options.lintOptions,
            no_history: true,
        },
        success: handleResponse
    });
}
;

/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * Used in or for console
 *
 * @package phpMyAdmin-Console
 */

/**
 * Console object
 */
var PMA_console = {
    /**
     * @var object, jQuery object, selector is '#pma_console>.content'
     * @access private
     */
    $consoleContent: null,
    /**
     * @var object, jQuery object, selector is '#pma_console .content',
     *  used for resizer
     * @access private
     */
    $consoleAllContents: null,
    /**
     * @var object, jQuery object, selector is '#pma_console .toolbar'
     * @access private
     */
    $consoleToolbar: null,
    /**
     * @var object, jQuery object, selector is '#pma_console .template'
     * @access private
     */
    $consoleTemplates: null,
    /**
     * @var object, jQuery object, form for submit
     * @access private
     */
    $requestForm: null,
    /**
     * @var object, contain console config
     * @access private
     */
    config: null,
    /**
     * @var bool, if console element exist, it'll be true
     * @access public
     */
    isEnabled: false,
    /**
     * @var bool, make sure console events bind only once
     * @access private
     */
    isInitialized: false,
    /**
     * Used for console initialize, reinit is ok, just some variable assignment
     *
     * @return void
     */
    initialize: function() {

        if ($('#pma_console').length === 0) {
            return;
        }

        PMA_console.isEnabled = true;

        // Cookie var checks and init
        if (! $.cookie('pma_console_height')) {
            $.cookie('pma_console_height', 92);
        }
        if (! $.cookie('pma_console_mode')) {
            $.cookie('pma_console_mode', 'info');
        }

        // Vars init
        PMA_console.$consoleToolbar = $("#pma_console").find(">.toolbar");
        PMA_console.$consoleContent = $("#pma_console").find(">.content");
        PMA_console.$consoleAllContents = $('#pma_console').find('.content');
        PMA_console.$consoleTemplates = $('#pma_console').find('>.templates');

        // Generate a from for post
        PMA_console.$requestForm = $('<form method="post" action="import.php">' +
            '<input name="is_js_confirmed" value="0">' +
            '<textarea name="sql_query"></textarea>' +
            '<input name="console_message_id" value="0">' +
            '<input name="server" value="">' +
            '<input name="db" value="">' +
            '<input name="table" value="">' +
            '<input name="token" value="' +
            PMA_commonParams.get('token') +
            '">' +
            '</form>'
        );
        PMA_console.$requestForm.bind('submit', AJAX.requestHandler);

        // Event binds shouldn't run again
        if (PMA_console.isInitialized === false) {

            // Load config first
            var tempConfig = JSON.parse($.cookie('pma_console_config'));
            if (tempConfig) {
                if (tempConfig.alwaysExpand === true) {
                    $('#pma_console_options input[name=always_expand]').prop('checked', true);
                }
                if (tempConfig.startHistory === true) {
                    $('#pma_console_options').find('input[name=start_history]').prop('checked', true);
                }
                if (tempConfig.currentQuery === true) {
                    $('#pma_console_options').find('input[name=current_query]').prop('checked', true);
                }
                if (ConsoleEnterExecutes === true) {
                    $('#pma_console_options').find('input[name=enter_executes]').prop('checked', true);
                }
                if (tempConfig.darkTheme === true) {
                    $('#pma_console_options').find('input[name=dark_theme]').prop('checked', true);
                    $('#pma_console').find('>.content').addClass('console_dark_theme');
                }
            } else {
                $('#pma_console_options').find('input[name=current_query]').prop('checked', true);
            }

            PMA_console.updateConfig();

            PMA_consoleResizer.initialize();
            PMA_consoleInput.initialize();
            PMA_consoleMessages.initialize();
            PMA_consoleBookmarks.initialize();
            PMA_consoleDebug.initialize();

            PMA_console.$consoleToolbar.children('.console_switch').click(PMA_console.toggle);

            $('#pma_console').find('.toolbar').children().mousedown(function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            });

            $('#pma_console').find('.button.clear').click(function() {
                PMA_consoleMessages.clear();
            });

            $('#pma_console').find('.button.history').click(function() {
                PMA_consoleMessages.showHistory();
            });

            $('#pma_console').find('.button.options').click(function() {
                PMA_console.showCard('#pma_console_options');
            });

            $('#pma_console').find('.button.debug').click(function() {
                PMA_console.showCard('#debug_console');
            });

            PMA_console.$consoleContent.click(function(event) {
                if (event.target == this) {
                    PMA_consoleInput.focus();
                }
            });

            $('#pma_console').find('.mid_layer').click(function() {
                PMA_console.hideCard($(this).parent().children('.card'));
            });
            $('#debug_console').find('.switch_button').click(function() {
                PMA_console.hideCard($(this).closest('.card'));
            });
            $('#pma_bookmarks').find('.switch_button').click(function() {
                PMA_console.hideCard($(this).closest('.card'));
            });
            $('#pma_console_options').find('.switch_button').click(function() {
                PMA_console.hideCard($(this).closest('.card'));
            });

            $('#pma_console_options').find('input[type=checkbox]').change(function() {
                PMA_console.updateConfig();
            });

            $('#pma_console_options').find('.button.default').click(function() {
                $('#pma_console_options input[name=always_expand]').prop('checked', false);
                $('#pma_console_options').find('input[name=start_history]').prop('checked', false);
                $('#pma_console_options').find('input[name=current_query]').prop('checked', true);
                $('#pma_console_options').find('input[name=enter_executes]').prop('checked', false);
                $('#pma_console_options').find('input[name=dark_theme]').prop('checked', false);
                PMA_console.updateConfig();
            });

            $('#pma_console_options').find('input[name=enter_executes]').change(function() {
                PMA_consoleMessages.showInstructions(PMA_console.config.enterExecutes);
            });

            $(document).ajaxComplete(function (event, xhr, ajaxOptions) {
                if (ajaxOptions.dataType && ajaxOptions.dataType.indexOf('json') != -1) {
                    return;
                }
                if (xhr.status !== 200) {
                    return;
                }
                try {
                    var data = JSON.parse(xhr.responseText);
                    PMA_console.ajaxCallback(data);
                } catch (e) {
                    console.trace();
                    console.log("Failed to parse JSON: " + e.message);
                }
            });

            PMA_console.isInitialized = true;
        }

        // Change console mode from cookie
        switch($.cookie('pma_console_mode')) {
            case 'collapse':
                PMA_console.collapse();
                break;
            /* jshint -W086 */// no break needed in default section
            default:
                $.cookie('pma_console_mode', 'info');
            case 'info':
            /* jshint +W086 */
                PMA_console.info();
                break;
            case 'show':
                PMA_console.show(true);
                PMA_console.scrollBottom();
                break;
        }
    },
    /**
     * Execute query and show results in console
     *
     * @return void
     */
    execute: function(queryString, options) {
        if (typeof(queryString) != 'string' || ! /[a-z]|[A-Z]/.test(queryString)) {
            return;
        }
        PMA_console.$requestForm.children('textarea').val(queryString);
        PMA_console.$requestForm.children('[name=server]').attr('value', PMA_commonParams.get('server'));
        if (options && options.db) {
            PMA_console.$requestForm.children('[name=db]').val(options.db);
            if (options.table) {
                PMA_console.$requestForm.children('[name=table]').val(options.table);
            } else {
                PMA_console.$requestForm.children('[name=table]').val('');
            }
        } else {
            PMA_console.$requestForm.children('[name=db]').val(
                (PMA_commonParams.get('db').length > 0 ? PMA_commonParams.get('db') : ''));
        }
        PMA_console.$requestForm.find('[name=profiling]').remove();
        if (options && options.profiling === true) {
            PMA_console.$requestForm.append('<input name="profiling" value="on">');
        }
        if (! confirmQuery(PMA_console.$requestForm[0], PMA_console.$requestForm.children('textarea')[0].value)) {
            return;
        }
        PMA_console.$requestForm.children('[name=console_message_id]')
            .val(PMA_consoleMessages.appendQuery({sql_query: queryString}).message_id);
        PMA_console.$requestForm.trigger('submit');
        PMA_consoleInput.clear();
        PMA_reloadNavigation();
    },
    ajaxCallback: function(data) {
        if (data && data.console_message_id) {
            PMA_consoleMessages.updateQuery(data.console_message_id, data.success,
                (data._reloadQuerywindow ? data._reloadQuerywindow : false));
        } else if ( data && data._reloadQuerywindow) {
            if (data._reloadQuerywindow.sql_query.length > 0) {
                PMA_consoleMessages.appendQuery(data._reloadQuerywindow, 'successed')
                    .$message.addClass(PMA_console.config.currentQuery ? '' : 'hide');
            }
        }
    },
    /**
     * Change console to collapse mode
     *
     * @return void
     */
    collapse: function() {
        $.cookie('pma_console_mode', 'collapse');
        var pmaConsoleHeight = $.cookie('pma_console_height');

        if (pmaConsoleHeight < 32) {
            $.cookie('pma_console_height', 92);
        }
        PMA_console.$consoleToolbar.addClass('collapsed');
        PMA_console.$consoleAllContents.height(pmaConsoleHeight);
        PMA_console.$consoleContent.stop();
        PMA_console.$consoleContent.animate({'margin-bottom': -1 * PMA_console.$consoleContent.outerHeight() + 'px'},
            'fast', 'easeOutQuart', function() {
                PMA_console.$consoleContent.css({display:'none'});
                $(window).trigger('resize');
            });
        PMA_console.hideCard();
    },
    /**
     * Show console
     *
     * @param bool inputFocus If true, focus the input line after show()
     * @return void
     */
    show: function(inputFocus) {
        $.cookie('pma_console_mode', 'show');

        var pmaConsoleHeight = $.cookie('pma_console_height');

        if (pmaConsoleHeight < 32) {
            $.cookie('pma_console_height', 32);
            PMA_console.collapse();
            return;
        }
        PMA_console.$consoleContent.css({display:'block'});
        if (PMA_console.$consoleToolbar.hasClass('collapsed')) {
            PMA_console.$consoleToolbar.removeClass('collapsed');
        }
        PMA_console.$consoleAllContents.height(pmaConsoleHeight);
        PMA_console.$consoleContent.stop();
        PMA_console.$consoleContent.animate({'margin-bottom': 0},
            'fast', 'easeOutQuart', function() {
                $(window).trigger('resize');
                if (inputFocus) {
                    PMA_consoleInput.focus();
                }
            });
    },
    /**
     * Change console to SQL information mode
     * this mode shows current SQL query
     * This mode is the default mode
     *
     * @return void
     */
    info: function() {
        // Under construction
        PMA_console.collapse();
    },
    /**
     * Toggle console mode between collapse/show
     * Used for toggle buttons and shortcuts
     *
     * @return void
     */
    toggle: function() {
        switch($.cookie('pma_console_mode')) {
            case 'collapse':
            case 'info':
                PMA_console.show(true);
                break;
            case 'show':
                PMA_console.collapse();
                break;
            default:
                PMA_consoleInitialize();
        }
    },
    /**
     * Scroll console to bottom
     *
     * @return void
     */
    scrollBottom: function() {
        PMA_console.$consoleContent.scrollTop(PMA_console.$consoleContent.prop("scrollHeight"));
    },
    /**
     * Show card
     *
     * @param string cardSelector Selector, select string will be "#pma_console " + cardSelector
     * this param also can be JQuery object, if you need.
     *
     * @return void
     */
    showCard: function(cardSelector) {
        var $card = null;
        if (typeof(cardSelector) !== 'string') {
            if (cardSelector.length > 0) {
                $card = cardSelector;
            } else {
                return;
            }
        } else {
            $card = $("#pma_console " + cardSelector);
        }
        if ($card.length === 0) {
            return;
        }
        $card.parent().children('.mid_layer').show().fadeTo(0, 0.15);
        $card.addClass('show');
        PMA_consoleInput.blur();
        if ($card.parents('.card').length > 0) {
            PMA_console.showCard($card.parents('.card'));
        }
    },
    /**
     * Scroll console to bottom
     *
     * @param object $targetCard Target card JQuery object, if it's empty, function will hide all cards
     * @return void
     */
    hideCard: function($targetCard) {
        if (! $targetCard) {
            $('#pma_console').find('.mid_layer').fadeOut(140);
            $('#pma_console').find('.card').removeClass('show');
        } else if ($targetCard.length > 0) {
            $targetCard.parent().find('.mid_layer').fadeOut(140);
            $targetCard.find('.card').removeClass('show');
            $targetCard.removeClass('show');
        }
    },
    /**
     * Used for update console config
     *
     * @return void
     */
    updateConfig: function() {
        PMA_console.config = {
            alwaysExpand: $('#pma_console_options input[name=always_expand]').prop('checked'),
            startHistory: $('#pma_console_options').find('input[name=start_history]').prop('checked'),
            currentQuery: $('#pma_console_options').find('input[name=current_query]').prop('checked'),
            enterExecutes: $('#pma_console_options').find('input[name=enter_executes]').prop('checked'),
            darkTheme: $('#pma_console_options').find('input[name=dark_theme]').prop('checked')
        };
        $.cookie('pma_console_config', JSON.stringify(PMA_console.config));
        /*Setting the dark theme of the console*/
        if (PMA_console.config.darkTheme) {
            $('#pma_console').find('>.content').addClass('console_dark_theme');
        } else {
            $('#pma_console').find('>.content').removeClass('console_dark_theme');
        }
    },
    isSelect: function (queryString) {
        var reg_exp = /^SELECT\s+/i;
        return reg_exp.test(queryString);
    }
};

/**
 * Resizer object
 * Careful: this object UI logics highly related with functions under PMA_console
 * Resizing min-height is 32, if small than it, console will collapse
 */
var PMA_consoleResizer = {
    _posY: 0,
    _height: 0,
    _resultHeight: 0,
    /**
     * Mousedown event handler for bind to resizer
     *
     * @return void
     */
    _mousedown: function(event) {
        if ($.cookie('pma_console_mode') !== 'show') {
            return;
        }
        PMA_consoleResizer._posY = event.pageY;
        PMA_consoleResizer._height = PMA_console.$consoleContent.height();
        $(document).mousemove(PMA_consoleResizer._mousemove);
        $(document).mouseup(PMA_consoleResizer._mouseup);
        // Disable text selection while resizing
        $(document).bind('selectstart', function() { return false; });
    },
    /**
     * Mousemove event handler for bind to resizer
     *
     * @return void
     */
    _mousemove: function(event) {
        if (event.pageY < 35) {
            event.pageY = 35
        }
        PMA_consoleResizer._resultHeight = PMA_consoleResizer._height + (PMA_consoleResizer._posY -event.pageY);
        // Content min-height is 32, if adjusting height small than it we'll move it out of the page
        if (PMA_consoleResizer._resultHeight <= 32) {
            PMA_console.$consoleAllContents.height(32);
            PMA_console.$consoleContent.css('margin-bottom', PMA_consoleResizer._resultHeight - 32);
        }
        else {
            // Logic below makes viewable area always at bottom when adjusting height and content already at bottom
            if (PMA_console.$consoleContent.scrollTop() + PMA_console.$consoleContent.innerHeight() + 16
                >= PMA_console.$consoleContent.prop('scrollHeight')) {
                PMA_console.$consoleAllContents.height(PMA_consoleResizer._resultHeight);
                PMA_console.scrollBottom();
            } else {
                PMA_console.$consoleAllContents.height(PMA_consoleResizer._resultHeight);
            }
        }
    },
    /**
     * Mouseup event handler for bind to resizer
     *
     * @return void
     */
    _mouseup: function() {
        $.cookie('pma_console_height', PMA_consoleResizer._resultHeight);
        PMA_console.show();
        $(document).unbind('mousemove');
        $(document).unbind('mouseup');
        $(document).unbind('selectstart');
    },
    /**
     * Used for console resizer initialize
     *
     * @return void
     */
    initialize: function() {
        $('#pma_console').find('.toolbar').unbind('mousedown');
        $('#pma_console').find('.toolbar').mousedown(PMA_consoleResizer._mousedown);
    }
};


/**
 * Console input object
 */
var PMA_consoleInput = {
    /**
     * @var array, contains Codemirror objects or input jQuery objects
     * @access private
     */
    _inputs: null,
    /**
     * @var bool, if codemirror enabled
     * @access private
     */
    _codemirror: false,
    /**
     * @var int, count for history navigation, 0 for current input
     * @access private
     */
    _historyCount: 0,
    /**
     * @var string, current input when navigating through history
     * @access private
     */
    _historyPreserveCurrent: null,
    /**
     * Used for console input initialize
     *
     * @return void
     */
    initialize: function() {
        // _cm object can't be reinitialize
        if (PMA_consoleInput._inputs !== null) {
            return;
        }
        if (typeof CodeMirror !== 'undefined') {
            PMA_consoleInput._codemirror = true;
        }
        PMA_consoleInput._inputs = [];
        if (PMA_consoleInput._codemirror) {
            PMA_consoleInput._inputs.console = CodeMirror($('#pma_console').find('.console_query_input')[0], {
                theme: 'pma',
                mode: 'text/x-sql',
                lineWrapping: true,
                extraKeys: {"Ctrl-Space": "autocomplete"},
                hintOptions: {"completeSingle": false, "completeOnSingleClick": true},
                gutters: ["CodeMirror-lint-markers"],
                lint: {
                    "getAnnotations": CodeMirror.sqlLint,
                    "async": true,
                }
            });
            PMA_consoleInput._inputs.console.on("inputRead", codemirrorAutocompleteOnInputRead);
            PMA_consoleInput._inputs.console.on("keydown", function(instance, event) {
                PMA_consoleInput._historyNavigate(event);
            });
            if ($('#pma_bookmarks').length !== 0) {
                PMA_consoleInput._inputs.bookmark = CodeMirror($('#pma_console').find('.bookmark_add_input')[0], {
                    theme: 'pma',
                    mode: 'text/x-sql',
                    lineWrapping: true,
                    extraKeys: {"Ctrl-Space": "autocomplete"},
                    hintOptions: {"completeSingle": false, "completeOnSingleClick": true},
                    gutters: ["CodeMirror-lint-markers"],
                    lint: {
                        "getAnnotations": CodeMirror.sqlLint,
                        "async": true,
                    }
                });
                PMA_consoleInput._inputs.bookmark.on("inputRead", codemirrorAutocompleteOnInputRead);
            }
        } else {
            PMA_consoleInput._inputs.console =
                $('<textarea>').appendTo('#pma_console .console_query_input')
                    .on('keydown', PMA_consoleInput._historyNavigate);
            if ($('#pma_bookmarks').length !== 0) {
                PMA_consoleInput._inputs.bookmark =
                    $('<textarea>').appendTo('#pma_console .bookmark_add_input');
            }
        }
        $('#pma_console').find('.console_query_input').keydown(PMA_consoleInput._keydown);
    },
    _historyNavigate: function(event) {
        if (event.keyCode == 38 || event.keyCode == 40) {
            var upPermitted = false;
            var downPermitted = false;
            var editor = PMA_consoleInput._inputs.console;
            var cursorLine;
            var totalLine;
            if (PMA_consoleInput._codemirror) {
                cursorLine = editor.getCursor().line;
                totalLine = editor.lineCount();
            } else {
                // Get cursor position from textarea
                var text = PMA_consoleInput.getText();
                cursorLine = text.substr(0, editor.prop("selectionStart")).split("\n").length - 1;
                totalLine = text.split(/\r*\n/).length;
            }
            if (cursorLine === 0) {
                upPermitted = true;
            }
            if (cursorLine == totalLine - 1) {
                downPermitted = true;
            }
            var nextCount;
            var queryString = false;
            if (upPermitted && event.keyCode == 38) {
                // Navigate up in history
                if (PMA_consoleInput._historyCount === 0) {
                    PMA_consoleInput._historyPreserveCurrent = PMA_consoleInput.getText();
                }
                nextCount = PMA_consoleInput._historyCount + 1;
                queryString = PMA_consoleMessages.getHistory(nextCount);
            } else if (downPermitted && event.keyCode == 40) {
                // Navigate down in history
                if (PMA_consoleInput._historyCount === 0) {
                    return;
                }
                nextCount = PMA_consoleInput._historyCount - 1;
                if (nextCount === 0) {
                    queryString = PMA_consoleInput._historyPreserveCurrent;
                } else {
                    queryString = PMA_consoleMessages.getHistory(nextCount);
                }
            }
            if (queryString !== false) {
                PMA_consoleInput._historyCount = nextCount;
                PMA_consoleInput.setText(queryString, 'console');
                if (PMA_consoleInput._codemirror) {
                    editor.setCursor(editor.lineCount(), 0);
                }
                event.preventDefault();
            }
        }
    },
    /**
     * Mousedown event handler for bind to input
     * Shortcut is Ctrl+Enter key or just ENTER, depending on console's
     * configuration.
     *
     * @return void
     */
    _keydown: function(event) {
        if (PMA_console.config.enterExecutes) {
            // Enter, but not in combination with Shift (which writes a new line).
            if (!event.shiftKey && event.keyCode === 13) {
                PMA_consoleInput.execute();
            }
        } else {
            // Ctrl+Enter
            if (event.ctrlKey && event.keyCode === 13) {
                PMA_consoleInput.execute();
            }
        }
    },
    /**
     * Used for send text to PMA_console.execute()
     *
     * @return void
     */
    execute: function() {
        if (PMA_consoleInput._codemirror) {
            PMA_console.execute(PMA_consoleInput._inputs.console.getValue());
        } else {
            PMA_console.execute(PMA_consoleInput._inputs.console.val());
        }
    },
    /**
     * Used for clear the input
     *
     * @param string target, default target is console input
     * @return void
     */
    clear: function(target) {
        PMA_consoleInput.setText('', target);
    },
    /**
     * Used for set focus to input
     *
     * @return void
     */
    focus: function() {
        PMA_consoleInput._inputs.console.focus();
    },
    /**
     * Used for blur input
     *
     * @return void
     */
    blur: function() {
        if (PMA_consoleInput._codemirror) {
            PMA_consoleInput._inputs.console.getInputField().blur();
        } else {
            PMA_consoleInput._inputs.console.blur();
        }
    },
    /**
     * Used for set text in input
     *
     * @param string text
     * @param string target
     * @return void
     */
    setText: function(text, target) {
        if (PMA_consoleInput._codemirror) {
            switch(target) {
                case 'bookmark':
                    PMA_console.execute(PMA_consoleInput._inputs.bookmark.setValue(text));
                    break;
                default:
                case 'console':
                    PMA_console.execute(PMA_consoleInput._inputs.console.setValue(text));
            }
        } else {
            switch(target) {
                case 'bookmark':
                    PMA_console.execute(PMA_consoleInput._inputs.bookmark.val(text));
                    break;
                default:
                case 'console':
                    PMA_console.execute(PMA_consoleInput._inputs.console.val(text));
            }
        }
    },
    getText: function(target) {
        if (PMA_consoleInput._codemirror) {
            switch(target) {
                case 'bookmark':
                    return PMA_consoleInput._inputs.bookmark.getValue();
                default:
                case 'console':
                    return PMA_consoleInput._inputs.console.getValue();
            }
        } else {
            switch(target) {
                case 'bookmark':
                    return PMA_consoleInput._inputs.bookmark.val();
                default:
                case 'console':
                    return PMA_consoleInput._inputs.console.val();
            }
        }
    }

};


/**
 * Console messages, and message items management object
 */
var PMA_consoleMessages = {
    /**
     * Used for clear the messages
     *
     * @return void
     */
    clear: function() {
        $('#pma_console').find('.content .console_message_container .message:not(.welcome)').addClass('hide');
        $('#pma_console').find('.content .console_message_container .message.failed').remove();
        $('#pma_console').find('.content .console_message_container .message.expanded').find('.action.collapse').click();
    },
    /**
     * Used for show history messages
     *
     * @return void
     */
    showHistory: function() {
        $('#pma_console').find('.content .console_message_container .message.hide').removeClass('hide');
    },
    /**
     * Used for getting a perticular history query
     *
     * @param int nthLast get nth query message from latest, i.e 1st is last
     * @return string message
     */
    getHistory: function(nthLast) {
        var $queries = $('#pma_console').find('.content .console_message_container .query');
        var length = $queries.length;
        var $query = $queries.eq(length - nthLast);
        if (!$query || (length - nthLast) < 0) {
            return false;
        } else {
            return $query.text();
        }
    },
    /**
     * Used to show the correct message depending on which key
     * combination executes the query (Ctrl+Enter or Enter).
     *
     * @param bool enterExecutes Only Enter has to be pressed to execute query.
     * @return void
     */
    showInstructions: function(enterExecutes) {
        enterExecutes = +enterExecutes || 0; // conversion to int
        var $welcomeMsg = $('#pma_console').find('.content .console_message_container .message.welcome span');
        $welcomeMsg.children('[id^=instructions]').hide();
        $welcomeMsg.children('#instructions-' + enterExecutes).show();
    },
    /**
     * Used for log new message
     *
     * @param string msgString Message to show
     * @param string msgType Message type
     * @return object, {message_id, $message}
     */
    append: function(msgString, msgType) {
        if (typeof(msgString) !== 'string') {
            return false;
        }
        // Generate an ID for each message, we can find them later
        var msgId = Math.round(Math.random()*(899999999999)+100000000000);
        var now = new Date();
        var $newMessage =
            $('<div class="message ' +
                (PMA_console.config.alwaysExpand ? 'expanded' : 'collapsed') +
                '" msgid="' + msgId + '"><div class="action_content"></div></div>');
        switch(msgType) {
            case 'query':
                $newMessage.append('<div class="query highlighted"></div>');
                if (PMA_consoleInput._codemirror) {
                    CodeMirror.runMode(msgString,
                        'text/x-sql', $newMessage.children('.query')[0]);
                } else {
                    $newMessage.children('.query').text(msgString);
                }
                $newMessage.children('.action_content')
                    .append(PMA_console.$consoleTemplates.children('.query_actions').html());
                break;
            default:
            case 'normal':
                $newMessage.append('<div>' + msgString + '</div>');
        }
        PMA_consoleMessages._msgEventBinds($newMessage);
        $newMessage.find('span.text.query_time span')
            .text(now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds())
            .parent().attr('title', now);
        return {message_id: msgId,
                $message: $newMessage.appendTo('#pma_console .content .console_message_container')};
    },
    /**
     * Used for log new query
     *
     * @param string queryData Struct should be
     * {sql_query: "Query string", db: "Target DB", table: "Target Table"}
     * @param string state Message state
     * @return object, {message_id: string message id, $message: JQuery object}
     */
    appendQuery: function(queryData, state) {
        var targetMessage = PMA_consoleMessages.append(queryData.sql_query, 'query');
        if (! targetMessage) {
            return false;
        }
        if (queryData.db && queryData.table) {
            targetMessage.$message.attr('targetdb', queryData.db);
            targetMessage.$message.attr('targettable', queryData.table);
            targetMessage.$message.find('.text.targetdb span').text(queryData.db);
        }
        if (PMA_console.isSelect(queryData.sql_query)) {
            targetMessage.$message.addClass('select');
        }
        switch(state) {
            case 'failed':
                targetMessage.$message.addClass('failed');
                break;
            case 'successed':
                targetMessage.$message.addClass('successed');
                break;
            default:
            case 'pending':
                targetMessage.$message.addClass('pending');
        }
        return targetMessage;
    },
    _msgEventBinds: function($targetMessage) {
        // Leave unbinded elements, remove binded.
        $targetMessage = $targetMessage.filter(':not(.binded)');
        if ($targetMessage.length === 0) {
            return;
        }
        $targetMessage.addClass('binded');

        $targetMessage.find('.action.expand').click(function () {
            $(this).closest('.message').removeClass('collapsed');
            $(this).closest('.message').addClass('expanded');
        });
        $targetMessage.find('.action.collapse').click(function () {
            $(this).closest('.message').addClass('collapsed');
            $(this).closest('.message').removeClass('expanded');
        });
        $targetMessage.find('.action.edit').click(function () {
            PMA_consoleInput.setText($(this).parent().siblings('.query').text());
            PMA_consoleInput.focus();
        });
        $targetMessage.find('.action.requery').click(function () {
            var query = $(this).parent().siblings('.query').text();
            var $message = $(this).closest('.message');
            if (confirm(PMA_messages.strConsoleRequeryConfirm + '\n' +
                (query.length<100 ? query : query.slice(0, 100) + '...'))
            ) {
                PMA_console.execute(query, {db: $message.attr('targetdb'), table: $message.attr('targettable')});
            }
        });
        $targetMessage.find('.action.bookmark').click(function () {
            var query = $(this).parent().siblings('.query').text();
            var $message = $(this).closest('.message');
            PMA_consoleBookmarks.addBookmark(query, $message.attr('targetdb'));
            PMA_console.showCard('#pma_bookmarks .card.add');
        });
        $targetMessage.find('.action.edit_bookmark').click(function () {
            var query = $(this).parent().siblings('.query').text();
            var $message = $(this).closest('.message');
            var isShared = $message.find('span.bookmark_label').hasClass('shared');
            var label = $message.find('span.bookmark_label').text();
            PMA_consoleBookmarks.addBookmark(query, $message.attr('targetdb'), label, isShared);
            PMA_console.showCard('#pma_bookmarks .card.add');
        });
        $targetMessage.find('.action.delete_bookmark').click(function () {
            var $message = $(this).closest('.message');
            if (confirm(PMA_messages.strConsoleDeleteBookmarkConfirm + '\n' + $message.find('.bookmark_label').text())) {
                $.post('import.php',
                    {token: PMA_commonParams.get('token'),
                    server: PMA_commonParams.get('server'),
                    action_bookmark: 2,
                    ajax_request: true,
                    id_bookmark: $message.attr('bookmarkid')},
                    function () {
                        PMA_consoleBookmarks.refresh();
                    });
            }
        });
        $targetMessage.find('.action.profiling').click(function () {
            var $message = $(this).closest('.message');
            PMA_console.execute($(this).parent().siblings('.query').text(),
                {db: $message.attr('targetdb'),
                table: $message.attr('targettable'),
                profiling: true});
        });
        $targetMessage.find('.action.explain').click(function () {
            var $message = $(this).closest('.message');
            PMA_console.execute('EXPLAIN ' + $(this).parent().siblings('.query').text(),
                {db: $message.attr('targetdb'),
                table: $message.attr('targettable')});
        });
        $targetMessage.find('.action.dbg_show_trace').click(function () {
            var $message = $(this).closest('.message');
            if (!$message.find('.trace').length) {
                PMA_consoleDebug.getQueryDetails(
                    $message.data('queryInfo'),
                    $message.data('totalTime'),
                    $message
                );
                PMA_consoleMessages._msgEventBinds($message.find('.message:not(.binded)'));
            }
            $message.addClass('show_trace');
            $message.removeClass('hide_trace');
        });
        $targetMessage.find('.action.dbg_hide_trace').click(function () {
            var $message = $(this).closest('.message');
            $message.addClass('hide_trace');
            $message.removeClass('show_trace');
        });
        $targetMessage.find('.action.dbg_show_args').click(function () {
            var $message = $(this).closest('.message');
            $message.addClass('show_args expanded');
            $message.removeClass('hide_args collapsed');
        });
        $targetMessage.find('.action.dbg_hide_args').click(function () {
            var $message = $(this).closest('.message');
            $message.addClass('hide_args collapsed');
            $message.removeClass('show_args expanded');
        });
        if (PMA_consoleInput._codemirror) {
            $targetMessage.find('.query:not(.highlighted)').each(function(index, elem) {
                    CodeMirror.runMode($(elem).text(),
                        'text/x-sql', elem);
                    $(this).addClass('highlighted');
                });
        }
    },
    msgAppend: function(msgId, msgString, msgType) {
        var $targetMessage = $('#pma_console').find('.content .console_message_container .message[msgid=' + msgId +']');
        if ($targetMessage.length === 0 || isNaN(parseInt(msgId)) || typeof(msgString) !== 'string') {
            return false;
        }
        $targetMessage.append('<div>' + msgString + '</div>');
    },
    updateQuery: function(msgId, isSuccessed, queryData) {
        var $targetMessage = $('#pma_console').find('.console_message_container .message[msgid=' + parseInt(msgId) +']');
        if ($targetMessage.length === 0 || isNaN(parseInt(msgId))) {
            return false;
        }
        $targetMessage.removeClass('pending failed successed');
        if (isSuccessed) {
            $targetMessage.addClass('successed');
            if (queryData) {
                $targetMessage.children('.query').text('');
                $targetMessage.removeClass('select');
                if (PMA_console.isSelect(queryData.sql_query)) {
                    $targetMessage.addClass('select');
                }
                if (PMA_consoleInput._codemirror) {
                    CodeMirror.runMode(queryData.sql_query, 'text/x-sql', $targetMessage.children('.query')[0]);
                } else {
                    $targetMessage.children('.query').text(queryData.sql_query);
                }
                $targetMessage.attr('targetdb', queryData.db);
                $targetMessage.attr('targettable', queryData.table);
                $targetMessage.find('.text.targetdb span').text(queryData.db);
            }
        } else {
            $targetMessage.addClass('failed');
        }
    },
    /**
     * Used for console messages initialize
     *
     * @return void
     */
    initialize: function() {
        PMA_consoleMessages._msgEventBinds($('#pma_console').find('.message:not(.binded)'));
        if (PMA_console.config.startHistory) {
            PMA_consoleMessages.showHistory();
        }
        PMA_consoleMessages.showInstructions(PMA_console.config.enterExecutes);
    }
};


/**
 * Console bookmarks card, and bookmarks items management object
 */
var PMA_consoleBookmarks = {
    _bookmarks: [],
    addBookmark: function (queryString, targetDb, label, isShared, id) {
        $('#pma_bookmarks').find('.add [name=shared]').prop('checked', false);
        $('#pma_bookmarks').find('.add [name=label]').val('');
        $('#pma_bookmarks').find('.add [name=targetdb]').val('');
        $('#pma_bookmarks').find('.add [name=id_bookmark]').val('');
        PMA_consoleInput.setText('', 'bookmark');

        switch(arguments.length) {
            case 4:
                $('#pma_bookmarks').find('.add [name=shared]').prop('checked', isShared);
            case 3:
                $('#pma_bookmarks').find('.add [name=label]').val(label);
            case 2:
                $('#pma_bookmarks').find('.add [name=targetdb]').val(targetDb);
            case 1:
                PMA_consoleInput.setText(queryString, 'bookmark');
            default:
                break;
        }
    },
    refresh: function () {
        $.get('import.php',
            {ajax_request: true,
            token: PMA_commonParams.get('token'),
            server: PMA_commonParams.get('server'),
            console_bookmark_refresh: 'refresh'},
            function(data) {
                if (data.console_message_bookmark) {
                    $('#pma_bookmarks').find('.content.bookmark').html(data.console_message_bookmark);
                    PMA_consoleMessages._msgEventBinds($('#pma_bookmarks').find('.message:not(.binded)'));
                }
            });
    },
    /**
     * Used for console bookmarks initialize
     * message events are already binded by PMA_consoleMsg._msgEventBinds
     *
     * @return void
     */
    initialize: function() {
        if ($('#pma_bookmarks').length === 0) {
            return;
        }
        $('#pma_console').find('.button.bookmarks').click(function() {
            PMA_console.showCard('#pma_bookmarks');
        });
        $('#pma_bookmarks').find('.button.add').click(function() {
            PMA_console.showCard('#pma_bookmarks .card.add');
        });
        $('#pma_bookmarks').find('.card.add [name=submit]').click(function () {
            if ($('#pma_bookmarks').find('.card.add [name=label]').val().length === 0
                || PMA_consoleInput.getText('bookmark').length === 0)
            {
                alert(PMA_messages.strFormEmpty);
                return;
            }
            $(this).prop('disabled', true);
            $.post('import.php',
                {token: PMA_commonParams.get('token'),
                ajax_request: true,
                console_bookmark_add: 'true',
                label: $('#pma_bookmarks').find('.card.add [name=label]').val(),
                server: PMA_commonParams.get('server'),
                db: $('#pma_bookmarks').find('.card.add [name=targetdb]').val(),
                bookmark_query: PMA_consoleInput.getText('bookmark'),
                shared: $('#pma_bookmarks').find('.card.add [name=shared]').prop('checked')},
                function () {
                    PMA_consoleBookmarks.refresh();
                    $('#pma_bookmarks').find('.card.add [name=submit]').prop('disabled', false);
                    PMA_console.hideCard($('#pma_bookmarks').find('.card.add'));
                });
        });
        $('#pma_console').find('.button.refresh').click(function() {
            PMA_consoleBookmarks.refresh();
        });
    }
};

var PMA_consoleDebug;
PMA_consoleDebug = {
    _config: {
        groupQueries: false,
        orderBy: 'exec', // Possible 'exec' => Execution order, 'time' => Time taken, 'count'
        order: 'asc' // Possible 'asc', 'desc'
    },
    _lastDebugInfo: {
        debugInfo: null,
        url: null
    },
    initialize: function () {
        // Try to get debug info after every AJAX request
        $(document).ajaxSuccess(function (event, xhr, settings, data) {
            if (data._debug) {
                PMA_consoleDebug.showLog(data._debug, settings.url);
            }
        });

        // Initialize config
        this._initConfig();

        if (this.configParam('groupQueries')) {
            $('#debug_console').addClass('grouped');
        } else {
            $('#debug_console').addClass('ungrouped');
            if (PMA_consoleDebug.configParam('orderBy') == 'count') {
                $('#debug_console').find('.button.order_by.sort_exec').addClass('active');
            }
        }
        var orderBy = this.configParam('orderBy');
        var order = this.configParam('order');
        $('#debug_console').find('.button.order_by.sort_' + orderBy).addClass('active');
        $('#debug_console').find('.button.order.order_' + order).addClass('active');

        // Initialize actions in toolbar
        $('#debug_console').find('.button.group_queries').click(function () {
            $('#debug_console').addClass('grouped');
            $('#debug_console').removeClass('ungrouped');
            PMA_consoleDebug.configParam('groupQueries', true);
            PMA_consoleDebug.refresh();
            if (PMA_consoleDebug.configParam('orderBy') == 'count') {
                $('#debug_console').find('.button.order_by.sort_exec').removeClass('active');
            }
        });
        $('#debug_console').find('.button.ungroup_queries').click(function () {
            $('#debug_console').addClass('ungrouped');
            $('#debug_console').removeClass('grouped');
            PMA_consoleDebug.configParam('groupQueries', false);
            PMA_consoleDebug.refresh();
            if (PMA_consoleDebug.configParam('orderBy') == 'count') {
                $('#debug_console').find('.button.order_by.sort_exec').addClass('active');
            }
        });
        $('#debug_console').find('.button.order_by').click(function () {
            var $this = $(this);
            $('#debug_console').find('.button.order_by').removeClass('active');
            $this.addClass('active');
            if ($this.hasClass('sort_time')) {
                PMA_consoleDebug.configParam('orderBy', 'time');
            } else if ($this.hasClass('sort_exec')) {
                PMA_consoleDebug.configParam('orderBy', 'exec');
            } else if ($this.hasClass('sort_count')) {
                PMA_consoleDebug.configParam('orderBy', 'count');
            }
            PMA_consoleDebug.refresh();
        });
        $('#debug_console').find('.button.order').click(function () {
            var $this = $(this);
            $('#debug_console').find('.button.order').removeClass('active');
            $this.addClass('active');
            if ($this.hasClass('order_asc')) {
                PMA_consoleDebug.configParam('order', 'asc');
            } else if ($this.hasClass('order_desc')) {
                PMA_consoleDebug.configParam('order', 'desc');
            }
            PMA_consoleDebug.refresh();
        });

        // Show SQL debug info for first page load
        if (typeof debugSQLInfo !== 'undefined' && debugSQLInfo !== 'null') {
            $('#pma_console').find('.button.debug').removeClass('hide');
        }
        else {
            return;
        }
        PMA_consoleDebug.showLog(debugSQLInfo);
    },
    _initConfig: function () {
        var config = JSON.parse($.cookie('pma_console_dbg_config'));
        if (config) {
            for (var name in config) {
                if (config.hasOwnProperty(name)) {
                    this._config[name] = config[name];
                }
            }
        }
    },
    configParam: function (name, value) {
        if (typeof value === 'undefined') {
            return this._config[name];
        }
        this._config[name] = value;
        $.cookie('pma_console_dbg_config', JSON.stringify(this._config));
        return value;
    },
    _formatFunctionCall: function (dbgStep) {
        var functionName = '';
        if ('class' in dbgStep) {
            functionName += dbgStep.class;
            functionName += dbgStep.type;
        }
        functionName += dbgStep.function;
        if (dbgStep.args && dbgStep.args.length) {
            functionName += '(...)';
        } else {
            functionName += '()';
        }
        return functionName;
    },
    _formatFunctionArgs: function (dbgStep) {
        var $args = $('<div>');
        if (dbgStep.args.length) {
            $args.append('<div class="message welcome">')
                .append(
                $('<div class="message welcome">')
                    .text(
                    PMA_sprintf(
                        PMA_messages.strConsoleDebugArgsSummary,
                        dbgStep.args.length
                    )
                )
            );
            for (var i = 0; i < dbgStep.args.length; i++) {
                $args.append(
                    $('<div class="message">')
                        .html(
                        '<pre>' +
                        escapeHtml(JSON.stringify(dbgStep.args[i], null, "  ")) +
                        '</pre>'
                    )
                );
            }
        }
        return $args;
    },
    _formatFileName: function (dbgStep) {
        var fileName = '';
        if ('file' in dbgStep) {
            fileName += dbgStep.file;
            fileName += '#' + dbgStep.line;
        }
        return fileName;
    },
    _formatBackTrace: function (dbgTrace) {
        var $traceElem = $('<div class="trace">');
        $traceElem.append(
            $('<div class="message welcome">')
        );
        var step, $stepElem;
        for (var stepId in dbgTrace) {
            if (dbgTrace.hasOwnProperty(stepId)) {
                step = dbgTrace[stepId];
                if (!Array.isArray(step) && typeof step !== 'object') {
                    $stepElem =
                        $('<div class="message traceStep collapsed hide_args">')
                            .append(
                            $('<span>').text(step)
                        );
                } else {
                    if (typeof step.args === 'string' && step.args) {
                        step.args = [step.args];
                    }
                    $stepElem =
                        $('<div class="message traceStep collapsed hide_args">')
                            .append(
                            $('<span class="function">').text(this._formatFunctionCall(step))
                        )
                            .append(
                            $('<span class="file">').text(this._formatFileName(step))
                        );
                    if (step.args && step.args.length) {
                        $stepElem
                            .append(
                            $('<span class="args">').html(this._formatFunctionArgs(step))
                        )
                            .prepend(
                            $('<div class="action_content">')
                                .append(
                                '<span class="action dbg_show_args">' +
                                PMA_messages.strConsoleDebugShowArgs +
                                '</span> '
                            )
                                .append(
                                '<span class="action dbg_hide_args">' +
                                PMA_messages.strConsoleDebugHideArgs +
                                '</span> '
                            )
                        );
                    }
                }
                $traceElem.append($stepElem);
            }
        }
        return $traceElem;
    },
    _formatQueryOrGroup: function (queryInfo, totalTime) {
        var grouped, queryText, queryTime, count, i;
        if (Array.isArray(queryInfo)) {
            // It is grouped
            grouped = true;

            queryText = queryInfo[0].query;

            queryTime = 0;
            for (i in queryInfo) {
                queryTime += queryInfo[i].time;
            }

            count = queryInfo.length;
        } else {
            queryText = queryInfo.query;
            queryTime = queryInfo.time;
        }

        var $query = $('<div class="message collapsed hide_trace">')
            .append(
            $('#debug_console').find('.templates .debug_query').clone()
        )
            .append(
            $('<div class="query">')
                .text(queryText)
        )
            .data('queryInfo', queryInfo)
            .data('totalTime', totalTime);
        if (grouped) {
            $query.find('.text.count').removeClass('hide');
            $query.find('.text.count span').text(count);
        }
        $query.find('.text.time span').text(queryTime + 's (' + ((queryTime * 100) / totalTime).toFixed(3) + '%)');

        return $query;
    },
    _appendQueryExtraInfo: function (query, $elem) {
        if ('error' in query) {
            $elem.append(
                $('<div>').html(query.error)
            );
        }
        $elem.append(this._formatBackTrace(query.trace));
    },
    getQueryDetails: function (queryInfo, totalTime, $query) {
        if (Array.isArray(queryInfo)) {
            var $singleQuery;
            for (var i in queryInfo) {
                $singleQuery = $('<div class="message welcome trace">')
                    .text((parseInt(i) + 1) + '.')
                    .append(
                    $('<span class="time">').text(
                        PMA_messages.strConsoleDebugTimeTaken +
                        ' ' + queryInfo[i].time + 's' +
                        ' (' + ((queryInfo[i].time * 100) / totalTime).toFixed(3) + '%)'
                    )
                );
                this._appendQueryExtraInfo(queryInfo[i], $singleQuery);
                $query
                    .append('<div class="message welcome trace">')
                    .append($singleQuery);
            }
        } else {
            this._appendQueryExtraInfo(queryInfo, $query);
        }
    },
    showLog: function (debugInfo, url) {
        this._lastDebugInfo.debugInfo = debugInfo;
        this._lastDebugInfo.url = url;

        $('#debug_console').find('.debugLog').empty();
        $("#debug_console").find(".debug>.welcome").empty();

        var debugJson = false, i;
        if (typeof debugInfo === "object" && 'queries' in debugInfo) {
            // Copy it to debugJson, so that it doesn't get changed
            if (!('queries' in debugInfo)) {
                debugJson = false;
            } else {
                debugJson = {queries: []};
                for (i in debugInfo.queries) {
                    debugJson.queries[i] = debugInfo.queries[i];
                }
            }
        } else if (typeof debugInfo === "string") {
            try {
                debugJson = JSON.parse(debugInfo);
            } catch (e) {
                debugJson = false;
            }
            if (debugJson && !('queries' in debugJson)) {
                debugJson = false;
            }
        }
        if (debugJson === false) {
            $("#debug_console").find(".debug>.welcome").text(
                PMA_messages.strConsoleDebugError
            );
            return;
        }
        var allQueries = debugJson.queries;
        var uniqueQueries = {};

        var totalExec = allQueries.length;

        // Calculate total time and make unique query array
        var totalTime = 0;
        for (i = 0; i < totalExec; ++i) {
            totalTime += allQueries[i].time;
            if (!(allQueries[i].hash in uniqueQueries)) {
                uniqueQueries[allQueries[i].hash] = [];
            }
            uniqueQueries[allQueries[i].hash].push(allQueries[i]);
        }
        // Count total unique queries, convert uniqueQueries to Array
        var totalUnique = 0, uniqueArray = [];
        for (var hash in uniqueQueries) {
            if (uniqueQueries.hasOwnProperty(hash)) {
                ++totalUnique;
                uniqueArray.push(uniqueQueries[hash]);
            }
        }
        uniqueQueries = uniqueArray;
        // Show summary
        $("#debug_console").find(".debug>.welcome").append(
            $('<span class="debug_summary">').text(
                PMA_sprintf(
                    PMA_messages.strConsoleDebugSummary,
                    totalUnique,
                    totalExec,
                    totalTime
                )
            )
        );
        if (url) {
            $("#debug_console").find(".debug>.welcome").append(
                $('<span class="script_name">').text(url.split('?')[0])
            );
        }

        // For sorting queries
        function sortByTime(a, b) {
            var order = ((PMA_consoleDebug.configParam('order') == 'asc') ? 1 : -1);
            if (Array.isArray(a) && Array.isArray(b)) {
                // It is grouped
                var timeA = 0, timeB = 0, i;
                for (i in a) {
                    timeA += a[i].time;
                }
                for (i in b) {
                    timeB += b[i].time;
                }
                return (timeA - timeB) * order;
            } else {
                return (a.time - b.time) * order;
            }
        }

        function sortByCount(a, b) {
            var order = ((PMA_consoleDebug.configParam('order') == 'asc') ? 1 : -1);
            return (a.length - b.length) * order;
        }

        var orderBy = this.configParam('orderBy');
        var order = PMA_consoleDebug.configParam('order');

        if (this.configParam('groupQueries')) {
            // Sort queries
            if (orderBy == 'time') {
                uniqueQueries.sort(sortByTime);
            } else if (orderBy == 'count') {
                uniqueQueries.sort(sortByCount);
            } else if (orderBy == 'exec' && order == 'desc') {
                uniqueQueries.reverse();
            }
            for (i in uniqueQueries) {
                if (orderBy == 'time') {
                    uniqueQueries[i].sort(sortByTime);
                } else if (orderBy == 'exec' && order == 'desc') {
                    uniqueQueries[i].reverse();
                }
                $('#debug_console').find('.debugLog').append(this._formatQueryOrGroup(uniqueQueries[i], totalTime));
            }
        } else {
            if (orderBy == 'time') {
                allQueries.sort(sortByTime);
            } else if (order == 'desc') {
                allQueries.reverse();
            }
            for (i = 0; i < totalExec; ++i) {
                $('#debug_console').find('.debugLog').append(this._formatQueryOrGroup(allQueries[i], totalTime));
            }
        }

        PMA_consoleMessages._msgEventBinds($('#debug_console').find('.message:not(.binded)'));
    },
    refresh: function () {
        var last = this._lastDebugInfo;
        PMA_consoleDebug.showLog(last.debugInfo, last.url);
    }
};

/**s
 * Executed on page load
 */
$(function () {
    PMA_console.initialize();
});
;

