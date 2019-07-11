import { EventViewModel } from '../models/event';

angular.module('portainer.docker')
.factory('SystemService', ['$q', 'System', 'EndpointProvider', 'SystemEndpoint', function SystemServiceFactory($q, System, EndpointProvider, SystemEndpoint) {
  'use strict';
  var service = {};

  service.plugins = function(endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    var deferred = $q.defer();
    System.info({endpointId: endpointId}).$promise
    .then(function success(data) {
      var plugins = data.Plugins;
      deferred.resolve(plugins);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve plugins information from system', err: err});
    });
    return deferred.promise;
  };

  service.info = function(endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    return System.info({endpointId: endpointId}).$promise;
  };

  service.ping = function(endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    return SystemEndpoint.ping({endpointId: endpointId}).$promise;
  };

  service.version = function(endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    return System.version({endpointId: endpointId}).$promise;
  };

  service.events = function(from, to, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    var deferred = $q.defer();

    System.events({since: from, until: to, endpointId: endpointId}).$promise
    .then(function success(data) {
      var events = data.map(function (item) {
        return new EventViewModel(item);
      });
      deferred.resolve(events);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve engine events', err: err });
    });

    return deferred.promise;
  };

  service.dataUsage = function (endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID; }
    return System.dataUsage({endpointId: endpointId}).$promise;
  };

  return service;
}]);
