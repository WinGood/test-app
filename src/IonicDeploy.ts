import { Injectable, NgZone } from '@angular/core';
import { Platform } from 'ionic-angular';

declare var IonicCordova;

@Injectable()
export class IonicDeploy {
  private _channel: string = 'Development';
  private isCordovaEnv: boolean = false;
  private pluginWasInitialized: boolean = false;

  constructor(private platform: Platform, private zone: NgZone) {
    this.isCordovaEnv = platform.is('cordova');
  }

  get channel(): string {
    return this._channel;
  }
  
  set channel(channel: string) {
    this.pluginWasInitialized = false;
    this._channel = channel;
  }
  
  init() {
    this.onlyIfCordovaEnv();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.init({channel: this._channel}, () => {
        this.pluginWasInitialized = true;
        resolve(true);
      }, err => reject(err));
    });
  }

  check() {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.check(result => resolve((result === 'true') ? true : false), err => reject(err));
    });
  }

  download(onProgress) {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.download(result => {
        const percent = (result === 'true' || result === 100) ? 100 : result;
        this.zone.run(() => onProgress(percent));
        if (percent === 100) resolve();
      }, err => {
        reject(err);
      });
    });
  }

  extract(onProgress) {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.extract(result => {
        const percent = (result === 'done') ? 100 : result;
        this.zone.run(() => onProgress(percent));
        if (percent === 100) resolve();
      }, err => {
        reject(err);
      });
    });
  }

  load() {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.redirect(() => resolve(true), err => reject(err));
    });
  }

  info() {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.info(result => resolve(result), err => reject(err));
    });
  }

  getVersions() {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.getVersions(result => resolve(result), err => reject(err));
    });
  }

  deleteVersion(uuid) {
    this.onlyIfPluginInitialized();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.deleteVersion(uuid, () => resolve(true), err => reject(err));
    });
  }

  private onlyIfCordovaEnv() {
    if (!this.isCordovaEnv) {
      console.error('IonicDeploy was not runned in cordova environment!');
      return;
    }
  }
  
  private onlyIfPluginInitialized() {
    if (!this.pluginWasInitialized) {
      console.error('IonicDeploy was not initialized, you should call init' +
        ' method!');
      return;
    }
  }
}