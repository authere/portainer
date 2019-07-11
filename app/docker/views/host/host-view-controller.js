import _ from 'lodash-es';
angular.module('portainer.docker').controller('HostViewController', [
  '$q', 'SystemService', 'Notifications', 'StateManager', 'AgentService', 'ContainerService', 'Authentication', 'EndpointProvider',
  function HostViewController($q, SystemService, Notifications, StateManager, AgentService, ContainerService, Authentication, EndpointProvider) {
    var ctrl = this;

    this.$onInit = initView;

    ctrl.state = {
      isAgent: false,
      isAdmin : false,
      offlineMode: false
    };

    this.engineDetails = {};
    this.hostDetails = {};
    this.devices = null;
    this.disks = null;

    function initView() {
      var applicationState = StateManager.getState();
      ctrl.state.isAgent = applicationState.endpoint.mode.agentProxy;
      ctrl.state.isAdmin = Authentication.isAdmin();
      var agentApiVersion = applicationState.endpoint.agentApiVersion;
      ctrl.state.agentApiVersion = agentApiVersion;
      ctrl.state.enableHostManagementFeatures = applicationState.application.enableHostManagementFeatures;

      var endpoints = EndpointProvider.endpoints();
      var jobQ = [];

      _.each(endpoints, (ep)=> {
        jobQ.push(SystemService.info(ep.Id));
      });
      
      $q.all(jobQ)
      .then(function success(data) {
        //ctrl.engineDetails = buildEngineDetails(data);
        ctrl.hostDetails = data.map(buildHostDetails);
        ctrl.state.offlineMode = EndpointProvider.offlineMode();
        // ctrl.jobs = data.jobs;

        if (ctrl.state.isAgent && agentApiVersion > 1) {
          return AgentService.hostInfo(data.info.Hostname).then(function onHostInfoLoad(agentHostInfo) {
            ctrl.devices = agentHostInfo.PCIDevices;
            ctrl.disks = agentHostInfo.PhysicalDisks;
          });
        }
      })
      .catch(function error(err) {
        Notifications.error(
          'Failure',
          err,
          'Unable to retrieve engine details'
        );
      });
    }
/*
    function buildEngineDetails(data) {
      var versionDetails = data.version;
      var info = data.info;
      return {
        releaseVersion: versionDetails.Version,
        apiVersion: versionDetails.ApiVersion,
        rootDirectory: info.DockerRootDir,
        storageDriver: info.Driver,
        loggingDriver: info.LoggingDriver,
        volumePlugins: info.Plugins.Volume,
        networkPlugins: info.Plugins.Network
      };
    }
    */

    function buildHostDetails(info) {
      return {
        os: {
          arch: info.Architecture,
          type: info.OSType,
          name: info.OperatingSystem
        },
        name: info.Name,
        kernelVersion: info.KernelVersion,
        totalCPU: info.NCPU,
        totalMemory: info.MemTotal
      };
    }
  }
]);
