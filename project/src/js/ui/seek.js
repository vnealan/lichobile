var utils = require('../utils');
var layout = require('./layout');
var menu = require('./menu');
var widgets = require('./_commonWidgets');
var xhr = require('../xhr');
var i18n = require('../i18n');
var socket = require('../socket');

var nbPlaying = 0;

var seek = {};

seek.controller = function() {

  var hookId;
  var lobbySocket;

  window.analytics.trackView('Seek');

  var createHook = function() {
    if (hookId) return; // hook already created!
    xhr.seekGame().then(function(data) {
      hookId = data.hook.id;
    }, function(error) {
      utils.handleXhrError(error);
    });
  };

  xhr.lobby(true).then(function(data) {
    lobbySocket = socket.connectLobby(data.lobby.version, createHook, {
      redirect: function(data) {
        m.route('/play' + data.url);
      },
      n: function(n) {
        nbPlaying = n;
        m.redraw();
      },
      resync: function() {
        xhr.lobby().then(function(data) {
          if (lobbySocket) lobbySocket.setVersion(data.lobby.version);
        });
      }
    });
  });

  function cancel() {
    if (lobbySocket && hookId) lobbySocket.send('cancel', hookId);
    utils.backHistory();
  }

  document.addEventListener('backbutton', cancel, false);

  return {
    cancel: cancel,

    onunload: function() {
      if (lobbySocket) {
        lobbySocket.destroy();
        lobbySocket = null;
      }
      document.removeEventListener('backbutton', cancel, false);
    }
  };
};

seek.view = function(ctrl) {
  function overlays() {
    return [
      m('div.overlay', [
        m('div.overlay_content', [
          m('div', i18n('waitingForOpponent')),
          m('br'),
          m('div', i18n('nbConnectedPlayers', nbPlaying || '?')),
          m('br'),
          m('br'),
          m('button[data-icon=L]', {
            config: utils.ontouchend(ctrl.cancel),
          }, i18n('cancel'))
        ])
      ])
    ];
  }

  return layout.board(widgets.header, widgets.board, widgets.empty, menu.view, overlays);
};

module.exports = seek;
