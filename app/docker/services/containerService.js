import { ContainerDetailsViewModel, ContainerViewModel, ContainerStatsViewModel } from '../models/container';

angular.module('portainer.docker')
.factory('ContainerService', ['$q', 'Container', 'EndpointProvider', 'ResourceControlService', 'LogHelper', '$timeout',
function ContainerServiceFactory($q, Container, EndpointProvider, ResourceControlService, LogHelper, $timeout) {
  'use strict';
  var service = {};

  service.container = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    Container.get({ id: id, endpointId: endpointId }).$promise
    .then(function success(data) {
      var container = new ContainerDetailsViewModel(data);
      deferred.resolve(container);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve container information', err: err });
    });

    return deferred.promise;
  };

  service.containers = function(all, filters, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();
    Container.query({all : all, filters: filters, endpointId: endpointId }).$promise
    .then(function success(data) {
      var containers = data.map(function (item) {
        return new ContainerViewModel(item);
      });
      deferred.resolve(containers);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve containers', err: err });
    });

    return deferred.promise;
  };

  service.resizeTTY = function (id, width, height, timeout, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    $timeout(function() {
      Container.resize({}, {id: id, height: height, width: width, endpointId}).$promise
          .then(function success(data) {
            if (data.message) {
              deferred.reject({msg: 'Unable to resize tty of container ' + id, err: data.message});
            } else {
              deferred.resolve(data);
            }
          })
          .catch(function error(err) {
            deferred.reject({msg: 'Unable to resize tty of container ' + id, err: err});
          });
    }, timeout);

    return deferred.promise;
  };

  service.startContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.start({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.stopContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.stop({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.restartContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.restart({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.killContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.kill({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.pauseContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.pause({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.resumeContainer = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.unpause({ id: id, endpointId: endpointId }, {}).$promise;
  };

  service.renameContainer = function(id, newContainerName, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.rename({id: id, name: newContainerName, endpointId: endpointId }, {}).$promise;
  };

  service.updateRestartPolicy = updateRestartPolicy;

  function updateRestartPolicy(id, restartPolicy, maximumRetryCounts, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.update({ id: id, endpointId: endpointId },
      { RestartPolicy: { Name: restartPolicy, MaximumRetryCount: maximumRetryCounts } }
    ).$promise;
  }

  service.createContainer = function(configuration, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();
    Container.create(configuration).$promise
    .then(function success(data) {
      deferred.resolve(data);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create container', err: err });
    });
    return deferred.promise;
  };

  service.createAndStartContainer = function(configuration, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();
    var containerID;
    service.createContainer(configuration)
    .then(function success(data) {
      containerID = data.Id;
      return service.startContainer(containerID);
    })
    .then(function success() {
      deferred.resolve({ Id: containerID });
    })
    .catch(function error(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  service.remove = function(container, removeVolumes, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    Container.remove({ id: container.Id, v: (removeVolumes) ? 1 : 0, force: true , endpointId: endpointId}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      }
      if (container.ResourceControl && container.ResourceControl.Type === 1) {
        return ResourceControlService.deleteResourceControl(container.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove container', err: err });
    });

    return deferred.promise;
  };

  service.createExec = function(execConfig, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    Container.exec({}, execConfig).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      } else {
        deferred.resolve(data);
      }
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.logs = function(id, stdout, stderr, timestamps, since, tail, stripHeaders, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    var parameters = {
      id: id,
      stdout: stdout || 0,
      stderr: stderr || 0,
      timestamps: timestamps || 0,
      since: since || 0,
      tail: tail || 'all'
    };

    Container.logs(parameters).$promise
    .then(function success(data) {
      var logs = LogHelper.formatLogs(data.logs, stripHeaders);
      deferred.resolve(logs);
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.containerStats = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    var deferred = $q.defer();

    Container.stats({ id: id, endpointId: endpointId }).$promise
    .then(function success(data) {
      var containerStats = new ContainerStatsViewModel(data);
      deferred.resolve(containerStats);
    })
    .catch(function error(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  service.containerTop = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.top({ id: id, endpointId: endpointId }).$promise;
  };

  service.inspect = function(id, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.inspect({ id: id, endpointId: endpointId }).$promise;
  };

  service.prune = function(filters, endpointId) {
    if (!endpointId) { endpointId = EndpointProvider.endpointID(); }
    return Container.prune({ filters: filters, endpointId: endpointId }).$promise;
  };

  return service;
}]);
