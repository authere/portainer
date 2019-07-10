angular.module('portainer.docker')
.controller('ContainerInspectController', ['$scope', '$transition$', 'Notifications', 'ContainerService', 'HttpRequestHelper',
function ($scope, $transition$, Notifications, ContainerService, HttpRequestHelper) {

  $scope.state = {
    DisplayTextView: false
  };
  $scope.containerInfo = {};

  function initView() {
    HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
    ContainerService.inspect($transition$.params().id, $transition$.params().endpointId)
    .then(function success(d) {
      $scope.containerInfo = d;
    })
    .catch(function error(e) {
      Notifications.error('Failure', e, 'Unable to inspect container');
    });
  }

  initView();
}]);
