import _ from 'lodash-es';
angular.module('portainer.docker')
.controller('ContainersController', ['$scope', 'ContainerService', 'Notifications', 'EndpointProvider',
function ($scope, ContainerService, Notifications, EndpointProvider) {

  $scope.offlineMode = false;

  function initView() {
    var endpoints = EndpointProvider.endpoints();
    $scope.endpoints = endpoints;
    $scope.containersList = [];

    _.each(endpoints, (ep, k)=> {
      ContainerService.containers(1, null, ep.Id)
      .then(function success(data) {
        data.endpoint = ep;
        _.each(data, (v) => {
          v.endpointId = ep.Id;
        });
        $scope.containersList[k] = data;
        $scope.offlineMode = EndpointProvider.offlineMode();
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve containers');
        $scope.containersList[k] = [];
      });
    });
  }

  initView();
}]);
