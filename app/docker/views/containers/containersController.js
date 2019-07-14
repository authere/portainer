import _ from 'lodash-es';
angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  $scope.offlineMode = false;

  function initView() {
    var endpoints = EndpointProvider.endpoints();
    //$scope.endpoints = endpoints;
    // $scope.containers = [];

    _.each(endpoints, (ep)=> {
      ContainerService.containers(1, null, ep.Id)
      .then(function success(data) {
        _.each(data, (v) => {
          v.Endpoint = ep;
          v.HostName = ep.Name;
          if (!v.IP) { v.IP = (ep && ep.PublicURL); }
          if ($scope.containers) {
            $scope.containers.push(v);
          }
        });
        if (!$scope.containers) { $scope.containers = data; }
        $scope.offlineMode = EndpointProvider.offlineMode();
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve containers');
        $scope.containers = [];
      });
    });
  }

  initView();
}]);
