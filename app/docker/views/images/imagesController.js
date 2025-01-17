import _ from 'lodash-es';

angular.module('portainer.docker')
.controller('ImagesController', ['$scope', '$state', 'ImageService', 'Notifications', 'ModalService', 'HttpRequestHelper', 'FileSaver', 'Blob', 'EndpointProvider',
function ($scope, $state, ImageService, Notifications, ModalService, HttpRequestHelper, FileSaver, Blob, EndpointProvider) {
  $scope.state = {
    actionInProgress: false,
    exportInProgress: false
  };

  $scope.formValues = {
    Image: '',
    Registry: '',
    NodeName: null
  };

  $scope.pullImage = function() {
    var image = $scope.formValues.Image;
    var registry = $scope.formValues.Registry;

    var nodeName = $scope.formValues.NodeName;
    HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);

    $scope.state.actionInProgress = true;
    ImageService.pullImage(image, registry, false)
    .then(function success() {
      Notifications.success('Image successfully pulled', image);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to pull image');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.confirmRemovalAction = function (selectedItems, force) {
    ModalService.confirmImageForceRemoval(function (confirmed) {
      if(!confirmed) { return; }
      $scope.removeAction(selectedItems, force);
    });
  };

  function isAuthorizedToDownload(selectedItems) {

    for (var i = 0; i < selectedItems.length; i++) {
      var image = selectedItems[i];

      var untagged = _.find(image.RepoTags, function (item) {
        return item.indexOf('<none>') > -1;
      });

      if (untagged) {
        Notifications.warning('', 'Cannot download a untagged image');
        return false;
      }
    }

    if (_.uniqBy(selectedItems, 'NodeName').length > 1) {
      Notifications.warning('', 'Cannot download images from different nodes at the same time');
       return false;
    }

    return true;
  }

  function exportImages(images) {
    HttpRequestHelper.setPortainerAgentTargetHeader(images[0].NodeName);
    $scope.state.exportInProgress = true;
    ImageService.downloadImages(images)
    .then(function success(data) {
      var downloadData = new Blob([data.file], { type: 'application/x-tar' });
      FileSaver.saveAs(downloadData, 'images.tar');
      Notifications.success('Image(s) successfully downloaded');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to download image(s)');
    })
    .finally(function final() {
      $scope.state.exportInProgress = false;
    });
  }

  $scope.downloadAction = function (selectedItems) {
    if (!isAuthorizedToDownload(selectedItems)) {
      return;
    }

    ModalService.confirmImageExport(function (confirmed) {
      if(!confirmed) { return; }
      exportImages(selectedItems);
    });
  };

  $scope.removeAction = function (selectedItems, force) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (image) {
      HttpRequestHelper.setPortainerAgentTargetHeader(image.NodeName);
      ImageService.deleteImage(image.Id, force)
      .then(function success() {
        Notifications.success('Image successfully removed', image.Id);
        var index = $scope.images.indexOf(image);
        $scope.images.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove image');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.offlineMode = false;

  function initView() {
    var endpoints = EndpointProvider.endpoints();
    $scope.endpoints = endpoints;
    $scope.imagesList = [];

    _.each(endpoints, (ep, k)=> {
      ImageService.images(true, ep.Id)
      .then(function success(data) {
        data.endpoint = ep;
        _.each(data, (v) => {
          v.endpointId = ep.Id;
        });
        $scope.imagesList[k] = data;
        $scope.offlineMode = EndpointProvider.offlineMode();
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve images');
        $scope.imagesList[k] = [];
      });
    });
  }

  initView();
}]);
