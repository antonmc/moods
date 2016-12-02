! function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
    return s
}({
    1: [function (require, module) {
        "use strict";

        function Microphone(_options) {
            var options = _options || {};
            this.bufferSize = options.bufferSize || 8192, this.inputChannels = options.inputChannels || 1, this.outputChannels = options.outputChannels || 1, this.recording = !1, this.requestedAccess = !1, this.sampleRate = 16e3, this.bufferUnusedSamples = new Float32Array(0), this.samplesAll = new Float32Array(2e7), this.samplesAllOffset = 0, navigator.getUserMedia || (navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
        }
        var utils = require("./utils");
        Microphone.prototype.onPermissionRejected = function () {
            console.log("Microphone.onPermissionRejected()"), this.requestedAccess = !1, this.onError("Permission to access the microphone rejeted.")
        }, Microphone.prototype.onError = function (error) {
            console.log("Microphone.onError():", error)
        }, Microphone.prototype.onMediaStream = function (stream) {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) throw new Error("AudioContext not available");
            this.audioContext || (this.audioContext = new AudioCtx);
            var gain = this.audioContext.createGain(),
                audioInput = this.audioContext.createMediaStreamSource(stream);
            audioInput.connect(gain), this.mic || (this.mic = this.audioContext.createScriptProcessor(this.bufferSize, this.inputChannels, this.outputChannels)), console.log("Microphone.onMediaStream(): sampling rate is:", this.sampleRate), this.mic.onaudioprocess = this._onaudioprocess.bind(this), this.stream = stream, gain.connect(this.mic), this.mic.connect(this.audioContext.destination), this.recording = !0, this.requestedAccess = !1, this.onStartRecording()
        }, Microphone.prototype._onaudioprocess = function (data) {
            if (this.recording) {
                var chan = data.inputBuffer.getChannelData(0);
                this.saveData(new Float32Array(chan)), this.onAudio(this._exportDataBufferTo16Khz(new Float32Array(chan)))
            }
        }, Microphone.prototype.record = function () {
            return navigator.getUserMedia ? void(this.requestedAccess || (this.requestedAccess = !0, navigator.getUserMedia({
                audio: !0
            }, this.onMediaStream.bind(this), this.onPermissionRejected.bind(this)))) : void this.onError("Browser doesn't support microphone input")
        }, Microphone.prototype.stop = function () {
            this.recording && (JSON.parse(localStorage.getItem("playback")) && this.playWav(), this.recording = !1, this.stream.getTracks()[0].stop(), this.requestedAccess = !1, this.mic.disconnect(0), this.onStopRecording())
        }, Microphone.prototype._exportDataBufferTo16Khz = function (bufferNewSamples) {
            var buffer = null,
                newSamples = bufferNewSamples.length,
                unusedSamples = this.bufferUnusedSamples.length;
            if (unusedSamples > 0) {
                buffer = new Float32Array(unusedSamples + newSamples);
                for (var i = 0; unusedSamples > i; ++i) buffer[i] = this.bufferUnusedSamples[i];
                for (i = 0; newSamples > i; ++i) buffer[unusedSamples + i] = bufferNewSamples[i]
            } else buffer = bufferNewSamples;
            for (var filter = [-.037935, -89024e-8, .040173, .019989, .0047792, -.058675, -.056487, -.0040653, .14527, .26927, .33913, .26927, .14527, -.0040653, -.056487, -.058675, .0047792, .019989, .040173, -89024e-8, -.037935], samplingRateRatio = this.audioContext.sampleRate / 16e3, nOutputSamples = Math.floor((buffer.length - filter.length) / samplingRateRatio) + 1, pcmEncodedBuffer16k = new ArrayBuffer(2 * nOutputSamples), dataView16k = new DataView(pcmEncodedBuffer16k), index = 0, volume = 32767, nOut = 0, i = 0; i + filter.length - 1 < buffer.length; i = Math.round(samplingRateRatio * nOut)) {
                for (var sample = 0, j = 0; j < filter.length; ++j) sample += buffer[i + j] * filter[j];
                sample *= volume, dataView16k.setInt16(index, sample, !0), index += 2, nOut++
            }
            var indexSampleAfterLastUsed = Math.round(samplingRateRatio * nOut),
                remaining = buffer.length - indexSampleAfterLastUsed;
            if (remaining > 0)
                for (this.bufferUnusedSamples = new Float32Array(remaining), i = 0; remaining > i; ++i) this.bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i];
            else this.bufferUnusedSamples = new Float32Array(0);
            return new Blob([dataView16k], {
                type: "audio/l16"
            })
        };
        Microphone.prototype._exportDataBuffer = function (buffer) {
            utils.exportDataBuffer(buffer, this.bufferSize)
        }, Microphone.prototype.onStartRecording = function () {}, Microphone.prototype.onStopRecording = function () {}, Microphone.prototype.onAudio = function () {}, module.exports = Microphone, Microphone.prototype.saveData = function (samples) {
            for (var i = 0; i < samples.length; ++i) this.samplesAll[this.samplesAllOffset + i] = samples[i];
            this.samplesAllOffset += samples.length, console.log("samples: " + this.samplesAllOffset)
        }, Microphone.prototype.playWav = function () {
            var samples = this.samplesAll.subarray(0, this.samplesAllOffset),
                dataview = this.encodeWav(samples, 1, this.audioContext.sampleRate),
                audioBlob = new Blob([dataview], {
                    type: "audio/l16"
                }),
                url = window.URL.createObjectURL(audioBlob),
                audio = new Audio;
            audio.src = url, audio.play()
        }, Microphone.prototype.encodeWav = function (samples, numChannels, sampleRate) {
            console.log("#samples: " + samples.length);
            var buffer = new ArrayBuffer(44 + 2 * samples.length),
                view = new DataView(buffer);
            return this.writeString(view, 0, "RIFF"), view.setUint32(4, 36 + 2 * samples.length, !0), this.writeString(view, 8, "WAVE"), this.writeString(view, 12, "fmt "), view.setUint32(16, 16, !0), view.setUint16(20, 1, !0), view.setUint16(22, numChannels, !0), view.setUint32(24, sampleRate, !0), view.setUint32(28, 4 * sampleRate, !0), view.setUint16(32, 2 * numChannels, !0), view.setUint16(34, 16, !0), this.writeString(view, 36, "data"), view.setUint32(40, 2 * samples.length, !0), this.floatTo16BitPCM(view, 44, samples), view
        }, Microphone.prototype.writeString = function (view, offset, string) {
            for (var i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
        }, Microphone.prototype.floatTo16BitPCM = function (output, offset, input) {
            for (var i = 0; i < input.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, 0 > s ? 32768 * s : 32767 * s, !0)
            }
        }
    }, {
        "./utils": 8
    }],
    2: [function (require, module) {
        module.exports = {
            models: [{
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/ar-AR_BroadbandModel",
                rate: 16e3,
                name: "ar-AR_BroadbandModel",
                language: "ar-AR",
                description: "Modern Standard Arabic broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/en-UK_BroadbandModel",
                rate: 16e3,
                name: "en-UK_BroadbandModel",
                language: "en-UK",
                description: "UK English broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/en-UK_NarrowbandModel",
                rate: 8e3,
                name: "en-UK_NarrowbandModel",
                language: "en-UK",
                description: "UK English narrowband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/en-US_BroadbandModel",
                rate: 16e3,
                name: "en-US_BroadbandModel",
                language: "en-US",
                description: "US English broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/en-US_NarrowbandModel",
                rate: 8e3,
                name: "en-US_NarrowbandModel",
                language: "en-US",
                description: "US English narrowband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/es-ES_BroadbandModel",
                rate: 16e3,
                name: "es-ES_BroadbandModel",
                language: "es-ES",
                description: "Spanish broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/es-ES_NarrowbandModel",
                rate: 8e3,
                name: "es-ES_NarrowbandModel",
                language: "es-ES",
                description: "Spanish narrowband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/ja-JP_BroadbandModel",
                rate: 16e3,
                name: "ja-JP_BroadbandModel",
                language: "ja-JP",
                description: "Japanese broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/ja-JP_NarrowbandModel",
                rate: 8e3,
                name: "ja-JP_NarrowbandModel",
                language: "ja-JP",
                description: "Japanese narrowband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/pt-BR_BroadbandModel",
                rate: 16e3,
                name: "pt-BR_BroadbandModel",
                language: "pt-BR",
                description: "Brazilian Portuguese broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/pt-BR_NarrowbandModel",
                rate: 8e3,
                name: "pt-BR_NarrowbandModel",
                language: "pt-BR",
                description: "Brazilian Portuguese narrowband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/zh-CN_BroadbandModel",
                rate: 16e3,
                name: "zh-CN_BroadbandModel",
                language: "zh-CN",
                description: "Mandarin broadband model."
            }, {
                url: "https://stream.watsonplatform.net/speech-to-text/api/v1/models/zh-CN_NarrowbandModel",
                rate: 8e3,
                name: "zh-CN_NarrowbandModel",
                language: "zh-CN",
                description: "Mandarin narrowband model."
            }]
        }
    }, {}],
    3: [function (require, module, exports) {
        "use strict";
        var display = require("./views/displaymetadata"),
            initSocket = require("./socket").initSocket;
        exports.handleFileUpload = function (type, token, model, file, contentType, callback, onend) {
            function onOpen() {
                console.log("Socket opened")
            }

            function onListening(socket) {
                console.log("Socket listening"), callback(socket)
            }

            function onMessage(msg) {
                msg.results && (baseString = display.showResult(msg, baseString, model), baseJSON = display.showJSON(msg, baseJSON))
            }

            function onError(evt) {
                localStorage.setItem("currentlyDisplaying", "false"), onend(evt), console.log("Socket err: ", evt.code)
            }

            function onClose(evt) {
                localStorage.setItem("currentlyDisplaying", "false"), onend(evt), console.log("Socket closing: ", evt)
            }
            localStorage.setItem("currentlyDisplaying", type), $.subscribe("progress", function (evt, data) {
                console.log("progress: ", data)
            }), console.log("contentType", contentType);
            var baseString = "",
                baseJSON = "";
            $.subscribe("showjson", function () {
                var $resultsJSON = $("#resultsJSON");
                $resultsJSON.empty(), $resultsJSON.append(baseJSON)
            });
            var options = {};
            options.token = token, options.message = {
                action: "start",
                "content-type": contentType,
                interim_results: !0,
                continuous: !0,
                word_confidence: !0,
                timestamps: !0,
                max_alternatives: 3,
                inactivity_timeout: 600
            }, options.model = model, initSocket(options, onOpen, onListening, onMessage, onError, onClose)
        }
    }, {
        "./socket": 7,
        "./views/displaymetadata": 10
    }],
    4: [function (require, module, exports) {
        "use strict";
        var initSocket = require("./socket").initSocket,
            display = require("./views/displaymetadata");
        exports.handleMicrophone = function (token, model, mic, callback) {
            function onOpen(socket) {
                console.log("Mic socket: opened"), callback(null, socket)
            }

            function onListening(socket) {
                mic.onAudio = function (blob) {
                    socket.readyState < 2 && socket.send(blob)
                }
            }

            function onMessage(msg) {
                msg.results && (baseString = display.showResult(msg, baseString, model), baseJSON = display.showJSON(msg, baseJSON))
            }

            function onError() {
                console.log("Mic socket err: ", err)
            }

            function onClose(evt) {
                console.log("Mic socket close: ", evt)
            }
            if (model.indexOf("Narrowband") > -1) {
                var err = new Error("Microphone transcription cannot accomodate narrowband models, please select another");
                return callback(err, null), !1
            }
            $.publish("clearscreen");
            var baseString = "",
                baseJSON = "";
            $.subscribe("showjson", function () {
                var $resultsJSON = $("#resultsJSON");
                $resultsJSON.empty(), $resultsJSON.append(baseJSON)
            });
            var options = {};
            options.token = token, options.message = {
                action: "start",
                "content-type": "audio/l16;rate=16000",
                interim_results: !0,
                continuous: !0,
                word_confidence: !0,
                timestamps: !0,
                max_alternatives: 3,
                inactivity_timeout: 600
            }, options.model = model, initSocket(options, onOpen, onListening, onMessage, onError, onClose)
        }
    }, {
        "./socket": 7,
        "./views/displaymetadata": 10
    }],
    5: [function (require) {
        "use strict";
        var models = require("./data/models.json").models,
            utils = require("./utils");
        utils.initPubSub();
        var initViews = require("./views").initViews,
            showerror = require("./views/showerror"),
            showError = showerror.showError,
            getModels = require("./models").getModels;
        window.BUFFERSIZE = 8192, $(document).ready(function () {
            var tokenGenerator = utils.createTokenGenerator();
            tokenGenerator.getToken(function (err, token) {
                window.onbeforeunload = function () {
                    localStorage.clear()
                }, token || (console.error("No authorization token available"), console.error("Attempting to reconnect..."), showError(err && err.code ? "Server error " + err.code + ": " + err.error : "Server error " + err.code + ": please refresh your browser and try again"));
                var viewContext = {
                    currentModel: "en-US_BroadbandModel",
                    models: models,
                    token: token,
                    bufferSize: BUFFERSIZE
                };
                initViews(viewContext), localStorage.setItem("models", JSON.stringify(models)), localStorage.setItem("playbackON", !1);
                for (var query = window.location.search.substring(1), vars = query.split("&"), i = 0; i < vars.length; i++) {
                    var pair = vars[i].split("=");
                    "debug" === decodeURIComponent(pair[0]) && localStorage.setItem("playbackON", decodeURIComponent(pair[1]))
                }
                localStorage.setItem("currentModel", "en-US_BroadbandModel"), localStorage.setItem("sessionPermissions", "true"), getModels(token), $.subscribe("clearscreen", function () {
                    $("#resultsText").text(""), $("#resultsJSON").text(""), $(".error-row").hide(), $(".notification-row").hide(), $(".hypotheses > ul").empty(), $("#metadataTableBody").empty(), toneChart.clearTimeLines()
                })
            })
        })
    }, {
        "./data/models.json": 2,
        "./models": 6,
        "./utils": 8,
        "./views": 14,
        "./views/showerror": 18
    }],
    6: [function (require, module, exports) {
        "use strict";
        var selectModel = require("./views/selectmodel").initSelectModel;
        exports.getModels = function (token) {
            var viewContext = {
                    currentModel: "en-US_BroadbandModel",
                    models: null,
                    token: token,
                    bufferSize: BUFFERSIZE
                },
                modelUrl = "https://stream.watsonplatform.net/speech-to-text/api/v1/models",
                sttRequest = new XMLHttpRequest;
            sttRequest.open("GET", modelUrl, !0), sttRequest.withCredentials = !0, sttRequest.setRequestHeader("Accept", "application/json"), sttRequest.setRequestHeader("X-Watson-Authorization-Token", token), sttRequest.onload = function () {
                var response = JSON.parse(sttRequest.responseText),
                    sorted = response.models.sort(function (a, b) {
                        return a.name > b.name ? 1 : a.name < b.name ? -1 : 0
                    });
                response.models = sorted, localStorage.setItem("models", JSON.stringify(response.models)), viewContext.models = response.models, selectModel(viewContext)
            }, sttRequest.onerror = function () {
                viewContext.models = require("./data/models.json").models, selectModel(viewContext)
            }, sttRequest.send()
        }
    }, {
        "./data/models.json": 2,
        "./views/selectmodel": 17
    }],
    7: [function (require, module, exports) {
        "use strict";
        var utils = require("./utils"),
            showerror = require("./views/showerror"),
            showError = showerror.showError,
            tokenGenerator = utils.createTokenGenerator(),
            initSocket = exports.initSocket = function (options, onopen, onlistening, onmessage, onerror, onclose) {
                function withDefault(val, defaultVal) {
                    return "undefined" == typeof val ? defaultVal : val
                }
                var listening, socket, token = options.token,
                    model = options.model || localStorage.getItem("currentModel"),
                    message = options.message || {
                        action: "start"
                    },
                    url = (withDefault(options.sessionPermissions, JSON.parse(localStorage.getItem("sessionPermissions"))), options.serviceURI || "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token=");
                url += token + "&model=" + model, console.log("URL model", model);
                try {
                    socket = new WebSocket(url)
                } catch (err) {
                    console.error("WS connection error: ", err)
                }
                socket.onopen = function () {
                    listening = !1, $.subscribe("hardsocketstop", function () {
                        console.log("MICROPHONE: close."), socket.send(JSON.stringify({
                            action: "stop"
                        })), socket.close()
                    }), $.subscribe("socketstop", function () {
                        console.log("MICROPHONE: close."), socket.close()
                    }), socket.send(JSON.stringify(message)), onopen(socket)
                }, socket.onmessage = function (evt) {
                    var msg = JSON.parse(evt.data);
                    return msg.error ? (showError(msg.error), void $.publish("hardsocketstop")) : ("listening" === msg.state && (listening ? (console.log("MICROPHONE: Closing socket."), socket.close()) : (onlistening(socket), listening = !0)), void onmessage(msg, socket))
                }, socket.onerror = function (evt) {
                    console.log("WS onerror: ", evt), showError("Application error " + evt.code + ": please refresh your browser and try again"), $.publish("clearscreen"), onerror(evt)
                }, socket.onclose = function (evt) {
                    if (console.log("WS onclose: ", evt), 1006 === evt.code) {
                        if (console.log("generator count", tokenGenerator.getCount()), tokenGenerator.getCount() > 1) throw $.publish("hardsocketstop"), new Error("No authorization token is currently available");
                        return tokenGenerator.getToken(function (err, token) {
                            return err ? ($.publish("hardsocketstop"), !1) : (console.log("Fetching additional token..."), options.token = token, void initSocket(options, onopen, onlistening, onmessage, onerror, onclose))
                        }), !1
                    }
                    return 1011 === evt.code ? (console.error("Server error " + evt.code + ": please refresh your browser and try again"), !1) : evt.code > 1e3 ? (console.error("Server error " + evt.code + ": please refresh your browser and try again"), !1) : ($.unsubscribe("hardsocketstop"), $.unsubscribe("socketstop"), void onclose(evt))
                }
            }
    }, {
        "./utils": 8,
        "./views/showerror": 18
    }],
    8: [function (require, module, exports) {
        (function (global) {
            "use strict";
            var $ = "undefined" != typeof window ? window.jQuery : "undefined" != typeof global ? global.jQuery : null,
                fileBlock = function (_offset, length, _file, readChunk) {
                    var r = new FileReader,
                        blob = _file.slice(_offset, length + _offset);
                    r.onload = readChunk, r.readAsArrayBuffer(blob)
                };
            exports.onFileProgress = function (options, ondata, running, onerror, onend, samplingRate) {
                var file = options.file,
                    fileSize = file.size,
                    chunkSize = options.bufferSize || 16e3,
                    offset = 0,
                    readChunk = function (evt) {
                        if (offset >= fileSize) return console.log("Done reading file"), void onend();
                        if (running()) {
                            if (null != evt.target.error) {
                                var errorMessage = evt.target.error;
                                return console.log("Read error: " + errorMessage), void onerror(errorMessage)
                            }
                            var buffer = evt.target.result,
                                len = buffer.byteLength;
                            offset += len, ondata(buffer), samplingRate ? setTimeout(function () {
                                fileBlock(offset, chunkSize, file, readChunk)
                            }, 1e3 * chunkSize / (2 * samplingRate)) : fileBlock(offset, chunkSize, file, readChunk)
                        }
                    };
                fileBlock(offset, chunkSize, file, readChunk)
            }, exports.createTokenGenerator = function () {
                var hasBeenRunTimes = 0;
                return {
                    getToken: function (callback) {
                        if (++hasBeenRunTimes, hasBeenRunTimes > 5) {
                            var err = new Error("Cannot reach server");
                            return void callback(null, err)
                        }
                        var url = "/api/token",
                            tokenRequest = new XMLHttpRequest;
                        tokenRequest.open("POST", url, !0), tokenRequest.setRequestHeader("csrf-token", $('meta[name="ct"]').attr("content")), tokenRequest.onreadystatechange = function () {
                            if (4 === tokenRequest.readyState)
                                if (200 === tokenRequest.status) {
                                    var token = tokenRequest.responseText;
                                    callback(null, token)
                                } else {
                                    var error = "Cannot reach server";
                                    if (tokenRequest.responseText) try {
                                        error = JSON.parse(tokenRequest.responseText)
                                    } catch (e) {
                                        error = tokenRequest.responseText
                                    }
                                    callback(error)
                                }
                        }, tokenRequest.send()
                    },
                    getCount: function () {
                        return hasBeenRunTimes
                    }
                }
            }, exports.initPubSub = function () {
                var o = $({});
                $.subscribe = o.on.bind(o), $.unsubscribe = o.off.bind(o), $.publish = o.trigger.bind(o)
            }
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }, {}],
    9: [function (require, module, exports) {
        "use strict";
        exports.initAnimatePanel = function () {
            $(".panel-heading span.clickable").on("click", function () {
                $(this).hasClass("panel-collapsed") ? ($(this).parents(".panel").find(".panel-body").slideDown(), $(this).removeClass("panel-collapsed"), $(this).find("i").removeClass("caret-down").addClass("caret-up")) : ($(this).parents(".panel").find(".panel-body").slideUp(), $(this).addClass("panel-collapsed"), $(this).find("i").removeClass("caret-up").addClass("caret-down"))
            })
        }
    }, {}],
    10: [function (require, module, exports) {
        "use strict";

        function updateTextScroll() {
            if (!scrolled) {
                var element = $("#resultsText").get(0);
                element.scrollTop = element.scrollHeight
            }
        }

        function updateScroll() {
            if (!scrolled) {
//                var element = $(".table-scroll").get(0);//                element.scrollTop = element.scrollHeight
            }
        }
        var scrolled = !1,
            textScrolled = !1,
            showTimestamp = function (timestamps, confidences) {
                var word = timestamps[0],
                    t0 = timestamps[1],
                    t1 = timestamps[2],
                    displayConfidence = confidences ? confidences[1].toString().substring(0, 3) : "n/a";
                $("#metadataTable > tbody:last-child").append("<tr><td>" + word + "</td><td>" + t0 + "</td><td>" + t1 + "</td><td>" + displayConfidence + "</td></tr>")
            },
            showMetaData = function (alternative) {
                var confidenceNestedArray = alternative.word_confidence,
                    timestampNestedArray = alternative.timestamps;
                if (confidenceNestedArray && confidenceNestedArray.length > 0)
                    for (var i = 0; i < confidenceNestedArray.length; i++) {
                        var timestamps = timestampNestedArray[i],
                            confidences = confidenceNestedArray[i];
                        showTimestamp(timestamps, confidences)
                    } else timestampNestedArray && timestampNestedArray.length > 0 && timestampNestedArray.forEach(function (timestamp) {
                        showTimestamp(timestamp)
                    })
            },
            Alternatives = function () {
                var stringOne = "",
                    stringTwo = "",
                    stringThree = "";
                this.clearString = function () {
                    stringOne = "", stringTwo = "", stringThree = ""
                }, this.showAlternatives = function (alternatives) {
                    var $hypotheses = $(".hypotheses ol");
                    $hypotheses.empty(), alternatives.forEach(function (alternative, idx) {
                        var $alternative;
                        if (alternative.transcript) {
                            var transcript = alternative.transcript.replace(/%HESITATION\s/g, "");
                            switch (transcript = transcript.replace(/(.)\1{2,}/g, ""), idx) {
                            case 0:
                                stringOne += transcript, $alternative = $("<li data-hypothesis-index=" + idx + " >" + stringOne + "</li>");
                                break;
                            case 1:
                                stringTwo += transcript, $alternative = $("<li data-hypothesis-index=" + idx + " >" + stringTwo + "</li>");
                                break;
                            case 2:
                                stringThree += transcript, $alternative = $("<li data-hypothesis-index=" + idx + " >" + stringThree + "</li>")
                            }
                            $hypotheses.append($alternative)
                        }
                    })
                }
            },
            alternativePrototype = new Alternatives;
        exports.showJSON = function (msg, baseJSON) {
            var json = JSON.stringify(msg, null, 2);
            return baseJSON += json, baseJSON += "\n", "JSON" === $(".nav-tabs .active").text() && ($("#resultsJSON").append(baseJSON), baseJSON = "", console.log("updating json")), baseJSON
        };
        var initTextScroll = function () {
                $("#resultsText").on("scroll", function () {
                    textScrolled = !0
                })
            },
            initScroll = function () {
                $(".table-scroll").on("scroll", function () {
                    scrolled = !0
                })
            };
        exports.initDisplayMetadata = function () {
            initScroll(), initTextScroll()
        }, exports.showResult = function (msg, baseString, model) {
            if (msg.results && msg.results.length > 0) {
                var alternatives = msg.results[0].alternatives,
                    text = msg.results[0].alternatives[0].transcript || "";
                if (text = text.replace(/%HESITATION\s/g, ""), text = text.replace(/(.)\1{2,}/g, ""), msg.results[0]["final"] && console.log("-> " + text), text = text.replace(/D_[^\s]+/g, ""), 0 === text.length || /^\s+$/.test(text)) return baseString;
                var japanese = "ja-JP" === model.substring(0, 5) || "zh-CN" === model.substring(0, 5);
                msg.results && msg.results[0] && msg.results[0]["final"] ? (text = text.slice(0, -1), text = text.charAt(0).toUpperCase() + text.substring(1), japanese ? (text = text.trim() + "。", text = text.replace(/ /g, "")) : text = text.trim() + ". ", baseString += text, $("#resultsText").val(baseString), getToneAnalysis(baseString), showMetaData(alternatives[0]), alternativePrototype.showAlternatives(alternatives)) : (text = japanese ? text.replace(/ /g, "") : text.charAt(0).toUpperCase() + text.substring(1), $("#resultsText").val(baseString + text))
            }
            return updateScroll(), updateTextScroll(), baseString
        }, $.subscribe("clearscreen", function () {
            var $hypotheses = $(".hypotheses ul");
            scrolled = !1, $hypotheses.empty(), alternativePrototype.clearString()
        })
    }, {}],
    11: [function (require, module, exports) {
        "use strict";
        var handleSelectedFile = require("./fileupload").handleSelectedFile;
        exports.initDragDrop = function (ctx) {
            function handleFileUploadEvent(evt) {
                var file = evt.dataTransfer.files[0];
                handleSelectedFile(ctx.token, file)
            }
            var dragAndDropTarget = $(document);
            dragAndDropTarget.on("dragenter", function (e) {
                e.stopPropagation(), e.preventDefault()
            }), dragAndDropTarget.on("dragover", function (e) {
                e.stopPropagation(), e.preventDefault()
            }), dragAndDropTarget.on("drop", function (e) {
                console.log("File dropped"), e.preventDefault();
                var evt = e.originalEvent;
                handleFileUploadEvent(evt)
            })
        }
    }, {
        "./fileupload": 13
    }],
    12: [function (require, module, exports) {
        "use strict";
        exports.flashSVG = function (el) {
            function loop() {
                el.animate({
                    fill: "#A53725"
                }, 1e3, "linear").animate({
                    fill: "white"
                }, 1e3, "linear")
            }
            el.css({
                fill: "#A53725"
            });
            var timer = setTimeout(loop, 2e3);
            return timer
        }, exports.stopFlashSVG = function (timer) {
            el.css({
                fill: "white"
            }), clearInterval(timer)
        }, exports.toggleImage = function (el, name) {
            el.attr("src") === "images/" + name + ".svg" ? el.attr("src", "images/stop-red.svg") : el.attr("src", "images/stop.svg")
        };
        var restoreImage = exports.restoreImage = function (el, name) {
            el.attr("src", "images/" + name + ".svg")
        };
        exports.stopToggleImage = function (timer, el, name) {
            clearInterval(timer), restoreImage(el, name)
        }
    }, {}],
    13: [function (require, module, exports) {
        "use strict";
        var showError = require("./showerror").showError,
            showNotice = require("./showerror").showNotice,
            handleFileUpload = require("../handlefileupload").handleFileUpload,
            effects = require("./effects"),
            utils = require("../utils"),
            handleSelectedFile = exports.handleSelectedFile = function () {
                var running = !1;
                return localStorage.setItem("currentlyDisplaying", "false"),
                    function (token, file) {
                        function restoreUploadTab() {
                            clearInterval(timer), effects.restoreImage(uploadImageTag, "upload"), uploadText.text("Select File")
                        }
                        $.publish("clearscreen"), localStorage.setItem("currentlyDisplaying", "fileupload"), running = !0;
                        var uploadImageTag = $("#fileUploadTarget > img"),
                            timer = setInterval(effects.toggleImage, 750, uploadImageTag, "stop"),
                            uploadText = $("#fileUploadTarget > span");
                        uploadText.text("Stop Transcribing"), $.subscribe("hardsocketstop", function () {
                            restoreUploadTab(), running = !1
                        });
                        var currentModel = localStorage.getItem("currentModel");
                        console.log("currentModel", currentModel);
                        var blobToText = new Blob([file]).slice(0, 4),
                            r = new FileReader;
                        r.readAsText(blobToText), r.onload = function () {
                            var contentType;
                            if ("fLaC" === r.result) contentType = "audio/flac", showNotice("Notice: browsers do not support playing FLAC audio, so no audio will accompany the transcription");
                            else if ("RIFF" === r.result) {
                                contentType = "audio/wav";
                                var audio = new Audio,
                                    wavBlob = new Blob([file], {
                                        type: "audio/wav"
                                    }),
                                    wavURL = URL.createObjectURL(wavBlob);
                                audio.src = wavURL, audio.play(), $.subscribe("hardsocketstop", function () {
                                    audio.pause(), audio.currentTime = 0
                                })
                            } else {
                                if ("OggS" !== r.result) return restoreUploadTab(), showError("Only WAV or FLAC or Opus files can be transcribed, please try another file format"), void localStorage.setItem("currentlyDisplaying", "false");
                                contentType = "audio/ogg; codecs=opus";
                                var audio = new Audio,
                                    opusBlob = new Blob([file], {
                                        type: "audio/ogg; codecs=opus"
                                    }),
                                    opusURL = URL.createObjectURL(opusBlob);
                                audio.src = opusURL, audio.play(), $.subscribe("hardsocketstop", function () {
                                    audio.pause(), audio.currentTime = 0
                                })
                            }
                            handleFileUpload("fileupload", token, currentModel, file, contentType, function (socket) {
                                var blob = new Blob([file]),
                                    parseOptions = {
                                        file: blob
                                    };
                                utils.onFileProgress(parseOptions, function (chunk) {
                                    socket.send(chunk)
                                }, function () {
                                    return running ? !0 : !1
                                }, function (evt) {
                                    console.log("Error reading file: ", evt.message), showError("Error: " + evt.message)
                                }, function () {
                                    socket.send(JSON.stringify({
                                        action: "stop"
                                    }))
                                })
                            }, function () {
                                effects.stopToggleImage(timer, uploadImageTag, "upload"), uploadText.text("Select File"), localStorage.setItem("currentlyDisplaying", "false")
                            })
                        }
                    }
            }();
        exports.initFileUpload = function (ctx) {
            var fileUploadDialog = $("#fileUploadDialog");
            fileUploadDialog.change(function () {
                var file = fileUploadDialog.get(0).files[0];
                handleSelectedFile(ctx.token, file)
            }), $("#fileUploadTarget").click(function () {
                var currentlyDisplaying = localStorage.getItem("currentlyDisplaying");
                return "fileupload" == currentlyDisplaying ? (console.log("HARD SOCKET STOP"), $.publish("hardsocketstop"), void localStorage.setItem("currentlyDisplaying", "false")) : "sample" == currentlyDisplaying ? void showError("Currently another file is playing, please stop the file or wait until it finishes") : "record" == currentlyDisplaying ? void showError("Currently audio is being recorded, please stop recording before playing a sample") : (fileUploadDialog.val(null), void fileUploadDialog.trigger("click"))
            })
        }
    }, {
        "../handlefileupload": 3,
        "../utils": 8,
        "./effects": 12,
        "./showerror": 18
    }],
    14: [function (require, module, exports) {
        "use strict";
        var initAnimatePanel = require("./animatepanel").initAnimatePanel,
            initShowTab = require("./showtab").initShowTab,
            initDragDrop = require("./dragdrop").initDragDrop,
            initPlaySample = require("./playsample").initPlaySample,
            initRecordButton = require("./recordbutton").initRecordButton,
            initFileUpload = require("./fileupload").initFileUpload,
            initDisplayMetadata = require("./displaymetadata").initDisplayMetadata;
        exports.initViews = function (ctx) {
            console.log("Initializing views..."), initPlaySample(ctx), initDragDrop(ctx), initRecordButton(ctx), initFileUpload(ctx), initShowTab(), initAnimatePanel(), initShowTab(), initDisplayMetadata()
        }
    }, {
        "./animatepanel": 9,
        "./displaymetadata": 10,
        "./dragdrop": 11,
        "./fileupload": 13,
        "./playsample": 15,
        "./recordbutton": 16,
        "./showtab": 19
    }],
    15: [function (require, module, exports) {
        "use strict";
        var utils = require("../utils"),
            onFileProgress = utils.onFileProgress,
            handleFileUpload = require("../handlefileupload").handleFileUpload,
            showError = require("./showerror").showError,
            effects = require("./effects"),
            LOOKUP_TABLE = {
                "ar-AR_BroadbandModel": ["ar-AR_Broadband_sample1.wav", "ar-AR_Broadband_sample2.wav"],
                "en-UK_BroadbandModel": ["en-UK_Broadband_sample1.wav", "en-UK_Broadband_sample2.wav"],
                "en-UK_NarrowbandModel": ["en-UK_Narrowband_sample1.wav", "en-UK_Narrowband_sample2.wav"],
                "en-US_BroadbandModel": ["Us_English_Broadband_Sample_1.wav", "Us_English_Broadband_Sample_2.wav"],
                "en-US_NarrowbandModel": ["Us_English_Narrowband_Sample_1.wav", "Us_English_Narrowband_Sample_2.wav"],
                "es-ES_BroadbandModel": ["Es_ES_spk24_16khz.wav", "Es_ES_spk19_16khz.wav"],
                "es-ES_NarrowbandModel": ["Es_ES_spk24_8khz.wav", "Es_ES_spk19_8khz.wav"],
                "ja-JP_BroadbandModel": ["sample-Ja_JP-wide1.wav", "sample-Ja_JP-wide2.wav"],
                "ja-JP_NarrowbandModel": ["sample-Ja_JP-narrow3.wav", "sample-Ja_JP-narrow4.wav"],
                "pt-BR_BroadbandModel": ["pt-BR_Sample1-16KHz.wav", "pt-BR_Sample2-16KHz.wav"],
                "pt-BR_NarrowbandModel": ["pt-BR_Sample1-8KHz.wav", "pt-BR_Sample2-8KHz.wav"],
                "zh-CN_BroadbandModel": ["zh-CN_sample1_for_16k.wav", "zh-CN_sample2_for_16k.wav"],
                "zh-CN_NarrowbandModel": ["zh-CN_sample1_for_8k.wav", "zh-CN_sample2_for_8k.wav"]
            },
            playSample = function () {
                var running = !1;
                return localStorage.setItem("currentlyDisplaying", "false"), localStorage.setItem("samplePlaying", "false"),
                    function (token, imageTag, sampleNumber, iconName, url) {
                        $.publish("clearscreen");
                        var currentlyDisplaying = localStorage.getItem("currentlyDisplaying"),
                            samplePlaying = localStorage.getItem("samplePlaying");
                        if (samplePlaying === sampleNumber) return console.log("HARD SOCKET STOP"), $.publish("socketstop"), localStorage.setItem("currentlyDisplaying", "false"), localStorage.setItem("samplePlaying", "false"), effects.stopToggleImage(timer, imageTag, iconName), effects.restoreImage(imageTag, iconName), void(running = !1);
                        if ("record" === currentlyDisplaying) return void showError("Currently audio is being recorded, please stop recording before playing a sample");
                        if ("fileupload" === currentlyDisplaying || "false" !== samplePlaying) return void showError("Currently another file is playing, please stop the file or wait until it finishes");
                        localStorage.setItem("currentlyDisplaying", "sample"), localStorage.setItem("samplePlaying", sampleNumber), running = !0, $("#resultsText").val("");
                        var timer = setInterval(effects.toggleImage, 750, imageTag, iconName),
                            xhr = new XMLHttpRequest;
                        xhr.open("GET", url, !0), xhr.responseType = "blob", xhr.onload = function () {
                            var blob = xhr.response,
                                currentModel = localStorage.getItem("currentModel") || "en-US_BroadbandModel",
                                reader = new FileReader,
                                blobToText = new Blob([blob]).slice(0, 4);
                            reader.readAsText(blobToText), reader.onload = function () {
                                var contentType = "fLaC" === reader.result ? "audio/flac" : "audio/wav";
                                console.log("Uploading file", reader.result);
                                var mediaSourceURL = URL.createObjectURL(blob),
                                    audio = new Audio;
                                audio.src = mediaSourceURL, audio.play(), $.subscribe("hardsocketstop", function () {
                                    audio.pause(), audio.currentTime = 0
                                }), $.subscribe("socketstop", function () {
                                    audio.pause(), audio.currentTime = 0
                                }), handleFileUpload("sample", token, currentModel, blob, contentType, function (socket) {
                                    {
                                        var parseOptions = {
                                            file: blob
                                        }; - 1 !== currentModel.indexOf("Broadband") ? 16e3 : 8e3
                                    }
                                    onFileProgress(parseOptions, function (chunk) {
                                        socket.send(chunk)
                                    }, function () {
                                        return running ? !0 : !1
                                    }, function (evt) {
                                        console.log("Error reading file: ", evt.message)
                                    }, function () {
                                        socket.send(JSON.stringify({
                                            action: "stop"
                                        }))
                                    })
                                }, function () {
                                    effects.stopToggleImage(timer, imageTag, iconName), effects.restoreImage(imageTag, iconName), localStorage.getItem("currentlyDisplaying", "false"), localStorage.setItem("samplePlaying", "false")
                                })
                            }
                        }, xhr.send()
                    }
            }();
        exports.initPlaySample = function (ctx) {
            ! function () {
                var fileName = "audio/" + LOOKUP_TABLE[ctx.currentModel][0],
                    el = $(".play-sample-1");
                el.off("click");
                var iconName = "play",
                    imageTag = el.find("img");
                el.click(function () {
                    playSample(ctx.token, imageTag, "sample-1", iconName, fileName, function (result) {
                        console.log("Play sample result", result)
                    })
                })
            }(ctx, LOOKUP_TABLE),
            function () {
                var fileName = "audio/" + LOOKUP_TABLE[ctx.currentModel][1],
                    el = $(".play-sample-2");
                el.off("click");
                var iconName = "play",
                    imageTag = el.find("img");
                el.click(function () {
                    playSample(ctx.token, imageTag, "sample-2", iconName, fileName, function (result) {
                        console.log("Play sample result", result)
                    })
                })
            }(ctx, LOOKUP_TABLE)
        }
    }, {
        "../handlefileupload": 3,
        "../utils": 8,
        "./effects": 12,
        "./showerror": 18
    }],
    16: [function (require, module, exports) {
        "use strict";
        var Microphone = require("../Microphone"),
            handleMicrophone = require("../handlemicrophone").handleMicrophone,
            showError = require("./showerror").showError;
        exports.initRecordButton = function (ctx) {
            var recordButton = $("#recordButton");
            recordButton.click(function () {
                var running = !1,
                    token = ctx.token,
                    micOptions = {
                        bufferSize: ctx.buffersize
                    },
                    mic = new Microphone(micOptions);
                return function (evt) {
                    evt.preventDefault();
                    var currentModel = localStorage.getItem("currentModel"),
                        currentlyDisplaying = localStorage.getItem("currentlyDisplaying");
                    return "sample" == currentlyDisplaying || "fileupload" == currentlyDisplaying ? void showError("Currently another file is playing, please stop the file or wait until it finishes") : (localStorage.setItem("currentlyDisplaying", "record"), void(running ? (console.log("Stopping microphone, sending stop action message"), recordButton.removeAttr("style"), recordButton.find("img").attr("src", "images/microphone.svg"), $.publish("hardsocketstop"), mic.stop(), running = !1, localStorage.setItem("currentlyDisplaying", "false")) : ($("#resultsText").val(""), console.log("Not running, handleMicrophone()"), handleMicrophone(token, currentModel, mic, function (err) {
                        if (err) {
                            var msg = "Error: " + err.message;
                            console.log(msg), showError(msg), running = !1, localStorage.setItem("currentlyDisplaying", "false")
                        } else recordButton.css("background-color", "#d74108"), recordButton.find("img").attr("src", "images/stop.svg"), console.log("starting mic"), mic.record(), running = !0
                    }))))
                }
            }())
        }
    }, {
        "../Microphone": 1,
        "../handlemicrophone": 4,
        "./showerror": 18
    }],
    17: [function (require, module, exports) {
        "use strict";
        var initPlaySample = require("./playsample").initPlaySample;
        exports.initSelectModel = function (ctx) {
            ctx.models.forEach(function (model) {
                $("#dropdownMenuList").append($("<li>").attr("role", "presentation").append($("<a>").attr("role", "menu-item").attr("href", "/").attr("data-model", model.name).append(model.description.substring(0, model.description.length - 1), 8e3 == model.rate ? " (8KHz)" : " (16KHz)")))
            }), $("#dropdownMenuList").click(function (evt) {
                evt.preventDefault(), evt.stopPropagation(), console.log("Change view", $(evt.target).text());
                var newModelDescription = $(evt.target).text(),
                    newModel = $(evt.target).data("model");
                $("#dropdownMenuDefault").empty().text(newModelDescription), $("#dropdownMenu1").dropdown("toggle"), localStorage.setItem("currentModel", newModel), ctx.currentModel = newModel, initPlaySample(ctx), $.publish("clearscreen")
            })
        }
    }, {
        "./playsample": 15
    }],
    18: [function (require, module, exports) {
        "use strict";
        exports.showError = function (msg) {
            console.log("Error: ", msg);
            var errorAlert = $(".error-row");
            errorAlert.hide(), errorAlert.css("background-color", "#d74108"), errorAlert.css("color", "white");
            var errorMessage = $("#errorMessage");
            errorMessage.text(msg), errorAlert.show(), $("#errorClose").click(function (e) {
                return e.preventDefault(), errorAlert.hide(), !1
            })
        }, exports.showNotice = function (msg) {
            console.log("Notice: ", msg);
            var noticeAlert = $(".notification-row");
            noticeAlert.hide(), noticeAlert.css("border", "2px solid #ececec"), noticeAlert.css("background-color", "#f4f4f4"), noticeAlert.css("color", "black");
            var noticeMessage = $("#notificationMessage");
            noticeMessage.text(msg), noticeAlert.show(), $("#notificationClose").click(function (e) {
                return e.preventDefault(), noticeAlert.hide(), !1
            })
        }, exports.hideError = function () {
            var errorAlert = $(".error-row");
            errorAlert.hide()
        }
    }, {}],
    19: [function (require, module, exports) {
        "use strict";
        exports.initShowTab = function () {
            $('.nav-tabs a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
                var target = $(e.target).text();
                "JSON" === target && $.publish("showjson")
            })
        }
    }, {}]
}, {}, [5]);