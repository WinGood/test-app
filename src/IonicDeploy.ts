import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';

declare var IonicCordova;

@Injectable()
export class IonicDeploy {
  private channel: string = 'Development';
  private isCordovaEnv: boolean = false;

  constructor(private platform: Platform) {
    this.isCordovaEnv = platform.is('cordova');
  }

  setChannel(channel: string) {
    this.runningOnlyInCordovaEnv();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.init({channel}, () => {
        this.channel = channel;
        resolve(true);
      }, err => reject(err));
    });
  }

  getChannel() {
    return this.channel;
  }

  check() {
    this.runningOnlyInCordovaEnv();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.check(result => resolve((result === 'true') ? true : false), err => reject(err));
    });
  }

  download(onProgress) {
    this.runningOnlyInCordovaEnv();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.download(percent => {
        onProgress(percent);
        if (percent === 100) resolve();
      }, err => {
        reject(err);
      });
    });
  }

  extract(onProgress) {
    this.runningOnlyInCordovaEnv();
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.extract(result => {
        const percent = (result === 'done') ? 100 : result;
        onProgress(percent);
        if (percent === 100) resolve();
      }, err => {
        reject(err);
      });
    });
  }

  load() {
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.redirect(() => resolve(true), err => reject(err));
    });
  }

  info() {
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.info(result => resolve(result), err => reject(err));
    });
  }

  getVersions() {
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.getVersions(result => resolve(result), err => reject(err));
    });
  }

  deleteVersion(uuid) {
    return new Promise((resolve, reject) => {
      IonicCordova.deploy.deleteVersion(uuid, () => resolve(true), err => reject(err));
    });
  }

  private runningOnlyInCordovaEnv() {
    if (!this.isCordovaEnv) {
      console.error('IonicDeploy was not runned in cordova environment!');
      return;
    }
  }
}